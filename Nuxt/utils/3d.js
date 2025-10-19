import * as THREE from 'three';
import gsap from "gsap";
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
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
    addButtons: function (scene, clickableObjectsArray) {
        const fontLoader = new FontLoader();
        fontLoader.load(
            'https://unpkg.com/three@0.142.0/examples/fonts/helvetiker_regular.typeface.json',
            (font) => {
                // Create button background (simple box)
                const buttonWidth = 3;
                const buttonHeight = 1;
                const buttonDepth = 0.2;
                
                const buttonGeometry = new THREE.BoxGeometry(buttonWidth, buttonHeight, buttonDepth);
                const buttonMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x4CAF50
                });
                
                const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
                buttonMesh.position.set(11, 2, 30);
                scene.add(buttonMesh);
                
                // Create text
                const textGeometry = new TextGeometry('Click Me', {
                    font: font,
                    size: 0.35,
                    height: 0.05,
                    curveSegments: 12,
                });
                
                // Center the text
                textGeometry.computeBoundingBox();
                const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
                
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                
                // Position text centered on button (in front of it)
                textMesh.position.set(
                    11 - textWidth / 2,
                    2 - textHeight / 2,
                    30 + buttonDepth / 2 + 0.05
                );
                
                scene.add(textMesh);
                
                // Add to clickable objects array
                clickableObjectsArray.push(buttonMesh);
                
                // Store original color for hover effects
                buttonMesh.userData.originalColor = 0x4CAF50;
                buttonMesh.userData.hoverColor = 0x66BB6A;
            }
        );
    },
    getCamera: function () {
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
        camera.position.set(-46, 10, -23);
        camera.rotation.set(-2, -1, -2);
        return camera;
    },
    moveToStartingPoint: function (camera) {
        let anim = gsap.to(camera.position, {x:-13, y:24, z: 53, duration: 3});
        gsap.to(camera.rotation, {x:-0.4, y:-0.22, z: -0.1, duration: 3})
        anim.then(
            () => {
                gsap.to(camera.position, {x:12, y:1.7, z: 29, duration: 1});
                gsap.to(camera.rotation, {x:-0.05, y:0.4, z: 0.02, duration: 1});
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
        audioLoader.load(path, function( buffer) {
            sound.setBuffer(buffer);
            sound.setLoop( true );
            sound.setVolume( 0.5 );
        });
        return sound;
    },
    load3dMenuLibrary: async function() {
        return await import('three-mesh-ui');
    }
}