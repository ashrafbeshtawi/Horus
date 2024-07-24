<template>
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

export default {
  data() {
    return {
      isWebGL2Available: true
    }
  },
  mounted() {
    this.isWebGL2Available = WebGL.isWebGL2Available();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    document.getElementById('container').appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(2, 3, 0);
    scene.add(cube);

    camera.position.z = 5;

    function animate() {
      if (cube.position.y > -2) {
        cube.position.y -= 0.02;
        cube.rotation.y += 0.02;
        cube.rotation.x += 0.02;
      }
      renderer.render(scene, camera);

    }
  },
};
</script>
