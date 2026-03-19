<template>
  <div v-if="!animationStarted" id="overlay">
    <v-btn size="x-large" color="primary" @click="startAnimation">Start your Adventure</v-btn>
  </div>
  <div id="controls-hint" v-if="controlsEnabled && !isMobile">
    <p>W / Up &mdash; Forward</p>
    <p>S / Down &mdash; Backward</p>
    <p>A/D / Left/Right &mdash; Turn</p>
    <p>Right Drag &mdash; Free Look</p>
    <p>Scroll &mdash; Zoom</p>
  </div>
  <!-- Mobile joystick -->
  <div id="joystick-zone" v-if="controlsEnabled && isMobile"
    @touchstart.prevent="onJoystickStart"
    @touchmove.prevent="onJoystickMove"
    @touchend.prevent="onJoystickEnd">
    <div id="joystick-base">
      <div id="joystick-knob" :style="joystickKnobStyle"></div>
    </div>
  </div>
  <section id="container" class="w-full h-screen relative" v-if="isWebGL2Available"></section>
  <UAlert v-else icon="i-heroicons-command-line" color="rose" variant="solid"
    title="Error:" description="This website uses WebGL2 but your browser does not support it" />
</template>

<style scoped>
#overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex; justify-content: center; align-items: center; z-index: 9999;
}
#controls-hint {
  position: fixed; bottom: 14px; left: 14px;
  background: rgba(0,0,0,0.35); color: rgba(255,255,255,0.8);
  padding: 8px 12px; border-radius: 8px; z-index: 100;
  text-align: left; font: 11px Arial; pointer-events: none;
  backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.08);
}
#controls-hint p { margin: 2px 0; white-space: nowrap; }
#joystick-zone {
  position: fixed; bottom: 20px; left: 20px; width: 140px; height: 140px;
  z-index: 200; touch-action: none;
}
#joystick-base {
  width: 120px; height: 120px; border-radius: 50%;
  background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3);
  position: absolute; top: 10px; left: 10px;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(3px);
}
#joystick-knob {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,0.5); border: 2px solid rgba(255,255,255,0.7);
  position: absolute; transition: none;
}
</style>

<script setup>
</script>

<script>
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import g from '../utils/3d.js';
import helper from '../utils/helper.js';
import { markRaw } from 'vue';

const ISLAND_CENTER = { x: 0, z: 0 };

export default {
  data() {
    return {
      isWebGL2Available: true,
      animationStarted: false,
      showControlsHint: true,
      soundObject: null,
      mixers: [],
      whales: [],
      camera: null,
      scene: null,
      renderer: null,
      clock: new THREE.Clock(),
      character: null,
      wanderingNPCs: [],
      worldObjs: null,

      cameraAngleX: Math.PI,
      cameraAngleY: 0.4,
      cameraDistance: 10,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,

      keys: {},
      characterSpeed: 0.22,
      turnSpeed: 0.04,

      raycaster: null,
      mouse: null,
      clickableObjects: [],

      introPlaying: false,
      controlsEnabled: false,

      // Mobile
      isMobile: false,
      joystickActive: false,
      joystickX: 0,  // -1 to 1
      joystickY: 0,  // -1 to 1
      joystickBaseCenter: { x: 0, y: 0 },
    }
  },

  beforeUnmount() {
    for (const e of ['keydown','keyup','mousedown','mouseup','mousemove','click','wheel','resize','contextmenu','touchstart','touchmove','touchend'])
      window.removeEventListener(e, this['_h_' + e]);
  },

  mounted() {
    this.camera = g.getCamera();
    this.scene = markRaw(new THREE.Scene());
    this.renderer = markRaw(g.initRenderer(this.animate, 'container'));
    this.isWebGL2Available = WebGL.isWebGL2Available();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this._fwd = new THREE.Vector3();
    this._mv = new THREE.Vector3();
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const H = {
      keydown: e => { this.keys[e.code] = true; },
      keyup: e => { this.keys[e.code] = false; },
      mousedown: e => { if (e.button === 2) { this.isDragging = true; this.lastMouseX = e.clientX; this.lastMouseY = e.clientY; } },
      mouseup: e => { if (e.button === 2) this.isDragging = false; },
      mousemove: e => {
        if (this.isDragging && this.controlsEnabled) {
          this.cameraAngleX -= (e.clientX - this.lastMouseX) * 0.005;
          this.cameraAngleY = Math.max(0.1, Math.min(1.3, this.cameraAngleY + (e.clientY - this.lastMouseY) * 0.005));
          this.lastMouseX = e.clientX; this.lastMouseY = e.clientY;
        }
      },
      click: e => { if (e.button === 0) this.handleClick(e); },
      wheel: e => { if (this.controlsEnabled) this.cameraDistance = Math.max(4, Math.min(25, this.cameraDistance + e.deltaY * 0.01)); },
      resize: () => {
        if (this.camera && this.renderer) {
          this.camera.aspect = window.innerWidth / window.innerHeight;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
      },
      contextmenu: e => e.preventDefault(),
      // Mobile: touch on right half of screen = camera look
      touchstart: e => {
        if (!this.controlsEnabled) return;
        const t = e.touches[e.touches.length - 1];
        if (t.clientX > window.innerWidth * 0.4) {
          this._cameraTouchId = t.identifier;
          this._cameraTouchX = t.clientX;
          this._cameraTouchY = t.clientY;
        }
      },
      touchmove: e => {
        if (this._cameraTouchId == null) return;
        for (const t of e.touches) {
          if (t.identifier === this._cameraTouchId) {
            this.cameraAngleX -= (t.clientX - this._cameraTouchX) * 0.004;
            this.cameraAngleY = Math.max(0.1, Math.min(1.3, this.cameraAngleY + (t.clientY - this._cameraTouchY) * 0.004));
            this._cameraTouchX = t.clientX;
            this._cameraTouchY = t.clientY;
          }
        }
      },
      touchend: e => {
        for (const t of e.changedTouches) {
          if (t.identifier === this._cameraTouchId) this._cameraTouchId = null;
        }
      },
    };
    for (const [e, fn] of Object.entries(H)) { this['_h_' + e] = fn; window.addEventListener(e, fn); }

    // Audio
    const listener = new THREE.AudioListener();
    this.camera.add(listener);
    this.soundObject = g.loadMusic(listener, '/music/background-music.mp3');

    // Scene lighting
    this.scene.background = new THREE.Color('#87CEEB');
    this.scene.fog = new THREE.Fog(0x87CEEB, 40, 90);
    this.scene.add(new THREE.HemisphereLight(0xffffee, 0x446644, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(20, 30, 10); this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.5);
    fill.position.set(-10, 10, -10); this.scene.add(fill);

    // Build the custom world (instant — pure geometry, no model loading)
    this.worldObjs = markRaw(g.createWorld(this.scene));

    // Character at island center
    const startY = g.getGroundY(0, -8);
    this.character = markRaw(g.createCharacter(this.scene, new THREE.Vector3(0, startY, -8)));

    // Place panels and NPCs (all instant — no raycasting, no async)
    this.placeDiscoveryPanels();
    this.wanderingNPCs = g.createWanderingNPCs(this.scene, 12);

    // Whales in the sky
    for (let i = 0; i < 6; i++) {
      g.loadModell('/blue_whale/scene.gltf', this.scene, ['Swimming'], this,
        helper.getRandomFloat(0.002, 0.007), [0, Math.random() * Math.PI * 2, 0],
        [helper.getRandomInt(-50, 50), helper.getRandomInt(18, 35), helper.getRandomInt(-40, 40)], true);
    }

    // Controls hint is always visible on the left
  },

  methods: {
    getMixersArray() { return this.mixers; },
    getWhalesArray() { return this.whales; },

    placeDiscoveryPanels() {
      // Banners on the 4 sides of the square street (inner sidewalk) + center
      const SQ = 22;
      const panels = [
        {
          title: 'Creative Web Experiences',
          text: 'Crafting immersive, interactive web applications with modern JavaScript frameworks. Horus is this 3D explorable portfolio built with Three.js, Nuxt.js and Vue.js featuring procedural world generation. WinXp faithfully recreates the Windows XP desktop experience as a portfolio using Next.js and React. Mocking-Bird explores creative frontend patterns with TypeScript.',
          urls: [
            { url: 'https://github.com/ashrafbeshtawi/Horus', title: 'Horus' },
            { url: 'https://github.com/ashrafbeshtawi/WinXp', title: 'WinXp' },
            { url: 'https://github.com/ashrafbeshtawi/Mocking-Bird', title: 'Mocking-Bird' },
          ],
          imageUrl: '/img/frontend.png',
          x: 0, z: (SQ - 1),    // South side of square
        },
        {
          title: 'AI & Smart Systems',
          text: 'Building intelligent automation and AI-powered tools. Context Paging implements virtual memory management for AI agents, enabling unlimited conversation context through smart page swapping. Auto-Trader leverages genetic algorithms and real-time market data for fully autonomous algorithmic trading strategies in Python.',
          urls: [
            { url: 'https://github.com/ashrafbeshtawi/context-paging', title: 'Context Paging' },
            { url: 'https://github.com/ashrafbeshtawi/Auto-Trader', title: 'Auto-Trader' },
          ],
          imageUrl: '/img/ai.png',
          x: -(SQ - 1), z: 0,   // West side of square
        },
        {
          title: 'Web3, Blockchain & Mobile',
          text: 'Pioneering blockchain integration and native mobile development. Landlord is a full-stack DeFi platform enabling fractional real estate investment through tokenization with smart contracts and Web3 wallet integration. Casually is a native Android app built with Kotlin, MVVM architecture, and Material Design.',
          urls: [
            { url: 'https://landlord-liart.vercel.app/', title: 'Landlord App' },
            { url: 'https://github.com/ashrafbeshtawi/Landlord', title: 'Landlord Code' },
            { url: 'https://github.com/ashrafbeshtawi/Casually', title: 'Casually' },
          ],
          imageUrl: '/img/web3.png',
          x: (SQ - 1), z: 0,    // East side of square
        },
        {
          title: 'Certifications',
          text: 'Verified professional certifications demonstrating deep expertise. Symfony 7 Fundamentals covers services, configuration and environments. Cosmic Coding with Symfony 7 is an advanced deep-dive into the framework. Claude Code in Action from Anthropic Academy covers AI coding assistant integration, tool use systems, and GitHub workflow automation.',
          urls: [
            { url: 'https://symfonycasts.com/certificates/35CD1309C158', title: 'Symfony 7' },
            { url: 'https://symfonycasts.com/certificates/2AA8BB96C155', title: 'Cosmic Coding' },
            { url: 'https://verify.skilljar.com/c/da6mfrh4vqiz', title: 'Claude Code' },
          ],
          imageUrl: '/img/backend.png',
          x: 0, z: -(SQ - 1),   // North side of square
        },
        {
          title: 'Ashraf Beshtawi',
          text: 'Senior Backend & AI Engineer based in Berlin with 5+ years of professional experience. Core stack: PHP, Symfony, PostgreSQL, MongoDB, Next.js, Nuxt.js, and Three.js. Specialized in building scalable backend systems, pioneering AI automation workflows, crafting immersive 3D web experiences, and innovating in the Web3 and blockchain space.',
          urls: [
            { url: 'https://github.com/ashrafbeshtawi', title: 'GitHub' },
            { url: 'https://www.linkedin.com/in/ashraf-beshtawi-1308a11a8', title: 'LinkedIn' },
          ],
          imageUrl: '/img/me.jpeg',
          x: 0, z: 5,           // Center of city, visible from start
        },
      ];

      for (const p of panels) {
        const y = g.getGroundY(p.x, p.z);
        if (isNaN(y)) continue;
        const rot = g.faceToward(p.x, p.z, ISLAND_CENTER.x, ISLAND_CENTER.z);
        const pos = new THREE.Vector3(p.x, y, p.z);
        g.createDiscoveryPanel(this.scene,
          { title: p.title, text: p.text, urls: p.urls, imageUrl: p.imageUrl },
          pos, rot, this.clickableObjects);
        g.createBannerCrowd(this.scene, pos, rot);
      }
    },

    startAnimation() {
      this.animationStarted = true;
      this.soundObject.context.resume();
      this.introPlaying = true;
      g.playIntroAnimation(this.camera, this.character,
        this.cameraAngleX, this.cameraDistance, this.cameraAngleY,
        () => { this.introPlaying = false; this.controlsEnabled = true; });
    },

    animate() {
      if (!this.animationStarted) return;
      const delta = this.clock.getDelta();

      for (const m of this.mixers) m.update(delta);
      // Whales drift in the sky
      for (const w of this.whales) w.position.x = w.position.x > 80 ? -60 : w.position.x + 0.015;

      // Windmill
      if (this.worldObjs?.windmillBlade) this.worldObjs.windmillBlade.rotation.z += delta * 0.8;
      // Banner crowd animation
      g.updateBannerCrowds(delta, this.clock.elapsedTime);

      if (this.wanderingNPCs.length > 0) g.updateWanderingNPCs(this.wanderingNPCs, delta);
      if (this.controlsEnabled) this.updateMovement(delta);
      if (!this.introPlaying) this.updateCamera();
      this.renderer.render(this.scene, this.camera);
    },

    updateMovement(delta) {
      if (!this.character) return;

      // Keyboard turn
      if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.cameraAngleX += this.turnSpeed;
      if (this.keys['ArrowRight'] || this.keys['KeyD']) this.cameraAngleX -= this.turnSpeed;
      // Joystick turn (horizontal axis)
      if (this.joystickActive && Math.abs(this.joystickX) > 0.2) {
        this.cameraAngleX -= this.joystickX * this.turnSpeed * 1.2;
      }

      const fwd = this._fwd;
      fwd.set(-Math.sin(this.cameraAngleX), 0, -Math.cos(this.cameraAngleX));
      const mv = this._mv; mv.set(0, 0, 0);
      let isMoving = false;

      // Keyboard movement
      if (this.keys['ArrowUp'] || this.keys['KeyW']) { mv.x += fwd.x; mv.z += fwd.z; isMoving = true; }
      if (this.keys['ArrowDown'] || this.keys['KeyS']) { mv.x -= fwd.x; mv.z -= fwd.z; isMoving = true; }
      // Joystick movement (vertical axis = forward/back)
      if (this.joystickActive && Math.abs(this.joystickY) > 0.2) {
        mv.x -= fwd.x * this.joystickY;
        mv.z -= fwd.z * this.joystickY;
        isMoving = true;
      }

      if (isMoving) {
        mv.normalize().multiplyScalar(this.characterSpeed);
        const nx = this.character.position.x + mv.x, nz = this.character.position.z + mv.z;
        const colliders = this.worldObjs?.colliders;
        if (g.canMoveTo(nx, nz, colliders)) {
          this.character.position.x = nx; this.character.position.z = nz;
          this.character.position.y += (g.getGroundY(nx, nz) - this.character.position.y) * 0.2;
        } else {
          // Try sliding along walls (try X only, then Z only)
          if (g.canMoveTo(nx, this.character.position.z, colliders)) {
            this.character.position.x = nx;
          } else if (g.canMoveTo(this.character.position.x, nz, colliders)) {
            this.character.position.z = nz;
          }
        }
      }

      g.animateCharacter(this.character, isMoving, delta);
      const target = this.cameraAngleX + Math.PI;
      let d = target - this.character.rotation.y;
      if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      this.character.rotation.y += d * 0.2;
    },

    updateCamera() {
      if (!this.character) return;
      const d = this.cameraDistance, cy = this.cameraAngleY;
      this.camera.position.set(
        this.character.position.x + Math.sin(this.cameraAngleX) * d * Math.cos(cy),
        this.character.position.y + d * Math.sin(cy),
        this.character.position.z + Math.cos(this.cameraAngleX) * d * Math.cos(cy));
      this.camera.lookAt(this.character.position.x, this.character.position.y + 1, this.character.position.z);
    },

    handleClick(e) {
      this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObjects(this.clickableObjects, true);
      if (hits.length > 0) {
        const { object: obj, uv } = hits[0];
        if (obj.userData.isDiscoveryPanel && uv) {
          const cx = uv.x * 1024, cy = (1 - uv.y) * 768;
          for (const btn of obj.userData.urlButtons) {
            if (cx >= btn.x && cx <= btn.x + btn.width && cy >= btn.y && cy <= btn.y + btn.height) {
              window.open(btn.url, '_blank'); break;
            }
          }
        }
      }
    },

    // --- Mobile joystick ---
    onJoystickStart(e) {
      this.joystickActive = true;
      const base = this.$el.querySelector('#joystick-base');
      if (base) {
        const r = base.getBoundingClientRect();
        this.joystickBaseCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      this.onJoystickMove(e);
    },
    onJoystickMove(e) {
      if (!this.joystickActive || !e.touches.length) return;
      const touch = e.touches[0];
      const dx = touch.clientX - this.joystickBaseCenter.x;
      const dy = touch.clientY - this.joystickBaseCenter.y;
      const maxR = 38; // max offset from center
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxR);
      const angle = Math.atan2(dy, dx);
      this.joystickX = (Math.cos(angle) * dist) / maxR;
      this.joystickY = (Math.sin(angle) * dist) / maxR;
    },
    onJoystickEnd() {
      this.joystickActive = false;
      this.joystickX = 0;
      this.joystickY = 0;
    },
  },

  computed: {
    joystickKnobStyle() {
      const ox = this.joystickX * 38;
      const oy = this.joystickY * 38;
      return {
        transform: `translate(${ox}px, ${oy}px)`,
        left: '38px', top: '38px',
      };
    },
  },
};
</script>
