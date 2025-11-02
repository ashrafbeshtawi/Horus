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
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        // Button dimensions
        const buttonWidth = 3.5;
        const buttonHeight = 1.2;
        const buttonDepth = 0.3;

        // Create rounded button using RoundedBoxGeometry alternative
        // Since THREE.Shape might not be available, we'll use a simple box with better materials
        const buttonGeometry = new THREE.BoxGeometry(
          buttonWidth,
          buttonHeight,
          buttonDepth,
          4,
          4,
          2
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
        const buttonMaterial = new THREE.MeshStandardMaterial({
          color: 0x5c6bc0,
          metalness: 0.3,
          roughness: 0.4,
          emissive: 0x1a237e,
          emissiveIntensity: 0.1,
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
        // Add outline to button
        const edgesGeometry = new THREE.EdgesGeometry(buttonGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
          color: 0x3f51b5,
          linewidth: 2
        });
        const buttonOutline = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        buttonOutline.position.set(
          buttonPosition[0],
          buttonPosition[1],
          buttonPosition[2]
        );
        scene.add(buttonOutline);

        // Create text with simpler styling (no bevel initially)
        const textGeometry = new TextGeometry(title, {
          font: font,
          size: 0.4,
          height: 0.05,  // Increased from 0.1
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.01,
          bevelSegments: 3,
        });

        // Center the text
        textGeometry.computeBoundingBox();
        const textWidth =
          textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        const textHeight =
          textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;

        const textMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          metalness: 0.2,
          roughness: 0.5,
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
    // config.urls should be an array of {title, url} objects
    const panelGroup = new THREE.Group();
    const objectsToAnimate = [];

    // Panel dimensions
    const panelWidth = 16;
    const panelHeight = 12;

    // Create main panel background
    const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
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
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
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
          color: 0x2196f3,
          transparent: true,
          opacity: 0,
        });
        const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
        let titlePosition = new THREE.Vector3(
          -0.5 * titleWidth,
          panelHeight * 0.40,
          0.25
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

        // underline
        const underlineGeometry = new THREE.PlaneGeometry(panelWidth * 0.7, 0.05);
        const underlineMaterial = new THREE.MeshBasicMaterial({
          color: 0x2196f3,
          transparent: true,
          opacity: 0,
        });
        const underline = new THREE.Mesh(underlineGeometry, underlineMaterial);
        const underlinePos = panel.localToWorld(new THREE.Vector3(0, panelHeight * 0.39, 0.25));
        underline.position.copy(underlinePos);
        underline.rotation.copy(panel.rotation);
        panelGroup.add(underline);
        objectsToAnimate.push(underline);

        currentY = panelHeight * 0.3;

        // Determine layout: side by side if image exists, full width text otherwise
        const hasImage = !!config.imageUrl;
        const imageWidth = 6;
        const imageHeight = 6;
        const contentStartY = currentY;
        const padding = 0.5;

        let textStartX = -panelWidth / 2 + padding;
        let textMaxWidth = panelWidth - 2 * padding;

        if (hasImage) {
          // Reserve space for image on the left
          textStartX = -panelWidth / 2 + imageWidth + 2 * padding;
          textMaxWidth = (panelWidth - 3 * padding - imageWidth);
        }

        // Description text (wrapped) - positioned on the right or full width
        let textEndY = contentStartY;
        if (config.text) {
          const lines = this.wrapText(config.text, textMaxWidth, 0.3);
          const lineHeight = 0.5;
          const textHeight = 0.3;

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
              textStartX,
              contentStartY - textHeight / 2 - index * lineHeight,
              0.25
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

          textEndY = contentStartY - textHeight / 2 - lines.length * lineHeight;
        }

        // Image if provided - positioned on the left, side by side with text
        let imageEndY = contentStartY;
        if (hasImage) {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(
            config.imageUrl,
            (texture) => {
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
                -panelWidth / 2 + imageWidth / 2 + padding,
                contentStartY - imageHeight / 2,
                0.3
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
          imageEndY = contentStartY - imageHeight;
        }

        // URL Buttons if provided (array of {title, url} objects)
        // Position them at the bottom of the panel
        if (config.urls && Array.isArray(config.urls)) {
          const buttonHeight = 0.8;
          const buttonSpacing = 0.4;
          const buttonPadding = 0.6;
          const bottomMargin = 0.5;

          // Position buttons at the bottom of the panel
          currentY = -panelHeight / 2 + buttonHeight / 2 + bottomMargin;

          let buttonX = 0;
          const totalButtonsWidth = config.urls.reduce((sum, urlObj) => {
            const tempGeometry = new TextGeometry(urlObj.title, {
              font: font,
              size: 0.3,
              height: 0.02,
              curveSegments: 12,
            });
            tempGeometry.computeBoundingBox();
            const textWidth = tempGeometry.boundingBox.max.x - tempGeometry.boundingBox.min.x;
            return sum + textWidth + buttonPadding + buttonSpacing;
          }, 0) - buttonSpacing;

          let startX = -totalButtonsWidth / 2;

          config.urls.forEach((urlObj, index) => {
            // Calculate button width based on text width
            const urlTextGeometry = new TextGeometry(urlObj.title, {
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

            const urlButtonWidth = urlTextWidth + buttonPadding;

            const urlButtonGeometry = new THREE.BoxGeometry(
              urlButtonWidth,
              buttonHeight,
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
              startX + urlButtonWidth / 2,
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

            // Add button outline
            const urlButtonEdges = new THREE.EdgesGeometry(urlButtonGeometry);
            const urlButtonOutlineMaterial = new THREE.LineBasicMaterial({
              color: 0x1976d2,
              transparent: true,
              opacity: 0,
            });
            const urlButtonOutline = new THREE.LineSegments(
              urlButtonEdges,
              urlButtonOutlineMaterial
            );
            urlButtonOutline.position.copy(urlButton.position);
            urlButtonOutline.rotation.copy(urlButton.rotation);
            panelGroup.add(urlButtonOutline);
            objectsToAnimate.push(urlButtonOutline);

            const urlTextMaterial = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0,
            });
            const urlTextMesh = new THREE.Mesh(urlTextGeometry, urlTextMaterial);

            let urlTextPosition = new THREE.Vector3(
              startX + urlButtonWidth / 2 - urlTextWidth / 2,
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
            urlButton.userData.url = urlObj.url;
            urlButton.userData.onClick = () => {
              window.open(urlObj.url, "_blank");
            };
            urlButton.userData.textMesh = urlTextMesh;
            urlButton.userData.outline = urlButtonOutline;
            clickableObjectsArray.push(urlButton);

            startX += urlButtonWidth + buttonSpacing;
          });
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

        // Add close button outline
        const closeButtonEdges = new THREE.EdgesGeometry(closeButtonGeometry);
        const closeButtonOutlineMaterial = new THREE.LineBasicMaterial({
          color: 0xd32f2f,
          transparent: true,
          opacity: 0,
        });
        const closeButtonOutline = new THREE.LineSegments(
          closeButtonEdges,
          closeButtonOutlineMaterial
        );
        closeButtonOutline.position.copy(closeButton.position);
        closeButtonOutline.rotation.copy(closeButton.rotation);
        panelGroup.add(closeButtonOutline);
        objectsToAnimate.push(closeButtonOutline);

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
        closeButton.userData.outline = closeButtonOutline;
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
      x: 21,
      y: 20,
      z: 71,
      duration: 3,
    });
    gsap.to(camera.rotation, { x: -0.28, y: 0.27, z: 0.07, duration: 3 });
    anim.then(() => {
      gsap.to(camera.position, { x: 11, y: 6, z: 38, duration: 3 });
      gsap.to(camera.rotation, {
        x: -0.15,
        y: 0.28,
        z: 0.04,
        duration: 3,
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
