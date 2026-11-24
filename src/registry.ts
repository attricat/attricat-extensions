// Reads the repository's registry.json at build time. Attricat
// (crates/repository/src/extension_registry.rs) is the authority on the index
// format; this schema mirrors the parts the page shows.
import { z } from 'zod';
import raw from '../registry.json';

/** Registry index version Attricat reads. Older indexes are shown but flagged. */
export const SUPPORTED_REGISTRY_VERSION = 2;
export const REGISTRY_REPOSITORY = 'attricat/attricat-extensions';
export const GITHUB_ORIGIN = 'https://github.com';
export const GITHUB_RAW_ORIGIN = 'https://raw.githubusercontent.com';
/** Branch alias GitHub resolves to the repository's default branch. */
export const DEFAULT_BRANCH_REF = 'HEAD';

const versionSchema = z.object({
  version: z.string(),
  host_api: z.string(),
  sha256: z.string(),
});

const entrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().nullish(),
  repository: z.string(),
  versions: z.array(versionSchema).default([]),
});

const indexSchema = z.object({
  registry_version: z.number().int().positive(),
  extensions: z.array(entrySchema),
});

export type RegistryVersion = z.infer<typeof versionSchema>;

export interface Extension {
  id: string;
  /** Site-relative path of the extension's page. */
  path: string;
  name: string;
  description: string;
  repository: string;
  repositoryUrl: string;
  releasesUrl: string;
  iconUrl: string | null;
  /** Reviewed versions, newest first. */
  versions: RegistryVersion[];
}

// GitHub sources may be written as `github:owner/repo`, `owner/repo` or a URL.
const repositoryPath = (source: string) =>
  source
    .trim()
    .replace(/^github:/, '')
    .replace(/^https:\/\/github\.com\//, '')
    .replace(/^\/+|\/+$/g, '');

const iconUrl = (repository: string, icon: string | null | undefined) => {
  if (!icon) return null;
  if (icon.startsWith('https://')) return icon;
  return `${GITHUB_RAW_ORIGIN}/${repository}/${DEFAULT_BRANCH_REF}/${icon.replace(/^\/+/, '')}`;
};

const compareSemver = (a: string, b: string) => {
  const parts = (value: string) => value.replace(/^v/, '').split(/[.+-]/).map((part) => Number.parseInt(part, 10) || 0);
  const [left, right] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

export const extensionPath = (id: string) => `/${encodeURIComponent(id)}/`;

const index = indexSchema.parse(raw);

export const registryVersion = index.registry_version;

export const extensions: Extension[] = index.extensions
  .map((entry) => {
    const repository = repositoryPath(entry.repository);
    return {
      id: entry.id,
      path: extensionPath(entry.id),
      name: entry.name,
      description: entry.description,
      repository,
      repositoryUrl: `${GITHUB_ORIGIN}/${repository}`,
      releasesUrl: `${GITHUB_ORIGIN}/${repository}/releases`,
      iconUrl: iconUrl(repository, entry.icon),
      versions: [...entry.versions].sort((a, b) => compareSemver(b.version, a.version)),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
