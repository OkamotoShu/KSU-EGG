import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../public/ar/vendor/three.module.js";
import { createEggInteraction } from "../public/ar/egg-interaction.mjs";

function setup(reducedMotion = false) {
  const container = new EventTarget();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
  camera.position.z = 2;
  const anchor = { group: new THREE.Group() };
  scene.add(anchor.group);
  const egg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
  anchor.group.add(egg);
  const alphaMask = { width: 2, height: 2, data: new Uint8ClampedArray(16).fill(255) };
  const interaction = createEggInteraction({
    THREE, container, scene, camera, anchor, egg, alphaMask, reducedMotion,
    renderer: { domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 }) } },
  });
  const click = (x = 100, y = 100) => {
    const event = new Event("pointerdown");
    Object.assign(event, { clientX: x, clientY: y, button: 0, isPrimary: true });
    container.dispatchEvent(event);
  };
  const stars = anchor.group.children.filter((child) => child !== egg);
  return { interaction, anchor, egg, alphaMask, click, stars };
}

test("opaque egg hit animates; background, transparent pixels and lost target do not", () => {
  const s = setup();
  s.click(0, 0);
  s.interaction.update(performance.now() + 100);
  assert.ok(s.stars.every((star) => !star.visible));
  s.alphaMask.data.fill(0);
  s.click();
  s.interaction.update(performance.now() + 100);
  assert.ok(s.stars.every((star) => !star.visible));
  s.alphaMask.data.fill(255);
  s.anchor.group.visible = false;
  s.click();
  s.interaction.update(performance.now() + 100);
  assert.equal(s.egg.rotation.z, 0);
  s.anchor.group.visible = true;
  s.click();
  s.interaction.update(performance.now() + 100);
  assert.notEqual(s.egg.rotation.z, 0);
  assert.ok(s.stars.every((star) => star.visible && star.material.opacity > 0));
  s.anchor.group.visible = false;
  s.interaction.update(performance.now() + 200);
  assert.equal(s.egg.rotation.z, 0);
  assert.ok(s.stars.every((star) => !star.visible));
  s.interaction.dispose();
});

test("repeated taps do not restart animation; completed animation can be triggered again", (t) => {
  let now = 1000;
  t.mock.method(performance, "now", () => now);
  const s = setup();
  s.click();
  now = 1500;
  s.click();
  s.interaction.update(1701);
  assert.ok(s.stars.every((star) => !star.visible));
  assert.equal(s.egg.rotation.z, 0);
  now = 1800;
  s.click();
  s.interaction.update(1900);
  assert.ok(s.stars.some((star) => star.visible));
  s.interaction.dispose();
  assert.equal(s.anchor.group.children.length, 1);
  s.click();
  s.interaction.update(1950);
  assert.equal(s.egg.rotation.z, 0);
});

test("reduced motion keeps egg still and provides star feedback", () => {
  const s = setup(true);
  s.click();
  s.interaction.update(performance.now() + 100);
  assert.equal(s.egg.rotation.z, 0);
  assert.ok(s.stars.some((star) => star.visible));
  s.interaction.dispose();
});
