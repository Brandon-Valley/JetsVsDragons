import fs from 'node:fs';

const file = 'index.html';
let text = fs.readFileSync(file, 'utf8');
const marker = '// BETTER_PILOT_ASSET_V1';

function replaceOnce(oldText, newText, label) {
  if (!text.includes(oldText)) throw new Error(`Missing update anchor: ${label}`);
  text = text.replace(oldText, newText);
}

if (text.includes(marker)) {
  console.log('Better pilot update already applied.');
  process.exit(0);
}

replaceOnce(
  "const PARACHUTE_ASSET_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Parachute/glTF-Binary/Parachute.glb';",
  "const PARACHUTE_ASSET_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Parachute/glTF-Binary/Parachute.glb';\nconst PILOT_ASSET_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb'; // BETTER_PILOT_ASSET_V1",
  'pilot asset URL'
);

replaceOnce(
  "let parachuteAsset = null;\nlet healthPackAsset = null;",
  "let parachuteAsset = null;\nlet pilotAsset = null;\nlet pilotAnimationClips = [];\nlet healthPackAsset = null;",
  'pilot asset state'
);

replaceOnce(
`  loader.load(PARACHUTE_ASSET_URL, (gltf) => {
    parachuteAsset = prepareAsset(gltf.scene, 14, 0xffffff, 'supply');
    refreshSupplyDropAssets();
  }, undefined, () => {});`,
`  loader.load(PILOT_ASSET_URL, (gltf) => {
    pilotAsset = preparePilotCharacter(gltf.scene);
    pilotAnimationClips = gltf.animations ? gltf.animations.slice() : [];
  }, undefined, () => {
    pilotAsset = null;
    pilotAnimationClips = [];
  });

  loader.load(PARACHUTE_ASSET_URL, (gltf) => {
    parachuteAsset = prepareAsset(gltf.scene, 14, 0xffffff, 'supply');
    refreshSupplyDropAssets();
  }, undefined, () => {});`,
  'pilot asset loader'
);

replaceOnce(
  '<div id="assetNote">Assets: F-16 GLB and Mesh2Motion dragon. Target Mode uses the uploaded no-legs, double-sided Quaternius bullseye design (CC0).</div>',
  '<div id="assetNote">Assets: F-16 GLB, Mesh2Motion dragon, and the three.js Soldier character for the ejected pilot. Target Mode uses the uploaded no-legs, double-sided Quaternius bullseye design (CC0).</div>',
  'asset credit'
);

const oldPilotFunction = `function createEjectedPilot() {
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
}`;

const newPilotFunctions = `function preparePilotCharacter(root) {
  const asset = SkeletonUtils.clone(root);
  asset.name = 'loadedPilotCharacter';
  asset.traverse((o) => {
    if (!o.isMesh && !o.isSkinnedMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (o.material) {
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      o.material = materials.map((material) => {
        const cloned = material.clone();
        if (cloned.color) cloned.color.lerp(new THREE.Color(0x66705b), 0.10);
        if ('roughness' in cloned) cloned.roughness = Math.max(cloned.roughness || 0, 0.55);
        return cloned;
      });
      if (o.material.length === 1) o.material = o.material[0];
    }
  });
  const box = new THREE.Box3().setFromObject(asset);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 3.75 / Math.max(size.y || 1, 0.001);
  asset.scale.setScalar(scale);
  asset.position.set(-center.x * scale, -box.min.y * scale - 1.10, -center.z * scale);
  asset.rotation.y = Math.PI;
  return asset;
}

function createFallbackPilotModel() {
  const pilot = new THREE.Group();
  const suitMat = new THREE.MeshStandardMaterial({ color: 0x59654f, roughness: 0.88 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1c211f, roughness: 0.94 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0xdfe4e7, roughness: 0.45, metalness: 0.08 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x172631, roughness: 0.16, metalness: 0.72 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.10, 8, 14), suitMat);
  torso.position.y = 0.62;
  pilot.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.40, 18, 12), helmetMat);
  head.position.y = 1.72;
  pilot.add(head);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), visorMat);
  visor.position.set(0, 1.68, -0.30);
  visor.rotation.x = Math.PI * 0.40;
  pilot.add(visor);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.72, 6, 10), suitMat);
    arm.position.set(side * 0.48, 0.66, 0);
    arm.rotation.z = side * -0.22;
    pilot.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.90, 6, 10), suitMat);
    leg.position.set(side * 0.22, -0.66, 0);
    leg.rotation.z = side * 0.08;
    pilot.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.24, 0.58), bootMat);
    boot.position.set(side * 0.22, -1.24, -0.15);
    pilot.add(boot);
  }
  return pilot;
}

function createEjectedPilot() {
  const group = new THREE.Group();
  group.name = 'ejectedPilot';

  const seatMat = new THREE.MeshStandardMaterial({ color: 0x30363b, roughness: 0.74, metalness: 0.24 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.20, 1.72, 0.78), seatMat);
  seat.name = 'ejectionSeat';
  seat.position.set(0, 0.18, 0.42);
  seat.rotation.x = -0.12;
  seat.castShadow = true;
  group.add(seat);

  const pilotModel = pilotAsset ? SkeletonUtils.clone(pilotAsset) : createFallbackPilotModel();
  pilotModel.name = 'pilotModel';
  pilotModel.position.z -= 0.18;
  group.add(pilotModel);

  if (pilotAsset && pilotAnimationClips.length) {
    const mixer = new THREE.AnimationMixer(pilotModel);
    const idle = pilotAnimationClips.find((clip) => /idle/i.test(clip.name)) || pilotAnimationClips[0];
    if (idle) {
      const action = mixer.clipAction(idle);
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.timeScale = 0.55;
      action.play();
      group.userData.pilotMixer = mixer;
    }
  }

  const harnessMat = new THREE.MeshStandardMaterial({ color: 0x2c3026, roughness: 0.92 });
  for (const side of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.10, 0.08), harnessMat);
    strap.position.set(side * 0.36, 0.62, -0.42);
    strap.rotation.z = side * -0.10;
    group.add(strap);
  }
  const chestStrap = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.10, 0.08), harnessMat);
  chestStrap.position.set(0, 0.72, -0.44);
  group.add(chestStrap);

  return group;
}`;

replaceOnce(oldPilotFunction, newPilotFunctions, 'pilot character implementation');

replaceOnce(
  "  sequence.parachuteOpened = true;\n  const chute = createProceduralParachute();",
  "  sequence.parachuteOpened = true;\n  const ejectionSeat = sequence.group.getObjectByName('ejectionSeat');\n  if (ejectionSeat) ejectionSeat.visible = false;\n  const chute = createProceduralParachute();",
  'hide seat beneath parachute'
);

replaceOnce(
  "  sequence.time += dt;\n  if (!sequence.parachuteOpened) {",
  "  sequence.time += dt;\n  if (sequence.group.userData.pilotMixer) sequence.group.userData.pilotMixer.update(dt);\n  if (!sequence.parachuteOpened) {",
  'pilot animation update'
);

replaceOnce(
  "    finalScore.innerHTML = 'Jet lost at <b>' + formatTargetTime(targetElapsed) + '</b><span class=\"targetResult best\">Pilot ejected safely</span><small style=\"display:block;margin-top:8px;color:rgba(239,232,214,.72)\">' + bestText + '</small>';",
  "    finalScore.innerHTML = 'Jet lost at <b>' + formatTargetTime(targetElapsed) + '</b><small style=\"display:block;margin-top:8px;color:rgba(239,232,214,.72)\">' + bestText + '</small>';",
  'target result text'
);

replaceOnce(
  "    finalScore.innerHTML = 'Wave reached: <b>' + wave + '</b><span class=\"targetResult best\">Pilot ejected safely</span><small style=\"display:block;margin-top:8px;color:rgba(239,232,214,.72)\">' + sequence.reason + '</small>';",
  "    finalScore.innerHTML = 'Wave reached: <b>' + wave + '</b><small style=\"display:block;margin-top:8px;color:rgba(239,232,214,.72)\">' + sequence.reason + '</small>';",
  'dogfight result text'
);

for (const required of [
  marker,
  'const PILOT_ASSET_URL',
  'function preparePilotCharacter(root)',
  "pilotAnimationClips.find((clip) => /idle/i.test(clip.name))",
  "ejectionSeat.visible = false",
  'sequence.group.userData.pilotMixer.update(dt)'
]) {
  if (!text.includes(required)) throw new Error(`Validation failed: ${required}`);
}
if (text.includes('Pilot ejected safely')) throw new Error('Old result text is still present');

fs.writeFileSync(file, text);
console.log('Applied better animated pilot model update.');
