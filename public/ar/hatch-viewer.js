// 第6イベント専用：ひびの入ったたまごを3回タップして孵化させる
const container = document.getElementById("camera");
let ar;
let stopped = false;
let completed = false;
const textures = [];
const geometries = [];
const materials = [];
let sound;
let focusDecoration;

const notify = (status, detail = {}) => {
  if (!stopped) window.parent.postMessage({ type: "ksu-event-ar", status, ...detail }, window.location.origin);
};

function getLayout(count) {
  if (count === 1) return [{ x: 0, y: 0, scale: 0.72 }];
  if (count === 2) return [{ x: -0.36, y: 0, scale: 0.5 }, { x: 0.36, y: 0, scale: 0.5 }];
  if (count === 3) return [{ x: 0, y: 0.3, scale: 0.43 }, { x: -0.34, y: -0.25, scale: 0.43 }, { x: 0.34, y: -0.25, scale: 0.43 }];
  return [
    { x: -0.3, y: 0.28, scale: 0.37 }, { x: 0.3, y: 0.28, scale: 0.37 },
    { x: -0.3, y: -0.28, scale: 0.37 }, { x: 0.3, y: -0.28, scale: 0.37 },
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
  sound?.close();
  focusDecoration?.dispose();
  textures.forEach((item) => item.dispose());
  geometries.forEach((item) => item.dispose());
  materials.forEach((item) => item.dispose());
  ar?.renderer.dispose();
};

window.addEventListener("pagehide", stop, { once: true });
window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  console.error("孵化ARの起動に失敗しました:", event.reason);
  notify("error");
  stop();
});

async function start() {
  try {
    const [THREE, { MindARThree }, { createSoundEffects }, { createFocusDecoration }] = await Promise.all([
      import("three"),
      import("/ar/vendor/mindar-image-three.prod.js"),
      import("/ar/sound-effects.mjs"),
      import("/ar/focus-decoration.mjs"),
    ]);
    const rawPlayers = JSON.parse(new URLSearchParams(window.location.search).get("players") || "[]");
    const players = Array.isArray(rawPlayers) ? rawPlayers.slice(0, 4).map((player) => ({
      egg: /^\/egg_[12]_[1-4]\.png$/.test(player?.before?.egg) ? player.before.egg : "/egg_1_1.png",
      nest: /^\/nest_[1-3]\.png$/.test(player?.before?.nest || "") ? player.before.nest : "/nest_1.png",
      pattern: /^\/pattern_[1-3]\.png$/.test(player?.before?.pattern || "") ? player.before.pattern : "/pattern_1.png",
      monster: /^\/monster_[12]_[1-3]_[1-4]_0\.png$/.test(player?.monster || "") ? player.monster : "/monster_1_1_1_0.png",
    })) : [];
    if (!players.length) throw new Error("Player data not found");

    const targetResponse = await fetch("/ar/targets.mind");
    if (!targetResponse.ok) throw new Error("Target file not found");
    await targetResponse.arrayBuffer();
    const loader = new THREE.TextureLoader();
    const loadTexture = async (path) => {
      const texture = await loader.loadAsync(path);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      return texture;
    };
    const crackTexture = await loadTexture("/crack.png");
    sound = createSoundEffects(3);

    ar = new MindARThree({ container, imageTargetSrc: "/ar/targets.mind", maxTrack: 1, uiLoading: "no", uiScanning: "no", uiError: "no" });
    const anchor = ar.addAnchor(0);
    focusDecoration = createFocusDecoration({ THREE, scene: ar.scene, reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    const layout = getLayout(players.length);
    const displays = [];
    const eggs = [];
    const masks = [];
    const tapCounts = Array(players.length).fill(0);
    const hatched = new Set();
    let activeIndex = null;
    let activeStartedAt = null;
    let crackSoundPlayed = false;

    for (let index = 0; index < players.length; index++) {
      const player = players[index];
      const position = layout[index];
      const group = new THREE.Group();
      group.position.set(position.x, position.y, 0);
      group.scale.setScalar(position.scale);
      anchor.group.add(group);
      const [eggTexture, nestTexture, patternTexture, monsterTexture] = await Promise.all([
        loadTexture(player.egg), loadTexture(player.nest), loadTexture(player.pattern), loadTexture(player.monster),
      ]);
      const plane = new THREE.PlaneGeometry(1, 1);
      geometries.push(plane);
      const makeMesh = (texture, order, opacity = 1) => {
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
        materials.push(material);
        const mesh = new THREE.Mesh(plane, material);
        mesh.renderOrder = order;
        return { mesh, material };
      };
      const nest = makeMesh(nestTexture, 1);
      group.add(nest.mesh);
      const egg = makeMesh(eggTexture, 3);
      egg.mesh.position.set(0, 0.11, 0.02);
      egg.mesh.scale.setScalar(0.78);
      group.add(egg.mesh);
      eggs.push(egg.mesh);
      const pattern = makeMesh(patternTexture, 4);
      pattern.mesh.position.z = 0.02;
      egg.mesh.add(pattern.mesh);
      const crack = makeMesh(crackTexture, 5);
      crack.mesh.position.z = 0.04;
      crack.mesh.scale.setScalar(0.7);
      crack.material.opacity = 0.72;
      egg.mesh.add(crack.mesh);
      // タップごとに別方向へ増える、ひびの枝
      const crackBranches = [
        { x: -0.19, y: 0.12, scale: 0.46, rotation: 0.62 },
        { x: 0.19, y: -0.08, scale: 0.4, rotation: -0.72 },
      ].map((branch, branchIndex) => {
        const branchCrack = makeMesh(crackTexture, 6 + branchIndex, 0);
        branchCrack.mesh.position.set(branch.x, branch.y, 0.045 + branchIndex * 0.004);
        branchCrack.mesh.scale.setScalar(branch.scale);
        branchCrack.mesh.rotation.z = branch.rotation;
        egg.mesh.add(branchCrack.mesh);
        return branchCrack;
      });
      const monster = makeMesh(monsterTexture, 6, 0);
      monster.mesh.visible = false;
      monster.mesh.scale.setScalar(0.2);
      monster.mesh.position.z = 0.08;
      group.add(monster.mesh);
      displays.push({ nest, egg, pattern, crack, crackBranches, monster });

      const canvas = document.createElement("canvas");
      canvas.width = eggTexture.image.width;
      canvas.height = eggTexture.image.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Egg mask unavailable");
      context.drawImage(eggTexture.image, 0, 0);
      masks.push(context.getImageData(0, 0, canvas.width, canvas.height));
    }

    const applyCrackStage = (display, taps, progress = 1) => {
      const previousStage = Math.max(0, taps - 1);
      const scales = [0.7, 0.86, 1, 1.08];
      const opacities = [0.72, 0.9, 1, 1];
      display.crack.mesh.scale.setScalar(THREE.MathUtils.lerp(scales[previousStage], scales[taps], progress));
      display.crack.material.opacity = THREE.MathUtils.lerp(opacities[previousStage], opacities[taps], progress);
      display.crackBranches.forEach((branch, branchIndex) => {
        const requiredTaps = branchIndex + 1;
        const wasVisible = previousStage >= requiredTaps ? 1 : 0;
        const willBeVisible = taps >= requiredTaps ? 1 : 0;
        branch.material.opacity = THREE.MathUtils.lerp(wasVisible, willBeVisible, progress) * (branchIndex === 0 ? 0.94 : 0.88);
      });
    };

    const resetActive = (rollback = false) => {
      if (activeIndex === null) return;
      const display = displays[activeIndex];
      if (rollback) tapCounts[activeIndex] = Math.max(0, tapCounts[activeIndex] - 1);
      display.egg.mesh.rotation.z = 0;
      display.egg.mesh.scale.setScalar(0.78);
      display.egg.material.opacity = 1;
      display.pattern.material.opacity = 1;
      applyCrackStage(display, tapCounts[activeIndex]);
      display.nest.material.opacity = 1;
      display.monster.mesh.visible = false;
      display.monster.material.opacity = 0;
      activeIndex = null;
      activeStartedAt = null;
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (event) => {
      if (activeIndex !== null || completed || !anchor.group.visible) return;
      const rect = ar.renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      ar.scene.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, ar.camera);
      const hit = raycaster.intersectObjects(eggs.filter((_, index) => !hatched.has(index)), false)[0];
      if (!hit?.uv) return;
      const index = eggs.indexOf(hit.object);
      const mask = masks[index];
      const x = Math.min(mask.width - 1, Math.max(0, Math.floor(hit.uv.x * mask.width)));
      const y = Math.min(mask.height - 1, Math.max(0, Math.floor((1 - hit.uv.y) * mask.height)));
      if (mask.data[(y * mask.width + x) * 4 + 3] < 64) return;
      tapCounts[index] += 1;
      notify("tapped");
      activeIndex = index;
      activeStartedAt = performance.now();
      sound.play();
      crackSoundPlayed = false;
      navigator.vibrate?.(tapCounts[index] === 1 ? 30 : tapCounts[index] === 2 ? [40, 20, 40] : 50);
    };
    container.addEventListener("pointerdown", onPointerDown);

    anchor.onTargetFound = () => {
      focusDecoration.start(performance.now());
      notify(completed ? "complete" : "found");
    };
    anchor.onTargetLost = () => {
      resetActive(true);
      notify(completed ? "complete" : "searching");
    };
    await ar.start();
    if (stopped) return;
    notify("searching");
    ar.renderer.setAnimationLoop(() => {
      const now = performance.now();
      if (activeIndex !== null && activeStartedAt !== null) {
        const taps = tapCounts[activeIndex];
        const duration = taps >= 3 ? 1800 : 720;
        const progress = Math.min(1, (now - activeStartedAt) / duration);
        const display = displays[activeIndex];
        const strength = taps === 1 ? 0.08 : taps === 2 ? 0.14 : 0.22;
        display.egg.mesh.rotation.z = Math.sin(progress * Math.PI * 10) * strength * (1 - progress);
        display.egg.mesh.scale.setScalar(0.78 * (1 + Math.sin(progress * Math.PI) * (0.04 * taps)));
        applyCrackStage(display, taps, progress);
        const crackPulse = 0.9 + Math.sin(progress * Math.PI * 4) * 0.1;
        display.crack.material.opacity *= crackPulse;
        display.crackBranches.forEach((branch) => { branch.material.opacity *= crackPulse; });
        if (taps >= 3 && progress > 0.5) {
          if (!crackSoundPlayed) {
            crackSoundPlayed = true;
            sound.playCrack();
            navigator.vibrate?.([80, 35, 120]);
          }
          const reveal = Math.min(1, (progress - 0.5) * 2);
          display.egg.material.opacity = 1 - reveal;
          display.pattern.material.opacity = 1 - reveal;
          display.crack.material.opacity = 1 - reveal;
          display.crackBranches.forEach((branch) => { branch.material.opacity *= 1 - reveal; });
          display.nest.material.opacity = 1 - reveal;
          display.monster.mesh.visible = true;
          display.monster.material.opacity = reveal;
          display.monster.mesh.scale.setScalar(0.15 + reveal * 0.95 + Math.sin(reveal * Math.PI) * 0.32);
        }
        if (progress >= 1) {
          if (taps >= 3) {
            hatched.add(activeIndex);
            display.egg.mesh.visible = false;
            display.nest.mesh.visible = false;
            display.monster.mesh.scale.setScalar(1.1);
            display.monster.material.opacity = 1;
            notify("progress", { completedCount: hatched.size });
          } else {
            display.egg.mesh.rotation.z = 0;
            display.egg.mesh.scale.setScalar(0.78);
            applyCrackStage(display, taps);
          }
          activeIndex = null;
          activeStartedAt = null;
          if (hatched.size === players.length) {
            completed = true;
            notify("complete");
          }
        }
      }
      focusDecoration.update(now);
      ar.renderer.render(ar.scene, ar.camera);
    });
  } catch (error) {
    console.error("孵化ARの起動に失敗しました:", error);
    notify("error");
    stop();
  }
}

void start();
