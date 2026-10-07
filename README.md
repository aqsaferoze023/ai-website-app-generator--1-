# Createva AI

A React workspace for turning prompts and reference screenshots into editable React projects. The UI includes an isolated live preview, source editor, responsive device views, local project history, component prompts, and ZIP export.

## Run locally

Use Node.js 20 or newer.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY` to your server-side OpenAI API key. You can also change `OPENAI_MODEL` (default: `gpt-4.1`).
3. Start the API server with `node server/index.mjs` in one terminal.
4. Start the frontend with `npm run dev` in another terminal.
5. Open the Vite URL shown in your terminal (usually `http://localhost:5173`).

For a single production server, run `npm run build` and then `node server/index.mjs`. The server serves `dist/index.html` and the API at `http://localhost:8787` by default.

For a frontend hosted separately, set `VITE_API_BASE_URL` to the public URL of your backend when building, or change it under Settings in the app. Set `CORS_ORIGIN` on the backend to the frontend's origin in production. Never put `OPENAI_API_KEY` in a `VITE_` variable or in frontend code.

The example server includes origin checks and a small per-IP rate limit. Add authentication, monitoring, and a persistent rate limiter before exposing a billed AI endpoint publicly.

## How generation works

The browser sends the prompt, options, and optional PNG/JPG/WEBP screenshot to `POST /api/generate`. The backend calls OpenAI's Responses API with image input and a strict JSON project schema, validates the returned JSX/CSS and local imports, then returns the generated files. JSX is compiled in the browser and runs in a sandboxed, opaque-origin iframe for live preview. Download creates a complete Vite/React project ZIP including the generated source and project scaffold.

The example project shown on first load is a working editable example, not the output of a generation request. Actual AI generation requires a configured backend key. Projects are saved in this browser's local storage; reference images remain only in the current session. There is no account or cloud synchronization.