export interface UserGuide {
  sections: Section[];
  version: string;
  lastUpdated: Date;
  language: string;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  subsections: Subsection[];
  images: Image[];
  examples: Example[];
}

export interface Subsection {
  id: string;
  title: string;
  content: string;
  examples: Example[];
}

export interface Image {
  id: string;
  url: string;
  altText: string;
  caption: string;
}

export interface Example {
  id: string;
  title: string;
  description: string;
  code?: string;
  images?: Image[];
}

export interface ApiDocumentation {
  endpoints: Endpoint[];
  models: Model[];
  errors: Error[];
  version: string;
  lastUpdated: Date;
}

export interface Endpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  parameters: Parameter[];
  requestBody: RequestBody;
  responses: Response[];
  examples: Example[];
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: any;
}

export interface RequestBody {
  schema: Schema;
  examples: Example[];
}

export interface Schema {
  type: string;
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

export interface SchemaProperty {
  type: string;
  description: string;
  format?: string;
  example?: any;
}

export interface Response {
  status: number;
  description: string;
  schema: Schema;
  examples: Example[];
}

export interface Model {
  name: string;
  description: string;
  properties: Record<string, ModelProperty>;
  examples: Example[];
}

export interface ModelProperty {
  type: string;
  description: string;
  format?: string;
  example?: any;
}

export interface Error {
  code: string;
  description: string;
  status: number;
  example: Example;
}

export interface TroubleshootingGuide {
  sections: TroubleshootingSection[];
  version: string;
  lastUpdated: Date;
}

export interface TroubleshootingSection {
  id: string;
  title: string;
  issues: Issue[];
  examples: Example[];
}

export interface Issue {
  id: string;
  title: string;
  symptoms: string[];
  causes: string[];
  solutions: Solution[];
  prevention: string[];
}

export interface Solution {
  id: string;
  description: string;
  steps: string[];
  images?: Image[];
  warnings?: string[];
}
