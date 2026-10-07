export type ProjectFile = {
  path: string;
  content: string;
};

export type GeneratedProject = {
  id: string;
  title: string;
  description: string;
  files: ProjectFile[];
  createdAt: number;
  prompt: string;
  kind: "website" | "component";
  component?: string;
};

export type GeneratorOptions = {
  color: string;
  layout: string;
  animations: boolean;
};

export type GenerateInput = {
  prompt: string;
  image?: { dataUrl: string; name: string };
  kind: "website" | "component";
  component?: string;
  style: string;
  options: GeneratorOptions;
};