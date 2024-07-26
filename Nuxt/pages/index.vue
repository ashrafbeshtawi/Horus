<template>
  <button v-on:click="switchLookAt">look at</button>

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
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls.js";

export default {
  data() {
    return {
      isWebGL2Available: true,
      mixer: null,
      camera: null,
      scene: null,
      renderer: null,
      calledFromAnimate: false
    }
  },
  mounted() {
    this.isWebGL2Available = WebGL.isWebGL2Available();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setAnimationLoop(animate);
    document.getElementById('container').appendChild(this.renderer.domElement);
    
    this.camera = this.getCamera();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#87CEEB');

    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    const light = new THREE.AmbientLight( 0xffffff, 6);
    scene.add(light);

    this.loadModell('/modell2/scene.gltf', scene);
    
    //const controls = new OrbitControls(this.camera, this.renderer.domElement);
    const clock = new THREE.Clock();
    const reference = this;
    function animate() {
      // animate the loaded modell
      if (reference.mixer !== null) {
        reference.mixer.update(clock.getDelta())
      }
      reference.renderer.render(scene, reference.camera);
      reference.moveToStartingPoint(true);
    }
  },
  methods: {
    getCamera: function () {
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
      camera.position.set(-39, -3, 41);
      return camera;
    },
    loadModell: function (path, scene) {
      const loader = new GLTFLoader();
      const setterFunction = this.setMixer;
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
    switchLookAt: function () {
      const coordinates = prompt('enter x,y,z:').split(',');
      this.camera.lookAt(
      parseInt(coordinates[0]),
          parseInt(coordinates[1]),
          parseInt(coordinates[2])
      );
    },
    moveToStartingPoint: function (callFromAnimate) {
      if (callFromAnimate && this.calledFromAnimate) {
        return;
      }
      this.calledFromAnimate = true;
      let anim = gsap.to(this.camera.position, {x:30, y:20, z: 40, duration: 3});
      anim.then(
          () => {
            gsap.to(this.camera.position, {x:11, y:2, z: 30, duration: 1});
          }
      )
    },

  },
};
</script>
