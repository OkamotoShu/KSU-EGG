// たまごのタップ判定と星のアニメーションを管理する
export function createEggInteraction({ THREE, container, renderer, camera, scene, anchor, egg, alphaMask, reducedMotion = false, canTrigger = () => true, onTrigger = () => {} }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  // キャラクターの演出が終わるまで再タップを受け付けない
  const duration = 1800;
  let startedAt = null;
  let disposed = false;

  // 星の形状を共有し、色と透明度は個別に変更する
  const shape = new THREE.Shape();
  for (let index = 0; index < 10; index++) {
    const angle = Math.PI / 2 + index * Math.PI / 5;
    const radius = index % 2 === 0 ? 0.055 : 0.025;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const starGeometry = new THREE.ShapeGeometry(shape);
  const stars = Array.from({ length: 7 }, (_, index) => {
    const material = new THREE.MeshBasicMaterial({
      color: [0xffbc39, 0xffe7a3, 0x79c9be][index % 3],
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(starGeometry, material);
    mesh.visible = false;
    anchor.group.add(mesh);
    return mesh;
  });

  const reset = () => {
    startedAt = null;
    egg.rotation.z = 0;
    stars.forEach((star) => { star.visible = false; });
  };

  const onPointerDown = (event) => {
    if (disposed || startedAt !== null || !anchor.group.visible || !canTrigger()) return;
    if (event.isPrimary === false || (event.button !== undefined && event.button !== 0)) return;
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(egg, false)[0];
    if (!hit?.uv) return;

    // PNGの透明な余白を押しても反応させない
    const x = Math.min(alphaMask.width - 1, Math.max(0, Math.floor(hit.uv.x * alphaMask.width)));
    const y = Math.min(alphaMask.height - 1, Math.max(0, Math.floor((1 - hit.uv.y) * alphaMask.height)));
    if (alphaMask.data[(y * alphaMask.width + x) * 4 + 3] < 64) return;
    startedAt = performance.now();
    onTrigger(startedAt);
  };

  container.addEventListener("pointerdown", onPointerDown);

  return {
    update(now) {
      if (disposed || startedAt === null) return;
      if (!anchor.group.visible) { reset(); return; }
      const progress = Math.min(1, (now - startedAt) / duration);
      if (progress >= 1) { reset(); return; }
      // 揺れを徐々に小さくし、最後は元の姿勢に戻す
      egg.rotation.z = reducedMotion ? 0 : Math.sin(progress * Math.PI * 6) * 0.13 * (1 - progress);
      stars.forEach((star, index) => {
        const angle = Math.PI / 2 + (index / stars.length) * Math.PI * 2;
        const radius = reducedMotion ? 0.47 : 0.3 + progress * 0.35;
        star.visible = true;
        star.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius + (reducedMotion ? 0 : progress * 0.12), 0.04);
        star.rotation.z = reducedMotion ? 0 : progress * 1.5 + index;
        star.scale.setScalar(reducedMotion ? 1 : 0.6 + Math.sin(progress * Math.PI) * 0.7);
        star.material.opacity = Math.sin(progress * Math.PI);
      });
    },
    reset,
    dispose() {
      if (disposed) return;
      disposed = true;
      container.removeEventListener("pointerdown", onPointerDown);
      reset();
      stars.forEach((star) => {
        anchor.group.remove(star);
        star.material.dispose();
      });
      starGeometry.dispose();
    },
  };
}
