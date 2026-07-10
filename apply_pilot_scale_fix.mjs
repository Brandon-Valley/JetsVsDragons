import fs from 'node:fs';

const file = 'index.html';
let text = fs.readFileSync(file, 'utf8');
const marker = '// PILOT_SCALE_FIX_V1';

function replaceOnce(oldText, newText, label) {
  if (!text.includes(oldText)) throw new Error(`Missing scale fix anchor: ${label}`);
  text = text.replace(oldText, newText);
}

if (text.includes(marker)) {
  console.log('Pilot scale fix already applied.');
  process.exit(0);
}

replaceOnce(
  "const SUPPLY_DROP_MAX_TIME = 130;",
  "const SUPPLY_DROP_MAX_TIME = 130;\nconst EJECTED_PILOT_HEIGHT = 1.45; // PILOT_SCALE_FIX_V1\nconst EJECTION_PARACHUTE_SCALE = 1.22;\nconst EJECTION_PARACHUTE_Y = 2.42;",
  'pilot scale constants'
);

replaceOnce(
  "  const scale = 3.75 / Math.max(size.y || 1, 0.001);\n  asset.scale.setScalar(scale);\n  asset.position.set(-center.x * scale, -box.min.y * scale - 1.10, -center.z * scale);",
  "  const scale = EJECTED_PILOT_HEIGHT / Math.max(size.y || 1, 0.001);\n  asset.scale.setScalar(scale);\n  asset.position.set(-center.x * scale, -box.min.y * scale - 0.18, -center.z * scale);",
  'loaded pilot height'
);

replaceOnce(
  "  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.10, 8, 14), suitMat);",
  "  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.64, 8, 14), suitMat);",
  'fallback torso scale'
);
replaceOnce(
  "  torso.position.y = 0.62;",
  "  torso.position.y = 0.36;",
  'fallback torso position'
);
replaceOnce(
  "  const head = new THREE.Mesh(new THREE.SphereGeometry(0.40, 18, 12), helmetMat);\n  head.position.y = 1.72;",
  "  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 12), helmetMat);\n  head.position.y = 0.98;",
  'fallback head scale'
);
replaceOnce(
  "  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), visorMat);\n  visor.position.set(0, 1.68, -0.30);",
  "  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), visorMat);\n  visor.position.set(0, 0.96, -0.18);",
  'fallback visor scale'
);
replaceOnce(
  "    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.72, 6, 10), suitMat);\n    arm.position.set(side * 0.48, 0.66, 0);",
  "    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.42, 6, 10), suitMat);\n    arm.position.set(side * 0.28, 0.38, 0);",
  'fallback arm scale'
);
replaceOnce(
  "    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.90, 6, 10), suitMat);\n    leg.position.set(side * 0.22, -0.66, 0);",
  "    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.52, 6, 10), suitMat);\n    leg.position.set(side * 0.13, -0.38, 0);",
  'fallback leg scale'
);
replaceOnce(
  "    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.24, 0.58), bootMat);\n    boot.position.set(side * 0.22, -1.24, -0.15);",
  "    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.34), bootMat);\n    boot.position.set(side * 0.13, -0.72, -0.09);",
  'fallback boot scale'
);

replaceOnce(
  "  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.20, 1.72, 0.78), seatMat);\n  seat.name = 'ejectionSeat';\n  seat.position.set(0, 0.18, 0.42);",
  "  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.92, 0.44), seatMat);\n  seat.name = 'ejectionSeat';\n  seat.position.set(0, 0.02, 0.24);",
  'ejection seat scale'
);

replaceOnce(
  "  pilotModel.position.z -= 0.18;",
  "  pilotModel.position.set(0, -0.08, -0.06);",
  'pilot model position'
);

replaceOnce(
  "    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.10, 0.08), harnessMat);\n    strap.position.set(side * 0.36, 0.62, -0.42);",
  "    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.18, 0.045), harnessMat);\n    strap.position.set(side * 0.20, 0.32, -0.24);",
  'harness strap scale'
);
replaceOnce(
  "  const chestStrap = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.10, 0.08), harnessMat);\n  chestStrap.position.set(0, 0.72, -0.44);",
  "  const chestStrap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.055, 0.045), harnessMat);\n  chestStrap.position.set(0, 0.38, -0.25);",
  'chest strap scale'
);

replaceOnce(
  "  chute.position.y = 5.35;\n  chute.scale.setScalar(0.82);",
  "  chute.position.y = EJECTION_PARACHUTE_Y;\n  chute.scale.setScalar(EJECTION_PARACHUTE_SCALE);",
  'parachute placement'
);

replaceOnce(
  "  if (sequence.parachute) sequence.parachute.rotation.z = -sequence.group.rotation.z * 0.48;",
  "  if (sequence.parachute) {\n      sequence.parachute.rotation.z = -sequence.group.rotation.z * 0.48;\n      sequence.parachute.position.y = EJECTION_PARACHUTE_Y + Math.sin(sequence.time * 2.2) * 0.045;\n    }",
  'parachute settle bob'
);

for (const required of [
  marker,
  'const EJECTED_PILOT_HEIGHT = 1.45',
  'const EJECTION_PARACHUTE_SCALE = 1.22',
  'chute.position.y = EJECTION_PARACHUTE_Y',
  'pilotModel.position.set(0, -0.08, -0.06)'
]) {
  if (!text.includes(required)) throw new Error(`Validation failed: ${required}`);
}
if (text.includes('3.75 / Math.max(size.y')) throw new Error('Old oversized pilot scale remains');
if (text.includes('chute.scale.setScalar(0.82)')) throw new Error('Old small parachute scale remains');

fs.writeFileSync(file, text);
console.log('Applied pilot scale/parachute proportion fix.');
