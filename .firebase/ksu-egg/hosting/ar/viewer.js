// AR専用フレーム内でカメラと描画を管理する
const container = document.getElementById("camera");
let ar;
let texture;
let geometry;
let material;
let interaction;
let characterAction;
let characterTexture;
let characterGeometry;
let characterMaterial;
let soundEffects;
let stopped = false;

const notify = (status) => {
  if (!stopped) window.parent.postMessage({ type: "ksu-ar", status }, window.location.origin);
};

const notifyMarkEarned = (markType) => {
  if (!stopped) window.parent.postMessage({ type: "ksu-ar", action: "mark-earned", markType }, window.location.origin);
};

const stop = () => {
  stopped = true;
  interaction?.dispose();
  characterAction?.dispose();
  soundEffects?.close();
  ar?.renderer.setAnimationLoop(null);
  ar?.controller?.stopProcessVideo();
  ar?.controller?.worker?.terminate();
  container.querySelectorAll("video").forEach((video) => {
    video.srcObject?.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  });
  texture?.dispose();
  geometry?.dispose();
  material?.dispose();
  characterTexture?.dispose();
  characterGeometry?.dispose();
  characterMaterial?.dispose();
  ar?.renderer.dispose();
};

window.addEventListener("pagehide", stop, { once: true });
// ライブラリ内部の非同期エラーも親画面へ通知する
window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  console.error("AR処理に失敗しました:", event.reason);
  notify("error");
  stop();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});

async function start() {
  try {
    const [THREE, { MindARThree }, { createEggInteraction }, { createCharacterAction }, { createSoundEffects }] = await Promise.all([
      import("three"),
      import("/ar/vendor/mindar-image-three.prod.js"),
      import("/ar/egg-interaction.mjs"),
      import("/ar/character-action.mjs"),
      import("/ar/sound-effects.mjs"),
    ]);
    if (stopped) return;

    // カメラ開始前に画像とターゲットの取得を確認
    const response = await fetch("/ar/targets.mind");
    if (!response.ok) throw new Error("Target file not found");
    await response.arrayBuffer();
    const params = new URLSearchParams(window.location.search);
    const characterType = [1, 2, 3].includes(Number(params.get("character"))) ? Number(params.get("character")) : 1;
    const existingMarks = (params.get("marks") || "")
      .split(",")
      .map(Number)
      .filter((markType) => [1, 2, 3].includes(markType));
    const characterNames = ["", "koyamachan", "musubukun", "yamachan"];
    const safeEgg = /^\/egg_[12]_[1-4]\.png$/.test(params.get("egg") || "") ? params.get("egg") : "/egg_1_1.png";
    [texture, characterTexture] = await Promise.all([
      new THREE.TextureLoader().loadAsync(safeEgg),
      new THREE.TextureLoader().loadAsync(`/ar/characters/${characterNames[characterType]}.png`),
    ]);
    if (stopped) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace;
    characterTexture.colorSpace = THREE.SRGBColorSpace;

    ar = new MindARThree({
      container,
      imageTargetSrc: "/ar/targets.mind",
      maxTrack: 1,
      uiLoading: "no",
      uiScanning: "no",
      uiError: "no",
    });
    // ターゲットファイルの先頭のカードにたまごを重ねる
    const anchor = ar.addAnchor(0);
    geometry = new THREE.PlaneGeometry(1, 1);
    material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const egg = new THREE.Mesh(geometry, material);
    egg.position.z = 0.02;
    anchor.group.add(egg);
    // 元画像の縦横比を保ったまま、キャラクターをたまごの横へ配置
    const characterAspect = characterTexture.image.width / characterTexture.image.height;
    const characterHeight = characterType === 2 ? 0.72 : 0.62;
    characterGeometry = new THREE.PlaneGeometry(characterHeight * characterAspect, characterHeight);
    characterMaterial = new THREE.MeshBasicMaterial({ map: characterTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const character = new THREE.Mesh(characterGeometry, characterMaterial);
    character.position.set(characterType === 2 ? 0.78 : -0.78, characterType === 3 ? 0.17 : -0.02, 0.05);
    character.scale.setScalar(0.92);
    anchor.group.add(character);
    characterAction = createCharacterAction({
      THREE, anchor, characterType, character, egg,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      existingMarks,
      showPersistentMarks: false,
      onMarkEarned: notifyMarkEarned,
    });
    soundEffects = createSoundEffects(characterType);
    // 画像の透明度をタップ判定に使用する
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = texture.image.width;
    maskCanvas.height = texture.image.height;
    const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!maskContext) throw new Error("Image mask unavailable");
    maskContext.drawImage(texture.image, 0, 0);
    interaction = createEggInteraction({
      THREE, container, renderer: ar.renderer, camera: ar.camera,
      scene: ar.scene, anchor, egg,
      alphaMask: maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height),
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      onTrigger: (time) => {
        characterAction.start(time);
        soundEffects.play();
        navigator.vibrate?.(45);
      },
    });
    anchor.onTargetFound = () => notify("found");
    anchor.onTargetLost = () => {
      interaction.reset();
      characterAction.onTargetLost();
      notify("searching");
    };

    await ar.start();
    if (stopped) { stop(); return; }
    notify("searching");
    ar.renderer.setAnimationLoop(() => {
      interaction.update(performance.now());
      characterAction.update(performance.now());
      ar.renderer.render(ar.scene, ar.camera);
    });
  } catch (error) {
    console.error("ARの起動に失敗しました:", error);
    notify("error");
    stop();
  }
}

void start();
