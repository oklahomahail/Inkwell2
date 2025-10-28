export interface BaseEntity {
  id: string;
  project_id: string;
  client_rev: number;
  client_hash?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  summary?: string;
  schema_version: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Chapter extends BaseEntity {
  index_in_project: number;
  title: string;
  body: string;
}

export interface Character extends BaseEntity {
  name: string;
  bio: string;
  traits: Record<string, unknown>;
}

export interface Note extends BaseEntity {
  kind: string;
  content: string;
  tags: string[];
}
