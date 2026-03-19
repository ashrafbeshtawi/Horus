# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Horus is an interactive 3D portfolio website where visitors explore a procedurally generated city as a third-person character, discovering project banners placed along streets. Built with Nuxt 3 + Three.js.

## Architecture

- **Nuxt/** — The entire application (Nuxt 3 + Vue 3 SPA).
  - `pages/index.vue` — Main entry: third-person exploration. Sets up Three.js scene, camera, lighting, manages character movement (WASD/arrows), camera orbit (right-click drag + scroll zoom), raycaster-based UV click detection on discovery panels, and GSAP intro animation.
  - `utils/3d.js` — All Three.js logic: procedural city generation (`createWorld`), character creation with walk animation (`createCharacter`, `animateCharacter`), canvas-texture discovery panels with UV-based URL click detection, wandering NPCs, animated banner crowds, collision system, terrain math.
  - `utils/helper.js` — Random number utilities.
  - `plugins/vuetify.ts` — Vuetify plugin setup.
  - `nuxt.config.ts` — Nuxt config with Vuetify, Tailwind, TresJS modules. Page title and favicon.
  - UI: Vuetify + Tailwind CSS + Nuxt UI. 3D: Three.js + GSAP.

## Development

```bash
cd Nuxt
npm install
npm run dev      # Dev server at http://localhost:3000
npm run build    # Production build
```

## Key Technical Details

- City is procedurally generated from pure Three.js geometry (no external 3D models except whale GLTF).
- Road layout: square ring at ±22 + cross through center. Buildings only in blocks between roads.
- Ground height: pure math function (`getGroundY`), zero raycasting at runtime.
- Collision: rotated AABB per building + island boundary check + wall-sliding.
- Third-person camera: character faces away from camera, left/right turns (not strafes), camera orbits behind.
- Discovery panels: canvas textures with title, text, image, clickable URL buttons (UV hit detection).
- Whale models loaded via GLTFLoader from `public/blue_whale/`.
- Walking NPCs follow sidewalk waypoint routes. Banner crowds animate excitedly.
