import * as Babel from "@babel/standalone";
import preactUmd from "../../node_modules/preact/dist/preact.umd.js?raw";
import hooksUmd from "../../node_modules/preact/hooks/dist/hooks.umd.js?raw";
import compatUmd from "../../node_modules/preact/compat/dist/compat.umd.js?raw";
import type { GeneratedProject } from "../types";

export type PreviewBuild = { html: string; error: string | null };

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function safeScript(source: string) {
  return source.replace(/<\/script/gi, "<\\/script");
}

export function buildPreview(project: GeneratedProject): PreviewBuild {
  const compiled: Record<string, string> = {};
  try {
    for (const file of project.files) {
      if (!/\.jsx?$/.test(file.path)) continue;
      compiled[file.path] = Babel.transform(file.content, {
        filename: file.path,
        presets: [["react", { runtime: "classic" }]],
        plugins: ["transform-modules-commonjs"],
      }).code || "";
    }
  } catch (error) {
    return { html: "", error: error instanceof Error ? error.message : "Could not compile this React code." };
  }

  if (!compiled["src/App.jsx"]) return { html: "", error: "src/App.jsx is missing from this project." };
  const css = project.files.filter((file) => file.path.endsWith(".css"))
    .map((file) => `/* ${file.path} */\n${file.content}`).join("\n\n").replace(/<\/style/gi, "<\\/style");

  // JSX is compiled in the parent, then executed only inside an opaque-origin iframe.
  const runtime = `
    (function () {
      var files = ${safeJson(compiled)};
      var cache = Object.create(null);
      function showError(error) {
        var message = error && error.message ? error.message : String(error);
        document.getElementById('root').innerHTML = '<div class="runtime-error"><strong>Preview could not render</strong><p></p></div>';
        document.querySelector('.runtime-error p').textContent = message;
        parent.postMessage({ type: 'createva-preview-error', message: message }, '*');
      }
      window.addEventListener('error', function (event) { showError(event.error || event.message); });
      window.addEventListener('unhandledrejection', function (event) { showError(event.reason); });
      function load(request, from) {
        if (request === 'react' || request === 'react/jsx-runtime') return window.preactCompat;
        if (/\\.css$/.test(request)) return {};
        if (request === 'react-dom/client') return { createRoot: function (node) { return { render: function (element) { window.preact.render(element, node); } }; } };
        if (request.charAt(0) !== '.') throw new Error('Unsupported import: ' + request + '. Use React and relative project files only.');
        var parts = from.split('/');
        parts.pop();
        request.split('/').forEach(function (part) {
          if (part === '..') parts.pop();
          else if (part && part !== '.') parts.push(part);
        });
        var base = parts.join('/');
        var choices = [base, base + '.jsx', base + '.js', base + '/index.jsx'];
        var found = choices.find(function (candidate) { return Object.prototype.hasOwnProperty.call(files, candidate); });
        if (!found) throw new Error('Cannot find ' + request + ' imported from ' + from);
        if (cache[found]) return cache[found].exports;
        var module = { exports: {} };
        cache[found] = module;
        var run = new Function('require', 'module', 'exports', 'React', files[found] + '\\n//# sourceURL=' + found);
        run(function (name) { return load(name, found); }, module, module.exports, window.preactCompat);
        return module.exports;
      }
      try {
        var module = { exports: {} };
        cache['src/App.jsx'] = module;
        var runApp = new Function('require', 'module', 'exports', 'React', files['src/App.jsx'] + '\\n//# sourceURL=src/App.jsx');
        runApp(function (name) { return load(name, 'src/App.jsx'); }, module, module.exports, window.preactCompat);
        var App = module.exports.default || module.exports.App;
        if (!App) throw new Error('src/App.jsx needs a default-exported App component.');
        window.preact.render(window.preact.h(App), document.getElementById('root'));
        parent.postMessage({ type: 'createva-preview-ready' }, '*');
      } catch (error) { showError(error); }
    })();`;

  return {
    error: null,
    html: `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>html,body{margin:0;min-height:100%;}body{background:#fff;font-family:Arial,sans-serif}.runtime-error{margin:28px;padding:22px;border:1px solid #f7c7c7;border-radius:12px;background:#fff7f6;color:#873a37;font:16px/1.5 Arial,sans-serif}.runtime-error strong{font-size:19px}.runtime-error p{overflow-wrap:anywhere}</style><style>${css}</style></head><body><div id="root"></div><script>${safeScript(preactUmd)}</script><script>${safeScript(hooksUmd)}</script><script>${safeScript(compatUmd)}</script><script>${safeScript(runtime)}</script></body></html>`,
  };
}