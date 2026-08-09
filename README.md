# Iron Mile

Local-first training app for **strength**, **running intervals**, and **mobility**.

**Tagline:** Styrke, intervaller og bevegelighet

## Brand

- **Name:** Iron Mile  
- **Palette:** iron charcoal primary, stone ground, copper strength accent  
- **Mark:** weight plates + mile marker (see `src/components/brand/IronMileMark.tsx`)

## Features

- **Running intervals** with Olympiatoppen heart-rate zones, speed targets, and timer
- **Strength programs** with blueprints (PPL, full body A/B, 5×5, home), exercise library, weekly packs, volume estimates, RPE, and progressive overload
- **Mobility** templates
- Session runner with rest timers, set logging, and history
- Settings for max HR, weight step, default rest, and sound
- Local persistence (Zustand + localStorage); optional Better Auth for accounts

## Stack

- React 19 + TypeScript
- TanStack Start / Router / Vite
- Tailwind CSS v4
- Zustand (persist)
- Better Auth + PGLite (optional auth)

## Develop

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Deploy

Production build targets Vercel (`nitro` preset).

## License

Private — akgolfsoftware
