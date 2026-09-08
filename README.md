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
- Tools hub (`/tools`) with search + outcome-based filtering
- Fully functional, client-side tools: Metadata Remover, Image Converter, QR Code Generator, Watermark Generator, Schema Markup Generator
- Working demo/beta tools with clear "production" architecture notes: Brand Creator (+ domain availability check), standalone Domain Availability search, AI Copywriter
- Architecture-ready stubs for the remaining flagship tools: Watermark Remover (ownership-attestation gated), File Converter (CSV/JSON live, heavier formats roadmapped), Domain Purchase, Hosting

See `docs/STRATEGY.md` §5 for the reasoning behind what's fully built vs. stubbed, and what each stub needs to go live.
