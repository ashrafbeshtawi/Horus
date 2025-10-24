import * as THREE from "three";
import gsap from "gsap";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export default {
  initRenderer: (animateFunction, containerElementId) => {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animateFunction);
    document
      .getElementById(containerElementId)
      .appendChild(renderer.domElement);
    return renderer;
  },
  addButton: function (
    scene,
    clickableObjectsArray,
    title,
    config,
    buttonPosition,
    panelPosition,
    panelCameraPosition,
    panelCameraRotation,
    onClickCallback
  ) {
    const fontLoader = new FontLoader();
    fontLoader.load(
      "https://unpkg.com/three@0.142.0/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        // Button dimensions
        const buttonWidth = 3.5;
        const buttonHeight = 1.2;
        const buttonDepth = 0.3;
        const cornerRadius = 0.15;

        // Create rounded button using RoundedBoxGeometry alternative
        // Since THREE.Shape might not be available, we'll use a simple box with better materials
        const buttonGeometry = new THREE.BoxGeometry(
          buttonWidth,
          buttonHeight,
          buttonDepth,
          2,
          2,
          1
        );

        // Round the corners by modifying vertices
        const positionAttribute = buttonGeometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
          const x = positionAttribute.getX(i);
          const y = positionAttribute.getY(i);
          const z = positionAttribute.getZ(i);

          // Soften corners
          const edgeFactor = 0.9;
          if (
            Math.abs(x) > (buttonWidth / 2) * 0.8 &&
            Math.abs(y) > (buttonHeight / 2) * 0.8
          ) {
            positionAttribute.setX(i, x * edgeFactor);
            positionAttribute.setY(i, y * edgeFactor);
          }
        }
        buttonGeometry.attributes.position.needsUpdate = true;
        buttonGeometry.computeVertexNormals();

        // Modern gradient-like material
        const buttonMaterial = new THREE.MeshPhongMaterial({
          color: 0x5c6bc0,
          shininess: 30,
          flatShading: false,
        });

        const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
        buttonMesh.position.set(
          buttonPosition[0],
          buttonPosition[1],
          buttonPosition[2]
        );
        buttonMesh.castShadow = true;
        buttonMesh.receiveShadow = true;
        scene.add(buttonMesh);

        // Create shadow/depth layer
        const shadowGeometry = new THREE.BoxGeometry(
          buttonWidth,
          buttonHeight,
          0.1
        );
        const shadowMaterial = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.2,
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
          curveSegments: 12,
        });

        // Center the text
        textGeometry.computeBoundingBox();
        const textWidth =
          textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        const textHeight =
          textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;

        const textMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
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
        const accentGeometry = new THREE.BoxGeometry(
          buttonWidth * 0.8,
          0.08,
          0.08
        );
        const accentMaterial = new THREE.MeshPhongMaterial({
          color: 0x7e88c3,
          shininess: 80,
        });
        const accentMesh = new THREE.Mesh(accentGeometry, accentMaterial);
        accentMesh.position.set(
          buttonPosition[0],
          buttonPosition[1] + buttonHeight / 2 - 0.15,
          buttonPosition[2] + buttonDepth / 2
        );
        scene.add(accentMesh);

        // Store button data with enhanced colors
        buttonMesh.userData.originalColor = 0x5c6bc0;
        buttonMesh.userData.hoverColor = 0x7986cb;
        buttonMesh.userData.pressedColor = 0x3f51b5;
        buttonMesh.userData.title = title;
        buttonMesh.userData.config = config;
        buttonMesh.userData.onClick = onClickCallback;
        buttonMesh.userData.panelPosition = panelPosition;
        buttonMesh.userData.panelCameraPosition = panelCameraPosition;
        buttonMesh.userData.panelCameraRotation = panelCameraRotation;
        buttonMesh.userData.textMesh = textMesh;
        buttonMesh.userData.shadowMesh = shadowMesh;
        buttonMesh.userData.accentMesh = accentMesh;

        // Add to clickable objects array
        clickableObjectsArray.push(buttonMesh);
      }
    );
  },

  wrapText: function (text, maxWidth, fontSize) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    // Approximate character width (adjust based on your font)
    const charWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / charWidth);

    for (let word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
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

  createInfoPanel: function (
    scene,
    config,
    position,
    rotation,
    clickableObjectsArray,
    onBackCallback
  ) {
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
      opacity: 0,
    });

    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(position[0], position[1], position[2]);
    panel.rotation.set(rotation[0], rotation[1], rotation[2]);
    panelGroup.add(panel);
    objectsToAnimate.push(panel);

    // Add border
    const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0,
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.copy(panel.position);
    border.rotation.copy(panel.rotation);
    panelGroup.add(border);
    objectsToAnimate.push(border);

    const fontLoader = new FontLoader();
    fontLoader.load(
      "https://unpkg.com/three@0.142.0/examples/fonts/helvetiker_regular.typeface.json",
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
        const titleWidth =
          titleGeometry.boundingBox.max.x - titleGeometry.boundingBox.min.x;

        const titleMaterial = new THREE.MeshBasicMaterial({
          color: 0x333333,
          transparent: true,
          opacity: 0,
        });
        const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
        let titlePosition = new THREE.Vector3(
          -0.5 * titleWidth,
          panelHeight * 0.44,
          0.1
        );
        titlePosition = panel.localToWorld(titlePosition);

        titleMesh.position.set(
          titlePosition.x,
          titlePosition.y,
          titlePosition.z
        );
        titleMesh.rotation.copy(panel.rotation);
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
              const imageGeometry = new THREE.PlaneGeometry(
                imageWidth,
                imageHeight
              );
              const imageMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0,
              });
              const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);

              let imagePosition = new THREE.Vector3(
                0,
                0.1 * panelHeight,
                0.1
              );
              imagePosition = panel.localToWorld(imagePosition);

              imageMesh.position.set(
                imagePosition.x,
                imagePosition.y,
                imagePosition.z
              );
              imageMesh.rotation.copy(panel.rotation);

              panelGroup.add(imageMesh);
              objectsToAnimate.push(imageMesh);
            },
            undefined,
            (error) => {
              console.error("Error loading image:", error);
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
            const textWidth =
              textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;

            const textMaterial = new THREE.MeshBasicMaterial({
              color: 0x555555,
              transparent: true,
              opacity: 0,
            });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            let textPosition = new THREE.Vector3(
              textWidth * -0.5,
              currentY - index * lineHeight,
              0.1
            );
            textPosition = panel.localToWorld(textPosition);

            textMesh.position.set(
              textPosition.x,
              textPosition.y,
              textPosition.z
            );
            textMesh.rotation.copy(panel.rotation);
            panelGroup.add(textMesh);
            objectsToAnimate.push(textMesh);
          });

          currentY -= lines.length * lineHeight + 0.5;
        }

        // URL Button if provided
        if (config.url) {
          const urlButtonWidth = 4;
          const urlButtonHeight = 0.8;

          const urlButtonGeometry = new THREE.BoxGeometry(
            urlButtonWidth,
            urlButtonHeight,
            0.2
          );
          const urlButtonMaterial = new THREE.MeshBasicMaterial({
            color: 0x2196f3,
            transparent: true,
            opacity: 0,
          });
          const urlButton = new THREE.Mesh(
            urlButtonGeometry,
            urlButtonMaterial
          );

          let urlButtonPosition = new THREE.Vector3(
            0,
            currentY,
            0.1
          );
          urlButtonPosition = panel.localToWorld(urlButtonPosition);

          urlButton.position.set(
            urlButtonPosition.x,
            urlButtonPosition.y,
            urlButtonPosition.z
          );
          urlButton.rotation.copy(panel.rotation);
          panelGroup.add(urlButton);
          objectsToAnimate.push(urlButton);

          const urlText = config.urlText || "View More";
          const urlTextGeometry = new TextGeometry(urlText, {
            font: font,
            size: 0.3,
            height: 0.02,
            curveSegments: 12,
          });
          urlTextGeometry.computeBoundingBox();
          const urlTextWidth =
            urlTextGeometry.boundingBox.max.x -
            urlTextGeometry.boundingBox.min.x;
          const urlTextHeight =
            urlTextGeometry.boundingBox.max.y -
            urlTextGeometry.boundingBox.min.y;

          const urlTextMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
          });
          const urlTextMesh = new THREE.Mesh(urlTextGeometry, urlTextMaterial);

          let urlTextPosition = new THREE.Vector3(
            -urlTextWidth / 2,
            currentY - urlTextHeight / 2,
            0.25
          );
          urlTextPosition = panel.localToWorld(urlTextPosition);

          urlTextMesh.position.set(
            urlTextPosition.x,
            urlTextPosition.y,
            urlTextPosition.z
          );
          urlTextMesh.rotation.copy(panel.rotation);
          panelGroup.add(urlTextMesh);
          objectsToAnimate.push(urlTextMesh);

          urlButton.userData.originalColor = 0x2196f3;
          urlButton.userData.hoverColor = 0x42a5f5;
          urlButton.userData.url = config.url;
          urlButton.userData.onClick = () => {
            window.open(config.url, "_blank");
          };
          urlButton.userData.textMesh = urlTextMesh;
          clickableObjectsArray.push(urlButton);

          currentY -= 1.2;
        }

        // X Close button (upper left corner)
        const closeButtonSize = 0.8;
        const closeButtonGeometry = new THREE.BoxGeometry(
          closeButtonSize,
          closeButtonSize,
          0.2
        );
        const closeButtonMaterial = new THREE.MeshBasicMaterial({
          color: 0xff5252,
          transparent: true,
          opacity: 0,
        });
        const closeButton = new THREE.Mesh(
          closeButtonGeometry,
          closeButtonMaterial
        );

        let closeButtonPosition = new THREE.Vector3(
          -panelWidth / 2 + closeButtonSize / 2 + 0.3,
          panelHeight / 2 - closeButtonSize / 2 - 0.3,
          0.1
        );
        closeButtonPosition = panel.localToWorld(closeButtonPosition);

        closeButton.position.set(
          closeButtonPosition.x,
          closeButtonPosition.y,
          closeButtonPosition.z
        );
        closeButton.rotation.copy(panel.rotation);
        panelGroup.add(closeButton);
        objectsToAnimate.push(closeButton);

        const closeTextGeometry = new TextGeometry("X", {
          font: font,
          size: 0.5,
          height: 0.02,
          curveSegments: 12,
        });
        closeTextGeometry.computeBoundingBox();
        const closeTextWidth =
          closeTextGeometry.boundingBox.max.x -
          closeTextGeometry.boundingBox.min.x;
        const closeTextHeight =
          closeTextGeometry.boundingBox.max.y -
          closeTextGeometry.boundingBox.min.y;

        const closeTextMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
        });
        const closeTextMesh = new THREE.Mesh(closeTextGeometry, closeTextMaterial);

        let closeTextPosition = new THREE.Vector3(
          -panelWidth / 2 + closeButtonSize / 2 + 0.3 - closeTextWidth / 2,
          panelHeight / 2 - closeButtonSize / 2 - 0.3 - closeTextHeight / 2,
          0.25
        );
        closeTextPosition = panel.localToWorld(closeTextPosition);

        closeTextMesh.position.set(
          closeTextPosition.x,
          closeTextPosition.y,
          closeTextPosition.z
        );
        closeTextMesh.rotation.copy(panel.rotation);

        panelGroup.add(closeTextMesh);
        objectsToAnimate.push(closeTextMesh);

        closeButton.userData.originalColor = 0xff5252;
        closeButton.userData.hoverColor = 0xff7676;
        closeButton.userData.onClick = onBackCallback;
        closeButton.userData.textMesh = closeTextMesh;
        closeButton.userData.panelGroup = panelGroup;
        closeButton.userData.objectsToAnimate = objectsToAnimate;
        clickableObjectsArray.push(closeButton);
      }
    );

    scene.add(panelGroup);

    return { panelGroup, objectsToAnimate };
  },
  getCamera: function () {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight
    );
    camera.position.set(-46, 10, -23);
    camera.rotation.set(-2, -1, -2);
    return camera;
  },
  moveToStartingPoint: function (camera) {
    let anim = gsap.to(camera.position, {
      x: -13,
      y: 24,
      z: 53,
      duration: 0.5,
    });
    gsap.to(camera.rotation, { x: -0.4, y: -0.22, z: -0.1, duration: 0.5 });
    anim.then(() => {
      gsap.to(camera.position, { x: 12, y: 2.5, z: 38, duration: 0.5 });
      gsap.to(camera.rotation, {
        x: -0.043,
        y: 0.32,
        z: 0.0138,
        duration: 0.5,
      });
    });
  },
  loadModell: function (
    path,
    scene,
    neededAnimations,
    thisReference,
    scale = 1,
    rotation = [0, 0, 0],
    position = null,
    addToWhales = false
  ) {
    const loader = new GLTFLoader();
    const mixers = thisReference.getMixersArray();
    const models = thisReference.getWhalesArray();
    loader.load(
      path,
      function (gltf) {
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
          const clip = THREE.AnimationClip.findByName(
            clips,
            neededAnimations[i]
          );
          const action = mixer.clipAction(clip);
          action.play();
        }
        mixers.push(mixer);
        if (addToWhales) {
          models.push(model);
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
    audioLoader.load(path, function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.5);
    });
    return sound;
  },
  load3dMenuLibrary: async function () {
    return await import("three-mesh-ui");
  },
};
