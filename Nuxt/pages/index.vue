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
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
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

      // Skills Section - Backend Toolkit
      graphicUtils.addButton(
        this.scene, 
        this.clickableObjects,
        'Backend',
        {
          title: 'Backend Toolkit',
          text: 'My core backend development skills include PHP and Symfony for robust application development, PostgreSQL for reliable data management, RESTful API design for seamless integrations, Docker for containerization, and JSON Schema for data validation.',
          url: null,
          urlText: null
        },
        [9.3, 5, 30],
        [20, 8, 10],
        [20, 8, 24],
        [0, 0, 0],
        this.handleButtonClick
      );

      // Skills Section - AI & Crypto
      graphicUtils.addButton(
        this.scene, 
        this.clickableObjects,
        'AI & Crypto',
        {
          title: 'AI & Crypto Adventures',
          text: 'Exploring the cutting edge of technology through Python for AI development, Solidity for smart contract programming, and Next.js for modern web applications. I am passionate about building intelligent systems and blockchain solutions.',
          imageUrl: 'https://picsum.photos/800/500?random=2',
          url: null,
          urlText: null
        },
        [9.3, 3.5, 30],
        [-21, 16, 21],
        [-31, 21, 26],
        [-0.7, -0.8, -0.5],
        this.handleButtonClick
      );

      // Skills Section - Languages
      graphicUtils.addButton(
        this.scene, 
        this.clickableObjects,
        'Languages',
        {
          title: 'Languages I Speak',
          text: 'Communication is key, and I am fortunate to be fluent in German, English, and Arabic. This allows me to connect and collaborate effectively across diverse environments and cultures.',
          imageUrl: null,
          url: null,
          urlText: null
        },
        [9.3, 2, 30],
        [-21, 16, 21],
        [-31, 21, 26],
        [-0.7, -0.8, -0.5],
        this.handleButtonClick
      );

      // Projects Section - AmygdalaGPT
      graphicUtils.addButton(
        this.scene, 
        this.clickableObjects,
        'AmygdalaGPT',
        {
          title: 'AmygdalaGPT',
          text: 'A memory-augmented LLM system that enhances the natural language processing capabilities of large language models by integrating an external memory module. This project aims to make LLMs more dynamic and context-aware.',
          imageUrl: 'https://picsum.photos/800/500?random=3',
          url: 'https://github.com/ashrafbeshtawi/AmygdalaGPT',
          urlText: 'View Project'
        },
        [9.3, 0.5, 30],
        [-21, 16, 21],
        [-31, 21, 26],
        [-0.7, -0.8, -0.5],
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
