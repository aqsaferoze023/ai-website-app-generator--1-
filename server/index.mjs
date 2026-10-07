import "dotenv/config";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { transform } from "esbuild";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const port = Number(process.env.PORT || 8787);

// Hugging Face settings
const model =
  process.env.HF_MODEL ||
  "Qwen/Qwen3-Coder-30B-A3B-Instruct:fastest";

const maxBodyBytes = 15 * 1024 * 1024;
const generationWindows = new Map();

const responseSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },

    description: {
      type: "string",
    },

    files: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: {
            type: "string",
          },

          content: {
            type: "string",
          },
        },

        required: ["path", "content"],
        additionalProperties: false,
      },
    },
  },

  required: ["title", "description", "files"],
  additionalProperties: false,
};

const systemInstruction = `
You are an expert frontend engineer and visual designer.

Your task is to generate a COMPLETE, WORKING React + Vite project.

Return ONLY valid JSON.
Do NOT return markdown.
Do NOT return explanations.
Do NOT wrap the JSON in code fences.

The JSON must have exactly this general structure:

{
  "title": "Project title",
  "description": "Short description",
  "files": [
    {
      "path": "src/App.jsx",
      "content": "..."
    },
    {
      "path": "src/styles/global.css",
      "content": "..."
    }
  ]
}

IMPORTANT:

1. Build a distinctive, polished website or app.

2. The generated project must actually work.

3. The generated project must be React + Vite.

4. Use JavaScript/JSX and normal CSS.

5. Do NOT use TypeScript.

6. Do NOT use Tailwind.

7. Do NOT use Bootstrap.

8. Do NOT use external UI libraries.

9. The only external JavaScript dependency allowed inside generated UI files is React.

10. Do not import icon packages.

11. Do not import chart packages.

12. Do not import local images.

13. Use inline SVG, CSS shapes, gradients, or remote image URLs when visual imagery is appropriate.

14. Include:

   src/App.jsx

   src/styles/global.css

15. App.jsx MUST default-export the App component.

16. App.jsx MUST import:

   ./styles/global.css

17. Create reusable components in:

   src/components/

18. If multiple pages are useful, create:

   src/pages/

19. Every imported component MUST exist in the files array.

20. All imports must use relative paths.

21. Use functional React components.

22. Use React hooks when interaction requires them.

23. Implement buttons and interactions with real React state and handlers.

24. Do not create fake buttons that do nothing.

25. Make the interface responsive.

26. Include desktop, tablet, and mobile layouts.

27. Use semantic HTML.

28. Include accessible labels where appropriate.

29. Include hover and focus states.

30. Use realistic content rather than lorem ipsum.

31. Do not use TODO comments.

32. Do not use placeholder comments.

33. Do not use ellipses such as "...".

34. Do not create missing imports.

35. Do not create package.json.

36. Do not create index.html.

37. Do not create src/main.jsx.

38. The downloader will provide the Vite scaffold.

39. Keep the generated project reasonably concise.

40. Return complete source code inside the JSON content strings.

VISUAL QUALITY:

Create a professional, modern interface.

Pay attention to:

- spacing
- typography
- visual hierarchy
- colors
- cards
- buttons
- navigation
- forms
- responsive behavior
- alignment
- shadows
- borders
- hover effects
- empty states
- realistic data

If a reference image is provided, use it as the primary visual specification.

Analyze:

- layout
- spacing
- colors
- typography
- navigation
- cards
- buttons
- sections
- imagery
- visual hierarchy

Then recreate the visual style as closely as possible while making the interface responsive.

Do not simply describe the reference image.

Generate actual React code.
`;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, value, origin) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",

    ...(origin
      ? {
          "Access-Control-Allow-Origin": origin,
          Vary: "Origin",
        }
      : {}),

    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(value));
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin;

  if (!origin) {
    return true;
  }

  if (origin === "null") {
    return false;
  }

  const sameHost = [
    `http://${req.headers.host}`,
    `https://${req.headers.host}`,
  ];

  const development = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ];

  const configured = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [...sameHost, ...development, ...configured].includes(origin);
}

function enforceRateLimit(req) {
  const address = req.socket.remoteAddress || "unknown";

  const now = Date.now();

  const record = generationWindows.get(address);

  if (!record || now - record.started > 60 * 60 * 1000) {
    generationWindows.set(address, {
      started: now,
      count: 1,
    });

    return;
  }

  if (record.count >= 30) {
    throw new HttpError(
      429,
      "This server has reached its hourly generation limit. Please try again later."
    );
  }

  record.count += 1;
}

async function readJson(req) {
  let size = 0;

  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;

    if (size > maxBodyBytes) {
      throw new HttpError(
        413,
        "Request is too large. Use an image smaller than 10 MB."
      );
    }

    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Invalid JSON request.");
  }
}

function validateInput(body) {
  const prompt =
    typeof body?.prompt === "string"
      ? body.prompt.trim()
      : "";

  const image = body?.image;

  if (!prompt && !image) {
    throw new HttpError(
      400,
      "Add a prompt or upload a reference image first."
    );
  }

  if (prompt.length > 4000) {
    throw new HttpError(
      400,
      "Prompt must be 4,000 characters or fewer."
    );
  }

  let imageUrl;

  if (image) {
    if (
      typeof image.dataUrl !== "string" ||
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
        image.dataUrl
      )
    ) {
      throw new HttpError(
        400,
        "Upload a valid PNG, JPG, or WEBP image."
      );
    }

    const match =
      image.dataUrl.match(
        /^data:image\/(png|jpeg|webp);base64,(.+)$/
      ) || [];

    const mime = match[1];
    const encoded = match[2];

    const bytes = Buffer.from(encoded, "base64");

    if (bytes.length > 10 * 1024 * 1024) {
      throw new HttpError(
        413,
        "Image must be smaller than 10 MB."
      );
    }

    const validSignature =
      mime === "png"
        ? bytes
            .subarray(0, 8)
            .equals(
              Buffer.from([
                137,
                80,
                78,
                71,
                13,
                10,
                26,
                10,
              ])
            )
        : mime === "jpeg"
          ? bytes[0] === 255 &&
            bytes[1] === 216 &&
            bytes[2] === 255
          : bytes.toString("ascii", 0, 4) === "RIFF" &&
            bytes.toString("ascii", 8, 12) === "WEBP";

    if (!validSignature) {
      throw new HttpError(
        400,
        "The uploaded file does not match its PNG, JPG, or WEBP type."
      );
    }

    imageUrl = image.dataUrl;
  }

  const kind =
    body.kind === "component"
      ? "component"
      : "website";

  const component =
    typeof body.component === "string"
      ? body.component.slice(0, 80)
      : "";

  const style =
    typeof body.style === "string"
      ? body.style.slice(0, 40)
      : "Modern";

  const options =
    body.options &&
    typeof body.options === "object"
      ? body.options
      : {};

  const brief = [
    `Build type: ${
      kind === "component"
        ? `an individual ${
            component || "UI"
          } component, shown in a complete demo page`
        : "a complete website or app"
    }.`,
    `User request: ${
      prompt ||
      "Recreate the attached screenshot as a functioning React interface."
    }.`,
    `Preferred visual style: ${style}.`,
    `Preferred accent color: ${String(
      options.color ||
        "choose from the brief or reference"
    ).slice(0, 40)}.`,
    `Preferred layout: ${String(
      options.layout ||
        "choose from the brief or reference"
    ).slice(0, 40)}.`,
    `Animations: ${
      options.animations === false
        ? "subtle or none"
        : "tasteful where appropriate"
    }.`,
    imageUrl
      ? "A reference screenshot is attached. Analyze it visually and follow it closely."
      : "No reference image is attached.",
  ].join("\n");

  return {
    brief,
    imageUrl,
    prompt,
    kind,
    component,
  };
}

function resolveImport(from, request, paths) {
  const base = path.posix.normalize(
    path.posix.join(
      path.posix.dirname(from),
      request
    )
  );

  return [
    base,
    `${base}.jsx`,
    `${base}.js`,
    `${base}.css`,
    `${base}/index.jsx`,
  ].some((candidate) =>
    paths.has(candidate)
  );
}

async function validateProject(project) {
  if (
    !project ||
    typeof project.title !== "string" ||
    !Array.isArray(project.files)
  ) {
    throw new Error(
      "The model did not return a structured project."
    );
  }

  if (
    project.files.length < 2 ||
    project.files.length > 32
  ) {
    throw new Error(
      "Return between 2 and 32 complete source files."
    );
  }

  const paths = new Set();

  for (const file of project.files) {
    if (
      typeof file?.path !== "string" ||
      typeof file?.content !== "string"
    ) {
      throw new Error(
        "Every file needs a path and content."
      );
    }

    if (
      !/^src\/[A-Za-z0-9_/-]+\.(jsx|js|css)$/.test(
        file.path
      ) ||
      file.path.includes("..")
    ) {
      throw new Error(
        `Unsupported file path: ${file.path}`
      );
    }

    if (paths.has(file.path)) {
      throw new Error(
        `Duplicate file: ${file.path}`
      );
    }

    if (!file.content.trim()) {
      throw new Error(
        `Empty file: ${file.path}`
      );
    }

    if (file.content.length > 120000) {
      throw new Error(
        `File is too large: ${file.path}`
      );
    }

    paths.add(file.path);
  }

  if (!paths.has("src/App.jsx")) {
    throw new Error(
      "Include src/App.jsx."
    );
  }

  if (!paths.has("src/styles/global.css")) {
    throw new Error(
      "Include src/styles/global.css."
    );
  }

  for (const file of project.files) {
    try {
      await transform(file.content, {
        loader: file.path.endsWith(".css")
          ? "css"
          : "jsx",

        sourcefile: file.path,

        logLevel: "silent",
      });
    } catch (error) {
      throw new Error(
        `Syntax error in ${file.path}: ${
          error.errors?.[0]?.text ||
          error.message
        }`
      );
    }

    if (file.path.endsWith(".css")) {
      continue;
    }

    const imports =
      file.content.matchAll(
        /(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g
      );

    for (const match of imports) {
      const requested = match[1];

      if (
        requested === "react" ||
        (
          file.path === "src/main.jsx" &&
          requested === "react-dom/client"
        )
      ) {
        continue;
      }

      if (
        requested.startsWith(".") &&
        resolveImport(
          file.path,
          requested,
          paths
        )
      ) {
        continue;
      }

      throw new Error(
        `Unresolved or unsupported import '${requested}' in ${file.path}.`
      );
    }
  }

  const appSource =
    project.files.find(
      (file) =>
        file.path === "src/App.jsx"
    ).content;

  if (!/export\s+default\s+/.test(appSource)) {
    throw new Error(
      "src/App.jsx must default-export the App component."
    );
  }

  if (
    !/['"]\.\/styles\/global\.css['"]/.test(
      appSource
    )
  ) {
    throw new Error(
      "src/App.jsx must import './styles/global.css' so the downloaded site is styled."
    );
  }

  return project;
}

function cleanModelOutput(text) {
  let cleaned = String(text || "").trim();

  // Remove markdown code fences if the model accidentally adds them.
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Remove accidental text before JSON.
  const firstBrace = cleaned.indexOf("{");

  if (firstBrace > 0) {
    cleaned = cleaned.slice(firstBrace);
  }

  // Remove accidental text after the final JSON object.
  const lastBrace = cleaned.lastIndexOf("}");

  if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.slice(0, lastBrace + 1);
  }

  return cleaned.trim();
}

async function callModel(
  input,
  repairNote = ""
) {
  if (!process.env.HF_TOKEN) {
    throw new HttpError(
      503,
      "Hugging Face is not configured. Add HF_TOKEN to your .env file."
    );
  }

  const userPrompt = `
${input.brief}

${repairNote
  ? `
IMPORTANT:
The previous generated project failed validation.

Fix this exact problem:

${repairNote}
`
  : ""}

Return ONLY the JSON object.

Do not use markdown code fences.

Do not explain anything.

Make sure every source file is complete and valid.

The generated React application must be visually polished and functional.
`;

  const messageContent = [
    {
      type: "text",
      text: `${systemInstruction}\n\n${userPrompt}`,
    },
  ];

  /*
   * Hugging Face supports OpenAI-compatible chat completions.
   *
   * For text-only generation we send normal text.
   *
   * For image generation we also send the reference image.
   */
  if (input.imageUrl) {
    messageContent.push({
      type: "image_url",
      image_url: {
        url: input.imageUrl,
      },
    });
  }

  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model,

        messages: [
          {
            role: "user",
            content: messageContent,
          },
        ],

        temperature: 0.2,

        max_tokens: 16000,

        stream: false,
      }),

      signal: AbortSignal.timeout(
        180000
      ),
    }
  );

  const data =
    await response.json().catch(
      () => ({})
    );

  if (!response.ok) {
    let message =
      data?.error?.message ||
      data?.error ||
      "Hugging Face could not complete this request.";

    if (response.status === 401) {
      message =
        "The Hugging Face token was rejected. Check HF_TOKEN and make sure it has permission to use Inference Providers.";
    }

    if (response.status === 403) {
      message =
        "Hugging Face denied the request. Check your token permissions and Inference Providers access.";
    }

    if (response.status === 429) {
      message =
        "Hugging Face rate limit or quota was reached. Please try again later or select another available model/provider.";
    }

    if (response.status === 402) {
      message =
        "Hugging Face requires available Inference Providers credits for this request.";
    }

    throw new HttpError(
      response.status >= 500
        ? 502
        : response.status,
      String(message)
    );
  }

  const text =
    data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error(
      "Hugging Face returned no project source."
    );
  }

  const cleaned =
    cleanModelOutput(text);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(
      "Invalid JSON returned by Hugging Face:"
    );

    console.error(cleaned.slice(0, 5000));

    throw new Error(
      "Hugging Face returned invalid project JSON. Please try again."
    );
  }
}

async function generate(input) {
  let repairNote = "";

  for (
    let attempt = 0;
    attempt < 2;
    attempt += 1
  ) {
    const project =
      await callModel(
        input,
        repairNote
      );

    try {
      await validateProject(
        project
      );

      return {
        ...project,

        id: randomUUID(),

        createdAt: Date.now(),

        prompt: input.prompt,

        kind: input.kind,

        component: input.component,
      };
    } catch (error) {
      repairNote =
        error.message;
    }
  }

  throw new Error(
    `The generated source could not be validated: ${repairNote}`
  );
}

createServer(
  async (req, res) => {
    const pathname =
      new URL(
        req.url || "/",
        `http://${
          req.headers.host ||
          "localhost"
        }`
      ).pathname;

    if (!isAllowedOrigin(req)) {
      return sendJson(
        res,
        403,
        {
          error:
            "This origin is not allowed to use the AI API.",
        }
      );
    }

    const origin =
      req.headers.origin;

    if (req.method === "OPTIONS") {
      return sendJson(
        res,
        204,
        {},
        origin
      );
    }

    // Health check
    if (
      req.method === "GET" &&
      pathname === "/api/health"
    ) {
      return sendJson(
        res,
        200,
        {
          ok: true,

          configured:
            Boolean(
              process.env.HF_TOKEN
            ),

          model,

          provider:
            "Hugging Face Inference Providers",
        },
        origin
      );
    }

    // Generate website/app
    if (
      req.method === "POST" &&
      pathname === "/api/generate"
    ) {
      try {
        if (!process.env.HF_TOKEN) {
          throw new HttpError(
            503,
            "Hugging Face is not configured. Add HF_TOKEN to your .env file and restart the API server."
          );
        }

        const body =
          await readJson(req);

        const input =
          validateInput(body);

        enforceRateLimit(req);

        const project =
          await generate(input);

        return sendJson(
          res,
          200,
          {
            project,
          },
          origin
        );
      } catch (error) {
        console.error(
          "Generation error:",
          error
        );

        return sendJson(
          res,
          error.status || 502,
          {
            error:
              error.message ||
              "Generation failed. Please try again.",
          },
          origin
        );
      }
    }

    // Serve built frontend
    const indexPath =
      path.join(
        root,
        "dist",
        "index.html"
      );

    if (
      req.method === "GET" &&
      !pathname.startsWith("/api/") &&
      existsSync(indexPath)
    ) {
      res.writeHead(
        200,
        {
          "Content-Type":
            "text/html; charset=utf-8",
        }
      );

      return res.end(
        await readFile(indexPath)
      );
    }

    return sendJson(
      res,
      404,
      {
        error:
          "Not found. Run npm run dev for the frontend, or npm run build to serve it here.",
      },
      origin
    );
  }
).listen(
  port,
  "0.0.0.0",
  () => {
    console.log(
      `Createva API listening at http://localhost:${port}`
    );

    console.log(
      `Hugging Face model: ${model}`
    );

    console.log(
      `Hugging Face configured: ${Boolean(
        process.env.HF_TOKEN
      )}`
    );
  }
);