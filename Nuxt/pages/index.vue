<template>
  <v-btn @click="this.debugCamera()">Show Position</v-btn>
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
    }
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
    
    const audioListener = new THREE.AudioListener();
    this.camera.add(audioListener);
    
    // adding music
    this.soundObject = graphicUtils.loadMusic(audioListener, '/music/background-music.mp3');

    graphicUtils.addButtons(this.scene);
    
    // setting light & background color
    this.scene.background = new THREE.Color('#87CEEB');
    const light = new THREE.AmbientLight(0xffffff, 6);
    this.scene.add(light);

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
      //console.log(this.camera.position);
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

    }
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
