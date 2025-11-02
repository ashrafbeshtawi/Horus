<template>
  <!--<v-btn @click="this.debugCamera()">Show Position</v-btn>-->
  <div v-if="!animationStarted" id="overlay">
    <v-btn size="x-large" color="primary" @click="startAnimation">Start your Adventure</v-btn>
  </div>  <section
      id="container"
      class="w-full h-screen relative"
      v-if="isWebGL2Available"
  >
  </section>
  <UAlert
      v-else
      icon="i-heroicons-command-line"
      color="rose"
      variant="solid"
      title="Error:"
      description="This website uses WebGL2 but your browser does not support it"
  />
</template>

<style scoped>
</style>

<script setup>
</script>

<script>

import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import graphicUtils from '../utils/3d.js';
import helper from '../utils/helper.js';
import {markRaw} from 'vue'
import gsap from "gsap";

export default {
  data() {
    return {
      isWebGL2Available: true,
      animationStarted: false,
      soundObject: null,
      mixers: [],
      whales: [],
      camera: null,
      scene: null,
      renderer: null,
      introPlayed: false,
      ThreeMeshUI: null,
      clock: new THREE.Clock(),
      raycaster: null,
      mouse: null,
      clickableObjects: [],
      currentView: 'main',
      previousCameraPosition: null,
      previousCameraRotation: null,
      panelObjects: null,
      // handshake effect
      cameraRotationInLastAnimationFrame: null,
      cameraStartShakeEffectPosition: null,
      handshakeEffectMovementDirection: 1,
      handshakeEffectMovementStep: 0.003,
      handshakeMaxMovementPercentage: 0.05,

    }
  },
  beforeUnmount() {
    // Clean up event listeners
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('click', this.onMouseClick);
  },
  mounted() {
    graphicUtils.load3dMenuLibrary().then(
        library => {
          this.ThreeMeshUI = library;
        }
    );
    this.camera = graphicUtils.getCamera();
    this.scene = markRaw(new THREE.Scene());
    this.renderer = markRaw(graphicUtils.initRenderer(this.animate, 'container'));
    this.isWebGL2Available = WebGL.isWebGL2Available();

    // important to have raycaster & mouse in order to interact with 3D buttons
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('click', this.onMouseClick);
    
    const audioListener = new THREE.AudioListener();
    this.camera.add(audioListener);
    
    // adding music
    this.soundObject = graphicUtils.loadMusic(audioListener, '/music/background-music.mp3');

    this.addButtons();
    // setting light & background color
    this.scene.background = new THREE.Color('#87CEEB');
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 3);
    this.scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(7, 17, 53);
    this.scene.add(directionalLight);

    // loading modells
    graphicUtils.loadModell(
        '/town/scene.gltf',
        this.scene,
        ['The Life'],
        this
    );
    this.loadWhales(this.scene)

    // uncomment for debugging :)
    //const controls = new OrbitControls(this.camera, this.renderer.domElement);
  },
  methods: {
    getMixersArray: function () {
      return this.mixers;
    },
    getWhalesArray: function () {
      return this.whales;
    },
    loadWhales: function (scene) {
      for (let i = 0; i < 10; i++) {
        graphicUtils.loadModell(
            '/blue_whale/scene.gltf',
            scene,
            ['Swimming'],
            this,
            helper.getRandomFloat(0.001, 0.01),
            [0, 0.5 * Math.PI, 0],
            [
                helper.getRandomInt(-70, 40),
              helper.getRandomInt(20, 32),
              helper.getRandomInt(-25, 50)
            ],
            true
        );
      }
    },
    startAnimation: function () {
      this.animationStarted = true;
      this.soundObject.context.resume();
    },

    animate: function() {
      if (!this.animationStarted) {
        return;
      }
      if (this.ThreeMeshUI) {
        this.ThreeMeshUI.update();
      }

      // animate the loaded modell
      const delta = this.clock.getDelta();
      for (let i = 0; i < this.mixers.length; i++) {
        this.mixers[i].update(delta);
      }
      this.renderer.render(this.scene, this.camera);

      // move whales
      for (let i = 0; i < this.whales.length; i++) {
        let x = this.whales[i].position.x;
        this.whales[i].position.x = x > 150 ? -115 : this.whales[i].position.x + 0.01;
      }

      if (!this.introPlayed) {
        this.introPlayed = true;
        graphicUtils.moveToStartingPoint(this.camera);
      }

      // Handshake effect implementation
      // Initialize cameraRotationInLastAnimationFrame on first run
      if (this.cameraRotationInLastAnimationFrame === null) {
        this.cameraRotationInLastAnimationFrame = {
          x: this.camera.rotation.x,
          y: this.camera.rotation.y,
          z: this.camera.rotation.z
        };
      }

      // Check if camera rotation hasn't changed (camera is not rotating)
      const rotationThreshold = 0.0001; // Small threshold for floating point comparison
      const rotationUnchanged = 
        Math.abs(this.camera.rotation.x - this.cameraRotationInLastAnimationFrame.x) < rotationThreshold &&
        Math.abs(this.camera.rotation.y - this.cameraRotationInLastAnimationFrame.y) < rotationThreshold &&
        Math.abs(this.camera.rotation.z - this.cameraRotationInLastAnimationFrame.z) < rotationThreshold;

      if (rotationUnchanged) {
        // Camera is not rotating, start shake effect
        
        // Initialize start position if not set
        if (this.cameraStartShakeEffectPosition === null) {
          this.cameraStartShakeEffectPosition = this.camera.position.y;
        }

        // Calculate movement amount
        const movementAmount = this.handshakeEffectMovementDirection * this.handshakeEffectMovementStep;
        
        // Apply movement to camera
        this.camera.position.y += movementAmount;

        // Calculate how far we've moved from start position
        const distanceFromStart = Math.abs(this.camera.position.y - this.cameraStartShakeEffectPosition);
        const maxDistance = Math.abs(this.cameraStartShakeEffectPosition * this.handshakeMaxMovementPercentage);

        // Check if we've reached the maximum movement distance
        if (distanceFromStart >= maxDistance) {
          // Reverse direction
          this.handshakeEffectMovementDirection *= -1;
        }
      } else {
        // Camera is rotating, reset shake effect
        this.cameraStartShakeEffectPosition = null;
      }

      // Update last frame rotation
      this.cameraRotationInLastAnimationFrame = {
        x: this.camera.rotation.x,
        y: this.camera.rotation.y,
        z: this.camera.rotation.z
      };
    },
    debugCamera: function () {
      console.log(this.camera.position);
      console.log(this.camera.rotation);

    },
    handleButtonClick(buttonData) {
      // Save current camera position
      this.previousCameraPosition = {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      };
      this.previousCameraRotation = {
        x: this.camera.rotation.x,
        y: this.camera.rotation.y,
        z: this.camera.rotation.z
      };
      console.log(buttonData.panelPosition, buttonData.panelCameraPosition);
      for (let i = 0; i < buttonData.panelCameraPosition.length; i++) {
        console.log(buttonData.panelCameraPosition[i]- buttonData.panelPosition[i]);
      }

      // Create info panel
      this.panelObjects = graphicUtils.createInfoPanel(
        this.scene,
        buttonData.config,
        buttonData.panelPosition,
        buttonData.panelCameraRotation,
        this.clickableObjects,
        this.handleBackButton
      );
      
      // Move camera to view the panel
      gsap.to(this.camera.position, {
        x: buttonData.panelCameraPosition[0],
        y: buttonData.panelCameraPosition[1],
        z: buttonData.panelCameraPosition[2],
        duration: 1.5,
        onComplete: () => {
          this.currentView = 'panel';
          this.fadeInPanel();
        }
      });
      gsap.to(this.camera.rotation, {
        x: buttonData.panelCameraRotation[0],
        y: buttonData.panelCameraRotation[1],
        z: buttonData.panelCameraRotation[2],
        duration: 1.5
      });
    },
    
    fadeInPanel() {
      if (!this.panelObjects || !this.panelObjects.objectsToAnimate) return;
      
      this.panelObjects.objectsToAnimate.forEach((obj, index) => {
        gsap.to(obj.material, {
          opacity: 1,
          duration: 0.5,
          delay: index * 0.05
        });
      });
    },
    addButtons() {
      // Who am I?
      graphicUtils.addButton(
        this.scene,
        this.clickableObjects,
        'Who am I?',
        {
          title: 'Ashraf Beshtawi',
          text: 'I am Ashraf — a Backend & AI engineer passionate about building smart, scalable applications.',
          urls: [
            { url: '/pdf/Ashraf Beshtawi- CV.pdf', title: 'View my CV' },
          ],
          imageUrl : '/img/me.jpeg'
        },
        [9.3, 9, 30],
        [20, 10, 12],
        [20, 10, 22],
        [0, 0, 0],
        this.handleButtonClick
      );

      // Frontend
      graphicUtils.addButton(
        this.scene,
        this.clickableObjects,
        'Frontend',
        {
          title: 'Frontend & 3D Experiences',
          text: 'Next.js, Nuxt.js & Three.js — immersive and performant web apps.',
          urls: [
            { url: 'https://github.com/ashrafbeshtawi/Horus', title: 'Horus (3D Portfolio)' },
            { url: 'https://mocking-bird-three.vercel.app/', title: 'Mocking-Bird (Fullstack App)' }
          ]
        },
        [9.3, 7.5, 30],
        [-25, 16, 16],
        [-25, 16, 26],
        [0, 0, 0],
        this.handleButtonClick
      );

      // Backend
      graphicUtils.addButton(
        this.scene,
        this.clickableObjects,
        'Backend',
        {
          title: 'Backend Engineering',
          text: 'Symfony · PHP 8 · PostgreSQL · PHPUnit — reliable APIs & scalable backend systems.',
          urls: [
            { url: 'https://github.com/ashrafbeshtawi', title: 'GitHub Backend Repos' }
          ]
        },
        [9.3, 6, 30],
        [13, 11, -13],
        [19, 15.5, -18],
        [-2.4, 0.6, 2.6],
        this.handleButtonClick
      );

      // Web3
      graphicUtils.addButton(
        this.scene,
        this.clickableObjects,
        'Web3',
        {
          title: 'Web3 & Real Estate Tokenization',
          text: 'LandLord — fractional investment in real estate using blockchain.',
          urls: [
            { url: 'https://landlord-liart.vercel.app/', title: 'LandLord (Web3 Project)' }
          ]
        },
        [9.3, 4.5, 30],
        [-26, 5, 6],
        [-39, 6.5, 4.7],
        [-1, -1.3, -1],
        this.handleButtonClick
      );

      // AI
      graphicUtils.addButton(
        this.scene,
        this.clickableObjects,
        'AI',
        {
          title: 'AI & Automation',
          text: 'Genetic Algorithms + n8n Workflows — intelligent automation & algorithmic trading.',
          urls: [
            { url: 'https://github.com/ashrafbeshtawi/Auto-Trader', title: 'Auto-Trader (AI Trading)' }
          ]
        },
        [9.3, 3, 30],
        [-32, 2.4, 33],
        [-39, 3, 40],
        [-0.07, -0.7, 0],
        this.handleButtonClick
      );

      // Let’s Connect
      graphicUtils.addButton(
        this.scene,
        this.clickableObjects,
        'Let’s Connect',
        {
          title: 'Let’s Connect',
          text: 'Open to Backend & AI roles — feel free to reach out!',
          urls: [
            { url: 'https://github.com/ashrafbeshtawi', title: 'GitHub' },
            { url: 'https://www.linkedin.com/in/ashraf-beshtawi/', title: 'LinkedIn' }
          ]
        },
        [9.3, 1.5, 30],
        [-8, 6, -32],
        [-8, 6, -42],
        [-3, 0, -3],
        this.handleButtonClick
      );

    },



    fadeOutPanel(callback) {
      if (!this.panelObjects || !this.panelObjects.objectsToAnimate) return;
      
      this.panelObjects.objectsToAnimate.forEach((obj, index) => {
        gsap.to(obj.material, {
          opacity: 0,
          duration: 0.3,
          delay: index * 0.02,
          onComplete: index === this.panelObjects.objectsToAnimate.length - 1 ? callback : undefined
        });
      });
    },
    
    handleBackButton() {
      // Fade out panel
      this.fadeOutPanel(() => {
        // Remove panel and associated objects
        if (this.panelObjects) {
          this.scene.remove(this.panelObjects.panelGroup);
          
          // Remove clickable buttons from the panel
          this.clickableObjects = this.clickableObjects.filter(obj => {
            return !obj.userData.panelGroup || obj.userData.panelGroup !== this.panelObjects.panelGroup;
          });
        }
        
        this.panelObjects = null;
      });
      
      // Return camera to previous position
      gsap.to(this.camera.position, {
        x: this.previousCameraPosition.x,
        y: this.previousCameraPosition.y,
        z: this.previousCameraPosition.z,
        duration: 1.5
      });
      gsap.to(this.camera.rotation, {
        x: this.previousCameraRotation.x,
        y: this.previousCameraRotation.y,
        z: this.previousCameraRotation.z,
        duration: 1.5,
        onComplete: () => {
          this.currentView = 'main';
        }
      });
    },
    

    onMouseClick(event) {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      const intersects = this.raycaster.intersectObjects(this.clickableObjects);
      
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData.onClick) {
          clickedObject.userData.onClick(clickedObject.userData);
        }
      }
    },
    
  },
  
};
</script>

<style scoped>
/* Style for the floating overlay */
#overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8); /* Semi-transparent black */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
</style>
