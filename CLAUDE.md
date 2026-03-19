# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Horus is a personal portfolio website featuring an interactive 3D environment. It uses a Nuxt.js frontend with Three.js for 3D rendering and a Symfony PHP backend API, all orchestrated via Docker Compose.

## Architecture

- **Nuxt/** — Frontend (Nuxt 3 + Vue 3). Single-page app with a 3D scene as the main UI.
  - `pages/index.vue` — Main entry: third-person exploration of a 3D book-island. Sets up Three.js scene, camera, lighting, loads GLTF models (town + animated whales), manages character movement (WASD/arrows), camera orbit (right-click drag + scroll zoom), raycaster-based UV click detection on discovery panels, and GSAP intro animation.
  - `utils/3d.js` — All Three.js helpers: renderer init, GLTF model loading (`loadModell`), character creation (`createCharacter`), canvas-texture discovery panels (`createDiscoveryPanel` with UV-based URL click detection), intro camera animation (`playIntroAnimation`), music loading. Terrain mesh collection via `onTerrainLoaded` callback for ground-snapping raycasts.
  - `utils/helper.js` — Random number utilities.
  - `plugins/vuetify.ts` — Vuetify plugin setup.
  - UI frameworks: Vuetify + Tailwind CSS + Nuxt UI. 3D: Three.js + GSAP.
- **Symfony/** — Backend API (Symfony 7.1, PHP 8.2+). Currently minimal with a single `MenuController` (`/menu` endpoint). Uses attribute-based routing.
- **docker-compose.yml** — Services: `nuxtjs` (:3000), `symfony` (:8080), `postgres` (:1010→5432), `mailcatcher` (:1080/:1025). All on `horus` bridge network.

## Development Commands

### Bootstrap (first time)
```bash
./bin/build    # Copies .env files, starts Docker, installs Symfony deps
```

### Docker
```bash
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose logs -f nuxtjs     # Follow frontend logs
docker compose logs -f symfony    # Follow backend logs
```

### Frontend (Nuxt)
```bash
docker exec nuxtjs npm run dev       # Dev server (already runs on container start)
docker exec nuxtjs npm run build     # Production build
docker exec nuxtjs npm install       # Install dependencies
```

### Backend (Symfony)
```bash
docker exec symfony composer install          # Install dependencies
docker exec symfony bin/console cache:clear   # Clear cache
docker exec symfony bin/console <command>     # Run any Symfony console command
```

## Key Technical Details

- 3D models are GLTF files in `Nuxt/public/` (town scene + blue whale). The whale model is loaded 10 times with randomized positions/scales.
- Third-person camera system: character mesh on the island, camera orbits behind. WASD/arrows move character (camera-relative), right-click drag rotates camera, scroll zooms. Movement is constrained to terrain via downward raycasting — character can't walk off the island.
- Discovery panels are canvas-texture billboards placed at fixed locations on the island. Each has a title, description, image, and clickable URL buttons. URL clicks use UV-coordinate hit detection on the panel plane mesh.
- Camera intro uses GSAP to zoom from overhead down to third-person position.
- Terrain meshes are collected after GLTF load via `onTerrainLoaded` callback, used for ground-snapping raycasts on both the character and panel placement.
- Environment config: copy `.env-example` to `.env` at root and `Symfony/.env-example` to `Symfony/.env`.
- The Symfony backend runs via PHP's built-in server (`php -S`), not Apache/Nginx.
