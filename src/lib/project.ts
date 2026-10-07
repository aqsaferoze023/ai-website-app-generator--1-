import JSZip from "jszip";
import type { GeneratedProject, ProjectFile } from "../types";

export function projectFiles(project: GeneratedProject): ProjectFile[] {
  const name = project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-website";
  const scaffold: ProjectFile[] = [
    {
      path: "package.json",
      content: JSON.stringify({
        name,
        private: true,
        version: "1.0.0",
        type: "module",
        scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
        devDependencies: { vite: "^7.0.0", "@vitejs/plugin-react": "^5.0.0" },
      }, null, 2) + "\n",
    },
    {
      path: "index.html",
      content: `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${project.title.replace(/[<&>"]/g, "")}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n`,
    },
    {
      path: "vite.config.js",
      content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });\n`,
    },
    {
      path: "src/main.jsx",
      content: `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')).render(\n  <React.StrictMode><App /></React.StrictMode>\n);\n`,
    },
    {
      path: "README.md",
      content: `# ${project.title}\n\n${project.description}\n\n## Run locally\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nGenerated with Createva AI.\n`,
    },
  ];
  const generatedPaths = new Set(project.files.map((file) => file.path));
  return [...scaffold.filter((file) => !generatedPaths.has(file.path)), ...project.files];
}

export async function downloadProject(project: GeneratedProject) {
  const zip = new JSZip();
  for (const file of projectFiles(project)) zip.file(file.path, file.content);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "react-project"}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}