import fs from 'node:fs';

const file = 'index.html';
let text = fs.readFileSync(file, 'utf8');
const marker = '// JET_EJECTION_STATIC_V3';

function replaceOnce(oldText, newText, label) {
  if (!text.includes(oldText)) throw new Error(`Missing patch anchor: ${label}`);
  text = text.replace(oldText, newText);
}

if (text.includes(marker)) {
  console.log('Static jet ejection patch already applied.');
  process.exit(0);
}

replaceOnce(
  "let musicEnabled = true;\ntry { musicEnabled = localStorage.getItem('jetsVsDragonsMusicEnabled') !== 'false'; } catch (e) {}\nlet internetSfxPromise = null;",
  "let musicEnabled = true;\ntry { musicEnabled = localStorage.getItem('jetsVsDragonsMusicEnabled') !== 'false'; } catch (e) {}\n\n// JET_EJECTION_STATIC_V3\nlet jetDeathSequence = null;\nlet internetSfxPromise = null;",
  'death sequence state'
);

replaceOnce(
`function pauseGame() {
  playGameSound('ui', 0.35, 360, 0.05, 'triangle', 0.04);
  paused = true;
  if (missileBtn) missileBtn.classList.remove('armed');
  pauseScreen.classList.add('visible');
}
function resumeGame() {
  playGameSound('ui', 0.35, 520, 0.05, 'triangle', 0.04);
  paused = false;
  pauseScreen.classList.remove('visible');
  if (clock) clock.getDelta();
}`,
`function pauseGame() {
  playGameSound('ui', 0.35, 360, 0.05, 'triangle', 0.04);
  paused = true;
  pauseGameMusic();
  if (missileBtn) missileBtn.classList.remove('armed');
  pauseScreen.classList.add('visible');
}
function resumeGame() {
  playGameSound('ui', 0.35, 520, 0.05, 'triangle', 0.04);
  paused = false;
  pauseScreen.classList.remove('visible');
  resumeGameMusic();
  if (clock) clock.getDelta();
}`,
  'pause and resume music'
);

replaceOnce(
  "  if (running && !paused && !gameOver && player) update(dt || 0.016);",
  "  if (jetDeathSequence) updateJetDeathSequence(dt || 0.016);\n  else if (running && !paused && !gameOver && player) update(dt || 0.016);",
  'death sequence animation loop'
);

replaceOnce(
`  const playerMountainRadius = playerIsDragon() ? clamp(6.2 + getDragonScale(player) * 0.42, 7.0, 11.5) : 5.8;
  if (projectileHitMountain(player.pos, playerMountainRadius)) {
    player.pos.copy(previousPos);
    player.pitch = Math.max(player.pitch, 0.16);
    player.yaw += (joyX >= 0 ? -1 : 1) * 0.16;
    player.speed = Math.max(player.baseSpeed * 0.58, player.speed * 0.66);
    if (mountainHitCooldown <= 0) {
      mountainHitCooldown = 0.65;
      player.health = clamp(player.health - 7, 0, 100);
      showMessage('Mountain collision');
      playGameSound('hit', 0.58, 82, 0.10, 'sawtooth', 0.075);
      spawnSpark(player.pos.clone().addScaledVector(forward, 3), 0xffd27a, 0.8, 0.55);
    }
  }`,
`  const playerMountainRadius = playerIsDragon() ? clamp(6.2 + getDragonScale(player) * 0.42, 7.0, 11.5) : 5.8;
  if (projectileHitMountain(player.pos, playerMountainRadius)) {
    if (playerIsJet()) {
      beginJetDeath('Mountain impact');
      return;
    }
    player.pos.copy(previousPos);
    player.pitch = Math.max(player.pitch, 0.22);
    player.yaw += (joyX >= 0 ? -1 : 1) * 0.22;
    player.speed = Math.max(player.baseSpeed * 0.72, player.speed * 0.74);
    if (mountainHitCooldown <= 0) {
      mountainHitCooldown = 0.65;
      showMessage('Dragon bounced off mountain');
      playGameSound('hit', 0.34, 105, 0.07, 'triangle', 0.045);
      spawnSpark(player.pos.clone().addScaledVector(forward, 3), 0xffd27a, 0.8, 0.55);
    }
  }`,
  'player mountain behavior'
);

replaceOnce(
  "  if (player.health <= 0) endGame();",
  "  if (player.health <= 0) {\n    if (playerIsJet()) beginJetDeath('Aircraft destroyed');\n    else endGame();\n  }",
  'player jet death dispatch'
);

replaceOnce(
`function stopGameMusic() {
  musicShouldPlay = false;
  if (!musicWidget || !musicReady) return;
  try { musicWidget.pause(); } catch (e) {}
}`,
`function pauseGameMusic() {
  if (!musicWidget || !musicReady) return;
  try { musicWidget.pause(); } catch (e) {}
}

function resumeGameMusic() {
  if (!musicShouldPlay || !musicEnabled || gameOver || paused) return;
  if (!musicWidget || !musicReady) return;
  try {
    musicWidget.setVolume(GAME_MUSIC_VOLUME);
    musicWidget.play();
  } catch (e) {}
}

function stopGameMusic() {
  musicShouldPlay = false;
  if (!musicWidget || !musicReady) return;
  try { musicWidget.pause(); } catch (e) {}
}`,
  'music pause helpers'
);

replaceOnce(
  "    else if (musicShouldPlay) musicWidget.play();",
  "    else if (musicShouldPlay && !paused && !gameOver) musicWidget.play();",
  'visibility music guard'
);
replaceOnce(
  "        if (musicShouldPlay && musicEnabled) musicWidget.play();",
  "        if (musicShouldPlay && musicEnabled && !paused && !gameOver) musicWidget.play();",
  'ready music guard'
);
replaceOnce(
  "        if (shouldPlay && musicEnabled) musicWidget.play();",
  "        if (shouldPlay && musicEnabled && !paused && !gameOver) musicWidget.play();",
  'loaded music guard'
);
replaceOnce(
  "    if (musicEnabled && musicShouldPlay) {",
  "    if (musicEnabled && musicShouldPlay && !paused && !gameOver) {",
  'toggle music guard'
);
replaceOnce(
  "  loadCurrentMusicTrack(forcePlay && musicEnabled);",
  "  loadCurrentMusicTrack(forcePlay && musicEnabled && !paused && !gameOver);",
  'next track guard'
);

replaceOnce(
`  const forward = directionFromAngles(d.yaw, d.pitch);
  d.speed = lerp(d.speed, dist < 130 ? 160 : 122 + wave * 3, dt * 0.55);
  d.pos.addScaledVector(forward, d.speed * dt);
  if (d.pos.y < world.minY + 14) { d.pos.y = world.minY + 14; d.pitch = Math.max(d.pitch, 0.08); }`,
`  const forward = directionFromAngles(d.yaw, d.pitch);
  d.speed = lerp(d.speed, dist < 130 ? 160 : 122 + wave * 3, dt * 0.55);
  d.pos.addScaledVector(forward, d.speed * dt);
  if (projectileHitMountain(d.pos, 5.8)) {
    spawnExplosion(d.pos, 0x7fd8ff, 20, 1.05);
    playGameSound('explosion', 0.72, 190, 0.18, 'sawtooth', 0.08);
    scene.remove(d.group);
    dragons = dragons.filter(x => x !== d);
    showEvent('Enemy Jet Crashed', 'cool');
    return;
  }
  if (d.pos.y < world.minY + 14) { d.pos.y = world.minY + 14; d.pitch = Math.max(d.pitch, 0.08); }`,
  'enemy jet mountain crash'
);

replaceOnce(
`  const forward = directionFromAngles(d.yaw, d.pitch);
  const sizeT = clamp((displayScale - DRAGON_MIN_DISPLAY_SCALE) / (DRAGON_MAX_DISPLAY_SCALE - DRAGON_MIN_DISPLAY_SCALE), 0, 1);
  d.speed = lerp(d.speed, (dist < 90 + displayScale * 4 ? 88 : 58 + wave * 2.5) * lerp(1.0, 0.68, sizeT), dt * 0.4);
  d.pos.addScaledVector(forward, d.speed * dt);
  if (d.pos.y < world.minY + 18) { d.pos.y = world.minY + 18; d.pitch = Math.max(d.pitch, 0.08); }`,
`  const forward = directionFromAngles(d.yaw, d.pitch);
  const sizeT = clamp((displayScale - DRAGON_MIN_DISPLAY_SCALE) / (DRAGON_MAX_DISPLAY_SCALE - DRAGON_MIN_DISPLAY_SCALE), 0, 1);
  d.speed = lerp(d.speed, (dist < 90 + displayScale * 4 ? 88 : 58 + wave * 2.5) * lerp(1.0, 0.68, sizeT), dt * 0.4);
  const dragonPreviousPos = d.pos.clone();
  d.pos.addScaledVector(forward, d.speed * dt);
  if (projectileHitMountain(d.pos, clamp(6.2 + displayScale * 0.42, 7.0, 11.5))) {
    d.pos.copy(dragonPreviousPos);
    d.pitch = Math.max(d.pitch, 0.16);
    d.yaw += d.turnBias * 0.24;
    d.speed *= 0.78;
  }
  if (d.pos.y < world.minY + 18) { d.pos.y = world.minY + 18; d.pitch = Math.max(d.pitch, 0.08); }`,
  'enemy dragon mountain bounce'
);

const deathFunctions = String.raw`
function createEjectedPilot() {
  const group = new THREE.Group();
  group.name = 'ejectedPilot';
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x343b42, roughness: 0.78, metalness: 0.18 });
  const suitMat = new THREE.MeshStandardMaterial({ color: 0x68725f, roughness: 0.9 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0xe9edf0, roughness: 0.42, metalness: 0.08 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x172631, roughness: 0.18, metalness: 0.68 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.6, 0.75), seatMat);
  seat.position.set(0, 0.25, 0.22);
  seat.rotation.x = -0.12;
  seat.castShadow = true;
  group.add(seat);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.44, 1.25, 10), suitMat);
  torso.position.set(0, 0.8, -0.16);
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 10), helmetMat);
  head.position.set(0, 1.72, -0.18);
  head.castShadow = true;
  group.add(head);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.29, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), visorMat);
  visor.position.set(0, 1.68, -0.43);
  visor.rotation.x = Math.PI * 0.42;
  group.add(visor);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.72, 8), suitMat);
    arm.position.set(side * 0.47, 0.78, -0.11);
    arm.rotation.z = side * -0.34;
    arm.castShadow = true;
    group.add(arm);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.85, 8), suitMat);
    leg.position.set(side * 0.22, -0.38, -0.08);
    leg.rotation.z = side * 0.12;
    leg.castShadow = true;
    group.add(leg);
  }
  group.scale.setScalar(1.25);
  return group;
}

function openEjectionParachute(sequence) {
  if (!sequence || sequence.parachuteOpened) return;
  sequence.parachuteOpened = true;
  const chute = createProceduralParachute();
  chute.name = 'ejectionParachute';
  chute.position.y = 5.35;
  chute.scale.setScalar(0.82);
  sequence.group.add(chute);
  sequence.parachute = chute;
  sequence.velocity.y = Math.min(sequence.velocity.y, -2.5);
  spawnSpark(sequence.position.clone().add(new THREE.Vector3(0, 5.2, 0)), 0xffffff, 0.55, 0.7);
  playGameSound('boost', 0.42, 440, 0.12, 'triangle', 0.05);
  showEvent('Parachute Deployed', 'cool');
}

function beginJetDeath(reason = 'Aircraft destroyed') {
  if (jetDeathSequence || gameOver || !player || playerIsDragon()) return;
  gameOver = true;
  running = false;
  paused = false;
  input.firing = false;
  input.missile = false;
  input.boost = false;
  input.rolling = false;
  input.lookBack = false;
  stopGameMusic();
  pauseScreen.classList.remove('visible');
  controls.classList.add('hidden');
  if (missileBtn) missileBtn.classList.remove('armed');

  const crashPos = player.pos.clone();
  const forward = directionFromAngles(player.yaw, player.pitch).normalize();
  const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw)).normalize();

  spawnExplosion(crashPos, 0xff9b32, 34, 1.15);
  spawnExplosion(crashPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfff0a0, 22, 0.88);
  for (let i = 0; i < 10; i++) {
    spawnSpark(crashPos.clone().add(new THREE.Vector3(rand(-2, 2), rand(-1, 2), rand(-2, 2))), 0xffc05c, rand(0.25, 0.62), rand(0.45, 0.9));
  }
  playGameSound('explosion', 1.0, 62, 0.42, 'sawtooth', 0.13);

  if (player.group) {
    player.group.visible = false;
    scene.remove(player.group);
  }
  player.health = 0;

  const pilot = createEjectedPilot();
  const pilotPos = crashPos.clone().add(new THREE.Vector3(0, 2.4, 0));
  pilot.position.copy(pilotPos);
  pilot.rotation.y = player.yaw;
  scene.add(pilot);

  jetDeathSequence = {
    group: pilot,
    position: pilotPos,
    velocity: forward.clone().multiplyScalar(-9).add(new THREE.Vector3(0, 26, 0)),
    forward: forward.clone(),
    right,
    time: 0,
    parachuteOpened: false,
    parachute: null,
    reason
  };
  showEvent(reason === 'Mountain impact' ? 'Mountain Impact - Eject!' : 'Eject! Eject!', 'hot');
}

function updateJetDeathSequence(dt) {
  const sequence = jetDeathSequence;
  if (!sequence) return;
  sequence.time += dt;
  if (!sequence.parachuteOpened) {
    sequence.velocity.y -= 24 * dt;
    sequence.position.addScaledVector(sequence.velocity, dt);
    sequence.group.rotation.x += dt * 1.25;
    sequence.group.rotation.z += dt * 1.7;
    if (sequence.time >= 0.48) openEjectionParachute(sequence);
  } else {
    const settle = 1 - Math.pow(0.025, dt);
    sequence.velocity.x = lerp(sequence.velocity.x, 0, settle);
    sequence.velocity.z = lerp(sequence.velocity.z, 0, settle);
    sequence.velocity.y = lerp(sequence.velocity.y, -8.2, settle);
    sequence.position.addScaledVector(sequence.velocity, dt);
    sequence.group.rotation.x = lerp(sequence.group.rotation.x, 0, settle);
    sequence.group.rotation.z = Math.sin(sequence.time * 3.1) * 0.10;
    if (sequence.parachute) sequence.parachute.rotation.z = -sequence.group.rotation.z * 0.48;
  }
  sequence.position.y = Math.max(4, sequence.position.y);
  sequence.group.position.copy(sequence.position);
  const cameraTarget = sequence.position.clone()
    .addScaledVector(sequence.forward, -24)
    .addScaledVector(sequence.right, 12)
    .add(new THREE.Vector3(0, 11, 0));
  camera.position.lerp(cameraTarget, 1 - Math.pow(0.006, dt));
  camera.lookAt(sequence.position.clone().add(new THREE.Vector3(0, 2.6, 0)));
  updateParticles(dt);
  updateContrails(dt);
  if (messageTimer > 0) {
    messageTimer -= dt;
    if (messageTimer <= 0) messageEl.classList.remove('show');
  }
  if (eventTimer > 0) {
    eventTimer -= dt;
    if (eventTimer <= 0 && eventBannerEl) eventBannerEl.classList.remove('show');
  }
  if (sequence.time >= 2.7) finishJetDeathSequence();
}

function finishJetDeathSequence() {
  const sequence = jetDeathSequence;
  if (!sequence) return;
  if (sequence.group) scene.remove(sequence.group);
  jetDeathSequence = null;
  if (gameMode === 'target') {
    const bestText = targetBest ? ('Best: ' + formatTargetTime(targetBest)) : 'No best time yet';
    finalScore.innerHTML = 'Jet lost at <b>' + formatTargetTime(targetElapsed) + '</b><span class="targetResult best">Pilot ejected safely</span><small style="display:block;margin-top:8px;color:rgba(239,232,214,.72)">' + bestText + '</small>';
    configureGameOverMenu('target');
  } else {
    finalScore.innerHTML = 'Wave reached: <b>' + wave + '</b><span class="targetResult best">Pilot ejected safely</span><small style="display:block;margin-top:8px;color:rgba(239,232,214,.72)">' + sequence.reason + '</small>';
    configureGameOverMenu(gameMode);
  }
  gameOverScreen.classList.add('visible');
  controls.classList.add('hidden');
  if (missileBtn) missileBtn.classList.remove('armed');
}

`;

replaceOnce(
  'function completeTargetMode() {',
  deathFunctions + 'function completeTargetMode() {',
  'death sequence functions'
);
replaceOnce(
  "  gameOver = true;\n  running = false;\n  const oldBest = targetBest;",
  "  gameOver = true;\n  running = false;\n  stopGameMusic();\n  const oldBest = targetBest;",
  'target completion music'
);
replaceOnce(
  "function endGame() {\n  gameOver = true;\n  running = false;",
  "function endGame() {\n  gameOver = true;\n  running = false;\n  stopGameMusic();",
  'death music'
);

for (const required of [marker, 'function createEjectedPilot()', "beginJetDeath('Mountain impact')", 'Dragon bounced off mountain', 'Enemy Jet Crashed', 'pauseGameMusic();', 'sequence.time >= 2.7']) {
  if (!text.includes(required)) throw new Error(`Validation failed: ${required}`);
}

fs.writeFileSync(file, text);
console.log('Applied static jet crash/ejection patch.');
