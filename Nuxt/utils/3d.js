import * as THREE from 'three';
import gsap from "gsap";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default {
    initRenderer: (animateFunction, containerElementId) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animateFunction);
        document.getElementById(containerElementId).appendChild(renderer.domElement);
        return renderer;
    },
    getCamera: function () {
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
        camera.position.set(-39, -3, 41);
        return camera;
    },
    moveToStartingPoint: function (camera) {
        let anim = gsap.to(camera.position, {x:30, y:20, z: 40, duration: 3});
        anim.then(
            () => {
                gsap.to(camera.position, {x:11, y:2, z: 30, duration: 1});
            }
        )
    },
    loadModell: function (
        path,
        scene,
        neededAnimations,
        thisReference,
        scale = 1,
        rotation = [0, 0, 0],
        position = null,
        addToWhales = false,
    ) {
        const loader = new GLTFLoader();
        const mixers = thisReference.getMixersArray();
        const models = thisReference.getWhalesArray();
        loader.load(path, function (gltf) {
                let model = gltf.scene;
                model.scale.setScalar(scale);
                model.rotation.set(rotation[0], rotation[1], rotation[2]);
                if (position) {
                    model.position.set(position[0], position[1], position[2]);
                }
                scene.add(model);
                let mixer = new THREE.AnimationMixer(model);
                const clips = gltf.animations;
                for (let i = 0; i < neededAnimations.length; i++) {
                    const clip = THREE.AnimationClip.findByName(clips, neededAnimations[i]);
                    const action = mixer.clipAction(clip);
                    action.play();
                }
                mixers.push(mixer);
                if (addToWhales) {
                    models.push(model)
                }
            },
            undefined,
            function (error) {
                console.error(error);
            }
        );
    },
}