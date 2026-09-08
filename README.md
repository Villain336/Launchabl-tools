# Launchable

A marketing/design agency platform: a free, growing suite of marketing tools paired with a one-time-price, unlimited-requests agency plan (Design Joy-style business model).

- **Strategy & product plan:** [`docs/STRATEGY.md`](docs/STRATEGY.md) — positioning, differentiation, information architecture, tool-by-tool build notes, legal/risk notes, monetization, and phased roadmap.
- **Website / app scaffold:** [`web/`](web/) — Next.js (App Router) + TypeScript + Tailwind CSS implementation of the marketing site and the tools platform.

## Getting started

```bash
cd web
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## What's implemented

- Marketing pages: Home, Solutions, Pricing, About, Case Studies, Roadmap, Blog, Legal
- Tools hub (`/tools`) with search + outcome-based filtering across 5 clusters, 22 tools total

**Flagship tools (light, single-action):**
- Fully functional, client-side: Metadata Remover, Image Converter, QR Code Generator, Watermark Generator, Schema Markup Generator
- Working demo/beta with clear "production" architecture notes: Brand Creator (+ domain availability check), standalone Domain Availability search, AI Copywriter
- Architecture-ready stubs: Watermark Remover (ownership-attestation gated), File Converter (CSV/JSON live, heavier formats roadmapped), Domain Purchase, Hosting

**Heavy tools (multi-part audits, kits & reports — see `docs/STRATEGY.md` §11):**
- Website Audit Report, Landing Page Conversion Grader, Competitor Gap Report — share one server-side fetch + scoring engine (`src/lib/site-audit.ts`) against real, live URLs
- DNS & Email Deliverability Health Check — real SPF/DKIM/DMARC/MX lookups via Node's `dns` module
- Full Brand Identity Kit — generated logo mark, favicon, palette, and type pairing bundled as a downloadable zip
- Ad Creative Resizer — one image in, a zip of every major ad platform's creative size out, entirely client-side
- Content & Campaign Calendar Generator, Local SEO / Google Business Profile Optimizer, Sitemap & Robots.txt Generator
- White-Label Client Report Builder — composes findings from the other tools into one polished, brandable report/proposal

See `docs/STRATEGY.md` §5 and §11 for the reasoning behind what's fully built vs. stubbed, and what each stub needs to go live.
