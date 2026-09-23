// AR専用フレーム内でカメラと描画を管理する
const container = document.getElementById("camera");
let ar;
let texture;
let geometry;
let material;
let interaction;
let stopped = false;

const notify = (status) => {
  if (!stopped) window.parent.postMessage({ type: "ksu-ar", status }, window.location.origin);
};

const stop = () => {
  stopped = true;
  interaction?.dispose();
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
    const [THREE, { MindARThree }, { createEggInteraction }] = await Promise.all([
      import("three"),
      import("/ar/vendor/mindar-image-three.prod.js"),
      import("/ar/egg-interaction.mjs"),
    ]);
    if (stopped) return;

    // カメラ開始前に画像とターゲットの取得を確認
    const response = await fetch("/ar/targets.mind");
    if (!response.ok) throw new Error("Target file not found");
    await response.arrayBuffer();
    texture = await new THREE.TextureLoader().loadAsync("/egg_1_1.png");
    if (stopped) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace;

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
    });
    anchor.onTargetFound = () => notify("found");
    anchor.onTargetLost = () => {
      interaction.reset();
      notify("searching");
    };

    await ar.start();
    if (stopped) { stop(); return; }
    notify("searching");
    ar.renderer.setAnimationLoop(() => {
      interaction.update(performance.now());
      ar.renderer.render(ar.scene, ar.camera);
    });
  } catch (error) {
    console.error("ARの起動に失敗しました:", error);
    notify("error");
    stop();
  }
}

void start();
