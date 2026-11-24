# extensions.attricat.com

Static Astro + React site built from [`../registry.json`](../registry.json). It has an index at `/`
and one page per extension at `/<id>/`. Each extension page renders the extension's README, which
the build fetches from the repository's default branch on `raw.githubusercontent.com` and sanitizes.
If a README can't be fetched, the build logs a warning and still writes the page.

The build also writes `sitemap-index.xml`. Every page has a canonical URL, Open Graph tags and
JSON-LD. To publish a registry change, merge it and redeploy.

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
| Root directory | `site` |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Custom domain | `extensions.attricat.com` |

`.node-version` pins Node 22 for the build image. Set the `PNPM_VERSION` environment variable to
`11.25.0` (the `packageManager` version) so the build doesn't fall back to an older pnpm. Add `registry.json` to the build watch paths
so registry-only changes redeploy.
READMEs are only re-read on a build, so trigger a redeploy (or a scheduled deploy hook) when an
extension's README changes.
