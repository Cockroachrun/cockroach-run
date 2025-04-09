/**
 * Cockroach Run - Scene Manager
 * Manages game scenes, levels, and 3D environment
 */

import { randomFloat, randomInt, clamp } from "../utils/utils.js";

export class SceneManager {
  /**
   * Constructor
   * @param {Object} game - The main game object
   */
  constructor(game) {
    this.game = game;

    // Scene objects
    this.player = null;
    this.environment = null;
    this.obstacles = [];
    this.collectibles = [];
    this.lights = [];

    // Physics objects
    this.colliders = [];
    this.eggCheckpoints = [];

    // Current level
    this.currentLevel = null;
    this.levelConfig = null;

    // Game state
    this.gameTime = 0;
    this.playerSpeed = 0;
    this.eggCooldown = 0;
    this.objectives = [];

    // Effect states
    this.slowMotionActive = false;
    this.invincibilityActive = false;
    this.magnetActive = false;

    // Bind methods
    this.updatePhysics = this.updatePhysics.bind(this);
  }

  /**
   * Load the Free Runner scene
   */
  loadFreeRunnerScene() {
    console.log("Loading Free Runner scene...");
    this.clearScene();
    this.currentLevel = "kitchen";
    this.game.gameMode = "freeRunner";
    this.levelConfig = this.getLevelConfig(this.currentLevel);
    this.playerSpeed =
      this.game.config.characters[this.game.selectedCharacter].speed;
    this.createEnvironment();
    this.createPlayer();
    this.createLighting();
    this.setupCamera();
    this.createObjectives();
    this.gameTime = 0;
    console.log(`Free Runner scene loaded: ${this.currentLevel}`);
  }

  /**
   * Load the Roach Runner scene
   */
  loadRoachRunnerScene() {
    console.log("Loading Roach Runner scene...");
    this.clearScene();
    this.currentLevel = "sewer";
    this.game.gameMode = "roachRunner";
    this.playerSpeed = this.game.config.gameModes.roachRunner.initialSpeed;
    this.createProceduralEnvironment();
    this.createPlayer();
    this.createLighting();
    this.setupCamera();
    this.gameTime = 0;
    console.log("Roach Runner scene loaded");
  }

  /**
   * Create the environment based on the current level
   */
  createEnvironment() {
    const modelName = `environment_${this.currentLevel}`;
    const environmentModel = this.game.assetLoader.getModel(modelName);
    if (!environmentModel) {
      console.error(`Environment model not found: ${modelName}`);
      return;
    }
    this.environment = environmentModel.scene.clone();
    this.game.scene.add(this.environment);
    this.setupEnvironmentPhysics();
    this.playEnvironmentSound();
  }

  /**
   * Create a procedural endless runner environment
   */
  createProceduralEnvironment() {
    this.createBaseTrack();
    for (let i = 0; i < 10; i++) {
      this.generateTrackSegment(i * 50);
    }
    this.setupEnvironmentPhysics();
    this.playEnvironmentSound();
  }

  /**
   * Create the base track for the endless runner
   */
  createBaseTrack() {
    this.trackGroup = new THREE.Group();
    this.trackGroup.name = "track";
    this.game.scene.add(this.trackGroup);
    this.trackSegments = [];
    this.activeSegments = [];
    this.segmentLength = 50;
    this.trackWidth = 10;
  }

  /**
   * Generate a new track segment at the given position
   * @param {number} zPosition - Z position of the segment
   */
  generateTrackSegment(zPosition) {
    const segment = new THREE.Group();
    segment.position.z = -zPosition;
    segment.name = `segment_${zPosition}`;
    const trackGeometry = new THREE.BoxGeometry(
      this.trackWidth,
      1,
      this.segmentLength
    );
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
    });
    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    trackMesh.position.y = -0.5;
    trackMesh.receiveShadow = true;
    segment.add(trackMesh);

    // Add obstacles
    this.addObstaclesToSegment(segment);

    // Add collectibles
    this.addCollectiblesToSegment(segment);

    // Add segment to track group
    this.trackGroup.add(segment);

    // Add to active segments
    this.activeSegments.push({
      group: segment,
      zPosition: zPosition,
    });
  }

  /**
   * Add obstacles to a track segment
   * @param {Object} segment - Track segment group
   */
  addObstaclesToSegment(segment) {
    // Determine number of obstacles (random)
    const obstacleCount = randomInt(1, 3);

    for (let i = 0; i < obstacleCount; i++) {
      // Random position within segment
      const xPos = randomFloat(
        -this.trackWidth / 2 + 1,
        this.trackWidth / 2 - 1
      );
      const zPos = randomFloat(
        -this.segmentLength / 2 + 5,
        this.segmentLength / 2 - 5
      );

      // Random obstacle type
      const obstacleTypes = [
        "trash_can",
        "puddle",
        "bottle",
        "newspaper",
        "shoe",
      ];
      const obstacleType =
        obstacleTypes[randomInt(0, obstacleTypes.length - 1)];

      // Create obstacle
      this.createObstacle(obstacleType, segment, xPos, 0, zPos);
    }
  }

  /**
   * Add collectibles to a track segment
   * @param {Object} segment - Track segment group
   */
  addCollectiblesToSegment(segment) {
    // Determine number of collectibles (random)
    const collectibleCount = randomInt(2, 5);

    for (let i = 0; i < collectibleCount; i++) {
      // Random position within segment
      const xPos = randomFloat(
        -this.trackWidth / 2 + 1,
        this.trackWidth / 2 - 1
      );
      const zPos = randomFloat(
        -this.segmentLength / 2 + 5,
        this.segmentLength / 2 - 5
      );

      // Random collectible type
      const collectibleTypes = ["food", "energy", "health", "special"];

      // Special collectibles are more rare
      let collectibleType;
      if (Math.random() < 0.15) {
        collectibleType = "special";
      } else {
        collectibleType = collectibleTypes[randomInt(0, 2)];
      }

      // Create collectible
      this.createCollectible(collectibleType, segment, xPos, 1, zPos);
    }
  }

  /**
   * Create an obstacle
   * @param {string} type - Obstacle type
   * @param {Object} parent - Parent group
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   */
  createObstacle(type, parent, x, y, z) {
    // Load obstacle model
    const modelName = `obstacle_${type}`;
    const obstacleModel = this.game.assetLoader.getModel(modelName);

    if (!obstacleModel) {
      console.warn(`Obstacle model not found: ${modelName}`);
      return;
    }

    // Clone the obstacle model
    const obstacle = obstacleModel.scene.clone();

    // Set position
    obstacle.position.set(x, y, z);

    // Add to parent
    parent.add(obstacle);

    // Set up physics
    const boundingBox = new THREE.Box3().setFromObject(obstacle);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    // Create collider
    const collider = {
      object: obstacle,
      type: "obstacle",
      boundingBox: boundingBox,
      size: size,
      position: obstacle.position,
      collisionType: type,
    };

    // Add to colliders
    this.colliders.push(collider);

    // Add to obstacles
    this.obstacles.push({
      object: obstacle,
      collider: collider,
    });
  }

  /**
   * Create a collectible
   * @param {string} type - Collectible type
   * @param {Object} parent - Parent group
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   */
  createCollectible(type, parent, x, y, z) {
    // Determine collectible appearance based on type
    let geometry, material;

    switch (type) {
      case "food":
        geometry = new THREE.SphereGeometry(0.5, 8, 8);
        material = new THREE.MeshStandardMaterial({ color: 0xffa500 });
        break;
      case "energy":
        geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        material = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 0.5,
        });
        break;
      case "health":
        geometry = new THREE.SphereGeometry(0.5, 8, 8);
        material = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0.3,
        });
        break;
      case "special":
        geometry = new THREE.IcosahedronGeometry(0.7, 0);
        material = new THREE.MeshStandardMaterial({
          color: 0xffff00,
          emissive: 0xffff00,
          emissiveIntensity: 0.7,
        });
        break;
    }

    // Create mesh
    const collectible = new THREE.Mesh(geometry, material);
    collectible.position.set(x, y, z);
    collectible.castShadow = true;

    // Add rotation animation
    collectible.userData.rotationSpeed = 0.02;
    collectible.userData.floatSpeed = 0.01;
    collectible.userData.floatHeight = 0.5;
    collectible.userData.initialY = y;

    // Add to parent
    parent.add(collectible);

    // Create collider
    const boundingBox = new THREE.Box3().setFromObject(collectible);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    // Determine collectible value and effect
    let value = 0;
    let effectType = null;
    let duration = 0;

    switch (type) {
      case "food":
        value = randomInt(10, 30);
        break;
      case "energy":
        value = randomInt(10, 25);
        break;
      case "health":
        value = randomInt(5, 15);
        break;
      case "special":
        // Random special effect
        const effectTypes = ["slowTime", "invincibility", "magnet"];
        effectType = effectTypes[randomInt(0, effectTypes.length - 1)];
        duration = randomInt(5, 10);
        break;
    }

    // Create collectible data
    const collectibleData = {
      object: collectible,
      type: type,
      value: value,
      effectType: effectType,
      duration: duration,
      collider: {
        object: collectible,
        type: "collectible",
        boundingBox: boundingBox,
        size: size,
        position: collectible.position,
      },
    };

    // Add to colliders
    this.colliders.push(collectibleData.collider);

    // Add to collectibles
    this.collectibles.push(collectibleData);
  }
  /**
   * Create the player character
   */
  createPlayer() {
    const modelName = `cockroach_${this.game.selectedCharacter}`;
    const characterModel = this.game.assetLoader.getModel(modelName);
    if (!characterModel) {
      console.error(`Character model not found: ${modelName}`);
      return;
    }
    this.player = characterModel.scene.clone();
    this.player.position.set(0, 0, 0);
    this.player.rotation.y = Math.PI;
    this.player.castShadow = true;
    this.player.receiveShadow = true;
    this.game.scene.add(this.player);
    this.setupPlayerPhysics();
    this.setupPlayerAnimations();
  }

  setupPlayerPhysics() {
    const boundingBox = new THREE.Box3().setFromObject(this.player);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    this.playerCollider = {
      object: this.player,
      type: "player",
      boundingBox: boundingBox,
      size: size,
      position: this.player.position,
      velocity: new THREE.Vector3(0, 0, 0),
      onGround: true,
      jumping: false,
      falling: false,
    };
    this.colliders.push(this.playerCollider);
    const character = this.game.config.characters[this.game.selectedCharacter];
    this.playerData = {
      speed: character.speed,
      turnRate: character.turnRate,
      acceleration: character.acceleration,
      ability: character.ability,
      abilityCooldown: character.abilityCooldown,
      abilityDuration: character.abilityDuration,
      abilityActive: false,
      abilityCooldownTime: 0,
      health: 100,
      energy: 100,
    };
  }

  setupPlayerAnimations() {
    if (this.player.animations && this.player.animations.length > 0) {
      this.animationMixer = new THREE.AnimationMixer(this.player);
      const idleAnim = THREE.AnimationClip.findByName(
        this.player.animations,
        "idle"
      );
      const runAnim = THREE.AnimationClip.findByName(
        this.player.animations,
        "run"
      );
      const jumpAnim = THREE.AnimationClip.findByName(
        this.player.animations,
        "jump"
      );
      if (idleAnim) {
        this.idleAction = this.animationMixer.clipAction(idleAnim);
        this.idleAction.play();
      }
      if (runAnim) {
        this.runAction = this.animationMixer.clipAction(runAnim);
      }
      if (jumpAnim) {
        this.jumpAction = this.animationMixer.clipAction(jumpAnim);
        this.jumpAction.setLoop(THREE.LoopOnce);
        this.jumpAction.clampWhenFinished = true;
      }
    } else {
      console.warn("No animations found for player model");
    }
  }

  setupEnvironmentPhysics() {
    if (this.game.gameMode === "freeRunner" && this.environment) {
      this.environment.traverse((object) => {
        if (object.userData && object.userData.collidable) {
          const boundingBox = new THREE.Box3().setFromObject(object);
          const size = new THREE.Vector3();
          boundingBox.getSize(size);
          const collider = {
            object: object,
            type: "environment",
            boundingBox: boundingBox,
            size: size,
            position: object.position,
          };
          this.colliders.push(collider);
        }
      });
    }
  }

  createLighting() {
    this.lights.forEach((light) => {
      this.game.scene.remove(light);
    });
    this.lights = [];
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.game.scene.add(ambientLight);
    this.lights.push(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    if (this.game.config.graphics.shadows) {
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -20;
      directionalLight.shadow.camera.right = 20;
      directionalLight.shadow.camera.top = 20;
      directionalLight.shadow.camera.bottom = -20;
    }
    this.game.scene.add(directionalLight);
    this.lights.push(directionalLight);
    if (this.game.gameMode === "freeRunner") {
      switch (this.currentLevel) {
        case "kitchen":
          const kitchenLight = new THREE.PointLight(0xffffcc, 1, 20);
          kitchenLight.position.set(0, 10, 0);
          kitchenLight.castShadow = this.game.config.graphics.shadows;
          this.game.scene.add(kitchenLight);
          this.lights.push(kitchenLight);
          break;
        case "bathroom":
          const bathroomLight = new THREE.PointLight(0xccf0ff, 1, 15);
          bathroomLight.position.set(0, 5, 0);
          bathroomLight.castShadow = this.game.config.graphics.shadows;
          this.game.scene.add(bathroomLight);
          this.lights.push(bathroomLight);
          break;
        case "street":
          const streetLight = new THREE.PointLight(0xffaa00, 1, 30);
          streetLight.position.set(5, 8, 0);
          streetLight.castShadow = this.game.config.graphics.shadows;
          this.game.scene.add(streetLight);
          this.lights.push(streetLight);
          break;
        case "sewer":
          const sewerLight = new THREE.PointLight(0x88ff88, 0.5, 10);
          sewerLight.position.set(0, 3, 5);
          sewerLight.castShadow = this.game.config.graphics.shadows;
          this.game.scene.add(sewerLight);
          this.lights.push(sewerLight);
          break;
      }
    } else if (this.game.gameMode === "roachRunner") {
      for (let i = 0; i < 3; i++) {
        const z = -i * 20;
        const pointLight = new THREE.PointLight(0x88ff88, 0.7, 15);
        pointLight.position.set(0, 5, z);
        pointLight.castShadow = this.game.config.graphics.shadows;
        this.game.scene.add(pointLight);
        this.lights.push(pointLight);
      }
    }
  }

  setupCamera() {
    if (this.game.gameMode === "freeRunner") {
      this.game.camera.position.set(0, 3, 5);
      this.game.camera.lookAt(this.player.position);
    } else if (this.game.gameMode === "roachRunner") {
      this.game.camera.position.set(0, 2, 5);
      this.game.camera.lookAt(new THREE.Vector3(0, 0, -10));
    }
  }

  /**
   * Create objectives for Free Runner mode
   */
  createObjectives() {
    if (this.game.gameMode !== "freeRunner") return;
    this.objectives = [];
    switch (this.currentLevel) {
      case "kitchen":
        this.objectives = [
          {
            id: "explore_kitchen",
            name: "Explore the Kitchen",
            description: "Discover all areas of the kitchen",
            progress: 0,
            target: 100,
            completed: false,
            rewards: { score: 100, energy: 20 },
          },
          {
            id: "find_food",
            name: "Find Food Stash",
            description: "Locate the hidden food supply",
            progress: 0,
            target: 1,
            completed: false,
            rewards: { score: 200, health: 10 },
          },
        ];
        break;
      case "bathroom":
        this.objectives = [
          {
            id: "climb_sink",
            name: "Climb the Sink",
            description: "Make your way to the top of the sink",
            progress: 0,
            target: 1,
            completed: false,
            rewards: { score: 150, energy: 15 },
          },
          {
            id: "avoid_water",
            name: "Avoid Water Hazards",
            description: "Navigate without touching water",
            progress: 0,
            target: 60,
            completed: false,
            rewards: { score: 180, health: 10 },
          },
        ];
        break;
      case "street":
        this.objectives = [
          {
            id: "cross_road",
            name: "Cross the Road",
            description: "Make it to the other side safely",
            progress: 0,
            target: 1,
            completed: false,
            rewards: { score: 250, energy: 25 },
          },
          {
            id: "find_shelter",
            name: "Find Shelter",
            description: "Locate a safe spot before dawn",
            progress: 0,
            target: 1,
            completed: false,
            rewards: { score: 200, health: 15 },
          },
        ];
        break;
      case "sewer":
        this.objectives = [
          {
            id: "navigate_dark",
            name: "Navigate in Darkness",
            description: "Find your way through the dark sewer",
            progress: 0,
            target: 1,
            completed: false,
            rewards: { score: 300, energy: 30 },
          },
          {
            id: "avoid_water_current",
            name: "Avoid the Current",
            description: "Stay away from the rushing water",
            progress: 0,
            target: 120,
            completed: false,
            rewards: { score: 250, health: 20 },
          },
        ];
        break;
    }
  }

  playEnvironmentSound() {
    let soundId = "";
    switch (this.currentLevel) {
      case "kitchen":
        soundId = "kitchen_ambience";
        break;
      case "bathroom":
        soundId = "bathroom_ambience";
        break;
      case "street":
        soundId = "street_ambience";
        break;
      case "sewer":
        soundId = "sewer_ambience";
        break;
      default:
        soundId = "default_ambience";
    }
    if (this.game.audio.soundEffects.has(soundId)) {
      this.game.audio.playSound(soundId, {
        loop: true,
        volume: this.game.audio.ambientVolume,
      });
    }
  }

  clearScene() {
    while (this.game.scene.children.length > 0) {
      const object = this.game.scene.children[0];
      if (object !== this.game.camera) {
        this.game.scene.remove(object);
      } else {
        if (this.game.scene.children.length > 1) {
          this.game.scene.remove(this.game.scene.children[1]);
        } else {
          break;
        }
      }
    }
    this.obstacles = [];
    this.collectibles = [];
    this.lights = [];
    this.colliders = [];
    this.eggCheckpoints = [];
    this.trackSegments = [];
    this.activeSegments = [];
    this.player = null;
    this.playerCollider = null;
    this.animationMixer = null;
    this.environment = null;
    this.trackGroup = null;
    this.gameTime = 0;
    this.playerSpeed = 0;
    this.eggCooldown = 0;
    this.objectives = [];
    this.slowMotionActive = false;
    this.invincibilityActive = false;
    this.magnetActive = false;
    console.log("Scene cleared");
  }

  getLevelConfig(levelId) {
    const gameModes = this.game.config.gameModes;
    if (this.game.gameMode === "freeRunner") {
      if (!gameModes.freeRunner.availableLevels.includes(levelId)) {
        console.error(`Level not available: ${levelId}`);
        return null;
      }
      return {
        id: levelId,
        difficulty: gameModes.freeRunner.difficulty,
        timeLimit: gameModes.freeRunner.timeLimit,
        eggRespawnTime: gameModes.freeRunner.eggRespawnTime,
      };
    } else if (this.game.gameMode === "roachRunner") {
      return {
        id: "runner",
        difficulty: gameModes.roachRunner.difficulty,
        initialSpeed: gameModes.roachRunner.initialSpeed,
        maxSpeed: gameModes.roachRunner.maxSpeed,
        speedIncreaseInterval: gameModes.roachRunner.speedIncreaseInterval,
        speedIncreaseAmount: gameModes.roachRunner.speedIncreaseAmount,
      };
    }
    return null;
  }

  updatePlayer(dt) {
    if (!this.player || !this.playerCollider) return;
    this.handlePlayerMovement(dt);
    this.updatePlayerAnimations(dt);
    if (this.playerData.abilityCooldownTime > 0) {
      this.playerData.abilityCooldownTime -= dt;
      if (this.playerData.abilityCooldownTime <= 0) {
        this.playerData.abilityCooldownTime = 0;
      }
    }
    if (this.playerData.abilityActive) {
      this.playerData.abilityDurationTime -= dt;
      if (this.playerData.abilityDurationTime <= 0) {
        this.deactivateAbility();
      }
    }
    if (this.game.input.isAbilityPressed() && this.canActivateAbility()) {
      this.activateAbility();
    }

    this.updatePlayerBoundingBox();
  }

  handlePlayerMovement(dt) {
    const input = this.game.input.getMovementDirection();
    if (this.game.gameMode === "freeRunner") {
      this.handleFreeRunnerMovement(input, dt);
    } else if (this.game.gameMode === "roachRunner") {
      this.handleRoachRunnerMovement(input, dt);
    }
  }

  handleFreeRunnerMovement(input, dt) {
    const moveSpeed = this.playerSpeed * 5 * dt;
    const rotateSpeed = this.playerData.turnRate * 3 * dt;
    if (input.x !== 0) {
      this.player.rotation.y -= input.x * rotateSpeed;
    }
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.player.quaternion);
    if (input.z !== 0) {
      this.playerCollider.velocity.x = direction.x * input.z * moveSpeed;
      this.playerCollider.velocity.z = direction.z * input.z * moveSpeed;
    } else {
      this.playerCollider.velocity.x *= 0.9;
      this.playerCollider.velocity.z *= 0.9;
    }
    if (input.jump && this.playerCollider.onGround) {
      this.playerCollider.velocity.y = 8 * dt * 60;
      this.playerCollider.onGround = false;
      this.playerCollider.jumping = true;
      this.game.audio.playSound("jump");
      if (this.jumpAction) {
        this.jumpAction.reset();
        this.jumpAction.play();
      }
    }
    if (!this.playerCollider.onGround) {
      this.playerCollider.velocity.y -= 20 * dt;
    }
  }

  handleRoachRunnerMovement(input, dt) {
    const forwardSpeed = this.playerSpeed * dt * 5;
    if (this.trackGroup) {
      this.trackGroup.position.z += forwardSpeed;
    }
    const sideSpeed = this.playerSpeed * 4 * dt;
    if (input.x !== 0) {
      const newX = this.player.position.x + input.x * sideSpeed;
      const trackHalfWidth = this.trackWidth / 2 - 1;
      this.player.position.x = clamp(newX, -trackHalfWidth, trackHalfWidth);
    }
    if (input.jump && this.playerCollider.onGround) {
      this.playerCollider.velocity.y = 8 * dt * 60;
      this.playerCollider.onGround = false;
      this.playerCollider.jumping = true;
      this.game.audio.playSound("jump");
      if (this.jumpAction) {
        this.jumpAction.reset();
        this.jumpAction.play();
      }
    }
    if (!this.playerCollider.onGround) {
      this.playerCollider.velocity.y -= 20 * dt;
    }
  }

  updatePlayerAnimations(dt) {
    if (this.animationMixer) {
      this.animationMixer.update(dt);
    }
    if (this.runAction && this.idleAction) {
      const input = this.game.input.getMovementDirection();
      if (this.game.gameMode === "freeRunner") {
        if (input.z !== 0 || Math.abs(input.x) > 0.5) {
          this.idleAction.weight = 0;
          this.runAction.weight = 1;
          if (!this.runAction.isRunning()) {
            this.runAction.play();
          }
        } else {
          this.runAction.weight = 0;
          this.idleAction.weight = 1;
          if (!this.idleAction.isRunning()) {
            this.idleAction.play();
          }
        }
      } else if (this.game.gameMode === "roachRunner") {
        this.idleAction.weight = 0;
        this.runAction.weight = 1;
        if (!this.runAction.isRunning()) {
          this.runAction.play();
        }
      }
    }
  }

  updatePlayerBoundingBox() {
    if (!this.player || !this.playerCollider) return;
    this.playerCollider.boundingBox.setFromObject(this.player);
    this.playerCollider.position = this.player.position;
  }

  canActivateAbility() {
    return (
      !this.playerData.abilityActive &&
      this.playerData.abilityCooldownTime <= 0 &&
      this.game.stats.energy >= 25
    );
  }

  activateAbility() {
    this.playerData.abilityActive = true;
    this.playerData.abilityDurationTime = this.playerData.abilityDuration;
    this.game.stats.energy -= 25;
    this.game.ui.updateStats(this.game.stats);
    switch (this.game.selectedCharacter) {
      case "default":
        this.playerSpeed = this.playerData.speed * 1.5;
        this.game.ui.showSpecialEffect("speedBoost", true);
        break;
      case "stealth":
        this.game.ui.showSpecialEffect("stealth", true);
        break;
      case "glider":
        this.player.userData.gliding = true;
        this.game.ui.showSpecialEffect("glide", true);
        break;
    }
    this.game.audio.playSound("ability");
    console.log(`Activated ${this.playerData.ability}`);
  }

  deactivateAbility() {
    this.playerData.abilityActive = false;
    this.playerData.abilityCooldownTime = this.playerData.abilityCooldown;
    switch (this.game.selectedCharacter) {
      case "default":
        this.playerSpeed = this.playerData.speed;
        this.game.ui.showSpecialEffect("speedBoost", false);
        break;
      case "stealth":
        this.game.ui.showSpecialEffect("stealth", false);
        break;
      case "glider":
        this.player.userData.gliding = false;
        this.game.ui.showSpecialEffect("glide", false);
        break;
    }
    console.log(`Deactivated ${this.playerData.ability}`);
  }

  updateCamera(dt) {
    if (!this.player) return;
    if (this.game.gameMode === "freeRunner") {
      const cameraTarget = new THREE.Vector3();
      const cameraOffset = new THREE.Vector3(0, 3, 5);
      cameraOffset.applyQuaternion(this.player.quaternion);
      cameraTarget.copy(this.player.position).add(cameraOffset);
      this.game.camera.position.lerp(cameraTarget, 5 * dt);
      const lookTarget = new THREE.Vector3();
      lookTarget.copy(this.player.position).add(new THREE.Vector3(0, 1, 0));
      this.game.camera.lookAt(lookTarget);
    } else if (this.game.gameMode === "roachRunner") {
      this.game.camera.position.set(0, 2, 5);
      this.game.camera.lookAt(new THREE.Vector3(0, 0, -10));
    }
  }

  updatePhysics(dt) {
    if (this.player && this.playerCollider) {
      this.player.position.x += this.playerCollider.velocity.x;
      this.player.position.y += this.playerCollider.velocity.y;
      this.player.position.z += this.playerCollider.velocity.z;
      this.handleCollisions();
      this.checkGroundContact();
      this.checkOutOfBounds();
    }
    this.collectibles.forEach((collectible) => {
      const object = collectible.object;
      if (object.userData.rotationSpeed) {
        object.rotation.y += object.userData.rotationSpeed;
      }
      if (
        object.userData.floatSpeed &&
        object.userData.initialY !== undefined
      ) {
        const floatOffset =
          Math.sin(this.gameTime * 2) * object.userData.floatHeight;
        object.position.y = object.userData.initialY + floatOffset;
      }
    });
    if (this.eggCooldown > 0) {
      this.eggCooldown -= dt;
      if (this.eggCooldown < 0) {
        this.eggCooldown = 0;
      }
    }
  }

  handleCollisions() {
    if (!this.playerCollider) return;
    this.updatePlayerBoundingBox();
    for (const collider of this.colliders) {
      if (collider === this.playerCollider) continue;
      if (collider.object) {
        collider.boundingBox.setFromObject(collider.object);
      }
      if (this.playerCollider.boundingBox.intersectsBox(collider.boundingBox)) {
        switch (collider.type) {
          case "environment":
            this.handleEnvironmentCollision(collider);
            break;
          case "obstacle":
            this.handleObstacleCollision(collider);
            break;
          case "collectible":
            this.handleCollectibleCollision(collider);
            break;
        }
      }
    }
  }

  handleEnvironmentCollision(collider) {
    const overlap = new THREE.Vector3();
    const pMin = this.playerCollider.boundingBox.min;
    const pMax = this.playerCollider.boundingBox.max;
    const eMin = collider.boundingBox.min;
    const eMax = collider.boundingBox.max;
    const xOverlap = Math.min(pMax.x - eMin.x, eMax.x - pMin.x);
    const yOverlap = Math.min(pMax.y - eMin.y, eMax.y - pMin.y);
    const zOverlap = Math.min(pMax.z - eMin.z, eMax.z - pMin.z);
    if (xOverlap < yOverlap && xOverlap < zOverlap) {
      if (this.player.position.x < collider.position.x) {
        this.player.position.x -= xOverlap;
      } else {
        this.player.position.x += xOverlap;
      }
      this.playerCollider.velocity.x = 0;
    } else if (yOverlap < xOverlap && yOverlap < zOverlap) {
      if (this.player.position.y < collider.position.y) {
        this.player.position.y -= yOverlap;
        this.playerCollider.velocity.y = -0.1;
      } else {
        this.player.position.y += yOverlap;
        if (this.playerCollider.velocity.y < 0) {
          this.playerCollider.velocity.y = 0;
        }
        this.playerCollider.onGround = true;
        this.playerCollider.jumping = false;
      }
    } else {
      if (this.player.position.z < collider.position.z) {
        this.player.position.z -= zOverlap;
      } else {
        this.player.position.z += zOverlap;
      }
      this.playerCollider.velocity.z = 0;
    }
  }

  handleObstacleCollision(collider) {
    if (this.invincibilityActive) return;
    this.applyDamage(10);
    const knockbackDir = new THREE.Vector3()
      .subVectors(this.player.position, collider.position)
      .normalize();
    this.playerCollider.velocity.x = knockbackDir.x * 0.5;
    this.playerCollider.velocity.z = knockbackDir.z * 0.5;
    this.game.audio.playSound("damage");
  }

  handleCollectibleCollision(collider) {
    const collectible = this.collectibles.find((c) => c.collider === collider);
    if (collectible) {
      switch (collectible.type) {
        case "food":
          this.game.stats.score += collectible.value;
          this.game.audio.playSound("collect");
          break;
        case "energy":
          this.game.stats.energy = Math.min(
            100,
            this.game.stats.energy + collectible.value
          );
          this.game.audio.playSound("collect");
          break;
        case "health":
          this.game.stats.health = Math.min(
            100,
            this.game.stats.health + collectible.value
          );
          this.game.audio.playSound("collect");
          break;
        case "special":
          this.applySpecialEffect(collectible);
          this.game.audio.playSound("collect");
          break;
      }
      this.game.ui.updateStats(this.game.stats);
      this.game.ui.showCollectibleNotification(collectible);
      this.removeCollectible(collectible);
    }
  }

  applySpecialEffect(collectible) {
    switch (collectible.effectType) {
      case "slowTime":
        this.activateSlowMotion(collectible.duration);
        break;
      case "invincibility":
        this.activateInvincibility(collectible.duration);
        break;
      case "magnet":
        this.activateMagnet(collectible.duration);
        break;
    }
  }

  removeCollectible(collectible) {
    if (collectible.object.parent) {
      collectible.object.parent.remove(collectible.object);
    }
    const colliderIndex = this.colliders.findIndex(
      (c) => c === collectible.collider
    );
    if (colliderIndex !== -1) {
      this.colliders.splice(colliderIndex, 1);
    }
    const collectibleIndex = this.collectibles.findIndex(
      (c) => c === collectible
    );
    if (collectibleIndex !== -1) {
      this.collectibles.splice(collectibleIndex, 1);
    }
  }

  applyDamage(amount) {
    if (this.invincibilityActive || this.game.config.debug.godMode) return;
    this.game.stats.health = Math.max(0, this.game.stats.health - amount);
    this.game.ui.updateStats(this.game.stats);
    if (this.game.stats.health <= 0) {
      this.playerDeath();
    }
  }

  playerDeath() {
    const event = new CustomEvent("gameStateChange", {
      detail: { state: "gameOver" },
    });
    document.dispatchEvent(event);
  }

  checkGroundContact() {
    if (this.game.gameMode === "freeRunner") {
      const raycaster = new THREE.Raycaster();
      const rayStart = this.player.position.clone();
      const rayDirection = new THREE.Vector3(0, -1, 0);
      rayStart.y += 0.1;
      raycaster.set(rayStart, rayDirection);
      const intersects = raycaster.intersectObjects(
        this.game.scene.children,
        true
      );
      if (intersects.length > 0 && intersects[0].distance < 0.3) {
        if (!this.playerCollider.onGround && this.playerCollider.jumping) {
          this.game.audio.playSound("land");
        }
        this.playerCollider.onGround = true;
        this.playerCollider.jumping = false;
        this.playerCollider.falling = false;
        this.playerCollider.velocity.y = 0;
      } else {
        this.playerCollider.onGround = false;
        if (
          this.playerCollider.velocity.y < -0.1 &&
          !this.playerCollider.jumping
        ) {
          this.playerCollider.falling = true;
        }
      }
    } else if (this.game.gameMode === "roachRunner") {
      if (this.player.position.y <= 0) {
        if (!this.playerCollider.onGround && this.playerCollider.jumping) {
          this.game.audio.playSound("land");
        }
        this.player.position.y = 0;
        this.playerCollider.onGround = true;
        this.playerCollider.jumping = false;
        this.playerCollider.falling = false;
        this.playerCollider.velocity.y = 0;
      } else {
        this.playerCollider.onGround = false;
        if (
          this.playerCollider.velocity.y < -0.1 &&
          !this.playerCollider.jumping
        ) {
          this.playerCollider.falling = true;
        }
      }
    }
  }

  checkOutOfBounds() {
    if (this.player.position.y < -10) {
      if (this.game.gameMode === "freeRunner") {
        this.applyDamage(20);
        if (this.eggCheckpoints.length > 0) {
          const lastCheckpoint =
            this.eggCheckpoints[this.eggCheckpoints.length - 1];
          this.player.position.copy(lastCheckpoint.position);
        } else {
          this.player.position.set(0, 0, 0);
        }
        this.playerCollider.velocity.set(0, 0, 0);
      } else if (this.game.gameMode === "roachRunner") {
        this.playerDeath();
      }
    }
  }

  activateSlowMotion(duration) {
    this.slowMotionActive = true;
    this.game.clock.timeScale = 0.5;
    this.game.ui.showSlowMotionEffect(true);
    setTimeout(() => {
      this.deactivateSlowMotion();
    }, duration * 1000);
  }

  deactivateSlowMotion() {
    this.slowMotionActive = false;
    this.game.clock.timeScale = 1.0;
    this.game.ui.showSlowMotionEffect(false);
  }

  activateInvincibility(duration) {
    this.invincibilityActive = true;
    if (this.player.material) {
      this.player.material.emissive = new THREE.Color(0xffff00);
      this.player.material.emissiveIntensity = 0.5;
    } else {
      this.player.traverse((obj) => {
        if (obj.material) {
          obj.material.emissive = new THREE.Color(0xffff00);
          obj.material.emissiveIntensity = 0.5;
        }
      });
    }
    this.game.ui.showInvincibilityEffect(true);
    setTimeout(() => {
      this.deactivateInvincibility();
    }, duration * 1000);
  }

  deactivateInvincibility() {
    this.invincibilityActive = false;
    if (this.player.material) {
      this.player.material.emissive = new THREE.Color(0x000000);
      this.player.material.emissiveIntensity = 0;
    } else {
      this.player.traverse((obj) => {
        if (obj.material) {
          obj.material.emissive = new THREE.Color(0x000000);
          obj.material.emissiveIntensity = 0;
        }
      });
    }
    this.game.ui.showInvincibilityEffect(false);
  }

  activateMagnet(duration) {
    this.magnetActive = true;
    this.game.ui.showMagnetEffect(true);
    setTimeout(() => {
      this.deactivateMagnet();
    }, duration * 1000);
  }

  deactivateMagnet() {
    this.magnetActive = false;
    this.game.ui.showMagnetEffect(false);
  }

  updateEnvironmentInteractions(dt) {
    if (this.game.gameMode !== "freeRunner") return;
    switch (this.currentLevel) {
      case "kitchen":
        this.updateKitchenInteractions(dt);
        break;
      case "bathroom":
        this.updateBathroomInteractions(dt);
        break;
      case "street":
        this.updateStreetInteractions(dt);
        break;
      case "sewer":
        this.updateSewerInteractions(dt);
        break;
    }
  }

  updateKitchenInteractions(dt) {
    // Placeholder for kitchen-specific logic
  }

  updateBathroomInteractions(dt) {
    // Placeholder for bathroom-specific logic
  }

  updateStreetInteractions(dt) {
    // Placeholder for street-specific logic
  }

  updateSewerInteractions(dt) {
    // Placeholder for sewer-specific logic
  }

  updateLevelGeneration(dt) {
    if (this.game.gameMode !== "roachRunner" || !this.trackGroup) return;
    for (let i = this.activeSegments.length - 1; i >= 0; i--) {
      const segment = this.activeSegments[i];
      if (segment.zPosition + this.trackGroup.position.z > 50) {
        this.trackGroup.remove(segment.group);
        this.activeSegments.splice(i, 1);
        this.trackSegments.push(segment.group);
      }
    }
    const lastSegmentZ =
      this.activeSegments.length > 0
        ? this.activeSegments[this.activeSegments.length - 1].zPosition
        : 0;
    if (lastSegmentZ < 250) {
      this.generateTrackSegment(lastSegmentZ + this.segmentLength);
    }
  }

  updateObstacles(dt) {
    if (this.game.gameMode !== "roachRunner") return;
    // Obstacles move with the track segments
  }

  checkCollectibleCollisions() {
    const collected = [];
    return collected;
  }

  updateObjectives(dt) {
    if (this.game.gameMode !== "freeRunner") return;
    switch (this.currentLevel) {
      case "kitchen":
        this.updateKitchenObjectives(dt);
        break;
      case "bathroom":
        this.updateBathroomObjectives(dt);
        break;
      case "street":
        this.updateStreetObjectives(dt);
        break;
      case "sewer":
        this.updateSewerObjectives(dt);
        break;
    }

    updateHitboxVisibility(show) {
        this.game.scene.children.forEach(child => {
            if (child.isHitboxHelper) {
                this.game.scene.remove(child);
            }
        });
        if (show) {
            for (const collider of this.colliders) {
                const helper = new THREE.Box3Helper(collider.boundingBox, new THREE.Color(0xff0000));
                helper.isHitboxHelper = true;
                this.game.scene.add(helper);
            }
        }
    }

    teleportPlayer(x, y, z) {
        if (this.player) {
            this.player.position.set(x, y, z);
            this.playerCollider.velocity.set(0, 0, 0);
            this.updatePlayerBoundingBox();
        }
    }

    getPlayerPosition() {
        if (this.player) {
            return {
                x: this.player.position.x,
                y: this.player.position.y,
                z: this.player.position.z
            };
        }
        return { x: 0, y: 0, z: 0 };
    }

    getPlayerVelocity() {
        if (this.playerCollider) {
            return {
                x: this.playerCollider.velocity.x,
                y: this.playerCollider.velocity.y,
                z: this.playerCollider.velocity.z
            };
        }
        return { x: 0, y: 0, z: 0 };
    }

    getPlayerSpeed() {
        return this.playerSpeed;
    }

    setPlayerSpeed(speed) {
        this.playerSpeed = speed;
    }

    getGameTime() {
        return this.gameTime;
    }

    isPlayerOffTrack() {
        if (this.game.gameMode !== 'roachRunner') return false;
        if (this.player.position.y < -5) {
            return true;
        }
        const trackHalfWidth = this.trackWidth / 2;
        return Math.abs(this.player.position.x) > trackHalfWidth + 2;
    }

    updateEntities(dt) {
        this.gameTime += dt;
        this.eggCheckpoints.forEach(checkpoint => {
            const egg = checkpoint.object;
            if (egg) {
                const bounceHeight = 0.1;
                const bounceSpeed = 2;
                egg.position.y = checkpoint.position.y + Math.sin(this.gameTime * bounceSpeed) * bounceHeight;
                egg.rotation.y += dt * 0.5;
            }
        });
    }
}
  }

  updateKitchenObjectives(dt) {
    const exploreObjective = this.objectives.find(
      (obj) => obj.id === "explore_kitchen"
    );
    if (exploreObjective && !exploreObjective.completed) {
      exploreObjective.progress += this.playerSpeed * dt * 0.5;
      if (exploreObjective.progress >= exploreObjective.target) {
        exploreObjective.progress = exploreObjective.target;
        exploreObjective.completed = true;
      }
    }
    const foodObjective = this.objectives.find((obj) => obj.id === "find_food");
    if (foodObjective && !foodObjective.completed) {
      const foodLocation = new THREE.Vector3(8, 0, -5);
      const distanceToFood = this.player.position.distanceTo(foodLocation);
      if (distanceToFood < 2) {
        foodObjective.progress = foodObjective.target;
        foodObjective.completed = true;
      }
    }
  }

  updateBathroomObjectives(dt) {
    const climbObjective = this.objectives.find(
      (obj) => obj.id === "climb_sink"
    );
    if (climbObjective && !climbObjective.completed) {
      const sinkTopY = 5;
      if (this.player.position.y >= sinkTopY) {
        climbObjective.progress = climbObjective.target;
        climbObjective.completed = true;
      }
    }
    const avoidWaterObjective = this.objectives.find(
      (obj) => obj.id === "avoid_water"
    );
    if (avoidWaterObjective && !avoidWaterObjective.completed) {
      avoidWaterObjective.progress += dt;
      if (avoidWaterObjective.progress >= avoidWaterObjective.target) {
        avoidWaterObjective.progress = avoidWaterObjective.target;
        avoidWaterObjective.completed = true;
      }
    }
  }

  updateStreetObjectives(dt) {
    const crossRoadObjective = this.objectives.find(
      (obj) => obj.id === "cross_road"
    );
    if (crossRoadObjective && !crossRoadObjective.completed) {
      const otherSideZ = -20;
      if (this.player.position.z <= otherSideZ) {
        crossRoadObjective.progress = crossRoadObjective.target;
        crossRoadObjective.completed = true;
      }
    }
    const shelterObjective = this.objectives.find(
      (obj) => obj.id === "find_shelter"
    );
    if (shelterObjective && !shelterObjective.completed) {
      const shelterLocation = new THREE.Vector3(-15, 0, -25);
      const distanceToShelter =
        this.player.position.distanceTo(shelterLocation);
      if (distanceToShelter < 3) {
        shelterObjective.progress = shelterObjective.target;
        shelterObjective.completed = true;
      }
    }
  }

  updateSewerObjectives(dt) {
    const navigateObjective = this.objectives.find(
      (obj) => obj.id === "navigate_dark"
    );
    if (navigateObjective && !navigateObjective.completed) {
      const targetLocation = new THREE.Vector3(0, 0, -30);
      const distanceToTarget = this.player.position.distanceTo(targetLocation);
      if (distanceToTarget < 5) {
        navigateObjective.progress = navigateObjective.target;
        navigateObjective.completed = true;
      }
    }
    const avoidCurrentObjective = this.objectives.find(
      (obj) => obj.id === "avoid_water_current"
    );
    if (avoidCurrentObjective && !avoidCurrentObjective.completed) {
      avoidCurrentObjective.progress += dt;
      if (avoidCurrentObjective.progress >= avoidCurrentObjective.target) {
        avoidCurrentObjective.progress = avoidCurrentObjective.target;
        avoidCurrentObjective.completed = true;
      }
    }
  }

  getCompletedObjectives() {
    const completed = [];
    for (const objective of this.objectives) {
      if (objective.completed && !objective.processed) {
        completed.push(objective);
        objective.processed = true;
      }
    }
    return completed;
  }

  isInValidEggLocation() {
    if (this.game.gameMode !== "freeRunner") return false;
    if (!this.playerCollider.onGround) return false;
    for (const egg of this.eggCheckpoints) {
      const distance = this.player.position.distanceTo(egg.position);
      if (distance < 5) {
        return false;
      }
    }
    return true;
  }

  isEggCooldownActive() {
    return this.eggCooldown > 0;
  }

  createEggCheckpoint() {
    if (this.game.gameMode !== "freeRunner") return;
    const eggGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const eggMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x88ff88,
      emissiveIntensity: 0.5,
    });
    const egg = new THREE.Mesh(eggGeometry, eggMaterial);
    egg.position.copy(this.player.position);
    egg.position.y += 0.2;
    egg.castShadow = true;
    egg.receiveShadow = true;
    this.game.scene.add(egg);
    const checkpoint = {
      object: egg,
      position: egg.position.clone(),
      timestamp: Date.now(),
    };
    this.eggCheckpoints.push(checkpoint);
    console.log(
      `Egg checkpoint created at (${egg.position.x.toFixed(
        2
      )}, ${egg.position.y.toFixed(2)}, ${egg.position.z.toFixed(2)})`
    );
  }

  startEggCooldown() {
    this.eggCooldown = this.levelConfig.eggRespawnTime;
  }

  loadLevel(levelId) {
    if (this.game.gameMode !== "freeRunner") return;
    if (
      !this.game.config.gameModes.freeRunner.availableLevels.includes(levelId)
    ) {
      console.error(`Level not available: ${levelId}`);
      return;
    }
    this.currentLevel = levelId;
    this.clearScene();
    this.levelConfig = this.getLevelConfig(levelId);
    this.createEnvironment();
    this.createPlayer();
    this.createLighting();
    this.setupCamera();
    this.createObjectives();
    this.gameTime = 0;
    console.log(`Level loaded: ${levelId}`);
  }

  updateHitboxVisibility(show) {
    this.game.scene.children.forEach((child) => {
      if (child.isHitboxHelper) {
        this.game.scene.remove(child);
      }
    });
  }
}
