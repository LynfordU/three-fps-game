/*
 * Entry point for a simple first‑person shooter built with Three.js.
 *
 * This script sets up a zero‑gravity arena inspired by Orson Scott Card's
 * "Ender's Game" battle room. The player can freely move in all axes
 * (WASD controls horizontal movement; Space/Shift control vertical movement)
 * and look around with the mouse. Left mouse button fires projectiles from
 * a rudimentary rifle view‑model. The environment consists of a glowing
 * grid cube and floating cover blocks. Lighting is tuned for brightness
 * using ACES tone mapping and multiple light sources.
 */

import * as THREE from 'https://unpkg.com/three@0.150.0/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.150.0/examples/jsm/controls/PointerLockControls.js';

// Retrieve the instruction overlay and attach pointer‑lock behaviour.
const instructions = document.getElementById('instructions');

// Scene, camera and renderer setup.
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
document.body.appendChild(renderer.domElement);

// Lighting: Hemisphere light simulates ambient sky/ground, directional adds highlights.
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// Pointer lock controls for first‑person movement.
const controls = new PointerLockControls(camera, document.body);

instructions.addEventListener('click', () => {
  controls.lock();
});
controls.addEventListener('lock', () => {
  instructions.style.display = 'none';
});
controls.addEventListener('unlock', () => {
  instructions.style.display = '';
});

// Add the camera to the scene (it already inherits from Object3D). The rifle
// model is attached to the camera so it moves and rotates with the player.
scene.add(camera);

// Build the arena: a cube outlined with grid lines for the battle room.
const roomSize = 40;
const roomGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);
const edges = new THREE.EdgesGeometry(roomGeometry);
const gridMaterial = new THREE.LineBasicMaterial({ color: 0x2222ff });
const room = new THREE.LineSegments(edges, gridMaterial);
scene.add(room);

// Generate floating cover blocks. These are randomly positioned boxes the
// player can use for cover or navigation cues. Materials are slightly
// emissive to stand out against the dark background.
const coverBlocks = [];
for (let i = 0; i < 30; i++) {
  const size = 1 + Math.random();
  const geom = new THREE.BoxGeometry(size, size, size);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x8888aa,
    emissive: 0x111122,
    metalness: 0.2,
    roughness: 0.7,
  });
  const block = new THREE.Mesh(geom, mat);
  block.position.set(
    (Math.random() - 0.5) * (roomSize - 4),
    (Math.random() - 0.5) * (roomSize - 4),
    (Math.random() - 0.5) * (roomSize - 4)
  );
  scene.add(block);
  coverBlocks.push(block);
}

// Create a simple rifle view‑model: a thin box attached to the camera. This
// represents the player's weapon; it doesn't affect gameplay beyond visual.
const rifleGeom = new THREE.BoxGeometry(0.1, 0.05, 0.6);
const rifleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.4, roughness: 0.6 });
const rifle = new THREE.Mesh(rifleGeom, rifleMat);
// Position the rifle relative to the camera. Offsetting along the camera's
// right/down axes so it's visible in the bottom right of the viewport.
rifle.position.set(0.25, -0.25, -0.7);
rifle.rotation.set(0, Math.PI / 8, 0);
camera.add(rifle);

// Bullets container. Each bullet has a mesh and a velocity vector stored in
// userData.velocity. They are removed when leaving the room bounds.
const bullets = [];
let lastShotTime = 0;
const shootInterval = 200; // milliseconds between shots
let firing = false;

// Listen for mouse down/up to enable continuous fire. Only left button fires.
document.addEventListener('mousedown', (event) => {
  if (event.button === 0) firing = true;
});
document.addEventListener('mouseup', (event) => {
  if (event.button === 0) firing = false;
});

// Keyboard movement flags for six degrees of freedom (forward/back, left/right, up/down).
const movement = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
};

function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW':
    case 'ArrowUp':
      movement.forward = true;
      break;
    case 'KeyS':
    case 'ArrowDown':
      movement.backward = true;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      movement.left = true;
      break;
    case 'KeyD':
    case 'ArrowRight':
      movement.right = true;
      break;
    case 'Space':
      movement.up = true;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      movement.down = true;
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW':
    case 'ArrowUp':
      movement.forward = false;
      break;
    case 'KeyS':
    case 'ArrowDown':
      movement.backward = false;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      movement.left = false;
      break;
    case 'KeyD':
    case 'ArrowRight':
      movement.right = false;
      break;
    case 'Space':
      movement.up = false;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      movement.down = false;
      break;
  }
}

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Helper to spawn a bullet at the camera's position heading forward.
function spawnBullet() {
  const geometry = new THREE.SphereGeometry(0.05, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffee00 });
  const bullet = new THREE.Mesh(geometry, material);
  // Initialize position and orientation from camera.
  bullet.position.copy(camera.position);
  bullet.quaternion.copy(camera.quaternion);
  // Velocity is a vector pointing forward. Multiply by speed factor.
  const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).multiplyScalar(30);
  bullet.userData.velocity = velocity;
  scene.add(bullet);
  bullets.push(bullet);
}

// Update bullets: move each one and cull those outside the arena.
function updateBullets(delta) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.addScaledVector(b.userData.velocity, delta);
    // Remove bullets that have travelled outside the arena.
    if (
      Math.abs(b.position.x) > roomSize / 2 + 2 ||
      Math.abs(b.position.y) > roomSize / 2 + 2 ||
      Math.abs(b.position.z) > roomSize / 2 + 2
    ) {
      scene.remove(b);
      bullets.splice(i, 1);
    }
  }
}

// Velocity accumulator for smooth movement. Units: units per second.
const velocity = new THREE.Vector3();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = performance.now();

  // Handle continuous firing based on a fixed rate.
  if (firing && time - lastShotTime > shootInterval) {
    spawnBullet();
    lastShotTime = time;
  }

  updateBullets(delta);

  // Damp velocities to reduce endless drift.
  const drag = 5;
  velocity.multiplyScalar(Math.max(0, 1 - drag * delta));

  // Build movement direction from flags. This vector is in camera space,
  // so we transform it into world space later.
  const dir = new THREE.Vector3();
  if (movement.forward) dir.z -= 1;
  if (movement.backward) dir.z += 1;
  if (movement.left) dir.x -= 1;
  if (movement.right) dir.x += 1;
  if (movement.up) dir.y += 1;
  if (movement.down) dir.y -= 1;
  if (dir.lengthSq() > 0) dir.normalize();
  const speed = 10; // units per second
  dir.multiplyScalar(speed * delta);

  // Transform direction from camera (local) space to world space. Then add to velocity.
  const worldDir = dir.applyQuaternion(camera.quaternion);
  velocity.add(worldDir);

  // Move the player via controls. We can't simply set camera.position because
  // PointerLockControls expects relative movement in world axes.
  controls.moveRight(velocity.x * delta);
  controls.moveForward(velocity.z * delta);
  // Y movement: manually adjust camera.position.y since controls has no
  // built‑in vertical movement.
  camera.position.y += velocity.y * delta;

  // Clamp the player inside the arena. Prevent leaving the cube.
  camera.position.x = Math.max(-roomSize / 2 + 1, Math.min(roomSize / 2 - 1, camera.position.x));
  camera.position.y = Math.max(-roomSize / 2 + 1, Math.min(roomSize / 2 - 1, camera.position.y));
  camera.position.z = Math.max(-roomSize / 2 + 1, Math.min(roomSize / 2 - 1, camera.position.z));

  renderer.render(scene, camera);
}

animate();

// Respond to window resizing.
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
