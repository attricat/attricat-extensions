# Attricat extensions

The official Attricat extension registry. Every Attricat workspace reads [`registry.json`](registry.json)
from `main` and can install only the extensions and release versions it lists, each pinned to the
SHA-256 of its reviewed `.tar.zst` archive. See
[Publish](https://docs.attricat.com/extensions/build/#publish) for the entry format.

This repository also builds [extensions.attricat.com](https://extensions.attricat.com), which lists the
registry's extensions.

## Site

A static Astro + React site built from `registry.json`. It has an index at `/` and one page per
extension at `/<id>/`. Each extension page renders the extension's README, which the build fetches
from the repository's default branch on `raw.githubusercontent.com` and sanitizes. If a README
can't be fetched, the build logs a warning and still writes the page.

The build also writes `sitemap-index.xml`. Every page has a canonical URL, Open Graph tags and
JSON-LD.

```sh
pnpm install
pnpm dev        # http://localhost:4321, also on the LAN
pnpm build      # writes dist/
pnpm check      # astro check (TypeScript 6)
```

Styling comes from a snapshot of the [Attricat design repository](https://github.com/attricat/design);
see [`src/design/README.md`](src/design/README.md). Icons are Lucide, per `STYLE.md`.

## Cloudflare Pages

| Setting | Value |
|---|---|
| Root directory | `/` (repository root) |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| `PNPM_VERSION` environment variable | `11.25.0` |
| Custom domain | `extensions.attricat.com` |

`.node-version` pins Node 22 for the build image, and `PNPM_VERSION` matches `packageManager` in
`package.json` so the build doesn't fall back to an older pnpm. Every push to `main` redeploys,
registry-only changes included. READMEs are only re-read on a build, so trigger a redeploy (or a
scheduled deploy hook) when an extension's README changes.
