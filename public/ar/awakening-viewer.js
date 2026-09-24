// 第5イベント専用：三人の力で、すべてのたまごを目覚めさせる
const container = document.getElementById("camera");
let ar;
let stopped = false;
let completed = false;
const textures = [];
const geometries = [];
const materials = [];
const sounds = [];
let focusDecoration;
let ritualMessage;

const notify = (status, detail = {}) => {
  if (!stopped) window.parent.postMessage({ type: "ksu-event-ar", status, ...detail }, window.location.origin);
};

function getEggLayout(count) {
  if (count === 1) return [{ x: 0, y: 0.02, scale: 0.56 }];
  if (count === 2) return [{ x: -0.29, y: 0.05, scale: 0.42 }, { x: 0.29, y: 0.05, scale: 0.42 }];
  if (count === 3) return [{ x: 0, y: 0.25, scale: 0.36 }, { x: -0.29, y: -0.12, scale: 0.36 }, { x: 0.29, y: -0.12, scale: 0.36 }];
  return [
    { x: -0.25, y: 0.24, scale: 0.31 }, { x: 0.25, y: 0.24, scale: 0.31 },
    { x: -0.25, y: -0.16, scale: 0.31 }, { x: 0.25, y: -0.16, scale: 0.31 },
  ];
}

const stop = () => {
  if (stopped) return;
  stopped = true;
  ar?.renderer.setAnimationLoop(null);
  ar?.controller?.stopProcessVideo();
  ar?.controller?.worker?.terminate();
  container.querySelectorAll("video").forEach((video) => {
    video.srcObject?.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  });
  sounds.forEach((sound) => sound.close());
  focusDecoration?.dispose();
  ritualMessage?.dispose();
  textures.forEach((item) => item.dispose());
  geometries.forEach((item) => item.dispose());
  materials.forEach((item) => item.dispose());
  ar?.renderer.dispose();
};

window.addEventListener("pagehide", stop, { once: true });
window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  console.error("目覚めARの起動に失敗しました:", event.reason);
  notify("error");
  stop();
});

async function start() {
  try {
    const [THREE, { MindARThree }, { createSoundEffects }, { createFocusDecoration }, { createRitualMessage }] = await Promise.all([
      import("three"),
      import("/ar/vendor/mindar-image-three.prod.js"),
      import("/ar/sound-effects.mjs"),
      import("/ar/focus-decoration.mjs"),
      import("/ar/ritual-message.mjs"),
    ]);
    const params = new URLSearchParams(window.location.search);
    const rawPlayers = JSON.parse(params.get("players") || "[]");
    const sanitizeState = (state) => ({
      egg: /^\/egg_[12]_[1-4]\.png$/.test(state?.egg) ? state.egg : "/egg_1_1.png",
      nest: /^\/nest_[1-3]\.png$/.test(state?.nest || "") ? state.nest : null,
      pattern: /^\/pattern_[1-3]\.png$/.test(state?.pattern || "") ? state.pattern : null,
    });
    const players = Array.isArray(rawPlayers)
      ? rawPlayers.slice(0, 4).map((player) => sanitizeState(player?.before))
      : [];
    if (!players.length) throw new Error("Player data not found");

    const targetResponse = await fetch("/ar/targets.mind");
    if (!targetResponse.ok) throw new Error("Target file not found");
    await targetResponse.arrayBuffer();

    const loader = new THREE.TextureLoader();
    const loadTexture = async (path) => {
      if (!path) return null;
      const texture = await loader.loadAsync(path);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      return texture;
    };
    const crackTexture = await loadTexture("/crack.png");
    const characterTextures = await Promise.all([
      loadTexture("/ar/characters/koyamachan.png"),
      loadTexture("/ar/characters/musubukun.png"),
      loadTexture("/ar/characters/yamachan.png"),
    ]);

    ar = new MindARThree({
      container,
      imageTargetSrc: "/ar/targets.mind",
      maxTrack: 1,
      uiLoading: "no",
      uiScanning: "no",
      uiError: "no",
    });
    const anchor = ar.addAnchor(0);
    focusDecoration = createFocusDecoration({ THREE, scene: ar.scene, reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    ritualMessage = createRitualMessage({ THREE, container, camera: ar.camera });
    const eggs = [];
    const cracks = [];
    const glows = [];
    const layout = getEggLayout(players.length);

    for (let index = 0; index < players.length; index++) {
      const state = players[index];
      const place = layout[index];
      const group = new THREE.Group();
      group.position.set(place.x, place.y, 0);
      group.scale.setScalar(place.scale);
      anchor.group.add(group);

      const [eggTexture, nestTexture, patternTexture] = await Promise.all([
        loadTexture(state.egg), loadTexture(state.nest), loadTexture(state.pattern),
      ]);
      const planeGeometry = new THREE.PlaneGeometry(1, 1);
      geometries.push(planeGeometry);

      if (nestTexture) {
        const nestMaterial = new THREE.MeshBasicMaterial({ map: nestTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        materials.push(nestMaterial);
        const nest = new THREE.Mesh(planeGeometry, nestMaterial);
        nest.renderOrder = 1;
        group.add(nest);
      }

      const glowGeometry = new THREE.CircleGeometry(0.48, 48);
      const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffefa0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      geometries.push(glowGeometry);
      materials.push(glowMaterial);
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.z = 0.015;
      glow.renderOrder = 2;
      group.add(glow);
      glows.push(glow);

      const eggMaterial = new THREE.MeshBasicMaterial({ map: eggTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      materials.push(eggMaterial);
      const egg = new THREE.Mesh(planeGeometry, eggMaterial);
      egg.position.set(0, nestTexture ? 0.11 : 0, 0.02);
      egg.scale.setScalar(nestTexture ? 0.78 : 1);
      egg.renderOrder = 3;
      group.add(egg);
      eggs.push(egg);

      if (patternTexture) {
        const patternMaterial = new THREE.MeshBasicMaterial({ map: patternTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        materials.push(patternMaterial);
        const pattern = new THREE.Mesh(planeGeometry, patternMaterial);
        pattern.position.z = 0.02;
        pattern.renderOrder = 4;
        egg.add(pattern);
      }

      const crackMaterial = new THREE.MeshBasicMaterial({ map: crackTexture, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      materials.push(crackMaterial);
      const crack = new THREE.Mesh(planeGeometry, crackMaterial);
      crack.position.z = 0.04;
      crack.renderOrder = 5;
      crack.visible = false;
      egg.add(crack);
      cracks.push(crack);
    }

    const characterPositions = [
      { x: -0.67, y: -0.48, h: 0.46 },
      { x: 0.67, y: -0.48, h: 0.5 },
      { x: 0, y: 0.66, h: 0.43 },
    ];
    const characters = [];
    const characterBases = [];
    const characterMasks = [];
    for (let index = 0; index < 3; index++) {
      const texture = characterTextures[index];
      const place = characterPositions[index];
      const aspect = texture.image.width / texture.image.height;
      const geometry = new THREE.PlaneGeometry(place.h * aspect, place.h);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      geometries.push(geometry);
      materials.push(material);
      const character = new THREE.Mesh(geometry, material);
      character.position.set(place.x, place.y, 0.12);
      character.renderOrder = 10;
      anchor.group.add(character);
      characters.push(character);
      characterBases.push({ x: place.x, y: place.y, scale: 1 });

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = texture.image.width;
      maskCanvas.height = texture.image.height;
      const context = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Character mask unavailable");
      context.drawImage(texture.image, 0, 0);
      characterMasks.push(context.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
      sounds.push(createSoundEffects(index + 1));
    }

    // ほしみ〜るちゃんは星、むすぶくんはハート、神山くんは魔法の渦を出す
    const starShape = new THREE.Shape();
    for (let index = 0; index < 10; index++) {
      const angle = Math.PI / 2 + index * Math.PI / 5;
      const radius = index % 2 === 0 ? 0.04 : 0.018;
      if (index === 0) starShape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else starShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    starShape.closePath();
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.04);
    heartShape.bezierCurveTo(-0.01, -0.02, -0.07, 0, -0.07, 0.04);
    heartShape.bezierCurveTo(-0.07, 0.09, -0.02, 0.1, 0, 0.055);
    heartShape.bezierCurveTo(0.02, 0.1, 0.07, 0.09, 0.07, 0.04);
    heartShape.bezierCurveTo(0.07, 0, 0.01, -0.02, 0, -0.04);
    const starGeometry = new THREE.ShapeGeometry(starShape);
    const heartGeometry = new THREE.ShapeGeometry(heartShape);
    const orbGeometry = new THREE.CircleGeometry(0.025, 14);
    geometries.push(starGeometry, heartGeometry, orbGeometry);
    const createEffects = (geometry, color, count) => Array.from({ length: count }, () => {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      materials.push(material);
      const effect = new THREE.Mesh(geometry, material);
      effect.visible = false;
      effect.position.z = 0.1;
      effect.renderOrder = 8;
      anchor.group.add(effect);
      return effect;
    });
    const stars = createEffects(starGeometry, 0xffdc58, 12);
    const hearts = createEffects(heartGeometry, 0xff82a8, 10);
    const magicOrbs = createEffects(orbGeometry, 0x55e0aa, 12);
    const ringGeometry = new THREE.RingGeometry(0.27, 0.29, 6);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x55e0aa, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    geometries.push(ringGeometry);
    materials.push(ringMaterial);
    const magicRing = new THREE.Mesh(ringGeometry, ringMaterial);
    magicRing.visible = false;
    magicRing.position.z = 0.09;
    magicRing.renderOrder = 8;
    anchor.group.add(magicRing);
    const hideEffects = () => {
      [...stars, ...hearts, ...magicOrbs].forEach((effect) => { effect.visible = false; });
      magicRing.visible = false;
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const activated = new Set();
    let activeCharacter = null;
    let activeStartedAt = null;
    let finaleStartedAt = null;
    let finaleCrackPlayed = false;

    const resetCharacter = (index) => {
      const base = characterBases[index];
      characters[index].position.set(base.x, base.y, 0.12);
      characters[index].rotation.z = 0;
      characters[index].scale.setScalar(activated.has(index) ? 1.08 : 1);
    };

    const onPointerDown = (event) => {
      if (activeCharacter !== null || finaleStartedAt !== null || !anchor.group.visible) return;
      const rect = ar.renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      ar.scene.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, ar.camera);
      const hit = raycaster.intersectObjects(characters, false)[0];
      if (!hit?.uv) return;
      const index = characters.indexOf(hit.object);
      const mask = characterMasks[index];
      const x = Math.min(mask.width - 1, Math.max(0, Math.floor(hit.uv.x * mask.width)));
      const y = Math.min(mask.height - 1, Math.max(0, Math.floor((1 - hit.uv.y) * mask.height)));
      if (mask.data[(y * mask.width + x) * 4 + 3] < 64) return;
      activeCharacter = index;
      activeStartedAt = performance.now();
      sounds[index].play();
      navigator.vibrate?.(index === 0 ? [30, 20, 30] : index === 1 ? 45 : [25, 25, 45]);
    };
    container.addEventListener("pointerdown", onPointerDown);

    anchor.onTargetFound = () => {
      focusDecoration.start(performance.now());
      notify(completed ? "complete" : "found");
      if (!completed && activated.size === 3 && finaleStartedAt === null) {
        finaleStartedAt = performance.now() + 250;
        ritualMessage.show({
          message: "はやくでておいで",
          speaker: "みんな",
          target: anchor.group,
          localPosition: new THREE.Vector3(0, 0.72, 0.22),
          time: performance.now(),
          showFor: 2150,
        });
      }
    };
    anchor.onTargetLost = () => {
      if (activeCharacter !== null) resetCharacter(activeCharacter);
      activeCharacter = null;
      activeStartedAt = null;
      if (!completed && finaleStartedAt !== null) {
        finaleStartedAt = null;
        finaleCrackPlayed = false;
        ritualMessage.hide();
        eggs.forEach((egg, index) => {
          egg.rotation.z = 0;
          egg.scale.setScalar(players[index].nest ? 0.78 : 1);
          glows[index].material.opacity = 0;
          cracks[index].visible = false;
          cracks[index].material.opacity = 0;
        });
      }
      hideEffects();
      notify(completed ? "complete" : "searching");
    };

    await ar.start();
    if (stopped) return;
    notify("searching");
    ar.renderer.setAnimationLoop(() => {
      const now = performance.now();
      if (activeCharacter !== null && activeStartedAt !== null) {
        const progress = Math.min(1, (now - activeStartedAt) / 1600);
        const character = characters[activeCharacter];
        const base = characterBases[activeCharacter];
        const pulse = Math.sin(progress * Math.PI);
        if (activeCharacter === 0) {
          const angle = Math.PI + progress * Math.PI * 2;
          character.position.x = Math.cos(angle) * 0.72;
          character.position.y = Math.sin(angle) * 0.48;
          character.rotation.z = -Math.cos(angle) * 0.16;
        } else if (activeCharacter === 1) {
          character.position.x = THREE.MathUtils.lerp(base.x, 0.48, pulse);
          character.position.y = base.y + pulse * 0.12;
          character.scale.setScalar(1 + pulse * 0.28);
        } else {
          character.position.y = base.y + pulse * 0.18;
          character.rotation.z = Math.sin(progress * Math.PI * 6) * 0.08;
        }
        if (activeCharacter === 0) {
          stars.forEach((star, index) => {
            const angle = progress * Math.PI * 4 + index * Math.PI * 2 / stars.length;
            const radius = 0.2 + progress * 0.5;
            star.visible = true;
            star.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.7, 0.1);
            star.rotation.z = angle;
            star.material.opacity = pulse * 0.9;
          });
        } else if (activeCharacter === 1) {
          hearts.forEach((heart, index) => {
            heart.visible = true;
            heart.position.set(-0.42 + index * 0.095 + Math.sin(index + progress * 8) * 0.025, -0.18 + progress * 0.7 + (index % 2) * 0.08, 0.1);
            heart.scale.setScalar(0.65 + pulse * 0.5);
            heart.material.opacity = pulse * 0.9;
          });
        } else {
          magicRing.visible = true;
          magicRing.rotation.z = progress * Math.PI * 4;
          magicRing.scale.setScalar(0.7 + pulse * 1.1);
          magicRing.material.opacity = pulse * 0.8;
          magicOrbs.forEach((orb, index) => {
            const angle = progress * Math.PI * 5 + index * Math.PI * 2 / magicOrbs.length;
            orb.visible = true;
            orb.position.set(Math.cos(angle) * (0.25 + pulse * 0.35), Math.sin(angle) * (0.2 + pulse * 0.28), 0.11);
            orb.material.opacity = pulse;
          });
        }
        if (progress >= 1) {
          activated.add(activeCharacter);
          resetCharacter(activeCharacter);
          activeCharacter = null;
          activeStartedAt = null;
          hideEffects();
          notify("progress", { completedCount: activated.size });
          // 三人の初回演出後だけ最終演出へ進み、完了後は何度でも再生できる
          if (!completed && activated.size === 3) {
            finaleCrackPlayed = false;
            finaleStartedAt = now + 250;
            ritualMessage.show({
              message: "はやくでておいで",
              speaker: "みんな",
              target: anchor.group,
              localPosition: new THREE.Vector3(0, 0.72, 0.22),
              time: now,
              showFor: 2150,
            });
          }
        }
      }

      if (finaleStartedAt !== null && now >= finaleStartedAt) {
        const progress = Math.min(1, (now - finaleStartedAt) / 1900);
        if (progress >= 0.48 && !finaleCrackPlayed) {
          finaleCrackPlayed = true;
          sounds[0].playCrack();
          navigator.vibrate?.([70, 35, 110]);
        }
        const pulse = Math.sin(progress * Math.PI * 8) * (1 - progress);
        eggs.forEach((egg, index) => {
          egg.rotation.z = pulse * 0.12;
          egg.scale.setScalar((players[index].nest ? 0.78 : 1) * (1 + Math.sin(progress * Math.PI) * 0.08));
          glows[index].material.opacity = Math.sin(progress * Math.PI) * 0.72;
          glows[index].scale.setScalar(0.8 + progress * 0.7);
          if (progress > 0.48) {
            cracks[index].visible = true;
            cracks[index].material.opacity = Math.min(1, (progress - 0.48) * 3.2);
          }
        });
        if (progress >= 1) {
          eggs.forEach((egg, index) => {
            egg.rotation.z = 0;
            egg.scale.setScalar(players[index].nest ? 0.78 : 1);
            glows[index].material.opacity = 0;
            cracks[index].visible = true;
            cracks[index].material.opacity = 1;
          });
          finaleStartedAt = null;
          completed = true;
          notify("complete");
        }
      }
      ritualMessage.update(now);
      focusDecoration.update(now);
      ar.renderer.render(ar.scene, ar.camera);
    });
  } catch (error) {
    console.error("目覚めARの起動に失敗しました:", error);
    notify("error");
    stop();
  }
}

void start();
