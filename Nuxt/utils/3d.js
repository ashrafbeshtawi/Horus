import * as THREE from "three";
import gsap from "gsap";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ===================== LAYOUT =====================
// Island: circle R=38. Roads: square ring at ±22 + cross through center.
const R = 38;
const SQ = 22;       // square ring road half-size
const RW = 3;        // road width
const RH = RW / 2;   // half road width

export default {
  getGroundY(x, z) {
    if (!this.isOnIsland(x, z)) return NaN;
    return Math.sin(x * 0.1) * 0.1 + Math.cos(z * 0.08) * 0.08;
  },
  isOnIsland(x, z) { return (x * x + z * z) < R * R; },
  faceToward(fx, fz, tx, tz) { return Math.atan2(tx - fx, tz - fz); },

  isOnRoad(x, z) {
    // Cross roads
    if (Math.abs(z) < RH && Math.abs(x) <= SQ + RH) return true;  // E-W
    if (Math.abs(x) < RH && Math.abs(z) <= SQ + RH) return true;  // N-S
    // Square ring
    if (Math.abs(x) >= SQ - RH && Math.abs(x) <= SQ + RH && Math.abs(z) <= SQ + RH) return true;
    if (Math.abs(z) >= SQ - RH && Math.abs(z) <= SQ + RH && Math.abs(x) <= SQ + RH) return true;
    return false;
  },

  collidesWithBuilding(x, z, colliders) {
    for (const c of colliders) {
      const dx = x - c.x, dz = z - c.z;
      const lx = dx * c.cos + dz * c.sin, lz = -dx * c.sin + dz * c.cos;
      if (Math.abs(lx) < c.hw && Math.abs(lz) < c.hd) return true;
    }
    return false;
  },
  canMoveTo(x, z, colliders) {
    if (!this.isOnIsland(x, z)) return false;
    if ((x * x + z * z) > (R - 2) * (R - 2)) return false;
    if (colliders && this.collidesWithBuilding(x, z, colliders)) return false;
    return true;
  },

  // ===================== WORLD =====================
  createWorld(scene) {
    const objs = { windmillBlade: null };
    const colliders = [];
    objs.colliders = colliders;
    const col = (x, z, w, d, ry = 0) => {
      colliders.push({ x, z, hw: w / 2 + 0.4, hd: d / 2 + 0.4, cos: Math.cos(ry), sin: Math.sin(ry) });
    };

    const M = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    const grass = M(0x4a7c2e, 0.9), asphalt = M(0x3a3a3a, 0.95), sidewalkM = M(0xd0ccbb, 0.92);
    const stone = M(0x808080, 0.85), wood = M(0x8B6914), darkWood = M(0x5C4033, 0.85);
    const roof1 = M(0x8B2500, 0.7), roof2 = M(0x5a5a5a, 0.75), roof3 = M(0x2e5e3e, 0.7);
    const white = M(0xF5F0E8, 0.6), cream = M(0xfaf0dc, 0.6), brick = M(0xb5651d, 0.8);
    const glass = M(0xaaddff, 0.1, 0.4), metal = M(0x555555, 0.3, 0.7);
    const water = M(0x1a7faa, 0.15, 0.35); water.transparent = true; water.opacity = 0.8;
    const foliage = [M(0x228B22, 0.85), M(0x2E8B57, 0.85), M(0x1a6b1a, 0.85)];
    const cliff = M(0x6B5B45, 0.95);
    const glow = new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffcc44, emissiveIntensity: 0.5 });
    const lineM = M(0xddddaa, 0.8);

    // === ISLAND ===
    const shape = new THREE.Shape();
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const ir = R + Math.sin(a * 5) * 1.2 + Math.cos(a * 7) * 0.6;
      i === 0 ? shape.moveTo(Math.cos(a) * ir, Math.sin(a) * ir) : shape.lineTo(Math.cos(a) * ir, Math.sin(a) * ir);
    }
    const isl = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false }), [grass, cliff]);
    isl.rotation.x = -Math.PI / 2; isl.position.y = -6; scene.add(isl);
    const topMesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 48), grass);
    topMesh.rotation.x = -Math.PI / 2; topMesh.position.y = 0.01; scene.add(topMesh);
    // Water
    const watMesh = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), water);
    watMesh.rotation.x = -Math.PI / 2; watMesh.position.y = -4.5; scene.add(watMesh);

    // === ROADS: square ring + cross ===
    const rd = (x, z, w, d) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), asphalt);
      m.position.set(x, 0.03, z); scene.add(m);
    };
    // Cross: E-W (full width across square)
    rd(0, 0, SQ * 2 + RW, RW);
    // Cross: N-S
    rd(0, 0, RW, SQ * 2 + RW);
    // Square ring: 4 sides
    rd(0, -SQ, SQ * 2 + RW, RW);  // north
    rd(0, SQ, SQ * 2 + RW, RW);   // south
    rd(-SQ, 0, RW, SQ * 2 + RW);  // west
    rd(SQ, 0, RW, SQ * 2 + RW);   // east

    // Road dashes (center lines)
    for (let x = -SQ; x < SQ; x += 3) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.01, 0.1), lineM);
      dash.position.set(x + 0.75, 0.06, 0); scene.add(dash);
      // north & south ring
      const d2 = dash.clone(); d2.position.set(x + 0.75, 0.06, -SQ); scene.add(d2);
      const d3 = dash.clone(); d3.position.set(x + 0.75, 0.06, SQ); scene.add(d3);
    }
    for (let z = -SQ; z < SQ; z += 3) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 1.5), lineM);
      dash.position.set(0, 0.06, z + 0.75); scene.add(dash);
      const d2 = dash.clone(); d2.position.set(-SQ, 0.06, z + 0.75); scene.add(d2);
      const d3 = dash.clone(); d3.position.set(SQ, 0.06, z + 0.75); scene.add(d3);
    }

    // Sidewalks (alongside roads, not overlapping)
    const sw = (x, z, w, d) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), sidewalkM);
      m.position.set(x, 0.015, z); scene.add(m);
    };
    const swOff = RH + 0.7;
    // Along E-W cross
    sw(0, -swOff, SQ * 2, 0.9); sw(0, swOff, SQ * 2, 0.9);
    // Along N-S cross
    sw(-swOff, 0, 0.9, SQ * 2); sw(swOff, 0, 0.9, SQ * 2);
    // Inside the square ring (inner sidewalks)
    sw(0, -(SQ - swOff), SQ * 2 - RW, 0.9); sw(0, (SQ - swOff), SQ * 2 - RW, 0.9);
    sw(-(SQ - swOff), 0, 0.9, SQ * 2 - RW); sw((SQ - swOff), 0, 0.9, SQ * 2 - RW);

    // Central plaza
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.05, 20), stone);
    plaza.position.set(0, 0.04, 0); scene.add(plaza);

    // === BUILDINGS: only in the 4 quadrant blocks between roads ===
    const house = (x, z, w, d, h, rh, wm, rm, ry = 0) => {
      const g = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wm); wall.position.y = h / 2; g.add(wall);
      const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.7, rh, 4), rm);
      rf.position.y = h + rh / 2; rf.rotation.y = Math.PI / 4; g.add(rf);
      const dr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.05), darkWood);
      dr.position.set(0, 0.6, d / 2 + 0.02); g.add(dr);
      for (const s of [-1, 1]) {
        const wn = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), glass);
        wn.position.set(s * w * 0.3, h * 0.6, d / 2 + 0.02); g.add(wn);
      }
      g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); col(x, z, w, d, ry);
    };

    const shop = (x, z, w, d, h, color, awning, ry = 0) => {
      const g = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color, 0.7)); wall.position.y = h / 2; g.add(wall);
      const rf = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.1, d + 0.2), M(0x4a4a4a)); rf.position.y = h; g.add(rf);
      const aw = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.05, 1), M(awning, 0.6));
      aw.position.set(0, h * 0.65, d / 2 + 0.45); g.add(aw);
      const sf = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, h * 0.35, 0.05), glass);
      sf.position.set(0, h * 0.35, d / 2 + 0.02); g.add(sf);
      g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); col(x, z, w, d, ry);
    };

    // Safe zone: buildings only at x/z between ±4 and ±18 (clear of all roads)
    // Roads occupy: cross at x=0 (±1.5) and z=0 (±1.5), ring at ±22 (±20.5 to ±23.5)

    // NW quadrant: x(-18..-4), z(-18..-4)
    house(-8, -6, 4, 3, 3, 2, white, roof1, Math.PI);
    house(-14, -6, 4, 3, 3.2, 2, cream, roof2, Math.PI);
    house(-6, -10, 3, 4, 3, 2, white, roof1, Math.PI / 2);
    house(-6, -16, 3, 4, 3.2, 2, cream, roof2, Math.PI / 2);
    house(-12, -12, 4.5, 4, 3.5, 2.2, brick, roof1, 0);

    // NE quadrant: x(4..18), z(-18..-4)
    house(8, -6, 4, 3, 3, 2, cream, roof2, Math.PI);
    house(14, -6, 4, 3, 3.2, 2, white, roof1, Math.PI);
    house(6, -10, 3, 4, 3, 2, brick, roof2, -Math.PI / 2);
    house(6, -16, 3, 4, 3.2, 2, white, roof1, -Math.PI / 2);
    house(12, -12, 4.5, 4, 3.5, 2.2, white, roof2, 0);

    // SW quadrant: x(-18..-4), z(4..18) — shops
    shop(-8, 6, 4, 3, 3, 0xd4a76a, 0xcc3333, 0);
    shop(-14, 6, 4, 3, 3, 0xc4956a, 0x2266aa, 0);
    shop(-6, 10, 3, 4, 3, 0xe4d4b4, 0xdd4444, Math.PI / 2);
    shop(-6, 16, 3, 4, 3, 0xb4a48a, 0x8822aa, Math.PI / 2);
    shop(-12, 12, 4.5, 4, 3.2, 0xc4956a, 0x336699, 0);

    // SE quadrant: x(4..18), z(4..18) — shops
    shop(8, 6, 4, 3, 3, 0xd4b494, 0x44aa44, 0);
    shop(14, 6, 4, 3, 3, 0xd4a76a, 0xcc3333, 0);
    shop(6, 10, 3, 4, 3, 0xc4956a, 0x228833, -Math.PI / 2);
    shop(6, 16, 3, 4, 3, 0xe4d4b4, 0xcc6600, -Math.PI / 2);
    shop(12, 12, 4.5, 4, 3.2, 0xd4b494, 0x8822aa, 0);

    // Windmill — outside NW corner, away from roads
    const wm = new THREE.Group();
    const wmb = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 6, 8), white); wmb.position.y = 3; wm.add(wmb);
    const wmr = new THREE.Mesh(new THREE.ConeGeometry(2, 2, 8), roof2); wmr.position.y = 7; wm.add(wmr);
    const bp = new THREE.Group(); bp.position.set(0, 5.5, 1.5);
    for (let i = 0; i < 4; i++) {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.05), wood); bl.position.y = 2;
      const arm = new THREE.Group(); arm.rotation.z = (i / 4) * Math.PI * 2; arm.add(bl); bp.add(arm);
    }
    wm.add(bp); objs.windmillBlade = bp;
    wm.position.set(-26, 0, -10); scene.add(wm); col(-26, -10, 4, 4);

    // Tower — outside east ring, away from road
    const tw = new THREE.Group();
    const twb = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.3, 8, 8), stone); twb.position.y = 4; tw.add(twb);
    const twt = new THREE.Mesh(new THREE.ConeGeometry(2.8, 3, 8), roof1); twt.position.y = 9.5; tw.add(twt);
    tw.position.set(26, 0, -10); scene.add(tw); col(26, -10, 5, 5);

    // === TREES ===
    const tree = (x, z, s = 1) => {
      if (!this.isOnIsland(x, z) || this.isOnRoad(x, z)) return;
      const t = new THREE.Group();
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.15 * s, 1.5 * s, 5), M(0x654321, 0.9));
      tr.position.y = 0.75 * s; t.add(tr);
      const fm = foliage[Math.floor(Math.random() * 3)];
      const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 1.8 * s, 6), fm); f1.position.y = 2.2 * s; t.add(f1);
      const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.65 * s, 1.3 * s, 6), fm); f2.position.y = 3 * s; t.add(f2);
      t.position.set(x, 0, z); scene.add(t);
    };
    // Along cross road sidewalks
    for (let v = -20; v <= 20; v += 5) {
      if (Math.abs(v) < 3) continue;
      tree(v, 2.8); tree(v, -2.8);
      tree(2.8, v); tree(-2.8, v);
    }
    // Along ring inner
    for (let v = -18; v <= 18; v += 6) {
      tree(v, -(SQ - 3)); tree(v, (SQ - 3));
      tree(-(SQ - 3), v); tree((SQ - 3), v);
    }
    // Edge scatter
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 5;
      tree(Math.cos(a) * r, Math.sin(a) * r, 0.6 + Math.random() * 0.4);
    }

    // === LAMP POSTS ===
    const lamp = (x, z) => {
      const g = new THREE.Group();
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.5, 4), metal); p.position.y = 1.25; g.add(p);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 5, 5), glow); l.position.y = 2.6; g.add(l);
      g.position.set(x, 0, z); scene.add(g);
    };
    for (let v = -18; v <= 18; v += 8) { lamp(v, 3); lamp(v, -3); lamp(3, v); lamp(-3, v); }

    // === BENCHES ===
    const bench = (x, z, ry) => {
      const g = new THREE.Group();
      const s = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.35), darkWood); s.position.y = 0.4; g.add(s);
      for (const sx of [-0.55, 0.55]) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.35), darkWood); l.position.set(sx, 0.2, 0); g.add(l);
      }
      g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    };
    bench(-2, 2.5, 0); bench(2, -2.5, Math.PI); bench(10, 2.5, 0); bench(-10, -2.5, Math.PI);

    // Traffic lights at cross intersection
    const tl = (x, z) => {
      const g = new THREE.Group();
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 4), metal); p.position.y = 1.5; g.add(p);
      const bx = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.12), M(0x222222)); bx.position.y = 2.9; g.add(bx);
      for (let i = 0; i < 3; i++) {
        const cl = [0xff0000, 0xffaa00, 0x00ff00][i];
        const li = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4),
          new THREE.MeshStandardMaterial({ color: cl, emissive: cl, emissiveIntensity: i === 2 ? 0.5 : 0.1 }));
        li.position.set(0, 3.05 - i * 0.2, 0.07); g.add(li);
      }
      g.position.set(x, 0, z); scene.add(g);
    };
    tl(2.5, 2.5); tl(-2.5, -2.5); tl(2.5, -2.5); tl(-2.5, 2.5);

    return objs;
  },


  // ===================== RENDERER =====================
  initRenderer: (fn, id) => {
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setSize(window.innerWidth, window.innerHeight);
    r.setPixelRatio(window.devicePixelRatio);
    r.setAnimationLoop(fn); document.getElementById(id).appendChild(r.domElement); return r;
  },
  getCamera() { return new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500); },

  // ===================== CHARACTER (clean stylized low-poly) =====================
  createCharacter(scene, position, options = {}) {
    const group = new THREE.Group();
    const shirtC = options.shirtColor || 0x2874a6;
    const pantsC = options.pantsColor || 0x2c3e50;
    const hairC = options.hairColor || 0x2c1a0e;
    const skinC = options.skinColor || 0xf5cba7;
    const M2 = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

    const skin = M2(skinC, 0.9), shirt = M2(shirtC, 0.6, 0.05), pants = M2(pantsC, 0.7);
    const shoeMat = M2(0x4a3728, 0.85), hairMat = M2(hairC, 0.95);

    // --- LEGS (pivot at hip) ---
    const legPivots = [], armPivots = [];
    for (const s of [-1, 1]) {
      const lp = new THREE.Group();
      lp.position.set(s * 0.1, 0.55, 0);
      // Thigh
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.35, 0.14), pants);
      thigh.position.y = -0.2; lp.add(thigh);
      // Shin
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), pants);
      shin.position.y = -0.5; lp.add(shin);
      // Shoe
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.22), shoeMat);
      shoe.position.set(0, -0.68, 0.03); lp.add(shoe);
      group.add(lp); legPivots.push(lp);

      // --- ARMS (pivot at shoulder) ---
      const ap = new THREE.Group();
      ap.position.set(s * 0.22, 1.05, 0);
      // Upper arm
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), shirt);
      upper.position.y = -0.16; ap.add(upper);
      // Forearm
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.09), skin);
      lower.position.y = -0.42; ap.add(lower);
      // Hand (small box)
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), skin);
      hand.position.y = -0.56; ap.add(hand);
      group.add(ap); armPivots.push(ap);
    }

    // --- BODY ---
    // Hips
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.18), pants);
    hips.position.y = 0.58; group.add(hips);
    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.2), shirt);
    torso.position.y = 0.88; group.add(torso);

    // --- HEAD (large, stylized — like a rounded box) ---
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.28), skin);
    head.position.y = 1.3;
    // Round the head slightly
    const headPositions = head.geometry.attributes.position;
    for (let i = 0; i < headPositions.count; i++) {
      const x = headPositions.getX(i), y = headPositions.getY(i), z = headPositions.getZ(i);
      const len = Math.sqrt(x * x + y * y + z * z);
      const f = 0.92 + 0.08 * (0.2 / Math.max(len, 0.01));
      headPositions.setX(i, x * f); headPositions.setY(i, y * f); headPositions.setZ(i, z * f);
    }
    headPositions.needsUpdate = true;
    head.geometry.computeVertexNormals();
    group.add(head);

    // Hair — flat cap on top + sides
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.3), hairMat);
    hairTop.position.y = 0.16; head.add(hairTop);
    const hairFront = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.04), hairMat);
    hairFront.position.set(0, 0.12, 0.13); head.add(hairFront);
    const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.22), hairMat);
    hairSideL.position.set(-0.16, 0.08, -0.02); head.add(hairSideL);
    const hairSideR = hairSideL.clone(); hairSideR.position.x = 0.16; head.add(hairSideR);
    const hairBackM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.04), hairMat);
    hairBackM.position.set(0, 0.06, -0.13); head.add(hairBackM);

    // --- FACE (clean, simple) ---
    // Eyes: simple white ovals with dark pupils
    for (const s of [-1, 1]) {
      // White
      const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M2(0xffffff, 0.1));
      eyeW.position.set(s * 0.08, 0.02, 0.13); eyeW.scale.set(1, 1.2, 0.5); head.add(eyeW);
      // Pupil (just a dark dot)
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), M2(0x1a1a1a));
      pupil.position.set(s * 0.08, 0.02, 0.145); head.add(pupil);
    }
    // Eyebrows (subtle)
    for (const s of [-1, 1]) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.02), hairMat);
      brow.position.set(s * 0.08, 0.065, 0.13); brow.rotation.z = s * -0.1; head.add(brow);
    }
    // Nose — tiny bump
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), skin);
    nose.position.set(0, -0.01, 0.15); head.add(nose);
    // Mouth — simple dark line
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.01), M2(0xc4715a));
    mouth.position.set(0, -0.06, 0.14); head.add(mouth);

    // Neck
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.1), skin);
    neck.position.y = 1.12; group.add(neck);

    // Backpack (optional)
    if (options.backpack !== false) {
      const bp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.12), M2(0xb05e2a, 0.7));
      bp.position.set(0, 0.88, -0.16); group.add(bp);
      // Straps
      for (const s of [-1, 1]) {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.02), M2(0x8d4e24));
        strap.position.set(s * 0.08, 0.92, -0.06); group.add(strap);
      }
    }

    group.userData = {
      leftLeg: legPivots[0], rightLeg: legPivots[1],
      leftArm: armPivots[0], rightArm: armPivots[1],
      walkTime: 0, walkBlend: 0,
    };
    group.position.set(position.x, position.y, position.z);
    scene.add(group);
    return group;
  },

  animateCharacter(ch, moving, dt) {
    const u = ch.userData;
    if (moving) { u.walkTime += dt * 7; u.walkBlend = Math.min(1, (u.walkBlend || 0) + dt * 5); }
    else { u.walkBlend = Math.max(0, (u.walkBlend || 0) - dt * 4); }
    const b = u.walkBlend || 0, s = Math.sin(u.walkTime) * b;
    u.leftLeg.rotation.x = s * 0.3; u.rightLeg.rotation.x = -s * 0.3;
    u.leftArm.rotation.x = -s * 0.2; u.rightArm.rotation.x = s * 0.2;
  },

  // ===================== CROWD =====================
  // Banner crowd — animated, excited, looking at each other
  _bannerCrowds: [],

  createBannerCrowd(scene, pos, rotY) {
    const shirts = [0xc0392b, 0x27ae60, 0xf39c12, 0x8e44ad, 0x2980b9, 0xd35400];
    const pantsA = [0x2c3e50, 0x34495e, 0x4a4a4a]; const hairA = [0x2c1a0e, 0x5c3a1e, 0x1a1a1a, 0x8b4513];
    const crowd = [];
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      // Place in FRONT of banner (rotY points toward center = front face)
      const a = rotY + ((i / count) - 0.5) * 2.0;
      const d = 2.5 + Math.random() * 1.2;
      const x = pos.x + Math.sin(a) * d, z = pos.z + Math.cos(a) * d;
      const gy = this.getGroundY(x, z); if (isNaN(gy)) continue;
      const npc = this.createCharacter(scene, new THREE.Vector3(x, gy, z), {
        shirtColor: shirts[Math.floor(Math.random() * shirts.length)],
        pantsColor: pantsA[Math.floor(Math.random() * pantsA.length)],
        hairColor: hairA[Math.floor(Math.random() * hairA.length)], backpack: false });
      npc.userData.crowdPhase = Math.random() * Math.PI * 2;
      npc.userData.crowdSpeed = 1.5 + Math.random() * 1.5;
      npc.userData.baseX = x;
      npc.userData.baseZ = z;
      npc.userData.bannerPos = pos;
      crowd.push(npc);
    }
    this._bannerCrowds.push(crowd);
  },

  // Animate all banner crowds — shift weight, look at neighbors, gesture excitedly
  updateBannerCrowds(dt, time) {
    for (const crowd of this._bannerCrowds) {
      for (let i = 0; i < crowd.length; i++) {
        const npc = crowd[i];
        const u = npc.userData;
        const t = time * u.crowdSpeed + u.crowdPhase;

        // Subtle weight-shifting / stepping in place
        const sway = Math.sin(t) * 0.15;
        npc.position.x = u.baseX + Math.sin(t * 0.7) * 0.12;
        npc.position.z = u.baseZ + Math.cos(t * 0.5) * 0.1;

        // Look at a neighbor or the banner (alternating)
        const lookAtBanner = Math.sin(t * 0.4) > 0;
        let targetX, targetZ;
        if (lookAtBanner || crowd.length < 2) {
          targetX = u.bannerPos.x; targetZ = u.bannerPos.z;
        } else {
          const neighbor = crowd[(i + 1) % crowd.length];
          targetX = neighbor.position.x; targetZ = neighbor.position.z;
        }
        const targetRot = Math.atan2(targetX - npc.position.x, targetZ - npc.position.z);
        let diff = targetRot - npc.rotation.y;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        npc.rotation.y += diff * 0.05;

        // Animated gestures — arms wave and point excitedly
        const gesture = Math.sin(t * 1.2);
        const gesture2 = Math.cos(t * 0.9);
        u.rightArm.rotation.x = -0.3 + gesture * 0.6;
        u.rightArm.rotation.z = 0.1 + Math.max(0, gesture) * 0.4;
        u.leftArm.rotation.x = -0.2 + gesture2 * 0.5;
        u.leftArm.rotation.z = -0.1 - Math.max(0, gesture2) * 0.3;

        // Subtle leg movement (shifting weight)
        u.leftLeg.rotation.x = sway * 0.15;
        u.rightLeg.rotation.x = -sway * 0.15;
      }
    }
  },

  SAFE_ROUTES: [
    [{x:-20,z:-2.5},{x:-10,z:-2.5},{x:0,z:-2.5},{x:10,z:-2.5},{x:20,z:-2.5}],
    [{x:-20,z:2.5},{x:-10,z:2.5},{x:0,z:2.5},{x:10,z:2.5},{x:20,z:2.5}],
    [{x:-2.5,z:-20},{x:-2.5,z:-10},{x:-2.5,z:0},{x:-2.5,z:10},{x:-2.5,z:20}],
    [{x:2.5,z:-20},{x:2.5,z:-10},{x:2.5,z:0},{x:2.5,z:10},{x:2.5,z:20}],
    [{x:3,z:3},{x:-3,z:3},{x:-3,z:-3},{x:3,z:-3}],
    [{x:-20,z:-20},{x:-10,z:-20},{x:10,z:-20},{x:20,z:-20}],
    [{x:-20,z:20},{x:-10,z:20},{x:10,z:20},{x:20,z:20}],
  ],

  createWanderingNPCs(scene, count) {
    const shirts = [0xc0392b,0x27ae60,0xf39c12,0x8e44ad,0x2980b9,0xd35400]; const pantsA = [0x2c3e50,0x34495e,0x4a4a4a]; const hairA = [0x2c1a0e,0x5c3a1e,0x1a1a1a,0x8b4513];
    const npcs = [];
    for (let i = 0; i < count; i++) {
      const route = this.SAFE_ROUTES[Math.floor(Math.random() * this.SAFE_ROUTES.length)];
      const wi = Math.floor(Math.random() * route.length), wp = route[wi];
      const gy = this.getGroundY(wp.x, wp.z); if (isNaN(gy)) continue;
      const npc = this.createCharacter(scene, new THREE.Vector3(wp.x, gy, wp.z), {
        shirtColor: shirts[Math.floor(Math.random() * shirts.length)], pantsColor: pantsA[Math.floor(Math.random() * pantsA.length)],
        hairColor: hairA[Math.floor(Math.random() * hairA.length)], backpack: Math.random() > 0.6 });
      npc.userData.route = route; npc.userData.waypointIndex = wi;
      npc.userData.direction = Math.random() > 0.5 ? 1 : -1;
      npc.userData.speed = 0.02 + Math.random() * 0.02; npc.userData.waitTimer = 0;
      npcs.push(npc);
    }
    return npcs;
  },
  updateWanderingNPCs(npcs, dt) {
    for (const n of npcs) {
      const u = n.userData;
      if (u.waitTimer > 0) { u.waitTimer -= dt; this.animateCharacter(n, false, dt); continue; }
      const wp = u.route[u.waypointIndex], dx = wp.x - n.position.x, dz = wp.z - n.position.z, dist = Math.sqrt(dx*dx+dz*dz);
      if (dist < 0.5) {
        u.waypointIndex += u.direction;
        if (u.waypointIndex >= u.route.length || u.waypointIndex < 0) { u.direction *= -1; u.waypointIndex += u.direction * 2; u.waitTimer = 1+Math.random()*3; }
        this.animateCharacter(n, false, dt);
      } else {
        const nx = n.position.x + (dx/dist)*u.speed, nz = n.position.z + (dz/dist)*u.speed;
        const gy = this.getGroundY(nx, nz);
        if (!isNaN(gy)) { n.position.x = nx; n.position.z = nz; n.position.y += (gy-n.position.y)*0.2; }
        const tr = Math.atan2(dx, dz); let d = tr - n.rotation.y;
        if (d > Math.PI) d -= Math.PI*2; if (d < -Math.PI) d += Math.PI*2;
        n.rotation.y += d * 0.1; this.animateCharacter(n, true, dt);
      }
    }
  },

  // ===================== PANELS =====================
  createDiscoveryPanel(scene, config, pos, rotY, clickable) {
    const pw=6,ph=4.5,postH=2,g=new THREE.Group();
    const cv=document.createElement("canvas");cv.width=1024;cv.height=768;
    const ctx=cv.getContext("2d");const btns=[];const self=this;
    const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
    const draw=(img)=>{
      // Background
      ctx.fillStyle="rgba(255,255,255,0.96)"; self._rr(ctx,0,0,1024,768,24,1,0);
      ctx.strokeStyle="#1565C0"; ctx.lineWidth=6; self._rr(ctx,3,3,1018,762,22,0,1);
      // Accent bar
      ctx.fillStyle="#1565C0"; ctx.fillRect(0,0,1024,12);

      let tx=50, tw=924;
      if(img){
        // Image with rounded border
        ctx.save(); ctx.strokeStyle="#ddd"; ctx.lineWidth=3;
        ctx.strokeRect(46,126,228,228);
        ctx.drawImage(img,48,128,224,224); ctx.restore();
        tx=300; tw=674;
      }

      // Title
      ctx.fillStyle="#0d47a1"; ctx.font="bold 44px Arial"; ctx.fillText(config.title,50,62);
      // Underline
      ctx.fillStyle="#1976D2"; ctx.fillRect(50,78,tw,3);

      // Description text (larger font)
      ctx.fillStyle="#333"; ctx.font="24px Arial"; self._wt(ctx,config.text,tx,120,tw,32);

      // === BUTTONS — horizontal row, centered, big ===
      if(config.urls){
        const bh=95, gap=24;
        ctx.font="bold 36px Arial";
        const btnWidths = config.urls.map(u => ctx.measureText(u.title).width + 110);
        const totalW = btnWidths.reduce((a,b) => a+b, 0) + gap * (config.urls.length - 1);
        let bx = Math.floor((1024 - totalW) / 2);
        const by = 768 - 190 - bh;

        config.urls.forEach((u,i)=>{
          const bw = btnWidths[i];
          // Shadow
          ctx.fillStyle="rgba(0,0,0,0.25)"; self._rr(ctx, bx+5, by+6, bw, bh, 16, 1, 0);
          // Button bg
          ctx.fillStyle="#1565C0"; self._rr(ctx, bx, by, bw, bh, 16, 1, 0);
          ctx.fillStyle="#1976D2"; self._rr(ctx, bx, by, bw, bh*0.5, 16, 1, 0);
          // Border
          ctx.strokeStyle="#0d47a1"; ctx.lineWidth=4; self._rr(ctx, bx, by, bw, bh, 16, 0, 1);
          // Arrow + title
          ctx.fillStyle="#ffffff"; ctx.font="bold 36px Arial";
          ctx.fillText("\u27A4  " + u.title, bx + 28, by + 48);
          // "Click to visit"
          ctx.fillStyle="#90caf9"; ctx.font="bold 22px Arial";
          ctx.fillText("Click to visit", bx + 28, by + 78);

          btns.push({x:bx, y:by, width:bw, height:bh, url:u.url});
          bx += bw + gap;
        });
      }
      tex.needsUpdate=true;
    };
    const pm=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,transparent:true}));
    pm.position.y=postH+ph/2;pm.userData={isDiscoveryPanel:true,urlButtons:btns,canvasWidth:1024,canvasHeight:768};
    g.add(pm);if(clickable)clickable.push(pm);
    const post=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.12,postH,6),new THREE.MeshStandardMaterial({color:0x6d4c41,roughness:0.9}));
    post.position.y=postH/2;g.add(post);
    g.position.copy(pos);g.rotation.y=rotY;scene.add(g);
    if(config.imageUrl){const im=new Image();im.crossOrigin="anonymous";im.onload=()=>draw(im);im.onerror=()=>draw(null);im.src=config.imageUrl;}else draw(null);
    return{group:g,panelMesh:pm};
  },
  _rr(c,x,y,w,h,r,f,s){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(f)c.fill();if(s)c.stroke();},
  _wt(c,t,x,y,mw,lh){let l="",cy=y;for(const w of t.split(" ")){const te=l+w+" ";if(c.measureText(te).width>mw&&l){c.fillText(l.trim(),x,cy);l=w+" ";cy+=lh;}else l=te;}c.fillText(l.trim(),x,cy);},

  playIntroAnimation(cam,ch,ax,td,tay,cb){
    const a={distance:28,angleY:1.0},lk=new THREE.Vector3();
    cam.position.set(ch.position.x+Math.sin(ax)*28*Math.cos(1),ch.position.y+28*Math.sin(1),ch.position.z+Math.cos(ax)*28*Math.cos(1));
    lk.copy(ch.position);lk.y+=1;cam.lookAt(lk);
    gsap.to(a,{distance:td,angleY:tay,duration:3,ease:"power2.inOut",
      onUpdate:()=>{lk.copy(ch.position);lk.y+=1;cam.position.set(ch.position.x+Math.sin(ax)*a.distance*Math.cos(a.angleY),ch.position.y+a.distance*Math.sin(a.angleY),ch.position.z+Math.cos(ax)*a.distance*Math.cos(a.angleY));cam.lookAt(lk);},onComplete:cb});
  },

  loadModell(path,scene,anims,ref,scale=1,rot=[0,0,0],pos=null,whales=false){
    new GLTFLoader().load(path,(g)=>{const m=g.scene;m.scale.setScalar(scale);m.rotation.set(rot[0],rot[1],rot[2]);
      if(pos)m.position.set(pos[0],pos[1],pos[2]);scene.add(m);
      const mx=new THREE.AnimationMixer(m);for(const n of anims){const c=THREE.AnimationClip.findByName(g.animations,n);if(c)mx.clipAction(c).play();}
      ref.getMixersArray().push(mx);if(whales)ref.getWhalesArray().push(m);},undefined,(e)=>console.error(e));
  },
  loadMusic(l,p){const s=new THREE.Audio(l);s.autoplay=true;new THREE.AudioLoader().load(p,(b)=>{s.setBuffer(b);s.setLoop(true);s.setVolume(0.5);});return s;},
};
