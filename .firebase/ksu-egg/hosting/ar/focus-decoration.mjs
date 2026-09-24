// 初回認識後、利用者を中心に360度へ広がる空間装飾を作る
export function createFocusDecoration({ THREE, scene, reducedMotion = false }) {
  const worldGroup = new THREE.Group();
  worldGroup.visible = false;
  worldGroup.renderOrder = 20;
  scene.add(worldGroup);

  const geometries = [];
  const materials = [];
  const items = [];
  let played = false;
  let startedAt = null;
  let settledAt = null;
  let initialOrientation = null;
  let currentOrientation = null;
  let orientationPermissionRequested = false;
  let dragPointer = null;
  let dragX = 0;
  let dragY = 0;
  let manualYaw = 0;
  let manualPitch = 0;

  const star = new THREE.Shape();
  for (let index = 0; index < 10; index += 1) {
    const angle = Math.PI / 2 + index * Math.PI / 5;
    const radius = index % 2 === 0 ? 0.09 : 0.04;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) star.moveTo(x, y);
    else star.lineTo(x, y);
  }
  star.closePath();

  const heart = new THREE.Shape();
  heart.moveTo(0, -0.07);
  heart.bezierCurveTo(-0.02, -0.03, -0.12, 0.01, -0.12, 0.08);
  heart.bezierCurveTo(-0.12, 0.16, -0.03, 0.18, 0, 0.1);
  heart.bezierCurveTo(0.03, 0.18, 0.12, 0.16, 0.12, 0.08);
  heart.bezierCurveTo(0.12, 0.01, 0.02, -0.03, 0, -0.07);
  heart.closePath();

  const shapes = [
    new THREE.ShapeGeometry(star),
    new THREE.ShapeGeometry(heart),
    new THREE.CircleGeometry(0.06, 18),
  ];
  geometries.push(...shapes);
  const colors = [0xffd84d, 0xff7898, 0x58c8c6, 0xb8d632, 0xff9e32];

  const addItem = (direction, distance, index) => {
    const material = new THREE.MeshBasicMaterial({
      color: colors[index % colors.length],
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    materials.push(material);
    const mesh = new THREE.Mesh(shapes[index % shapes.length], material);
    mesh.position.copy(direction).multiplyScalar(distance);
    mesh.lookAt(0, 0, 0);
    mesh.renderOrder = 20;
    worldGroup.add(mesh);
    items.push({ mesh, direction, distance, phase: index * 0.73 });
  };

  // 初回認識時に必ず見える、正面方向の飾り
  const frontDirections = [
    [-0.42, 0.3, -1], [0, 0.42, -1], [0.42, 0.28, -1],
    [-0.48, -0.08, -1], [0.48, -0.1, -1],
    [-0.3, -0.38, -1], [0.28, -0.4, -1],
  ];
  frontDirections.forEach((values, index) => {
    addItem(new THREE.Vector3(...values).normalize(), 1.45 + (index % 2) * 0.12, index);
  });

  // 黄金角を使い、正面以外にも360度へ偏りなく配置する
  const itemCount = 18;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < itemCount; index += 1) {
    const y = 1 - (index / (itemCount - 1)) * 2;
    const horizontalRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = goldenAngle * index;
    const distance = 2.15 + (index % 3) * 0.2;
    const direction = new THREE.Vector3(
      Math.cos(angle) * horizontalRadius,
      y,
      Math.sin(angle) * horizontalRadius,
    );
    addItem(direction, distance, index + frontDirections.length);
  }

  const zee = new THREE.Vector3(0, 0, 1);
  const screenTransform = new THREE.Quaternion();
  const deviceTransform = new THREE.Quaternion();
  const cameraCorrection = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
  const euler = new THREE.Euler();

  const readScreenAngle = () => {
    const angle = window.screen.orientation?.angle;
    if (typeof angle === "number") return THREE.MathUtils.degToRad(angle);
    return THREE.MathUtils.degToRad(typeof window.orientation === "number" ? window.orientation : 0);
  };

  const onDeviceOrientation = (event) => {
    if (event.alpha === null || event.beta === null || event.gamma === null) return;
    const alpha = THREE.MathUtils.degToRad(event.alpha);
    const beta = THREE.MathUtils.degToRad(event.beta);
    const gamma = THREE.MathUtils.degToRad(event.gamma);
    euler.set(beta, alpha, -gamma, "YXZ");
    deviceTransform.setFromEuler(euler);
    deviceTransform.multiply(cameraCorrection);
    deviceTransform.multiply(screenTransform.setFromAxisAngle(zee, -readScreenAngle()));
    currentOrientation = deviceTransform.clone();
    if (initialOrientation === null) initialOrientation = currentOrientation.clone();
  };

  window.addEventListener("deviceorientation", onDeviceOrientation, true);

  // iOSではユーザー操作から方向センサーの許可を求める必要がある
  const requestOrientationPermission = async () => {
    if (orientationPermissionRequested) return;
    orientationPermissionRequested = true;
    const OrientationEvent = window.DeviceOrientationEvent;
    if (typeof OrientationEvent?.requestPermission !== "function") return;
    try {
      const permission = await OrientationEvent.requestPermission();
      if (permission !== "granted") currentOrientation = null;
    } catch (error) {
      console.info("方向センサーの許可を取得できませんでした:", error);
    }
  };
  window.addEventListener("pointerdown", requestOrientationPermission, { once: true });

  // 方向センサーを持たないPCでは、マウスドラッグで周囲を見回せるようにする
  const onPointerDown = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragPointer = event.pointerId;
    dragX = event.clientX;
    dragY = event.clientY;
  };
  const onPointerMove = (event) => {
    if (event.pointerId !== dragPointer) return;
    const deltaX = event.clientX - dragX;
    const deltaY = event.clientY - dragY;
    dragX = event.clientX;
    dragY = event.clientY;
    manualYaw -= deltaX * 0.006;
    manualPitch = THREE.MathUtils.clamp(manualPitch - deltaY * 0.006, -1.2, 1.2);
  };
  const onPointerUp = (event) => {
    if (event.pointerId === dragPointer) dragPointer = null;
  };
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  const sensorQuaternion = new THREE.Quaternion();
  const manualQuaternion = new THREE.Quaternion();
  const manualEuler = new THREE.Euler();

  const updateOrientation = () => {
    if (currentOrientation !== null && initialOrientation !== null) {
      // カメラを回した分だけ空間を逆向きに回し、現実空間に留まって見せる
      sensorQuaternion.copy(currentOrientation).invert().multiply(initialOrientation);
    } else {
      sensorQuaternion.identity();
    }
    manualEuler.set(manualPitch, manualYaw, 0, "YXZ");
    manualQuaternion.setFromEuler(manualEuler);
    worldGroup.quaternion.copy(sensorQuaternion).multiply(manualQuaternion);
  };

  return {
    start(time) {
      if (played) return;
      played = true;
      startedAt = time;
      settledAt = null;
      worldGroup.visible = true;
    },
    update(time) {
      if (!played) return;
      updateOrientation();
      const entering = startedAt !== null;
      const duration = reducedMotion ? 450 : 1350;
      const progress = entering ? Math.min(1, (time - startedAt) / duration) : 1;
      const elapsed = settledAt === null || reducedMotion ? 0 : (time - settledAt) / 1000;
      const entranceScale = 0.25 + progress * 0.75;

      items.forEach(({ mesh, direction, distance, phase }) => {
        const drift = reducedMotion ? 0 : Math.sin(elapsed * 0.8 + phase) * 0.035;
        mesh.position.copy(direction).multiplyScalar(distance + drift);
        mesh.lookAt(0, 0, 0);
        mesh.rotateZ(reducedMotion ? phase * 0.08 : elapsed * 0.12 + phase * 0.08);
        const pulse = reducedMotion ? 0 : Math.sin(elapsed * 1.1 + phase) * 0.06;
        mesh.scale.setScalar(entranceScale * (0.9 + pulse));
        mesh.material.opacity = Math.min(0.78, progress * 1.4);
      });

      if (entering && progress >= 1) {
        startedAt = null;
        settledAt = time;
      }
    },
    dispose() {
      window.removeEventListener("deviceorientation", onDeviceOrientation, true);
      window.removeEventListener("pointerdown", requestOrientationPermission);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      scene.remove(worldGroup);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
