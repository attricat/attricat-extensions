// Fetches an extension's README from GitHub at build time and renders it to
// sanitized HTML. READMEs are third-party content: everything marked emits is
// sanitized, and only Shiki's own output (which escapes the code) is spliced in
// afterwards.
import GithubSlugger from 'github-slugger';
import { Marked, type Tokens } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { codeToHtml } from 'shiki';
import { GITHUB_ORIGIN, GITHUB_RAW_ORIGIN, DEFAULT_BRANCH_REF, type Extension } from './registry';

const README_FILE = 'README.md';
const README_TIMEOUT_MS = 15_000;
const MAX_README_BYTES = 256 * 1024; // Same bound Attricat applies.
const CODE_THEMES = { light: 'github-light', dark: 'github-dark' } as const;
const PLAIN_LANGUAGE = 'text';
const CODE_PLACEHOLDER = 'data-readme-code';

export interface Readme {
  html: string;
  /** Plain text of the first paragraph, for descriptions. */
  summary: string | null;
  sourceUrl: string;
}

const isAbsolute = (url: string) => /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');

/** Resolves a README-relative link to the file on GitHub, or an image to its raw bytes. */
const resolveUrl = (repository: string, url: string, raw: boolean) => {
  if (!url || url.startsWith('#') || isAbsolute(url)) return url;
  const path = new URL(url, 'https://readme.invalid/').pathname.replace(/^\/+/, '');
  return raw
    ? `${GITHUB_RAW_ORIGIN}/${repository}/${DEFAULT_BRANCH_REF}/${path}`
    : `${GITHUB_ORIGIN}/${repository}/blob/${DEFAULT_BRANCH_REF}/${path}`;
};

const plainText = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();

async function fetchMarkdown(extension: Extension): Promise<string | null> {
  const url = `${GITHUB_RAW_ORIGIN}/${extension.repository}/${DEFAULT_BRANCH_REF}/${README_FILE}`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(README_TIMEOUT_MS) });
    if (!response.ok) {
      console.warn(`README for ${extension.id}: ${url} returned ${response.status}`);
      return null;
    }
    const text = await response.text();
    if (new TextEncoder().encode(text).length > MAX_README_BYTES) {
      console.warn(`README for ${extension.id} exceeds ${MAX_README_BYTES} bytes; skipped`);
      return null;
    }
    return text;
  } catch (error) {
    console.warn(`README for ${extension.id}: ${url} failed (${String(error)})`);
    return null;
  }
}

const cache = new Map<string, Promise<Readme | null>>();

export function loadReadme(extension: Extension): Promise<Readme | null> {
  let readme = cache.get(extension.id);
  if (!readme) {
    readme = fetchMarkdown(extension).then((markdown) => (markdown ? renderReadme(extension, markdown) : null));
    cache.set(extension.id, readme);
  }
  return readme;
}

async function renderReadme(extension: Extension, markdown: string): Promise<Readme> {
  const slugger = new GithubSlugger();
  const codeBlocks: Tokens.Code[] = [];
  let droppedTitle = false;

  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      // The page already shows the extension name as its h1, so drop a leading README title
      // and keep every other heading at h2 or below.
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        if (depth === 1 && !droppedTitle) {
          droppedTitle = true;
          return '';
        }
        const level = Math.min(Math.max(depth, 2), 6);
        return `<h${level} id="${slugger.slug(plainText(html))}">${html}</h${level}>\n`;
      },
      code(token) {
        codeBlocks.push(token);
        return `<pre ${CODE_PLACEHOLDER}="${codeBlocks.length - 1}"></pre>\n`;
      },
    },
  });

  const rendered = await marked.parse(markdown);
  const clean = sanitizeHtml(rendered, {
    allowedTags: [
      'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote', 'pre', 'code', 'kbd',
      'strong', 'em', 'del', 's', 'sub', 'sup', 'a', 'img', 'ul', 'ol', 'li', 'input',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'details', 'summary', 'picture', 'source',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      source: ['srcset', 'media', 'type'],
      input: ['type', 'checked', 'disabled'],
      th: ['align'],
      td: ['align'],
      ol: ['start'],
      pre: [CODE_PLACEHOLDER],
      'h2': ['id'], 'h3': ['id'], 'h4': ['id'], 'h5': ['id'], 'h6': ['id'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https'], source: ['https'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = resolveUrl(extension.repository, attribs.href ?? '', false);
        const external = isAbsolute(href);
        return { tagName, attribs: { ...attribs, href, ...(external ? { rel: 'noopener noreferrer' } : {}) } };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, src: resolveUrl(extension.repository, attribs.src ?? '', true), loading: 'lazy' },
      }),
      source: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          srcset: (attribs.srcset ?? '')
            .split(',')
            .map((candidate) => {
              const [url, ...descriptor] = candidate.trim().split(/\s+/);
              return [resolveUrl(extension.repository, url ?? '', true), ...descriptor].join(' ');
            })
            .join(', '),
        },
      }),
      // Task-list checkboxes are display only.
      input: (tagName, attribs) => ({ tagName, attribs: { ...attribs, disabled: '' } }),
    },
    exclusiveFilter: (frame) => frame.tag === 'input' && frame.attribs.type !== 'checkbox',
  });

  const highlighted = await Promise.all(
    codeBlocks.map(async ({ text, lang }) => {
      const language = (lang ?? '').trim().split(/\s+/)[0] || PLAIN_LANGUAGE;
      try {
        return await codeToHtml(text, { lang: language, themes: CODE_THEMES, defaultColor: false });
      } catch {
        return codeToHtml(text, { lang: PLAIN_LANGUAGE, themes: CODE_THEMES, defaultColor: false });
      }
    }),
  );
  const html = clean.replace(
    new RegExp(`<pre ${CODE_PLACEHOLDER}="(\\d+)"></pre>`, 'g'),
    (_, index: string) => highlighted[Number(index)] ?? '',
  );

  const firstParagraph = /<p>([\s\S]*?)<\/p>/.exec(clean)?.[1];
  return {
    html,
    summary: firstParagraph ? plainText(firstParagraph) : null,
    sourceUrl: `${GITHUB_ORIGIN}/${extension.repository}/blob/${DEFAULT_BRANCH_REF}/${README_FILE}`,
  };
}
