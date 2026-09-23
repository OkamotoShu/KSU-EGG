import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../public/ar/vendor/three.module.js";
import { createCharacterAction } from "../public/ar/character-action.mjs";

function setup(characterType, options = {}) {
  const character = new THREE.Object3D();
  const egg = new THREE.Object3D();
  const anchor = { group: new THREE.Group() };
  anchor.group.add(character, egg);
  character.position.set(characterType === 2 ? 0.78 : -0.78, 0, 0.05);
  character.scale.setScalar(0.92);
  const action = createCharacterAction({ THREE, anchor, characterType, character, egg, ...options });
  action.start(1000);
  action.update(1500);
  return { action, character, egg, anchor };
}

test("koyamachan circles around the egg", () => {
  const { action, character, egg } = setup(1);
  assert.ok(character.position.x > -0.78);
  assert.notEqual(character.position.y, 0);
  assert.notEqual(character.position.z, 0.05);
  action.reset();
  assert.equal(character.position.x, -0.78);
  assert.equal(egg.position.x, 0);
});

test("koyamachan eases back close to its original position before completion", () => {
  const character = new THREE.Object3D();
  const egg = new THREE.Object3D();
  const anchor = { group: new THREE.Group() };
  anchor.group.add(character, egg);
  character.position.set(-0.78, 0, 0.05);
  character.scale.setScalar(0.92);
  const action = createCharacterAction({ THREE, anchor, characterType: 1, character, egg });
  action.start(1000);
  action.update(2770);
  assert.ok(Math.abs(character.position.x + 0.78) < 0.03);
  assert.ok(Math.abs(character.position.y) < 0.03);
  assert.ok(Math.abs(character.scale.x - 0.92) < 0.03);
  action.dispose();
});

test("musubukun approaches and hugs the egg", () => {
  const { action, character, egg } = setup(2);
  assert.ok(character.position.x < 0.78);
  assert.ok(character.scale.x > 0.92);
  assert.ok(egg.scale.x < 1);
  action.reset();
  assert.equal(character.position.x, 0.78);
  assert.equal(egg.scale.x, 1);
});

test("yamachan wears the egg like a hat and casts magic", () => {
  const { action, character, egg, anchor } = setup(3);
  action.update(1700);
  assert.ok(character.position.x > -0.78);
  assert.ok(egg.position.y > 0);
  assert.ok(egg.scale.x > 1);
  assert.ok(anchor.group.children.some((child) => child.visible));
  action.update(3000);
  assert.equal(character.position.x, 0);
  assert.equal(character.position.y, 0.53);
  assert.ok(egg.children.some((child) => child.visible));
  action.onTargetLost();
  assert.equal(character.position.y, 0.53);
  assert.ok(egg.children.some((child) => child.visible));
  action.reset();
  assert.equal(egg.position.y, 0);
  assert.equal(egg.scale.x, 1);
});

test("each character leaves one permanent mark in a different position", () => {
  const positions = [];
  for (const characterType of [1, 2, 3]) {
    let earned = 0;
    const { action, egg } = setup(characterType, { onMarkEarned: () => { earned += 1; } });
    action.update(3000);
    const mark = egg.children.find((child) => child.visible);
    assert.ok(mark);
    positions.push(`${mark.position.x},${mark.position.y}`);
    assert.equal(earned, 1);
    action.start(4000);
    action.update(6000);
    assert.equal(earned, 1);
  }
  assert.equal(new Set(positions).size, 3);
});

test("a saved mark is visible when AR starts again", () => {
  const character = new THREE.Object3D();
  const egg = new THREE.Object3D();
  const anchor = { group: new THREE.Group() };
  anchor.group.add(character, egg);
  character.position.set(-0.78, 0, 0.05);
  character.scale.setScalar(0.92);
  createCharacterAction({ THREE, anchor, characterType: 1, character, egg, existingMark: true });
  assert.ok(egg.children.some((child) => child.visible));
});

test("all saved marks are restored together when AR starts again", () => {
  const character = new THREE.Object3D();
  const egg = new THREE.Object3D();
  const anchor = { group: new THREE.Group() };
  anchor.group.add(character, egg);
  character.position.set(-0.78, 0, 0.05);
  character.scale.setScalar(0.92);
  createCharacterAction({ THREE, anchor, characterType: 2, character, egg, existingMarks: [1, 2, 3] });
  assert.equal(egg.children.filter((child) => child.visible).length, 3);
});

test("event interaction earns a mark without drawing it on the egg", () => {
  let earned = 0;
  const { action, egg } = setup(1, {
    showPersistentMarks: false,
    onMarkEarned: () => { earned += 1; },
  });
  action.update(3000);
  assert.equal(earned, 1);
  assert.equal(egg.children.filter((child) => child.visible).length, 0);
});

test("event yamachan returns to the side instead of staying on the egg", () => {
  const { action, character } = setup(3, { settleAsHat: false, showPersistentMarks: false });
  action.update(2700);
  assert.ok(character.position.x < -0.65);
  action.update(3000);
  assert.equal(character.position.x, -0.78);
  assert.equal(character.position.y, 0);
});

test("losing the target restores an egg to its nest-sized scale", () => {
  const character = new THREE.Object3D();
  const egg = new THREE.Object3D();
  const anchor = { group: new THREE.Group() };
  anchor.group.add(character, egg);
  character.position.set(0.78, 0, 0.05);
  character.scale.setScalar(0.92);
  egg.position.y = 0.11;
  egg.scale.setScalar(0.78);
  const action = createCharacterAction({ THREE, anchor, characterType: 2, character, egg, showPersistentMarks: false });
  action.start(1000);
  action.update(1500);
  action.onTargetLost();
  assert.equal(egg.position.y, 0.11);
  assert.equal(egg.scale.x, 0.78);
});
