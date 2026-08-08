# Intervall v2

Local-first interval and strength training app — running, strength, and mobility.

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
npm run dev        # http://localhost:8080
npm run typecheck
npm run build
```

## Deploy

Production build targets Vercel (`nitro` preset). Set `DATABASE_URL` if you use a remote Postgres for auth; otherwise PGLite is used in-browser/server fallback.

## License

Private — akgolfsoftware
