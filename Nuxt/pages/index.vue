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
import {Matrix4, Vector3} from "three";

export default {
  data() {
    return {
      isWebGL2Available: true,
      mixers: [],
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

    
    this.loadModell('/town/scene.gltf', scene, ['The Life']);
    this.loadWhales(scene)
    
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    const clock = new THREE.Clock();
    const reference = this;
    function animate() {
      // animate the loaded modell
      for (let i = 0; i < reference.mixers.length; i++) {
        //console.log(reference);
        reference.mixers[i].update(clock.getDelta())

      }
      reference.renderer.render(scene, reference.camera);
      //reference.moveToStartingPoint(true);
    }
  },
  methods: {
    getCamera: function () {
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
      camera.position.set(-39, -3, 41);
      return camera;
    },
    loadModell: function (
        path,
        scene,
        neededAnimations,
        scale = 1,
        rotation = [0, 0, 0]
    ) {
      const loader = new GLTFLoader();
      const mixers = this.getMixersArray();
      loader.load(path, function (gltf) {
            const model = gltf.scene;
            model.scale.setScalar(scale);
            model.rotation.set(rotation[0], rotation[1], rotation[2])
            scene.add(model);
            let mixer = new THREE.AnimationMixer(model);
            const clips = gltf.animations;
            for (let i = 0; i < neededAnimations.length; i++) {
              const clip = THREE.AnimationClip.findByName(clips, neededAnimations[i]);
              const action = mixer.clipAction(clip);
              action.play();
            }
            mixers.push(mixer);
          },
          undefined,
          function (error) {
            console.error(error);
          }
      );
    },
    getMixersArray: function () {
      return this.mixers;
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
    loadWhales: function (scene) {
      this.loadModell(
          '/blue_whale/scene.gltf',
          scene,
          ['Swimming'],
          0.01,
          [0, 0.5 * Math.PI, 0]
      );
    }
  },
};
</script>
