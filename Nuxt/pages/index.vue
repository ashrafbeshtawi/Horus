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

export default {
  data() {
    return {
      isWebGL2Available: true,
      mixers: [],
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
    const scene = new THREE.Scene();
    
    scene.background = new THREE.Color('#87CEEB');
    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    const light = new THREE.AmbientLight( 0xffffff, 6);
    scene.add(light);
    
    graphicUtils.loadModell(
        '/town/scene.gltf',
        scene,
        ['The Life'],
        this.getMixersArray
    );
    this.loadWhales(scene)
    
    //const controls = new OrbitControls(this.camera, this.renderer.domElement);
    const clock = new THREE.Clock();
    const reference = this;
    function animate() {
      // animate the loaded modell
      for (let i = 0; i < reference.mixers.length; i++) {
        reference.mixers[i].update(clock.getDelta())
      }
      reference.renderer.render(scene, reference.camera);
      
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
    loadWhales: function (scene) {
      graphicUtils.loadModell(
          '/blue_whale/scene.gltf',
          scene,
          ['Swimming'],
          this.getMixersArray,
          0.01,
          [0, 0.5 * Math.PI, 0]
      );
    }
  },
};
</script>
