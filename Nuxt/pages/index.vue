<template>
  <button v-on:click="updateCoordinates">update coordinates</button>
  <div>{{coordinates}}</div>
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
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

export default {
  data() {
    return {
      isWebGL2Available: true,
      coordinates: '',
      mixer: null,
      calledFromAnimate: false
    }
  },
  mounted() {
    this.isWebGL2Available = WebGL.isWebGL2Available();
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    document.getElementById('container').appendChild(renderer.domElement);
    
    const scene = new THREE.Scene();
    const camera = this.getCamera();
    const cube = this.getCube(1, 1, 1, 5, 8, 0);
    const axesHelper = new THREE.AxesHelper(50);
    this.loadModell('/modell2/scene.gltf', scene, this.setMixer);
    const light = new THREE.AmbientLight( 0xffffff, 6);
    
    scene.add(light);
    scene.add(axesHelper);
    scene.add(cube);

    const controls = new OrbitControls(camera, renderer.domElement);
    const clock = new THREE.Clock();
    const reference = this;
    function animate() {
      // animate the loaded modell
      if (reference.mixer !== null) {
        reference.mixer.update(clock.getDelta())
      }
      reference.coordinates = camera.position;
      controls.update();
      renderer.render(scene, camera);
      reference.updateCoordinates(camera);
      reference.moveToStartingPoint(camera);
    }
  },
  methods: {
    getCamera: function () {
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(-39, -3, 41);
      camera.lookAt(0, 0, 0);
      return camera;
    },
    getCube: function (width, height, depth, x, y, z) {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(x, y, z);
      return cube;
    },
    loadModell: function (path, scene, setterFunction) {
      const loader = new GLTFLoader();
      loader.load(path, function (gltf) {
            const model = gltf.scene;
            scene.add(model);
            let mixer = new THREE.AnimationMixer(model);
            const clips = gltf.animations;
            const clip = THREE.AnimationClip.findByName(clips, 'The Life');
            const action = mixer.clipAction(clip);
            action.play();
            setterFunction(mixer);
          },
          undefined,
          function (error) {
            console.error(error);
          }
      );
    },
    setMixer: function (mixer) {
      this.mixer = mixer;
    },
    updateCoordinates: function (camera) {
      this.coordinates = camera.position;
    },
    moveToStartingPoint: function (camera, callFromAnimate) {
      if (callFromAnimate && this.calledFromAnimate) {
        return;
      }
      this.calledFromAnimate = true;
      gsap.to(camera.position, {x:30, y:20, z: 40, duration: 3}).then(
          () => {
            gsap.to(camera.position, {x:12, y:2, z: 31, duration: 1});
            camera.position.set(12, 2, 31)
          }
      )
    },

  },
};
</script>
