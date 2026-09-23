// キャラクターごとに異なる、たまごとの触れ合いを再生する
export function createCharacterAction({ THREE, anchor, characterType, character, egg, reducedMotion = false, existingMarks = [], existingMark = false, showPersistentMarks = true, settleAsHat = true, onMarkEarned = () => {} }) {
  const duration = 1800;
  const base = { characterX: character.position.x, characterY: character.position.y, characterZ: character.position.z, characterScale: character.scale.x, eggX: egg.position.x, eggY: egg.position.y, eggZ: egg.position.z, eggScale: egg.scale.x };
  let startedAt = null;
  const savedMarks = new Set(existingMark ? [...existingMarks, characterType] : existingMarks);
  let markEarned = savedMarks.has(characterType);
  let wearingHat = false;

  // むすぶくん用のハート
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -0.2);
  heartShape.bezierCurveTo(-0.04, -0.12, -0.26, 0, -0.26, 0.13);
  heartShape.bezierCurveTo(-0.26, 0.3, -0.06, 0.33, 0, 0.17);
  heartShape.bezierCurveTo(0.06, 0.33, 0.26, 0.3, 0.26, 0.13);
  heartShape.bezierCurveTo(0.26, 0, 0.04, -0.12, 0, -0.2);
  heartShape.closePath();
  const heartGeometry = new THREE.ShapeGeometry(heartShape);
  const hearts = Array.from({ length: 5 }, (_, index) => {
    const material = new THREE.MeshBasicMaterial({ color: index % 2 ? 0xff8faa : 0xffb5c5, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(heartGeometry, material);
    mesh.visible = false;
    mesh.position.z = 0.09;
    anchor.group.add(mesh);
    return mesh;
  });

  // やまちゃん用の魔法陣と光の粒
  const ringGeometry = new THREE.RingGeometry(0.42, 0.46, 48);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x4de4a0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const magicRing = new THREE.Mesh(ringGeometry, ringMaterial);
  magicRing.position.z = 0.08;
  magicRing.visible = false;
  anchor.group.add(magicRing);
  const orbGeometry = new THREE.CircleGeometry(0.035, 16);
  const orbs = Array.from({ length: 10 }, (_, index) => {
    const material = new THREE.MeshBasicMaterial({ color: index % 2 ? 0xffef78 : 0x5fffc1, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(orbGeometry, material);
    mesh.visible = false;
    mesh.position.z = 0.1;
    anchor.group.add(mesh);
    return mesh;
  });

  // キャラクターごとに異なる場所へ残る、永続表示用の印
  const starShape = new THREE.Shape();
  for (let index = 0; index < 10; index++) {
    const angle = Math.PI / 2 + index * Math.PI / 5;
    const radius = index % 2 === 0 ? 0.12 : 0.052;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();
  const markGeometries = [];
  const markMaterials = [];
  const addMarkMesh = (markGroup, geometry, color) => {
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    markGeometries.push(geometry);
    markMaterials.push(material);
    markGroup.add(mesh);
    return mesh;
  };
  const addMarkLine = (markGroup, points, color) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, y]) => new THREE.Vector3(x, y, 0)));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false });
    const line = new THREE.LineLoop(geometry, material);
    markGeometries.push(geometry);
    markMaterials.push(material);
    markGroup.add(line);
    return line;
  };
  const marks = [1, 2, 3].map((markType) => {
    const markGroup = new THREE.Group();
    if (markType === 1) {
      addMarkMesh(markGroup, new THREE.ShapeGeometry(starShape), 0xffdf55);
      markGroup.position.set(0.17, 0.13, 0.12);
    } else if (markType === 2) {
      const heartMark = addMarkMesh(markGroup, new THREE.ShapeGeometry(heartShape), 0xff7fa4);
    heartMark.scale.setScalar(0.58);
      markGroup.position.set(-0.18, -0.01, 0.12);
    } else {
      // 円ではなく、二つの三角と菱形の刻印で魔法紋を表現する
      addMarkLine(markGroup, [[0, 0.14], [-0.13, -0.09], [0.13, -0.09]], 0x46d99a);
      addMarkLine(markGroup, [[0, -0.14], [-0.13, 0.09], [0.13, 0.09]], 0x46d99a);
      const diamondShape = new THREE.Shape();
      diamondShape.moveTo(0, 0.055);
      diamondShape.lineTo(0.045, 0);
      diamondShape.lineTo(0, -0.055);
      diamondShape.lineTo(-0.045, 0);
      diamondShape.closePath();
      addMarkMesh(markGroup, new THREE.ShapeGeometry(diamondShape), 0xffdf55);
      markGroup.position.set(0.1, -0.15, 0.12);
    }
    markGroup.visible = showPersistentMarks && savedMarks.has(markType);
    egg.add(markGroup);
    return markGroup;
  });
  const mark = marks[characterType - 1];

  const awardMark = () => {
    mark.visible = showPersistentMarks;
    if (markEarned) return;
    markEarned = true;
    onMarkEarned(characterType);
  };

  const hideEffects = () => {
    hearts.forEach((heart) => { heart.visible = false; });
    magicRing.visible = false;
    orbs.forEach((orb) => { orb.visible = false; });
  };
  const restoreBase = () => {
    startedAt = null;
    character.position.set(base.characterX, base.characterY, base.characterZ);
    character.rotation.z = 0;
    character.scale.setScalar(base.characterScale);
    character.renderOrder = 0;
    egg.position.set(base.eggX, base.eggY, base.eggZ);
    egg.rotation.z = 0;
    egg.scale.setScalar(base.eggScale);
    mark.rotation.z = 0;
    if (!markEarned) mark.visible = false;
    hideEffects();
  };
  const settleHat = () => {
    startedAt = null;
    wearingHat = true;
    character.position.set(0, base.eggY + 0.53, 0.11);
    character.rotation.z = 0;
    character.scale.setScalar(base.characterScale * 0.8);
    character.renderOrder = 3;
    egg.position.set(base.eggX, base.eggY, base.eggZ);
    egg.rotation.z = 0;
    egg.scale.setScalar(base.eggScale);
    hideEffects();
    awardMark();
  };
  const reset = () => {
    wearingHat = false;
    markEarned = false;
    marks.forEach((savedMark) => { savedMark.visible = false; });
    restoreBase();
  };
  const smooth = (value) => value * value * (3 - 2 * value);

  return {
    // eventで画像が変化した後は、その位置と大きさを次の基準にする
    setEggBaseState() {
      base.eggX = egg.position.x;
      base.eggY = egg.position.y;
      base.eggZ = egg.position.z;
      base.eggScale = egg.scale.x;
    },
    start(time) { if (startedAt === null) startedAt = time; },
    update(now) {
      if (startedAt === null) return;
      const progress = Math.min(1, (now - startedAt) / duration);
      if (progress >= 1) {
        if (characterType === 3 && settleAsHat) settleHat();
        else {
          awardMark();
          restoreBase();
        }
        return;
      }
      if (reducedMotion) {
        if (characterType === 2) hearts.forEach((heart) => { heart.visible = true; heart.material.opacity = 0.7; });
        if (characterType === 3) { magicRing.visible = true; magicRing.material.opacity = 0.7; }
        return;
      }
      const pulse = Math.sin(progress * Math.PI);
      if (characterType === 1) {
        // こやまちゃん：たまごの周囲を大きく一周する
        const orbitProgress = Math.min(1, progress / 0.82);
        const angle = Math.PI + orbitProgress * Math.PI * 2;
        const returnEase = smooth(Math.max(0, (progress - 0.82) / 0.18));
        const orbitX = Math.cos(angle) * 0.82;
        const orbitY = Math.sin(angle) * 0.38 + 0.02;
        const orbitZ = Math.sin(angle) < 0 ? 0.01 : 0.09;
        const orbitScale = base.characterScale * (0.82 + (Math.sin(angle) + 1) * 0.16);
        character.position.x = THREE.MathUtils.lerp(orbitX, base.characterX, returnEase);
        character.position.y = THREE.MathUtils.lerp(orbitY, base.characterY, returnEase);
        character.position.z = THREE.MathUtils.lerp(orbitZ, base.characterZ, returnEase);
        character.renderOrder = returnEase === 1 ? 0 : (Math.sin(angle) < 0 ? -1 : 2);
        character.scale.setScalar(THREE.MathUtils.lerp(orbitScale, base.characterScale, returnEase));
        character.rotation.z = THREE.MathUtils.lerp(-Math.cos(angle) * 0.2, 0, returnEase);
        egg.rotation.z += Math.sin(progress * Math.PI * 8) * 0.012 * (1 - returnEase);
      } else if (characterType === 2) {
        // むすぶくん：近づいて大きく包み込み、ハートを飛ばす
        const approach = smooth(Math.min(1, progress / 0.42));
        const leave = smooth(Math.max(0, (progress - 0.68) / 0.32));
        const embrace = approach * (1 - leave);
        character.position.x = base.characterX - embrace * 0.62;
        character.position.y = base.characterY + embrace * 0.05;
        character.scale.setScalar(base.characterScale * (1 + embrace * 0.38));
        character.renderOrder = 2;
        egg.scale.setScalar(base.eggScale * (1 - embrace * 0.14 + Math.sin(progress * Math.PI * 6) * 0.015 * (1 - leave)));
        hearts.forEach((heart, index) => {
          const local = Math.max(0, progress - index * 0.045);
          heart.visible = local > 0.16 && progress < 0.92;
          heart.position.set(-0.3 + index * 0.15, 0.2 + local * 0.78 + Math.sin(index * 2) * 0.05, 0.1);
          heart.scale.setScalar(0.55 + Math.sin(local * Math.PI * 3) * 0.22);
          heart.rotation.z = (index - 2) * 0.16;
          heart.material.opacity = Math.max(0, Math.sin(local * Math.PI));
        });
      } else {
        // やまちゃん：魔法陣を展開し、帽子としてたまごに着地する
        const cast = smooth(Math.min(1, progress / 0.32));
        const land = smooth(Math.min(1, Math.max(0, (progress - 0.28) / 0.36)));
        if (wearingHat) {
          character.position.set(0, base.eggY + 0.53 + Math.sin(progress * Math.PI * 4) * 0.025, 0.11);
          character.scale.setScalar(base.characterScale * 0.8);
        } else {
          character.position.x = THREE.MathUtils.lerp(base.characterX, 0, land);
          character.position.y = THREE.MathUtils.lerp(base.characterY + Math.sin(cast * Math.PI) * 0.48, base.eggY + 0.53, land);
          character.scale.setScalar(THREE.MathUtils.lerp(base.characterScale, base.characterScale * 0.8, land));
        }
        character.position.z = 0.11;
        character.rotation.z = Math.sin(progress * Math.PI * 8) * 0.045 * (1 - land);
        character.renderOrder = 3;
        egg.position.y = base.eggY + pulse * 0.1;
        egg.scale.setScalar(base.eggScale * (1 + pulse * 0.08));
        magicRing.visible = progress > 0.08 && progress < 0.88;
        magicRing.position.set(0, 0, 0.08);
        magicRing.rotation.z = progress * Math.PI * 4;
        magicRing.scale.setScalar(0.7 + pulse * 0.75);
        magicRing.material.opacity = Math.sin(progress * Math.PI) * 0.75;
        orbs.forEach((orb, index) => {
          const angle = progress * Math.PI * 5 + index * Math.PI * 2 / orbs.length;
          const radius = 0.42 + pulse * 0.3;
          orb.visible = magicRing.visible;
          orb.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.1);
          orb.scale.setScalar(0.7 + Math.sin(progress * Math.PI * 4 + index) * 0.3);
          orb.material.opacity = Math.sin(progress * Math.PI);
        });
        if (showPersistentMarks && !wearingHat && progress > 0.62) {
          mark.visible = true;
          mark.rotation.z = progress * Math.PI;
        }
        if (!settleAsHat) {
          // eventでは魔法後に側面へ滑らかに戻り、次の操作を待つ
          const returnEase = smooth(Math.max(0, (progress - 0.72) / 0.28));
          character.position.x = THREE.MathUtils.lerp(character.position.x, base.characterX, returnEase);
          character.position.y = THREE.MathUtils.lerp(character.position.y, base.characterY, returnEase);
          character.position.z = THREE.MathUtils.lerp(character.position.z, base.characterZ, returnEase);
          character.scale.setScalar(THREE.MathUtils.lerp(character.scale.x, base.characterScale, returnEase));
        }
      }
    },
    reset,
    onTargetLost() {
      // 魔法が完了していれば帽子と印を保持する
      if (characterType === 3 && wearingHat) settleHat();
      else restoreBase();
    },
    dispose() {
      reset();
      hearts.forEach((heart) => { anchor.group.remove(heart); heart.material.dispose(); });
      orbs.forEach((orb) => { anchor.group.remove(orb); orb.material.dispose(); });
      anchor.group.remove(magicRing);
      marks.forEach((savedMark) => egg.remove(savedMark));
      heartGeometry.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      orbGeometry.dispose();
      markGeometries.forEach((item) => item.dispose());
      markMaterials.forEach((item) => item.dispose());
    },
  };
}
