// 3D座標を画面へ投影し、必ず読めるHTMLのことばとして表示する
export function createRitualMessage({ THREE, container, camera }) {
  const bubble = document.createElement("div");
  bubble.setAttribute("aria-live", "polite");
  bubble.style.cssText = [
    "position:absolute",
    "left:50%",
    "top:45%",
    "z-index:60",
    "display:none",
    "width:max-content",
    "max-width:min(86%,420px)",
    "box-sizing:border-box",
    "padding:18px 20px 14px",
    "border:3px solid #FFBC39",
    "border-radius:24px",
    "background:rgba(255,252,243,.96)",
    "box-shadow:0 0 24px rgba(255,188,57,.55),0 8px 20px rgba(24,54,107,.18)",
    "color:#18366B",
    "text-align:center",
    "pointer-events:none",
    "transform:translate(-50%,-100%) scale(.7)",
    "transform-origin:50% 100%",
    "will-change:left,top,transform,opacity",
  ].join(";");

  const speakerElement = document.createElement("div");
  speakerElement.style.cssText = "margin-bottom:4px;color:#A96500;font:800 12px/1.2 sans-serif;letter-spacing:.04em";
  const messageElement = document.createElement("div");
  messageElement.style.cssText = "font:900 clamp(16px,4.5vw,22px)/1.35 sans-serif;white-space:normal";
  const tail = document.createElement("span");
  tail.style.cssText = "position:absolute;left:50%;bottom:-11px;width:18px;height:18px;background:#FFFCF3;border-right:3px solid #FFBC39;border-bottom:3px solid #FFBC39;transform:translateX(-50%) rotate(45deg)";
  bubble.append(speakerElement, messageElement, tail);
  container.appendChild(bubble);

  let startedAt = null;
  let duration = 2200;
  let target = null;
  let localPosition = new THREE.Vector3();
  const worldPosition = new THREE.Vector3();
  const screenPosition = new THREE.Vector3();

  return {
    show({ message, speaker, target: nextTarget, localPosition: nextPosition, time, showFor = 2200 }) {
      speakerElement.textContent = speaker;
      messageElement.textContent = `「${message}」`;
      target = nextTarget;
      localPosition.copy(nextPosition);
      startedAt = time;
      duration = showFor;
      bubble.style.display = "block";
    },
    update(time) {
      if (startedAt === null || target === null) return;
      const progress = Math.min(1, (time - startedAt) / duration);
      const appear = Math.min(1, progress / 0.18);
      const disappear = Math.min(1, (1 - progress) / 0.2);
      const visibility = Math.min(appear, disappear);
      const eased = 1 - Math.pow(1 - appear, 3);

      worldPosition.copy(localPosition);
      target.localToWorld(worldPosition);
      screenPosition.copy(worldPosition).project(camera);
      const width = container.clientWidth;
      const height = container.clientHeight;
      const x = THREE.MathUtils.clamp((screenPosition.x * 0.5 + 0.5) * width, width * 0.12, width * 0.88);
      const y = THREE.MathUtils.clamp((-screenPosition.y * 0.5 + 0.5) * height, height * 0.2, height * 0.82);
      const floatY = progress * 12 + Math.sin(progress * Math.PI * 3) * 3;
      bubble.style.left = `${x}px`;
      bubble.style.top = `${y}px`;
      bubble.style.opacity = String(screenPosition.z >= -1 && screenPosition.z <= 1 ? visibility : 0);
      bubble.style.transform = `translate(-50%,-100%) translateY(${-floatY}px) scale(${0.7 + eased * 0.3})`;

      if (progress >= 1) {
        bubble.style.display = "none";
        startedAt = null;
        target = null;
      }
    },
    hide() {
      bubble.style.display = "none";
      startedAt = null;
      target = null;
    },
    dispose() {
      bubble.remove();
    },
  };
}
