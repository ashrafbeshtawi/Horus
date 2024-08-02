import * as THREE from 'three';
import gsap from "gsap";

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
}