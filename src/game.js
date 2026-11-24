/**
 * Dino 3D: Evolution Runner
 * Core Game Engine: Three.js rendering, physics, 3-lane controls, procedural generation,
 * particle system, biomes, collision detection, and Roguelite leveling loop.
 */

class Dino3DGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('webgl-canvas');

    // State
    this.gameState = 'TITLE'; // 'TITLE', 'PLAYING', 'PAUSED', 'LEVELUP', 'GAMEOVER'
    this.cameraMode = 'dynamic'; // 'dynamic', 'retro', 'fpv'

    // Scene & Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.dirLight = null;
    this.hemiLight = null;

    // Lanes: 0 (Left, +3m), 1 (Center, 0m), 2 (Right, -3m)
    // Note: With camera facing +Z in Three.js right-handed system, Screen-Left is +X, Screen-Right is -X.
    this.LANES = [3.0, 0.0, -3.0];
    this.currentLane = 1; // Center (index 1)
    this.targetX = 0;
    this.currentX = 0;
    this.lastMilestoneHundred = 0;
    this.selectedPerkIndex = 0;

    // Dino character & physics
    this.dino = null;
    this.dinoY = 0;
    this.dinoVy = 0;
    this.gravity = -38.0;
    this.jumpForce = 13.5;
    this.isGrounded = true;
    this.isDucking = false;
    this.jumpCount = 0;
    this.maxJumps = 1;

    // Dash / Sprint
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 1.4;
    this.dashCooldown = 0;
    this.dashCooldownMax = 10.0;

    // Invulnerability frames
    this.invulnerableTimer = 0;

    // Track chunks & environment
    this.chunks = [];
    this.chunkLength = 40;
    this.chunkCount = 8;
    this.groundZOffset = 0;

    // Obstacles and Pickups pools
    this.obstacles = [];
    this.pickups = [];
    this.particles = [];

    // Biomes: 0 = Desert, 1 = Magma, 2 = Cyber
    this.currentBiome = 'desert';
    this.biomeConfigs = {
      desert: {
        name: 'PUSTYNIA PREHISTORYCZNA',
        fogColor: 0xe0c39e,
        skyColor: 0x87ceeb,
        groundColor: 0xd2b48c,
        gridColor: 0xbfa57d,
        lightColor: 0xfff3e0,
        density: 0.015
      },
      magma: {
        name: 'WULKANICZNY WĄWÓZ',
        fogColor: 0x240d0d,
        skyColor: 0x421212,
        groundColor: 0x1f191b,
        gridColor: 0xff3b00,
        lightColor: 0xff6633,
        density: 0.02
      },
      cyber: {
        name: 'CYBER HORIZON 2077',
        fogColor: 0x090d1a,
        skyColor: 0x130d29,
        groundColor: 0x0c1020,
        gridColor: 0x00f5ff,
        lightColor: 0x00d2ff,
        density: 0.018
      }
    };

    // Run Gameplay Stats
    this.state = {
      distance: 0,
      score: 0,
      scoreMultiplier: 1.0,
      baseSpeed: 16.0,
      currentSpeed: 16.0,
      speedMultiplier: 1.0,
      runLevel: 1,
      runXp: 0,
      runXpNeeded: 600,
      runXpBonusRate: 1.0,
      amberCollected: 0,
      amberMultiplier: 1,
      shields: 0,
      maxShields: 0,
      hasSecondWind: false,
      secondWindUsed: false,
      hasStompShockwave: false,
      canDoubleJump: false,
      magnetRadius: 3.0,
      magnetTimer: 0,
      timeDilationActive: false,
      titanSmashBonus: false
    };

    // Camera shake
    this.cameraShake = 0;

    // Touch controls state
    this.touchStartX = 0;
    this.touchStartY = 0;

    // Initialize
    this.initThree();
    this.setupEventListeners();
    this.applyPersistentStats();
    this.updateTitleScreenUI();
  }

  /* ---------------- THREE.JS INITIALIZATION ---------------- */

  initThree() {
    this.scene = new THREE.Scene();
    const cfg = this.biomeConfigs.desert;
    this.scene.background = new THREE.Color(cfg.skyColor);
    this.scene.fog = new THREE.FogExp2(cfg.fogColor, cfg.density);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    this.camera.position.set(0, 4.5, -6.5);
    this.camera.lookAt(0, 1.5, 6);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Ambient light
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    this.hemiLight.position.set(0, 20, 0);
    this.scene.add(this.hemiLight);

    // Directional sun light with shadows
    this.dirLight = new THREE.DirectionalLight(cfg.lightColor, 1.2);
    this.dirLight.position.set(12, 24, -10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 60;
    this.dirLight.shadow.camera.left = -15;
    this.dirLight.shadow.camera.right = 15;
    this.dirLight.shadow.camera.top = 20;
    this.dirLight.shadow.camera.bottom = -10;
    this.scene.add(this.dirLight);

    // Target for directional light to follow dino
    this.dirLightTarget = new THREE.Object3D();
    this.scene.add(this.dirLightTarget);
    this.dirLight.target = this.dirLightTarget;

    // Build Dino model
    this.rebuildDinoModel();

    // Build Initial Track Chunks
    for (let i = 0; i < this.chunkCount; i++) {
      this.createTrackChunk(i * this.chunkLength);
    }

    // Start Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  rebuildDinoModel() {
    if (this.dino) {
      this.scene.remove(this.dino);
    }
    const skin = window.upgradeManager.saveData.selectedSkin || 'classic';
    this.dino = window.modelFactory.createDino(skin);
    this.dino.position.set(0, 0, 0);
    this.scene.add(this.dino);
  }

  /* ---------------- TRACK & CHUNK GENERATION ---------------- */

  createTrackChunk(zPos) {
    const chunk = new THREE.Group();
    chunk.position.z = zPos;

    const cfg = this.biomeConfigs[this.currentBiome];

    // Main Ground plane for chunk
    const groundGeo = new THREE.PlaneGeometry(16, this.chunkLength, 8, 8);
    const groundMat = new THREE.MeshStandardMaterial({
      color: cfg.groundColor,
      roughness: 0.85,
      metalness: this.currentBiome === 'cyber' ? 0.4 : 0.05,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = this.chunkLength / 2;
    ground.receiveShadow = true;
    chunk.add(ground);

    // Lane divider stripes
    for (let lx of [-1.5, 1.5]) {
      const stripeGeo = new THREE.PlaneGeometry(0.08, this.chunkLength);
      const stripeMat = new THREE.MeshBasicMaterial({
        color: cfg.gridColor,
        transparent: true,
        opacity: 0.35
      });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(lx, 0.02, this.chunkLength / 2);
      chunk.add(stripe);
    }

    // Outer track borders / curbs
    for (let side of [-1, 1]) {
      const curbGeo = new THREE.BoxGeometry(0.3, 0.25, this.chunkLength);
      const curbMat = new THREE.MeshStandardMaterial({
        color: cfg.gridColor,
        roughness: 0.5
      });
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(side * 5.2, 0.1, this.chunkLength / 2);
      curb.castShadow = true;
      curb.receiveShadow = true;
      chunk.add(curb);
    }

    // Scenery / Environment props on the sides (outside running lanes)
    for (let side of [-1, 1]) {
      const decorCount = 2 + Math.floor(Math.random() * 2);
      for (let d = 0; d < decorCount; d++) {
        let prop;
        if (this.currentBiome === 'cyber') {
          prop = window.modelFactory.createCyberPillar();
        } else {
          prop = window.modelFactory.createDesertRock();
        }
        prop.position.set(
          side * (7.5 + Math.random() * 5.0),
          0,
          Math.random() * this.chunkLength
        );
        chunk.add(prop);
      }
    }

    // Populate Obstacles & Pickups (Skip the first 2 chunks at game start)
    if (zPos > this.chunkLength * 1.5) {
      this.populateChunkSpawns(chunk, zPos);
    }

    this.scene.add(chunk);
    this.chunks.push(chunk);
  }

  populateChunkSpawns(chunk, chunkZ) {
    const laneIndices = [0, 1, 2];

    // Spawn 1 to 2 obstacle waves per chunk
    const waves = Math.random() > 0.4 ? 2 : 1;
    for (let w = 0; w < waves; w++) {
      const waveZ = (w + 0.5) * (this.chunkLength / waves) + (Math.random() - 0.5) * 4;

      // Ensure at least one lane is ALWAYS completely open
      const blockedLanesCount = Math.random() > 0.65 ? 2 : 1;
      const shuffledLanes = [...laneIndices].sort(() => Math.random() - 0.5);
      const chosenLanes = shuffledLanes.slice(0, blockedLanesCount);

      chosenLanes.forEach(laneIdx => {
        const laneX = this.LANES[laneIdx];
        const isPtero = Math.random() > 0.65;

        if (isPtero) {
          // Flying Pterodactyl: high (must duck) or low (must jump)
          const ptero = window.modelFactory.createPterodactyl(this.currentBiome);
          const isHigh = Math.random() > 0.45;
          ptero.position.set(laneX, isHigh ? 2.3 : 1.2, chunkZ + waveZ);
          ptero.userData.isHigh = isHigh;
          this.scene.add(ptero);
          this.obstacles.push(ptero);
        } else {
          // Ground Cactus
          const variant = Math.random() > 0.7 ? 'cluster' : (Math.random() > 0.4 ? 'big' : 'small');
          const cactus = window.modelFactory.createCactus(variant);
          cactus.position.set(laneX, 0, chunkZ + waveZ);
          cactus.rotation.y = (Math.random() - 0.5) * 0.4;
          this.scene.add(cactus);
          this.obstacles.push(cactus);
        }
      });

      // Spawn Pickups in open lane or above jumpable obstacles
      const freeLane = shuffledLanes[blockedLanesCount];
      const freeLaneX = this.LANES[freeLane];

      // Spawn amber arc or line (3 crystals)
      for (let a = 0; a < 3; a++) {
        const amber = window.modelFactory.createAmber();
        amber.position.set(freeLaneX, 1.0, chunkZ + waveZ + (a - 1) * 2.5);
        this.scene.add(amber);
        this.pickups.push(amber);
      }

      // Rare Powerup spawn (15% chance per wave)
      if (Math.random() < 0.15) {
        const types = ['shield', 'magnet', 'dash', 'xp'];
        const type = types[Math.floor(Math.random() * types.length)];
        const powerup = window.modelFactory.createPowerup(type);
        powerup.position.set(this.LANES[Math.floor(Math.random() * 3)], 1.3, chunkZ + waveZ + 6);
        this.scene.add(powerup);
        this.pickups.push(powerup);
      }
    }
  }

  /* ---------------- BIOME PROGRESSION & TRANSITIONS ---------------- */

  checkBiomeProgression() {
    const dist = this.state.distance;
    // Endless cycling through biomes every 1000m: Desert -> Magma -> Cyber -> Desert...
    const biomeCycle = ['desert', 'magma', 'cyber'];
    const cycleIndex = Math.floor(dist / 1000) % biomeCycle.length;
    const targetBiome = biomeCycle[cycleIndex];

    if (targetBiome !== this.currentBiome) {
      this.currentBiome = targetBiome;
      const cfg = this.biomeConfigs[this.currentBiome];

      // Update Scene atmosphere
      this.scene.background.set(cfg.skyColor);
      this.scene.fog.color.set(cfg.fogColor);
      this.scene.fog.density = cfg.density;
      this.dirLight.color.set(cfg.lightColor);

      // HUD Tag & Sound
      const biomeTag = document.getElementById('hud-biome-tag');
      if (biomeTag) {
        biomeTag.textContent = cfg.name;
        biomeTag.style.color = '#' + cfg.gridColor.toString(16).padStart(6, '0');
      }

      window.soundEngine.playBiomeSwitch();
      this.createExplosionParticles(this.dino.position, 0x00e5ff, 40);
    }
  }

  /* ---------------- INPUTS & EVENT LISTENERS ---------------- */

  setupEventListeners() {
    // Window Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // UI Buttons
    document.getElementById('btn-play').addEventListener('click', () => this.startRun());
    document.getElementById('btn-restart').addEventListener('click', () => this.startRun());

    // Navigation & Modals
    this.setupModalControls();

    // Touch & Swipe Controls
    this.setupTouchControls();
  }

  handleKeyDown(e) {
    // Prevent default page scroll on game control keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    if (this.gameState === 'TITLE' || this.gameState === 'GAMEOVER') {
      if (e.code === 'Space' || e.code === 'Enter') {
        this.startRun();
        return;
      }
    }

    if (this.gameState === 'LEVELUP') {
      // Space or Enter selects the currently active / focused perk!
      if (e.code === 'Space' || e.code === 'Enter') {
        const cards = document.querySelectorAll('.perk-card');
        if (cards[this.selectedPerkIndex]) {
          cards[this.selectedPerkIndex].click();
        }
        return;
      }

      // Arrow keys / A / D shift perk selection
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.selectedPerkIndex = (this.selectedPerkIndex + 1) % 3;
        this.updatePerkSelectionFocus();
        window.soundEngine.playClick();
        return;
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.selectedPerkIndex = (this.selectedPerkIndex + 2) % 3;
        this.updatePerkSelectionFocus();
        window.soundEngine.playClick();
        return;
      }

      // Number keys 1, 2, 3
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        const idx = parseInt(e.key) - 1;
        const cards = document.querySelectorAll('.perk-card');
        if (cards[idx]) cards[idx].click();
        return;
      }
      return;
    }

    if (this.gameState !== 'PLAYING') return;

    switch (e.code) {
      // Move Left
      case 'ArrowLeft':
      case 'KeyA':
        this.shiftLane(-1);
        break;

      // Move Right
      case 'ArrowRight':
      case 'KeyD':
        this.shiftLane(1);
        break;

      // Jump
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        this.jump();
        break;

      // Duck / Fast Slide
      case 'ArrowDown':
      case 'KeyS':
        this.startDuck();
        break;

      // Sprint / Dash
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'KeyE':
        this.dash();
        break;

      // Switch Camera Perspective
      case 'KeyC':
        this.cycleCameraView();
        break;

      // Pause
      case 'Escape':
      case 'KeyP':
        this.togglePause();
        break;
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      this.stopDuck();
    }
  }

  setupTouchControls() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const mobileUI = document.getElementById('mobile-controls');
    if (isTouch && mobileUI) {
      mobileUI.classList.remove('hidden');
    }

    // Touch Buttons
    const btnLeft = document.getElementById('touch-left');
    const btnRight = document.getElementById('touch-right');
    const btnJump = document.getElementById('touch-jump');
    const btnDuck = document.getElementById('touch-duck');
    const btnDash = document.getElementById('touch-dash');

    if (btnLeft) btnLeft.addEventListener('pointerdown', () => this.shiftLane(-1));
    if (btnRight) btnRight.addEventListener('pointerdown', () => this.shiftLane(1));
    if (btnJump) btnJump.addEventListener('pointerdown', () => this.jump());
    if (btnDash) btnDash.addEventListener('pointerdown', () => this.dash());

    if (btnDuck) {
      btnDuck.addEventListener('pointerdown', () => this.startDuck());
      btnDuck.addEventListener('pointerup', () => this.stopDuck());
      btnDuck.addEventListener('pointerleave', () => this.stopDuck());
    }

    // Swipe gesture detection on canvas
    window.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.gameState !== 'PLAYING') return;
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        if (dx > 0) this.shiftLane(1);
        else this.shiftLane(-1);
      } else if (Math.abs(dy) > 30) {
        if (dy < 0) this.jump();
        else this.startDuck();
      }
    }, { passive: true });
  }

  setupModalControls() {
    const modalEvo = document.getElementById('modal-evolution');
    const modalSkins = document.getElementById('modal-skins');
    const modalHelp = document.getElementById('modal-help');
    const modalLeaderboard = document.getElementById('modal-leaderboard');
    const screenPause = document.getElementById('screen-pause');

    // Title buttons
    document.getElementById('btn-open-evolution').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.populateTalentsUI();
      modalEvo.classList.remove('hidden');
    });

    document.getElementById('btn-open-skins').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.populateSkinsUI();
      modalSkins.classList.remove('hidden');
    });

    document.getElementById('btn-open-leaderboard').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.populateLeaderboardUI('global');
      modalLeaderboard.classList.remove('hidden');
    });

    document.getElementById('btn-open-help').addEventListener('click', () => {
      window.soundEngine.playClick();
      modalHelp.classList.remove('hidden');
    });

    document.getElementById('btn-close-evolution').addEventListener('click', () => {
      window.soundEngine.playClick();
      modalEvo.classList.add('hidden');
      this.updateTitleScreenUI();
    });

    document.getElementById('btn-close-skins').addEventListener('click', () => {
      window.soundEngine.playClick();
      modalSkins.classList.add('hidden');
      this.rebuildDinoModel();
    });

    document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
      window.soundEngine.playClick();
      modalLeaderboard.classList.add('hidden');
    });

    document.getElementById('btn-close-help').addEventListener('click', () => {
      window.soundEngine.playClick();
      modalHelp.classList.add('hidden');
    });

    // Leaderboard Tabs & Reset
    const tabGlobal = document.getElementById('tab-global-scores');
    const tabHistory = document.getElementById('tab-player-history');
    tabGlobal.addEventListener('click', () => {
      window.soundEngine.playClick();
      tabGlobal.classList.add('active');
      tabHistory.classList.remove('active');
      this.populateLeaderboardUI('global');
    });

    tabHistory.addEventListener('click', () => {
      window.soundEngine.playClick();
      tabHistory.classList.add('active');
      tabGlobal.classList.remove('active');
      this.populateLeaderboardUI('history');
    });

    document.getElementById('btn-reset-leaderboard').addEventListener('click', () => {
      if (confirm('Czy na pewno chcesz zresetować tablicę wyników do stanu początkowego?')) {
        window.leaderboardManager.resetScores();
        window.soundEngine.playClick();
        this.populateLeaderboardUI(tabGlobal.classList.contains('active') ? 'global' : 'history');
      }
    });

    // Score Submission from Game Over
    const inputNick = document.getElementById('player-nickname-input');
    const btnSubmit = document.getElementById('btn-submit-score');
    const submitFeedback = document.getElementById('submit-feedback');

    const handleScoreSubmit = () => {
      const name = inputNick.value.trim();
      if (!name) {
        submitFeedback.textContent = 'Wpisz swój pseudonim przed zapisem!';
        submitFeedback.className = 'submit-feedback-msg error';
        return;
      }
      window.leaderboardManager.setPlayerName(name);
      const res = window.leaderboardManager.submitScore(
        this.lastRunScore || 0,
        this.lastRunDistance || 0,
        this.lastRunSkin || 'Dino Klasyczny'
      );
      window.soundEngine.playCoin();
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'ZAPISANO ✔';
      submitFeedback.className = 'submit-feedback-msg success';
      if (res.isHighScore) {
        submitFeedback.textContent = '🎉 NIESAMOWITE! Zdobywasz #1 MIEJSCE w Rankingu!';
      } else {
        submitFeedback.textContent = `✅ Wynik zapisany! Twoja aktualna pozycja w rankingu: #${res.rank}!`;
      }
    };

    btnSubmit.addEventListener('click', handleScoreSubmit);
    inputNick.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleScoreSubmit();
      }
    });

    document.getElementById('btn-gameover-leaderboard').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.populateLeaderboardUI('global');
      modalLeaderboard.classList.remove('hidden');
    });

    document.getElementById('btn-reset-talents').addEventListener('click', () => {
      if (confirm('Czy na pewno chcesz zresetować talenty i odzyskać 100% wydanego Bursztynu?')) {
        window.upgradeManager.resetTalents();
        window.soundEngine.playClick();
        this.populateTalentsUI();
        this.updateTitleScreenUI();
      }
    });

    // Sound Toggles
    const btnSound = document.getElementById('btn-toggle-sound');
    btnSound.addEventListener('click', () => {
      const active = window.soundEngine.toggleSound();
      btnSound.textContent = active ? 'DŹWIĘK: WŁĄCZONY 🔊' : 'DŹWIĘK: WYŁĄCZONY 🔇';
    });

    const btnMusic = document.getElementById('btn-toggle-music');
    btnMusic.addEventListener('click', () => {
      const active = window.soundEngine.toggleMusic();
      btnMusic.textContent = active ? 'SYNTH MUZYKA: WŁĄCZONA 🎵' : 'SYNTH MUZYKA: WYŁĄCZONA 🔇';
    });

    const btnCamera = document.getElementById('btn-camera-view');
    btnCamera.addEventListener('click', () => this.cycleCameraView());

    // Pause Controls
    document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-pause-options').addEventListener('click', () => {
      this.cycleCameraView();
    });
    document.getElementById('btn-quit-run').addEventListener('click', () => {
      screenPause.classList.add('hidden');
      this.endRun('Zrezygnowano z biegu.');
    });

    // Game Over Navigation
    document.getElementById('btn-gameover-evolution').addEventListener('click', () => {
      document.getElementById('screen-gameover').classList.add('hidden');
      this.populateTalentsUI();
      modalEvo.classList.remove('hidden');
    });

    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
      document.getElementById('screen-gameover').classList.add('hidden');
      document.getElementById('screen-title').classList.remove('hidden');
      document.getElementById('hud').classList.add('hidden');
      this.gameState = 'TITLE';
      this.updateTitleScreenUI();
    });
  }

  /* ---------------- DINO MOVEMENT ACTIONS ---------------- */

  shiftLane(dir) {
    const newLane = this.currentLane + dir;
    if (newLane >= 0 && newLane < this.LANES.length) {
      this.currentLane = newLane;
      this.targetX = this.LANES[this.currentLane];
      window.soundEngine.playClick();
    }
  }

  jump() {
    if (this.isGrounded) {
      this.dinoVy = this.jumpForce;
      this.isGrounded = false;
      this.jumpCount = 1;
      this.isDucking = false;
      window.soundEngine.playJump();
      this.createFootstepDust();
    } else if (this.jumpCount < this.maxJumps) {
      // Double Jump
      this.dinoVy = this.jumpForce * 0.95;
      this.jumpCount++;
      window.soundEngine.playDoubleJump();
      this.createExplosionParticles(this.dino.position, 0x00e5ff, 12);
    }
  }

  startDuck() {
    this.isDucking = true;
    if (!this.isGrounded) {
      // Air control downward dive
      const airBonus = 1 + (window.upgradeManager.getTalentLevel('air_control') * 0.25);
      this.dinoVy = Math.min(this.dinoVy, -18.0 * airBonus);
    }
    window.soundEngine.playDuck();
  }

  stopDuck() {
    this.isDucking = false;
  }

  dash() {
    if (this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldown = this.dashCooldownMax;
      window.soundEngine.playDash();
      this.cameraShake = 0.3;
      this.createExplosionParticles(this.dino.position, 0xff9900, 20);
    }
  }

  cycleCameraView() {
    const modes = ['dynamic', 'retro', 'fpv'];
    const idx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.cameraMode = modes[idx];

    const labelMap = {
      dynamic: 'DYNAMICZNA 🎥',
      retro: 'RETRO 2.5D 🕹️',
      fpv: 'PIERWSZOOSOBOWA 👁️'
    };

    const btn = document.getElementById('btn-camera-view');
    if (btn) btn.textContent = `KAMERA: ${labelMap[this.cameraMode]}`;
    window.soundEngine.playClick();
  }

  togglePause() {
    const pauseScreen = document.getElementById('screen-pause');
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      pauseScreen.classList.remove('hidden');
      window.soundEngine.stopMusic();
    } else if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      pauseScreen.classList.add('hidden');
      window.soundEngine.startMusic();
    }
  }

  /* ---------------- RUN LIFECYCLE ---------------- */

  applyPersistentStats() {
    const mgr = window.upgradeManager;

    // Vitality: Start with shields
    const vitLvl = mgr.getTalentLevel('vitality');
    this.state.maxShields = vitLvl;
    this.state.shields = vitLvl;

    // Double Jump Talent
    const djLvl = mgr.getTalentLevel('double_jump');
    this.state.canDoubleJump = djLvl > 0;
    this.maxJumps = djLvl > 0 ? 2 : 1;

    // Dash Engine Talent
    const dashLvl = mgr.getTalentLevel('dash_engine');
    this.dashCooldownMax = Math.max(4.0, 10.0 - dashLvl * 1.2);

    // Metabolism (XP)
    const metaLvl = mgr.getTalentLevel('metabolism');
    this.state.runXpBonusRate = 1.0 + metaLvl * 0.15;

    // Magnetism
    const magLvl = mgr.getTalentLevel('magnetism');
    this.state.magnetRadius = 2.5 + magLvl * 1.4;

    // Apex Frenzy (Score Multiplier)
    const apexLvl = mgr.getTalentLevel('apex_frenzy');
    this.state.scoreMultiplier = 1.0 + apexLvl * 0.25;

    // Selected Skin Trait Bonuses
    const skinId = mgr.saveData.selectedSkin;
    if (skinId === 'desert') this.state.baseSpeed = 19.0;
    if (skinId === 'cyber') this.state.magnetRadius += 1.5;
    if (skinId === 'magma') this.dashDuration = 2.4;
    if (skinId === 'cosmic') this.state.scoreMultiplier += 0.5;
  }

  startRun() {
    window.soundEngine.ensureContext();
    window.soundEngine.startMusic();

    // Reset Run Stats
    this.state.distance = 0;
    this.state.score = 0;
    this.state.baseSpeed = 16.0;
    this.state.currentSpeed = 16.0;
    this.state.speedMultiplier = 1.0;
    this.state.runLevel = 1;
    this.state.runXp = 0;
    this.state.runXpNeeded = 600; // Much bigger distance before level up!
    this.lastMilestoneHundred = 0;
    this.selectedPerkIndex = 0;
    this.state.amberCollected = 0;
    this.state.amberMultiplier = 1;
    this.state.hasSecondWind = false;
    this.state.secondWindUsed = false;
    this.state.hasStompShockwave = false;
    this.state.timeDilationActive = false;
    this.state.titanSmashBonus = false;

    this.applyPersistentStats();

    // Reset Dino position
    this.currentLane = 1;
    this.targetX = 0;
    this.currentX = 0;
    this.dinoY = 0;
    this.dinoVy = 0;
    this.isGrounded = true;
    this.isDucking = false;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.invulnerableTimer = 0;

    // Clear existing obstacles and pickups
    this.obstacles.forEach(o => this.scene.remove(o));
    this.obstacles = [];
    this.pickups.forEach(p => this.scene.remove(p));
    this.pickups = [];

    // Clear chunks
    this.chunks.forEach(c => this.scene.remove(c));
    this.chunks = [];
    for (let i = 0; i < this.chunkCount; i++) {
      this.createTrackChunk(i * this.chunkLength);
    }

    // Reset Biome to desert
    this.currentBiome = 'desert';
    const cfg = this.biomeConfigs.desert;
    this.scene.background.set(cfg.skyColor);
    this.scene.fog.color.set(cfg.fogColor);
    this.scene.fog.density = cfg.density;
    this.dirLight.color.set(cfg.lightColor);

    // Clear buffs in UI
    const buffsEl = document.getElementById('hud-buffs');
    if (buffsEl) buffsEl.innerHTML = '';

    // Switch screens
    document.getElementById('screen-title').classList.add('hidden');
    document.getElementById('screen-gameover').classList.add('hidden');
    document.getElementById('screen-pause').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('dash-cooldown-bar').classList.remove('hidden');

    this.updateHUD();
    this.gameState = 'PLAYING';
  }

  endRun(reason = 'Kolizja z przeszkodą!') {
    this.gameState = 'GAMEOVER';
    window.soundEngine.playCrash();
    window.soundEngine.stopMusic();

    // Save profile stats
    const mgr = window.upgradeManager;
    const distanceMeters = Math.floor(this.state.distance);
    const scoreVal = Math.floor(this.state.score);
    const amberGained = this.state.amberCollected;

    // Profile XP calculation based on run performance
    const earnedProfileXp = Math.floor(distanceMeters * 0.4 + scoreVal * 0.05 + amberGained * 5);
    const xpResult = mgr.addProfileXp(earnedProfileXp);
    mgr.addAmber(amberGained);

    if (scoreVal > mgr.saveData.highScore) {
      mgr.saveData.highScore = scoreVal;
    }
    mgr.saveData.totalRuns = (mgr.saveData.totalRuns || 0) + 1;
    mgr.saveData.totalDistance = (mgr.saveData.totalDistance || 0) + distanceMeters;
    mgr.save();

    // Populate Game Over Modal
    document.getElementById('death-reason-text').textContent = reason;
    document.getElementById('summary-distance').textContent = `${distanceMeters} m`;
    document.getElementById('summary-score').textContent = scoreVal.toLocaleString();
    document.getElementById('summary-run-level').textContent = `POZ ${this.state.runLevel}`;
    document.getElementById('summary-amber').textContent = `+${amberGained} 💎`;
    document.getElementById('summary-profile-xp').textContent = `+${earnedProfileXp} XP`;
    document.getElementById('summary-highscore').textContent = mgr.saveData.highScore.toLocaleString();

    // Profile progress bar
    document.getElementById('summary-profile-lvl').textContent = mgr.saveData.profileLevel;
    const needed = mgr.getProfileXpNeeded(mgr.saveData.profileLevel);
    const current = mgr.saveData.profileXp;
    const pct = Math.min(100, Math.floor((current / needed) * 100));
    document.getElementById('summary-profile-pct').textContent = `${pct}%`;
    document.getElementById('summary-profile-fill').style.width = `${pct}%`;

    // Leaderboard run data caching & input setup
    this.lastRunScore = scoreVal;
    this.lastRunDistance = distanceMeters;
    const activeSkin = ModelFactory.SKINS[mgr.saveData.selectedSkin];
    this.lastRunSkin = activeSkin ? activeSkin.name : 'Dino Klasyczny';

    const inputNick = document.getElementById('player-nickname-input');
    const btnSubmit = document.getElementById('btn-submit-score');
    const submitFeedback = document.getElementById('submit-feedback');
    if (inputNick && btnSubmit) {
      inputNick.value = window.leaderboardManager.getPlayerName();
      btnSubmit.disabled = false;
      btnSubmit.textContent = '💾 ZAPISZ';
      submitFeedback.textContent = '';
      submitFeedback.className = 'submit-feedback-msg';
    }

    // Show Game Over screen
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('dash-cooldown-bar').classList.add('hidden');
    document.getElementById('screen-gameover').classList.remove('hidden');
  }

  /* ---------------- IN-RUN LEVELING & ROGUELITE PERKS ---------------- */

  gainRunXp(amount) {
    const totalGained = Math.floor(amount * this.state.runXpBonusRate);
    this.state.runXp += totalGained;

    if (this.state.runXp >= this.state.runXpNeeded) {
      this.triggerLevelUp();
    }
    this.updateHUD();
  }

  triggerLevelUp() {
    this.state.runLevel++;
    this.state.runXp -= this.state.runXpNeeded;
    // Scale up required XP for much bigger distance between level-ups
    this.state.runXpNeeded = Math.floor(this.state.runXpNeeded * 1.65 + 400);

    window.soundEngine.playLevelUp();
    this.gameState = 'LEVELUP';
    this.selectedPerkIndex = 0; // Default to first card for Spacebar selection

    const screen = document.getElementById('screen-levelup');
    document.getElementById('levelup-tier-num').textContent = this.state.runLevel;

    // Generate 3 Roguelite Cards
    const container = document.getElementById('perk-cards-container');
    container.innerHTML = '';
    const perks = window.upgradeManager.getRandomPerks(3);

    perks.forEach((perk, idx) => {
      const card = document.createElement('div');
      card.className = `perk-card ${perk.rarity}`;
      card.dataset.index = idx;
      card.innerHTML = `
        <span class="perk-rarity-badge">${perk.rarity}</span>
        <div class="perk-icon-box">${perk.icon}</div>
        <div class="perk-name">${perk.name}</div>
        <div class="perk-desc">${perk.desc}</div>
        <div class="perk-action-slot"></div>
      `;

      card.addEventListener('mouseenter', () => {
        this.selectedPerkIndex = idx;
        this.updatePerkSelectionFocus();
      });

      card.addEventListener('click', () => {
        perk.apply(this);
        window.soundEngine.playClick();
        screen.classList.add('hidden');
        this.gameState = 'PLAYING';
        this.updateHUD();
      });

      container.appendChild(card);
    });

    this.updatePerkSelectionFocus();
    screen.classList.remove('hidden');
  }

  updatePerkSelectionFocus() {
    const cards = document.querySelectorAll('.perk-card');
    cards.forEach((card, idx) => {
      const isSelected = idx === this.selectedPerkIndex;
      card.classList.toggle('space-focused', isSelected);
      const slot = card.querySelector('.perk-action-slot');
      if (slot) {
        if (isSelected) {
          slot.innerHTML = `<div class="space-select-tag">⚡ [SPACJA / ENTER] Wybierz ten perk</div>`;
        } else {
          slot.innerHTML = `<div class="perk-tier">Naciśnij [${idx + 1}] lub kliknij</div>`;
        }
      }
    });
  }

  addBuffUI(icon, title, duration = null) {
    const bar = document.getElementById('hud-buffs');
    if (!bar) return;

    const buff = document.createElement('div');
    buff.className = 'buff-icon';
    buff.title = title;
    buff.textContent = icon;
    bar.appendChild(buff);

    if (duration) {
      setTimeout(() => {
        buff.remove();
      }, duration * 1000);
    }
  }

  /* ---------------- COLLISION & HIT DETECTION ---------------- */

  checkCollisions() {
    const dinoPos = this.dino.position;
    const isImmune = this.isDashing || this.invulnerableTimer > 0;

    // Check Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const dz = obs.position.z - dinoPos.z;

      // Obstacle is in collision range
      if (Math.abs(dz) < 1.2) {
        const dx = Math.abs(obs.position.x - dinoPos.x);

        if (dx < 1.0) {
          // Check Vertical Clearance
          let collides = false;
          if (obs.name === 'obstacle_cactus') {
            // Must jump over cactus
            if (this.dinoY < (obs.userData.height || 1.8) * 0.75) {
              collides = true;
            }
          } else if (obs.name === 'obstacle_ptero') {
            if (obs.userData.isHigh) {
              // High ptero: Must duck!
              if (!this.isDucking && this.dinoY > 0.8) {
                collides = true;
              }
            } else {
              // Low ptero: Must jump or avoid
              if (this.dinoY < 1.2) {
                collides = true;
              }
            }
          }

          if (collides) {
            if (this.isDashing) {
              // Smash obstacle into pieces!
              this.scene.remove(obs);
              this.obstacles.splice(i, 1);
              window.soundEngine.playCrash();
              this.createExplosionParticles(obs.position, 0xff5500, 25);

              if (this.state.titanSmashBonus) {
                this.state.score += 500;
                this.state.amberCollected += 25;
              }
              continue;
            }

            if (this.invulnerableTimer > 0) {
              continue; // Pass safely during invincibility blink
            }

            // Hit taken!
            if (this.state.shields > 0) {
              this.state.shields--;
              window.soundEngine.playShieldHit();
              this.cameraShake = 0.4;
              this.invulnerableTimer = 1.8;
              this.createExplosionParticles(dinoPos, 0x00e5ff, 30);
              this.updateHUD();
              continue;
            }

            // Second wind survival perk
            if (this.state.hasSecondWind && !this.state.secondWindUsed) {
              this.state.secondWindUsed = true;
              this.invulnerableTimer = 4.0;
              window.soundEngine.playLevelUp();
              this.cameraShake = 0.5;
              this.createExplosionParticles(dinoPos, 0xff00ff, 40);
              continue;
            }

            // Lethal hit
            const reason = obs.name === 'obstacle_ptero'
              ? 'Atak drapieżnego pterodaktyla!'
              : 'Zderzenie z kolczastym kaktusem!';
            this.endRun(reason);
            return;
          }
        }
      }
    }

    // Check Pickups (Amber and Powerups)
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const dist = p.position.distanceTo(dinoPos);

      // Magnet attraction
      const effectiveMagnetRadius = this.state.magnetTimer > 0 ? 8.0 : this.state.magnetRadius;
      if (dist < effectiveMagnetRadius) {
        // Fly towards dino
        p.position.lerp(dinoPos, 0.15);
      }

      if (dist < 1.2) {
        // Collect!
        if (p.userData.type === 'amber') {
          const value = 1 * this.state.amberMultiplier;
          this.state.amberCollected += value;
          this.gainRunXp(18);
          this.state.score += 50 * this.state.scoreMultiplier;
          window.soundEngine.playCoin();
          this.createExplosionParticles(p.position, 0xffaa00, 10);
        } else {
          // Powerup
          this.applyPowerup(p.userData.type);
        }

        this.scene.remove(p);
        this.pickups.splice(i, 1);
        this.updateHUD();
      }
    }
  }

  applyPowerup(type) {
    window.soundEngine.playLevelUp();
    this.createExplosionParticles(this.dino.position, 0x00ff88, 20);

    if (type === 'shield') {
      this.state.shields = Math.min(this.state.shields + 1, this.state.maxShields + 1);
      this.addBuffUI('🛡️', 'Tarcza Dodatkowa');
    } else if (type === 'magnet') {
      this.state.magnetTimer = Math.max(this.state.magnetTimer, 20);
      this.addBuffUI('🧲', 'Mega Magnes', 20);
    } else if (type === 'dash') {
      this.dashCooldown = 0;
      this.dash();
    } else if (type === 'xp') {
      this.gainRunXp(120);
      this.addBuffUI('🧬', '+120 XP');
    }
  }

  /* ---------------- PARTICLE EFFECTS ---------------- */

  createFootstepDust() {
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const mat = new THREE.MeshBasicMaterial({ color: 0xd4a373, transparent: true, opacity: 0.8 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        this.dino.position.x + (Math.random() - 0.5) * 0.4,
        0.1,
        this.dino.position.z - 0.5
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0.8 + Math.random() * 1.2,
        vz: -2.0 - Math.random() * 2.0,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  createExplosionParticles(pos, color, count = 20) {
    for (let i = 0; i < count; i++) {
      const size = 0.1 + Math.random() * 0.15;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1.0 })
      );
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.random() * 6 + 1,
        vz: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9
      });
    }
  }

  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.vy -= 15.0 * delta; // Particle gravity
      p.mesh.rotation.x += delta * 5;
      p.mesh.rotation.y += delta * 5;
      p.mesh.material.opacity = p.life / p.maxLife;
    }
  }

  /* ---------------- MAIN GAME LOOP ---------------- */

  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.gameState === 'PLAYING') {
      this.updatePhysics(delta);
      this.updateWorld(delta);
      this.checkCollisions();
      this.checkBiomeProgression();
      this.updateHUD();
    }

    this.updateParticles(delta);
    this.updateCamera(delta);
    this.renderer.render(this.scene, this.camera);
  }

  updatePhysics(delta) {
    // Chrome Dino progressive acceleration curve:
    // Starts at baseSpeed (16 m/s), smoothly & continuously accelerating with distance!
    const distanceProgress = (this.state.distance * 0.0085) + Math.sqrt(this.state.distance) * 0.24;
    let targetSpeed = this.state.baseSpeed + distanceProgress;

    if (this.state.timeDilationActive) {
      targetSpeed *= 0.85;
    }
    if (this.isDashing) {
      targetSpeed *= 1.8;
    }
    this.state.currentSpeed = THREE.MathUtils.lerp(this.state.currentSpeed, targetSpeed, delta * 3);

    // Distance & Score increment
    const frameDistance = this.state.currentSpeed * delta;
    this.state.distance += frameDistance;
    this.state.score += frameDistance * 1.5 * this.state.scoreMultiplier;

    // Update dynamically evolving music tempo and intensity
    window.soundEngine.updateMusicIntensity(this.state.distance, this.state.currentSpeed);

    // Passive XP from distance (scaled for bigger distance per level)
    this.gainRunXp(frameDistance * 0.6);

    // Milestone sound & score blink every 100 meters (Classic Chrome Dino feature)
    const currentHundreds = Math.floor(this.state.distance / 100);
    if (currentHundreds > this.lastMilestoneHundred && currentHundreds > 0) {
      this.lastMilestoneHundred = currentHundreds;
      window.soundEngine.playMilestone();
      const scoreEl = document.getElementById('hud-score');
      if (scoreEl) {
        scoreEl.classList.remove('milestone-blink');
        void scoreEl.offsetWidth; // Force CSS reflow
        scoreEl.classList.add('milestone-blink');
      }
    }

    // Lane change interpolation
    this.currentX = THREE.MathUtils.lerp(this.currentX, this.targetX, delta * 14);

    // Jump / Gravity physics
    if (!this.isGrounded) {
      this.dinoVy += this.gravity * delta;
      this.dinoY += this.dinoVy * delta;

      if (this.dinoY <= 0) {
        this.dinoY = 0;
        this.dinoVy = 0;
        this.isGrounded = true;
        this.jumpCount = 0;

        // Ground landing impact
        if (this.state.hasStompShockwave) {
          this.createExplosionParticles(this.dino.position, 0x00e5ff, 18);
          // Destroy immediate cacti
          this.obstacles.forEach((obs, idx) => {
            if (obs.name === 'obstacle_cactus' && Math.abs(obs.position.z - this.dino.position.z) < 4.0) {
              this.scene.remove(obs);
              this.obstacles.splice(idx, 1);
            }
          });
        }
      }
    }

    // Dash Timers
    if (this.isDashing) {
      this.dashTimer -= delta;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }
    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    }

    // Invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      this.dino.visible = Math.floor(Date.now() / 80) % 2 === 0;
    } else {
      this.dino.visible = true;
    }

    // Magnet timer
    if (this.state.magnetTimer > 0) {
      this.state.magnetTimer -= delta;
    }

    // Update Dino position & 3D mesh animation
    this.dino.position.set(this.currentX, this.dinoY, 0);

    // Bank tilt into turn
    const bankAngle = (this.currentX - this.targetX) * 0.12;
    this.dino.rotation.z = bankAngle;

    Dino3DGame.updateDinoMesh(this.dino, delta, {
      speedMultiplier: this.state.currentSpeed / this.state.baseSpeed,
      isGrounded: this.isGrounded,
      isJumping: !this.isGrounded,
      isDucking: this.isDucking,
      hasShield: this.state.shields > 0,
      isDashing: this.isDashing,
      isDead: false
    });
  }

  static updateDinoMesh(dino, delta, state) {
    ModelFactory.updateDino(dino, delta, state);
  }

  updateWorld(delta) {
    const moveZ = this.state.currentSpeed * delta;

    // Move chunks backwards to simulate forward infinite running
    this.chunks.forEach((chunk) => {
      chunk.position.z -= moveZ;
    });

    // Recycle chunk that passed behind camera
    const firstChunk = this.chunks[0];
    if (firstChunk && firstChunk.position.z < -this.chunkLength) {
      this.scene.remove(firstChunk);
      this.chunks.shift();

      const lastChunk = this.chunks[this.chunks.length - 1];
      const newZ = lastChunk.position.z + this.chunkLength;
      this.createTrackChunk(newZ);
    }

    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.position.z -= moveZ;

      if (obs.name === 'obstacle_ptero') {
        ModelFactory.updatePterodactyl(obs, delta);
      }

      if (obs.position.z < -10) {
        this.scene.remove(obs);
        this.obstacles.splice(i, 1);
      }
    }

    // Move pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.position.z -= moveZ;

      // Animate rotation & hovering
      p.rotation.y += delta * (p.userData.spinSpeed || 2);
      p.userData.floatTimer += delta * 3;
      p.position.y = (p.userData.baseY || 1.0) + Math.sin(p.userData.floatTimer) * 0.15;

      if (p.position.z < -10) {
        this.scene.remove(p);
        this.pickups.splice(i, 1);
      }
    }

    // Light target follows dino
    this.dirLight.position.x = this.dino.position.x + 10;
    this.dirLightTarget.position.x = this.dino.position.x;
  }

  updateCamera(delta) {
    if (this.cameraShake > 0) {
      this.cameraShake -= delta * 2;
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
    }

    if (this.cameraMode === 'dynamic') {
      // Third-person smooth follow
      const targetCamX = this.dino.position.x * 0.45;
      const targetCamY = 3.8 + (this.dinoY * 0.4);
      const targetCamZ = -6.5;

      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, delta * 8);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, delta * 8);
      this.camera.position.z = targetCamZ;

      this.camera.lookAt(this.dino.position.x * 0.7, 1.6 + this.dinoY * 0.3, 7.5);

      // Dash FOV zoom
      const targetFov = this.isDashing ? 74 : 60;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 6);
      this.camera.updateProjectionMatrix();

    } else if (this.cameraMode === 'retro') {
      // Classic 2.5D side scroller perspective
      this.camera.position.set(11.5, 3.2, 0);
      this.camera.lookAt(0, 1.4, 0);
      this.camera.fov = 50;
      this.camera.updateProjectionMatrix();

    } else if (this.cameraMode === 'fpv') {
      // First person dino eyes
      this.camera.position.set(this.dino.position.x, this.dinoY + 2.1, 0.9);
      this.camera.lookAt(this.dino.position.x, this.dinoY + 1.8, 20);
      this.camera.fov = 75;
      this.camera.updateProjectionMatrix();
    }
  }

  /* ---------------- HUD & UI UPDATES ---------------- */

  updateHUD() {
    // XP Bar
    const xpPct = Math.min(100, (this.state.runXp / this.state.runXpNeeded) * 100);
    document.getElementById('hud-xp-fill').style.width = `${xpPct}%`;
    document.getElementById('hud-xp-text').textContent = `${Math.floor(this.state.runXp)} / ${this.state.runXpNeeded} XP`;
    document.getElementById('hud-run-level').textContent = `POZ ${this.state.runLevel}`;

    // Shields
    const shieldsContainer = document.getElementById('hud-shields');
    shieldsContainer.innerHTML = '';
    const totalVisibleShields = Math.max(this.state.maxShields, this.state.shields);
    for (let s = 0; s < totalVisibleShields; s++) {
      const orb = document.createElement('div');
      orb.className = 'shield-orb' + (s < this.state.shields ? '' : ' broken');
      shieldsContainer.appendChild(orb);
    }

    // Score & Distance
    document.getElementById('hud-score').textContent = Math.floor(this.state.score).toString().padStart(5, '0');
    document.getElementById('hud-multiplier').textContent = `x${this.state.scoreMultiplier.toFixed(1)}`;
    document.getElementById('hud-distance').textContent = `${Math.floor(this.state.distance)} m`;
    document.getElementById('hud-amber').textContent = this.state.amberCollected;

    // Dash Cooldown bar
    const dashFill = document.getElementById('dash-fill');
    if (this.dashCooldown <= 0) {
      dashFill.style.width = '100%';
    } else {
      const pct = (1 - (this.dashCooldown / this.dashCooldownMax)) * 100;
      dashFill.style.width = `${pct}%`;
    }
  }

  updateTitleScreenUI() {
    const mgr = window.upgradeManager;
    document.getElementById('title-profile-level').textContent = mgr.saveData.profileLevel;
    document.getElementById('title-amber-total').textContent = `💎 ${mgr.saveData.amberTotal}`;
    document.getElementById('title-high-score').textContent = mgr.saveData.highScore.toLocaleString();
  }

  populateTalentsUI() {
    const mgr = window.upgradeManager;
    const container = document.getElementById('talents-tree-container');
    container.innerHTML = '';
    document.getElementById('evo-amber-balance').textContent = `💎 ${mgr.saveData.amberTotal}`;

    UpgradeManager.TALENTS.forEach(talent => {
      const currentLvl = mgr.getTalentLevel(talent.id);
      const isMax = currentLvl >= talent.maxLevel;
      const nextCost = isMax ? null : talent.costPerLevel[currentLvl];
      const canAfford = nextCost !== null && mgr.saveData.amberTotal >= nextCost;

      const card = document.createElement('div');
      card.className = 'talent-card';

      // Pips
      let pipsHtml = '<div class="talent-pip-bar">';
      for (let p = 0; p < talent.maxLevel; p++) {
        pipsHtml += `<div class="talent-pip ${p < currentLvl ? 'active' : ''}"></div>`;
      }
      pipsHtml += '</div>';

      card.innerHTML = `
        <div class="talent-card-header">
          <div class="talent-icon">${talent.icon}</div>
          <div class="talent-title-box">
            <div class="talent-name">${talent.name}</div>
            <div class="talent-level-tag">Poziom ${currentLvl} / ${talent.maxLevel}</div>
          </div>
        </div>
        <div class="talent-desc">${talent.desc}</div>
        <div style="font-size:0.75rem; color:#00e5ff; font-weight:700;">${talent.getEffect(currentLvl || 1)}</div>
        ${pipsHtml}
        <button class="talent-buy-btn" ${isMax || !canAfford ? 'disabled' : ''}>
          ${isMax ? 'MAKSYMALNY POZIOM' : `ULEPSZ (💎 ${nextCost})`}
        </button>
      `;

      const buyBtn = card.querySelector('.talent-buy-btn');
      buyBtn.addEventListener('click', () => {
        if (mgr.buyTalent(talent.id)) {
          window.soundEngine.playLevelUp();
          this.populateTalentsUI();
          this.applyPersistentStats();
          this.updateTitleScreenUI();
        }
      });

      container.appendChild(card);
    });
  }

  populateSkinsUI() {
    const mgr = window.upgradeManager;
    const container = document.getElementById('skins-container');
    container.innerHTML = '';

    for (const [id, skin] of Object.entries(ModelFactory.SKINS)) {
      const isUnlocked = mgr.saveData.unlockedSkins.includes(id);
      const isSelected = mgr.saveData.selectedSkin === id;

      const card = document.createElement('div');
      card.className = `skin-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;

      card.innerHTML = `
        <div class="skin-preview-sphere" style="background:#${skin.color.toString(16).padStart(6, '0')};">
          🦖
        </div>
        <div class="skin-title">${skin.name}</div>
        <div class="skin-trait">${skin.trait}</div>
        <div style="font-size:0.78rem; color:#9aa8b8;">${skin.desc}</div>
        ${!isUnlocked ? `<div style="color:#ff3355; font-size:0.75rem; font-weight:700;">Wymaga ${skin.unlockedAtLevel} poziomu profilu</div>` : ''}
        <button class="btn-primary skin-select-btn" ${!isUnlocked || isSelected ? 'disabled' : ''}>
          ${isSelected ? 'WYBRANA' : (isUnlocked ? 'WYBIERZ' : 'ZABLOKOWANA 🔒')}
        </button>
      `;

      const btn = card.querySelector('.skin-select-btn');
      btn.addEventListener('click', () => {
        if (mgr.setSkin(id)) {
          window.soundEngine.playClick();
          this.populateSkinsUI();
          this.rebuildDinoModel();
        }
      });

      container.appendChild(card);
    }
  }

  populateLeaderboardUI(activeTab = 'global') {
    const tbody = document.getElementById('leaderboard-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const lm = window.leaderboardManager;
    const entries = activeTab === 'global' ? lm.getTopScores(20) : lm.playerHistory;

    // Summary stats
    const best = lm.getPlayerBest();
    const bestScoreEl = document.getElementById('lb-my-best-score');
    const bestRankEl = document.getElementById('lb-my-best-rank');
    if (best) {
      const overallRank = lm.scores.findIndex(e => e.timestamp === best.timestamp) + 1;
      bestScoreEl.textContent = `${best.score.toLocaleString()} pkt (${best.distance} m)`;
      bestRankEl.textContent = overallRank > 0 ? `#${overallRank}` : '--';
    } else {
      bestScoreEl.textContent = 'Brak ukończonych biegów';
      bestRankEl.textContent = '--';
    }

    if (!entries || entries.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="6" style="text-align:center; color:#9aa8b8; padding:24px;">Brak zapisanych wyników w tej kategorii.</td>`;
      tbody.appendChild(emptyRow);
      return;
    }

    entries.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      if (entry.isPlayer) {
        tr.classList.add('player-row');
      }

      // Rank badge
      let rankHtml = '';
      if (activeTab === 'global') {
        if (idx === 0) rankHtml = `<span class="rank-badge rank-1">🥇 1</span>`;
        else if (idx === 1) rankHtml = `<span class="rank-badge rank-2">🥈 2</span>`;
        else if (idx === 2) rankHtml = `<span class="rank-badge rank-3">🥉 3</span>`;
        else rankHtml = `<span class="rank-badge rank-other">${idx + 1}</span>`;
      } else {
        rankHtml = `<span class="rank-badge rank-other">#${entries.length - idx}</span>`;
      }

      tr.innerHTML = `
        <td>${rankHtml}</td>
        <td>
          <strong>${entry.name}</strong>
          ${entry.isPlayer ? '<span class="player-tag">TY</span>' : ''}
        </td>
        <td style="color:#00e5ff; font-weight:800;">${entry.score.toLocaleString()}</td>
        <td style="font-weight:700;">${entry.distance} m</td>
        <td style="color:#9aa8b8; font-size:0.78rem;">${entry.skin || 'Dino Klasyczny'}</td>
        <td style="color:#64748b; font-size:0.75rem;">${entry.date || '--'}</td>
      `;

      tbody.appendChild(tr);
    });
  }
}

// Instantiate game on load
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Dino3DGame();
});
