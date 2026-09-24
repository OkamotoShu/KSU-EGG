// event専用：一度の画像認識で、全プレイヤーのたまごを並べて順番に演出する
const container = document.getElementById("camera");
let ar;
let stopped = false;
let completed = false;
const textures = [];
const geometries = [];
const materials = [];
const interactions = [];
const displays = [];
let activeAction;
let sharedSound;
let focusDecoration;
let ritualMessage;

const notify = (status) => {
  if (!stopped) window.parent.postMessage({ type: "ksu-event-ar", status }, window.location.origin);
};

const notifyProgress = (completedCount) => {
  if (!stopped) window.parent.postMessage({ type: "ksu-event-ar", status: "progress", completedCount }, window.location.origin);
};

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
  activeAction?.dispose();
  focusDecoration?.dispose();
  ritualMessage?.dispose();
  interactions.forEach((interaction) => interaction.dispose());
  sharedSound?.close();
  textures.forEach((item) => item.dispose());
  geometries.forEach((item) => item.dispose());
  materials.forEach((item) => item.dispose());
  ar?.renderer.dispose();
};

window.addEventListener("pagehide", stop, { once: true });
window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  console.error("イベントAR処理に失敗しました:", event.reason);
  notify("error");
  stop();
});

function getLayout(count) {
  if (count === 1) return [{ x: 0, y: 0, scale: 0.78 }];
  if (count === 2) return [
    { x: -0.38, y: 0, scale: 0.54 },
    { x: 0.38, y: 0, scale: 0.54 },
  ];
  if (count === 3) return [
    { x: 0, y: 0.3, scale: 0.47 },
    { x: -0.36, y: -0.28, scale: 0.47 },
    { x: 0.36, y: -0.28, scale: 0.47 },
  ];
  return [
    { x: -0.32, y: 0.3, scale: 0.4 },
    { x: 0.32, y: 0.3, scale: 0.4 },
    { x: -0.32, y: -0.3, scale: 0.4 },
    { x: 0.32, y: -0.3, scale: 0.4 },
  ];
}

async function start() {
  try {
    const [THREE, { MindARThree }, { createCharacterAction }, { createEggInteraction }, { createSoundEffects }, { createFocusDecoration }, { createRitualMessage }] = await Promise.all([
      import("three"),
      import("/ar/vendor/mindar-image-three.prod.js"),
      import("/ar/character-action.mjs"),
      import("/ar/egg-interaction.mjs"),
      import("/ar/sound-effects.mjs"),
      import("/ar/focus-decoration.mjs"),
      import("/ar/ritual-message.mjs"),
    ]);
    const params = new URLSearchParams(window.location.search);
    const characterType = [1, 2, 3].includes(Number(params.get("character"))) ? Number(params.get("character")) : 1;
    const rawPlayers = JSON.parse(params.get("players") || "[]");
    const sanitizeState = (state) => ({
      egg: /^\/egg_(?:0_0|[12]_[0-4])\.png$/.test(state?.egg) ? state.egg : "/egg_0_0.png",
      nest: /^\/nest_[1-3]\.png$/.test(state?.nest || "") ? state.nest : null,
      pattern: /^\/pattern_[1-3]\.png$/.test(state?.pattern || "") ? state.pattern : null,
    });
    const players = Array.isArray(rawPlayers) ? rawPlayers.slice(0, 4).map((player) => ({
      before: sanitizeState(player?.before),
      after: sanitizeState(player?.after),
      marks: Array.isArray(player?.marks) ? player.marks.filter((mark) => [1, 2, 3].includes(Number(mark))).map(Number) : [],
    })) : [];
    if (!players.length) throw new Error("Player data not found");

    const response = await fetch("/ar/targets.mind");
    if (!response.ok) throw new Error("Target file not found");
    await response.arrayBuffer();

    const characterNames = ["", "koyamachan", "musubukun", "yamachan"];
    const loader = new THREE.TextureLoader();
    const characterTexture = await loader.loadAsync(`/ar/characters/${characterNames[characterType]}.png`);
    textures.push(characterTexture);
    characterTexture.colorSpace = THREE.SRGBColorSpace;

    ar = new MindARThree({
      container,
      imageTargetSrc: "/ar/targets.mind",
      maxTrack: 1,
      uiLoading: "no",
      uiScanning: "no",
      uiError: "no",
    });
    const anchor = ar.addAnchor(0);
    const layout = getLayout(players.length);
    const finishedEggs = new Set();
    let activeIndex = null;
    let activeStartedAt = null;
    let completeAt = null;
    let returning = null;
    let approaching = null;
    const eggGroups = [];

    // 1〜4イベントでは、同じ一人のキャラクターがすべてのたまごを担当する
    const characterAspect = characterTexture.image.width / characterTexture.image.height;
    const characterHeight = characterType === 2 ? 0.55 : 0.48;
    const characterGeometry = new THREE.PlaneGeometry(characterHeight * characterAspect, characterHeight);
    const characterMaterial = new THREE.MeshBasicMaterial({ map: characterTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    geometries.push(characterGeometry);
    materials.push(characterMaterial);
    const character = new THREE.Mesh(characterGeometry, characterMaterial);
    const sharedCharacterPosition = characterType === 2
      ? { x: 0.72, y: -0.52 }
      : { x: -0.72, y: -0.52 };
    const restoreSharedCharacter = () => {
      character.position.set(sharedCharacterPosition.x, sharedCharacterPosition.y, 0.12);
      character.rotation.z = 0;
      character.scale.setScalar(1);
      character.renderOrder = 10;
    };
    restoreSharedCharacter();
    anchor.group.add(character);
    sharedSound = createSoundEffects(characterType);
    focusDecoration = createFocusDecoration({ THREE, scene: ar.scene, reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    ritualMessage = createRitualMessage({ THREE, container, camera: ar.camera });

    for (let index = 0; index < players.length; index++) {
      const player = players[index];
      const position = layout[index];
      const group = new THREE.Group();
      group.position.set(position.x, position.y, 0);
      group.scale.setScalar(position.scale);
      anchor.group.add(group);
      eggGroups.push(group);

      const loadTexture = async (path) => {
        if (!path) return null;
        const loadedTexture = await loader.loadAsync(path);
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        textures.push(loadedTexture);
        return loadedTexture;
      };
      const [eggTexture, nextEggTexture, nestTexture, nextNestTexture, patternTexture, nextPatternTexture] = await Promise.all([
        loadTexture(player.before.egg),
        loadTexture(player.after.egg),
        loadTexture(player.before.nest),
        loadTexture(player.after.nest),
        loadTexture(player.before.pattern),
        loadTexture(player.after.pattern),
      ]);
      const eggGeometry = new THREE.PlaneGeometry(1, 1);
      const eggMaterial = new THREE.MeshBasicMaterial({ map: eggTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
      geometries.push(eggGeometry);
      materials.push(eggMaterial);
      const egg = new THREE.Mesh(eggGeometry, eggMaterial);
      egg.position.z = 0.02;
      egg.renderOrder = 2;
      group.add(egg);

      // 巣はたまごの後ろ、模様はたまごの前に重ねる
      const nestGeometry = new THREE.PlaneGeometry(1, 1);
      const nestMaterial = new THREE.MeshBasicMaterial({ map: nestTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
      geometries.push(nestGeometry);
      materials.push(nestMaterial);
      const nest = new THREE.Mesh(nestGeometry, nestMaterial);
      nest.position.z = 0.01;
      nest.renderOrder = 1;
      nest.visible = Boolean(nestTexture);
      group.add(nest);

      const patternGeometry = new THREE.PlaneGeometry(1, 1);
      const patternMaterial = new THREE.MeshBasicMaterial({ map: patternTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
      geometries.push(patternGeometry);
      materials.push(patternMaterial);
      const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
      pattern.position.z = 0.02;
      pattern.renderOrder = 3;
      pattern.visible = Boolean(patternTexture);
      egg.add(pattern);

      const placeEggForNest = (hasNest) => {
        egg.position.y = hasNest ? 0.11 : 0;
        egg.scale.setScalar(hasNest ? 0.78 : 1);
      };
      placeEggForNest(Boolean(nestTexture));
      let afterShown = false;
      displays.push({
        showAfter() {
          eggMaterial.map = nextEggTexture;
          eggMaterial.needsUpdate = true;
          nestMaterial.map = nextNestTexture;
          nestMaterial.needsUpdate = true;
          nest.visible = Boolean(nextNestTexture);
          patternMaterial.map = nextPatternTexture;
          patternMaterial.needsUpdate = true;
          pattern.visible = Boolean(nextPatternTexture);
          placeEggForNest(Boolean(nextNestTexture));
          const positionChange = afterShown
            ? 0
            : (nextNestTexture ? 0.11 : 0) - (nestTexture ? 0.11 : 0);
          afterShown = true;
          return positionChange;
        },
      });

      // 透明部分を除外して、このたまごを押した時だけ演出を始める
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = eggTexture.image.width;
      maskCanvas.height = eggTexture.image.height;
      const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskContext) throw new Error("Image mask unavailable");
      maskContext.drawImage(eggTexture.image, 0, 0);
      interactions.push(createEggInteraction({
        THREE,
        container,
        renderer: ar.renderer,
        camera: ar.camera,
        scene: ar.scene,
        anchor,
        egg,
        alphaMask: maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height),
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        canTrigger: () => activeIndex === null && returning === null && approaching === null,
        onTrigger: (time) => {
          activeIndex = index;
          activeStartedAt = null;
          const localTarget = new THREE.Vector3(characterType === 2 ? 0.78 : -0.78, characterType === 3 ? 0.17 : -0.02, 0.05);
          const worldTarget = group.localToWorld(localTarget.clone());
          const target = anchor.group.worldToLocal(worldTarget);
          approaching = {
            startedAt: time,
            from: character.position.clone(),
            target,
            group,
            egg,
            player,
          };
        },
      }));
    }

    anchor.onTargetFound = () => {
      focusDecoration.start(performance.now());
      notify(completed ? "complete" : "found");
    };
    anchor.onTargetLost = () => {
      // 進行中の演出だけを戻し、変化済みのたまごの状態は保持する
      if (activeIndex !== null) {
        activeAction?.onTargetLost();
        activeAction?.dispose();
        activeAction = undefined;
        character.parent?.remove(character);
        anchor.group.add(character);
        restoreSharedCharacter();
      }
      approaching = null;
      ritualMessage.hide();
      if (returning !== null) {
        returning = null;
        restoreSharedCharacter();
      }
      interactions.forEach((interaction) => interaction.reset());
      activeIndex = null;
      activeStartedAt = null;
      completeAt = null;
      notify(completed ? "complete" : "searching");
    };

    await ar.start();
    if (stopped) return;
    notify("searching");
    ar.renderer.setAnimationLoop(() => {
      const now = performance.now();
      interactions.forEach((interaction) => interaction.update(now));
      focusDecoration.update(now);
      if (approaching !== null) {
        const progress = Math.min(1, (now - approaching.startedAt) / 520);
        const eased = 1 - Math.pow(1 - progress, 3);
        character.position.lerpVectors(approaching.from, approaching.target, eased);
        character.scale.setScalar(THREE.MathUtils.lerp(1, 0.92, eased));
        character.rotation.z = Math.sin(progress * Math.PI * 2) * 0.04;
        if (progress >= 1) {
          const { group, egg, player } = approaching;
          const selectedColor = Number(player.after.egg.match(/_([1-4])\.png$/)?.[1]) || 4;
          const lightColors = {
            1: 0xff6f91,
            2: 0x55c8f2,
            3: 0x55d98b,
            4: 0x9b6de3,
          };
          group.attach(character);
          character.position.set(characterType === 2 ? 0.78 : -0.78, characterType === 3 ? 0.17 : -0.02, 0.05);
          character.rotation.z = 0;
          activeAction = createCharacterAction({
            THREE,
            anchor: { group },
            characterType,
            character,
            egg,
            effectColor: lightColors[selectedColor],
            existingMarks: player.marks,
            showPersistentMarks: false,
            settleAsHat: false,
            reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          });
          activeStartedAt = now;
          activeAction.start(now);
          sharedSound.play();
          navigator.vibrate?.(45);
          const ritualPhrases = ["おおきくなあれ", "げんきにそだってね", "どんなこがでてくるかな", "そろそろうまれるかな"];
          const speakerNames = ["", "ほしみ〜るちゃん", "むすぶくん", "神山くん"];
          ritualMessage.show({
            message: ritualPhrases[Math.floor(Math.random() * ritualPhrases.length)],
            speaker: speakerNames[characterType],
            target: group,
            localPosition: new THREE.Vector3(0, 0.78, 0.18),
            time: now,
          });
          approaching = null;
        }
      }
      activeAction?.update(now);
      ritualMessage.update(now);
      if (activeIndex !== null && activeStartedAt !== null && now - activeStartedAt >= 1850) {
        finishedEggs.add(activeIndex);
        displays[activeIndex].showAfter();
        activeAction?.setEggBaseState();
        activeAction?.dispose();
        activeAction = undefined;
        // 現在の見た目の位置を保ったまま共通座標へ戻し、そこから滑らかに移動する
        anchor.group.attach(character);
        returning = {
          startedAt: now,
          x: character.position.x,
          y: character.position.y,
          z: character.position.z,
          scale: character.scale.x,
          rotation: character.rotation.z,
        };
        notifyProgress(finishedEggs.size);
        activeIndex = null;
        activeStartedAt = null;
        // 一度でも正常に交流できたら、以後は常に次へ進める
        if (!completed) completeAt = now + 300;
      }
      if (returning !== null) {
        const progress = Math.min(1, (now - returning.startedAt) / 480);
        const eased = progress * progress * (3 - 2 * progress);
        character.position.set(
          THREE.MathUtils.lerp(returning.x, sharedCharacterPosition.x, eased),
          THREE.MathUtils.lerp(returning.y, sharedCharacterPosition.y, eased),
          THREE.MathUtils.lerp(returning.z, 0.12, eased),
        );
        character.scale.setScalar(THREE.MathUtils.lerp(returning.scale, 1, eased));
        character.rotation.z = THREE.MathUtils.lerp(returning.rotation, 0, eased);
        if (progress >= 1) {
          returning = null;
          restoreSharedCharacter();
        }
      }
      if (completeAt !== null && now >= completeAt && !completed) {
        completed = true;
        completeAt = null;
        notify("complete");
      }
      ar.renderer.render(ar.scene, ar.camera);
    });
  } catch (error) {
    console.error("イベントARの起動に失敗しました:", error);
    notify("error");
    stop();
  }
}

void start();
