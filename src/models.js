/**
 * Procedural 3D Low-Poly Models & Rigging for Dino 3D Runner
 * Built completely using Three.js primitives and materials.
 */
class ModelFactory {
  constructor() {
    this.materialsCache = {};
  }

  // Pre-configured skin palettes
  static SKINS = {
    classic: {
      id: 'classic',
      name: 'Dino Klasyczny',
      desc: 'Wierny oryginałowi z przeglądarki, zrekonstruowany w soczystym 3D.',
      trait: 'Podstawowa forma Rexa',
      color: 0x4caf50,
      bellyColor: 0x81c784,
      spineColor: 0x2e7d32,
      eyeColor: 0x111111,
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x000000,
      unlockedAtLevel: 1
    },
    desert: {
      id: 'desert',
      name: 'Raptor Pustynny',
      desc: 'Zwinny drapieżnik zahartowany w piekącym słońcu wydm.',
      trait: '+5% Prędkości bazowej',
      color: 0xd4a373,
      bellyColor: 0xfaedcd,
      spineColor: 0xbc6c25,
      eyeColor: 0x331100,
      roughness: 0.7,
      metalness: 0.05,
      emissive: 0x000000,
      unlockedAtLevel: 3
    },
    cyber: {
      id: 'cyber',
      name: 'Cyber Rex 2077',
      desc: 'Wzmocniony stopem tytanu i neonowymi procesorami kwantowymi.',
      trait: 'Wbudowany radar na Bursztyn',
      color: 0x1a2130,
      bellyColor: 0x2e3a4e,
      spineColor: 0x00f5ff,
      eyeColor: 0xff0055,
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0x003344,
      unlockedAtLevel: 7
    },
    magma: {
      id: 'magma',
      name: 'Wulkaniczny Tytan',
      desc: 'Zrodzony z płynnej lawy. Jego kroki roztapiają skały.',
      trait: '+1 Sekunda do czasu trwania Sprintu',
      color: 0x251616,
      bellyColor: 0x4a1e1e,
      spineColor: 0xff4500,
      eyeColor: 0xffaa00,
      roughness: 0.5,
      metalness: 0.2,
      emissive: 0x330d00,
      unlockedAtLevel: 12
    },
    cosmic: {
      id: 'cosmic',
      name: 'Kosmiczny Lewiatan',
      desc: 'Pradawna istota podróżująca między wymiarami gwiezdnymi.',
      trait: '+10% Mnożnik Punktów i XP',
      color: 0x100b2b,
      bellyColor: 0x251b54,
      spineColor: 0xc084fc,
      eyeColor: 0x00ffff,
      roughness: 0.15,
      metalness: 0.7,
      emissive: 0x1f0b4a,
      unlockedAtLevel: 20
    }
  };

  /* ---------------- T-REX PLAYER RIG ---------------- */

  createDino(skinId = 'classic') {
    const skin = ModelFactory.SKINS[skinId] || ModelFactory.SKINS.classic;

    const dinoRoot = new THREE.Group();
    dinoRoot.name = 'dino_root';

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: skin.color,
      roughness: skin.roughness,
      metalness: skin.metalness,
      emissive: skin.emissive,
      flatShading: true
    });

    const bellyMat = new THREE.MeshStandardMaterial({
      color: skin.bellyColor,
      roughness: skin.roughness,
      metalness: skin.metalness,
      flatShading: true
    });

    const spineMat = new THREE.MeshStandardMaterial({
      color: skin.spineColor,
      roughness: 0.3,
      metalness: skin.id === 'cyber' ? 0.9 : 0.2,
      emissive: skin.id === 'cyber' ? 0x00c8d7 : (skin.id === 'magma' ? 0xcc2200 : 0x000000),
      flatShading: true
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: skin.eyeColor });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const clawMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });

    // --- TORSO / PELVIS ---
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.4, 0);
    dinoRoot.add(torsoGroup);

    const bodyGeo = new THREE.BoxGeometry(0.8, 1.1, 1.3);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.position.set(0, 0, 0);
    bodyMesh.rotation.x = -0.15; // Lean forward
    torsoGroup.add(bodyMesh);

    // Belly patch
    const bellyGeo = new THREE.BoxGeometry(0.65, 0.9, 0.4);
    const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    bellyMesh.position.set(0, -0.1, 0.5);
    bellyMesh.rotation.x = -0.15;
    torsoGroup.add(bellyMesh);

    // --- NECK & HEAD GROUP ---
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 0.45, 0.55);
    torsoGroup.add(neckGroup);

    // Neck
    const neckGeo = new THREE.BoxGeometry(0.55, 0.65, 0.6);
    const neckMesh = new THREE.Mesh(neckGeo, bodyMat);
    neckMesh.position.set(0, 0.2, 0.1);
    neckMesh.rotation.x = -0.3;
    neckMesh.castShadow = true;
    neckGroup.add(neckMesh);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.5, 0.25);
    neckGroup.add(headGroup);

    // Main cranium
    const headGeo = new THREE.BoxGeometry(0.85, 0.75, 1.1);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.set(0, 0.1, 0.15);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.7, 0.55, 0.85);
    const snoutMesh = new THREE.Mesh(snoutGeo, bodyMat);
    snoutMesh.position.set(0, -0.05, 0.9);
    snoutMesh.castShadow = true;
    headGroup.add(snoutMesh);

    // Teeth
    for (let side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const toothGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
        const tooth = new THREE.Mesh(toothGeo, whiteMat);
        tooth.position.set(side * 0.32, -0.3, 0.65 + i * 0.22);
        tooth.rotation.x = Math.PI;
        headGroup.add(tooth);
      }
    }

    // Eyes
    for (let side of [-1, 1]) {
      const eyeSocket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.2), whiteMat);
      eyeSocket.position.set(side * 0.44, 0.2, 0.35);
      headGroup.add(eyeSocket);

      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.14), eyeMat);
      pupil.position.set(side * 0.5, 0.2, 0.38);
      headGroup.add(pupil);
    }

    // Lower Jaw (hinged for roaring/chomping)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.28, 0.4);
    headGroup.add(jawGroup);

    const jawGeo = new THREE.BoxGeometry(0.65, 0.2, 0.9);
    const jawMesh = new THREE.Mesh(jawGeo, bellyMat);
    jawMesh.position.set(0, -0.05, 0.4);
    jawMesh.castShadow = true;
    jawGroup.add(jawMesh);

    // --- BACK SPINES / RIDGES ---
    for (let i = 0; i < 5; i++) {
      const spineGeo = new THREE.ConeGeometry(0.09, 0.3, 4);
      const spine = new THREE.Mesh(spineGeo, spineMat);
      spine.position.set(0, 0.55 - i * 0.08, 0.4 - i * 0.35);
      spine.rotation.x = -0.4;
      torsoGroup.add(spine);
    }

    // --- ARMS (Cute Tiny T-Rex Arms) ---
    const arms = [];
    for (let side of [-1, 1]) {
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 0.45, 0.1, 0.45);
      torsoGroup.add(armGroup);

      const bicepGeo = new THREE.BoxGeometry(0.18, 0.35, 0.18);
      const bicep = new THREE.Mesh(bicepGeo, bodyMat);
      bicep.position.set(0, -0.15, 0);
      bicep.rotation.x = 0.4;
      armGroup.add(bicep);

      const clawGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(0, -0.32, 0.12);
      claw.rotation.x = 0.9;
      armGroup.add(claw);

      arms.push(armGroup);
    }

    // --- LEGS (Rigged: Thigh -> Calf -> Foot) ---
    const legs = [];
    for (let side of [-1, 1]) {
      const hipGroup = new THREE.Group();
      hipGroup.position.set(side * 0.5, -0.1, -0.15);
      torsoGroup.add(hipGroup);

      // Thigh
      const thighGeo = new THREE.BoxGeometry(0.32, 0.7, 0.45);
      const thigh = new THREE.Mesh(thighGeo, bodyMat);
      thigh.position.set(0, -0.3, 0);
      thigh.castShadow = true;
      hipGroup.add(thigh);

      // Knee / Calf
      const kneeGroup = new THREE.Group();
      kneeGroup.position.set(0, -0.6, 0.05);
      hipGroup.add(kneeGroup);

      const calfGeo = new THREE.BoxGeometry(0.24, 0.65, 0.28);
      const calf = new THREE.Mesh(calfGeo, bodyMat);
      calf.position.set(0, -0.25, -0.05);
      calf.castShadow = true;
      kneeGroup.add(calf);

      // Foot & Claws
      const footGeo = new THREE.BoxGeometry(0.35, 0.15, 0.55);
      const foot = new THREE.Mesh(footGeo, clawMat);
      foot.position.set(0, -0.55, 0.1);
      foot.castShadow = true;
      kneeGroup.add(foot);

      legs.push({ hip: hipGroup, knee: kneeGroup });
    }

    // --- TAIL (Segmented chain) ---
    const tailSegments = [];
    let parentTail = torsoGroup;
    for (let i = 0; i < 3; i++) {
      const tailSegment = new THREE.Group();
      tailSegment.position.set(0, i === 0 ? 0.1 : -0.05, i === 0 ? -0.65 : -0.65);
      parentTail.add(tailSegment);

      const width = 0.55 - i * 0.14;
      const height = 0.5 - i * 0.12;
      const length = 0.75 - i * 0.1;
      const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), bodyMat);
      tailMesh.position.set(0, 0, -length * 0.4);
      tailMesh.castShadow = true;
      tailSegment.add(tailMesh);

      // Tail spine
      const tailSpine = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), spineMat);
      tailSpine.position.set(0, height * 0.55, -length * 0.35);
      tailSpine.rotation.x = -0.5;
      tailSegment.add(tailSpine);

      tailSegments.push(tailSegment);
      parentTail = tailSegment;
    }

    // --- SHIELD BUBBLE (Visual FX) ---
    const shieldGeo = new THREE.SphereGeometry(1.7, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0,
      wireframe: true
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.set(0, 1.2, 0);
    dinoRoot.add(shieldMesh);

    // Save rigging refs
    dinoRoot.userData = {
      torso: torsoGroup,
      neck: neckGroup,
      head: headGroup,
      jaw: jawGroup,
      arms: arms,
      legs: legs,
      tail: tailSegments,
      shield: shieldMesh,
      skinId: skin.id,
      animTime: 0
    };

    return dinoRoot;
  }

  /* ---------------- DINO ANIMATION CONTROLLER ---------------- */

  static updateDino(dino, delta, state) {
    if (!dino || !dino.userData) return;
    const u = dino.userData;
    u.animTime += delta * state.speedMultiplier;
    const t = u.animTime;

    // Normalizing base posture
    u.torso.position.y = 1.35;
    u.torso.rotation.x = 0;
    u.head.rotation.x = 0;
    u.head.rotation.y = 0;

    if (state.isDead) {
      // Tumble / fall on death
      u.torso.rotation.z = THREE.MathUtils.lerp(u.torso.rotation.z, 1.4, delta * 8);
      u.torso.rotation.x = THREE.MathUtils.lerp(u.torso.rotation.x, -0.6, delta * 8);
      u.torso.position.y = THREE.MathUtils.lerp(u.torso.position.y, 0.4, delta * 8);
      u.jaw.rotation.x = 0.6; // Open mouth in shock
      return;
    }

    if (state.isDucking) {
      // Low streamlined sliding pose
      u.torso.position.y = 0.85;
      u.torso.rotation.x = 0.45;
      u.head.rotation.x = -0.45;
      u.jaw.rotation.x = 0.1;

      // Legs tucked flat
      u.legs[0].hip.rotation.x = -1.1;
      u.legs[0].knee.rotation.x = 1.4;
      u.legs[1].hip.rotation.x = -1.1;
      u.legs[1].knee.rotation.x = 1.4;

      // Tail held straight back
      u.tail.forEach((seg, idx) => {
        seg.rotation.x = -0.2;
        seg.rotation.y = Math.sin(t * 15 + idx) * 0.1;
      });

      // Arms tucked
      u.arms[0].rotation.x = 0.8;
      u.arms[1].rotation.x = 0.8;

    } else if (state.isJumping) {
      // In-air leap pose
      u.torso.position.y = 1.45;
      u.torso.rotation.x = -0.2;
      u.head.rotation.x = 0.25;

      // Legs bent backward
      u.legs[0].hip.rotation.x = 0.7;
      u.legs[0].knee.rotation.x = 0.5;
      u.legs[1].hip.rotation.x = 0.5;
      u.legs[1].knee.rotation.x = 0.8;

      // Tail arched
      u.tail[0].rotation.x = 0.3;
      u.tail[1].rotation.x = 0.2;
      u.tail[2].rotation.x = 0.1;

      // Tiny arms up in the air
      u.arms[0].rotation.x = -0.6;
      u.arms[1].rotation.x = -0.6;

    } else {
      // Running cycle
      const strideFreq = 16;
      const legAngle = Math.sin(t * strideFreq) * 0.9;
      const bob = Math.abs(Math.sin(t * strideFreq)) * 0.12;

      u.torso.position.y = 1.35 + bob;
      u.torso.rotation.z = Math.sin(t * strideFreq * 0.5) * 0.05;

      // Left leg
      u.legs[0].hip.rotation.x = legAngle;
      u.legs[0].knee.rotation.x = legAngle > 0 ? legAngle * 0.8 : 0.1;

      // Right leg (opposite)
      u.legs[1].hip.rotation.x = -legAngle;
      u.legs[1].knee.rotation.x = -legAngle > 0 ? -legAngle * 0.8 : 0.1;

      // Arms swing
      u.arms[0].rotation.x = -legAngle * 0.7;
      u.arms[1].rotation.x = legAngle * 0.7;

      // Tail waves rhythmically
      u.tail.forEach((seg, idx) => {
        seg.rotation.y = Math.sin(t * strideFreq * 0.5 - idx * 0.5) * 0.25;
        seg.rotation.x = Math.sin(t * strideFreq) * 0.06;
      });

      // Head slight bob
      u.head.rotation.x = Math.sin(t * strideFreq) * 0.06;
      u.jaw.rotation.x = Math.abs(Math.sin(t * 8)) * 0.15;
    }

    // Shield Aura Pulse
    if (u.shield) {
      if (state.hasShield) {
        u.shield.visible = true;
        u.shield.material.opacity = 0.3 + Math.sin(t * 8) * 0.15;
        u.shield.rotation.y += delta * 2;
        u.shield.rotation.x += delta * 1.5;
      } else {
        u.shield.visible = false;
      }
    }
  }

  /* ---------------- OBSTACLES: CACTI ---------------- */

  createCactus(variant = 'small') {
    const group = new THREE.Group();
    group.name = 'obstacle_cactus';

    const cactusMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    const spineMat = new THREE.MeshStandardMaterial({
      color: 0xffeb3b,
      roughness: 0.3
    });

    if (variant === 'small') {
      // Single trunk with small arms
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.8, 7), cactusMat);
      trunk.position.y = 0.9;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      // Left arm
      const armL1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 6), cactusMat);
      armL1.position.set(-0.35, 0.9, 0);
      armL1.rotation.z = Math.PI / 2;
      group.add(armL1);

      const armL2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 6), cactusMat);
      armL2.position.set(-0.6, 1.15, 0);
      group.add(armL2);

      // Right arm
      const armR1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 6), cactusMat);
      armR1.position.set(0.32, 1.1, 0);
      armR1.rotation.z = -Math.PI / 2;
      group.add(armR1);

      const armR2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 6), cactusMat);
      armR2.position.set(0.52, 1.3, 0);
      group.add(armR2);

      group.userData.height = 1.8;
      group.userData.radius = 0.7;

    } else if (variant === 'cluster') {
      // 3 cacti grouped together
      for (let i = -1; i <= 1; i++) {
        const height = 1.4 + Math.abs(i) * 0.5 + Math.random() * 0.3;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, height, 6), cactusMat);
        trunk.position.set(i * 0.45, height / 2, (Math.random() - 0.5) * 0.2);
        trunk.castShadow = true;
        group.add(trunk);
      }
      group.userData.height = 2.2;
      group.userData.radius = 1.0;

    } else {
      // Big prehistoric saguaro
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 2.7, 8), cactusMat);
      trunk.position.y = 1.35;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      // Heavy branches
      const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 6), cactusMat);
      arm1.position.set(-0.65, 1.8, 0);
      group.add(arm1);

      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 6), cactusMat);
      arm2.position.set(0.65, 1.5, 0);
      group.add(arm2);

      group.userData.height = 2.7;
      group.userData.radius = 0.9;
    }

    return group;
  }

  /* ---------------- FLYING OBSTACLE: PTERODACTYL ---------------- */

  createPterodactyl(biome = 'desert') {
    const group = new THREE.Group();
    group.name = 'obstacle_ptero';

    const skinColor = biome === 'magma' ? 0x661111 : (biome === 'cyber' ? 0x00bcd4 : 0x8d6e63);
    const wingColor = biome === 'magma' ? 0xff4422 : (biome === 'cyber' ? 0xff007f : 0xbcaaa4);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.6,
      flatShading: true
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: wingColor,
      roughness: 0.7,
      side: THREE.DoubleSide,
      flatShading: true
    });

    // Body & Tail
    const bodyGeo = new THREE.ConeGeometry(0.3, 1.4, 5);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.rotation.x = Math.PI / 2;
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Head & Long Beak
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 5), bodyMat);
    head.position.set(0, 0.15, 0.85);
    head.rotation.x = Math.PI / 2 + 0.1;
    head.castShadow = true;
    group.add(head);

    // Glowing Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    for (let side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
      eye.position.set(side * 0.12, 0.22, 0.8);
      group.add(eye);
    }

    // Crest on back of head
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.7, 4), bodyMat);
    crest.position.set(0, 0.25, 0.2);
    crest.rotation.x = -Math.PI / 3;
    group.add(crest);

    // Animated Wings (Left and Right)
    const wings = [];
    for (let side of [-1, 1]) {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(side * 0.2, 0.05, 0.2);
      group.add(wingPivot);

      const wingShape = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 0, 0,
        side * 1.5, 0, -0.4,
        0, 0, -0.8
      ]);
      wingShape.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      wingShape.computeVertexNormals();

      const wingMesh = new THREE.Mesh(wingShape, wingMat);
      wingMesh.castShadow = true;
      wingPivot.add(wingMesh);

      wings.push(wingPivot);
    }

    group.userData = {
      wings: wings,
      wingTimer: Math.random() * 10,
      radius: 0.8,
      height: 0.8
    };

    return group;
  }

  static updatePterodactyl(ptero, delta) {
    if (!ptero || !ptero.userData || !ptero.userData.wings) return;
    const u = ptero.userData;
    u.wingTimer += delta * 12;

    const angle = Math.sin(u.wingTimer) * 0.55;
    u.wings[0].rotation.z = angle;
    u.wings[1].rotation.z = -angle;

    // Slight altitude bobbing
    ptero.position.y += Math.sin(u.wingTimer * 0.5) * 0.005;
  }

  /* ---------------- PICKUP: AMBER / DNA CRYSTAL ---------------- */

  createAmber() {
    const group = new THREE.Group();
    group.name = 'pickup_amber';

    const crystalGeo = new THREE.OctahedronGeometry(0.35, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff7700,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true
    });

    const mesh = new THREE.Mesh(crystalGeo, crystalMat);
    mesh.castShadow = true;
    group.add(mesh);

    // Inner glowing core
    const coreGeo = new THREE.IcosahedronGeometry(0.18, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    group.userData = {
      spinSpeed: 2.5 + Math.random(),
      floatTimer: Math.random() * Math.PI * 2,
      baseY: 1.0,
      type: 'amber',
      radius: 0.5
    };

    return group;
  }

  /* ---------------- POWERUP CAPSULES ---------------- */

  createPowerup(type = 'shield') {
    const group = new THREE.Group();
    group.name = `powerup_${type}`;

    let color = 0x00e5ff;
    if (type === 'magnet') color = 0x9c27b0;
    if (type === 'dash') color = 0xff5722;
    if (type === 'xp') color = 0x00ff88;

    const orbMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9
    });

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), orbMat);
    group.add(orb);

    // Orbital ring
    const ringGeo = new THREE.TorusGeometry(0.65, 0.05, 8, 20);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    group.userData = {
      type: type,
      ring: ring,
      spinSpeed: 3.0,
      floatTimer: 0,
      baseY: 1.2,
      radius: 0.7
    };

    return group;
  }

  /* ---------------- DECORATIONS FOR CHUNKS ---------------- */

  createDesertRock() {
    const geo = new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.5, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.9,
      flatShading: true
    });
    const rock = new THREE.Mesh(geo, mat);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.set(1 + Math.random() * 0.5, 0.7 + Math.random() * 0.4, 1 + Math.random() * 0.5);
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
  }

  createCyberPillar() {
    const height = 4 + Math.random() * 5;
    const geo = new THREE.BoxGeometry(0.6, height, 0.6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
      flatShading: true
    });
    const pillar = new THREE.Mesh(geo, mat);
    pillar.position.y = height / 2;

    // Glowing neon stripe
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, height * 0.8, 0.08),
      new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x00f5ff : 0xff007f })
    );
    pillar.add(stripe);
    return pillar;
  }
}

window.modelFactory = new ModelFactory();
