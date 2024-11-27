<template>
  <div>{{camera?.position.x}}, {{camera?.position.y}}, {{camera?.position.z}}</div>
  <section
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
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import graphicUtils from '../utils/3d.js';
import helper from '../utils/helper.js';

export default {
  data() {
    return {
      isWebGL2Available: true,
      mixers: [],
      whales: [],
      camera: null,
      scene: null,
      renderer: null,
      introPlayed: false
    }
  },
  mounted() {
    this.isWebGL2Available = WebGL.isWebGL2Available();
    this.renderer = graphicUtils.initRenderer(animate, 'container');
    this.camera = graphicUtils.getCamera();
    const audioListener = new THREE.AudioListener();
    this.camera.add(audioListener);
    graphicUtils.loadMusic(audioListener, '/music/background-music.mp3');
    
    const scene = new THREE.Scene();
    
    scene.background = new THREE.Color('#87CEEB');

    const light = new THREE.AmbientLight( 0xffffff, 6);
    scene.add(light);

    graphicUtils.loadModell(
        '/town/scene.gltf',
        scene,
        ['The Life'],
        this
    );
    this.loadWhales(scene)
    
    //const controls = new OrbitControls(this.camera, this.renderer.domElement);
    const clock = new THREE.Clock();
    const reference = this;
    function animate() {
      // animate the loaded modell
      const delta = clock.getDelta();
      for (let i = 0; i < reference.mixers.length; i++) {
        reference.mixers[i].update(delta);
      }
      reference.renderer.render(scene, reference.camera);
      // move whales
      for (let i = 0; i < reference.whales.length; i++) {
        let x = reference.whales[i].position.x;
        reference.whales[i].position.x = x > 150 ? -115 : reference.whales[i].position.x + 0.01; 
      }
      
      if (!reference.introPlayed) {
        reference.introPlayed = true;
        graphicUtils.moveToStartingPoint(reference.camera);
      }
    }
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
    }
  },
};
</script>
