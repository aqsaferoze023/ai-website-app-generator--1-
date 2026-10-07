import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import {
  AlertCircle, ArrowRight, Check, CheckCircle2, ChevronDown, Code2, Copy,
  CreditCard, Download, Eye, FileCode2, FileText, Folder, FolderOpen,
  Grid2X2, House, Image as ImageIcon, LayoutDashboard, LayoutTemplate,
  LoaderCircle, Menu, Monitor, Moon, PanelBottom, PanelLeft, PanelTop,
  Pencil, RefreshCw, Save, Settings2, ShoppingBag, Smartphone, Sparkles,
  Square, Sun, Table2, Tablet, Trash2, UserRound, X, ChartColumn,
  BriefcaseBusiness, type LucideIcon,
} from "lucide-react";
import LivePreview, { type Device } from "./components/LivePreview";
import { starterProject } from "./data/starterProject";
import { downloadProject, projectFiles } from "./lib/project";
import { createSampleImage } from "./lib/sampleImage";
import { defaultApiUrl, generateProject, getApiHealth } from "./services/generator";
import type { GeneratedProject, GeneratorOptions, ProjectFile } from "./types";

type View = "home" | "generator" | "projects" | "templates" | "components" | "settings";
type NavKey = View;
type CodeTab = "code" | "structure" | "dependencies";
type Toast = { message: string; kind: "success" | "error" };

const navItems: { label: string; key: NavKey; icon: LucideIcon }[] = [
  { label: "Home", key: "home", icon: House },
  { label: "AI Generator", key: "generator", icon: Sparkles },
  { label: "My Projects", key: "projects", icon: FolderOpen },
  { label: "Templates", key: "templates", icon: LayoutTemplate },
  { label: "Components", key: "components", icon: Grid2X2 },
  { label: "Settings", key: "settings", icon: Settings2 },
];

const components: { name: string; icon: LucideIcon; prompt: string }[] = [
  { name: "Navbar", icon: PanelTop, prompt: "Create a responsive navigation bar with a logo, links, mobile menu and a clear call to action." },
  { name: "Hero Section", icon: ImageIcon, prompt: "Create a striking responsive hero section with a strong headline, supporting copy, visual and calls to action." },
  { name: "Sidebar", icon: PanelLeft, prompt: "Create a clean app sidebar with navigation, active states and a collapsible mobile layout." },
  { name: "Dashboard", icon: LayoutDashboard, prompt: "Create a modern analytics dashboard with a sidebar, overview metrics, charts, recent activity and interactive controls." },
  { name: "Cards", icon: Square, prompt: "Create a reusable set of polished content cards with responsive layout and interactive hover states." },
  { name: "Pricing Section", icon: CreditCard, prompt: "Create a responsive pricing section with multiple plans, a billing toggle and clear feature comparisons." },
  { name: "Login / Signup", icon: UserRound, prompt: "Create an accessible login and signup experience with validation and responsive form layout." },
  { name: "Footer", icon: PanelBottom, prompt: "Create a useful multi-column footer with brand information, navigation and newsletter signup." },
  { name: "Tables", icon: Table2, prompt: "Create a responsive data table with search, sorting and clear row actions." },
  { name: "Charts", icon: ChartColumn, prompt: "Create a beautiful analytics chart section with accessible labels and simple interactive filters." },
  { name: "Product Section", icon: ShoppingBag, prompt: "Create an e-commerce product section with products, category filters and add-to-cart interaction." },
  { name: "Portfolio", icon: BriefcaseBusiness, prompt: "Create a portfolio projects section with visual project previews, categories and project details." },
];

const templates = [
  { title: "E-commerce Store", category: "Online shop", icon: ShoppingBag, style: "Modern", prompt: "Create a modern e-commerce website for a lifestyle brand with a bold hero, product categories, a featured product grid, shopping cart interaction and a responsive mobile menu." },
  { title: "SaaS Dashboard", category: "Web application", icon: LayoutDashboard, style: "Business", prompt: "Build a polished SaaS analytics dashboard with a sidebar, overview metrics, charts, recent activity, search and interactive date filters. Make it responsive." },
  { title: "Creative Portfolio", category: "Personal site", icon: BriefcaseBusiness, style: "Creative", prompt: "Create a distinctive designer portfolio with a strong introduction, project gallery, about section, contact form and tasteful animations." },
  { title: "Startup Landing Page", category: "Marketing site", icon: Sparkles, style: "Minimal", prompt: "Create a modern startup landing page with an impactful hero, product benefits, testimonials, pricing and a clear signup call to action." },
];

const loadingMessages = ["Understanding your idea", "Designing your interface", "Writing React components", "Polishing the final details"];

function readStoredProjects(): GeneratedProject[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem("createva.projects") || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.files?.length) as GeneratedProject[] : [];
  } catch { return []; }
}

function readCurrentProject(): GeneratedProject {
  try {
    const parsed = JSON.parse(localStorage.getItem("createva.current") || "null");
    return parsed?.files?.length ? parsed as GeneratedProject : starterProject;
  } catch { return starterProject; }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image. Please try another file."));
    reader.readAsDataURL(file);
  });
}

function BrandMark({ small = false }: { small?: boolean }) {
  return <svg className={small ? "brand-mark brand-mark--small" : "brand-mark"} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 3.5c1.4 9.2 4.2 12 13.5 13.5C24.2 18.4 21.4 21.2 20 30.5 18.6 21.2 15.8 18.4 6.5 17 15.8 15.5 18.6 12.7 20 3.5Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /><path d="M32.5 24c.5 3.3 1.5 4.3 4.8 4.8-3.3.5-4.3 1.5-4.8 4.8-.5-3.3-1.5-4.3-4.8-4.8 3.3-.5 4.3-1.5 4.8-4.8Z" fill="currentColor" /><circle cx="5" cy="29" r="2" fill="currentColor" /><circle cx="6" cy="7" r="1.6" fill="currentColor" /></svg>;
}

function PromoArtwork() {
  return <div className="promo-art" aria-hidden="true"><span className="promo-art-orb promo-art-orb--one" /><span className="promo-art-orb promo-art-orb--two" /><span className="promo-art-star"><BrandMark small /></span><div className="promo-art-window"><i /><i /><i /><b /><b /><b /></div><span className="promo-art-dot promo-art-dot--one" /><span className="promo-art-dot promo-art-dot--two" /></div>;
}

type TreeNode = { name: string; path: string; children: TreeNode[]; file?: ProjectFile };

function makeTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    let branch = root;
    const parts = file.path.split("/");
    parts.forEach((part, index) => {
      let node = branch.find((entry) => entry.name === part);
      if (!node) { node = { name: part, path: parts.slice(0, index + 1).join("/"), children: [] }; branch.push(node); }
      if (index === parts.length - 1) node.file = file;
      branch = node.children;
    });
  }
  const sort = (nodes: TreeNode[]) => { nodes.sort((a, b) => Number(Boolean(a.file)) - Number(Boolean(b.file)) || a.name.localeCompare(b.name)); nodes.forEach((node) => sort(node.children)); };
  sort(root);
  return root;
}

function FileTree({ files, selected, onSelect }: { files: ProjectFile[]; selected: string; onSelect: (path: string) => void }) {
  const renderNodes = (nodes: TreeNode[], depth = 0): ReactNode[] => nodes.map((node) => node.file ? <button key={node.path} className={`tree-row tree-row--file ${selected === node.path ? "is-selected" : ""}`} style={{ paddingLeft: 17 + depth * 20 }} onClick={() => onSelect(node.path)}>{node.name.endsWith(".css") ? <FileText size={15} /> : <FileCode2 size={15} />}<span>{node.name}</span></button> : <div key={node.path}><div className="tree-row tree-row--folder" style={{ paddingLeft: 17 + depth * 20 }}><Folder size={15} /><span>{node.name}</span></div>{renderNodes(node.children, depth + 1)}</div>);
  return <div className="file-tree">{renderNodes(makeTree(files))}</div>;
}

export default function App() {
  const [view, setView] = useState<View>("generator");
  const [activeNav, setActiveNav] = useState<NavKey>("generator");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("createva.theme") === "dark");
  const [prompt, setPrompt] = useState("");
  const [inputTab, setInputTab] = useState<"text" | "image">("text");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [style, setStyle] = useState("Modern");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [options, setOptions] = useState<GeneratorOptions>({ color: "", layout: "Auto", animations: true });
  const [kind, setKind] = useState<"website" | "component">("website");
  const [chosenComponent, setChosenComponent] = useState("");
  const [project, setProject] = useState<GeneratedProject>(readCurrentProject);
  const [savedProjects, setSavedProjects] = useState<GeneratedProject[]>(readStoredProjects);
  const [activeFile, setActiveFile] = useState("src/App.jsx");
  const [codeTab, setCodeTab] = useState<CodeTab>("code");
  const [device, setDevice] = useState<Device>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("createva.apiUrl") || defaultApiUrl());
  const [apiDraft, setApiDraft] = useState(apiUrl);
  const [health, setHealth] = useState<{ status: "idle" | "checking" | "connected" | "unconfigured" | "offline"; model?: string }>({ status: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const jsxExtensions = useMemo(() => [javascript({ jsx: true })], []);
  const cssExtensions = useMemo(() => [css()], []);

  useEffect(() => {
    if (!imageFile) { setImagePreview(""); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem("createva.projects", JSON.stringify(savedProjects.slice(0, 10)));
        localStorage.setItem("createva.current", JSON.stringify(project));
      } catch { /* Storage limits should not interrupt the workspace. */ }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [savedProjects, project]);

  useEffect(() => { localStorage.setItem("createva.theme", darkMode ? "dark" : "light"); }, [darkMode]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3500); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => { if (!generating) return; setLoadingStep(0); const timer = window.setInterval(() => setLoadingStep((step) => (step + 1) % loadingMessages.length), 3200); return () => window.clearInterval(timer); }, [generating]);

  const chosenFile = project.files.find((file) => file.path === activeFile) || project.files[0];
  const codeExtensions = chosenFile?.path.endsWith(".css") ? cssExtensions : jsxExtensions;

  function navigate(key: NavKey) {
    setMobileMenuOpen(false); setProfileOpen(false); setActiveNav(key);
    setView(key); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectFile(file: File | null) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Please upload a PNG, JPG, or WEBP image."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be smaller than 10 MB."); return; }
    setImageFile(file); setError(""); setInputTab("image");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) { selectFile(event.target.files?.[0] || null); event.target.value = ""; }
  function handleDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0] || null); }

  async function useSampleDesign() {
    try { selectFile(await createSampleImage()); setToast({ message: "Sample design attached. Add a prompt or generate it as-is.", kind: "success" }); }
    catch (sampleError) { setError(sampleError instanceof Error ? sampleError.message : "Could not load the sample design."); }
  }

  async function handleGenerate() {
    if (generating) { abortRef.current?.abort(); setGenerating(false); return; }
    if (!prompt.trim() && !imageFile) { setError("Describe what you want to build or upload a reference image first."); return; }
    setError(""); setGenerating(true);
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const image = imageFile ? { dataUrl: await readFileAsDataUrl(imageFile), name: imageFile.name } : undefined;
      if (controller.signal.aborted) return;
      const generated = await generateProject({ prompt: prompt.trim(), image, kind, component: chosenComponent, style, options }, apiUrl, controller.signal);
      setProject(generated);
      setSavedProjects((previous) => [generated, ...previous.filter((item) => item.id !== generated.id)].slice(0, 10));
      setActiveFile("src/App.jsx"); setCodeTab("code"); setRefreshKey((key) => key + 1);
      setToast({ message: "Your React project is ready to preview and edit.", kind: "success" });
    } catch (generationError) {
      if (generationError instanceof DOMException && generationError.name === "AbortError") return;
      setError(generationError instanceof Error ? generationError.message : "Generation failed. Please try again.");
    } finally { setGenerating(false); abortRef.current = null; }
  }

  function updateCode(value: string) {
    if (!chosenFile) return;
    const updated = { ...project, files: project.files.map((file) => file.path === chosenFile.path ? { ...file, content: value } : file) };
    setProject(updated); setSavedProjects((previous) => previous.map((item) => item.id === updated.id ? updated : item));
  }

  async function copyCode() {
    if (!chosenFile) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(chosenFile.content);
      } else {
        const helper = document.createElement("textarea");
        helper.value = chosenFile.content;
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        const copied = document.execCommand("copy");
        helper.remove();
        if (!copied) throw new Error("Copy was blocked");
      }
      setToast({ message: `${chosenFile.path.split("/").pop()} copied to clipboard.`, kind: "success" });
    } catch { setToast({ message: "Clipboard access was denied by your browser.", kind: "error" }); }
  }

  async function handleDownload(downloadTarget = project) {
    try { await downloadProject(downloadTarget); setToast({ message: "Complete React project downloaded as a ZIP.", kind: "success" }); }
    catch { setToast({ message: "Could not download the project. Please try again.", kind: "error" }); }
  }

  function saveCurrentProject() {
    const saved = project.id === starterProject.id ? { ...project, id: crypto.randomUUID(), title: `${project.title} Copy`, createdAt: Date.now() } : project;
    setProject(saved); setSavedProjects((previous) => [saved, ...previous.filter((item) => item.id !== saved.id)].slice(0, 10));
    setToast({ message: "Project saved in this browser.", kind: "success" });
  }

  function openProject(saved: GeneratedProject) {
    setProject(saved); setPrompt(saved.prompt || ""); setKind(saved.kind || "website"); setChosenComponent(saved.component || ""); setImageFile(null); setActiveFile("src/App.jsx"); setCodeTab("code"); navigate("generator");
    setToast({ message: `${saved.title} opened in the workspace.`, kind: "success" });
  }

  function selectComponent(item: (typeof components)[number]) {
    setKind("component"); setChosenComponent(item.name); setPrompt(item.prompt); setInputTab("text"); setError(""); navigate("generator");
    setToast({ message: `${item.name} prompt added. Customize it, then generate.`, kind: "success" });
  }

  function selectTemplate(template: (typeof templates)[number]) {
    setKind("website"); setChosenComponent(""); setPrompt(template.prompt); setStyle(template.style); setInputTab("text"); setError(""); navigate("generator");
    setToast({ message: `${template.title} brief loaded. Make it your own.`, kind: "success" });
  }

  function startFresh() { setProject(starterProject); setPrompt(""); setImageFile(null); setKind("website"); setChosenComponent(""); setActiveFile("src/App.jsx"); navigate("generator"); }

  function saveApiUrl() {
    try {
      const parsed = new URL(apiDraft.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      const next = parsed.href.replace(/\/$/, "");
      setApiUrl(next); setApiDraft(next); localStorage.setItem("createva.apiUrl", next); setHealth({ status: "idle" });
      setToast({ message: "API endpoint saved for this browser.", kind: "success" });
    } catch { setToast({ message: "Enter a valid http:// or https:// API URL.", kind: "error" }); }
  }

  async function testConnection() {
    setHealth({ status: "checking" });
    try { const result = await getApiHealth(apiDraft.trim()); setHealth({ status: result.configured ? "connected" : "unconfigured", model: result.model }); }
    catch { setHealth({ status: "offline" }); }
  }

  return <div className={`app-shell ${darkMode ? "is-dark" : ""}`}>
    <header className="topbar">
      <div className="topbar-brand"><button className="mobile-nav-trigger icon-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><Menu size={22} /></button><BrandMark /><span className="brand-name">Createva</span><span className="brand-ai">AI</span></div>
      <p className="topbar-tagline">Turn your ideas into beautiful websites &amp; apps</p>
      <div className="topbar-actions"><button className="icon-button theme-button" onClick={() => setDarkMode(!darkMode)} title={darkMode ? "Use light theme" : "Use dark theme"} aria-label={darkMode ? "Use light theme" : "Use dark theme"}>{darkMode ? <Moon size={20} /> : <Sun size={21} />}</button><div className="profile-wrap"><button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-label="Open workspace menu" aria-expanded={profileOpen}><UserRound size={20} fill="currentColor" strokeWidth={1.5} /></button>{profileOpen && <div className="profile-menu"><strong>Your workspace</strong><span>Projects are saved locally</span><button onClick={() => navigate("projects")}><FolderOpen size={16} /> My Projects</button><button onClick={() => navigate("settings")}><Settings2 size={16} /> API Settings</button></div>}</div></div>
    </header>

    {mobileMenuOpen && <button className="mobile-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" />}
    <div className="app-body">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar--open" : ""}`} aria-label="Main navigation">
        <div className="sidebar-mobile-head"><span>Menu</span><button className="icon-button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button></div>
        <nav className="sidebar-nav">{navItems.map((item) => <button key={item.key} className={`sidebar-link ${activeNav === item.key ? "is-active" : ""}`} onClick={() => navigate(item.key)}><item.icon size={21} strokeWidth={2} /><span>{item.label}</span></button>)}</nav>
        <div className="sidebar-promo"><PromoArtwork /><h2>Build Faster<br />With AI</h2><p>Generate complete websites, web apps and components from text or images.</p><button onClick={() => navigate("home")}>Learn More <ArrowRight size={13} /></button></div>
        <div className="sidebar-waves" aria-hidden="true" />
      </aside>

      <main className="main-content">
        {view === "generator" && <div className="workspace-content">
          <div className="workspace-grid">
            <section className="builder-column" aria-labelledby="generator-title">
              <div className="page-intro"><h1 id="generator-title">AI Website &amp; App Generator</h1><p>Describe your idea or upload an image, and let AI turn it into a complete website or app with clean, editable React code.</p></div>
              <div className="input-switch" role="tablist" aria-label="Creation method"><button role="tab" aria-selected={inputTab === "text"} className={inputTab === "text" ? "is-active" : ""} onClick={() => setInputTab("text")}><Pencil size={18} /> Text Prompt</button><button role="tab" aria-selected={inputTab === "image"} className={inputTab === "image" ? "is-active" : ""} onClick={() => { setInputTab("image"); fileInputRef.current?.focus(); }}><ImageIcon size={19} /> Image to Code</button></div>
              <div className="builder-panel">
                {kind === "component" && <div className="component-context"><span><Code2 size={14} /> Component mode: <strong>{chosenComponent}</strong></span><button onClick={() => { setKind("website"); setChosenComponent(""); }} aria-label="Switch to full website mode"><X size={15} /></button></div>}
                <div className="prompt-box"><label htmlFor="website-prompt">{kind === "component" ? "Describe your component..." : "Describe your website or app..."}</label><textarea id="website-prompt" value={prompt} maxLength={2000} onChange={(event) => { setPrompt(event.target.value); if (error) setError(""); }} placeholder="e.g. Create a modern e-commerce website with a hero section, product cards, shopping cart and responsive design." /><span className="character-count">{prompt.length}/2000</span></div>
                <div className="field-heading upload-heading"><label htmlFor="design-file">Upload Reference Image <span>(Optional)</span></label><button className="sample-link" onClick={useSampleDesign}><ImageIcon size={13} /> Sample Design</button></div>
                <input id="design-file" ref={fileInputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
                {imageFile && imagePreview ? <div className="uploaded-design"><img src={imagePreview} alt={`Uploaded design reference: ${imageFile.name}`} /><div className="uploaded-design-actions"><span title={imageFile.name}>{imageFile.name}</span><button onClick={() => fileInputRef.current?.click()}>Change</button><button onClick={() => setImageFile(null)} aria-label="Remove image"><Trash2 size={15} /></button></div></div> : <div className={`dropzone ${dragging ? "is-dragging" : ""} ${inputTab === "image" ? "is-emphasized" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInputRef.current?.click(); } }} aria-label="Upload or drop a design screenshot"><span className="dropzone-icon"><ImageIcon size={25} /></span><strong>Drag &amp; drop an image or <span>click to browse</span></strong><small>PNG, JPG, WEBP (Max 10MB)</small></div>}
                <div className="style-field"><div className="field-heading"><span>Choose Design Style <em>(Optional)</em></span></div><div className="style-options" role="group" aria-label="Choose design style">{["Modern", "Minimal", "Creative", "Business", "Portfolio"].map((item) => <button key={item} className={style === item ? "is-active" : ""} onClick={() => setStyle(item)}>{item}</button>)}</div></div>
                <div className={`advanced ${advancedOpen ? "is-open" : ""}`}><button className="advanced-trigger" onClick={() => setAdvancedOpen(!advancedOpen)} aria-expanded={advancedOpen}><span><Settings2 size={18} /> Advanced Options</span><ChevronDown size={16} /></button>{advancedOpen && <div className="advanced-body"><label>Accent color <div className="color-field"><input type="color" value={options.color || "#0C89B3"} onChange={(event) => setOptions({ ...options, color: event.target.value })} aria-label="Accent color" /><span>{options.color ? options.color.toUpperCase() : "Auto / reference"}</span>{options.color && <button onClick={() => setOptions({ ...options, color: "" })} title="Use reference colors" aria-label="Use reference colors"><X size={12} /></button>}</div></label><label>Layout <select value={options.layout} onChange={(event) => setOptions({ ...options, layout: event.target.value })}><option>Auto</option><option>Full width</option><option>Centered</option><option>Sidebar</option></select></label><label className="animation-option"><span>Include animations</span><input type="checkbox" checked={options.animations} onChange={(event) => setOptions({ ...options, animations: event.target.checked })} /></label></div>}</div>
                {error && <div className="form-error" role="alert"><AlertCircle size={17} /><span>{error}</span>{(error.includes("API") || error.includes("server")) && <button onClick={() => navigate("settings")}>Settings</button>}</div>}
                <button className={`generate-button ${generating ? "is-loading" : ""}`} onClick={handleGenerate}>{generating ? <><LoaderCircle size={19} className="spin" /> Cancel Generation</> : <><Sparkles size={19} fill="currentColor" /> Generate {kind === "component" ? "Component" : "Website / App"} <ArrowRight size={18} /></>}</button>
              </div>
            </section>

            <section className="output-panel" aria-label="Generated website workspace">
              <div className="preview-toolbar"><div className="section-title"><span className="title-icon"><Eye size={18} /></span><h2>Live Preview</h2>{project.id === starterProject.id ? <span className="sample-label">Example</span> : <button className="regenerate-link" onClick={handleGenerate} disabled={generating}><RefreshCw size={13} /> Regenerate</button>}</div><div className="preview-toolbar-actions"><div className="device-switch" role="group" aria-label="Preview screen size">{([{ label: "Desktop", key: "desktop", icon: Monitor }, { label: "Tablet", key: "tablet", icon: Tablet }, { label: "Mobile", key: "mobile", icon: Smartphone }] as const).map((item) => <button key={item.key} className={device === item.key ? "is-active" : ""} onClick={() => setDevice(item.key)} aria-pressed={device === item.key}><item.icon size={17} /><span>{item.label}</span></button>)}</div><button className="preview-refresh" onClick={() => setRefreshKey((key) => key + 1)} title="Reload preview" aria-label="Reload preview"><RefreshCw size={16} /></button></div></div>
              <LivePreview project={project} device={device} refreshKey={refreshKey} generating={generating} loadingLabel={loadingMessages[loadingStep]} />
              <div className="code-section"><div className="code-toolbar"><div className="code-tabs" role="tablist" aria-label="Project output"><button role="tab" aria-selected={codeTab === "code"} className={codeTab === "code" ? "is-active" : ""} onClick={() => setCodeTab("code")}>Generated Code</button><button role="tab" aria-selected={codeTab === "structure"} className={codeTab === "structure" ? "is-active" : ""} onClick={() => setCodeTab("structure")}>Project Structure</button><button role="tab" aria-selected={codeTab === "dependencies"} className={codeTab === "dependencies" ? "is-active" : ""} onClick={() => setCodeTab("dependencies")}>Dependencies</button></div><div className="code-actions"><button className="save-button" onClick={saveCurrentProject} title="Save project locally" aria-label="Save project locally"><Save size={16} /></button><button className="copy-button" onClick={copyCode} title="Copy selected source file"><Copy size={15} /> <span>Copy Code</span></button><button className="download-button" onClick={() => handleDownload()} title="Download complete React project" aria-label="Download Code"><Download size={15} /> <span>Download</span></button></div></div>
                {codeTab === "code" && <div className="code-window"><div className="code-filebar"><div className="file-select-wrap"><FileCode2 size={16} /><select value={chosenFile?.path || ""} onChange={(event) => setActiveFile(event.target.value)} aria-label="Select source file">{project.files.map((file) => <option key={file.path} value={file.path}>{file.path}</option>)}</select><ChevronDown size={13} /></div><span>{chosenFile?.path.endsWith(".css") ? "CSS" : "React JSX"}</span></div><CodeMirror value={chosenFile?.content || ""} height="310px" theme="dark" extensions={codeExtensions} onChange={updateCode} basicSetup={{ foldGutter: false, highlightActiveLine: false, highlightActiveLineGutter: false }} aria-label={`Edit ${chosenFile?.path || "source code"}`} /></div>}
                {codeTab === "structure" && <div className="info-window"><div className="info-window-head"><FolderOpen size={17} /><span>{project.title}</span><small>{projectFiles(project).length} files</small></div><FileTree files={projectFiles(project)} selected={activeFile} onSelect={(path) => { if (project.files.some((file) => file.path === path)) { setActiveFile(path); setCodeTab("code"); } else { setToast({ message: "This scaffold file is included in your downloaded ZIP.", kind: "success" }); } }} /></div>}
                {codeTab === "dependencies" && <div className="info-window dependencies-window"><div className="info-window-head"><Code2 size={17} /><span>Project dependencies</span></div><div className="dependency-row"><div><strong>React</strong><span>Component library and hooks</span></div><code>^19.0.0</code></div><div className="dependency-row"><div><strong>React DOM</strong><span>Browser renderer</span></div><code>^19.0.0</code></div><div className="dependency-row"><div><strong>Vite</strong><span>Fast development and production builds</span></div><code>^7.0.0</code></div><p className="dependency-note"><CheckCircle2 size={17} /> No unnecessary UI frameworks. The ZIP includes everything needed to run your project.</p></div>}
              </div>
            </section>
          </div>

          <section className="components-panel" aria-labelledby="components-title"><div className="components-intro"><h2 id="components-title">Generate Individual<br />Components</h2><p>Create specific sections or components for your project.</p><button onClick={() => navigate("components")}>Browse All Components <ArrowRight size={15} /></button></div><div className="component-grid">{components.map((item) => <button key={item.name} className="component-tile" onClick={() => selectComponent(item)}><span><item.icon size={20} strokeWidth={1.9} /></span><strong>{item.name}</strong></button>)}</div></section>
        </div>}

        {view === "home" && <div className="secondary-view home-view"><span className="eyebrow"><Sparkles size={15} /> THE CREATIVE WORKSPACE</span><h1>Bring your next idea<br />to life with Createva.</h1><p>Start with a sentence, a screenshot, or a single component. Createva turns it into editable React code you can preview and take with you.</p><button className="large-primary" onClick={startFresh}>Start creating <ArrowRight size={18} /></button><div className="home-divider" /><div className="home-steps"><div><strong>01</strong><h2>Describe it</h2><p>Tell us what you want to make, or drop in a design reference.</p></div><div><strong>02</strong><h2>See it live</h2><p>Preview your working interface across desktop, tablet and mobile.</p></div><div><strong>03</strong><h2>Make it yours</h2><p>Edit the code, save the project and download the complete source.</p></div></div></div>}

        {view === "projects" && <div className="secondary-view"><div className="view-header"><div><span className="eyebrow">YOUR WORKSPACE</span><h1>My Projects</h1><p>Pick up where you left off. Projects are saved in this browser.</p></div><button className="large-primary" onClick={startFresh}><span className="plus-icon">+</span> New project</button></div>{savedProjects.length ? <div className="project-list">{savedProjects.map((item) => <div className="project-row" key={item.id}><span className="project-row-icon"><Code2 size={23} /></span><div className="project-row-copy"><strong>{item.title}</strong><span>{item.description}</span><small>{new Date(item.createdAt).toLocaleDateString()} · {item.files.length} source files</small></div><div className="project-row-actions"><button onClick={() => openProject(item)}>Open <ArrowRight size={15} /></button><button onClick={() => handleDownload(item)} title="Download project" aria-label={`Download ${item.title}`}><Download size={17} /></button><button onClick={() => { setSavedProjects((previous) => previous.filter((saved) => saved.id !== item.id)); setToast({ message: "Project removed from this browser.", kind: "success" }); }} title="Delete project" aria-label={`Delete ${item.title}`}><Trash2 size={17} /></button></div></div>)}</div> : <div className="empty-projects"><FolderOpen size={35} /><h2>No saved projects yet</h2><p>Generate your first website or save the example project to see it here.</p><button onClick={startFresh}>Open AI Generator <ArrowRight size={16} /></button></div>}</div>}

        {view === "templates" && <div className="secondary-view"><div className="view-header"><div><span className="eyebrow">A HEAD START FOR YOUR IDEAS</span><h1>Start from a brief</h1><p>Choose a starting point, then customize the prompt to make it yours.</p></div></div><div className="template-list">{templates.map((template) => <button key={template.title} className="template-row" onClick={() => selectTemplate(template)}><span className="template-icon"><template.icon size={25} /></span><span className="template-copy"><small>{template.category}</small><strong>{template.title}</strong><span>{template.prompt}</span></span><ArrowRight size={19} /></button>)}</div></div>}

        {view === "components" && <div className="secondary-view"><div className="view-header"><div><span className="eyebrow">BUILD PIECE BY PIECE</span><h1>Component Library</h1><p>Choose a section to generate. You can refine the brief before sending it to AI.</p></div></div><div className="component-browser-list">{components.map((item) => <button key={item.name} className="component-browser-row" onClick={() => selectComponent(item)}><span className="template-icon"><item.icon size={23} /></span><span><strong>{item.name}</strong><small>{item.prompt}</small></span><ArrowRight size={18} /></button>)}</div></div>}

        {view === "settings" && <div className="secondary-view settings-view"><div className="view-header"><div><span className="eyebrow">YOUR WORKSPACE</span><h1>Settings</h1><p>Connect your AI backend and make the workspace yours.</p></div></div><div className="settings-section"><div className="settings-copy"><h2>AI API connection</h2><p>Generation runs on your backend. Your OpenAI API key stays on the server and is never stored in this browser.</p></div><div className="settings-form"><label htmlFor="api-url">Backend URL</label><div className="settings-url-row"><input id="api-url" value={apiDraft} onChange={(event) => setApiDraft(event.target.value)} placeholder="http://localhost:8787" /><button onClick={saveApiUrl}>Save URL</button></div><div className="connection-row"><button onClick={testConnection} disabled={health.status === "checking"}>{health.status === "checking" ? <LoaderCircle size={16} className="spin" /> : <RefreshCw size={16} />} Test connection</button>{health.status === "connected" && <span className="connection-ok"><CheckCircle2 size={16} /> Connected · {health.model}</span>}{health.status === "unconfigured" && <span className="connection-warn"><AlertCircle size={16} /> Server online, but OPENAI_API_KEY is missing</span>}{health.status === "offline" && <span className="connection-warn"><AlertCircle size={16} /> Could not reach the server</span>}</div><p className="settings-hint">For local use, add your key to <code>.env</code> and run <code>node server/index.mjs</code> alongside <code>npm run dev</code>.</p></div></div><div className="settings-section"><div className="settings-copy"><h2>Appearance</h2><p>Choose the look that feels right for your workspace.</p></div><div className="appearance-options"><button className={!darkMode ? "is-active" : ""} onClick={() => setDarkMode(false)}><Sun size={19} /> Light <span>{!darkMode && <Check size={16} />}</span></button><button className={darkMode ? "is-active" : ""} onClick={() => setDarkMode(true)}><Moon size={19} /> Dark <span>{darkMode && <Check size={16} />}</span></button></div></div></div>}
      </main>
    </div>
    {toast && <div className={`toast toast--${toast.kind}`} role="status">{toast.kind === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
  </div>;
}
