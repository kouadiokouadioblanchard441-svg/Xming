---
name: Vestas Platform Setup
description: Key decisions, branding, colors, assets, and DB quirks for this investment platform rebranded as Vestas.
---

## Brand Identity
- **Name**: Vestas (leader mondial de l'énergie éolienne)
- **Primary color**: `#003366` (Vestas navy blue), darker variant `#002244`
- **CSS HSL primary**: `210 100% 20%` (light mode), `210 100% 40%` (dark mode)
- **Theme-color meta**: `#003366`
- **Logo**: `attached_assets/vestas-logo_1783210030332.png` (horizontal)
- **Favicon**: `attached_assets/vestas-favicon_1783210030432.png` (square) → copied to `client/public/favicon.png`
- **@assets alias** resolves to `attached_assets/` (configured in vite.config.ts)

## Hero Images
- Wind turbine images in `attached_assets/`: `vestas_112v_closeup_1783210181172.jpg`, `vestas_112v_closeup_(1)_1783210181118.jpg`, `vestas_112v_closeup_(2)_1783210180090.jpg`

## Known DB Issues (pre-existing, unrelated to branding)
- Supabase schema not migrated; seed errors for missing tables (users, deposits, user_products, user_stakings) appear in logs but don't crash the server. Server continues on port 5000.

## Countries
- Defaults to TD (Tchad) and NE (Niger)

**Why:** Platform was rebranded from Intel to Vestas; all Intel/Jollibee references removed from user-visible UI. Telegram fallback links use `vestasgroup` placeholder.

## Note (2026-07-13)
A later re-import of this same codebase showed branding as "SpolarPV" (solar energy theme), not Vestas — the fresh import's checked-in code did not have the Vestas branding above. Branding may vary per import/fork; always check current code (client/index.html, logo assets) rather than assuming this memory's branding still applies.
