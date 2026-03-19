<p align="center">
  <img src="Nuxt/public/favicon.svg" width="80" alt="Horus"/>
</p>

<h1 align="center">Horus</h1>

<p align="center">
  <strong>A portfolio you don't read — you explore.</strong>
</p>

<p align="center">
  <a href="https://nuxt.com"><img src="https://img.shields.io/badge/Nuxt_3-00DC82?style=flat&logo=nuxt.js&logoColor=white" alt="Nuxt 3"/></a>
  <a href="https://threejs.org"><img src="https://img.shields.io/badge/Three.js-000000?style=flat&logo=three.js&logoColor=white" alt="Three.js"/></a>
  <a href="https://vuejs.org"><img src="https://img.shields.io/badge/Vue_3-4FC08D?style=flat&logo=vue.js&logoColor=white" alt="Vue 3"/></a>
  <a href="https://gsap.com"><img src="https://img.shields.io/badge/GSAP-88CE02?style=flat&logo=greensock&logoColor=black" alt="GSAP"/></a>
</p>

---

## The Idea

What if your portfolio wasn't a page you scroll — but a **city you walk through**?

Horus drops visitors into a procedurally generated island city. You control a character in third person, stroll down streets, and discover project banners placed around town — each one showcasing a different skill area with live links to repos and demos.

Named after the ancient Egyptian god of the sky, Horus is about seeing the big picture — literally, from above, as the camera sweeps down into the city when you arrive.

## What You'll Find Inside

```
     ┌──────────────────────────┐
     │     Certifications       │  ← North
     │                          │
 AI &│                          │Web3 &
Smart├──── Cross Roads ─────────┤Blockchain
Sys. │         ★ You            │  ← East
     │        Start             │
     │         Here             │
     │     Creative Web         │  ← South
     └──────────────────────────┘
              Square Ring Road
```

**5 discovery banners** scattered across the city:

| Banner | What's Inside |
|--------|--------------|
| **Creative Web** | [Horus](https://github.com/ashrafbeshtawi/Horus), [WinXp](https://github.com/ashrafbeshtawi/WinXp), [Mocking-Bird](https://github.com/ashrafbeshtawi/Mocking-Bird) |
| **AI & Smart Systems** | [Context Paging](https://github.com/ashrafbeshtawi/context-paging), [Auto-Trader](https://github.com/ashrafbeshtawi/Auto-Trader) |
| **Web3 & Mobile** | [Landlord](https://github.com/ashrafbeshtawi/Landlord), [Casually](https://github.com/ashrafbeshtawi/Casually) |
| **Certifications** | Symfony 7 Fundamentals, Cosmic Coding, Claude Code in Action |
| **About Me** | GitHub, LinkedIn |

## The City

Everything is built from code — no imported 3D models (except the whales).

- **Island** — circular floating landmass with cliff edges and water below
- **Roads** — square ring + cross intersection with lane markings and sidewalks
- **Buildings** — houses with pitched roofs, shops with awnings and glass storefronts
- **Landmarks** — windmill with spinning blades, stone tower with battlements
- **Life** — walking NPCs on sidewalk routes, animated crowds chatting at banners, whales gliding through the sky
- **Details** — lamp posts, benches, traffic lights, trees lining every street, a fountain in the town square

## How It Works

| Layer | Tech | What It Does |
|-------|------|-------------|
| Rendering | Three.js | All 3D geometry, materials, lighting, camera |
| Framework | Nuxt 3 + Vue 3 | SPA shell, component lifecycle, HMR |
| Animation | GSAP | Intro camera sweep, smooth transitions |
| Terrain | Pure math | `sin`/`cos` ground height — zero raycasting |
| Collision | Rotated AABB | Buildings register footprints, character slides along walls |
| Panels | Canvas textures | Title, text, image, clickable URL buttons via UV hit detection |
| Characters | Procedural meshes | Box-based stylized bodies with pivot-joint walk animation |

## Getting Started

```bash
cd Nuxt
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Start your Adventure**, and walk around.

**Controls:**

| Key | Action |
|-----|--------|
| `W` / `↑` | Walk forward |
| `S` / `↓` | Walk backward |
| `A` `D` / `←` `→` | Turn |
| Right-click drag | Free look |
| Scroll | Zoom in/out |
| Left-click | Open banner links |

## Building for Production

```bash
cd Nuxt
npm run build
npm run preview   # preview the production build locally
```

## Project Structure

```
Horus/
├── Nuxt/
│   ├── pages/index.vue      # Main scene, controls, game loop
│   ├── utils/3d.js           # City generation, characters, panels, NPCs
│   ├── utils/helper.js       # Random number utilities
│   ├── public/
│   │   ├── blue_whale/       # Whale GLTF model
│   │   ├── img/              # Banner images
│   │   ├── music/            # Background music
│   │   └── favicon.svg       # 3D "A" favicon
│   └── nuxt.config.ts        # Nuxt config with Vuetify, Tailwind, meta
├── CLAUDE.md                  # AI coding context
└── README.md
```

## Why "Horus"?

In Egyptian mythology, Horus is the falcon-headed god of the sky — the one who sees everything from above. The intro camera does exactly that: it starts high in the sky and swoops down to meet you at street level.

Plus, the Eye of Horus symbolizes protection and vision. This portfolio is meant to give visitors a clear, memorable view of what I build.

---

<p align="center">
  Built with code, caffeine, and a bit of madness by <a href="https://github.com/ashrafbeshtawi">Ashraf Beshtawi</a>
</p>
