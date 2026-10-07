import { useEffect, useRef, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { buildPreview, type PreviewBuild } from "../lib/preview";
import type { GeneratedProject } from "../types";

export type Device = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<Device, number> = { desktop: 1200, tablet: 768, mobile: 390 };

type Props = {
  project: GeneratedProject;
  device: Device;
  refreshKey: number;
  generating: boolean;
  loadingLabel: string;
};

export default function LivePreview({ project, device, refreshKey, generating, loadingLabel }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastCompiledProject = useRef(project);
  const [stageSize, setStageSize] = useState({ width: 600, height: 390 });
  const [preview, setPreview] = useState<PreviewBuild>(() => buildPreview(project));
  const [updating, setUpdating] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (lastCompiledProject.current === project) return;
    lastCompiledProject.current = project;
    setUpdating(true);
    const timeout = window.setTimeout(() => {
      setPreview(buildPreview(project));
      setRuntimeError("");
      setUpdating(false);
    }, 420);
    return () => window.clearTimeout(timeout);
  }, [project]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === "createva-preview-error") setRuntimeError(String(event.data.message || "Preview error"));
      if (event.data?.type === "createva-preview-ready") setRuntimeError("");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const width = deviceWidths[device];
  const padding = device === "desktop" ? 14 : 36;
  const maxScale = device === "mobile" ? 0.88 : device === "tablet" ? 0.79 : 1;
  const scale = Math.max(0.2, Math.min(maxScale, (stageSize.width - padding) / width));
  const frameWidth = width * scale;
  const frameHeight = Math.max(200, stageSize.height - 14);

  return (
    <div ref={stageRef} className={`preview-stage preview-stage--${device}`}>
      {preview.error ? (
        <div className="preview-compile-error" role="alert">
          <AlertTriangle size={22} />
          <strong>Preview couldn't compile</strong>
          <p>{preview.error}</p>
          <span>Edit the code below to fix the error.</span>
        </div>
      ) : (
        <div className={`preview-device preview-device--${device}`} style={{ width: frameWidth, height: frameHeight }}>
          <iframe
            key={`${refreshKey}-${preview.html.length}-${project.id}`}
            ref={iframeRef}
            title="Live generated website preview"
            sandbox="allow-scripts"
            srcDoc={preview.html}
            style={{ width, height: frameHeight / scale, transform: `scale(${scale})` }}
          />
        </div>
      )}
      {(generating || updating) && (
        <div className="preview-loading" aria-live="polite">
          <div className="loading-mark"><LoaderCircle size={26} className="spin" /></div>
          <strong>{generating ? loadingLabel : "Updating preview"}</strong>
          <span>{generating ? "Turning your ideas into a working interface" : "Applying your code changes"}</span>
        </div>
      )}
      {runtimeError && !generating && !preview.error && <span className="preview-error-badge">Preview error: {runtimeError}</span>}
    </div>
  );
}