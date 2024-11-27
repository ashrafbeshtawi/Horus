import * as THREE from 'three';
import gsap from "gsap";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {FontLoader} from "three/examples/jsm/loaders/FontLoader.js";
import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry.js";

export default {
    initRenderer: (animateFunction, containerElementId) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animateFunction);
        document.getElementById(containerElementId).appendChild(renderer.domElement);
        return renderer;
    },
    addButtons: function (scene) {
        const fontLoader = new FontLoader();
        fontLoader.load(
            'https://unpkg.com/three@0.142.0/examples/fonts/helvetiker_regular.typeface.json',
            (font) => {
                const textGeometry = new TextGeometry('Click Me', {
                    font: font,
                    size: 0.5,
                    height: 0.2,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.02,
                    bevelSize: 0.05,
                    bevelSegments: 8
                });

                // Create a material for the text
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

                // Create a mesh for the text
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.set(11, 2, 30);
                scene.add(textMesh);

                // Add event listeners for mouse interactions
                textMesh.addEventListener('pointerover', () => {
                    textMesh.scale.set(1.1, 1.1, 1.1);
                });
                textMesh.addEventListener('pointerout', () => {
                    textMesh.scale.set(1, 1, 1);
                });
                textMesh.addEventListener('click', () => {
                    console.log('Button clicked!');
                });
            }
        );

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
    loadMusic: (audioListener, path) => {
        const sound = new THREE.Audio(audioListener);
        sound.autoplay = true;
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load( path, function( buffer ) {
            sound.setBuffer(buffer);
            sound.setLoop( true );
            sound.setVolume( 0.5 );
            sound.play();
            ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(event => {
                document.addEventListener(event, () => {
                    if (sound.context.state === 'suspended') {
                        sound.context.resume();
                    }
                }, false);
            });
        });
    }
}