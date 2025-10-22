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
    addButton: function (scene, clickableObjectsArray, title, config, buttonPosition, panelPosition, panelCameraPosition, onClickCallback) {
        const fontLoader = new FontLoader();
        fontLoader.load(
            'https://unpkg.com/three@0.142.0/examples/fonts/helvetiker_regular.typeface.json',
            (font) => {
                // Button dimensions
                const buttonWidth = 3.5;
                const buttonHeight = 1.2;
                const buttonDepth = 0.3;
                const cornerRadius = 0.15;
                
                // Create rounded button using RoundedBoxGeometry alternative
                // Since THREE.Shape might not be available, we'll use a simple box with better materials
                const buttonGeometry = new THREE.BoxGeometry(buttonWidth, buttonHeight, buttonDepth, 2, 2, 1);
                
                // Round the corners by modifying vertices
                const positionAttribute = buttonGeometry.attributes.position;
                for (let i = 0; i < positionAttribute.count; i++) {
                    const x = positionAttribute.getX(i);
                    const y = positionAttribute.getY(i);
                    const z = positionAttribute.getZ(i);
                    
                    // Soften corners
                    const edgeFactor = 0.9;
                    if (Math.abs(x) > buttonWidth / 2 * 0.8 && Math.abs(y) > buttonHeight / 2 * 0.8) {
                        positionAttribute.setX(i, x * edgeFactor);
                        positionAttribute.setY(i, y * edgeFactor);
                    }
                }
                buttonGeometry.attributes.position.needsUpdate = true;
                buttonGeometry.computeVertexNormals();
                
                // Modern gradient-like material
                const buttonMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0x5C6BC0,
                    shininess: 30,
                    flatShading: false
                });
                
                const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
                buttonMesh.position.set(buttonPosition[0], buttonPosition[1], buttonPosition[2]);
                buttonMesh.castShadow = true;
                buttonMesh.receiveShadow = true;
                scene.add(buttonMesh);
                
                // Create shadow/depth layer
                const shadowGeometry = new THREE.BoxGeometry(buttonWidth, buttonHeight, 0.1);
                const shadowMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.2
                });
                const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
                shadowMesh.position.set(
                    buttonPosition[0],
                    buttonPosition[1] - 0.08,
                    buttonPosition[2] - 0.15
                );
                scene.add(shadowMesh);
                
                // Create text with simpler styling (no bevel initially)
                const textGeometry = new TextGeometry(title, {
                    font: font,
                    size: 0.4,
                    height: 0.1,
                    curveSegments: 12
                });
                
                // Center the text
                textGeometry.computeBoundingBox();
                const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
                
                const textMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xFFFFFF
                });
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.castShadow = true;
                
                // Position text centered on button
                textMesh.position.set(
                    buttonPosition[0] - textWidth / 2,
                    buttonPosition[1] - textHeight / 2,
                    buttonPosition[2] + buttonDepth / 2 + 0.1
                );
                
                scene.add(textMesh);
                
                // Add subtle accent line on top
                const accentGeometry = new THREE.BoxGeometry(buttonWidth * 0.8, 0.08, 0.08);
                const accentMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0x7E88C3,
                    shininess: 80
                });
                const accentMesh = new THREE.Mesh(accentGeometry, accentMaterial);
                accentMesh.position.set(
                    buttonPosition[0],
                    buttonPosition[1] + buttonHeight / 2 - 0.15,
                    buttonPosition[2] + buttonDepth / 2
                );
                scene.add(accentMesh);
                
                // Store button data with enhanced colors
                buttonMesh.userData.originalColor = 0x5C6BC0;
                buttonMesh.userData.hoverColor = 0x7986CB;
                buttonMesh.userData.pressedColor = 0x3F51B5;
                buttonMesh.userData.title = title;
                buttonMesh.userData.config = config;
                buttonMesh.userData.onClick = onClickCallback;
                buttonMesh.userData.panelPosition = panelPosition;
                buttonMesh.userData.panelCameraPosition = panelCameraPosition;
                buttonMesh.userData.textMesh = textMesh;
                buttonMesh.userData.shadowMesh = shadowMesh;
                buttonMesh.userData.accentMesh = accentMesh;
                
                // Add to clickable objects array
                clickableObjectsArray.push(buttonMesh);
            }
        );
    },

    wrapText: function(text, maxWidth, fontSize) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        // Approximate character width (adjust based on your font)
        const charWidth = fontSize * 0.6;
        const maxChars = Math.floor(maxWidth / charWidth);
        
        for (let word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            if (testLine.length > maxChars && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    },

    createInfoPanel: function(scene, config, position, clickableObjectsArray, onBackCallback) {
        const panelGroup = new THREE.Group();
        const objectsToAnimate = [];
        
        // Panel dimensions
        const panelWidth = 16;
        const panelHeight = 12;
        
        // Create main panel background
        const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
        const panelMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xf5f5f5,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(position[0], position[1], position[2]);
        panelGroup.add(panel);
        objectsToAnimate.push(panel);
        
        // Add border
        const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0
        });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.position.copy(panel.position);
        panelGroup.add(border);
        objectsToAnimate.push(border);
        
        const fontLoader = new FontLoader();
        fontLoader.load(
            'https://unpkg.com/three@0.142.0/examples/fonts/helvetiker_regular.typeface.json',
            (font) => {
                let currentY = panelHeight / 2 - 1;
                
                // Title
                const titleGeometry = new TextGeometry(config.title, {
                    font: font,
                    size: 0.5,
                    height: 0.05,
                    curveSegments: 12,
                });
                titleGeometry.computeBoundingBox();
                const titleWidth = titleGeometry.boundingBox.max.x - titleGeometry.boundingBox.min.x;
                
                const titleMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x333333,
                    transparent: true,
                    opacity: 0
                });
                const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
                titleMesh.position.set(
                    position[0] - titleWidth / 2,
                    position[1] + currentY,
                    position[2] + 0.1
                );
                panelGroup.add(titleMesh);
                objectsToAnimate.push(titleMesh);
                
                currentY -= 1.5;
                
                // Image if provided
                if (config.imageUrl) {
                    const textureLoader = new THREE.TextureLoader();
                    textureLoader.load(
                        config.imageUrl,
                        (texture) => {
                            const imageWidth = 10;
                            const imageHeight = 6.5;
                            const imageGeometry = new THREE.PlaneGeometry(imageWidth, imageHeight);
                            const imageMaterial = new THREE.MeshBasicMaterial({ 
                                map: texture,
                                transparent: true,
                                opacity: 0
                            });
                            const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);
                            imageMesh.position.set(
                                position[0],
                                position[1] * 1.2, 
                                position[2] + 0.1
                            );
                            panelGroup.add(imageMesh);
                            objectsToAnimate.push(imageMesh);
                        },
                        undefined,
                        (error) => {
                            console.error('Error loading image:', error);
                        }
                    );
                    currentY -= 6;
                }
                
                // Description text (wrapped)
                if (config.text) {
                    const lines = this.wrapText(config.text, panelWidth - 2, 0.3);
                    const lineHeight = 0.5;
                    
                    lines.forEach((line, index) => {
                        const textGeometry = new TextGeometry(line, {
                            font: font,
                            size: 0.3,
                            height: 0.02,
                            curveSegments: 12,
                        });
                        textGeometry.computeBoundingBox();
                        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                        
                        const textMaterial = new THREE.MeshBasicMaterial({ 
                            color: 0x555555,
                            transparent: true,
                            opacity: 0
                        });
                        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                        textMesh.position.set(
                            position[0] - textWidth / 2,
                            position[1] + currentY - (index * lineHeight),
                            position[2] + 0.1
                        );
                        panelGroup.add(textMesh);
                        objectsToAnimate.push(textMesh);
                    });
                    
                    currentY -= (lines.length * lineHeight) + 0.5;
                }
                
                // URL Button if provided
                if (config.url) {
                    const urlButtonWidth = 4;
                    const urlButtonHeight = 0.8;
                    
                    const urlButtonGeometry = new THREE.BoxGeometry(urlButtonWidth, urlButtonHeight, 0.2);
                    const urlButtonMaterial = new THREE.MeshBasicMaterial({ 
                        color: 0x2196F3,
                        transparent: true,
                        opacity: 0
                    });
                    const urlButton = new THREE.Mesh(urlButtonGeometry, urlButtonMaterial);
                    urlButton.position.set(
                        position[0],
                        position[1] + currentY,
                        position[2] + 0.1
                    );
                    panelGroup.add(urlButton);
                    objectsToAnimate.push(urlButton);
                    
                    const urlText = config.urlText || 'View More';
                    const urlTextGeometry = new TextGeometry(urlText, {
                        font: font,
                        size: 0.3,
                        height: 0.02,
                        curveSegments: 12,
                    });
                    urlTextGeometry.computeBoundingBox();
                    const urlTextWidth = urlTextGeometry.boundingBox.max.x - urlTextGeometry.boundingBox.min.x;
                    const urlTextHeight = urlTextGeometry.boundingBox.max.y - urlTextGeometry.boundingBox.min.y;
                    
                    const urlTextMaterial = new THREE.MeshBasicMaterial({ 
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0
                    });
                    const urlTextMesh = new THREE.Mesh(urlTextGeometry, urlTextMaterial);
                    urlTextMesh.position.set(
                        position[0] - urlTextWidth / 2,
                        position[1] + currentY - urlTextHeight / 2,
                        position[2] + 0.25
                    );
                    panelGroup.add(urlTextMesh);
                    objectsToAnimate.push(urlTextMesh);
                    
                    urlButton.userData.originalColor = 0x2196F3;
                    urlButton.userData.hoverColor = 0x42A5F5;
                    urlButton.userData.url = config.url;
                    urlButton.userData.onClick = () => {
                        window.open(config.url, '_blank');
                    };
                    urlButton.userData.textMesh = urlTextMesh;
                    clickableObjectsArray.push(urlButton);
                    
                    currentY -= 1.2;
                }
                
                // Back button
                const backButtonWidth = 3;
                const backButtonHeight = 0.8;
                
                const backButtonGeometry = new THREE.BoxGeometry(backButtonWidth, backButtonHeight, 0.2);
                const backButtonMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xff5252,
                    transparent: true,
                    opacity: 0
                });
                const backButton = new THREE.Mesh(backButtonGeometry, backButtonMaterial);
                backButton.position.set(
                    position[0],
                    position[1] - panelHeight / 2 - 1,
                    position[2] + 0.1
                );
                panelGroup.add(backButton);
                objectsToAnimate.push(backButton);
                
                const backTextGeometry = new TextGeometry('Back', {
                    font: font,
                    size: 0.3,
                    height: 0.02,
                    curveSegments: 12,
                });
                backTextGeometry.computeBoundingBox();
                const backTextWidth = backTextGeometry.boundingBox.max.x - backTextGeometry.boundingBox.min.x;
                const backTextHeight = backTextGeometry.boundingBox.max.y - backTextGeometry.boundingBox.min.y;
                
                const backTextMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0
                });
                const backTextMesh = new THREE.Mesh(backTextGeometry, backTextMaterial);
                backTextMesh.position.set(
                    position[0] - backTextWidth / 2,
                    position[1] - panelHeight / 2 - 1 - backTextHeight / 2,
                    position[2] + 0.25
                );
                panelGroup.add(backTextMesh);
                objectsToAnimate.push(backTextMesh);
                
                backButton.userData.originalColor = 0xff5252;
                backButton.userData.hoverColor = 0xff7676;
                backButton.userData.onClick = onBackCallback;
                backButton.userData.textMesh = backTextMesh;
                backButton.userData.panelGroup = panelGroup;
                backButton.userData.objectsToAnimate = objectsToAnimate;
                clickableObjectsArray.push(backButton);
            }
        );
        
        scene.add(panelGroup);
        
        return { panelGroup, objectsToAnimate };
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
                gsap.to(camera.position, {x:12, y:2.5, z: 38, duration: 1});
                gsap.to(camera.rotation, {x:-0.043, y:0.32, z: 0.0138, duration: 1});
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