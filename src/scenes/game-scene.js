(function () {const CT = window.CrashTest = window.CrashTest || {};

class GameScene extends Phaser.Scene {constructor() {super("GameScene");this.wallet = null;this.hud = null;this.state = "ready";this.round = 0;this.multiplier = 0;this.speed = 0;this.turbo = false;this.turboPower = 0;this.engineBreakAt = 0;this.roadOffset = 0;this.fenceOffset = 0;this.testBgOffset = 0;this.testBgPropOffset = 0;this.testBgProps = null;this.testBgPropTileIndex = null;this.testBgPropSignature = "";this.visualSpeed = 0;this.flightRoadSpeed = 0;this.pendingPayout = 0;this.autoCrash = false;this.safeMode = false;this.jumpBoosterEnabled = false;this.bonusGameActive = false;this.bonusGameStarting = false;this.bonusGameIntroElapsed = 0;this.bonusGameIntroComplete = false;this.bonusGamePostIntroElapsed = 0;this.bonusGameCrashQueued = false;this.bonusGameBounceDisplay = 0;this.bonusGamePayoutBet = 0;this.bonusGameOverlay = null;this.bonusGamePopup = null;this.autospinActive = false;this.autospinLaunching = false;this.autospinRoundActive = false;this.autospinSettings = { crashX: 0, crashJumps: 0 };this.autospinOverlay = null;this.autospinPopup = null;this.autospinControls = null;this.autospinNextRunTimer = null;this.bonusAdd = 0;this.bonusItems = [];this.bonusPauseToken = 0;this.lastMultiplierDisplay = -1;this.lastMultiplierPulseAt = 0;this.rareBounceCount = 0;this.nextRareBounceAt = 0;this.remainingBounces = null;this.extraBounceAdder = null;this.extraBounceBonusCount = 0;this.sfx = {};this.engineAudioToken = 0;this.engineLoopTimer = null;this.engineLoopIndex = 0;this.roadTiles = [];this.testBgTiles = [];this.fenceTiles = [];this.loopObjectLayers = [];this.crashDebrisActive = false;this.fencePoleItems = [];this.fencePoleLayer = null;this.fenceOverlayItems = [];this.fenceOverlayLayer = null;this.fenceOverlayKeys = [];this.sceneTuningConfig = null;this.sceneControlRoot = null;this.sceneControlJson = null;this.refOverlay = null;this.roadArtX = 0;this.roadArtY = 0;this.roadArtScale = 1;this.fenceArtX = 0;this.fenceArtY = 0;this.fenceArtScale = 1;this.fencePoleX = 0;this.fencePoleY = 0;this.fencePoleSpacing = 247;this.fencePoleScale = 0.5;this.fenceLightOffsetY = -29;this.fenceLightScale = 0.4;this.fenceLightIntensity = 0.79;this.fenceLightDelay = 0.085;this.fenceOverlayX = 0;this.fenceOverlayY = 760;this.fenceOverlayHeight = 0;this.fenceOverlaySpacing = 420;this.fenceOverlayJitterX = 110;this.fenceOverlayCount = 24;this.fenceOverlayChance = 0.36;this.fenceOverlayScaleMin = 0.42;this.fenceOverlayScaleMax = 0.62;this.fenceOverlayAlpha = 0.96;this.hitWallX = 570;this.hitWallY = 888;this.hitWallVisualOffsetX = 0;this.hitWallScale = 0.34;this.hitWallAlpha = 1;this.hitWallImage = null;this.hitWallPreview = false;this.carControlConfig = null;this.turboFireTintStops = null;this.nextCarLightSweepAt = 0;this.nextFenceLightUpdateAt = 0;this.Matter = null;this.mobilePerfMode = null;this.ragdollMatterReady = false;this.ragdollGround = null;this.ragdollCollisionLayers = null;this.flightRagdoll = null;this.dummyFlightHistoryCount = 0;this.oldDummyTrailLayer = null;this.oldDummyTrailParts = [];this.oldDummyTrailTextureKeys = null;this.oldDummyTrailReturnMode = false;this.dummyFlightShadow = null;}

create() {
  this.wallet = new CT.Wallet();
  this.cameras.main.setBounds(-1800, 0, CT.Config.gameplay.worldWidth + 1800, CT.Config.height);
  this.cameras.main.setScroll(0, 0);
  this.createSceneTuningConfig();
  this.setupRagdollMatterWorld();
  this.createBackground();
  this.createPlayfield();
  this.hud = new CT.Hud(this, this.wallet, {
    onLeverPress: () => this.handleLeverPress(),
    onLeverPower: (power) => this.setTurboPower(power),
    onLeverRelease: () => this.handleLeverRelease(),
    onSafeToggle: () => this.toggleSafeMode(),
    onMultiplierDisplay: (value) => this.setMultiplierDisplay(value),
    onJumpBoosterToggle: () => this.toggleJumpBooster(),
    onBuyBonusPress: () => this.showBonusGamePopup(),
    onAutospinPress: () => this.handleAutospinButtonPress(),
    getBonusGameCost: () => this.getBonusGameCost(),
    getBuyBonusButtonConfig: () => this.sceneTuningConfig && this.sceneTuningConfig.bonusBuyButton,
    getAutospinButtonConfig: () => this.sceneTuningConfig && this.sceneTuningConfig.autospinIcon
  });
  this.createAudio();
  this.resetRunVisuals();
  this.hideBootLoader();
}

createAudio() {
  const addSound = (key, config) => {
    if (!this.cache.audio.exists(key)) return null;
    return this.sound.add(key, config || {});
  };
  this.sound.mute = localStorage.getItem(CT.Config.storage.muted) === "1";

  this.sfx = {
    mainTrack: addSound("mainTrack", { loop: true, volume: 0.28 }),
    bonusUp: addSound("bonusUp", { volume: 0.66 }),
    carCrash: addSound("carCrash", { volume: 0.78 }),
    carEngineFail: addSound("carEngineFail", { volume: 0.78 }),
    carEngineStart: addSound("carEngineStart", { volume: 0.68 }),
    carEngineLoopA: addSound("carEngineLoop", { loop: false, volume: 0.48 }),
    carEngineLoopB: addSound("carEngineLoop", { loop: false, volume: 0.48 })
  };

  this.ensureBackgroundMusic();
  this.input.once("pointerdown", () => this.ensureBackgroundMusic());
  if (this.sound.locked) {
    this.sound.once("unlocked", () => this.ensureBackgroundMusic());
  }
}

ensureBackgroundMusic() {
  const track = this.sfx && this.sfx.mainTrack;
  if (!track || track.isPlaying || this.sound.locked) return;
  track.play();
}

playOneShot(key) {
  const volumes = {
    bonusUp: 0.66,
    carCrash: 0.78,
    carEngineFail: 0.78
  };
  if (this.cache.audio.exists(key)) {
    this.sound.play(key, { volume: volumes[key] || 0.7 });
  }
}

playEngineStart() {
  this.stopEngineAudio();
  const token = ++this.engineAudioToken;
  if (this.sound.locked) {
    this.sound.once("unlocked", () => {
      if (token === this.engineAudioToken && this.state === "running") this.playEngineStart();
    });
    return;
  }

  const start = this.sfx && this.sfx.carEngineStart;
  if (!start) {
    this.startEngineLoop(token);
    return;
  }

  start.play();
  start.once("complete", () => this.startEngineLoop(token));
}

startEngineLoop(token) {
  if (token !== this.engineAudioToken || this.state !== "running") return;
  this.engineLoopIndex = 0;
  this.playEngineLoopLayer(token);
}

playEngineLoopLayer(token) {
  if (token !== this.engineAudioToken || this.state !== "running") return;
  const loops = [this.sfx.carEngineLoopA, this.sfx.carEngineLoopB].filter(Boolean);
  if (!loops.length) return;

  const loop = loops[this.engineLoopIndex % loops.length];
  this.engineLoopIndex += 1;
  loop.stop();
  loop.play();

  const duration = loop.totalDuration || loop.duration || 1.1;
  const overlap = Phaser.Math.Clamp(duration * 0.16, 0.08, 0.18);
  const nextDelay = Math.max(120, Math.round((duration - overlap) * 1000));
  if (this.engineLoopTimer) this.engineLoopTimer.remove(false);
  this.engineLoopTimer = this.time.delayedCall(nextDelay, () => this.playEngineLoopLayer(token));
}

stopEngineAudio() {
  this.engineAudioToken += 1;
  if (this.engineLoopTimer) {
    this.engineLoopTimer.remove(false);
    this.engineLoopTimer = null;
  }
  if (this.sfx && this.sfx.carEngineStart) this.sfx.carEngineStart.stop();
  if (this.sfx && this.sfx.carEngineLoopA) this.sfx.carEngineLoopA.stop();
  if (this.sfx && this.sfx.carEngineLoopB) this.sfx.carEngineLoopB.stop();
}

getWorldOffsetY() {
  const cfg = this.sceneTuningConfig && this.sceneTuningConfig.world ? this.sceneTuningConfig.world : {};
  const y = Number(cfg.y);
  return Number.isFinite(y) ? y : 0;
}

offsetGameplayY(y) {
  return (Number(y) || 0) + this.getWorldOffsetY();
}

getGameplayRoadY() {
  return this.offsetGameplayY(CT.Config.gameplay.roadY);
}

getGameplayGroundY() {
  return this.getGameplayRoadY() + 8;
}

createBackground() {
  const cfg = CT.Config;
  this.cameras.main.setBackgroundColor(cfg.colors.bg);
  this.backgroundGraphics = this.add.graphics().setDepth(-20);
  this.backgroundGraphics.setScrollFactor(0);
  this.redrawBackground();
}

redrawBackground() {
  const cfg = CT.Config;
  const W = cfg.width;
  const H = cfg.height;
  const g = this.backgroundGraphics;
  if (!g) return;
  g.clear();
  g.fillStyle(0x071012, 1).fillRect(0, 0, W, H);
  g.fillStyle(0x132126, 1).fillRect(0, 170, W, H - 406);
  g.fillStyle(0x1f2426, 1).fillRect(0, H - 326, W, 148);
  g.fillStyle(0x0b171a, 1).fillRect(0, H - 178, W, 178);
  g.fillStyle(0x293237, 1).fillRect(0, this.getGameplayRoadY() - 36, W, 118);
  g.lineStyle(2, 0x37e5ff, 0.16);
  for (let y = 246; y < H - 410; y += 86) {
    g.lineBetween(52, y, W - 52, y);
  }
}

createPlayfield() {
  const cfg = CT.Config;
  const W = cfg.width;
  const H = cfg.height;
  if (!this.sceneTuningConfig) this.createSceneTuningConfig();
  this.createCarControlConfig();
  this.createRoadLoop();

  this.barrier = this.add.container(this.hitWallX, this.offsetGameplayY(this.hitWallY)).setDepth(6).setVisible(false);
  this.hitWallImage = this.add.image(0, 0, "hitWall")
      .setOrigin(0.5, 1)
      .setScale(this.hitWallScale);
  this.barrier.add(this.hitWallImage);
  this.updateHitWallLayout();

  this.smokeLayer = this.add.container(0, 0).setDepth(8);
  this.oldDummyTrailLayer = this.add.container(0, 0).setDepth(4.25).setScrollFactor(0);
  this.dummyFlightShadow = this.createDummyFlightShadow();
  this.car = this.createCar();
  this.dummy = this.createDummy();
  this.car.add(this.dummy);
  this.dummy.setVisible(false);
  this.multiplierPanel = this.add.container(W / 2, cfg.gameplay.roadY - 345).setDepth(9);
  this.multiplierPanel.setScrollFactor(0);
  this.multiplierGlow = null;
  this.multiplierPanelBg = this.add.rectangle(0, 0, 438, 188, 0x071012, 0.84)
    .setStrokeStyle(7, 0xffcf30, 0.9);
  this.multiplierPanelInner = this.add.rectangle(0, 0, 396, 146, 0x1b2327, 0.58);
  this.multiplierPanelLabel = this.add.text(0, -72, "", {
    fontFamily: cfg.fontFamily || "Arial",
    fontSize: "30px",
    color: "#EEFE0D",
    letterSpacing: cfg.fontLetterSpacing || 0,
    resolution: cfg.fontResolution || 1
  }).setOrigin(0.5).setAlpha(0);
  this.finalWinText = this.add.text(0, -24, "$0.00", {
    fontFamily: cfg.fontFamily || "Arial",
    fontSize: "150px",
    color: "#29FF50",
    letterSpacing: cfg.fontLetterSpacing || 0,
    resolution: cfg.fontResolution || 1
  }).setOrigin(0.5).setAlpha(0).setVisible(false);
  this.multiplierText = this.add.text(0, 0, "0x", {
    fontFamily: cfg.fontFamily || "Arial",
    fontSize: "171px",
    color: "#F6FFC3",
    letterSpacing: cfg.fontLetterSpacing || 0,
    resolution: cfg.fontResolution || 1
  }).setOrigin(0.5);
  this.multiplierPanel.add([this.multiplierPanelBg, this.multiplierPanelInner, this.multiplierPanelLabel, this.finalWinText, this.multiplierText]);
  this.createBounceBadge();
  this.createRefOverlay();
  this.applySceneTuningConfig(false);
  this.createSceneControlUI();
  this.applyMultiplierTheme("idle", true);
}

createRoadLoop() {
  const cfg = CT.Config;
  this.applyRoadArtDefaults();
  this.roadTiles = [];
  this.testBgTiles = [];
  this.fenceTiles = [];
  this.loopObjectLayers = [];
  this.fencePoleItems = [];
  this.fencePoleLayer = null;
  this.fenceOverlayItems = [];
  this.fenceOverlayLayer = null;
  this.createTestBackgroundLoop();

  for (let i = 0; i < 8; i++) {
    const fence = this.add.image(0, this.fenceArtY, "roadFence")
      .setOrigin(0, 1)
      .setDepth(0)
      .setScrollFactor(0);
    this.fenceTiles.push(fence);
  }
  this.createFenceOverlayLoop();
  this.createFencePoleLoop();
  const keys = ["roadLoop1", "roadLoop2", "roadLoop3"];
  for (let i = 0; i < 10; i++) {
    const tile = this.add.image(0, this.roadArtY, keys[i % keys.length])
      .setOrigin(0, 0.5)
      .setDepth(1)
      .setScrollFactor(0);
    this.roadTiles.push(tile);
  }
  this.updateRoadTilesLayout();
}

createTestBackgroundLoop() {
  this.testBgTiles = [];
  this.testBgProps = null;
  this.testBgPropOffset = 0;
  this.testBgPropTileIndex = null;
  this.testBgPropSignature = "";
  if (!this.textures.exists("backTestBg")) return;
  for (let i = 0; i < 5; i++) {
    const bg = this.add.image(0, 0, "backTestBg")
      .setOrigin(0, 0);
    const bgItem = this.add.container(0, 0, [bg])
      .setDepth(-12)
      .setScrollFactor(0);
    this.testBgTiles.push({ bgItem, bg });
  }
  const fire = this.add.sprite(0, 0, "barrelFire1")
    .setOrigin(0.5, 1)
    .setBlendMode(Phaser.BlendModes.ADD);
  if (fire.anims) {
    fire.play("barrelFireLoop");
    fire.anims.timeScale = 0.67;
  }
  const barrel = this.add.image(0, 0, "barrel")
    .setOrigin(0.5, 1);
  const propChildren = [fire, barrel];
  const girl = this.textures.exists("girl")
    ? this.add.image(0, 0, "girl").setOrigin(0.5, 1)
    : null;
  if (girl) propChildren.push(girl);
  const propItem = this.add.container(0, 0, propChildren)
    .setDepth(-10)
    .setScrollFactor(0);
  this.testBgProps = { propItem, fire, barrel, girl };
  this.updateTestBackgroundLayout();
}

getTestBackgroundTileWidth() {
  const texture = this.textures.get("backTestBg");
  const source = texture && texture.getSourceImage ? texture.getSourceImage() : null;
  const cfg = this.sceneTuningConfig && this.sceneTuningConfig.background ? this.sceneTuningConfig.background : {};
  const width = source && source.width ? source.width : CT.Config.width;
  return Math.max(1, width * (Number(cfg.scale) || 1));
}

updateTestBackgroundLayout() {
  if (!this.testBgTiles || !this.testBgTiles.length) return;
  const cfg = this.sceneTuningConfig || {};
  const bgCfg = cfg.background || {};
  const barrelCfg = cfg.barrel || {};
  const fireCfg = cfg.fire || {};
  const scale = Math.max(0.01, Number(bgCfg.scale) || 1);
  const tileWidth = this.getTestBackgroundTileWidth();
  const worldY = this.getWorldOffsetY();
  this.testBgOffset = Phaser.Math.Wrap(this.testBgOffset, 0, tileWidth);

  this.testBgTiles.forEach((item, i) => {
    const tileX = (Number(bgCfg.x) || 0) + i * tileWidth - tileWidth - this.testBgOffset;
    const tileY = (Number(bgCfg.y) || 0) + worldY;
    if (item.bgItem) item.bgItem.setPosition(tileX, tileY);
    if (item.bg) item.bg.setScale(scale);
  });
  this.updateTestBackgroundPropsLayout(tileWidth, bgCfg, barrelCfg, fireCfg, worldY);
}

pickTestBackgroundPropTileIndex(tileWidth, bgX, barrelX) {
  const center = CT.Config.width * 0.5;
  let bestIndex = 0;
  let bestScore = Infinity;
  for (let i = 0; i < 5; i++) {
    const x = bgX + i * tileWidth - tileWidth + barrelX;
    const visibleBias = x > -260 && x < CT.Config.width + 260 ? 0 : 100000;
    const score = visibleBias + Math.abs(x - center);
    if (score < bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

updateTestBackgroundPropsLayout(tileWidth, bgCfg, barrelCfg, fireCfg, worldY) {
  const props = this.testBgProps;
  if (!props) return;
  const bgX = Number(bgCfg.x) || 0;
  const barrelX = Number(barrelCfg.x) || 0;
  const fireX = Number(fireCfg.x) || 0;
  const signature = [Math.round(tileWidth), bgX, barrelX, fireX].join(":");
  if (this.testBgPropSignature !== signature || !this.testBgPropTileIndex) {
    this.testBgPropTileIndex = {
      barrel: this.pickTestBackgroundPropTileIndex(tileWidth, bgX, barrelX),
      fire: this.pickTestBackgroundPropTileIndex(tileWidth, bgX, fireX)
    };
    this.testBgPropSignature = signature;
  }
  const barrelTileX = bgX + this.testBgPropTileIndex.barrel * tileWidth - tileWidth - (this.testBgPropOffset || 0);
  const tileY = (Number(bgCfg.y) || 0) + worldY;
  if (props.propItem) props.propItem.setPosition(barrelTileX, tileY);
  if (props.fire) {
    const fireLocalX = (this.testBgPropTileIndex.fire - this.testBgPropTileIndex.barrel) * tileWidth + fireX;
    props.fire
      .setPosition(fireLocalX, Number(fireCfg.y) || 0)
      .setScale(Math.max(0.01, Number(fireCfg.scale) || 1));
  }
  const barrelScale = Math.max(0.01, Number(barrelCfg.scale) || 1);
  const barrelY = Number(barrelCfg.y) || 0;
  if (props.barrel) {
    props.barrel
      .setPosition(barrelX, barrelY)
      .setScale(barrelScale);
  }
  if (props.girl) {
    props.girl
      .setPosition(barrelX + 110, barrelY)
      .setScale(barrelScale);
  }
}

setTestBackgroundPropsVisible(visible) {
  if (!this.testBgProps) return;
  if (this.testBgProps.propItem) this.testBgProps.propItem.setVisible(visible);
}

resetTestBackgroundProps() {
  this.testBgPropOffset = 0;
  this.updateTestBackgroundLayout();
  this.setTestBackgroundPropsVisible(true);
}

prepareTestBackgroundPropsForReturn(targetScrollX) {
  const currentScrollX = Number(this.cameras.main.scrollX) || 0;
  const returnDistance = Math.max(0, currentScrollX - targetScrollX);
  this.testBgPropOffset = returnDistance;
  this.updateTestBackgroundLayout();
  this.setTestBackgroundPropsVisible(true);
}

advanceTestBackground(dx) {
  if (!this.testBgTiles || !this.testBgTiles.length) return;
  this.testBgOffset += dx;
  this.testBgPropOffset += dx;
  this.updateTestBackgroundLayout();
}

createFenceOverlayLoop() {
  this.fenceOverlayItems = [];
  this.fenceOverlayKeys = ["roadBgOverlay1", "roadBgOverlay2", "roadBgOverlay3", "roadBgOverlay4", "roadBgOverlay5"]
    .filter((key) => this.textures.exists(key));
  if (!this.fenceOverlayKeys.length) return;

  this.fenceOverlayLayer = this.createLoopObjectLayer({
    id: "fenceOverlays",
    count: 48,
    depth: 1.6,
    getLayout: () => ({
      x: this.getFenceAttachedX(this.fenceOverlayX),
      y: this.getFenceAttachedY(this.fenceOverlayY),
      spacing: this.fenceOverlaySpacing * this.getFenceScaleRatio()
    }),
    createItem: () => {
      const image = this.add.image(0, 0, this.fenceOverlayKeys[0])
        .setOrigin(0.5, 1);
      const item = this.add.container(0, this.fenceOverlayY, [image]);

      item.image = image;
      item.overlayKey = this.fenceOverlayKeys[0];
      return item;
    },
    onLayout: (item) => this.layoutFenceOverlayItem(item)
  });
  this.fenceOverlayItems = this.fenceOverlayLayer.items;
}

createFencePoleLoop() {
  this.fencePoleItems = [];
  if (!this.textures.exists("fencePole") || !this.textures.exists("fenceLight")) return;

  this.fencePoleLayer = this.createLoopObjectLayer({
    id: "fencePoles",
    count: 64,
    depth: 2,
    getLayout: () => ({
      x: this.fencePoleX,
      y: this.fencePoleY,
      spacing: this.fencePoleSpacing
    }),
    createItem: (i) => {
      const pole = this.add.image(0, 0, "fencePole")
        .setOrigin(0.5, 1);
      const light = this.add.image(0, this.fenceLightOffsetY, "fenceLight")
        .setOrigin(0.5)
        .setBlendMode(Phaser.BlendModes.ADD);
      const item = this.add.container(0, this.fencePoleY, [pole, light]);

      item.pole = pole;
      item.light = light;
      item.lightPhase = i * 0.47;
      return item;
    },
    onLayout: (item) => {
      item.setVisible(true);
      const poleRatio = this.getPoleScaleRatio();
      item.pole.setScale(this.fencePoleScale);
      item.light.setPosition(0, this.fenceLightOffsetY * poleRatio);
      item.light.baseScale = this.fenceLightScale * poleRatio;
    }
  });
  this.fencePoleItems = this.fencePoleLayer.items;
}

getFenceScaleRatio() {
  const baseScale = Math.max(0.01, Number(CT.Config.gameplay.fenceArtScale) || 1);
  return Math.max(0.01, Number(this.fenceArtScale) || baseScale) / baseScale;
}

getPoleScaleRatio() {
  const baseScale = Math.max(0.01, Number(CT.Config.gameplay.fencePoleScale) || 1);
  return Math.max(0.01, Number(this.fencePoleScale) || baseScale) / baseScale;
}

getFenceAttachedX(localX) {
  return this.fenceArtX + (Number(localX) || 0) * this.getFenceScaleRatio();
}

getFenceAttachedY(localY) {
  const baseY = Number(CT.Config.gameplay.fenceArtY) || 0;
  return this.fenceArtY + ((Number(localY) || 0) - baseY) * this.getFenceScaleRatio();
}

layoutFenceOverlayItem(item) {
  const activeCount = Math.round(Phaser.Math.Clamp(this.fenceOverlayCount, 0, 48));
  const fenceRatio = this.getFenceScaleRatio();
  item.loopXJitter = 0;
  item.loopYOffset = 0;
  if (item.loopIndex >= activeCount) {
    item.setVisible(false);
    return;
  }

  const logicalIndex = item.logicalIndex || 0;
  const chanceRoll = this.seededUnit(logicalIndex, 11);
  if (chanceRoll > this.fenceOverlayChance) {
    item.setVisible(false);
    return;
  }

  const keyIndex = Math.floor(this.seededUnit(logicalIndex, 23) * this.fenceOverlayKeys.length) % this.fenceOverlayKeys.length;
  const key = this.fenceOverlayKeys[keyIndex];
  if (item.overlayKey !== key) {
    item.overlayKey = key;
    item.image.setTexture(key);
  }

  const yOffset = this.seededUnit(logicalIndex, 37) * this.fenceOverlayHeight * fenceRatio;
  const xJitter = (this.seededUnit(logicalIndex, 41) * 2 - 1) * this.fenceOverlayJitterX * fenceRatio;
  const scaleLow = Math.min(this.fenceOverlayScaleMin, this.fenceOverlayScaleMax);
  const scaleHigh = Math.max(this.fenceOverlayScaleMin, this.fenceOverlayScaleMax);
  const scale = Phaser.Math.Linear(scaleLow, scaleHigh, this.seededUnit(logicalIndex, 53)) * fenceRatio;

  item.setVisible(true);
  item.loopXJitter = xJitter;
  item.loopYOffset = yOffset;
  item.image.setScale(scale);
  item.image.setAlpha(this.fenceOverlayAlpha);
}

seededUnit(index, salt) {
  const raw = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453123;
  return raw - Math.floor(raw);
}

createLoopObjectLayer(options) {
  const layer = {
    id: options.id,
    items: [],
    count: options.count || 16,
    depth: options.depth || 0,
    travel: 0,
    offset: 0,
    getLayout: options.getLayout,
    createItem: options.createItem,
    onLayout: options.onLayout,
    active: true,
    layoutDirty: true
  };

  for (let i = 0; i < layer.count; i++) {
    const item = layer.createItem(i);
    item.loopIndex = i;
    item.logicalIndex = i;
    item.setDepth(layer.depth);
    item.setScrollFactor(0);
    layer.items.push(item);
  }

  this.loopObjectLayers.push(layer);
  this.layoutLoopObjectLayer(layer);
  return layer;
}

layoutLoopObjectLayer(layer) {
  if (!layer || !layer.items.length) return;
  const layout = layer.getLayout ? layer.getLayout() : {};
  const spacing = Math.max(24, Number(layout.spacing) || 24);
  const baseX = Number(layout.x) || 0;
  const baseY = Number.isFinite(Number(layout.y)) ? Number(layout.y) : 0;
  const worldY = this.getWorldOffsetY();
  layer.offset = Phaser.Math.Wrap(layer.travel, 0, spacing);
  const baseIndex = Math.floor(layer.travel / spacing);

  layer.items.forEach((item, i) => {
    const nextLogicalIndex = baseIndex + i - 1;
    const changed = layer.layoutDirty || item.logicalIndex !== nextLogicalIndex || item.layoutDirty;
    item.logicalIndex = nextLogicalIndex;
    if (changed && layer.onLayout) {
      layer.onLayout(item, i, layer, layout);
      item.layoutDirty = false;
    }
    item.x = baseX + i * spacing - spacing - layer.offset + (Number(item.loopXJitter) || 0);
    item.y = baseY + worldY + (Number(item.loopYOffset) || 0);
  });
  layer.layoutDirty = false;
}

updateLoopObjectLayersLayout() {
  if (!this.loopObjectLayers || !this.loopObjectLayers.length) return;
  this.loopObjectLayers.forEach((layer) => this.layoutLoopObjectLayer(layer));
}

advanceLoopObjectLayers(dx) {
  if (!this.loopObjectLayers || !this.loopObjectLayers.length) return;
  this.loopObjectLayers.forEach((layer) => {
    if (layer.active) layer.travel += dx;
  });
}

applyRoadArtDefaults() {
  const gp = CT.Config.gameplay;
  this.roadArtX = Number(gp.roadArtX) || 0;
  this.roadArtY = gp.roadArtY;
  this.roadArtScale = gp.roadArtScale;
  this.fenceArtX = Number(gp.fenceArtX) || 0;
  this.fenceArtY = gp.fenceArtY;
  this.fenceArtScale = gp.fenceArtScale;
  this.fencePoleX = gp.fencePoleX;
  this.fencePoleY = gp.fencePoleY;
  this.fencePoleSpacing = gp.fencePoleSpacing;
  this.fencePoleScale = gp.fencePoleScale;
  this.fenceLightOffsetY = gp.fenceLightOffsetY;
  this.fenceLightScale = gp.fenceLightScale;
  this.fenceLightIntensity = gp.fenceLightIntensity;
  this.fenceLightDelay = gp.fenceLightDelay;
  this.fenceOverlayX = gp.fenceOverlayX;
  this.fenceOverlayY = gp.fenceOverlayY;
  this.fenceOverlayHeight = gp.fenceOverlayHeight;
  this.fenceOverlaySpacing = gp.fenceOverlaySpacing;
  this.fenceOverlayJitterX = gp.fenceOverlayJitterX;
  this.fenceOverlayCount = gp.fenceOverlayCount;
  this.fenceOverlayChance = gp.fenceOverlayChance;
  this.fenceOverlayScaleMin = gp.fenceOverlayScaleMin;
  this.fenceOverlayScaleMax = gp.fenceOverlayScaleMax;
  this.fenceOverlayAlpha = gp.fenceOverlayAlpha;
  this.hitWallX = gp.hitWallX;
  this.hitWallY = gp.hitWallY;
  this.hitWallVisualOffsetX = Number(gp.hitWallVisualOffsetX) || 0;
  this.hitWallScale = gp.hitWallScale;
  this.hitWallAlpha = gp.hitWallAlpha;
}

updateHitWallLayout() {
  if (!this.barrier) return;
  this.barrier.setPosition(this.hitWallX, this.offsetGameplayY(this.hitWallY)).setAlpha(this.hitWallAlpha);
  if (this.hitWallImage) this.hitWallImage.setPosition(this.hitWallVisualOffsetX, 0).setScale(this.hitWallScale);
  if (this.hitWallPreview && this.state === "ready") this.barrier.setVisible(true);
}

setHitWallPreview(enabled) {
  this.hitWallPreview = !!enabled;
  if (!this.barrier) return;
  if (this.hitWallPreview && this.state === "ready") {
    this.updateHitWallLayout();
    this.barrier.setVisible(true);
  } else if (this.state !== "crashing" && this.state !== "dummyFlight") {
    this.barrier.setVisible(false);
  }
}

getRoadTileWidth() {
  const tile = this.roadTiles && this.roadTiles[0];
  if (!tile) return 1;
  return Math.max(1, tile.width * this.roadArtScale);
}

getFenceTileWidth() {
  const tile = this.fenceTiles && this.fenceTiles[0];
  if (!tile) return 1;
  return Math.max(1, tile.width * this.fenceArtScale);
}

updateRoadTilesLayout() {
  if (!this.roadTiles || !this.roadTiles.length) return;
  const tileWidth = this.getRoadTileWidth();
  const patternWidth = tileWidth * 3;
  const worldY = this.getWorldOffsetY();
  this.roadOffset = Phaser.Math.Wrap(this.roadOffset, 0, patternWidth);
  this.roadTiles.forEach((tile, i) => {
    if (tile._appliedRoadScale !== this.roadArtScale) {
      tile.setScale(this.roadArtScale);
      tile._appliedRoadScale = this.roadArtScale;
    }
    tile.y = this.roadArtY + worldY;
    tile.x = this.roadArtX + i * tileWidth - tileWidth - this.roadOffset;
  });
  if (this.fenceTiles && this.fenceTiles.length) {
    const fenceWidth = this.getFenceTileWidth();
    this.fenceOffset = Phaser.Math.Wrap(this.fenceOffset, 0, fenceWidth);
    this.fenceTiles.forEach((tile, i) => {
      if (tile._appliedFenceScale !== this.fenceArtScale) {
        tile.setScale(this.fenceArtScale);
        tile._appliedFenceScale = this.fenceArtScale;
      }
      tile.y = this.fenceArtY + worldY;
      tile.x = this.fenceArtX + i * fenceWidth - fenceWidth - this.fenceOffset;
    });
  }
  this.updateLoopObjectLayersLayout();
}

updateFenceLights(time) {
  if (!this.fencePoleItems || !this.fencePoleItems.length) return;
  const intensity = Phaser.Math.Clamp(this.fenceLightIntensity, 0, 1.5);
  const peakAlpha = Phaser.Math.Clamp(0.22 + intensity * 0.78, 0.22, 1);
  const delayStep = this.fenceLightDelay || 0;
  this.fencePoleItems.forEach((item) => {
    if (!item || !item.visible) return;
    const logicalIndex = item.logicalIndex || 0;
    const cycle = Phaser.Math.Wrap(time * 0.00062 + logicalIndex * delayStep, 0, 1);
    const darkHold = 0.58;
    const active = cycle <= darkHold ? 0 : (cycle - darkHold) / (1 - darkHold);
    const pulse = active > 0 ? Math.pow(Math.sin(active * Math.PI), 1.45) : 0;
    const alpha = pulse <= 0 ? 0 : peakAlpha * pulse;
    const pulseScale = 1 + pulse * intensity * 0.13;
    item.light.setAlpha(alpha);
    item.light.setScale((item.light.baseScale || this.fenceLightScale) * pulseScale);
  });
}

createRefOverlay() {
  if (!this.textures.exists("mainScreenRefOverlay")) return;
  const texture = this.textures.get("mainScreenRefOverlay");
  const source = texture && texture.getSourceImage ? texture.getSourceImage() : null;
  const scale = source && source.width ? CT.Config.width / source.width : 1;
  this.refOverlay = this.add.image(0, 0, "mainScreenRefOverlay")
    .setOrigin(0, 0)
    .setDepth(100)
    .setScrollFactor(0)
    .setScale(scale)
    .setAlpha(0)
    .setVisible(false);
}

createSceneTuningConfig() {
  const defaults = JSON.parse(JSON.stringify(CT.Config.gameplay.sceneTest || {}));
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem("crashLineSceneTuningV4") || "null");
  } catch (e) {
    saved = null;
  }
  this.sceneTuningConfig = this.mergeSceneTuningConfig(defaults, saved);
}

mergeSceneTuningConfig(defaults, saved) {
  const result = JSON.parse(JSON.stringify(defaults || {}));
  if (!saved || typeof saved !== "object") return result;
  Object.keys(result).forEach((groupKey) => {
    const source = saved[groupKey];
    if (!source || typeof source !== "object") return;
    Object.keys(result[groupKey]).forEach((key) => {
      const fallback = result[groupKey][key];
      if (typeof fallback !== "number") return;
      const value = Number(source[key]);
      if (Number.isFinite(value)) result[groupKey][key] = value;
    });
  });
  return result;
}

normalizeSceneTuningConfig() {
  const defaults = CT.Config.gameplay.sceneTest || {};
  if (!this.sceneTuningConfig) this.sceneTuningConfig = JSON.parse(JSON.stringify(defaults));
  const cfg = this.sceneTuningConfig;
  const normalizeGroup = (name) => {
    const fallback = defaults[name] || {};
    if (!cfg[name] || typeof cfg[name] !== "object") cfg[name] = JSON.parse(JSON.stringify(fallback));
    Object.keys(fallback).forEach((key) => {
      const value = Number(cfg[name][key]);
      cfg[name][key] = Number.isFinite(value) ? value : fallback[key];
    });
  };
  [
    "world",
    "background",
    "road",
    "fence",
    "poles",
    "barrel",
    "fire",
    "refOverlay",
    "multiplierPanel",
    "bonusBuyButton",
    "bonusPopup",
    "bonusPopupBg",
    "bonusInfoLine1",
    "bonusInfoLine2",
    "bonusStartButton",
    "bonusCloseButton",
    "autospinIcon",
    "autospinPopup",
    "autospinLabelX",
    "autospinValueX",
    "autospinLabelJumps",
    "autospinValueJumps",
    "autospinSliderX",
    "autospinSliderJumps",
    "autospinStartButton",
    "autospinCloseButton"
  ].forEach(normalizeGroup);
  cfg.background.scale = Math.max(0.01, cfg.background.scale);
  cfg.road.scale = Math.max(0.01, cfg.road.scale);
  cfg.fence.scale = Math.max(0.01, cfg.fence.scale);
  cfg.poles.spacing = Math.max(24, Number(cfg.poles.spacing) || 180);
  cfg.poles.scale = Math.max(0.01, cfg.poles.scale);
  cfg.barrel.scale = Math.max(0.01, cfg.barrel.scale);
  cfg.fire.scale = Math.max(0.01, cfg.fire.scale);
  cfg.refOverlay.alpha = Phaser.Math.Clamp(cfg.refOverlay.alpha, 0, 1);
  cfg.bonusBuyButton.scale = Math.max(0.05, cfg.bonusBuyButton.scale);
  cfg.bonusPopup.scale = Math.max(0.05, cfg.bonusPopup.scale);
  cfg.bonusPopupBg.scale = Math.max(0.05, cfg.bonusPopupBg.scale);
  cfg.bonusInfoLine1.scale = Math.max(0.05, cfg.bonusInfoLine1.scale);
  cfg.bonusInfoLine2.scale = Math.max(0.05, cfg.bonusInfoLine2.scale);
  cfg.bonusStartButton.scale = Math.max(0.05, cfg.bonusStartButton.scale);
  cfg.bonusCloseButton.scale = Math.max(0.05, cfg.bonusCloseButton.scale);
  cfg.autospinIcon.scale = Math.max(0.05, cfg.autospinIcon.scale);
  cfg.autospinPopup.scale = Math.max(0.05, cfg.autospinPopup.scale);
  cfg.autospinLabelX.size = Math.max(8, cfg.autospinLabelX.size);
  cfg.autospinValueX.size = Math.max(8, cfg.autospinValueX.size);
  cfg.autospinLabelJumps.size = Math.max(8, cfg.autospinLabelJumps.size);
  cfg.autospinValueJumps.size = Math.max(8, cfg.autospinValueJumps.size);
  cfg.autospinSliderX.scale = Math.max(0.05, cfg.autospinSliderX.scale);
  cfg.autospinSliderJumps.scale = Math.max(0.05, cfg.autospinSliderJumps.scale);
  cfg.autospinStartButton.scale = Math.max(0.05, cfg.autospinStartButton.scale);
  cfg.autospinCloseButton.scale = Math.max(0.05, cfg.autospinCloseButton.scale);
}

applySceneTuningConfig(save) {
  this.normalizeSceneTuningConfig();
  const cfg = this.sceneTuningConfig;
  this.roadArtX = Number(cfg.road.x) || 0;
  this.roadArtY = Number(cfg.road.y) || 0;
  this.roadArtScale = Math.max(0.01, Number(cfg.road.scale) || 1);
  this.fenceArtX = Number(cfg.fence.x) || 0;
  this.fenceArtY = Number(cfg.fence.y) || 0;
  this.fenceArtScale = Math.max(0.01, Number(cfg.fence.scale) || 1);
  this.fencePoleSpacing = Math.max(24, Number(cfg.poles.spacing) || 180);
  this.fencePoleY = Number(cfg.poles.y) || 0;
  this.fencePoleScale = Math.max(0.01, Number(cfg.poles.scale) || 1);
  if (this.fencePoleLayer) this.fencePoleLayer.layoutDirty = true;
  if (this.fenceOverlayLayer) this.fenceOverlayLayer.layoutDirty = true;
  this.redrawBackground();
  this.updateTestBackgroundLayout();
  this.updateRoadTilesLayout();
  this.updateHitWallLayout();
  this.updateRagdollGroundLayout();
  this.applyWorldOffsetToDynamicObjects();
  if (this.multiplierPanel) {
    this.multiplierPanel.setPosition(cfg.multiplierPanel.x, cfg.multiplierPanel.y);
  }
  if (this.hud && this.hud.applyBuyBonusButtonLayout) {
    this.hud.applyBuyBonusButtonLayout(cfg.bonusBuyButton);
  }
  if (this.hud && this.hud.applyAutospinButtonLayout) {
    this.hud.applyAutospinButtonLayout(cfg.autospinIcon);
  }
  this.applyBonusGameUiLayout();
  this.applyAutospinUiLayout();
  if (this.refOverlay) {
    this.refOverlay
      .setAlpha(cfg.refOverlay.alpha)
      .setVisible(cfg.refOverlay.alpha > 0.001);
  }
  if (save) {
    try {
      localStorage.setItem("crashLineSceneTuningV4", JSON.stringify(this.sceneTuningConfig));
    } catch (e) {}
  }
  this.updateSceneControlJson();
}

createSceneControlUI() {
  const root = document.getElementById("control-ui");
  if (!root || !this.sceneTuningConfig) return;
  this.sceneControlRoot = root;
  root.innerHTML = "";

  const addTransformSliders = (title, target, xMin, xMax, yMin, yMax, scaleMin, scaleMax) => {
    root.appendChild(this.makeSceneControlTitle(title));
    root.appendChild(this.makeSceneSlider("x", target, "x", xMin, xMax, 1));
    root.appendChild(this.makeSceneSlider("y", target, "y", yMin, yMax, 1));
    root.appendChild(this.makeSceneSlider("scale", target, "scale", scaleMin, scaleMax, 0.01));
  };
  const addTextSliders = (title, target) => {
    root.appendChild(this.makeSceneControlTitle(title));
    root.appendChild(this.makeSceneSlider("x", target, "x", -700, 700, 1));
    root.appendChild(this.makeSceneSlider("y", target, "y", -700, 700, 1));
    root.appendChild(this.makeSceneSlider("size", target, "size", 8, 140, 1));
  };
  const addTrackSliders = (title, target) => {
    root.appendChild(this.makeSceneControlTitle(title));
    root.appendChild(this.makeSceneSlider("start x", target, "startX", -700, 700, 1));
    root.appendChild(this.makeSceneSlider("start y", target, "startY", -700, 700, 1));
    root.appendChild(this.makeSceneSlider("end x", target, "endX", -700, 700, 1));
    root.appendChild(this.makeSceneSlider("end y", target, "endY", -700, 700, 1));
    root.appendChild(this.makeSceneSlider("scale", target, "scale", 0.05, 2, 0.01));
  };

  addTransformSliders("AUTOSPIN ICON", this.sceneTuningConfig.autospinIcon, -240, 960, 880, 1380, 0.1, 2);
  addTransformSliders("AUTOSPIN POPUP", this.sceneTuningConfig.autospinPopup, -240, 960, -220, 1500, 0.08, 1.4);
  addTextSliders("CRASH ON X LABEL", this.sceneTuningConfig.autospinLabelX);
  addTextSliders("CRASH ON X VALUE", this.sceneTuningConfig.autospinValueX);
  addTextSliders("CRASH ON JUMPS LABEL", this.sceneTuningConfig.autospinLabelJumps);
  addTextSliders("CRASH ON JUMPS VALUE", this.sceneTuningConfig.autospinValueJumps);
  addTrackSliders("CRASH ON X SLIDER", this.sceneTuningConfig.autospinSliderX);
  addTrackSliders("CRASH ON JUMPS SLIDER", this.sceneTuningConfig.autospinSliderJumps);
  addTransformSliders("AUTOSPIN START BUTTON", this.sceneTuningConfig.autospinStartButton, -700, 700, -700, 700, 0.1, 2);
  addTransformSliders("AUTOSPIN CLOSE BUTTON", this.sceneTuningConfig.autospinCloseButton, -700, 700, -700, 700, 0.1, 2);

  const actions = document.createElement("div");
  actions.className = "control-ui__actions";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "COPY JSON";
  copy.onclick = async () => {
    const text = JSON.stringify(this.getAutospinUiTuningSnapshot(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      copy.textContent = "COPIED";
      window.setTimeout(() => { copy.textContent = "COPY JSON"; }, 700);
    } catch (e) {
      copy.textContent = "COPY FAIL";
      window.setTimeout(() => { copy.textContent = "COPY JSON"; }, 900);
    }
  };
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "RESET";
  reset.onclick = () => {
    const defaults = CT.Config.gameplay.sceneTest || {};
    Object.keys(this.getAutospinUiTuningSnapshot()).forEach((key) => {
      this.sceneTuningConfig[key] = JSON.parse(JSON.stringify(defaults[key] || {}));
    });
    this.applySceneTuningConfig(true);
    this.createSceneControlUI();
  };
  actions.appendChild(copy);
  actions.appendChild(reset);
  root.appendChild(actions);

  this.sceneControlJson = document.createElement("pre");
  this.sceneControlJson.className = "control-ui__json";
  root.appendChild(this.sceneControlJson);
  this.updateSceneControlJson();
}

makeSceneControlTitle(text) {
  const title = document.createElement("div");
  title.className = "control-ui__title";
  title.textContent = text;
  return title;
}

makeSceneSlider(labelText, target, key, min, max, step) {
  const label = document.createElement("label");
  label.className = "control-ui__row";
  const name = document.createElement("span");
  name.textContent = labelText;
  const range = document.createElement("input");
  range.type = "range";
  range.min = min;
  range.max = max;
  range.step = step;
  range.value = target[key];
  const value = document.createElement("input");
  value.type = "number";
  value.min = min;
  value.max = max;
  value.step = step;
  value.value = target[key];
  const sync = (next) => {
    const parsed = Number(next);
    if (!Number.isFinite(parsed)) return;
    target[key] = parsed;
    range.value = target[key];
    value.value = target[key];
    this.applySceneTuningConfig(true);
  };
  range.oninput = () => sync(range.value);
  value.oninput = () => sync(value.value);
  label.appendChild(name);
  label.appendChild(range);
  label.appendChild(value);
  return label;
}

updateSceneControlJson() {
  if (!this.sceneControlJson || !this.sceneTuningConfig) return;
  this.sceneControlJson.textContent = JSON.stringify(this.getAutospinUiTuningSnapshot(), null, 2);
}

getAutospinUiTuningSnapshot() {
  if (!this.sceneTuningConfig) return {};
  return {
    autospinIcon: this.sceneTuningConfig.autospinIcon,
    autospinPopup: this.sceneTuningConfig.autospinPopup,
    autospinLabelX: this.sceneTuningConfig.autospinLabelX,
    autospinValueX: this.sceneTuningConfig.autospinValueX,
    autospinLabelJumps: this.sceneTuningConfig.autospinLabelJumps,
    autospinValueJumps: this.sceneTuningConfig.autospinValueJumps,
    autospinSliderX: this.sceneTuningConfig.autospinSliderX,
    autospinSliderJumps: this.sceneTuningConfig.autospinSliderJumps,
    autospinStartButton: this.sceneTuningConfig.autospinStartButton,
    autospinCloseButton: this.sceneTuningConfig.autospinCloseButton
  };
}

createCarControlConfig() {
  this.carControlConfig = JSON.parse(JSON.stringify(CT.Config.gameplay.carArt || {}));
}

applyCarControlConfig(save) {
  if (!this.carControlConfig) return;
  const cfg = this.carControlConfig;
  const normalize = (group, fallback) => {
    Object.keys(fallback).forEach((key) => {
      group[key] = Number(group[key]);
      if (!Number.isFinite(group[key])) group[key] = fallback[key];
    });
  };

  normalize(cfg.root, CT.Config.gameplay.carArt.root);
  normalize(cfg.body, CT.Config.gameplay.carArt.body);
  normalize(cfg.rearWheel, CT.Config.gameplay.carArt.rearWheel);
  normalize(cfg.frontWheel, CT.Config.gameplay.carArt.frontWheel);
  normalize(cfg.wheelShadow, CT.Config.gameplay.carArt.wheelShadow);
  normalize(cfg.turboFire, CT.Config.gameplay.carArt.turboFire);
  if (!cfg.turboFireTint || typeof cfg.turboFireTint !== "object") {
    cfg.turboFireTint = JSON.parse(JSON.stringify(CT.Config.gameplay.carArt.turboFireTint));
  }

  cfg.root.scale = Math.max(0.01, cfg.root.scale);
  cfg.body.scale = Math.max(0.01, cfg.body.scale);
  cfg.rearWheel.scale = Math.max(0.01, cfg.rearWheel.scale);
  cfg.frontWheel.scale = Math.max(0.01, cfg.frontWheel.scale);
  cfg.wheelShadow.scale = Math.max(0.01, cfg.wheelShadow.scale);
  cfg.wheelShadow.alpha = Phaser.Math.Clamp(cfg.wheelShadow.alpha, 0, 1);
  cfg.turboFire.scale = Math.max(0.01, cfg.turboFire.scale);
  cfg.turboFire.alpha = Phaser.Math.Clamp(cfg.turboFire.alpha, 0, 1);
  cfg.turboFireTint.preview = Phaser.Math.Clamp(Number(cfg.turboFireTint.preview) || 0, 0, 1);
  ["orange", "yellow", "green", "blue", "purple"].forEach((key) => {
    cfg.turboFireTint[key] = this.normalizeHexColor(cfg.turboFireTint[key], CT.Config.gameplay.carArt.turboFireTint[key]);
  });
  this.turboFireTintStops = ["orange", "yellow", "green", "blue", "purple"].map((key) => this.hexToRgb(cfg.turboFireTint[key]));

  if (this.car) {
    const carVisualScale = Number(CT.Config.gameplay.carVisualScale) || 1;
    if (this.car.visualRoot) this.car.visualRoot.setPosition(cfg.root.x, cfg.root.y).setScale(cfg.root.scale * carVisualScale);
    if (this.car.bodyRig) {
      this.car.bodyBaseY = cfg.body.y;
      this.car.bodyRig.setPosition(cfg.body.x, cfg.body.y).setAngle(0);
    }
    if (this.car.bodyImage) this.car.bodyImage.setScale(cfg.body.scale);
    if (this.car.lightSweep) this.car.lightSweep.setScale(cfg.body.scale);
    if (this.car.crashBody) this.car.crashBody.setScale(cfg.body.scale);
    if (this.car.rearWheel) this.car.rearWheel.setPosition(cfg.rearWheel.x, cfg.rearWheel.y).setScale(cfg.rearWheel.scale);
    if (this.car.frontWheel) this.car.frontWheel.setPosition(cfg.frontWheel.x, cfg.frontWheel.y).setScale(cfg.frontWheel.scale);
    if (this.car.wheelShadow) {
      this.car.wheelShadow
        .setPosition(cfg.wheelShadow.x, cfg.wheelShadow.y)
        .setScale(cfg.wheelShadow.scale)
        .setAlpha(cfg.wheelShadow.alpha);
    }
    if (this.car.carGroundShadow) {
      this.updateCarGroundShadow();
    }
    if (this.car.turboFire) this.car.turboFire.setPosition(cfg.turboFire.x, cfg.turboFire.y);
    this.updateCarFlame();
  }

  void save;
}

createBounceBadge() {
  this.bounceBadge = this.add.container(170, 96).setVisible(false).setAlpha(0).setScale(0.45).setAngle(-7);
  this.bounceBadgeIcon = this.add.image(0, 0, "bounceIcon").setScale(0.56);
  this.bounceBadgeExtraIcon = this.add.image(0, 0, "bounceIconExtra").setScale(0.56).setAlpha(0);
  this.bounceBadgeText = this.add.text(34, 2, "0", {
    fontFamily: CT.Config.fontFamily || "Arial",
    fontSize: "60px",
    color: "#ffffff",
    letterSpacing: CT.Config.fontLetterSpacing || 0,
    resolution: CT.Config.fontResolution || 1
  }).setOrigin(0.5);
  this.bounceBadge.add([this.bounceBadgeIcon, this.bounceBadgeExtraIcon, this.bounceBadgeText]);
  this.bounceBadge.lastCount = 0;
  this.multiplierPanel.add(this.bounceBadge);
}

getMultiplierThemes() {
  return {
    idle: { main: 0x8f969b, text: 0x8f969b, label: 0x8f969b, glow: 0x8f969b, shadow: 0x303538, bg: 0x071012, inner: 0x1b2327, bgAlpha: 0.62, innerAlpha: 0.34, glowAlpha: 0.08, strokeAlpha: 0.62 },
    running: { main: 0xeefe0d, text: 0xf6ffc3, label: 0xeefe0d, glow: 0xeefe0d, shadow: 0x6a7000, bg: 0x171a00, inner: 0x2a2d00, bgAlpha: 0.72, innerAlpha: 0.42, glowAlpha: 0.16, strokeAlpha: 0.92 },
    fail: { main: 0xff2929, text: 0xff2929, label: 0xff6a6a, glow: 0xff2929, shadow: 0x4a0707, bg: 0x210505, inner: 0x350808, bgAlpha: 0.76, innerAlpha: 0.42, glowAlpha: 0.16, strokeAlpha: 0.92 },
    win: { main: 0x29ff50, text: 0x29ff50, label: 0xd8ffd8, glow: 0x29ff50, shadow: 0x063a10, bg: 0x031b09, inner: 0x063311, bgAlpha: 0.78, innerAlpha: 0.44, glowAlpha: 0.18, strokeAlpha: 0.94 }
  };
}

colorToCss(color) {
  return "#" + Math.round(color).toString(16).padStart(6, "0").slice(-6);
}

lerpColorNumber(from, to, t) {
  const a = Phaser.Display.Color.IntegerToColor(from);
  const b = Phaser.Display.Color.IntegerToColor(to);
  return Phaser.Display.Color.GetColor(
    Math.round(Phaser.Math.Linear(a.red, b.red, t)),
    Math.round(Phaser.Math.Linear(a.green, b.green, t)),
    Math.round(Phaser.Math.Linear(a.blue, b.blue, t))
  );
}

mixMultiplierTheme(from, to, t) {
  const colorKeys = ["main", "text", "label", "glow", "shadow", "bg", "inner"];
  const numberKeys = ["bgAlpha", "innerAlpha", "glowAlpha", "strokeAlpha"];
  const mixed = {};
  colorKeys.forEach((key) => { mixed[key] = this.lerpColorNumber(from[key], to[key], t); });
  numberKeys.forEach((key) => { mixed[key] = Phaser.Math.Linear(from[key], to[key], t); });
  return mixed;
}

setMultiplierThemeVisual(themeState) {
  if (!this.multiplierText || !this.multiplierPanelBg) return;
  this.multiplierPanelBg.setFillStyle(themeState.bg, themeState.bgAlpha);
  this.multiplierPanelBg.setStrokeStyle(7, themeState.main, themeState.strokeAlpha);
  this.multiplierPanelInner.setFillStyle(themeState.inner, themeState.innerAlpha);
  this.multiplierPanelInner.isStroked = false;
  this.multiplierPanelLabel.setColor(this.colorToCss(themeState.label));
  this.multiplierText.setColor(this.colorToCss(themeState.text));
  if (this.finalWinText) {
    this.finalWinText.setColor(this.colorToCss(themeState.text));
  }
}

applyMultiplierTheme(theme, instant, keepWinLayout) {
  if (!this.multiplierText || !this.multiplierPanelBg) return;
  const themes = this.getMultiplierThemes();
  const next = themes[theme] || themes.idle;
  const from = this.multiplierThemeCurrent || next;
  if (this.multiplierThemeTween) {
    this.multiplierThemeTween.stop();
    this.multiplierThemeTween = null;
  }
  if (instant) {
    this.multiplierThemeCurrent = Object.assign({}, next);
    this.setMultiplierThemeVisual(next);
  } else {
    const mix = { t: 0 };
    this.multiplierThemeTween = this.tweens.add({
      targets: mix,
      t: 1,
      duration: 260,
      ease: "Sine.inOut",
      onUpdate: () => {
        this.multiplierThemeCurrent = this.mixMultiplierTheme(from, next, mix.t);
        this.setMultiplierThemeVisual(this.multiplierThemeCurrent);
      },
      onComplete: () => {
        this.multiplierThemeCurrent = Object.assign({}, next);
        this.setMultiplierThemeVisual(next);
        this.multiplierThemeTween = null;
      }
    });
  }
  if (theme !== "win" && !keepWinLayout) {
    if (this.finalWinText) this.finalWinText.setVisible(false).setAlpha(0);
    if (this.multiplierPanel) this.multiplierPanel.setScale(1).setAlpha(1);
    this.multiplierText.setPosition(0, 0).setScale(1).setAlpha(1).setAngle(0);
    this.multiplierPanelLabel.setText("").setPosition(0, -72).setAlpha(0);
  }
}

showBounceBadge(count) {
  if (!this.bounceBadge) return;
  const n = Math.max(0, Math.floor(Number(count || 0)));
  if (this.bounceBadge.lastCount !== n || this.bounceBadgeText.text !== String(n)) {
    this.bounceBadgeText.setText(String(n));
  }
  if (n <= 0) {
    if (!this.bounceBadge.visible) return;
    this.tweens.killTweensOf(this.bounceBadge);
    this.tweens.add({
      targets: this.bounceBadge,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 1.18,
      angle: 12,
      duration: 240,
      ease: "Back.in",
      onComplete: () => {
        this.bounceBadge.setVisible(false).setScale(0.45).setAngle(-7);
        this.bounceBadgeIcon.setAlpha(1);
        this.bounceBadgeExtraIcon.setAlpha(0);
        this.bounceBadgeText.setColor("#ffffff");
        this.bounceBadge.lastCount = 0;
      }
    });
    return;
  }

  if (!this.bounceBadge.visible) {
    this.bounceBadge.setVisible(true).setAlpha(0).setScale(0.45).setAngle(-16);
    this.tweens.killTweensOf(this.bounceBadge);
    this.tweens.add({
      targets: this.bounceBadge,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      angle: -7,
      duration: 360,
      ease: "Back.out"
    });
  } else if (this.bounceBadge.lastCount !== n) {
    this.tweens.killTweensOf(this.bounceBadge);
    this.bounceBadge.setScale(1.18);
    this.tweens.add({
      targets: this.bounceBadge,
      scaleX: 1,
      scaleY: 1,
      angle: -7,
      duration: 220,
      ease: "Back.out"
    });
  }
  this.bounceBadge.lastCount = n;
}

createCar() {
  const car = this.add.container(CT.Config.gameplay.carStartX, this.getGameplayRoadY() - 54).setDepth(5);
  const carGroundShadow = this.add.image(0, 0, "carGroundShadow")
    .setOrigin(0.5)
    .setDepth(4.5);
  const visualRoot = this.add.container(0, 0);
  const wheelRig = this.add.container(0, 0);
  const rearWheel = this.add.sprite(0, 0, "wheel1").setOrigin(0.5);
  const frontWheel = this.add.sprite(0, 0, "wheel1").setOrigin(0.5);
  const wheelShadow = this.add.image(0, 0, "wheelShadow").setOrigin(0.5);
  const turboFire = this.add.sprite(0, 0, "turboFire1")
    .setOrigin(1, 0.5)
    .setBlendMode(Phaser.BlendModes.ADD);
  const bodyRig = this.add.container(0, 0);
  const bodyImage = this.add.image(0, 0, "carBody").setOrigin(0.5);
  const lightSweep = this.add.sprite(0, 0, "carLightSweep1")
    .setOrigin(0.5)
    .setVisible(false)
    .setAlpha(0)
    .setBlendMode(Phaser.BlendModes.ADD);
  const crashBody = this.add.sprite(0, 0, "carCrashBody1").setOrigin(0.5).setVisible(false);

  wheelRig.add([rearWheel, frontWheel, wheelShadow]);
  bodyRig.add([bodyImage, lightSweep, crashBody, turboFire]);
  visualRoot.add([wheelRig, bodyRig]);
  car.add(visualRoot);

  car.visualRoot = visualRoot;
  car.wheelRig = wheelRig;
  car.bodyRig = bodyRig;
  car.bodyImage = bodyImage;
  car.lightSweep = lightSweep;
  car.crashBody = crashBody;
  car.rearWheel = rearWheel;
  car.frontWheel = frontWheel;
  car.wheelShadow = wheelShadow;
  car.carGroundShadow = carGroundShadow;
  car.turboFire = turboFire;
  car.wheels = [rearWheel, frontWheel];
  car.bodyBaseY = 0;
  car.bodyBouncePhase = Math.random() * Math.PI * 2;
  car.bodyPitchPhase = Math.random() * Math.PI * 2;
  car.idleShakePhase = Math.random() * Math.PI * 2;
  car.idleShakeActive = false;
  lightSweep.on("animationcomplete", (animation) => {
    if (animation && animation.key === "carLightSweep") {
      lightSweep.setVisible(false).setAlpha(0);
    }
  });
  this.car = car;
  this.applyCarControlConfig(false);
  this.setWheelPlayback(false);
  this.updateCarFlame();
  return car;
}

setCarCrashVisual(active) {
  if (!this.car) return;
  if (this.car.bodyImage) this.car.bodyImage.setVisible(!active);
  if (this.car.rearWheel) this.car.rearWheel.setVisible(!active);
  if (this.car.frontWheel) this.car.frontWheel.setVisible(!active);
  if (this.car.wheelShadow) this.car.wheelShadow.setVisible(!active);

  if (this.car.turboFire) {
    this.car.turboFire.setVisible(!active);
    if (active) this.car.turboFire.setAlpha(0);
  }
  if (active) this.hideCarLightSweep();

  if (!this.car.crashBody) return;
  if (active) {
    if (this.car.crashBody.visible) return;
    this.car.crashBody
      .setVisible(true)
      .setAlpha(1)
      .setTexture("carCrashBody1");
    this.car.crashBody.play("carBodyCrash", true);
  } else {
    if (this.car.crashBody.anims && this.car.crashBody.anims.isPlaying) {
      this.car.crashBody.stop();
    }
    this.car.crashBody
      .setTexture("carCrashBody1")
      .setVisible(false)
      .setAlpha(0);
  }
}

hideCarLightSweep() {
  if (!this.car || !this.car.lightSweep) return;
  if (this.car.lightSweep.anims && this.car.lightSweep.anims.isPlaying) {
    this.car.lightSweep.stop();
  }
  this.car.lightSweep
    .setTexture("carLightSweep1")
    .setVisible(false)
    .setAlpha(0);
}

updateCarLightSweep(roadSpeed) {
  if (!this.car || !this.car.lightSweep) return;
  if (this.state !== "running" || (this.car.crashBody && this.car.crashBody.visible)) {
    this.hideCarLightSweep();
    return;
  }

  const now = this.time.now;
  const speedT = Phaser.Math.Clamp((roadSpeed - 340) / 1900, 0, 1);
  const speedEase = Phaser.Math.Easing.Sine.Out(speedT);
  const interval = Phaser.Math.Linear(1450, 480, speedEase);
  if (!this.nextCarLightSweepAt) {
    this.nextCarLightSweepAt = now + Phaser.Math.FloatBetween(120, 320);
  }
  if (now < this.nextCarLightSweepAt || this.car.lightSweep.anims.isPlaying) return;

  this.car.lightSweep
    .setVisible(true)
    .setAlpha(0.5)
    .play("carLightSweep", true);
  this.car.lightSweep.anims.timeScale = Phaser.Math.Linear(0.82, 1.24, speedEase);
  this.nextCarLightSweepAt = now + interval * Phaser.Math.FloatBetween(0.82, 1.16);
}

createDummy() {
  const dummy = this.add.container(-22, -45);
  const head = this.add.circle(0, -20, 15, 0xf3c479, 1).setStrokeStyle(3, 0x563820, 1);
  const body = this.add.rectangle(0, 9, 24, 42, 0xf0a541, 1).setStrokeStyle(3, 0x563820, 1);
  const markH = this.add.rectangle(0, -20, 25, 4, 0x111111, 1);
  const markV = this.add.rectangle(0, -20, 4, 25, 0x111111, 1);
  const arm = this.add.rectangle(20, 5, 35, 8, 0xf3c479, 1).setAngle(-14);
  dummy.add([head, body, markH, markV, arm]);
  return dummy;
}

isMobilePerfMode() {
  if (this.mobilePerfMode !== null) return this.mobilePerfMode;
  if (typeof window === "undefined") {
    this.mobilePerfMode = false;
    return this.mobilePerfMode;
  }
  const nav = window.navigator || {};
  const ua = String(nav.userAgent || "");
  const coarsePointer = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  const lowMemory = Number(nav.deviceMemory || 8) <= 4;
  this.mobilePerfMode = /Android|iPhone|iPad|iPod/i.test(ua) || (coarsePointer && lowMemory);
  return this.mobilePerfMode;
}

setupRagdollMatterWorld() {
  if (!this.matter) {
    console.warn("RAGDOLL: Matter physics is not available in GameScene.");
    return;
  }
  if (this.ragdollMatterReady) return;
  this.Matter = Phaser.Physics.Matter.Matter;
  this.matter.world.setGravity(0, 0.92);
  this.matter.world.engine.positionIterations = 18;
  this.matter.world.engine.velocityIterations = 12;
  this.matter.world.engine.constraintIterations = 16;
  this.ragdollCollisionLayers = {
    world: 0x0001,
    back: 0x0002,
    core: 0x0004,
    leftLeg: 0x0008,
    rightLeg: 0x0010,
    front: 0x0020,
    armUpperL: 0x0040,
    armLowerL: 0x0080,
    armHandL: 0x0100,
    armUpperR: 0x0200,
    armLowerR: 0x0400,
    armHandR: 0x0800
  };
  const gp = CT.Config.gameplay;
  const groundWidth = gp.worldWidth + 5200;
  const groundHeight = 96;
  this.ragdollGround = this.matter.add.rectangle(
    gp.worldWidth / 2,
    this.getGameplayGroundY() + groundHeight / 2,
    groundWidth,
    groundHeight,
    {
      isStatic: true,
      label: "ragdollGround",
      friction: 0.96,
      restitution: 0.08,
      collisionFilter: {
        category: this.ragdollCollisionLayers.world,
        mask: 0xffffffff
      }
    }
  );
  this.ragdollMatterReady = true;
}

updateRagdollGroundLayout() {
  if (!this.ragdollGround || !this.Matter) return;
  const gp = CT.Config.gameplay;
  const groundHeight = 96;
  this.Matter.Body.setPosition(this.ragdollGround, {
    x: gp.worldWidth / 2,
    y: this.getGameplayGroundY() + groundHeight / 2
  });
}

applyWorldOffsetToDynamicObjects() {
  if (this.car && this.state !== "crashing" && this.state !== "dummyFlight") {
    const leverLift = Phaser.Math.Easing.Cubic.Out(this.turboPower || 0);
    const lift = this.state === "running" ? leverLift * 5.04 : 0;
    this.car.y = this.getGameplayRoadY() - 54 - lift;
    this.updateCarGroundShadow();
  }
}

getFlightRagdollLegacyPose() {
  return {
    matterScale: 0.61248,
    textureScale: 0.484,
    parts: {
      upperArmL: { x: 0, y: 6, rotation: 0, scale: 0.484, alpha: 1, layer: 10, anchors: { shoulder: { x: -0.75, y: -14.5 }, elbow: { x: 0.75, y: 17 } } },
      lowerArmL: { x: -1, y: 38.24, rotation: 0, scale: 0.484, alpha: 1, layer: 9, anchors: { elbow: { x: 1, y: -13.5 }, wrist: { x: 0.5, y: 10.75 } } },
      handL: { x: 1.71, y: 58.47, rotation: 0, scale: 0.484, alpha: 1, layer: 8, anchors: { wrist: { x: -0.75, y: -13.5 } } },
      thighL: { x: -4.22, y: 72.9, rotation: 0, scale: 0.484, alpha: 1, layer: 13, anchors: { hip: { x: 0.75, y: -22 }, knee: { x: 0.75, y: 25.75 } } },
      shinL: { x: -1.72, y: 120.48, rotation: -3.44, scale: 0.484, alpha: 1, layer: 12, anchors: { knee: { x: 0, y: -20.21 }, ankle: { x: 0, y: 20.21 } } },
      footL: { x: 4.78, y: 145.98, rotation: -2.29, scale: 0.484, alpha: 1, layer: 11, anchors: { ankle: { x: -5.51, y: -4.29 } } },
      torso: { x: 0, y: 0, rotation: 1.72, scale: 0.484, alpha: 1, layer: 36, anchors: { neck: { x: 2, y: -27 }, spine: { x: 0, y: 25.75 }, shoulderL: { x: 0.2, y: -11.99 }, shoulderR: { x: -0.2, y: -11.99 } } },
      pelvis: { x: -1, y: 43.5, rotation: 2.29, scale: 0.484, alpha: 1, layer: 31, anchors: { spine: { x: 0, y: -11.02 }, hipL: { x: -7.35, y: 8.57 }, hipR: { x: 8.57, y: 8.57 } } },
      head: { x: 3.5, y: -40, rotation: 0, scale: 0.484, alpha: 1, layer: 40, anchors: { neck: { x: -2, y: 7 } } },
      thighR: { x: -2, y: 72.29, rotation: 0, scale: 0.484, alpha: 1, layer: 50, anchors: { hip: { x: 3.25, y: -20.75 }, knee: { x: 3.25, y: 25.75 } } },
      shinR: { x: -1.5, y: 120.5, rotation: 0, scale: 0.484, alpha: 1, layer: 49, anchors: { knee: { x: -0.75, y: -22 }, ankle: { x: -0.75, y: 18.25 } } },
      footR: { x: 4, y: 146.5, rotation: 0, scale: 0.484, alpha: 1, layer: 48, anchors: { ankle: { x: -7, y: -8.25 } } },
      upperArmR: { x: -2.5, y: 8, rotation: 0, scale: 0.484, alpha: 1, layer: 60, anchors: { shoulder: { x: 0.75, y: -15.75 }, elbow: { x: -1, y: 18.25 } } },
      lowerArmR: { x: -3.5, y: 43.11, rotation: 0, scale: 0.484, alpha: 1, layer: 59, anchors: { elbow: { x: 0, y: -14.09 }, wrist: { x: 0, y: 14.09 } } },
      handR: { x: -0.1, y: 62.5, rotation: -3.44, scale: 0.484, alpha: 1, layer: 58, anchors: { wrist: { x: -3.06, y: -9.8 } } }
    }
  };
}

createFlightRagdollLegacySkin(trackX, trackY, trackAngle) {
  if (!this.matter) {
    console.warn("RAGDOLL: cannot create flight ragdoll because Matter is missing.");
    return false;
  }
  this.setupRagdollMatterWorld();
  if (!this.ragdollMatterReady || !this.Matter) {
    console.warn("RAGDOLL: Matter world was not initialized.");
    return false;
  }
  this.clearFlightRagdoll();

  const pose = this.getFlightRagdollLegacyPose();
  const scale = Number(pose.matterScale) || 0.61248;
  const textureScale = Number(pose.textureScale) || 0.484;
  const skin = 0xf2b34c;
  const suit = 0xf4a33c;
  const dark = 0x27313b;
  const backSkin = 0xc8873b;
  const target = this.getRagdollTorsoTarget(trackX, trackY);
  const launchAngleRad = Phaser.Math.DegToRad(Number(trackAngle) || 0);
  const torsoPoseAngleRad = Phaser.Math.DegToRad(Number(pose.parts.torso.rotation) || 0);
  const rig = {
    scale,
    parts: [],
    joints: [],
    sprites: [],
    graphics: this.add.graphics().setDepth(11).setVisible(false),
    anchor: null,
    torso: null,
    createdAt: this.time.now,
    followEaseUntil: this.time.now + 360,
    lastTarget: { x: target.x, y: target.y },
    lastTrackAngleRad: launchAngleRad + torsoPoseAngleRad,
    trackAngleOffsetRad: torsoPoseAngleRad,
    noBreakUntil: this.time.now + 340,
    softBreakUntil: this.time.now + 840,
    // Cinematic "cartwheel" director. Matter handles floppy limbs; this keeps whole-body spin readable.
    torsoSpinBoostUntil: 0,
    torsoSpinBoostDuration: 1,
    torsoSpinBoostPower: 0,
    torsoSpinMaxAngular: 1.0,
    torsoSpinDirection: 1,
    torsoCruiseSpin: false,
    torsoCruiseSpinTarget: 0,
    torsoCruiseSpinMax: 1.0,
    torsoCruiseSpinGain: 0,
    torsoSpinPivotYOffset: 14,
    wheelSpinActive: true,
    wheelSpinSpeedDeg: 315,
    wheelSpinCruiseDeg: 245,
    wheelSpinMaxDeg: 400,
    wheelSpinMinDeg: 155,
    wheelSpinDamping: 0.052,
    wheelSpinSmoothDeg: 315,
    wheelSpinDirection: 1,
    wheelSpinBurstUntil: 0,
    wheelSpinBurstDuration: 1,
    wheelSpinBurstDeg: 0,
    wheelSpinBurstFrameDeg: 1.25,
    wheelSpinBurstStepDeg: 18,
    legSpreadUntil: this.time.now + 900,
    legSpreadDuration: 900,
    legAirSpreadUntil: 0,
    legAirSpreadDuration: 1,
    legAirSpreadPower: 0,
    legAirSpreadPosePower: 0,
    legAirSpreadPoseFade: 1,
    legAirSpreadPoseStartedAt: 0,
    legAirSpreadPoseRampMs: 220,
    legShockUntil: this.time.now + 260,
    legShockDuration: 260,
    legShockPower: 0.42,
    limbChaosUntil: this.time.now + 1100,
    limbChaosDuration: 1100,
    limbChaosPower: 0.88,
    allowJointBreaks: true,
    jointGraphVersion: 0,
    connectedPartsCacheRoot: null,
    connectedPartsCacheVersion: -1,
    connectedPartsCache: null
  };
  this.flightRagdoll = rig;

  const num = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const rotateLocalPoint = (point, angleRad) => {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos
    };
  };
  const resolvedParts = {};
  Object.keys(pose.parts || {}).forEach((name) => {
    const source = pose.parts[name] || {};
    resolvedParts[name] = Object.assign({}, source, {
      anchors: Object.assign({}, source.anchors || {})
    });
  });
  const part = (name) => resolvedParts[name] || { x: 0, y: 0, rotation: 0, scale: 1, alpha: 1, layer: 1, anchors: {} };
  const anchorFromPart = (partData, anchorName) => {
    const point = (partData.anchors || {})[anchorName] || {};
    return { x: num(point.x, 0), y: num(point.y, 0) };
  };
  const resolveJointPose = (parentName, childName, parentAnchorName, childAnchorName) => {
    const parentPart = part(parentName);
    const childPart = part(childName);
    const parentAngle = Phaser.Math.DegToRad(num(parentPart.rotation, 0));
    const childAngle = Phaser.Math.DegToRad(num(childPart.rotation, 0));
    const parentAnchor = rotateLocalPoint(anchorFromPart(parentPart, parentAnchorName), parentAngle);
    const childAnchor = rotateLocalPoint(anchorFromPart(childPart, childAnchorName), childAngle);
    childPart.x = num(parentPart.x, 0) + parentAnchor.x - childAnchor.x;
    childPart.y = num(parentPart.y, 0) + parentAnchor.y - childAnchor.y;
  };
  resolveJointPose("torso", "head", "neck", "neck");
  resolveJointPose("torso", "pelvis", "spine", "spine");
  resolveJointPose("torso", "upperArmL", "shoulderL", "shoulder");
  resolveJointPose("upperArmL", "lowerArmL", "elbow", "elbow");
  resolveJointPose("lowerArmL", "handL", "wrist", "wrist");
  resolveJointPose("torso", "upperArmR", "shoulderR", "shoulder");
  resolveJointPose("upperArmR", "lowerArmR", "elbow", "elbow");
  resolveJointPose("lowerArmR", "handR", "wrist", "wrist");
  resolveJointPose("pelvis", "thighL", "hipL", "hip");
  resolveJointPose("thighL", "shinL", "knee", "knee");
  resolveJointPose("shinL", "footL", "ankle", "ankle");
  resolveJointPose("pelvis", "thighR", "hipR", "hip");
  resolveJointPose("thighR", "shinR", "knee", "knee");
  resolveJointPose("shinR", "footR", "ankle", "ankle");
  rig.legacyPose = { parts: resolvedParts };
  const partX = (name) => target.x + num(part(name).x, 0);
  const partY = (name) => target.y + num(part(name).y, 0);
  const partAngle = (name) => Phaser.Math.DegToRad(num(part(name).rotation, 0));
  const anchor = (name, anchorName) => {
    const anchors = part(name).anchors || {};
    const point = anchors[anchorName] || {};
    return { x: num(point.x, 0), y: num(point.y, 0) };
  };
  const offsetPoint = (point, x, y) => ({
    x: point.x + x,
    y: point.y + y
  });
  const maxSpinForPart = (name) => {
    // Fun-first caps: arms and distal leg pieces can rotate visibly.
    if (/hand/i.test(name)) return 2.00;
    if (/upperArm/i.test(name)) return 3.15;
    if (/lowerArm/i.test(name)) return 2.15;
    if (/foot/i.test(name)) return 1.22;
    if (/thigh/i.test(name)) return 0.92;
    if (/shin/i.test(name)) return 1.08;
    if (/head/i.test(name)) return 1.05;
    if (/pelvis/i.test(name)) return 0.78;
    return 1.15;
  };

  const addPart = (name, body) => {
    body.ragdollPart = name;
    const posePart = part(name);
    body.ragdollAnchorPoints = Object.assign({}, posePart.anchors || {});
    body.ragdollPose = {
      textureOffsetFromTorso: { x: num(posePart.x, 0), y: num(posePart.y, 0) },
      bodyAngleOffset: partAngle(name) - torsoPoseAngleRad
    };
    body.renderInfo = Object.assign(body.renderInfo || {}, {
      textureKey: "dummyPart_" + name,
      textureScale: num(posePart.scale, textureScale),
      textureOffset: { x: 0, y: 0 },
      textureRotationOffset: 0,
      layer: posePart.layer !== undefined ? posePart.layer : ((body.renderInfo && body.renderInfo.layer) || 1),
      alpha: posePart.alpha !== undefined ? posePart.alpha : ((body.renderInfo && body.renderInfo.alpha) || 1),
      maxSpin: maxSpinForPart(name)
    });
    rig.parts.push(body);
    this.createFlightRagdollImageForBody(rig, body, posePart);
    return body;
  };
  const circle = (x, y, radius, color, options) => {
    const body = this.matter.add.circle(x, y, radius, {
      friction: 0.92,
      frictionAir: 0.01,
      restitution: 0.18,
      density: 0.003,
      slop: 0.045,
      collisionFilter: this.ragdollCollisionFilter(options && options.z)
    });
    body.renderInfo = Object.assign({ color, radius, layer: 1, alpha: 1 }, options || {});
    return body;
  };
  const rect = (x, y, width, height, color, angle, options) => {
    const body = this.matter.add.rectangle(x, y, width, height, {
      chamfer: { radius: Math.min(7, width * 0.36) },
      friction: 0.9,
      frictionAir: 0.01,
      restitution: 0.16,
      density: 0.0028,
      slop: 0.045,
      collisionFilter: this.ragdollCollisionFilter(options && options.z)
    });
    if (angle) this.Matter.Body.rotate(body, angle);
    body.renderInfo = Object.assign({ color, width, height, layer: 1, alpha: 1 }, options || {});
    return body;
  };
  const px = (value) => value * scale;
  const joint = (name, bodyA, bodyB, pointA, pointB, stiffness, breakLimit, damping) => {
    const isBrace = String(name || "").indexOf("Brace") !== -1 || String(name || "").indexOf("clavicle") !== -1;
    const config = {
      bodyA,
      bodyB,
      pointA,
      pointB,
      stiffness,
      damping: Number.isFinite(Number(damping)) ? Number(damping) : 0.2
    };
    if (!isBrace) config.length = 0;
    const link = this.Matter.Constraint.create(config);
    link.ragdollJoint = Object.assign({ name, breakLimit: breakLimit * scale }, this.ragdollJointProfile(name));
    if (isBrace) link.ragdollJoint.brace = true;
    this.Matter.Composite.add(this.matter.world.localWorld, link);
    rig.joints.push(link);
    return link;
  };

  const head = addPart("head", circle(partX("head"), partY("head"), px(25), skin, { z: "core" }));
  const torso = addPart("torso", rect(partX("torso"), partY("torso"), px(42), px(78), suit, partAngle("torso"), { z: "core" }));
  const pelvis = addPart("pelvis", rect(partX("pelvis"), partY("pelvis"), px(46), px(34), suit, partAngle("pelvis"), { z: "core" }));
  const upperArmL = addPart("upperArmL", rect(partX("upperArmL"), partY("upperArmL"), px(18), px(66), backSkin, partAngle("upperArmL"), { z: "armUpperL" }));
  const lowerArmL = addPart("lowerArmL", rect(partX("lowerArmL"), partY("lowerArmL"), px(16), px(46), backSkin, partAngle("lowerArmL"), { z: "armLowerL" }));
  const handL = addPart("handL", rect(partX("handL"), partY("handL"), px(22), px(14), backSkin, partAngle("handL"), { z: "armHandL" }));
  const upperArmR = addPart("upperArmR", rect(partX("upperArmR"), partY("upperArmR"), px(20), px(66), skin, partAngle("upperArmR"), { z: "armUpperR" }));
  const lowerArmR = addPart("lowerArmR", rect(partX("lowerArmR"), partY("lowerArmR"), px(17), px(46), skin, partAngle("lowerArmR"), { z: "armLowerR" }));
  const handR = addPart("handR", rect(partX("handR"), partY("handR"), px(24), px(15), skin, partAngle("handR"), { z: "armHandR" }));
  const thighL = addPart("thighL", rect(partX("thighL"), partY("thighL"), px(20), px(68), 0x1d252c, partAngle("thighL"), { z: "leftLeg" }));
  const shinL = addPart("shinL", rect(partX("shinL"), partY("shinL"), px(18), px(66), backSkin, partAngle("shinL"), { z: "leftLeg" }));
  const footL = addPart("footL", rect(partX("footL"), partY("footL"), px(42), px(16), backSkin, partAngle("footL"), { z: "leftLeg" }));
  const thighR = addPart("thighR", rect(partX("thighR"), partY("thighR"), px(22), px(68), dark, partAngle("thighR"), { z: "rightLeg" }));
  const shinR = addPart("shinR", rect(partX("shinR"), partY("shinR"), px(20), px(66), skin, partAngle("shinR"), { z: "rightLeg" }));
  const footR = addPart("footR", rect(partX("footR"), partY("footR"), px(44), px(17), skin, partAngle("footR"), { z: "rightLeg" }));

  rig.torso = torso;
  rig.anchor = this.matter.add.circle(target.x, target.y, 6, {
    isStatic: true,
    isSensor: true,
    collisionFilter: { mask: 0 }
  });
  rig.anchorConstraint = this.Matter.Constraint.create({
    bodyA: rig.anchor,
    bodyB: torso,
    pointA: { x: 0, y: 0 },
    // Follow/rotation pivot is a bit lower than torso center.
    pointB: { x: 0, y: 14 },
    length: 0,
    stiffness: 0.46,
    damping: 0.035
  });
  this.Matter.Composite.add(this.matter.world.localWorld, rig.anchorConstraint);

  const torsoSpine = anchor("torso", "spine");
  const pelvisSpine = anchor("pelvis", "spine");
  const shoulderLAnchor = anchor("torso", "shoulderL");
  const shoulderRAnchor = anchor("torso", "shoulderR");

  joint("neck", head, torso, anchor("head", "neck"), anchor("torso", "neck"), 0.9, 86);
  joint("spine", torso, pelvis, torsoSpine, pelvisSpine, 0.98, 110, 0.28);
  joint("spineBraceL", torso, pelvis, offsetPoint(torsoSpine, -12, -4), offsetPoint(pelvisSpine, -12, 5), 0.88, 96, 0.24);
  joint("spineBraceR", torso, pelvis, offsetPoint(torsoSpine, 12, -4), offsetPoint(pelvisSpine, 12, 5), 0.88, 96, 0.24);
  joint("shoulderL", torso, upperArmL, shoulderLAnchor, anchor("upperArmL", "shoulder"), 0.34, 124, 0.002);
  joint("elbowL", upperArmL, lowerArmL, anchor("upperArmL", "elbow"), anchor("lowerArmL", "elbow"), 0.36, 82, 0.018);
  joint("elbowBraceL", upperArmL, lowerArmL, offsetPoint(anchor("upperArmL", "elbow"), -5, -2), offsetPoint(anchor("lowerArmL", "elbow"), 5, 2), 0.055, 74, 0.012);
  joint("wristL", lowerArmL, handL, anchor("lowerArmL", "wrist"), anchor("handL", "wrist"), 0.28, 52, 0.014);
  joint("wristBraceL", lowerArmL, handL, offsetPoint(anchor("lowerArmL", "wrist"), -4, -2), offsetPoint(anchor("handL", "wrist"), 5, 3), 0.030, 40, 0.010);
  joint("shoulderR", torso, upperArmR, shoulderRAnchor, anchor("upperArmR", "shoulder"), 0.32, 124, 0.002);
  joint("elbowR", upperArmR, lowerArmR, anchor("upperArmR", "elbow"), anchor("lowerArmR", "elbow"), 0.34, 82, 0.016);
  joint("elbowBraceR", upperArmR, lowerArmR, offsetPoint(anchor("upperArmR", "elbow"), 5, -2), offsetPoint(anchor("lowerArmR", "elbow"), -5, 2), 0.048, 74, 0.010);
  joint("wristR", lowerArmR, handR, anchor("lowerArmR", "wrist"), anchor("handR", "wrist"), 0.26, 52, 0.012);
  joint("wristBraceR", lowerArmR, handR, offsetPoint(anchor("lowerArmR", "wrist"), 4, -2), offsetPoint(anchor("handR", "wrist"), -5, 3), 0.026, 40, 0.009);

  // Legs need physical hinge strength first. Angular guards only add flavor;
  // these constraints keep knees and ankles from visually stretching apart.
  joint("hipL", pelvis, thighL, anchor("pelvis", "hipL"), anchor("thighL", "hip"), 0.82, 104, 0.090);
  joint("hipBraceL", pelvis, thighL, offsetPoint(anchor("pelvis", "hipL"), -7, 4), offsetPoint(anchor("thighL", "hip"), 7, 18), 0.145, 92, 0.045);
  joint("kneeL", thighL, shinL, anchor("thighL", "knee"), anchor("shinL", "knee"), 0.78, 88, 0.058);
  joint("kneeBraceL", thighL, shinL, offsetPoint(anchor("thighL", "knee"), -6, -3), offsetPoint(anchor("shinL", "knee"), 6, 3), 0.165, 78, 0.034);
  joint("ankleL", shinL, footL, anchor("shinL", "ankle"), anchor("footL", "ankle"), 0.74, 62, 0.044);
  joint("ankleBraceL", shinL, footL, offsetPoint(anchor("shinL", "ankle"), -4, -2), offsetPoint(anchor("footL", "ankle"), 8, 2), 0.150, 48, 0.026);

  joint("hipR", pelvis, thighR, anchor("pelvis", "hipR"), anchor("thighR", "hip"), 0.80, 104, 0.082);
  joint("hipBraceR", pelvis, thighR, offsetPoint(anchor("pelvis", "hipR"), 7, 4), offsetPoint(anchor("thighR", "hip"), -7, 18), 0.135, 92, 0.040);
  joint("kneeR", thighR, shinR, anchor("thighR", "knee"), anchor("shinR", "knee"), 0.74, 88, 0.052);
  joint("kneeBraceR", thighR, shinR, offsetPoint(anchor("thighR", "knee"), 6, -3), offsetPoint(anchor("shinR", "knee"), -6, 3), 0.150, 78, 0.030);
  joint("ankleR", shinR, footR, anchor("shinR", "ankle"), anchor("footR", "ankle"), 0.70, 62, 0.038);
  joint("ankleBraceR", shinR, footR, offsetPoint(anchor("shinR", "ankle"), 4, -2), offsetPoint(anchor("footR", "ankle"), 8, 2), 0.135, 48, 0.023);

  this.rotateFlightRagdollAround(rig, target.x, target.y, launchAngleRad);
  this.setFlightRagdollPoseStabilizers(rig, {
    head,
    torso,
    pelvis,
    upperArmL,
    lowerArmL,
    handL,
    upperArmR,
    lowerArmR,
    handR,
    thighL,
    shinL,
    footL,
    thighR,
    shinR,
    footR
  });

  rig.parts.forEach((body) => {
    const name = body.ragdollPart || "";
    const isArm = /arm|hand/i.test(name);
    const isLeg = /thigh|shin|foot/i.test(name);
    const isTerminal = /hand|foot/i.test(name);
    const isThigh = /thigh/i.test(name);
    const isShin = /shin/i.test(name);
    const isUpperArm = /upperArm/i.test(name);
    const isLowerArm = /lowerArm/i.test(name);
    const isHand = /hand/i.test(name);
    const isLeft = /L$/.test(name);
    const side = isLeft ? -1 : 1;

    const baseVelocity = { x: 9.4, y: -6.6 };

    // Used for soft clamps and short impact chaos, not a constant motor.
    body.flailWeight = isArm
      ? isUpperArm ? 1.55 : isLowerArm ? 1.95 : 2.25
      : isLeg
        ? isThigh ? 1.10 : isShin ? 1.35 : 1.55
        : 0.2;

    body.flailPhase = Math.random() * Math.PI * 2;
    body.flailSide = side;
    body.flailTempo = Phaser.Math.FloatBetween(0.85, 1.25);
    body.limbChaosSign = isArm
      ? (isLeft ? -1 : 1) * (isLowerArm || isHand ? -1 : 1)
      : isLeg
        ? side * (isShin || isTerminal ? -1 : 1)
        : 0;
    body.limbChaosWeight = isArm
      ? isUpperArm ? 1.05 : isLowerArm ? 1.45 : 1.85
      : isLeg
        ? isThigh ? 0.80 : isShin ? 1.05 : 1.30
        : 0;

    // One natural launch separation. This gives asymmetry once, then physics takes over.
    // Do not throw the thigh body sideways: the hip anchor should stay locked to the pelvis.
    // Legs separate mostly by angular velocity around the hip, while shin/foot can get a small side drift.
    const legOutwardKick = isThigh
      ? side * Phaser.Math.FloatBetween(0.15, 0.45)
      : isLeg
        ? side * Phaser.Math.FloatBetween(0.45, 1.25)
        : 0;

    const armOutwardKick = isUpperArm
      ? side * Phaser.Math.FloatBetween(isLeft ? 1.5 : 2.2, isLeft ? 2.8 : 3.9)
      : isLowerArm
        ? side * Phaser.Math.FloatBetween(0.9, 2.1)
        : isHand
          ? side * Phaser.Math.FloatBetween(0.55, 1.45)
          : 0;

    const sideYBias = isThigh
      ? (isLeft ? Phaser.Math.FloatBetween(-0.35, 0.05) : Phaser.Math.FloatBetween(-0.95, -0.35))
      : isUpperArm
        ? (isLeft ? Phaser.Math.FloatBetween(-0.65, -0.15) : Phaser.Math.FloatBetween(0.05, 0.55))
        : 0;

    this.Matter.Body.setVelocity(body, {
      x: baseVelocity.x + Phaser.Math.FloatBetween(-0.45, 0.75) + legOutwardKick + armOutwardKick,
      y: baseVelocity.y
        + Phaser.Math.FloatBetween(isThigh ? -0.75 : -0.45, isThigh ? 0.10 : 0.42)
        + sideYBias
        + (isTerminal ? Phaser.Math.FloatBetween(-0.20, 0.18) : 0)
    });

    const maxStartSpin = body === rig.torso
      ? 0.30
      : isArm
        ? isUpperArm ? 1.75 : isTerminal ? 2.70 : 2.25
        : isLeg
          ? isThigh ? 0.70 : isTerminal ? 1.25 : 1.00
          : 0.20;

    if (body === rig.torso) {
      // Wheel spin is directed explicitly; torso physics spin stays small.
      this.Matter.Body.setAngularVelocity(body, 0.12);
      return;
    }

    let spinSign = Math.random() < 0.5 ? -1 : 1;
    if (isLeg) spinSign = side;
    if (isArm) spinSign = -side;

    const spinAsymmetry = isArm
      ? (isLeft ? 1.25 : 0.82)
      : (isLeft ? 0.78 : 1.12);

    const startSpin = Phaser.Math.FloatBetween(isArm ? 0.72 : isLeg ? 0.24 : 0.030, maxStartSpin) * spinSign * spinAsymmetry;

    if (isArm) {
      body.armImpactSign = spinSign;
      body.armImpactWeight = isUpperArm ? 1.0 : isLowerArm ? 1.22 : 1.42;
      body.armImpactPhase = Math.random() * Math.PI * 2;
    }

    this.Matter.Body.setAngularVelocity(body, startSpin);
  });
  this.syncFlightRagdollToDummy(true);

  // Random launch pose, so no-bounce crashes do not always land in the same silhouette.
  // Still controlled: +/-50 degrees, not a new spin impulse.
  const poseParts = rig.poseParts || {};
  const launchPoseJitterRad = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-50, 50));
  rig.launchPoseJitterDeg = Phaser.Math.RadToDeg(launchPoseJitterRad);
  if (Math.abs(launchPoseJitterRad) > 0.001 && rig.torso) {
    const pelvis = poseParts.pelvis;
    const pivot = pelvis
      ? {
          x: rig.torso.position.x * 0.60 + pelvis.position.x * 0.40,
          y: rig.torso.position.y * 0.60 + pelvis.position.y * 0.40
        }
      : (this.getTorsoSpinPivot(rig) || rig.torso.position);

    this.rotateFlightRagdollAround(rig, pivot.x, pivot.y, launchPoseJitterRad);

    // Match the initial angular state a little, but don't make the jitter a spin impulse.
    rig.parts.forEach((body) => {
      if (!body) return;
      this.Matter.Body.setAngularVelocity(body, (body.angularVelocity || 0) * 0.90);
    });
  }

  // Extra random arm silhouette on launch.
  // Rotate chains around their real shoulder/elbow/wrist anchors, so it does not look detached.
  const rotateBodyAround = (body, pivot, angleRad) => {
    if (!body || !pivot || !Number.isFinite(angleRad) || Math.abs(angleRad) < 0.0001) return;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = body.position.x - pivot.x;
    const dy = body.position.y - pivot.y;
    this.Matter.Body.setPosition(body, {
      x: pivot.x + dx * cos - dy * sin,
      y: pivot.y + dx * sin + dy * cos
    });
    this.Matter.Body.rotate(body, angleRad);
  };

  const syncPoseOffsetToCurrent = (body) => {
    if (!body || !body.poseInfo || !body.poseInfo.anchor) return;
    body.poseInfo.angleOffset = this.wrapRagdollAngle(body.angle - body.poseInfo.anchor.angle);
  };

  const randomizeArmChain = (upper, lower, hand, sideName) => {
    if (!upper || !lower || !hand) return;
    const shoulderAnchor = (upper.ragdollAnchorPoints || {}).shoulder || { x: 0, y: 0 };
    const elbowAnchorUpper = (upper.ragdollAnchorPoints || {}).elbow || { x: 0, y: 0 };
    const wristAnchorLower = (lower.ragdollAnchorPoints || {}).wrist || { x: 0, y: 0 };

    const shoulderPivot = this.ragdollWorldPoint(upper, shoulderAnchor);
    const upperDeg = Phaser.Math.FloatBetween(-58, 58);
    const lowerDeg = Phaser.Math.FloatBetween(-76, 76);
    const handDeg = Phaser.Math.FloatBetween(-48, 48);

    const upperRad = Phaser.Math.DegToRad(upperDeg);
    rotateBodyAround(upper, shoulderPivot, upperRad);
    rotateBodyAround(lower, shoulderPivot, upperRad);
    rotateBodyAround(hand, shoulderPivot, upperRad);

    const elbowPivot = this.ragdollWorldPoint(upper, elbowAnchorUpper);
    const lowerRad = Phaser.Math.DegToRad(lowerDeg);
    rotateBodyAround(lower, elbowPivot, lowerRad);
    rotateBodyAround(hand, elbowPivot, lowerRad);

    const wristPivot = this.ragdollWorldPoint(lower, wristAnchorLower);
    rotateBodyAround(hand, wristPivot, Phaser.Math.DegToRad(handDeg));

    [upper, lower, hand].forEach((body) => {
      syncPoseOffsetToCurrent(body);
      this.Matter.Body.setAngularVelocity(
        body,
        Phaser.Math.Clamp((body.angularVelocity || 0) + Phaser.Math.FloatBetween(-0.18, 0.18), -1.35, 1.35)
      );
    });

    rig["launchArmRandom" + sideName] = {
      upperDeg,
      lowerDeg,
      handDeg
    };
  };

  randomizeArmChain(poseParts.upperArmL, poseParts.lowerArmL, poseParts.handL, "L");
  randomizeArmChain(poseParts.upperArmR, poseParts.lowerArmR, poseParts.handR, "R");

  // Start the readable cartwheel immediately on the first visible frame.
  this.startRagdollWheelSpin(rig, {
    speedDeg: 420,
    cruiseDeg: 296,
    minDeg: 155,
    maxDeg: 545,
    damping: 0.052,
    blend: 1
  });
  rig.wheelSpinBurstUntil = this.time.now + 940;
  rig.wheelSpinBurstDuration = 940;
  rig.wheelSpinBurstDeg = 380;
  rig.wheelSpinBurstFrameDeg = 7.1;
  rig.wheelSpinBurstStepDeg = 38;
  rig.wheelSpinSmoothDeg = Math.max(Number(rig.wheelSpinSmoothDeg) || 0, 420);
  this.updateRagdollWheelSpin(16.6667);

  this.renderFlightRagdoll();
  return true;
}

getFlightRagdollPartMap(rig) {
  const map = {};
  (rig && rig.parts ? rig.parts : []).forEach((body) => {
    if (body && body.ragdollPart) map[body.ragdollPart] = body;
  });
  return map;
}

createFlightRagdollImageForBody(rig, body, layoutPart) {
  const info = body.renderInfo || {};
  if (!info.textureKey || !this.textures.exists(info.textureKey)) {
    if (rig.graphics) rig.graphics.setVisible(true);
    return;
  }
  const image = this.add.image(body.position.x, body.position.y, info.textureKey)
    .setOrigin(0.5)
    .setDepth(11 + (Number(info.layer) || 0) * 0.001)
    .setAlpha(1)
    .setScale(info.textureScale || 1);
  body.ragdollImage = image;
  rig.sprites.push(image);
}

getRagdollTorsoTarget(trackX, trackY) {
  return {
    x: trackX,
    y: trackY - 18
  };
}

rotateFlightRagdollAround(rig, centerX, centerY, angleRad) {
  if (!rig || !rig.parts || !angleRad) return;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  rig.parts.forEach((body) => {
    const dx = body.position.x - centerX;
    const dy = body.position.y - centerY;
    this.Matter.Body.setPosition(body, {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos
    });
    this.Matter.Body.rotate(body, angleRad);
  });
}

ragdollCollisionFilter(z) {
  const layers = this.ragdollCollisionLayers || {
    world: 0x0001,
    back: 0x0002,
    core: 0x0004,
    leftLeg: 0x0008,
    rightLeg: 0x0010,
    front: 0x0020,
    armUpperL: 0x0040,
    armLowerL: 0x0080,
    armHandL: 0x0100,
    armUpperR: 0x0200,
    armLowerR: 0x0400,
    armHandR: 0x0800
  };

  const zone = z === "body" ? "core" : z || "core";
  const category = layers[zone] || layers.core;

  // Core = head / torso / pelvis. Legs do NOT collide with core.
  // Arms collide only with the floor and their own upper-arm segment.
  if (zone === "core") {
    return {
      category,
      mask: layers.world | layers.core | layers.front | layers.back
    };
  }

  if (zone === "leftLeg") {
    return {
      category,
      mask: layers.world | layers.rightLeg
    };
  }

  if (zone === "rightLeg") {
    return {
      category,
      mask: layers.world | layers.leftLeg
    };
  }

  if (zone === "armUpperL") {
    return {
      category,
      mask: layers.world | layers.armLowerL | layers.armHandL
    };
  }

  if (zone === "armLowerL" || zone === "armHandL") {
    return {
      category,
      mask: layers.world | layers.armUpperL
    };
  }

  if (zone === "armUpperR") {
    return {
      category,
      mask: layers.world | layers.armLowerR | layers.armHandR
    };
  }

  if (zone === "armLowerR" || zone === "armHandR") {
    return {
      category,
      mask: layers.world | layers.armUpperR
    };
  }

  return {
    category,
    mask: layers.world | layers.core | layers.front | layers.back
  };
}

setFlightRagdollPoseStabilizers(rig, parts) {
  const pose = (body, anchor, strength, maxSpeed, limitDegrees, limitStrength) => {
    const limitTotal = Number(limitDegrees);
    body.poseInfo = {
      anchor,
      restAngle: body.angle,
      angleOffset: this.wrapRagdollAngle(body.angle - anchor.angle),
      strength,
      maxSpeed,
      limitRad: Number.isFinite(limitTotal) && limitTotal < 360 ? Phaser.Math.DegToRad(limitTotal * 0.5) : null,
      limitStrength: Number.isFinite(Number(limitStrength)) ? Number(limitStrength) : 0.26
    };
  };
  pose(parts.head, parts.torso, 0.044, 0.10, 135, 0.20);
  pose(parts.pelvis, parts.torso, 0.10, 0.16, 52, 0.38);

  pose(parts.upperArmL, parts.torso, 0.00004, 2.65, 360, 0.0005);
  pose(parts.lowerArmL, parts.upperArmL, 0.010, 1.18, 210, 0.058);
  pose(parts.handL, parts.lowerArmL, 0.008, 1.30, 190, 0.044);

  pose(parts.upperArmR, parts.torso, 0.00004, 2.85, 360, 0.0005);
  pose(parts.lowerArmR, parts.upperArmR, 0.009, 1.25, 210, 0.052);
  pose(parts.handR, parts.lowerArmR, 0.007, 1.38, 190, 0.040);

  // Fun ragdoll legs: soft spring-to-pose, strong only when they overfold too far.
  pose(parts.thighL, parts.pelvis, 0.010, 0.46, 285, 0.040);
  pose(parts.shinL, parts.thighL, 0.009, 0.50, 275, 0.034);
  pose(parts.footL, parts.shinL, 0.006, 0.56, 260, 0.026);

  pose(parts.thighR, parts.pelvis, 0.010, 0.48, 285, 0.040);
  pose(parts.shinR, parts.thighR, 0.009, 0.52, 275, 0.034);
  pose(parts.footR, parts.shinR, 0.006, 0.58, 260, 0.026);

  rig.poseParts = parts;
}

isRightArmProtectedJointName(name) {
  return /^(shoulder|shoulderBrace|elbow|elbowBrace|wrist|wristBrace)R$/.test(String(name || ""));
}

ragdollJointProfile(name) {
  if (this.isRightArmProtectedJointName(name)) {
    return { toughness: 12, weakness: 0, locked: true, protectedRightArm: true };
  }
  if (name.indexOf("wrist") !== -1 || name.indexOf("ankle") !== -1) {
    return { toughness: 0.28, weakness: 7.4 };
  }
  if (name.indexOf("knee") !== -1) {
    return { toughness: 0.76, weakness: 1.9 };
  }
  if (name.indexOf("elbow") !== -1) {
    return { toughness: 0.46, weakness: 4.35 };
  }
  if (name.indexOf("hip") !== -1) {
    return { toughness: 12, weakness: 0, locked: true };
  }
  if (name.indexOf("shoulder") !== -1 || name.indexOf("clavicle") !== -1) {
    return { toughness: 0.66, weakness: 2.55 };
  }
  if (name === "neck") {
    return { toughness: 1.22, weakness: 0.7 };
  }
  if (name.indexOf("spine") !== -1) {
    return { toughness: 12, weakness: 0, locked: true };
  }
  return { toughness: 1, weakness: 1 };
}

getFlightRagdollTextureWorldPoint(body) {
  if (!body) return { x: 0, y: 0 };
  const info = body.renderInfo || {};
  return this.ragdollWorldPoint(body, info.textureOffset || { x: 0, y: 0 });
}

rotateRagdollPoint(point, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  };
}

getFlightRagdollAnchorLocal(partName, anchorName) {
  const rig = this.flightRagdoll;
  if (rig && rig.legacyPose && rig.legacyPose.parts && rig.legacyPose.parts[partName]) {
    const part = rig.legacyPose.parts[partName];
    const anchor = part.anchors && part.anchors[anchorName];
    if (anchor) return { x: Number(anchor.x) || 0, y: Number(anchor.y) || 0 };
  }
  return { x: 0, y: 0 };
}

snapFlightRagdollToDummyPose() {
  const rig = this.flightRagdoll;
  if (!rig || !rig.parts || !this.dummy) return false;
  const target = this.getRagdollTorsoTarget(this.dummy.x, this.dummy.y);
  const trackAngleRad = Phaser.Math.DegToRad(this.dummy.angle || 0) + (rig.trackAngleOffsetRad || 0);
  const poseCos = Math.cos(trackAngleRad);
  const poseSin = Math.sin(trackAngleRad);
  rig.parts.forEach((body) => {
    const pose = body.ragdollPose;
    const info = body.renderInfo || {};
    if (!pose) return;
    const poseOffset = pose.textureOffsetFromTorso || { x: 0, y: 0 };
    const textureX = target.x + poseOffset.x * poseCos - poseOffset.y * poseSin;
    const textureY = target.y + poseOffset.x * poseSin + poseOffset.y * poseCos;
    const bodyAngle = trackAngleRad + (pose.bodyAngleOffset || 0);
    const textureOffset = info.textureOffset || { x: 0, y: 0 };
    const bodyCos = Math.cos(bodyAngle);
    const bodySin = Math.sin(bodyAngle);
    this.Matter.Body.setPosition(body, {
      x: textureX - (textureOffset.x * bodyCos - textureOffset.y * bodySin),
      y: textureY - (textureOffset.x * bodySin + textureOffset.y * bodyCos)
    });
    this.Matter.Body.setAngle(body, bodyAngle);
    this.Matter.Body.setVelocity(body, { x: 0, y: 0 });
    this.Matter.Body.setAngularVelocity(body, 0);
  });
  if (rig.anchor) this.Matter.Body.setPosition(rig.anchor, target);
  rig.lastTarget.x = target.x;
  rig.lastTarget.y = target.y;
  rig.lastTrackAngleRad = trackAngleRad + ((rig.torso && rig.torso.ragdollPose && rig.torso.ragdollPose.bodyAngleOffset) || 0);
  return true;
}

syncFlightRagdollToDummy(force) {
  const rig = this.flightRagdoll;
  if (!rig || !rig.anchor || !this.dummy) return;
  if (rig.settling && !force) return;

  const target = this.getRagdollTorsoTarget(this.dummy.x, this.dummy.y);
  const dx = target.x - rig.lastTarget.x;
  const dy = target.y - rig.lastTarget.y;
  const trackAngleRad = Phaser.Math.DegToRad(this.dummy.angle || 0) + (rig.trackAngleOffsetRad || 0);
  const trackSpin = this.wrapRagdollAngle(trackAngleRad - rig.lastTrackAngleRad);

  this.Matter.Body.setPosition(rig.anchor, target);

  if (force && rig.torso) {
    const diffX = target.x - rig.torso.position.x;
    const diffY = target.y - rig.torso.position.y;
    rig.parts.forEach((body) => this.Matter.Body.translate(body, { x: diffX, y: diffY }));
  } else if (rig.torso) {
    const errorX = target.x - rig.torso.position.x;
    const errorY = target.y - rig.torso.position.y;
    const dist = Math.sqrt(errorX * errorX + errorY * errorY);

    if (dist > 130) {
      this.Matter.Body.translate(rig.torso, { x: errorX * 0.18, y: errorY * 0.18 });
    }

    this.Matter.Body.setVelocity(rig.torso, {
      x: Phaser.Math.Clamp(dx * 0.58 + errorX * 0.038, -42, 42),
      y: Phaser.Math.Clamp(dy * 0.58 + errorY * 0.038, -42, 42)
    });
  }

  if (rig.torso) {
    const wheelActive = !!rig.wheelSpinActive && !rig.settling;
    const maxAngular = wheelActive ? 1.35 : Number(rig.torsoSpinMaxAngular) || 1.05;

    if (wheelActive) {
      // Cartwheel director owns visual rotation. Do not let path-following kill it.
      this.Matter.Body.setAngularVelocity(
        rig.torso,
        Phaser.Math.Clamp((rig.torso.angularVelocity || 0) * 0.985, -0.20, 0.20)
      );
    } else {
      const angleError = this.wrapRagdollAngle(trackAngleRad - rig.torso.angle);
      const followEase = rig.followEaseUntil
        ? Phaser.Math.Clamp((this.time.now - (rig.createdAt || this.time.now)) / Math.max(1, rig.followEaseUntil - (rig.createdAt || this.time.now)), 0, 1)
        : 1;
      const angularFollow = Phaser.Math.Clamp(angleError * 0.10 + trackSpin * 0.36, -0.36, 0.36)
        * Phaser.Math.Easing.Sine.InOut(followEase)
        * 0.45;

      this.Matter.Body.setAngularVelocity(
        rig.torso,
        Phaser.Math.Clamp(rig.torso.angularVelocity * 0.88 + angularFollow, rig.settling ? -maxAngular : 0, maxAngular)
      );
    }
  }

  rig.lastTarget.x = target.x;
  rig.lastTarget.y = target.y;
  rig.lastTrackAngleRad = trackAngleRad;
}



getTorsoSpinPivot(rig) {
  if (!rig || !rig.torso) return null;
  const offsetY = Number(rig.torsoSpinPivotYOffset);
  const local = { x: 0, y: Number.isFinite(offsetY) ? offsetY : 14 };
  const rotated = this.rotateRagdollPoint(local, rig.torso.angle || 0);
  return {
    x: rig.torso.position.x + rotated.x,
    y: rig.torso.position.y + rotated.y
  };
}

applyImmediateTorsoSpinKick(rig, options) {
  if (!rig || !rig.torso || rig.settling || rig.settleLocked) return;
  const opts = options || {};
  const angularVelocity = Number(opts.angularVelocity);
  const angleNudge = Number(opts.angleNudge);
  const boostDuration = Number(opts.boostDuration);
  const boostPower = Number(opts.boostPower);
  const maxAngular = Number(opts.maxAngular);

  if (Number.isFinite(boostDuration) && boostDuration > 0) {
    rig.torsoSpinBoostDuration = boostDuration;
    rig.torsoSpinBoostUntil = this.time.now + boostDuration;
  }
  if (Number.isFinite(boostPower)) rig.torsoSpinBoostPower = boostPower;
  if (Number.isFinite(maxAngular)) rig.torsoSpinMaxAngular = maxAngular;

  if (Number.isFinite(angularVelocity)) {
    this.Matter.Body.setAngularVelocity(
      rig.torso,
      Phaser.Math.Clamp(Math.max(rig.torso.angularVelocity || 0, angularVelocity), 0, Number(rig.torsoSpinMaxAngular) || Number(rig.torsoCruiseSpinMax) || 1.2)
    );
  }

  if (Number.isFinite(angleNudge) && angleNudge !== 0) {
    const pivot = this.getTorsoSpinPivot(rig);
    if (pivot) this.rotateFlightRagdollAround(rig, pivot.x, pivot.y, angleNudge);
  }
}
startRagdollWheelSpin(rig, options) {
  if (!rig || !rig.torso) return;
  const opts = options || {};
  rig.wheelSpinActive = true;
  rig.wheelSpinDirection = Number(opts.direction) || rig.wheelSpinDirection || 1;
  rig.wheelSpinCruiseDeg = Number.isFinite(Number(opts.cruiseDeg)) ? Number(opts.cruiseDeg) : (rig.wheelSpinCruiseDeg || 620);
  rig.wheelSpinMaxDeg = Number.isFinite(Number(opts.maxDeg)) ? Number(opts.maxDeg) : (rig.wheelSpinMaxDeg || 940);
  rig.wheelSpinMinDeg = Number.isFinite(Number(opts.minDeg)) ? Number(opts.minDeg) : (rig.wheelSpinMinDeg || 520);
  rig.wheelSpinDamping = Number.isFinite(Number(opts.damping)) ? Number(opts.damping) : (rig.wheelSpinDamping || 0.018);

  const speed = Number.isFinite(Number(opts.speedDeg)) ? Number(opts.speedDeg) : (rig.wheelSpinSpeedDeg || rig.wheelSpinCruiseDeg);
  const blend = Phaser.Math.Clamp(Number(opts.blend), 0.05, 1) || 1;
  rig.wheelSpinSpeedDeg = Phaser.Math.Linear(rig.wheelSpinSpeedDeg || speed, speed, blend);
  rig.wheelSpinSmoothDeg = Number.isFinite(Number(rig.wheelSpinSmoothDeg))
    ? Phaser.Math.Linear(rig.wheelSpinSmoothDeg, rig.wheelSpinSpeedDeg, 0.35)
    : rig.wheelSpinSpeedDeg;
}

addRagdollWheelSpinImpulse(rig, options) {
  if (!rig || !rig.torso) return;
  const opts = options || {};
  this.startRagdollWheelSpin(rig, opts);

  const impulse = Number(opts.impulseDeg) || 0;
  const maxDeg = Number(rig.wheelSpinMaxDeg) || 430;
  const current = Number(rig.wheelSpinSpeedDeg) || Number(rig.wheelSpinCruiseDeg) || 260;
  // Soft additive boost with a low ceiling; no runaway wheel spin.
  rig.wheelSpinSpeedDeg = Phaser.Math.Clamp(current + impulse * 0.72, Number(rig.wheelSpinMinDeg) || 160, maxDeg);

  const chaosMs = Number(opts.chaosMs) || 980;
  const chaosPower = Number(opts.chaosPower) || 1.05;
  rig.limbChaosUntil = this.time.now + chaosMs;
  rig.limbChaosDuration = chaosMs;
  rig.limbChaosPower = chaosPower;

  const burstMs = Number(opts.burstMs) || 0;
  const burstDeg = Number(opts.burstDeg) || 0;
  if (burstMs > 0 && burstDeg > 0) {
    rig.wheelSpinBurstUntil = this.time.now + burstMs;
    rig.wheelSpinBurstDuration = burstMs;
    rig.wheelSpinBurstDeg = burstDeg;
    rig.wheelSpinBurstFrameDeg = Number.isFinite(Number(opts.burstFrameDeg)) ? Number(opts.burstFrameDeg) : 1.25;
    rig.wheelSpinBurstStepDeg = Number.isFinite(Number(opts.burstStepDeg)) ? Number(opts.burstStepDeg) : 18;
  }
}

stopRagdollWheelSpin(rig, options) {
  if (!rig || !rig.parts) return;
  const opts = options || {};
  rig.wheelSpinActive = false;
  rig.wheelSpinSpeedDeg = 0;
  rig.wheelSpinCruiseDeg = 0;
  rig.torsoSpinBoostUntil = 0;

  // Whole-body wheel rotation is killed, but limbs keep some floppy chaos.
  rig.parts.forEach((body) => {
    const name = body.ragdollPart || "";
    const isCore = /torso|pelvis|head/i.test(name);
    const isLimb = /arm|hand|thigh|shin|foot/i.test(name);
    if (isCore) {
      this.Matter.Body.setAngularVelocity(body, (body.angularVelocity || 0) * (opts.hard ? 0.08 : 0.18));
    } else if (isLimb) {
      this.Matter.Body.setAngularVelocity(body, (body.angularVelocity || 0) * (opts.hard ? 0.55 : 0.72));
    }
  });
}

updateRagdollWheelSpin(delta) {
  const rig = this.flightRagdoll;
  if (!rig || !rig.torso || !rig.wheelSpinActive || rig.settling || rig.settleLocked) return;

  const dtMs = delta || 16.6667;
  const dt = Phaser.Math.Clamp(dtMs / 16.6667, 0.4, 2);
  const dtSec = dtMs / 1000;

  const minDeg = Number(rig.wheelSpinMinDeg) || 155;
  const maxDeg = Number(rig.wheelSpinMaxDeg) || 400;
  const cruiseDeg = Number(rig.wheelSpinCruiseDeg) || 245;
  const direction = Number(rig.wheelSpinDirection) || 1;
  const burstT = rig.wheelSpinBurstUntil
    ? Phaser.Math.Clamp((rig.wheelSpinBurstUntil - this.time.now) / Math.max(1, rig.wheelSpinBurstDuration || 1), 0, 1)
    : 0;
  const burstEase = burstT * burstT;
  const burstDeg = (Number(rig.wheelSpinBurstDeg) || 0) * burstEase;
  const burstFrameDeg = Number(rig.wheelSpinBurstFrameDeg) || 1.25;
  const burstStepDeg = Number(rig.wheelSpinBurstStepDeg) || 18;

  let targetSpeed = Phaser.Math.Clamp(Number(rig.wheelSpinSpeedDeg) || cruiseDeg, minDeg, maxDeg);

  // Damping back to cruise, but the rendered speed is separately smoothed below.
  const damping = Number(rig.wheelSpinDamping) || 0.052;
  targetSpeed = Phaser.Math.Linear(targetSpeed, cruiseDeg, Phaser.Math.Clamp(damping * dt, 0.010, 0.100));
  rig.wheelSpinSpeedDeg = Phaser.Math.Clamp(targetSpeed, minDeg, maxDeg);
  const renderTargetSpeed = rig.wheelSpinSpeedDeg + burstDeg;
  const renderMaxDeg = maxDeg + burstDeg * 0.55;

  // Extra smooth layer: prevents "peak of arc snap" when a bounce/bonus changes speed.
  const prevSmooth = Number.isFinite(Number(rig.wheelSpinSmoothDeg)) ? Number(rig.wheelSpinSmoothDeg) : rig.wheelSpinSpeedDeg;
  const maxStep = (11.5 + burstT * burstStepDeg) * dt; // deg/sec per frame
  const smoothSpeed = Phaser.Math.Clamp(
    prevSmooth + Phaser.Math.Clamp(renderTargetSpeed - prevSmooth, -maxStep, maxStep),
    minDeg,
    renderMaxDeg
  );
  rig.wheelSpinSmoothDeg = smoothSpeed;

  const rawAngle = Phaser.Math.DegToRad(smoothSpeed * dtSec * direction);
  const maxFrameAngle = Phaser.Math.DegToRad(2.90 + burstT * burstFrameDeg) * dt;
  const angle = Phaser.Math.Clamp(rawAngle, -maxFrameAngle, maxFrameAngle);
  if (!Number.isFinite(angle) || Math.abs(angle) < 0.0001) return;

  const parts = rig.poseParts || {};
  const pelvis = parts.pelvis;
  const pivot = pelvis
    ? {
        x: rig.torso.position.x * 0.60 + pelvis.position.x * 0.40,
        y: rig.torso.position.y * 0.60 + pelvis.position.y * 0.40
      }
    : { x: rig.torso.position.x, y: rig.torso.position.y };

  const connected = this.getFlightRagdollConnectedParts(rig.torso);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  connected.forEach((body) => {
    if (!body || body.detachedRagdoll) return;

    const dx = body.position.x - pivot.x;
    const dy = body.position.y - pivot.y;
    this.Matter.Body.setPosition(body, {
      x: pivot.x + dx * cos - dy * sin,
      y: pivot.y + dx * sin + dy * cos
    });
    this.Matter.Body.rotate(body, angle);

    const name = body.ragdollPart || "";
    const isCore = /torso|pelvis|head/i.test(name);
    if (isCore) {
      this.Matter.Body.setAngularVelocity(body, Phaser.Math.Clamp(body.angularVelocity * 0.84 + angle * 0.12, -0.16, 0.16));
    }
  });
}

applyTorsoCruiseSpin(rig, delta, phase) {
  // Whole-body rotation is now handled by updateRagdollWheelSpin.
  // Keep this as a very small fallback only when cartwheel mode is off.
  if (!rig || !rig.torso || rig.wheelSpinActive || rig.settling || rig.settleLocked) return;
  const dt = Phaser.Math.Clamp((delta || 16.6667) / 16.6667, 0.4, 2);
  const current = rig.torso.angularVelocity || 0;
  this.Matter.Body.setAngularVelocity(rig.torso, Phaser.Math.Clamp(current * Math.pow(0.92, dt), -0.42, 0.42));
}
updateFlightRagdoll(delta) {
  const rig = this.flightRagdoll;
  if (!rig) return;
  if (this.state === "dummyFlight") this.syncFlightRagdollToDummy(false);
  this.flailFlightRagdoll(delta);
  this.updateDetachedFlightRagdollParts(delta);
  this.preventFlightRagdollBodyClump(delta);
  this.stabilizeFlightRagdoll();
  this.checkFlightRagdollJointStress();

  // Cinematic cartwheel pass: consistent whole-body spin, independent from noisy contacts.
  this.updateRagdollWheelSpin(delta);
  this.keepFlightRagdollLegHinges(delta);
  this.settleFlightRagdoll(delta);

  this.renderFlightRagdoll();
}

getFlightRagdollSpinBoostT(rig) {
  if (!rig || !rig.torsoSpinBoostUntil || this.time.now >= rig.torsoSpinBoostUntil) return 0;
  return Phaser.Math.Clamp((rig.torsoSpinBoostUntil - this.time.now) / Math.max(1, rig.torsoSpinBoostDuration || 1), 0, 1);
}

flailFlightRagdoll(delta) {
  const rig = this.flightRagdoll;
  if (!rig || rig.settling || !rig.parts) return;

  const dt = Phaser.Math.Clamp((delta || 16.6667) / 16.6667, 0.4, 2);
  const connected = this.getFlightRagdollConnectedParts(rig.torso);
  const spreadT = rig.legSpreadUntil
    ? Phaser.Math.Clamp((rig.legSpreadUntil - this.time.now) / Math.max(1, rig.legSpreadDuration || 1), 0, 1)
    : 0;

  // Smooth constant clockwise torso spin.
  if (rig.torso && rig.torsoCruiseSpin && connected.has(rig.torso)) {
    const boostT = this.getFlightRagdollSpinBoostT(rig);
    const baseTarget = Number(rig.torsoCruiseSpinTarget) || 0.48;
    const boostPower = Number(rig.torsoSpinBoostPower) || 0;
    const targetSpin = Phaser.Math.Clamp(
      baseTarget + boostPower * boostT,
      0.24,
      Number(rig.torsoCruiseSpinMax) || 1.05
    );
    const gain = Phaser.Math.Clamp((Number(rig.torsoCruiseSpinGain) || 0.030) * dt, 0.006, 0.070);
    const nextSpin = Phaser.Math.Linear(rig.torso.angularVelocity || 0, targetSpin, gain);

    this.Matter.Body.setAngularVelocity(
      rig.torso,
      Phaser.Math.Clamp(nextSpin, 0, Number(rig.torsoCruiseSpinMax) || 1.05)
    );
  }

  const parts = rig.poseParts || {};
  const pelvis = parts.pelvis;
  const head = parts.head;

  const applyLegPoseSpring = (body, cfg) => {
    if (!body || !connected.has(body)) return;
    const pose = body.poseInfo;
    const anchor = pose && pose.anchor;
    if (!pose || !anchor || !this.hasFlightRagdollJointBetween(body, anchor)) return;

    const targetAngle = anchor.angle + pose.angleOffset;
    const deltaAngle = this.wrapRagdollAngle(body.angle - targetAngle);
    const absDelta = Math.abs(deltaAngle);

    // Allow big motion from ground hits, but once the leg is too folded,
    // smoothly increase spring pressure back toward the initial pose.
    const softStart = Phaser.Math.DegToRad(cfg.softStartDeg);
    const hardStart = Phaser.Math.DegToRad(cfg.hardStartDeg);
    const softT = Phaser.Math.Clamp((absDelta - softStart) / Math.max(0.001, hardStart - softStart), 0, 1);
    const smoothT = softT * softT * (3 - 2 * softT);
    const limitRad = Phaser.Math.DegToRad(cfg.limitDeg || cfg.hardStartDeg || 90);
    const overLimit = Math.max(0, absDelta - limitRad);
    const limitT = Phaser.Math.Clamp(overLimit / Phaser.Math.DegToRad(cfg.limitFadeDeg || 42), 0, 1);
    body.legFoldGuard = Math.max(smoothT, limitT);

    const speed = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);
    const impactSlack = Phaser.Math.Clamp((speed - 8) / 18, 0, 1);
    const chaosT = rig.limbChaosUntil
      ? Phaser.Math.Clamp((rig.limbChaosUntil - this.time.now) / Math.max(1, rig.limbChaosDuration || 1), 0, 1)
      : 0;
    const chaosSlack = chaosT * (Number(rig.limbChaosPower) || 0) * (1 - smoothT * 0.80);

    // Leg springs must win over chaos; otherwise the dummy folds like a book.
    const springK = cfg.spring * (1 + smoothT * cfg.extraSpring) * (1 - impactSlack * 0.08) * (1 - chaosSlack * 0.08);
    const dampingK = cfg.damping * (1 + smoothT * 1.45);
    const desired = -deltaAngle * springK - body.angularVelocity * dampingK;

    const maxKick = cfg.maxKick * (1 + smoothT * 2.20 + limitT * (cfg.limitKickBoost || 1.85));
    const kick = Phaser.Math.Clamp(desired, -maxKick, maxKick) * dt;

    const maxSpin = (body.renderInfo && body.renderInfo.maxSpin) || cfg.maxSpin;
    const passiveDamping = Phaser.Math.Linear(cfg.passiveDamping, cfg.foldDamping, Math.max(smoothT, limitT));
    this.Matter.Body.setAngularVelocity(
      body,
      Phaser.Math.Clamp((body.angularVelocity + kick) * passiveDamping, -maxSpin, maxSpin)
    );
  };

  const applyLegSprings = (sideName) => {
    const parts = rig.poseParts || {};
    applyLegPoseSpring(parts["thigh" + sideName], {
      spring: 0.118,
      extraSpring: 5.40,
      damping: 0.315,
      maxKick: 0.145,
      maxSpin: 0.62,
      softStartDeg: 10,
      hardStartDeg: 54,
      limitDeg: 82,
      limitFadeDeg: 28,
      limitKickBoost: 2.65,
      passiveDamping: 0.915,
      foldDamping: 0.625
    });
    applyLegPoseSpring(parts["shin" + sideName], {
      spring: 0.094,
      extraSpring: 4.70,
      damping: 0.270,
      maxKick: 0.112,
      maxSpin: 0.72,
      softStartDeg: 14,
      hardStartDeg: 62,
      limitDeg: 76,
      limitFadeDeg: 30,
      limitKickBoost: 2.20,
      passiveDamping: 0.916,
      foldDamping: 0.680
    });
    applyLegPoseSpring(parts["foot" + sideName], {
      spring: 0.052,
      extraSpring: 3.25,
      damping: 0.190,
      maxKick: 0.074,
      maxSpin: 0.84,
      softStartDeg: 20,
      hardStartDeg: 82,
      limitDeg: 84,
      limitFadeDeg: 34,
      limitKickBoost: 1.75,
      passiveDamping: 0.918,
      foldDamping: 0.735
    });
  };

  applyLegSprings("L");
  applyLegSprings("R");

  // Airborne left/right desync:
  // if paired limbs become too parallel, give them opposite drift and a tiny immediate angle offset.
  // This runs only in flight; after final landing it is off, so it won't shake on the floor.
  if (!rig.settling && rig.wheelSpinActive) {
    const connectedNow = this.getFlightRagdollConnectedParts(rig.torso);

    const deSyncPair = (left, right, parent, cfg) => {
      if (!left || !right || !parent) return;
      if (!connectedNow.has(left) || !connectedNow.has(right)) return;

      const localL = this.wrapRagdollAngle(left.angle - parent.angle);
      const localR = this.wrapRagdollAngle(right.angle - parent.angle);
      const signedDiff = this.wrapRagdollAngle(localL - localR);
      const diff = Math.abs(signedDiff);
      const sameSpin = Math.sign(left.angularVelocity || 0) === Math.sign(right.angularVelocity || 0);
      const trigger = Phaser.Math.DegToRad(cfg.triggerDeg || 44);
      const strong = Phaser.Math.DegToRad(cfg.strongDeg || 24);

      if (diff < strong || (sameSpin && diff < trigger)) {
        const pushT = Phaser.Math.Clamp(1 - diff / trigger, 0, 1);
        const sign = signedDiff >= 0 ? 1 : -1;
        const avPush = (cfg.av || 0.034) * dt * (0.35 + pushT);
        const direct = (cfg.direct || 0.0045) * dt * pushT;

        this.Matter.Body.setAngularVelocity(
          left,
          Phaser.Math.Clamp((left.angularVelocity || 0) + sign * avPush, -(cfg.max || 0.85), cfg.max || 0.85)
        );
        this.Matter.Body.setAngularVelocity(
          right,
          Phaser.Math.Clamp((right.angularVelocity || 0) - sign * avPush, -(cfg.max || 0.85), cfg.max || 0.85)
        );

        if (direct > 0.0001) {
          this.Matter.Body.rotate(left, sign * direct);
          this.Matter.Body.rotate(right, -sign * direct);
        }
      }
    };

    deSyncPair(parts.thighL, parts.thighR, parts.pelvis, {
      triggerDeg: 58,
      strongDeg: 34,
      av: 0.014,
      direct: 0,
      max: 0.36
    });

    deSyncPair(parts.upperArmL, parts.upperArmR, parts.torso, {
      triggerDeg: 64,
      strongDeg: 38,
      av: 0.050,
      direct: 0.0075,
      max: 1.20
    });

    deSyncPair(parts.lowerArmL, parts.lowerArmR, parts.torso, {
      triggerDeg: 66,
      strongDeg: 40,
      av: 0.055,
      direct: 0.0080,
      max: 1.35
    });
  }

  rig.parts.forEach((body) => {
    if (body === rig.torso) return;
    if (!connected.has(body)) return;

    const partName = body.ragdollPart || "";
    const isLeg = /thigh|shin|foot/i.test(partName);
    const isThigh = /thigh/i.test(partName);
    const isShin = /shin/i.test(partName);
    const isFoot = /foot/i.test(partName);
    const isArm = /arm|hand/i.test(partName);
    const isUpperArm = /upperArm/i.test(partName);
    const isLowerArm = /lowerArm/i.test(partName);
    const isHand = /hand/i.test(partName);
    const side = body.flailSide || (/L$/.test(partName) ? -1 : 1);
    const maxSpin = (body.renderInfo && body.renderInfo.maxSpin) || (isArm ? 1.55 : isLeg ? 0.7 : 0.88);
    const legFoldGuard = isLeg ? Phaser.Math.Clamp(Number(body.legFoldGuard) || 0, 0, 1) : 0;

    // Short decaying arm-only impact spin. This is not a rhythmic motor:
    // it only fades after launch/impact, so left and right arms do not freeze in one pose.
    if (isArm) {
      const launchAge = Math.max(0, this.time.now - (rig.createdAt || this.time.now));
      const launchT = Phaser.Math.Clamp(1 - launchAge / 1150, 0, 1);
      const impactT = rig.armImpactUntil
        ? Phaser.Math.Clamp((rig.armImpactUntil - this.time.now) / Math.max(1, rig.armImpactDuration || 1), 0, 1)
        : 0;
      const impactPower = Number(rig.armImpactPower) || 0;
      const sign = body.armImpactSign || (side * (isUpperArm ? -1 : 1));
      const weight = body.armImpactWeight || (isUpperArm ? 1.0 : isLowerArm ? 1.2 : 1.35);
      const launchKick = launchT * launchT * 0.038;
      const impactKick = impactT * impactT * impactPower * 0.060;
      const torque = sign * weight * (launchKick + impactKick) * dt;

      this.Matter.Body.setAngularVelocity(
        body,
        Phaser.Math.Clamp(body.angularVelocity + torque, -maxSpin, maxSpin)
      );
    }

    // Short decaying chaos torque after launch / ground / bonus.
    // This is the "funny floppy hinge" layer: no invisible blockers, no constant motor.
    if (isArm || isLeg) {
      const impactChaosT = rig.limbChaosUntil
        ? Phaser.Math.Clamp((rig.limbChaosUntil - this.time.now) / Math.max(1, rig.limbChaosDuration || 1), 0, 1)
        : 0;
      const wheelChaosT = rig.wheelSpinActive ? (isLeg ? 0.085 * (1 - legFoldGuard * 0.88) : 0.36) : 0;
      const chaosT = Math.max(impactChaosT, wheelChaosT);

      if (chaosT > 0) {
        const power = Math.max(Number(rig.limbChaosPower) || 0, rig.wheelSpinActive ? 0.82 : 0);
        const ease = impactChaosT > 0 ? impactChaosT * impactChaosT : wheelChaosT;
        const weight = body.limbChaosWeight || (isArm ? 1.2 : 0.85);
        const sign = body.limbChaosSign || side;
        const limbScale = isArm
          ? isHand ? 0.074 : isLowerArm ? 0.062 : 0.047
          : (isFoot ? 0.020 : isShin ? 0.017 : 0.012) * (1 - legFoldGuard * 0.86);

        this.Matter.Body.setAngularVelocity(
          body,
          Phaser.Math.Clamp(body.angularVelocity + sign * limbScale * weight * power * ease * dt, -maxSpin, maxSpin)
        );
      }
    }

    // Smooth opening at launch.
    // For thighs this is angular-only: no thigh translation, no anchor drift.
    if (spreadT > 0 && (isThigh || isUpperArm || isLowerArm || isHand)) {
      const ease = Phaser.Math.Easing.Sine.Out(spreadT);
      const weight = Phaser.Math.Clamp(body.flailWeight || 1, 0.35, 2.2);

      if (isThigh) {
        const spin = 0.0031 * (1 - legFoldGuard * 0.86);
        this.Matter.Body.setAngularVelocity(
          body,
          Phaser.Math.Clamp(body.angularVelocity + side * spin * weight * ease * dt, -maxSpin, maxSpin)
        );
      } else {
        const push = isUpperArm ? 0.032 : isLowerArm ? 0.020 : 0.014;
        const lift = isUpperArm ? -0.002 : 0;
        const spin = isUpperArm ? 0.0060 : isLowerArm ? 0.0046 : 0.0032;

        this.Matter.Body.setVelocity(body, {
          x: Phaser.Math.Clamp(body.velocity.x + side * push * weight * ease * dt, -18, 18),
          y: Phaser.Math.Clamp(body.velocity.y + lift * weight * ease * dt, -18, 18)
        });

        this.Matter.Body.setAngularVelocity(
          body,
          Phaser.Math.Clamp(body.angularVelocity + side * spin * weight * ease * dt, -maxSpin, maxSpin)
        );
      }
    }

    if (isLeg) {
      // Leg springs already damp folded poses; here we only clamp extreme spin.
      this.Matter.Body.setAngularVelocity(
        body,
        Phaser.Math.Clamp(body.angularVelocity, -maxSpin, maxSpin)
      );
    } else if (Math.abs(body.angularVelocity) > maxSpin) {
      this.Matter.Body.setAngularVelocity(
        body,
        Phaser.Math.Clamp(body.angularVelocity, -maxSpin, maxSpin)
      );
    }
  });
}

settleFlightRagdoll(delta) {
  const rig = this.flightRagdoll;
  if (!rig || !rig.settling || !rig.parts) return;
  if (rig.settleLocked) return;

  const dt = Phaser.Math.Clamp((delta || 16.6667) / 16.6667, 0.4, 2);
  const elapsed = this.time.now - (rig.settleStartedAt || this.time.now);
  const floorY = rig.settleFloorY || this.getGameplayGroundY();
  const lockDelay = rig.settleLockDelay || 420;
  const finalPop = !!rig.finalLandingPopActive;
  const settleT = Phaser.Math.Clamp(elapsed / lockDelay, 0, 1);
  const settleEase = Phaser.Math.Easing.Sine.Out(settleT);
  const allNearFloor = rig.parts.every((body) => this.getFlightRagdollBottomY(body) >= floorY - 38);

  if (finalPop) {
    const alignT = Phaser.Math.Clamp(elapsed / 360, 0, 1);
    const alignPower = 1 - Phaser.Math.Easing.Sine.In(alignT);
    if (alignPower > 0.02) {
      this.alignFlightRagdollFinalHop(delta, alignPower);
    }
    if (elapsed > 360 && !rig.finalLandingJointsRelaxed) {
      this.relaxFlightRagdollFinalLandingJoints(rig);
      rig.finalLandingJointsRelaxed = true;
      rig.finalLandingRelaxed = true;
    }
  }

  // Final landing rule: small align-hop, relaxed drop, then hard stop. No snap into pose on lock.
  if (finalPop && ((elapsed > 680 && allNearFloor) || elapsed > 900)) {
    rig.parts.forEach((body) => {
      const bottomY = this.getFlightRagdollBottomY(body);
      const overlap = bottomY - floorY;
      if (overlap > 0) this.Matter.Body.translate(body, { x: 0, y: -Math.min(8, overlap + 1) });
      this.Matter.Body.setVelocity(body, { x: 0, y: 0 });
      this.Matter.Body.setAngularVelocity(body, 0);
    });
    this.lockFlightRagdollOnGround(rig, { relaxed: true });
    return;
  }

  if (!finalPop && ((elapsed >= lockDelay && allNearFloor) || elapsed > 760)) {
    this.lockFlightRagdollOnGround(rig);
    return;
  }

  rig.parts.forEach((body) => {
    const name = body.ragdollPart || "";
    const isArm = /arm|hand/i.test(name);
    const bottomY = this.getFlightRagdollBottomY(body);
    const nearGround = bottomY >= floorY - 14;

    let vx = body.velocity.x || 0;
    let vy = body.velocity.y || 0;
    let av = body.angularVelocity || 0;

    if (finalPop) {
      if (elapsed < 360) {
        const hopT = Phaser.Math.Clamp(elapsed / 360, 0, 1);
        const hopEase = Phaser.Math.Easing.Sine.InOut(hopT);
        vx = Math.max(0, vx) * Math.pow(Phaser.Math.Linear(0.92, 0.62, hopEase), dt);
        vy = Phaser.Math.Clamp(vy + Phaser.Math.Linear(0.18, 0.72, hopEase) * dt, -3.6, 8);
        av *= Math.pow(Phaser.Math.Linear(0.54, 0.72, hopEase), dt);
      } else {
        const relaxT = Phaser.Math.Clamp((elapsed - 360) / 320, 0, 1);
        const relaxEase = Phaser.Math.Easing.Sine.Out(relaxT);
        vx = Math.abs(vx) < 0.18 ? 0 : vx * Math.pow(Phaser.Math.Linear(0.58, 0.18, relaxEase), dt);

        if (nearGround) {
          const overlap = bottomY - floorY;
          if (overlap > 2) this.Matter.Body.translate(body, { x: 0, y: -Math.min(5, overlap * 0.40) });
          vy = Math.abs(vy) < 0.18 ? 0 : vy * Math.pow(Phaser.Math.Linear(0.42, 0.12, relaxEase), dt);
          av = Math.abs(av) < 0.05 ? 0 : av * Math.pow(isArm ? 0.24 : 0.32, dt);
        } else {
          vy = Phaser.Math.Clamp(vy + Phaser.Math.Linear(0.82, 1.45, relaxEase) * dt, -1.8, 12);
          av *= Math.pow(Phaser.Math.Linear(0.82, 0.55, relaxEase), dt);
        }
      }

      this.Matter.Body.setVelocity(body, { x: Math.max(0, vx), y: vy });
      this.Matter.Body.setAngularVelocity(body, av);
      return;
    }

    const vxDamp = nearGround
      ? Phaser.Math.Linear(0.22, 0.035, settleEase)
      : Phaser.Math.Linear(0.54, 0.32, settleEase);

    vx = Math.abs(vx) < (nearGround ? 0.14 : 0.05) ? 0 : vx * Math.pow(vxDamp, dt);

    if (nearGround) {
      const yDamp = Phaser.Math.Linear(0.34, 0.12, settleEase);
      vy = Math.abs(vy) < 0.2 ? 0 : vy * Math.pow(yDamp, dt);
      if (elapsed > 340 && Math.abs(vx) < 0.42) vx = 0;
    } else {
      vy = Phaser.Math.Clamp(vy + Phaser.Math.Linear(1.35, 2.15, settleEase) * dt, -2.5, 18);
    }

    const angularDamp = nearGround
      ? Phaser.Math.Linear(0.44, 0.16, settleEase)
      : Phaser.Math.Linear(0.78, 0.48, settleEase);

    av *= Math.pow(angularDamp, dt);
    if (nearGround && elapsed > 340 && Math.abs(av) < 0.08) av = 0;

    this.Matter.Body.setVelocity(body, { x: vx, y: vy });
    this.Matter.Body.setAngularVelocity(body, av);
  });
}

alignFlightRagdollFinalHop(delta, power) {
  const rig = this.flightRagdoll;
  if (!rig || !rig.parts || !rig.torso || rig.settleLocked) return;
  const connected = this.getFlightRagdollConnectedParts(rig.torso);
  const dt = Phaser.Math.Clamp((delta || 16.6667) / 16.6667, 0.4, 1.8);
  const p = Phaser.Math.Clamp(Number(power) || 0, 0, 1);

  rig.parts.forEach((body) => {
    const pose = body.poseInfo;
    if (!pose || !pose.anchor || !connected.has(body) || !connected.has(pose.anchor) || body.detachedRagdoll) return;
    const name = body.ragdollPart || "";
    const isCore = /torso|pelvis|head/i.test(name);
    const targetAngle = pose.anchor.angle + pose.angleOffset;
    const error = this.wrapRagdollAngle(body.angle - targetAngle);
    const maxSpin = (body.renderInfo && body.renderInfo.maxSpin) || (isCore ? 0.8 : 1.1);
    const pull = isCore ? 0.34 : 0.22;
    const damping = isCore ? 0.58 : 0.66;
    const correction = Phaser.Math.Clamp(-error * pull * p * dt, -maxSpin, maxSpin);
    this.Matter.Body.setAngularVelocity(
      body,
      Phaser.Math.Clamp((body.angularVelocity || 0) * Math.pow(damping, dt) + correction, -maxSpin, maxSpin)
    );
  });
}

setFlightRagdollThumbUpHand(rig) {
  if (!rig || rig.thumbUpHandActive) return;
  const parts = rig.poseParts || this.getFlightRagdollPartMap(rig);
  const hand = parts && parts.handR;
  if (!hand || !hand.ragdollImage || !this.textures.exists("dummyPart_handRThumbUp")) return;
  hand.ragdollImage.setTexture("dummyPart_handRThumbUp");
  hand.renderInfo = hand.renderInfo || {};
  if (hand.renderInfo.thumbUpBaseTextureRotationOffset === undefined) {
    hand.renderInfo.thumbUpBaseTextureRotationOffset = Number(hand.renderInfo.textureRotationOffset) || 0;
  }
  hand.renderInfo.textureKey = "dummyPart_handRThumbUp";
  hand.renderInfo.textureRotationOffset = hand.renderInfo.thumbUpBaseTextureRotationOffset + Phaser.Math.DegToRad(45);
  rig.thumbUpHandActive = true;
}

isRightArmRagdollBody(body) {
  return !!(body && /^(upperArmR|lowerArmR|handR)$/.test(String(body.ragdollPart || "")));
}

poseFlightRagdollThumbUp(rig, amount) {
  if (!rig || !rig.torso || !this.Matter) return;
  const parts = rig.poseParts || this.getFlightRagdollPartMap(rig);
  const torso = parts && parts.torso;
  const upper = parts && parts.upperArmR;
  const lower = parts && parts.lowerArmR;
  const hand = parts && parts.handR;
  if (!torso || !upper || !lower || !hand) return;
  const connected = this.getFlightRagdollConnectedParts(torso);
  if (!connected.has(upper) || !connected.has(lower) || !connected.has(hand)) return;

  const t = Phaser.Math.Clamp(Number(amount) || 0, 0, 1);
  if (t <= 0) return;
  const ease = Phaser.Math.Easing.Sine.InOut(t);
  if (t > 0.28) this.setFlightRagdollThumbUpHand(rig);

  const shoulder = this.ragdollWorldPoint(torso, (torso.ragdollAnchorPoints || {}).shoulderR || { x: 0, y: 0 });
  const blendAngle = (current, target) => {
    return current + this.wrapRagdollAngle(target - current) * Phaser.Math.Clamp(0.18 + ease * 0.82, 0, 1);
  };
  const placeAtAnchor = (body, anchorName, worldPoint, targetAngle) => {
    const anchor = (body.ragdollAnchorPoints || {})[anchorName] || { x: 0, y: 0 };
    const angle = blendAngle(body.angle || 0, targetAngle);
    const rotated = this.rotateRagdollPoint(anchor, angle);
    const targetX = worldPoint.x - rotated.x;
    const targetY = worldPoint.y - rotated.y;
    const posBlend = Phaser.Math.Clamp(0.14 + ease * 0.86, 0, 1);
    this.Matter.Body.setPosition(body, {
      x: Phaser.Math.Linear(body.position.x, targetX, posBlend),
      y: Phaser.Math.Linear(body.position.y, targetY, posBlend)
    });
    this.Matter.Body.setAngle(body, angle);
    this.Matter.Body.setVelocity(body, {
      x: (body.velocity.x || 0) * 0.18,
      y: (body.velocity.y || 0) * 0.18
    });
    this.Matter.Body.setAngularVelocity(body, (body.angularVelocity || 0) * 0.12);
    return this.ragdollWorldPoint(body, anchorName === "shoulder" ? ((body.ragdollAnchorPoints || {}).elbow || anchor) : ((body.ragdollAnchorPoints || {}).wrist || anchor));
  };

  const upperTarget = -Math.PI + Phaser.Math.DegToRad(8);
  const lowerTarget = -Math.PI + Phaser.Math.DegToRad(2);
  const handTarget = -Math.PI - Phaser.Math.DegToRad(4);
  const elbow = placeAtAnchor(upper, "shoulder", shoulder, upperTarget);
  const wrist = placeAtAnchor(lower, "elbow", elbow || shoulder, lowerTarget);
  placeAtAnchor(hand, "wrist", wrist || shoulder, handTarget);
}

freezeFlightRagdollRightArm(rig) {
  if (!rig || !this.Matter) return;
  const parts = rig.poseParts || this.getFlightRagdollPartMap(rig);
  ["upperArmR", "lowerArmR", "handR"].forEach((name) => {
    const body = parts && parts[name];
    if (!body) return;
    this.Matter.Sleeping.set(body, false);
    this.Matter.Body.setVelocity(body, { x: 0, y: 0 });
    this.Matter.Body.setAngularVelocity(body, 0);
    body.collisionFilter.mask = 0;
    this.Matter.Body.setStatic(body, true);
    this.Matter.Sleeping.set(body, true);
  });
  rig.thumbUpArmFrozen = true;
}

scheduleFlightRagdollThumbUpAfterLock(rig) {
  if (!rig || rig.thumbUpScheduled) return;
  rig.thumbUpScheduled = true;
  const parts = rig.poseParts || this.getFlightRagdollPartMap(rig);
  ["upperArmR", "lowerArmR", "handR"].forEach((name) => {
    const body = parts && parts[name];
    if (!body) return;
    this.Matter.Sleeping.set(body, false);
    this.Matter.Body.setStatic(body, false);
    this.Matter.Body.setVelocity(body, { x: 0, y: 0 });
    this.Matter.Body.setAngularVelocity(body, 0);
    body.collisionFilter.mask = 0;
  });
  rig.thumbUpEvent = this.time.delayedCall(70, () => {
    if (this.flightRagdoll !== rig || rig.thumbUpArmFrozen) return;
    const state = { t: 0 };
    rig.thumbUpTween = this.tweens.add({
      targets: state,
      t: 1,
      duration: 340,
      ease: "Sine.out",
      onUpdate: () => {
        if (this.flightRagdoll !== rig) return;
        this.poseFlightRagdollThumbUp(rig, state.t);
        this.renderFlightRagdoll();
      },
      onComplete: () => {
        if (this.flightRagdoll !== rig) return;
        this.poseFlightRagdollThumbUp(rig, 1);
        this.freezeFlightRagdollRightArm(rig);
        this.renderFlightRagdoll();
      }
    });
  });
}

relaxFlightRagdollFinalLandingJoints(rig) {
  if (!rig || !rig.joints) return;
  rig.joints.forEach((joint) => {
    if (!joint || !joint.ragdollJoint) return;
    const name = String(joint.ragdollJoint.name || "");
    if (this.isRightArmProtectedJointName(name)) return;
    const isCore = /spine|neck/i.test(name);
    const isHip = /hip/i.test(name);
    if (isCore || isHip) return;
    joint.stiffness = Math.min(Number(joint.stiffness) || 0.1, 0.018);
    joint.damping = Math.min(Number(joint.damping) || 0.02, 0.012);
  });
}

lockFlightRagdollOnGround(rig, options) {
  if (!rig || rig.settleLocked) return;
  const opts = options || {};
  if (!opts.relaxed) this.keepFlightRagdollLegHinges(16.6667, { forceGround: true, passes: 4 });
  const deferRightArm = !!opts.relaxed;
  rig.settleLocked = true;
  rig.parts.forEach((body) => {
    this.Matter.Sleeping.set(body, false);
    this.Matter.Body.setVelocity(body, { x: 0, y: 0 });
    this.Matter.Body.setAngularVelocity(body, 0);
    body.collisionFilter.mask = 0;
    if (deferRightArm && this.isRightArmRagdollBody(body)) {
      this.Matter.Body.setStatic(body, false);
      return;
    }
    this.Matter.Body.setStatic(body, true);
    this.Matter.Sleeping.set(body, true);
  });
  if (deferRightArm) this.scheduleFlightRagdollThumbUpAfterLock(rig);
}

keepFlightRagdollLegHinges(delta, options) {
  const rig = this.flightRagdoll;
  if (!rig || !rig.parts || !rig.torso || rig.settleLocked) return;

  const opts = options || {};
  if (rig.finalLandingPopActive && rig.finalLandingRelaxed && !opts.forceGround) return;
  const parts = rig.poseParts || this.getFlightRagdollPartMap(rig);
  const connected = this.getFlightRagdollConnectedParts(rig.torso);
  const dt = Phaser.Math.Clamp((delta || 16.6667) / 16.6667, 0.45, 1.8);
  const floorY = rig.settleFloorY || this.getGameplayGroundY();
  const legBodies = ["thighL", "shinL", "footL", "thighR", "shinR", "footR"].map((name) => parts[name]).filter(Boolean);
  const maxLegBottom = legBodies.reduce((bottom, body) => Math.max(bottom, this.getFlightRagdollBottomY(body)), -Infinity);
  const groundT = opts.forceGround
    ? 1
    : rig.settling
      ? 1
      : Phaser.Math.Clamp((maxLegBottom - (floorY - 130)) / 130, 0, 1);
  const spreadRamp = rig.legAirSpreadPoseStartedAt
    ? Phaser.Math.Clamp((this.time.now - rig.legAirSpreadPoseStartedAt) / Math.max(1, rig.legAirSpreadPoseRampMs || 220), 0, 1)
    : 1;
  const spreadRampEase = Phaser.Math.Easing.Sine.Out(spreadRamp);
  const spreadFade = Phaser.Math.Clamp(Number.isFinite(Number(rig.legAirSpreadPoseFade)) ? Number(rig.legAirSpreadPoseFade) : 1, 0, 1);
  const airPoseSpreadT = Phaser.Math.Clamp(
    (Number(rig.legAirSpreadPosePower) || 0) * spreadFade * spreadRampEase * (1 - groundT * 0.92),
    0,
    1
  );
  const airPoseSpreadRad = Phaser.Math.DegToRad(30) * airPoseSpreadT;

  ["thighL", "shinL", "footL", "thighR", "shinR", "footR"].forEach((name) => {
    if (parts[name]) {
      parts[name].legHingeError = 0;
      parts[name].legAngleGuard = 0;
      parts[name].legPoseSpread = 0;
    }
  });

  const worldAnchor = (body, anchorName) => {
    if (!body) return null;
    const point = this.getFlightRagdollAnchorLocal(body.ragdollPart, anchorName);
    return this.ragdollWorldPoint(body, point);
  };

  const rotateGroupAround = (group, pivot, angleRad) => {
    if (!pivot || !Number.isFinite(angleRad) || Math.abs(angleRad) < 0.00001) return;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    group.forEach((body) => {
      if (!body || !connected.has(body) || body.detachedRagdoll) return;
      const dx = body.position.x - pivot.x;
      const dy = body.position.y - pivot.y;
      this.Matter.Body.setPosition(body, {
        x: pivot.x + dx * cos - dy * sin,
        y: pivot.y + dx * sin + dy * cos
      });
      this.Matter.Body.rotate(body, angleRad);
      const maxSpin = (body.renderInfo && body.renderInfo.maxSpin) || 0.9;
      this.Matter.Body.setAngularVelocity(body, Phaser.Math.Clamp((body.angularVelocity || 0) * 0.62, -maxSpin, maxSpin));
    });
  };

  const guardAngle = (parent, child, group, parentAnchor, limitDeg, maxDegPerFrame, strength) => {
    if (!parent || !child || !connected.has(parent) || !connected.has(child)) return;
    const pose = child.poseInfo;
    const target = pose ? pose.angleOffset : 0;
    const rel = this.wrapRagdollAngle(child.angle - parent.angle);
    const error = this.wrapRagdollAngle(rel - target);
    const absError = Math.abs(error);
    const limit = Phaser.Math.DegToRad(limitDeg);
    if (absError <= limit) return;

    const excess = absError - limit;
    const guardT = Phaser.Math.Clamp(excess / Phaser.Math.DegToRad(46), 0, 1);
    const correction = -Math.sign(error || 1) * Math.min(excess * strength * dt, Phaser.Math.DegToRad(maxDegPerFrame) * dt);
    const pivot = worldAnchor(parent, parentAnchor);
    rotateGroupAround(group, pivot, correction);
    group.forEach((body) => {
      if (!body) return;
      body.legAngleGuard = Math.max(Number(body.legAngleGuard) || 0, guardT);
    });
  };

  const pullAnchor = (parent, child, group, parentAnchor, childAnchor, strength, maxStep, velocityBlend, slack) => {
    if (!parent || !child || !connected.has(parent) || !connected.has(child)) return;
    const a = worldAnchor(parent, parentAnchor);
    const b = worldAnchor(child, childAnchor);
    if (!a || !b) return;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const slackPx = Math.max(0, Number(slack) || 0);
    const excess = dist - slackPx;
    if (!Number.isFinite(dist) || excess <= 0.05) return;

    const stepLimit = maxStep * dt;
    const scale = Math.min(excess * strength, stepLimit) / dist;
    const move = { x: dx * scale, y: dy * scale };
    const errorT = Phaser.Math.Clamp(excess / Math.max(1, maxStep), 0, 1);
    const blend = Phaser.Math.Clamp(velocityBlend * errorT, 0, 0.42);

    group.forEach((body) => {
      if (!body || !connected.has(body) || body.detachedRagdoll) return;
      this.Matter.Body.translate(body, move);
      this.Matter.Body.setVelocity(body, {
        x: Phaser.Math.Linear(body.velocity.x || 0, parent.velocity.x || 0, blend),
        y: Phaser.Math.Linear(body.velocity.y || 0, parent.velocity.y || 0, blend)
      });
      body.legHingeError = Math.max(Number(body.legHingeError) || 0, excess);
    });
  };

  const applyPoseSpread = (parent, child, group, parentAnchor, side) => {
    if (!parent || !child || !connected.has(parent) || !connected.has(child)) return;
    if (airPoseSpreadRad <= 0.0001) return;
    const pose = child.poseInfo;
    const base = pose ? pose.angleOffset : 0;
    const spreadSign = side === "R" ? -1 : 1;
    const targetRel = base + spreadSign * airPoseSpreadRad;
    const rel = this.wrapRagdollAngle(child.angle - parent.angle);
    const error = this.wrapRagdollAngle(rel - targetRel);
    const maxStep = Phaser.Math.DegToRad(8.5) * dt;
    const correction = Phaser.Math.Clamp(-error * 0.34 * dt, -maxStep, maxStep);
    const pivot = worldAnchor(parent, parentAnchor);
    rotateGroupAround(group, pivot, correction);
    group.forEach((body) => {
      if (!body) return;
      body.legPoseSpread = Phaser.Math.RadToDeg(spreadSign * airPoseSpreadRad);
    });
  };

  const keepSide = (side) => {
    const pelvis = parts.pelvis;
    const thigh = parts["thigh" + side];
    const shin = parts["shin" + side];
    const foot = parts["foot" + side];
    const fullLeg = [thigh, shin, foot];
    const lowerLeg = [shin, foot];

    const hipLimit = Phaser.Math.Linear(138, 68, groundT);
    const kneeLimit = Phaser.Math.Linear(118, 72, groundT);
    const hipMaxDeg = Phaser.Math.Linear(5, 24, groundT);
    const kneeMaxDeg = Phaser.Math.Linear(3, 14, groundT);
    const hipGuardStrength = Phaser.Math.Linear(0.16, 0.76, groundT);
    const kneeGuardStrength = Phaser.Math.Linear(0.10, 0.46, groundT);

    // Hip is a loose hinge in air and a hard stop near the road.
    guardAngle(pelvis, thigh, fullLeg, side === "L" ? "hipL" : "hipR", hipLimit, hipMaxDeg, hipGuardStrength);
    guardAngle(thigh, shin, lowerLeg, "knee", kneeLimit, kneeMaxDeg, kneeGuardStrength);
    applyPoseSpread(pelvis, thigh, fullLeg, side === "L" ? "hipL" : "hipR", side);

    // Then keep real hinge anchors glued, top-down. Only child chains move, never torso/pelvis.
    const passCount = opts.passes || (groundT > 0.82 ? 3 : groundT > 0.35 ? 2 : 1);
    for (let pass = 0; pass < passCount; pass++) {
      const passT = pass === 0 ? 1 : pass === 1 ? 0.68 : 0.46;
      pullAnchor(
        pelvis,
        thigh,
        fullLeg,
        side === "L" ? "hipL" : "hipR",
        "hip",
        Phaser.Math.Linear(0.20, 0.94, groundT) * passT,
        Phaser.Math.Linear(10, 42, groundT) * passT,
        Phaser.Math.Linear(0.06, 0.30, groundT),
        Phaser.Math.Linear(24, 4, groundT)
      );
      pullAnchor(
        thigh,
        shin,
        lowerLeg,
        "knee",
        "knee",
        Phaser.Math.Linear(0.24, 0.98, groundT) * passT,
        Phaser.Math.Linear(12, 46, groundT) * passT,
        Phaser.Math.Linear(0.08, 0.34, groundT),
        Phaser.Math.Linear(20, 3, groundT)
      );
      pullAnchor(
        shin,
        foot,
        [foot],
        "ankle",
        "ankle",
        Phaser.Math.Linear(0.20, 0.92, groundT) * passT,
        Phaser.Math.Linear(10, 36, groundT) * passT,
        Phaser.Math.Linear(0.07, 0.30, groundT),
        Phaser.Math.Linear(18, 3, groundT)
      );
    }
  };

  keepSide("L");
  keepSide("R");
}

getFlightRagdollGroundAngle(body) {
  const name = body && body.ragdollPart ? body.ragdollPart : "";
  if (name === "head") return body.angle;
  if (name === "pelvis") return 1.2;
  if (name === "footL") return 0.04;
  if (name === "footR") return -0.06;
  if (/hand/i.test(name)) return 0.1;
  if (/arm|thigh|shin|torso/i.test(name)) return 1.42;
  return body.angle;
}

getFlightRagdollBottomY(body) {
  if (!body || !body.vertices || !body.vertices.length) return body ? body.position.y : 0;
  return body.vertices.reduce((bottom, point) => Math.max(bottom, point.y), -Infinity);
}

preventFlightRagdollBodyClump(delta) {
  const rig = this.flightRagdoll;
  if (!rig || rig.settling || rig.settleLocked || !rig.torso || !rig.parts) return;
  const parts = this.getFlightRagdollPartMap(rig);
  const pelvis = parts.pelvis;
  const head = parts.head;
  if (!pelvis) return;
  const connected = this.getFlightRagdollConnectedParts(rig.torso);
  const dt = Phaser.Math.Clamp((delta || 16.6667) / 16.6667, 0.35, 2);
  const pushPair = (body, core, minDist, strength, downwardBias) => {
    if (!body || !core || !connected.has(body) || body.detachedRagdoll) return;
    const dx = body.position.x - core.position.x;
    const dy = body.position.y - core.position.y;
    const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
    if (dist >= minDist) return;
    const foldT = Phaser.Math.Clamp((minDist - dist) / minDist, 0, 1);
    let nx = dx / dist;
    let ny = dy / dist;
    if (body.position.y < pelvis.position.y + 22) {
      ny = Math.max(ny, 0.38 + downwardBias);
    }
    const kick = strength * foldT * dt;
    this.Matter.Body.setVelocity(body, {
      x: Phaser.Math.Clamp(body.velocity.x + nx * kick, -18, 18),
      y: Phaser.Math.Clamp(body.velocity.y + ny * kick + downwardBias * foldT * dt, -18, 18)
    });
    const side = body.position.x < core.position.x ? -1 : 1;
    const maxSpin = (body.renderInfo && body.renderInfo.maxSpin) || 1;
    this.Matter.Body.setAngularVelocity(body, Phaser.Math.Clamp(body.angularVelocity + side * 0.010 * foldT * dt, -maxSpin, maxSpin));
  };
  ["thighL", "shinL", "footL", "thighR", "shinR", "footR"].forEach((name) => {
    const body = parts[name];
    const terminal = /foot/i.test(name);
    const lower = /shin|foot/i.test(name);
    pushPair(body, rig.torso, terminal ? 76 : lower ? 84 : 94, terminal ? 3.2 : lower ? 2.9 : 2.5, terminal ? 0.86 : 0.58);
    pushPair(body, head, terminal ? 86 : lower ? 96 : 106, terminal ? 3.6 : lower ? 3.25 : 2.85, terminal ? 1.0 : 0.68);
  });
}

stabilizeFlightRagdoll() {
  const rig = this.flightRagdoll;
  if (!rig || !rig.parts) return;
  if (rig.settleLocked) return;
  if (rig.settling) return;
  const settleFactor = rig.settling ? 0.22 : 1;

  rig.parts.forEach((body) => {
    const pose = body.poseInfo;
    const partName = body.ragdollPart || "";
    const isArm = /arm|hand/i.test(partName);
    const isLeg = /thigh|shin|foot/i.test(partName);
    const isUpperArm = /upperArm/i.test(partName);
    const isLowerArm = /lowerArm/i.test(partName);
    const isHand = /hand/i.test(partName);

    const hasAnchor = pose && pose.anchor && this.hasFlightRagdollJointBetween(body, pose.anchor);
    const spinBoostActive = body === rig.torso && this.getFlightRagdollSpinBoostT(rig) > 0;
    const renderMaxSpin = (body.renderInfo && body.renderInfo.maxSpin) || 0.92;
    const spinBoostMax = Number(rig.torsoSpinMaxAngular) || Number(rig.torsoCruiseSpinMax) || 1.05;
    const maxSpin = spinBoostActive ? Math.max(spinBoostMax, renderMaxSpin) : hasAnchor ? renderMaxSpin : Math.min(renderMaxSpin, 0.72);
    const minSpin = body === rig.torso ? 0 : -maxSpin;

    if (Math.abs(body.angularVelocity) > maxSpin) {
      this.Matter.Body.setAngularVelocity(body, Phaser.Math.Clamp(body.angularVelocity, minSpin, maxSpin));
    }
    if (!pose) return;

    // Legs have their own spring/chaos controller; don't double-stabilize them.
    if (isLeg) return;

    const targetAngle = hasAnchor ? pose.anchor.angle + pose.angleOffset : pose.restAngle;
    const delta = this.wrapRagdollAngle(body.angle - targetAngle);
    const error = -delta;

    // Arms should not be magnetized back to the same direction as torso.
    // Otherwise they visually look glued behind the body.
    const armStabilizerScale = isUpperArm ? 0.10 : isLowerArm ? 0.18 : isHand ? 0.14 : 1;
    const armSpeedScale = isArm ? 1.65 : 1;

    const strength = (hasAnchor ? pose.strength : pose.strength * 0.72) * settleFactor * armStabilizerScale;
    const maxSpeed = (hasAnchor ? pose.maxSpeed : pose.maxSpeed * 0.82) * settleFactor * armSpeedScale;
    const damping = isArm ? 0.992 : (rig.settling ? 0.68 : hasAnchor ? 0.93 : 0.86);

    const overLimit = pose.limitRad ? Math.abs(delta) - pose.limitRad : -1;
    const correctionRaw = overLimit > 0
      ? -Math.sign(delta || 1) * overLimit * (pose.limitStrength || 0.26) * (isArm ? 0.22 : 1)
      : error * strength;

    const correction = Phaser.Math.Clamp(correctionRaw, -maxSpeed, maxSpeed);
    const angularVelocity = Phaser.Math.Clamp(body.angularVelocity * damping + correction, minSpin, maxSpin);
    this.Matter.Body.setAngularVelocity(body, angularVelocity);
  });
}

hasFlightRagdollJointBetween(a, b) {
  const rig = this.flightRagdoll;
  if (!rig || !rig.joints) return false;
  return rig.joints.some((joint) => (joint.bodyA === a && joint.bodyB === b) || (joint.bodyA === b && joint.bodyB === a));
}

checkFlightRagdollJointStress() {
  const rig = this.flightRagdoll;
  if (!rig || !rig.joints) return;
  if (!rig.allowJointBreaks) return;
  if (rig.settling) return;
  if (this.time.now - (rig.lastBreakAt || 0) < 110) return;
  if (this.time.now < (rig.noBreakUntil || 0)) return;
  if (!rig.allowStressBreakUntil || this.time.now > rig.allowStressBreakUntil) return;
  if ((rig.stressBreakCount || 0) >= (rig.maxStressBreaksThisWindow || 1)) return;
  const softBreakFactor = this.time.now < (rig.softBreakUntil || 0) ? 1.16 : 0.92;
  rig.joints.slice().forEach((joint) => {
    if ((rig.stressBreakCount || 0) >= (rig.maxStressBreaksThisWindow || 1)) return;
    if (!joint.ragdollJoint) return;
    if (joint.ragdollJoint.locked) return;
    const a = this.ragdollWorldPoint(joint.bodyA, joint.pointA);
    const b = this.ragdollWorldPoint(joint.bodyB, joint.pointB);
    const distance = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    const toughness = joint.ragdollJoint.toughness || 1;
    const limit = joint.length + joint.ragdollJoint.breakLimit * (1.15 + toughness * 0.72) * softBreakFactor;
    if (distance > limit) {
      this.breakFlightRagdollJoint(joint, distance * 0.16);
      rig.stressBreakCount = (rig.stressBreakCount || 0) + 1;
    }
  });
}

kickFlightRagdollFromGround(power, options) {
  const rig = this.flightRagdoll;
  if (!rig || !rig.parts) return;
  const p = Number(power) || 1;
  const opts = options || {};

  rig.armImpactUntil = this.time.now + (opts.firstImpact ? 760 : 980);
  rig.armImpactDuration = opts.firstImpact ? 760 : 980;
  rig.armImpactPower = opts.firstImpact ? 0.95 : 1.22;

  rig.limbChaosUntil = this.time.now + (opts.firstImpact ? 760 : 980);
  rig.limbChaosDuration = opts.firstImpact ? 760 : 980;
  rig.limbChaosPower = opts.firstImpact ? 0.92 : 1.15;

  rig.legShockUntil = this.time.now + (opts.firstImpact ? 260 : 360);
  rig.legShockDuration = opts.firstImpact ? 260 : 360;
  rig.legShockPower = opts.firstImpact ? 0.55 : 0.70;
  if (opts.torsoSpin && opts.legSpread !== false) {
    rig.legAirSpreadDuration = opts.firstImpact ? 620 : 760;
    rig.legAirSpreadUntil = this.time.now + rig.legAirSpreadDuration;
    rig.legAirSpreadPower = opts.firstImpact ? 1.12 : 1.48;
    rig.legAirSpreadPosePower = 1;
    rig.legAirSpreadPoseFade = 1;
    rig.legAirSpreadPoseStartedAt = this.time.now;
    rig.legAirSpreadPoseRampMs = opts.firstImpact ? 240 : 200;
  } else if (opts.legSpread === false) {
    rig.legAirSpreadPosePower = 0;
    rig.legAirSpreadPoseFade = 0;
    rig.legAirSpreadUntil = 0;
    rig.legAirSpreadPower = 0;
  }

  // Ground rule:
  // - with planned bounces: add a cartwheel speed boost;
  // - without planned bounces: kill cartwheel spin and let the ragdoll collapse/settle.
  if (opts.torsoSpin && rig.torso) {
    const impact = Phaser.Math.Clamp(0.80 + Math.log1p(Math.max(0, p)) * 0.22, 0.80, opts.firstImpact ? 1.10 : 1.24);
    this.addRagdollWheelSpinImpulse(rig, {
      impulseDeg: opts.firstImpact ? 28 * impact : 40 * impact,
      speedDeg: opts.firstImpact ? 335 : 365,
      cruiseDeg: opts.firstImpact ? 270 : 290,
      minDeg: 155,
      maxDeg: opts.firstImpact ? 440 : 475,
      damping: 0.056,
      burstMs: opts.firstImpact ? 520 : 640,
      burstDeg: opts.firstImpact ? 130 * impact : 185 * impact,
      burstFrameDeg: opts.firstImpact ? 1.35 : 1.85,
      burstStepDeg: opts.firstImpact ? 18 : 22,
      chaosMs: opts.firstImpact ? 680 : 820,
      chaosPower: opts.firstImpact ? 0.76 : 0.88
    });
  } else if (opts.firstImpact && rig.torso) {
    rig.finalLandingPop = true;
    this.stopRagdollWheelSpin(rig, { hard: true });
  }

  rig.allowStressBreakUntil = this.time.now + (opts.firstImpact ? 260 : 440);
  rig.stressBreakCount = 0;
  rig.maxStressBreaksThisWindow = opts.firstImpact ? 2 : 3;
  const connected = this.getFlightRagdollConnectedParts(rig.torso);

  rig.parts.forEach((body) => {
    if (!connected.has(body)) return;
    if (body === rig.torso) {
      this.Matter.Body.setVelocity(body, {
        x: body.velocity.x + Phaser.Math.FloatBetween(-1.4, 2.0) * p,
        y: Math.min(body.velocity.y, Phaser.Math.FloatBetween(-8.2, -4.0) * p)
      });
      return;
    }

    const name = body.ragdollPart || "";
    const isLeg = /thigh|shin|foot/i.test(name);
    const isArm = /arm|hand/i.test(name);
    const terminal = /hand|foot/i.test(name);
    const legSide = /L$/.test(name) ? -1 : 1;
    const legAsym = isLeg ? (/L$/.test(name) ? 1.12 : 0.86) : 1;
    const kickScale = isArm ? (terminal ? 0.94 : 0.72) : isLeg ? (terminal ? 0.58 : 0.46) : 0.30;

    this.Matter.Body.setVelocity(body, {
      x: body.velocity.x + (Phaser.Math.FloatBetween(-1.8, 2.6) + (isLeg ? legSide * Phaser.Math.FloatBetween(0.25, 0.85) : 0)) * p * kickScale * legAsym,
      y: Math.min(body.velocity.y, Phaser.Math.FloatBetween(-4.8, -1.6) * p * kickScale * legAsym)
    });

    const maxSpin = (body.renderInfo && body.renderInfo.maxSpin) || 1;

    if (isArm || isLeg) {
      const side = /L$/.test(name) ? -1 : 1;
      const spinDir = isArm ? side : side * (/shin|foot/i.test(name) ? -1 : 1);
      const impulse = isArm
        ? Phaser.Math.FloatBetween(0.42, terminal ? 1.35 : 1.02) * p * (terminal ? 1.22 : 1.02)
        : Phaser.Math.FloatBetween(0.22, terminal ? 0.78 : 0.58) * p;
      this.Matter.Body.setAngularVelocity(
        body,
        Phaser.Math.Clamp(body.angularVelocity + spinDir * impulse, -maxSpin, maxSpin)
      );
    } else {
      this.Matter.Body.setAngularVelocity(body, Phaser.Math.Clamp(body.angularVelocity, -maxSpin, maxSpin));
    }
  });

  const firstImpactScale = opts.firstImpact ? 0.34 : 1.05;
  const chance = Phaser.Math.Clamp((0.15 + p * 0.085) * firstImpactScale, 0.045, 0.48);
  if (Math.random() < chance) this.breakRandomFlightRagdollJoint(p * 1.05);
}

breakRandomFlightRagdollJoint(power) {
  const rig = this.flightRagdoll;
  if (!rig || !rig.joints || !rig.joints.length) return;
  if (!rig.allowJointBreaks) return;
  if (this.time.now < (rig.noBreakUntil || 0)) return;
  if (this.time.now - (rig.lastBreakAt || 0) < 110) return;
  let total = 0;
  const weighted = rig.joints
    .filter((joint) => joint !== rig.anchorConstraint)
    .filter((joint) => !(joint.ragdollJoint && joint.ragdollJoint.locked))
    .filter((joint) => !(joint.ragdollJoint && joint.ragdollJoint.brace))
    .map((joint) => {
      const info = joint.ragdollJoint || {};
      const weight = (info.weakness || 1) * Phaser.Math.FloatBetween(0.82, 1.18);
      total += weight;
      return { joint, weight };
    });
  if (!weighted.length || total <= 0) return;
  let pick = Math.random() * total;
  for (let i = 0; i < weighted.length; i++) {
    pick -= weighted[i].weight;
    if (pick <= 0) {
      this.breakFlightRagdollJoint(weighted[i].joint, 16 * (power || 1));
      return;
    }
  }
  this.breakFlightRagdollJoint(weighted[weighted.length - 1].joint, 16 * (power || 1));
}

kickFlightRagdollFromBonus(value) {
  const rig = this.flightRagdoll;
  if (!rig || !rig.torso || rig.settling) return;

  const amount = Phaser.Math.Clamp(Number(value || 1), 0.1, 20);
  const power = Phaser.Math.Clamp(0.46 + Math.log2(amount + 1) * 0.12, 0.46, 1.22);

  // Bonus hit: add a readable cartwheel boost, not a random physics over-spin.
  rig.torsoSpinDirection = 1;
  this.addRagdollWheelSpinImpulse(rig, {
    impulseDeg: 20 + power * 30,
    speedDeg: 360,
    cruiseDeg: 290,
    minDeg: 155,
    maxDeg: 470,
    damping: 0.056,
    burstMs: 520,
    burstDeg: 120 + power * 82,
    burstFrameDeg: 1.55,
    burstStepDeg: 20,
    chaosMs: 680,
    chaosPower: Phaser.Math.Clamp(0.74 + power * 0.10, 0.74, 0.94)
  });

  rig.allowStressBreakUntil = this.time.now + 190;
  rig.stressBreakCount = 0;
  rig.maxStressBreaksThisWindow = 2;

  rig.armImpactUntil = this.time.now + 760;
  rig.armImpactDuration = 760;
  rig.armImpactPower = 1.05 * power;

  rig.limbChaosUntil = this.time.now + 820;
  rig.limbChaosDuration = 820;
  rig.limbChaosPower = Phaser.Math.Clamp(0.95 + power * 0.35, 0.95, 1.38);

  rig.legShockUntil = this.time.now + 300;
  rig.legShockDuration = 300;
  rig.legShockPower = Phaser.Math.Clamp(0.55 + power * 0.18, 0.55, 0.80);

  this.Matter.Body.setVelocity(rig.torso, {
    x: Phaser.Math.Clamp(rig.torso.velocity.x + 0.44 * power, -42, 42),
    y: Phaser.Math.Clamp(rig.torso.velocity.y - 0.12 * power, -42, 42)
  });

  // Whole-body bonus spin is handled by addRagdollWheelSpinImpulse above.

  const connected = this.getFlightRagdollConnectedParts(rig.torso);
  rig.parts.forEach((body) => {
    if (body === rig.torso || !connected.has(body)) return;
    const name = body.ragdollPart || "";
    const isArm = /arm|hand/i.test(name);
    const terminal = /hand/i.test(name);
    const side = /L$/.test(name) ? -1 : 1;
    const maxSpin = (body.renderInfo && body.renderInfo.maxSpin) || 1;

    const isLeg = /thigh|shin|foot/i.test(name);
    if (isArm || isLeg) {
      const spinDir = isArm ? side : side * (/shin|foot/i.test(name) ? -1 : 1);
      const spin = spinDir * Phaser.Math.FloatBetween(
        isArm ? 0.24 : 0.16,
        isArm ? (terminal ? 0.78 : 0.58) : (terminal ? 0.52 : 0.42)
      ) * power;
      this.Matter.Body.setAngularVelocity(body, Phaser.Math.Clamp(body.angularVelocity * 0.92 + spin, -maxSpin, maxSpin));
    } else {
      this.Matter.Body.setAngularVelocity(body, Phaser.Math.Clamp(body.angularVelocity * 0.88, -maxSpin, maxSpin));
    }
  });

  const chance = Phaser.Math.Clamp(0.04 + amount * 0.006, 0.04, 0.18);
  if (Math.random() < chance) this.breakRandomFlightRagdollJoint(power * 0.82);
}

getFlightRagdollConnectedParts(root) {
  const rig = this.flightRagdoll;
  const connected = new Set();
  if (!rig || !root) return connected;
  const graphVersion = Number(rig.jointGraphVersion) || 0;
  if (
    rig.connectedPartsCache &&
    rig.connectedPartsCacheRoot === root &&
    rig.connectedPartsCacheVersion === graphVersion
  ) {
    return rig.connectedPartsCache;
  }
  const queue = [root];
  connected.add(root);
  while (queue.length) {
    const body = queue.shift();
    (rig.joints || []).forEach((joint) => {
      if (joint === rig.anchorConstraint) return;
      let next = null;
      if (joint.bodyA === body) next = joint.bodyB;
      else if (joint.bodyB === body) next = joint.bodyA;
      if (!next || connected.has(next)) return;
      connected.add(next);
      queue.push(next);
    });
  }
  rig.connectedPartsCacheRoot = root;
  rig.connectedPartsCacheVersion = graphVersion;
  rig.connectedPartsCache = connected;
  return connected;
}

updateDetachedFlightRagdollParts(delta) {
  const rig = this.flightRagdoll;
  if (!rig || !rig.parts || !rig.torso) return;
  const connected = this.getFlightRagdollConnectedParts(rig.torso);
  const dt = Phaser.Math.Clamp((delta || 16.6667) / 16.6667, 0.4, 2);
  const floorY = rig.settleFloorY || this.getGameplayGroundY();
  const settling = !!rig.settling;
  const settleT = settling
    ? Phaser.Math.Clamp((this.time.now - (rig.settleStartedAt || this.time.now)) / Math.max(1, rig.settleLockDelay || 720), 0, 1)
    : 0;
  rig.parts.forEach((body) => {
    if (!body || connected.has(body)) return;
    const name = body.ragdollPart || "";
    const terminal = /hand|foot/i.test(name);
    const isArm = /arm|hand/i.test(name);
    const isLeg = /thigh|shin|foot/i.test(name);
    if (!body.detachedRagdoll) {
      body.detachedRagdoll = {
        at: this.time.now,
        groundBounceDone: false,
        groundBounceAt: 0,
        inheritedWheelInertia: false
      };
      body.poseInfo = null;
      body.frictionAir = 0.020;
      body.friction = 0.66;
      body.frictionStatic = 0.10;
      body.restitution = 0.24;

      // Preserve inertia at the exact moment of detachment.
      // Since the cinematic wheel spin is a directed transform, a broken-off part
      // needs a one-time tangential velocity so it keeps flying/spinning independently.
      if (rig.wheelSpinActive && rig.torso) {
        const pivot = this.getTorsoSpinPivot(rig) || rig.torso.position;
        const direction = Number(rig.wheelSpinDirection) || 1;
        const speedDeg = Phaser.Math.Clamp(Number(rig.wheelSpinSpeedDeg) || Number(rig.wheelSpinCruiseDeg) || 260, 0, 520);
        const omegaFrame = Phaser.Math.DegToRad(speedDeg) / 60 * direction;
        const dx = body.position.x - pivot.x;
        const dy = body.position.y - pivot.y;
        const inheritScale = terminal ? 0.48 : isArm ? 0.42 : isLeg ? 0.36 : 0.32;

        this.Matter.Body.setVelocity(body, {
          x: Phaser.Math.Clamp((body.velocity.x || 0) + (-dy * omegaFrame * inheritScale), -9, 9),
          y: Phaser.Math.Clamp((body.velocity.y || 0) + (dx * omegaFrame * inheritScale), -11, 11)
        });

        const spinSign = Math.sign(omegaFrame || 1) * (Phaser.Math.RND.pick([-1, 1]));
        const spinAdd = Phaser.Math.FloatBetween(0.18, terminal ? 0.62 : isArm ? 0.52 : isLeg ? 0.42 : 0.34);
        const maxSpinBase = (body.renderInfo && body.renderInfo.maxSpin) || 1.1;
        this.Matter.Body.setAngularVelocity(
          body,
          Phaser.Math.Clamp((body.angularVelocity || 0) * 0.75 + spinSign * spinAdd, -maxSpinBase, maxSpinBase)
        );
        body.detachedRagdoll.inheritedWheelInertia = true;
      }
    }
    const maxSpinBase = (body.renderInfo && body.renderInfo.maxSpin) || 1.1;
    const age = this.time.now - (body.detachedRagdoll.at || this.time.now);
    const airSlowT = Phaser.Math.Clamp(age / 1800, 0, 1);
    const maxSpin = body.detachedRagdoll.groundBounceDone
      ? Math.max(maxSpinBase, terminal ? 1.05 : isArm ? 1.0 : isLeg ? 0.78 : 1.15)
      : Math.max(maxSpinBase, isLeg ? 0.78 : 1.0);
    if (Math.abs(body.angularVelocity) > maxSpin) {
      this.Matter.Body.setAngularVelocity(body, Phaser.Math.Clamp(body.angularVelocity, -maxSpin, maxSpin));
    }
    if (!body.detachedRagdoll.groundBounceDone) {
      const airDamp = Phaser.Math.Linear(0.996, 0.982, airSlowT);
      this.Matter.Body.setVelocity(body, {
        x: (body.velocity.x || 0) * Math.pow(airDamp, dt),
        y: (body.velocity.y || 0)
      });
      this.Matter.Body.setAngularVelocity(body, (body.angularVelocity || 0) * Math.pow(Phaser.Math.Linear(0.997, 0.986, airSlowT), dt));
    }

    const bottomY = this.getFlightRagdollBottomY(body);
    const nearGround = bottomY >= floorY - 8;
    if (nearGround && !body.detachedRagdoll.groundBounceDone) {
      body.detachedRagdoll.groundBounceDone = true;
      body.detachedRagdoll.groundBounceAt = this.time.now;
      const overlap = bottomY - floorY;
      if (overlap > 0) this.Matter.Body.translate(body, { x: 0, y: -Math.min(10, overlap + 2) });
      const bouncePower = terminal ? 1.18 : isArm ? 1.02 : isLeg ? 0.92 : 0.82;
      const side = Phaser.Math.RND.pick([-1, 1]);
      const speedIn = Math.max(0, body.velocity.y || 0);
      this.Matter.Body.setVelocity(body, {
        x: Phaser.Math.Clamp((body.velocity.x || 0) * 0.55 + side * Phaser.Math.FloatBetween(1.2, 3.4) * bouncePower, -6.5, 6.5),
        y: -Phaser.Math.Clamp(Phaser.Math.FloatBetween(4.2, 7.8) * bouncePower + speedIn * 0.16, 3.8, 10.5)
      });
      const spin = side * Phaser.Math.FloatBetween(0.22, terminal ? 0.72 : isArm ? 0.64 : 0.48) * bouncePower;
      this.Matter.Body.setAngularVelocity(body, Phaser.Math.Clamp((body.angularVelocity || 0) * 0.45 + spin, -maxSpin, maxSpin));
      this.spawnSmoke(body.position.x, floorY - 8, terminal ? 1 : 2, 0xf2b34c);
      return;
    }
    if (!nearGround) return;
    const bounceAge = this.time.now - (body.detachedRagdoll.groundBounceAt || body.detachedRagdoll.at || this.time.now);
    const earlyRoll = bounceAge < 520;
    const vxDamp = earlyRoll ? 0.965 : Phaser.Math.Linear(0.9, 0.58, settleT);
    const vyDamp = earlyRoll ? 0.92 : Phaser.Math.Linear(0.76, 0.42, settleT);
    const avDamp = earlyRoll ? 0.975 : Phaser.Math.Linear(0.92, 0.62, settleT);
    let vx = body.velocity.x * Math.pow(vxDamp, dt);
    let vy = body.velocity.y * Math.pow(vyDamp, dt);
    let av = body.angularVelocity * Math.pow(avDamp, dt);
    if (bounceAge > 860) {
      if (Math.abs(vx) < 0.08) vx = 0;
      if (Math.abs(vy) < 0.12) vy = 0;
      if (Math.abs(av) < 0.04) av = 0;
    }
    this.Matter.Body.setVelocity(body, { x: vx, y: vy });
    this.Matter.Body.setAngularVelocity(body, av);
  });
}

startFlightRagdollSettle() {
  const rig = this.flightRagdoll;
  if (!rig || rig.settling) return;

  const finalPop = !!rig.finalLandingPop;
  this.stopRagdollWheelSpin(rig, { hard: true });

  rig.settling = true;
  rig.settleStartedAt = this.time.now;
  rig.settleTarget = this.dummy ? this.getRagdollTorsoTarget(this.dummy.x, this.dummy.y) : null;
  rig.settleFloorY = this.getGameplayGroundY();
  rig.settleLockDelay = finalPop ? 860 : 420;
  rig.settleLocked = false;
  rig.finalLandingPopActive = finalPop;
  rig.finalLandingRelaxUntil = finalPop ? this.time.now + 360 : 0;
  rig.finalLandingRelaxed = false;
  rig.finalLandingJointsRelaxed = false;
  rig.finalPopRightVelocity = finalPop ? 0.95 : 0;
  rig.torsoSpinBoostUntil = 0;
  rig.legAirSpreadPosePower = 0;
  rig.legAirSpreadPoseFade = 0;

  if (rig.anchorConstraint) {
    this.Matter.Composite.remove(this.matter.world.localWorld, rig.anchorConstraint);
    rig.anchorConstraint = null;
  }

  rig.parts.forEach((body) => {
    const name = body.ragdollPart || "";
    const isArm = /arm|hand/i.test(name);
    const isLeg = /thigh|shin|foot/i.test(name);
    const isLimb = isArm || isLeg;
    const isCore = /torso|pelvis|head/i.test(name);
    const rightPop = finalPop ? (isCore ? 0.98 : isArm ? 0.82 : isLeg ? 0.72 : 0.80) : 0;
    const lift = finalPop ? (isCore ? 2.55 : isArm ? 2.15 : isLeg ? 2.35 : 2.20) : 0;

    this.Matter.Sleeping.set(body, false);
    body.frictionAir = finalPop ? 0.050 : 0.09;
    body.friction = finalPop ? 0.92 : 0.98;
    body.frictionStatic = finalPop ? 2.1 : 2.6;
    body.restitution = finalPop ? 0.045 : 0.02;

    this.Matter.Body.setVelocity(body, {
      x: finalPop
        ? Phaser.Math.Clamp(Math.max(0, body.velocity.x || 0) * 0.025 + rightPop, 0.46, 1.05)
        : body.velocity.x * 0.1,
      y: finalPop
        ? Phaser.Math.Clamp((body.velocity.y || 0) * 0.020 - lift, -3.1, -1.25)
        : Math.max(body.velocity.y * 0.1, 2.2)
    });

    this.Matter.Body.setAngularVelocity(body, body.angularVelocity * (finalPop ? (isLimb ? 0.12 : 0.05) : (isLimb ? 0.22 : 0.08)));
  });

  rig.finalLandingPop = false;
}

breakFlightRagdollJoint(joint, impact) {
  const rig = this.flightRagdoll;
  if (!rig || !joint || joint === rig.anchorConstraint) return;
  if (!rig.allowJointBreaks) return;
  if (joint.ragdollJoint && joint.ragdollJoint.locked) return;
  const sameBodies = (other) => {
    return other && other !== joint && (
      (other.bodyA === joint.bodyA && other.bodyB === joint.bodyB) ||
      (other.bodyA === joint.bodyB && other.bodyB === joint.bodyA)
    );
  };
  const jointsToRemove = [joint];
  if (!(joint.ragdollJoint && joint.ragdollJoint.brace)) {
    rig.joints.forEach((other) => {
      if (sameBodies(other) && other.ragdollJoint && other.ragdollJoint.brace) {
        jointsToRemove.push(other);
      }
    });
  }
  if (jointsToRemove.every((item) => rig.joints.indexOf(item) === -1)) return;
  rig.lastBreakAt = this.time.now;
  jointsToRemove.forEach((item) => {
    const index = rig.joints.indexOf(item);
    if (index === -1) return;
    rig.joints.splice(index, 1);
    this.Matter.Composite.remove(this.matter.world.localWorld, item);
  });
  rig.jointGraphVersion = (Number(rig.jointGraphVersion) || 0) + 1;
  rig.connectedPartsCacheRoot = null;
  rig.connectedPartsCacheVersion = -1;
  rig.connectedPartsCache = null;
  this.spawnSmoke(
    (joint.bodyA.position.x + joint.bodyB.position.x) * 0.5,
    (joint.bodyA.position.y + joint.bodyB.position.y) * 0.5,
    Math.max(2, Math.round((impact || 12) / 12)),
    0xf2b34c
  );
}

renderFlightRagdoll() {
  const rig = this.flightRagdoll;
  if (!rig || !rig.graphics) return;
  const g = rig.graphics;
  const parts = rig.parts || [];
  const usesGraphics = parts.some((body) => !body.ragdollImage);
  if (usesGraphics) g.clear();
  parts.forEach((body) => {
      const info = body.renderInfo || {};
      if (body.ragdollImage) {
        const offset = info.textureOffset || { x: 0, y: 0 };
        const cos = Math.cos(body.angle);
        const sin = Math.sin(body.angle);
        body.ragdollImage
          .setPosition(
            body.position.x + offset.x * cos - offset.y * sin,
            body.position.y + offset.x * sin + offset.y * cos
          )
          .setRotation(body.angle + (info.textureRotationOffset || 0))
          .setVisible(true);
        return;
      }
      this.drawFlightRagdollPart(g, body);
    });
}

drawFlightRagdollPart(g, body) {
  const info = body.renderInfo || {};
  const alpha = info.alpha === undefined ? 1 : info.alpha;
  g.fillStyle(info.color || 0xf2b34c, alpha);
  g.lineStyle(2, 0x111111, alpha * 0.72);
  if (info.radius) {
    g.fillCircle(body.position.x, body.position.y, info.radius);
    g.strokeCircle(body.position.x, body.position.y, info.radius);
    const eyeX = Math.cos(body.angle) * info.radius * 0.32;
    const eyeY = Math.sin(body.angle) * info.radius * 0.32;
    g.fillStyle(0x111111, alpha);
    g.fillCircle(body.position.x + eyeX, body.position.y + eyeY, Math.max(2, info.radius * 0.16));
    return;
  }
  const vertices = body.vertices;
  if (!vertices || !vertices.length) return;
  g.beginPath();
  g.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    g.lineTo(vertices[i].x, vertices[i].y);
  }
  g.closePath();
  g.fillPath();
  g.strokePath();
}

ragdollWorldPoint(body, point) {
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  return {
    x: body.position.x + point.x * cos - point.y * sin,
    y: body.position.y + point.x * sin + point.y * cos
  };
}

wrapRagdollAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

clearFlightRagdoll() {
  const rig = this.flightRagdoll;
  if (!rig) return;
  if (rig.thumbUpEvent) {
    rig.thumbUpEvent.remove(false);
    rig.thumbUpEvent = null;
  }
  if (rig.thumbUpTween) {
    rig.thumbUpTween.remove();
    rig.thumbUpTween = null;
  }
  if (rig.graphics) {
    rig.graphics.clear();
    rig.graphics.destroy();
  }
  (rig.sprites || []).forEach((sprite) => {
    if (sprite && sprite.destroy) sprite.destroy();
  });
  if (this.matter && this.Matter) {
    if (rig.anchorConstraint) this.Matter.Composite.remove(this.matter.world.localWorld, rig.anchorConstraint);
    (rig.joints || []).forEach((joint) => this.Matter.Composite.remove(this.matter.world.localWorld, joint));
    (rig.parts || []).forEach((body) => this.Matter.Composite.remove(this.matter.world.localWorld, body));
    if (rig.anchor) this.Matter.Composite.remove(this.matter.world.localWorld, rig.anchor);
  }
  this.flightRagdoll = null;
}

setWheelPlayback(active, rate) {
  if (!this.car || !this.car.wheels) return;
  this.car.wheels.forEach((wheel) => {
    if (!wheel || !wheel.anims) return;
    if (active) {
      if (!wheel.anims.isPlaying) wheel.play("wheelSpin");
      else if (wheel.anims.isPaused) wheel.anims.resume();
      wheel.anims.timeScale = Phaser.Math.Clamp(rate || 1, 0.2, 2.4);
    } else if (wheel.anims.isPlaying) {
      wheel.anims.pause();
    }
  });
}

updateCarFlame() {
  if (!this.car || !this.car.turboFire || !this.carControlConfig) return;
  const fireCfg = this.carControlConfig.turboFire;
  if (!this.car.turboFire.anims.isPlaying) this.car.turboFire.play("turboFireLoop");
  const running = this.state === "running";
  const preview = this.state === "ready";
  const power = running ? Phaser.Math.Clamp(this.turboPower, 0, 1) : 0;
  const tintPhase = running ? power : Phaser.Math.Clamp(Number(this.carControlConfig.turboFireTint.preview) || 0, 0, 1);
  const scalePower = running ? 0.2 + power * 0.8 : 0.2;
  const alphaPower = running ? 0.62 + power * 0.38 : (preview ? 0.34 : 0);
  const tint = this.getTurboFireTint(tintPhase);
  const scale = fireCfg.scale * scalePower;
  const alpha = fireCfg.alpha * alphaPower;
  const timeScale = running ? Phaser.Math.Linear(0.75, 2.1, power) : 0.5;
  if (this.car.turboFire._lastTint !== tint) {
    this.car.turboFire.setTint(tint);
    this.car.turboFire._lastTint = tint;
  }
  if (this.car.turboFire._lastScale !== scale) {
    this.car.turboFire.setScale(scale);
    this.car.turboFire._lastScale = scale;
  }
  if (this.car.turboFire._lastAlpha !== alpha) {
    this.car.turboFire.setAlpha(alpha);
    this.car.turboFire._lastAlpha = alpha;
  }
  if (this.car.turboFire._lastTimeScale !== timeScale) {
    this.car.turboFire.anims.timeScale = timeScale;
    this.car.turboFire._lastTimeScale = timeScale;
  }
}

normalizeHexColor(value, fallback) {
  const text = String(value || "").trim();
  const match = text.match(/^#?([0-9a-f]{6})$/i);
  return match ? "#" + match[1].toLowerCase() : String(fallback || "#ffffff").toLowerCase();
}

getTurboFireTint(phase) {
  const tint = this.carControlConfig && this.carControlConfig.turboFireTint
    ? this.carControlConfig.turboFireTint
    : CT.Config.gameplay.carArt.turboFireTint;
  const stops = this.turboFireTintStops || [tint.orange, tint.yellow, tint.green, tint.blue, tint.purple]
    .map((color) => this.hexToRgb(color));
  const t = Phaser.Math.Clamp(Number(phase) || 0, 0, 1) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(t));
  const local = t - index;
  const from = stops[index];
  const to = stops[index + 1];
  const r = Phaser.Math.Linear(from.r, to.r, local);
  const g = Phaser.Math.Linear(from.g, to.g, local);
  const b = Phaser.Math.Linear(from.b, to.b, local);
  return Phaser.Display.Color.GetColor(Math.round(r), Math.round(g), Math.round(b));
}

hexToRgb(color) {
  const hex = this.normalizeHexColor(color, "#ffffff").slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

updateCarBodyBounce(time) {
  if (!this.car || !this.car.bodyRig) return;
  if (this.state !== "running") {
    this.car.bodyRig.y = this.car.bodyBaseY || 0;
    this.car.bodyRig.angle = 0;
    return;
  }
  const power = Phaser.Math.Clamp(this.turboPower, 0, 1);
  const amplitude = 1.2 + power * 0.95;
  const phase = this.car.bodyBouncePhase || 0;
  const pitchPhase = this.car.bodyPitchPhase || 0;
  const roadT = time * 0.001;
  const sharedHop =
    Math.sin(roadT * 27 + phase) * 0.58 +
    Math.sin(roadT * 43 + phase * 1.73) * 0.28 +
    Math.sin(roadT * 71 + phase * 0.41) * 0.14;
  const frontRear =
    Math.sin(roadT * 19 + pitchPhase) * 0.62 +
    Math.sin(roadT * 47 + pitchPhase * 0.77) * 0.28 +
    Math.sin(roadT * 83 + pitchPhase * 1.31) * 0.10;
  const sharpKick = Math.pow(Math.abs(Math.sin(roadT * 12.5 + phase * 0.37)), 7);
  this.car.bodyRig.y = (this.car.bodyBaseY || 0) + sharedHop * amplitude - sharpKick * (0.7 + power * 0.45);
  this.car.bodyRig.angle = frontRear * (0.42 + power * 0.22);
}

updateCarIdleShake(time) {
  if (!this.car || !this.car.bodyRig) return;
  const ready = this.state === "ready" && (!this.car.crashBody || !this.car.crashBody.visible);
  if (!ready) {
    if (this.car.idleShakeActive) {
      this.car.bodyRig.y = this.car.bodyBaseY || 0;
      this.car.bodyRig.angle = 0;
      this.car.idleShakeActive = false;
    }
    return;
  }

  const phase = this.car.idleShakePhase || 0;
  const t = time * 0.001;
  const rumble =
    Math.sin(t * 38 + phase) * 0.29 +
    Math.sin(t * 71 + phase * 1.53) * 0.12 +
    Math.sin(t * 117 + phase * 0.37) * 0.05;
  const pitch =
    Math.sin(t * 31 + phase * 0.72) * 0.055 +
    Math.sin(t * 64 + phase * 1.28) * 0.025;

  this.car.bodyRig.y = (this.car.bodyBaseY || 0) + rumble;
  this.car.bodyRig.angle = pitch;
  this.car.idleShakeActive = true;
}

updateCarGroundShadow() {
  if (!this.car || !this.car.carGroundShadow || !this.carControlConfig) return;
  const cfg = this.carControlConfig;
  const root = cfg.root || CT.Config.gameplay.carArt.root;
  const wheelShadow = cfg.wheelShadow || CT.Config.gameplay.carArt.wheelShadow;
  const carVisualScale = Number(CT.Config.gameplay.carVisualScale) || 1;
  const rootScale = Math.max(0.01, Number(root.scale) || 1) * carVisualScale;
  const baseCarY = this.getGameplayRoadY() - 54;
  const alpha = Phaser.Math.Clamp(Number(wheelShadow.alpha), 0, 1) * Phaser.Math.Clamp(this.car.alpha, 0, 1);
  this.car.carGroundShadow
    .setScrollFactor(this.car.scrollFactorX, this.car.scrollFactorY)
    .setPosition(
      this.car.x + (Number(root.x) || 0) + (Number(wheelShadow.x) || 0) * rootScale,
      baseCarY + (Number(root.y) || 0) + (Number(wheelShadow.y) || 0) * rootScale
    )
    .setScale(Math.max(0.01, Number(wheelShadow.scale) || 1) * rootScale)
    .setAlpha(alpha)
    .setAngle(0)
    .setVisible(this.car.visible !== false && alpha > 0);
}

recycleFailedCarToStart(animate, onComplete, cameraScrollX) {
  const cfg = CT.Config;
  this.stopCrashDebrisRoadLock();
  const viewScrollX = Number.isFinite(cameraScrollX) ? cameraScrollX : 0;
  this.car.setPosition(viewScrollX + cfg.gameplay.carStartX, this.getGameplayRoadY() - 54).setAngle(0).setAlpha(1);
  this.car.setDepth(5);
  if (this.car.bodyRig) this.car.bodyRig.y = this.car.bodyBaseY || 0;
  if (this.car.bodyRig) this.car.bodyRig.angle = 0;
  this.setWheelPlayback(false);
  this.setCarCrashVisual(false);
  this.hideCarLightSweep();
  this.nextCarLightSweepAt = 0;
  this.updateCarFlame();
  this.updateCarGroundShadow();
  this.dummy.setPosition(-22, -45).setAngle(0).setScale(1).setDepth(0);
  if (this.dummy.parentContainer !== this.car) {
    this.car.add(this.dummy);
  }
  this.dummy.setVisible(false);
  if (!animate) {
    if (onComplete) onComplete();
    return this.car;
  }
  this.setWheelPlayback(true, 1.05);
  this.tweens.add({
    targets: this.car,
    x: viewScrollX + cfg.gameplay.carReadyX,
    duration: 620,
    ease: "Cubic.out",
    onUpdate: () => this.updateCarGroundShadow(),
    onComplete: () => {
      this.setWheelPlayback(false);
      this.updateCarGroundShadow();
      if (onComplete) onComplete();
    }
  });
  return this.car;
}

startRun() {
  if (this.state !== "ready") return;
  if (!this.wallet.placeBet()) {
    this.hud.floatText(CT.Config.width - 150, CT.Config.height - 160, "NO BALANCE", CT.Config.colors.danger);
    this.autospinLaunching = false;
    if (this.autospinActive) this.stopAutospin();
    return false;
  }

  const cfg = CT.Config;
  const autospinRun = !!(this.autospinActive && this.autospinLaunching);
  this.autospinLaunching = false;
  this.state = "running";
  this.round += 1;
  this.resetRunVisuals(false);
  this.autospinRoundActive = autospinRun;
  this.multiplier = cfg.gameplay.startMultiplier;
  this.speed = cfg.gameplay.baseSpeed;
  this.turbo = autospinRun;
  this.turboPower = autospinRun ? 1 : 0;
  this.autoCrash = false;
  this.engineBreakAt = this.pickEngineBreakAt();
  this.hud.update();
  this.hud.setMultiplier(this.multiplier);
  this.hud.setRunning(true);
  if (this.hud && this.hud.setAutospinActive) this.hud.setAutospinActive(this.autospinActive, false);
  this.hud.setTurbo(autospinRun);
  this.setPageControlsDimmed(true);
  this.hud.setResult("RUNNING...", "#ffffff");
  this.applyMultiplierTheme("running");
  this.updateBounceText();
  this.ensureBackgroundMusic();
  this.playEngineStart();
  return true;
}

handleLeverPress() {
  if (this.state === "ready") this.startRun();
}

handleLeverRelease() {
  if (this.state === "running") {
    this.cashOutCrash();
    return;
  }
  this.setTurboPower(0);
}

pickEngineBreakAt() {
  if (this.safeMode) return Number.POSITIVE_INFINITY;
  const cfg = CT.Config;
  const instantBustChance = 0.23;
  if (Math.random() < instantBustChance) {
    return Phaser.Math.FloatBetween(0.12, 0.98);
  }

  if (Math.random() < 0.16) {
    const t = Math.pow(Math.random(), 1.45);
    return Number((1.01 + t * 0.92).toFixed(2));
  }

  const houseEdge = 0.84;
  const raw = houseEdge / Math.max(0.001, 1 - Math.random());
  if (raw < 1.03) {
    return Phaser.Math.FloatBetween(1.01, 1.18);
  }

  const jitter = Phaser.Math.FloatBetween(0.96, 1.04);
  return Phaser.Math.Clamp(raw * jitter, 1.01, cfg.gameplay.maxMultiplier);
}

setTurboPower(power) {
  const nextPower = this.state === "running" ? Phaser.Math.Clamp(Number(power || 0), 0, 1) : 0;
  const nextTurbo = nextPower > 0.03;
  if (Math.abs(this.turboPower - nextPower) < 0.005 && this.turbo === nextTurbo) return;
  this.turboPower = nextPower;
  this.turbo = nextTurbo;
  this.hud.setTurbo(this.turbo);
  this.updateCarFlame();
}

toggleSafeMode() {
  if (this.state !== "ready") return;
  this.safeMode = !this.safeMode;
  this.hud.setSafeMode(this.safeMode);
  this.hud.setResult(this.safeMode ? "ENGINE SAFE MODE" : "LAST RESULT --", this.safeMode ? CT.Config.colors.ok : "#93a4ad");
}

toggleJumpBooster() {
  if (this.state !== "ready") return this.jumpBoosterEnabled;
  this.jumpBoosterEnabled = !this.jumpBoosterEnabled;
  const costMultiplier = this.jumpBoosterEnabled ? (Number(CT.Config.gameplay.jumpBoosterCostMultiplier) || 1.5) : 1;
  this.wallet.setBetCostMultiplier(costMultiplier);
  this.hud.update();
  this.updateBounceText();
  return this.jumpBoosterEnabled;
}

handleAutospinButtonPress() {
  if (this.autospinActive) {
    this.stopAutospin();
    return;
  }
  this.showAutospinPopup();
}

getAutospinUiGroup(name) {
  const defaults = (CT.Config.gameplay.sceneTest || {});
  return (this.sceneTuningConfig && this.sceneTuningConfig[name]) || defaults[name] || {};
}

numOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

createAutospinText(text, originX) {
  return this.add.text(0, 0, text, {
    fontFamily: CT.Config.fontFamily || "Arial",
    fontSize: "54px",
    color: "#E9E8F9",
    letterSpacing: CT.Config.fontLetterSpacing || 0,
    resolution: CT.Config.fontResolution || 1
  }).setOrigin(originX, 0.5).setShadow(0, 6, "rgba(0,0,0,0.64)", 0, false, true);
}

createAutospinSlider(maxValue, formatter, mode) {
  const slider = {
    maxValue,
    value: 0,
    formatter,
    mode: mode || "linear",
    track: this.add.graphics(),
    knob: this.add.image(0, 0, "autospinSliderKnob").setOrigin(0.5),
    hit: this.add.zone(0, 0, 520, 92).setInteractive({ useHandCursor: true }),
    startX: 0,
    startY: 0,
    endX: 1,
    endY: 0,
    scale: 1
  };
  slider.hit.on("pointerdown", (pointer) => this.dragAutospinSlider(slider, pointer));
  this.input.on("pointermove", (pointer) => {
    if (slider.dragging) this.dragAutospinSlider(slider, pointer);
  });
  this.input.on("pointerup", () => { slider.dragging = false; });
  slider.hit.on("pointerupoutside", () => { slider.dragging = false; });
  return slider;
}

createAutospinPopup() {
  if (this.autospinOverlay) return;
  const W = CT.Config.width;
  const H = CT.Config.height;
  const root = this.add.container(0, 0).setDepth(122).setScrollFactor(0).setVisible(false);
  const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setAlpha(0).setInteractive();
  const popup = this.add.container(W / 2, H / 2).setAlpha(0);
  const bg = this.add.image(0, 0, "autospinMainPopup").setOrigin(0.5);
  const close = this.add.image(292, -330, "bonusMainPopupClose").setOrigin(0.5).setInteractive({ useHandCursor: true });
  const start = this.add.image(0, 280, "bonusMainPopupButton").setOrigin(0.5).setInteractive({ useHandCursor: true });
  const labelX = this.createAutospinText("CRASH ON X:", 0);
  const valueX = this.createAutospinText("0x", 1);
  const labelJumps = this.createAutospinText("CRASH ON JUMPS:", 0);
  const valueJumps = this.createAutospinText("0", 1);
  const xSlider = this.createAutospinSlider(1000, (value) => value + "x", "xSteps");
  const jumpsSlider = this.createAutospinSlider(20, (value) => String(value));

  close.on("pointerdown", () => this.closeAutospinPopup());
  start.on("pointerdown", () => this.confirmAutospinPopup());

  popup.add([
    bg,
    xSlider.track,
    jumpsSlider.track,
    xSlider.knob,
    jumpsSlider.knob,
    xSlider.hit,
    jumpsSlider.hit,
    labelX,
    valueX,
    labelJumps,
    valueJumps,
    start,
    close
  ]);
  root.add([shade, popup]);
  root.shade = shade;
  root.popup = popup;
  root.bg = bg;
  root.close = close;
  root.start = start;
  this.autospinOverlay = root;
  this.autospinPopup = popup;
  this.autospinControls = { labelX, valueX, labelJumps, valueJumps, xSlider, jumpsSlider };
  this.applyAutospinUiLayout();
}

applyAutospinUiLayout() {
  if (!this.autospinOverlay || !this.autospinControls) return;
  const popupCfg = this.getAutospinUiGroup("autospinPopup");
  const startCfg = this.getAutospinUiGroup("autospinStartButton");
  const closeCfg = this.getAutospinUiGroup("autospinCloseButton");
  const textCfgs = [
    [this.autospinControls.labelX, this.getAutospinUiGroup("autospinLabelX")],
    [this.autospinControls.valueX, this.getAutospinUiGroup("autospinValueX")],
    [this.autospinControls.labelJumps, this.getAutospinUiGroup("autospinLabelJumps")],
    [this.autospinControls.valueJumps, this.getAutospinUiGroup("autospinValueJumps")]
  ];
  this.autospinOverlay.popup
    .setPosition(this.numOr(popupCfg.x, CT.Config.width / 2), this.numOr(popupCfg.y, CT.Config.height / 2))
    .setScale(Math.max(0.05, Number(popupCfg.scale) || 0.72));
  textCfgs.forEach(([text, cfg]) => {
    text.setPosition(this.numOr(cfg.x, 0), this.numOr(cfg.y, 0)).setFontSize((Math.max(8, Number(cfg.size) || 54)) + "px");
  });
  this.autospinOverlay.start
    .setPosition(this.numOr(startCfg.x, 0), this.numOr(startCfg.y, 0))
    .setScale(Math.max(0.05, Number(startCfg.scale) || 1));
  this.autospinOverlay.close
    .setPosition(this.numOr(closeCfg.x, 0), this.numOr(closeCfg.y, 0))
    .setScale(Math.max(0.05, Number(closeCfg.scale) || 0.5));
  this.layoutAutospinSlider(this.autospinControls.xSlider, this.getAutospinUiGroup("autospinSliderX"));
  this.layoutAutospinSlider(this.autospinControls.jumpsSlider, this.getAutospinUiGroup("autospinSliderJumps"));
  this.updateAutospinPopupValues(false);
}

layoutAutospinSlider(slider, cfg) {
  if (!slider) return;
  slider.startX = this.numOr(cfg.startX, 0);
  slider.startY = this.numOr(cfg.startY, 0);
  slider.endX = this.numOr(cfg.endX, slider.startX + 1);
  slider.endY = this.numOr(cfg.endY, slider.startY);
  slider.scale = Math.max(0.05, Number(cfg.scale) || 1);
  const midX = (slider.startX + slider.endX) * 0.5;
  const midY = (slider.startY + slider.endY) * 0.5;
  const width = Math.max(80, Phaser.Math.Distance.Between(slider.startX, slider.startY, slider.endX, slider.endY) + 96 * slider.scale);
  slider.hit.setPosition(midX, midY).setSize(width, 96 * slider.scale);
  this.updateAutospinSliderVisual(slider);
}

dragAutospinSlider(slider, pointer) {
  if (!this.autospinPopup || !slider) return;
  slider.dragging = true;
  const scale = this.autospinPopup.scaleX || 1;
  const localX = (pointer.x - this.autospinPopup.x) / scale;
  const localY = (pointer.y - this.autospinPopup.y) / scale;
  const dx = slider.endX - slider.startX;
  const dy = slider.endY - slider.startY;
  const lenSq = Math.max(1, dx * dx + dy * dy);
  const t = Phaser.Math.Clamp(((localX - slider.startX) * dx + (localY - slider.startY) * dy) / lenSq, 0, 1);
  slider.value = this.getAutospinSliderValue(slider, t);
  this.updateAutospinPopupValues(true);
}

getAutospinSliderValue(slider, progress) {
  const t = Phaser.Math.Clamp(Number(progress) || 0, 0, 1);
  if (!slider || slider.mode !== "xSteps") return Math.round(t * Math.max(1, slider ? slider.maxValue : 1));
  if (t <= 0.001) return 0;
  if (t <= 1 / 3) {
    return Phaser.Math.Clamp(Math.ceil((t / (1 / 3)) * 10), 1, 10);
  }
  if (t <= 2 / 3) {
    const p = (t - 1 / 3) / (1 / 3);
    return Phaser.Math.Clamp(10 + Math.ceil(p * 9) * 10, 20, 100);
  }
  const p = (t - 2 / 3) / (1 / 3);
  return Phaser.Math.Clamp(100 + Math.ceil(p * 9) * 100, 200, 1000);
}

getAutospinSliderProgress(slider) {
  if (!slider) return 0;
  const value = Phaser.Math.Clamp(Number(slider.value) || 0, 0, Number(slider.maxValue) || 1);
  if (slider.mode !== "xSteps") return Phaser.Math.Clamp(value / Math.max(1, slider.maxValue), 0, 1);
  if (value <= 0) return 0;
  if (value <= 10) return (value / 10) / 3;
  if (value <= 100) return (1 / 3) + (((value - 10) / 90) / 3);
  return (2 / 3) + (((value - 100) / 900) / 3);
}

updateAutospinPopupValues(animated) {
  if (!this.autospinControls) return;
  const xSlider = this.autospinControls.xSlider;
  const jumpsSlider = this.autospinControls.jumpsSlider;
  this.autospinControls.valueX.setText(xSlider.formatter(xSlider.value));
  this.autospinControls.valueJumps.setText(jumpsSlider.formatter(jumpsSlider.value));
  this.updateAutospinSliderVisual(xSlider, animated, [this.autospinControls.labelX, this.autospinControls.valueX]);
  this.updateAutospinSliderVisual(jumpsSlider, animated, [this.autospinControls.labelJumps, this.autospinControls.valueJumps]);
}

updateAutospinSliderVisual(slider, animated, linkedText) {
  if (!slider) return;
  const progress = this.getAutospinSliderProgress(slider);
  const active = slider.value > 0;
  const alpha = active ? 1 : 0.34;
  const knobX = Phaser.Math.Linear(slider.startX, slider.endX, progress);
  const knobY = Phaser.Math.Linear(slider.startY, slider.endY, progress);
  slider.track.clear();
  slider.track.lineStyle(6 * slider.scale, 0xe9e8f9, alpha);
  slider.track.beginPath();
  slider.track.moveTo(slider.startX, slider.startY);
  slider.track.lineTo(slider.endX, slider.endY);
  slider.track.strokePath();
  if (active) {
    slider.track.lineStyle(9 * slider.scale, 0xeefe0d, 0.78);
    slider.track.beginPath();
    slider.track.moveTo(slider.startX, slider.startY);
    slider.track.lineTo(knobX, knobY);
    slider.track.strokePath();
  }
  slider.knob.setAlpha(alpha).setScale(slider.scale);
  this.tweens.killTweensOf(slider.knob);
  slider.knob.setPosition(knobX, knobY);
  (linkedText || []).forEach((text) => {
    this.tweens.killTweensOf(text);
    text.setAlpha(alpha);
  });
}

showAutospinPopup() {
  if (this.state !== "ready" || this.bonusGameStarting) return;
  this.createAutospinPopup();
  if (this.hud && this.hud.hideBetPopup) this.hud.hideBetPopup();
  this.setPageControlsDimmed(true);
  const overlay = this.autospinOverlay;
  const popup = overlay.popup;
  const popupCfg = this.getAutospinUiGroup("autospinPopup");
  const popupX = this.numOr(popupCfg.x, CT.Config.width / 2);
  const popupY = this.numOr(popupCfg.y, CT.Config.height / 2);
  const popupScale = Math.max(0.05, Number(popupCfg.scale) || 0.72);
  overlay.setVisible(true).setAlpha(1);
  overlay.shade.setAlpha(0);
  this.applyAutospinUiLayout();
  popup.setPosition(popupX, popupY + 34).setScale(popupScale * 0.78).setAlpha(0);
  this.tweens.killTweensOf([overlay, overlay.shade, popup]);
  this.tweens.add({ targets: overlay.shade, alpha: 0.75, duration: 170, ease: "Sine.out" });
  this.tweens.add({
    targets: popup,
    x: popupX,
    y: popupY,
    scaleX: popupScale,
    scaleY: popupScale,
    alpha: 1,
    duration: 340,
    ease: "Back.out"
  });
}

closeAutospinPopup(duration, onComplete) {
  if (!this.autospinOverlay || !this.autospinOverlay.visible) {
    if (onComplete) onComplete();
    return;
  }
  const overlay = this.autospinOverlay;
  this.tweens.killTweensOf([overlay, overlay.shade, overlay.popup]);
  this.tweens.add({
    targets: overlay,
    alpha: 0,
    duration: duration == null ? 150 : duration,
    ease: "Sine.out",
    onComplete: () => {
      overlay.setVisible(false).setAlpha(1);
      if (this.state === "ready" && !this.autospinActive) this.setPageControlsDimmed(false);
      if (onComplete) onComplete();
    }
  });
}

confirmAutospinPopup() {
  const xLimit = this.autospinControls ? Math.floor(this.autospinControls.xSlider.value) : 0;
  const jumpsLimit = this.autospinControls ? Math.floor(this.autospinControls.jumpsSlider.value) : 0;
  if (xLimit <= 0 && jumpsLimit <= 0) {
    if (this.autospinPopup) {
      const baseX = this.autospinPopup.x;
      this.tweens.add({
        targets: this.autospinPopup,
        x: baseX + 12,
        duration: 44,
        yoyo: true,
        repeat: 4,
        ease: "Sine.inOut",
        onComplete: () => this.autospinPopup.setX(baseX)
      });
    }
    return;
  }
  this.autospinSettings = {
    crashX: Phaser.Math.Clamp(xLimit, 0, 1000),
    crashJumps: Phaser.Math.Clamp(jumpsLimit, 0, 20)
  };
  this.startAutospin();
}

startAutospin() {
  this.autospinActive = true;
  if (this.hud && this.hud.setAutospinActive) this.hud.setAutospinActive(true, true);
  this.closeAutospinPopup(170, () => {
    this.setPageControlsDimmed(false);
    this.queueAutospinNextRun(120);
  });
}

stopAutospin() {
  this.autospinActive = false;
  this.autospinLaunching = false;
  this.autospinRoundActive = false;
  if (this.autospinNextRunTimer) {
    this.autospinNextRunTimer.remove(false);
    this.autospinNextRunTimer = null;
  }
  if (this.hud && this.hud.setAutospinActive) this.hud.setAutospinActive(false, true);
  if (this.hud && this.state === "ready") this.hud.setRunning(false);
  if (this.hud && this.state !== "ready" && this.hud.autospinButton) {
    this.hud.autospinLocked = true;
    this.hud.autospinButton.setAlpha(0.5);
    this.hud.autospinButton.hit.disableInteractive();
  }
  if (this.state === "ready") this.setPageControlsDimmed(false);
}

queueAutospinNextRun(delay) {
  if (!this.autospinActive || this.state !== "ready") return;
  if (this.autospinNextRunTimer) this.autospinNextRunTimer.remove(false);
  this.autospinNextRunTimer = this.time.delayedCall(delay == null ? 220 : delay, () => {
    this.autospinNextRunTimer = null;
    this.startAutospinRun();
  });
}

startAutospinRun() {
  if (!this.autospinActive || this.state !== "ready") return;
  this.autospinLaunching = true;
  const started = this.startRun();
  if (!started) this.stopAutospin();
}

checkAutospinCrash() {
  if (!this.autospinActive || !this.autospinRoundActive || this.state !== "running" || this.bonusGameActive) return false;
  const xLimit = Number(this.autospinSettings.crashX) || 0;
  const jumpsLimit = Number(this.autospinSettings.crashJumps) || 0;
  const hitX = xLimit > 0 && this.multiplier >= xLimit;
  const hitJumps = jumpsLimit > 0 && this.getBounceCount(this.multiplier) >= jumpsLimit;
  if (!hitX && !hitJumps) return false;
  this.autoCrash = true;
  this.cashOutCrash();
  return true;
}

getBonusGameBaseBet() {
  return this.wallet && this.wallet.getBaseBet ? this.wallet.getBaseBet() : (this.wallet ? this.wallet.currentBet : 0);
}

getBonusGameCost() {
  const price = Number(CT.Config.gameplay.bonusGameCostMultiplier) || 200;
  return Number((this.getBonusGameBaseBet() * price).toFixed(2));
}

getBonusGameUiGroup(name) {
  const defaults = (CT.Config.gameplay.sceneTest || {});
  const source = (this.sceneTuningConfig && this.sceneTuningConfig[name]) || defaults[name] || {};
  return source;
}

applyBonusGameUiLayout() {
  if (!this.bonusGameOverlay) return;
  const popupCfg = this.getBonusGameUiGroup("bonusPopup");
  const bgCfg = this.getBonusGameUiGroup("bonusPopupBg");
  const info1Cfg = this.getBonusGameUiGroup("bonusInfoLine1");
  const info2Cfg = this.getBonusGameUiGroup("bonusInfoLine2");
  const startCfg = this.getBonusGameUiGroup("bonusStartButton");
  const closeCfg = this.getBonusGameUiGroup("bonusCloseButton");
  const setImage = (image, cfg) => {
    if (!image) return;
    image
      .setPosition(Number(cfg.x) || 0, Number(cfg.y) || 0)
      .setScale(Math.max(0.05, Number(cfg.scale) || 1));
  };

  this.bonusGameOverlay.popup
    .setPosition(Number(popupCfg.x) || CT.Config.width / 2, Number(popupCfg.y) || CT.Config.height / 2)
    .setScale(Math.max(0.05, Number(popupCfg.scale) || 0.56));
  setImage(this.bonusGameOverlay.bg, bgCfg);
  setImage(this.bonusGameOverlay.info1, info1Cfg);
  setImage(this.bonusGameOverlay.info2, info2Cfg);
  setImage(this.bonusGameOverlay.start, startCfg);
  setImage(this.bonusGameOverlay.close, closeCfg);
}

createBonusGamePopup() {
  if (this.bonusGameOverlay) return;
  const cfg = CT.Config;
  const W = cfg.width;
  const H = cfg.height;
  const root = this.add.container(0, 0).setDepth(120).setScrollFactor(0).setVisible(false);
  const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setAlpha(0).setInteractive();
  const popup = this.add.container(W / 2, H / 2).setAlpha(0);

  const bg = this.add.image(0, 0, "bonusMainPopup").setOrigin(0.5);
  const close = this.add.image(500, -500, "bonusMainPopupClose").setOrigin(0.5).setInteractive({ useHandCursor: true });
  const info1 = this.add.image(0, 150, "bonusInfoLine1").setOrigin(0.5).setAlpha(0);
  const info2 = this.add.image(0, 238, "bonusInfoLine2").setOrigin(0.5).setAlpha(0);
  const start = this.add.image(0, 405, "bonusMainPopupButton").setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

  close.on("pointerdown", () => this.closeBonusGamePopup());
  start.on("pointerdown", () => this.confirmBonusGamePurchase());

  popup.add([bg, info1, info2, start, close]);
  root.add([shade, popup]);
  root.shade = shade;
  root.popup = popup;
  root.bg = bg;
  root.info1 = info1;
  root.info2 = info2;
  root.start = start;
  root.close = close;
  this.bonusGameOverlay = root;
  this.bonusGamePopup = popup;
  this.applyBonusGameUiLayout();
}

showBonusGamePopup() {
  if (this.state !== "ready" || this.bonusGameStarting) return;
  if (this.jumpBoosterEnabled) {
    if (this.hud && this.hud.pulseJumpBoosterHint) this.hud.pulseJumpBoosterHint();
    return;
  }
  this.createBonusGamePopup();
  if (this.hud && this.hud.hideBetPopup) this.hud.hideBetPopup();
  this.setPageControlsDimmed(true);
  if (this.hud && this.hud.setBonusCostMode) this.hud.setBonusCostMode(true);

  const overlay = this.bonusGameOverlay;
  const popup = overlay.popup;
  const popupCfg = this.getBonusGameUiGroup("bonusPopup");
  const info1Cfg = this.getBonusGameUiGroup("bonusInfoLine1");
  const info2Cfg = this.getBonusGameUiGroup("bonusInfoLine2");
  const startCfg = this.getBonusGameUiGroup("bonusStartButton");
  const closeCfg = this.getBonusGameUiGroup("bonusCloseButton");
  const popupX = Number(popupCfg.x) || CT.Config.width / 2;
  const popupY = Number(popupCfg.y) || CT.Config.height / 2;
  const popupScale = Math.max(0.05, Number(popupCfg.scale) || 0.56);
  const info1Scale = Math.max(0.05, Number(info1Cfg.scale) || 1);
  const info2Scale = Math.max(0.05, Number(info2Cfg.scale) || 1);
  const startScale = Math.max(0.05, Number(startCfg.scale) || 1);
  const closeScale = Math.max(0.05, Number(closeCfg.scale) || 1);

  overlay.setVisible(true).setAlpha(1);
  overlay.shade.setAlpha(0);
  this.applyBonusGameUiLayout();
  popup.setPosition(popupX, popupY + 26).setScale(popupScale * 0.72).setAlpha(0);
  overlay.info1.setPosition(Number(info1Cfg.x) || 0, (Number(info1Cfg.y) || 0) + 26).setScale(info1Scale * 0.84).setAlpha(0);
  overlay.info2.setPosition(Number(info2Cfg.x) || 0, (Number(info2Cfg.y) || 0) + 26).setScale(info2Scale * 0.84).setAlpha(0);
  overlay.start.setPosition(Number(startCfg.x) || 0, (Number(startCfg.y) || 0) - 74).setScale(startScale * 0.84).setAlpha(0);
  overlay.close.setPosition(Number(closeCfg.x) || 0, Number(closeCfg.y) || 0).setAlpha(1).setScale(closeScale);

  this.tweens.killTweensOf([overlay, overlay.shade, popup, overlay.info1, overlay.info2, overlay.start, overlay.close]);
  this.tweens.add({ targets: overlay.shade, alpha: 0.75, duration: 180, ease: "Sine.out" });
  this.tweens.add({
    targets: popup,
    x: popupX,
    y: popupY,
    scaleX: popupScale,
    scaleY: popupScale,
    alpha: 1,
    duration: 390,
    ease: "Back.out"
  });
  this.tweens.add({
    targets: overlay.info1,
    x: Number(info1Cfg.x) || 0,
    y: Number(info1Cfg.y) || 0,
    scaleX: info1Scale,
    scaleY: info1Scale,
    alpha: 1,
    delay: 210,
    duration: 260,
    ease: "Back.out"
  });
  this.tweens.add({
    targets: overlay.info2,
    x: Number(info2Cfg.x) || 0,
    y: Number(info2Cfg.y) || 0,
    scaleX: info2Scale,
    scaleY: info2Scale,
    alpha: 1,
    delay: 310,
    duration: 280,
    ease: "Back.out"
  });
  this.tweens.add({
    targets: overlay.start,
    x: Number(startCfg.x) || 0,
    y: Number(startCfg.y) || 0,
    scaleX: startScale,
    scaleY: startScale,
    alpha: 1,
    delay: 420,
    duration: 340,
    ease: "Bounce.out"
  });
}

closeBonusGamePopup(duration) {
  if (!this.bonusGameOverlay || !this.bonusGameOverlay.visible) return;
  const overlay = this.bonusGameOverlay;
  if (this.hud && this.hud.setBonusCostMode) this.hud.setBonusCostMode(false);
  this.tweens.killTweensOf([overlay, overlay.shade, overlay.popup, overlay.info1, overlay.info2, overlay.start, overlay.close]);
  this.tweens.add({
    targets: overlay,
    alpha: 0,
    duration: duration == null ? 160 : duration,
    ease: "Sine.out",
    onComplete: () => {
      overlay.setVisible(false).setAlpha(1);
      this.bonusGameStarting = false;
      if (this.state === "ready") this.setPageControlsDimmed(false);
    }
  });
}

confirmBonusGamePurchase() {
  if (this.state !== "ready" || this.bonusGameStarting) return;
  if (this.jumpBoosterEnabled) {
    if (this.hud && this.hud.pulseJumpBoosterHint) this.hud.pulseJumpBoosterHint();
    return;
  }
  const cost = this.getBonusGameCost();
  if (!this.wallet.spend(cost)) {
    if (this.bonusGameOverlay && this.bonusGameOverlay.popup) {
      const popupCfg = this.getBonusGameUiGroup("bonusPopup");
      const popupX = Number(popupCfg.x) || CT.Config.width / 2;
      this.tweens.add({
        targets: this.bonusGameOverlay.popup,
        x: popupX + 10,
        duration: 44,
        yoyo: true,
        repeat: 4,
        ease: "Sine.inOut",
        onComplete: () => this.bonusGameOverlay.popup.setX(popupX)
      });
    }
    const warn = this.add.text(CT.Config.width / 2, CT.Config.height * 0.42, "NEED $" + this.wallet.format(cost), {
      fontFamily: CT.Config.fontFamily || "Arial",
      fontSize: "58px",
      color: CT.Config.colors.danger,
      letterSpacing: CT.Config.fontLetterSpacing || 0,
      resolution: CT.Config.fontResolution || 1
    }).setOrigin(0.5).setDepth(130).setScrollFactor(0);
    this.tweens.add({
      targets: warn,
      y: warn.y - 70,
      alpha: 0,
      duration: 820,
      ease: "Cubic.out",
      onComplete: () => warn.destroy()
    });
    return;
  }

  this.bonusGameStarting = true;
  if (this.hud && this.hud.setBonusCostMode) this.hud.setBonusCostMode(false);
  this.hud.update();
  const overlay = this.bonusGameOverlay;
  this.tweens.killTweensOf([overlay.popup, overlay.shade]);
  this.tweens.add({
    targets: overlay.popup,
    y: -520,
    alpha: 0,
    duration: 380,
    ease: "Cubic.in"
  });
  this.tweens.add({
    targets: overlay.shade,
    alpha: 0,
    duration: 380,
    ease: "Sine.in",
    onComplete: () => {
      overlay.setVisible(false).setAlpha(1);
      this.beginBonusGameRun();
    }
  });
}

beginBonusGameRun() {
  const cfg = CT.Config;
  this.resetRunVisuals(false);
  this.state = "running";
  this.round += 1;
  this.bonusGameActive = true;
  this.bonusGameStarting = false;
  this.bonusGameIntroElapsed = 0;
  this.bonusGameIntroComplete = false;
  this.bonusGamePostIntroElapsed = 0;
  this.bonusGameCrashQueued = false;
  this.bonusGameBounceDisplay = 0;
  this.bonusGamePayoutBet = this.getBonusGameBaseBet();
  this.multiplier = cfg.gameplay.startMultiplier;
  this.speed = cfg.gameplay.baseSpeed;
  this.visualSpeed = cfg.gameplay.roadBaseSpeed;
  this.turbo = true;
  this.turboPower = 1;
  this.autoCrash = true;
  this.engineBreakAt = Number.POSITIVE_INFINITY;
  this.hud.update();
  this.hud.setMultiplier(0);
  this.hud.setLocked(true);
  this.hud.setTurbo(true);
  this.setPageControlsDimmed(true);
  this.hud.setResult("BONUS RUN", "#ffffff");
  this.applyMultiplierTheme("running");
  this.updateBounceText();
  this.ensureBackgroundMusic();
  this.playEngineStart();
}

updateBonusGameIntro(delta) {
  const cfg = CT.Config;
  const gameplay = cfg.gameplay;
  const dt = delta / 1000;
  const duration = Math.max(420, Number(gameplay.bonusGameIntroDuration) || 1450);
  const targetBounces = Math.max(1, Math.floor(Number(gameplay.bonusGameBounces) || 10));
  if (this.bonusGameIntroComplete) {
    this.bonusGamePostIntroElapsed += delta;
    const postT = Phaser.Math.Clamp(this.bonusGamePostIntroElapsed / 260, 0, 1);
    const postEase = Phaser.Math.Easing.Sine.Out(postT);
    const roadSpeed = Phaser.Math.Linear(2220, 2680, postEase);
    const dx = roadSpeed * dt;
    this.turbo = true;
    this.turboPower = 1;
    this.speed = Phaser.Math.Linear(6000, 7000, postEase);
    this.visualSpeed = roadSpeed;
    this.multiplier = 0;
    this.hud.setMultiplier(0);
    this.bonusGameBounceDisplay = targetBounces;
    this.updateBounceText();
    if (this.car.x < gameplay.carCruiseX) {
      this.car.x = Math.min(gameplay.carCruiseX, this.car.x + dx);
    }
    this.car.y = this.getGameplayRoadY() - 59.04;
    this.car.angle = -3.57;
    this.updateCarBodyBounce(this.time.now);
    this.setWheelPlayback(true, Phaser.Math.Linear(2.05, 2.22, postEase));
    this.updateCarFlame();
    this.updateCarLightSweep(roadSpeed);
    this.updateCarGroundShadow();
    this.advanceRoad(dx);
    return;
  }
  this.bonusGameIntroElapsed += delta;
  const t = Phaser.Math.Clamp(this.bonusGameIntroElapsed / duration, 0, 1);
  const speedEase = Phaser.Math.Easing.Quadratic.Out(t);
  const visualEase = Phaser.Math.Easing.Sine.Out(t);
  const roadSpeed = Phaser.Math.Linear(920, 2220, speedEase);

  this.turbo = true;
  this.turboPower = 1;
  this.speed = Phaser.Math.Linear(900, 6000, speedEase);
  this.visualSpeed = roadSpeed;
  this.multiplier = 0;
  this.hud.setMultiplier(0);

  const nextDisplay = Math.min(targetBounces, Math.floor(speedEase * targetBounces + 0.0001));
  if (nextDisplay !== this.bonusGameBounceDisplay) {
    this.bonusGameBounceDisplay = nextDisplay;
    this.updateBounceText();
    this.pulseBonusGameBounceBadge(false);
  }

  const dx = roadSpeed * dt;
  if (this.car.x < gameplay.carCruiseX) {
    this.car.x = Math.min(gameplay.carCruiseX, this.car.x + dx);
  }
  this.car.y = this.getGameplayRoadY() - 54 - 5.04 * visualEase;
  this.car.angle = -3.57 * visualEase;
  this.updateCarBodyBounce(this.time.now);
  this.setWheelPlayback(true, Phaser.Math.Linear(0.92, 2.05, speedEase));
  this.updateCarFlame();
  this.updateCarLightSweep(roadSpeed);
  this.updateCarGroundShadow();
  this.advanceRoad(dx);

  if (t >= 1 && !this.bonusGameCrashQueued) {
    this.bonusGameIntroComplete = true;
    this.bonusGameCrashQueued = true;
    this.bonusGamePostIntroElapsed = 0;
    this.bonusGameBounceDisplay = targetBounces;
    this.updateBounceText();
    this.pulseBonusGameBounceBadge(true);
    this.time.delayedCall(240, () => {
      if (this.state === "running" && this.bonusGameActive) this.cashOutCrash();
    });
  }
}

pulseBonusGameBounceBadge(finalPulse, onComplete) {
  if (!this.bounceBadge) {
    if (onComplete) onComplete();
    return;
  }
  this.tweens.killTweensOf([this.bounceBadge, this.bounceBadgeIcon, this.bounceBadgeText]);
  this.bounceBadge
    .setVisible(true)
    .setAlpha(1)
    .setScale(finalPulse ? 1.68 : 1.16)
    .setAngle(finalPulse ? -18 : -7);
  this.bounceBadgeIcon.setAlpha(1).setScale(finalPulse ? 0.72 : 0.56);
  this.bounceBadgeExtraIcon.setAlpha(0);
  this.bounceBadgeText.setColor("#ffffff").setScale(finalPulse ? 1.36 : 1);
  this.tweens.add({
    targets: this.bounceBadge,
    scaleX: finalPulse ? 1.12 : 1,
    scaleY: finalPulse ? 1.12 : 1,
    angle: -7,
    duration: finalPulse ? 240 : 190,
    ease: finalPulse ? "Back.out" : "Sine.out",
    onComplete
  });
  if (finalPulse) {
    this.tweens.add({
      targets: this.bounceBadgeIcon,
      scaleX: 0.56,
      scaleY: 0.56,
      duration: 220,
      ease: "Back.out"
    });
    this.tweens.add({
      targets: this.bounceBadgeText,
      scaleX: 1,
      scaleY: 1,
      duration: 220,
      ease: "Back.out"
    });
  }
}

cashOutCrash() {
  if (this.state !== "running") return;
  const releaseTurboPower = this.turboPower;
  const releaseFactor = 1 + (CT.Config.gameplay.turboFactor - 1) * releaseTurboPower;
  const releaseRoadSpeed = this.bonusGameActive
    ? Math.max(1600, this.visualSpeed || 1400)
    : Math.max(460, (this.visualSpeed || 340) * releaseFactor);
  this.setTurboPower(0);
  this.stopEngineAudio();
  this.playOneShot("carCrash");
  this.state = "crashing";
  this.updateCarFlame();
  const payoutBet = this.bonusGameActive ? this.bonusGamePayoutBet : (this.wallet.getPayoutBet ? this.wallet.getPayoutBet() : this.wallet.currentBet);
  const payout = payoutBet * this.multiplier;
  const crashRoadTravel = 820;
  const crashApproachDuration = Phaser.Math.Clamp((crashRoadTravel / releaseRoadSpeed) * 1000 * 0.48, 240, 390);
  const impactWallX = CT.Config.width * 0.57 + 142;
  const impactCarX = CT.Config.width * 0.57 - 10;
  const wallStartX = impactWallX + crashRoadTravel;
  this.pendingPayout = payout;
  this.bonusAdd = 0;
  this.clearBonusItems();
  this.hud.setLocked(true);
  this.hud.setResult(this.bonusGameActive ? "BONUS CRASH!" : (this.autospinRoundActive ? "AUTOSPIN CRASH!" : (this.autoCrash ? "WALL HIT!" : "CRASH!")), "#ffffff");
  this.barrier.setVisible(true);
  this.barrier.setPosition(wallStartX, this.offsetGameplayY(this.hitWallY)).setAlpha(this.hitWallAlpha).setScale(1);
  const carStartX = this.car.x;
  this.tweens.killTweensOf(this.car);
  this.tweens.killTweensOf(this.barrier);
  this.cameras.main.shake(360, 0.0032);

  const roadMotion = { t: 0 };
  let lastRoadT = 0;
  let crashVisualStarted = false;
  const crashVisualLead = 150;
  const crashVisualStartT = Math.max(0, 1 - crashVisualLead / crashApproachDuration);
  const startCrashVisual = () => {
    if (crashVisualStarted) return;
    crashVisualStarted = true;
    this.setCarCrashVisual(true);
  };
  this.tweens.add({
    targets: roadMotion,
    t: 1,
    duration: crashApproachDuration,
    ease: "Linear",
    onUpdate: () => {
      const motionT = roadMotion.t * 0.26 + Phaser.Math.Easing.Sine.Out(roadMotion.t) * 0.74;
      const diff = motionT - lastRoadT;
      lastRoadT = motionT;
      this.advanceRoad(diff * crashRoadTravel);
      const nextBarrierX = wallStartX - motionT * crashRoadTravel;
      const nextCarX = Phaser.Math.Linear(carStartX, impactCarX, motionT);
      this.barrier.x = nextBarrierX;
      this.car.x = nextCarX;
      this.updateCarGroundShadow();
      if (roadMotion.t >= crashVisualStartT) startCrashVisual();
    },
    onComplete: () => {
      startCrashVisual();
      this.barrier.x = impactWallX;
      this.car.x = impactCarX;
      this.updateCarGroundShadow();
      this.playCrashImpact(payout);
    }
  });
}

playCrashImpact(payout) {
  this.cameras.main.shake(460, 0.0135);
  this.tweens.killTweensOf(this.car);
  this.tweens.killTweensOf(this.dummy);
  this.setWheelPlayback(false);
  this.launchDummyAfterImpact(payout);
}

launchDummyAfterImpact(payout) {
  if (this.state !== "crashing") return;
  const dummyWorldX = this.car.x + this.dummy.x;
  const dummyWorldY = this.car.y + this.dummy.y;
  const dummyWorldAngle = this.car.angle + this.dummy.angle;
  this.car.remove(this.dummy, false);
  this.children.add(this.dummy);
  this.dummy.setPosition(dummyWorldX, dummyWorldY).setDepth(9).setScale(1).setAngle(dummyWorldAngle).setVisible(false);
  this.createFlightRagdollLegacySkin(dummyWorldX, dummyWorldY, dummyWorldAngle);
  this.dummy.setVisible(false);
  this.startCrashDebrisRoadLock();
  this.tweens.add({
    targets: this.dummy,
    scaleX: 1.1,
    scaleY: 0.94,
    duration: 90,
    ease: "Sine.out",
    yoyo: true
  });
  this.state = "dummyFlight";
  const targetFlightSpeed = Math.max(680, (this.visualSpeed || 340) * 1.12);
  this.flightRoadSpeed = targetFlightSpeed * 0.98;
  this.tweens.add({
    targets: this,
    flightRoadSpeed: targetFlightSpeed,
    duration: 110,
    ease: "Cubic.out"
  });
  this.playDummyFlight(payout);
}

startCrashDebrisRoadLock() {
  const cameraX = this.cameras.main.scrollX;
  [this.car, this.barrier, this.car && this.car.carGroundShadow].forEach((obj) => {
    if (!obj) return;
    if (obj.scrollFactorX !== 0) obj.x -= cameraX;
    obj.setScrollFactor(0);
  });
  this.updateCarGroundShadow();
  this.crashDebrisActive = true;
}

stopCrashDebrisRoadLock() {
  this.crashDebrisActive = false;
  [this.car, this.barrier, this.car && this.car.carGroundShadow].forEach((obj) => {
    if (!obj) return;
    obj.setScrollFactor(1);
  });
  this.updateCarGroundShadow();
}

advanceCrashDebris(dx) {
  if (!this.crashDebrisActive) return;
  this.car.x -= dx;
  this.barrier.x -= dx;
  this.updateCarGroundShadow();
  if (this.car.x < -360 && this.barrier.x < -260) {
    this.crashDebrisActive = false;
  }
}

createDummyFlightShadow() {
  let shadow = null;
  if (this.textures.exists("monekenShadow")) {
    shadow = this.add.image(0, 0, "monekenShadow").setOrigin(0.5);
    shadow.isFallbackShadow = false;
  } else {
    shadow = this.add.ellipse(0, 0, 150, 42, 0x030405, 1).setOrigin(0.5);
    shadow.isFallbackShadow = true;
  }
  return shadow
    .setDepth(4.12)
    .setVisible(false)
    .setAlpha(0);
}

updateDummyFlightShadow() {
  if (!this.dummyFlightShadow || !this.dummy || this.state !== "dummyFlight") return;
  const groundY = this.getGameplayGroundY();
  const cfg = CT.Config.gameplay;
  const maxHeight = Math.max(1, Number(cfg.bounceHeight) || 0, Number(cfg.launchHeight) || 0);
  const height = Phaser.Math.Clamp(groundY - this.dummy.y, 0, maxHeight);
  const t = Phaser.Math.Clamp(height / maxHeight, 0, 1);
  const scale = Phaser.Math.Linear(1, 2, Phaser.Math.Easing.Sine.Out(t));
  const alpha = Phaser.Math.Linear(1, 0.1, Phaser.Math.Easing.Sine.Out(t));
  const torso = this.flightRagdoll && this.flightRagdoll.torso ? this.flightRagdoll.torso : null;
  const torsoSpine = torso
    ? this.ragdollWorldPoint(torso, (torso.ragdollAnchorPoints || {}).spine || { x: 0, y: 26 })
    : null;
  const shadowX = torsoSpine ? torsoSpine.x : this.dummy.x - 22;
  this.dummyFlightShadow
    .setPosition(shadowX, groundY + 4)
    .setScale(this.dummyFlightShadow.isFallbackShadow ? scale * 1.08 : scale)
    .setAlpha(alpha)
    .setVisible(true);
}

hideDummyFlightShadow() {
  if (!this.dummyFlightShadow) return;
  this.tweens.killTweensOf(this.dummyFlightShadow);
  this.dummyFlightShadow.setVisible(false).setAlpha(0);
}

fadeDummyFlightShadow(duration) {
  if (!this.dummyFlightShadow || !this.dummyFlightShadow.visible) return;
  this.tweens.killTweensOf(this.dummyFlightShadow);
  this.tweens.add({
    targets: this.dummyFlightShadow,
    alpha: 0,
    duration: Math.max(80, Number(duration) || 260),
    ease: "Sine.out",
    onComplete: () => {
      if (this.dummyFlightShadow) this.dummyFlightShadow.setVisible(false);
    }
  });
}

playDummyFlight(payout) {
  const cfg = CT.Config;
  const groundY = this.getGameplayGroundY();
  const bounceCount = this.getBounceCount(this.multiplier);
  this.remainingBounces = bounceCount;
  this.updateBounceText();
  const startX = this.dummy.x;
  const startY = this.dummy.y;
  const impactX = startX + cfg.gameplay.launchDistance;
  const flyMs = cfg.gameplay.launchDuration;
  const arc = cfg.gameplay.launchHeight;
  const spinStart = this.dummy.angle;
  const spinEnd = spinStart + 760;
  const flight = { t: 0 };
  const trailStartX = Math.max(CT.Config.width * 0.92, (this.barrier ? this.barrier.x : CT.Config.width * 0.72) + 190);
  this.prepareOldDummyTrailParts({ startX, impactX, groundY, bounceCount, trailStartX });
  this.dummyFlightHistoryCount = Math.min(30, (Math.floor(Number(this.dummyFlightHistoryCount) || 0) + 1));
  this.updateDummyFlightShadow();

  this.tweens.add({
    targets: flight,
    t: 1,
    duration: flyMs,
    ease: "Linear",
    onUpdate: () => {
      const t = flight.t * 0.32 + Phaser.Math.Easing.Sine.Out(flight.t) * 0.68;
      this.dummy.x = Phaser.Math.Linear(startX, impactX, t);
      this.dummy.y = Phaser.Math.Linear(startY, groundY, t) - Math.sin(Math.PI * t) * arc;
      this.dummy.angle = Phaser.Math.Linear(spinStart, spinEnd, t);
      this.syncFlightRagdollToDummy(false);
      this.updateDummyFlightShadow();
    },
    onComplete: () => {
      this.dummy.setPosition(impactX, groundY).setAngle(spinEnd);
      this.syncFlightRagdollToDummy(false);
      this.updateDummyFlightShadow();
      this.kickFlightRagdollFromGround(1.12, { firstImpact: true, torsoSpin: bounceCount > 0 });
      this.cameras.main.shake(150, 0.006);
      this.spawnSmoke(this.dummy.x, groundY + 8, 8, 0xd7dde2);
      this.bumpOldDummyTrailPartsAt(this.dummy.x, groundY, 1.16);
      this.playDummyBounces(payout, bounceCount);
    }
  });
}

playDummyBounces(payout, count) {
  const groundY = this.getGameplayGroundY();
  const cfg = CT.Config;
  const hopDistance = cfg.gameplay.bounceDistance;
  const firstHeight = cfg.gameplay.bounceHeight;
  const plannedBounces = this.planBounceArcs(this.dummy.x, count, groundY, hopDistance, firstHeight);
  let totalBounces = count;
  let index = 0;
  this.extraBounceAdder = () => {
    const maxExtraBounces = 3;
    if (this.extraBounceBonusCount >= maxExtraBounces) return false;
    const lastPlan = plannedBounces[plannedBounces.length - 1];
    const startX = lastPlan ? lastPlan.endX : this.dummy.x;
    const nextIndex = plannedBounces.length;
    plannedBounces.push(this.createBouncePlan(startX, groundY, hopDistance, firstHeight, nextIndex));
    totalBounces += 1;
    this.extraBounceBonusCount += 1;
    this.remainingBounces = Math.max(0, totalBounces - index);
    this.updateBounceText();
    return true;
  };

  const next = () => {
    if (index >= totalBounces) {
      this.flightRoadSpeed = 0;
      this.extraBounceAdder = null;
      this.settleDummy(payout);
      return;
    }
    const plan = plannedBounces[index];
    const height = plan.height;
    const dur = Math.max(2050, 2920 - index * 64);
    const startX = plan.startX;
    const endX = plan.endX;
    const startAngle = this.dummy.angle;
    const endAngle = startAngle + 250;
    const bonuses = plan.bonuses;
    const arc = { t: 0 };
    index++;
    const roadSpeedAtArcStart = this.flightRoadSpeed;
    this.remainingBounces = Math.max(0, totalBounces - index);
    this.updateBounceText();

    this.tweens.add({
      targets: arc,
      t: 1,
      duration: dur,
      ease: "Linear",
      onUpdate: () => {
        const u = arc.t;
        this.dummy.x = Phaser.Math.Linear(startX, endX, u);
        this.dummy.y = groundY - Math.sin(Math.PI * u) * height;
        this.dummy.angle = Phaser.Math.Linear(startAngle, endAngle, u);
        this.syncFlightRagdollToDummy(false);
        this.updateDummyFlightShadow();
        if (index >= totalBounces) {
          const brakeT = Phaser.Math.Clamp((u - 0.28) / 0.72, 0, 1);
          const brakeEase = Phaser.Math.Easing.Sine.InOut(brakeT);
          this.flightRoadSpeed = roadSpeedAtArcStart * Math.pow(1 - brakeEase, 0.55);
          if (this.flightRagdoll) this.flightRagdoll.legAirSpreadPoseFade = 1 - brakeEase;
        }
        this.collectBonusesOnCurve(bonuses, u);
      },
      onComplete: () => {
        this.dummy.setPosition(endX, groundY).setAngle(endAngle);
        this.syncFlightRagdollToDummy(false);
        this.updateDummyFlightShadow();
        const hasMoreBounces = index < totalBounces;
        if (!hasMoreBounces && this.flightRagdoll) {
          this.flightRagdoll.legAirSpreadPosePower = 0;
          this.flightRagdoll.legAirSpreadPoseFade = 0;
        }
        this.kickFlightRagdollFromGround(1 + index * 0.08, { torsoSpin: true, legSpread: hasMoreBounces });
        this.spawnSmoke(this.dummy.x, groundY + 6, 3, 0xd7dde2);
        this.bumpOldDummyTrailPartsAt(this.dummy.x, groundY, hasMoreBounces ? 0.92 + index * 0.05 : 1.08);
        next();
      }
    });
  };

  next();
}

planBounceArcs(firstStartX, count, groundY, hopDistance, firstHeight) {
  const plans = [];
  for (let i = 0; i < count; i++) {
    const startX = firstStartX + hopDistance * i;
    plans.push(this.createBouncePlan(startX, groundY, hopDistance, firstHeight, i));
  }
  return plans;
}

createBouncePlan(startX, groundY, hopDistance, firstHeight, bounceIndex) {
  const cfg = CT.Config;
  const t = Phaser.Math.Clamp(Number(bounceIndex || 0) / Math.max(1, cfg.gameplay.maxBounces - 1), 0, 1);
  const height = Math.max(120, firstHeight * (1 - t * 0.10));
  const endX = startX + hopDistance;
  const bonuses = this.createCurveBonuses(startX, endX, groundY, height, 10, bounceIndex);
  return { startX, endX, height, bonuses };
}

createCurveBonuses(startX, endX, groundY, height, slots, bounceIndex) {
  const cfg = CT.Config;
  const bonuses = [];
  const baseTier = Phaser.Math.Clamp(Number(bounceIndex || 0) / Math.max(1, cfg.gameplay.maxBounces - 1), 0, 1);
  const tier = Math.pow(baseTier, 0.62);
  const spawnChance = Phaser.Math.Clamp(cfg.gameplay.bonusChance - 0.05 + tier * 0.18, 0.12, 0.48);
  const doubleBounceChance = Phaser.Math.Clamp(cfg.gameplay.doubleBounceBonusChance * (1 - tier * 0.18), 0.01, 0.026);
  const arcDistance = Math.max(1, endX - startX);
  const cameraAhead = CT.Config.width * 0.56;
  const introT = Phaser.Math.Clamp(cameraAhead / arcDistance, 0.34, 0.44);
  const outroT = 0.96;
  let doubleBouncePlaced = false;
  for (let i = 0; i < slots; i++) {
    const slotT = slots <= 1 ? 0.5 : i / (slots - 1);
    const t = Phaser.Math.Linear(introT, outroT, slotT);
    if (!doubleBouncePlaced && Math.random() < doubleBounceChance) {
      const x = Phaser.Math.Linear(startX, endX, t);
      const y = groundY - Math.sin(Math.PI * t) * height;
      const bonus = this.createDoubleBounceCoin(x, y);
      bonus.pathT = t;
      bonuses.push(bonus);
      doubleBouncePlaced = true;
      continue;
    }
    if (Math.random() > spawnChance) continue;
    const x = Phaser.Math.Linear(startX, endX, t);
    const y = groundY - Math.sin(Math.PI * t) * height;
    const bonus = this.createBonusCoin(x, y, this.pickBonusMultiplier(tier));
    bonus.pathT = t;
    bonuses.push(bonus);
  }
  return bonuses;
}

createDoubleBounceCoin(x, y) {
  const root = this.add.container(x, y).setDepth(15);
  const glow = this.add.circle(0, 0, 44, 0x8d5cff, 0.22).setBlendMode(Phaser.BlendModes.ADD);
  const icon = this.add.image(0, 0, "doubleBounceCoin").setScale(0.62);
  root.add([glow, icon]);
  root.bonusKind = "extraBounce";
  this.bonusItems.push(root);
  if (this.isMobilePerfMode()) {
    root.setScale(1.05);
    root.angle = 3;
  } else {
    this.tweens.add({
      targets: root,
      scaleX: 1.12,
      scaleY: 1.12,
      angle: 8,
      duration: 320,
      ease: "Sine.inOut",
      yoyo: true,
      repeat: -1
    });
  }
  return root;
}

createBonusCoin(x, y, value) {
  const root = this.add.container(x, y).setDepth(14);
  const palette = this.getBonusPalette(value);
  const fx = this.createBonusCoinFx(value, palette.stroke);
  const bg = this.add.circle(0, 0, 34, 0x20262b, 0.98).setStrokeStyle(6, palette.stroke, 1);
  const txt = this.add.text(0, 0, value + "x", {
    fontFamily: CT.Config.fontFamily || "Arial",
    fontSize: value < 1 || value >= 100 ? "40px" : "46px",
    color: "#ffffff",
    letterSpacing: CT.Config.fontLetterSpacing || 0,
    resolution: CT.Config.fontResolution || 1
  }).setOrigin(0.5);
  root.add(fx.concat([bg, txt]));
  root.bonusValue = value;
  this.bonusItems.push(root);
  if (this.isMobilePerfMode()) {
    root.setScale(1.04);
  } else {
    this.tweens.add({
      targets: root,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 260,
      ease: "Sine.inOut",
      yoyo: true,
      repeat: -1
    });
  }
  return root;
}

createBonusCoinFx(value, color) {
  if (value < 10) return [];
  const high = value >= 100;
  const jackpot = value >= 1000;
  const glow = this.add.circle(0, 0, jackpot ? 58 : high ? 51 : 45, color, jackpot ? 0.24 : high ? 0.18 : 0.12)
    .setBlendMode(Phaser.BlendModes.ADD);
  const ring = this.add.circle(0, 0, jackpot ? 47 : high ? 43 : 39, 0x000000, 0)
    .setStrokeStyle(jackpot ? 5 : high ? 4 : 3, color, jackpot ? 0.92 : 0.72)
    .setBlendMode(Phaser.BlendModes.ADD);
  const items = [glow, ring];
  if (high) {
    const sparks = this.add.container(0, 0);
    const count = jackpot ? 8 : 5;
    const radius = jackpot ? 51 : 45;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const spark = this.add.circle(Math.cos(angle) * radius, Math.sin(angle) * radius, jackpot ? 4 : 3, color, jackpot ? 0.95 : 0.78)
        .setBlendMode(Phaser.BlendModes.ADD);
      sparks.add(spark);
    }
    items.push(sparks);
    if (!this.isMobilePerfMode()) {
      this.tweens.add({
        targets: sparks,
        angle: jackpot ? 360 : 180,
        duration: jackpot ? 1800 : 2400,
        repeat: -1,
        ease: "Linear"
      });
    }
  }
  if (!this.isMobilePerfMode()) {
    this.tweens.add({
      targets: glow,
      scaleX: jackpot ? 1.28 : 1.16,
      scaleY: jackpot ? 1.28 : 1.16,
      alpha: jackpot ? 0.1 : 0.07,
      duration: jackpot ? 420 : 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut"
    });
  }
  return items;
}

pickBonusMultiplier(tier) {
  const t = Phaser.Math.Clamp(Number(tier || 0), 0, 1);
  const lowBias = Math.pow(1 - t, 1.8);
  const highBias = Math.pow(t, 1.45);
  const weights = [
    { value: 0.1, weight: 68 * lowBias + 2 },
    { value: 0.25, weight: 42 * lowBias + 3 },
    { value: 0.5, weight: 26 * lowBias + 5 },
    { value: 1, weight: 6 + 9 * t },
    { value: 2, weight: 1.8 + 11 * t },
    { value: 5, weight: 0.42 + 10 * highBias },
    { value: 10, weight: 0.09 + 7.5 * highBias },
    { value: 20, weight: 0.018 + 4.8 * highBias },
    { value: 100, weight: 0.004 + 2.6 * highBias },
    { value: 200, weight: 0.0015 + 1.55 * highBias },
    { value: 500, weight: 0.0007 + 0.88 * highBias },
    { value: 1000, weight: 0.00028 + 0.5 * highBias },
    { value: 2000, weight: 0.0001 + 0.28 * highBias },
    { value: 3000, weight: 0.00005 + 0.17 * highBias },
    { value: 4000, weight: 0.00002 + 0.105 * highBias },
    { value: 5000, weight: 0.00001 + 0.065 * highBias }
  ];
  if (this.bonusGameActive) {
    weights.forEach((item) => {
      if (item.value >= 1000) item.weight *= 0.1;
      else if (item.value >= 100) item.weight *= 0.22;
      else if (item.value >= 10) item.weight *= 0.62;
    });
  }
  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of weights) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }
  return 0.1;
}

getBonusPalette(value) {
  if (value >= 5000) return { stroke: 0xff38e8 };
  if (value >= 4000) return { stroke: 0xff2d6f };
  if (value >= 3000) return { stroke: 0xb15cff };
  if (value >= 2000) return { stroke: 0x37caff };
  if (value >= 1000) return { stroke: 0xfff36b };
  if (value >= 500) return { stroke: 0xff6a00 };
  if (value >= 200) return { stroke: 0x00ffa8 };
  if (value >= 100) return { stroke: 0xc86bff };
  if (value >= 50) return { stroke: 0xd97cff };
  if (value >= 20) return { stroke: 0x47f2ff };
  if (value >= 10) return { stroke: 0x63ff9f };
  if (value >= 5) return { stroke: 0xffea35 };
  if (value >= 2) return { stroke: 0xff43a9 };
  if (value >= 1) return { stroke: 0x35d7ff };
  if (value >= 0.5) return { stroke: 0x8cff57 };
  if (value >= 0.25) return { stroke: 0xff8a3d };
  return { stroke: 0x9b7cff };
}

collectBonusesOnCurve(bonuses, t) {
  bonuses.forEach((bonus) => {
    if (!bonus || bonus.collected || t < bonus.pathT) return;
    this.collectBonusCoin(bonus);
  });
}

collectBonusCoin(bonus) {
  bonus.collected = true;
  if (bonus.bonusKind === "extraBounce") {
    this.collectExtraBounceCoin(bonus);
    return;
  }
  this.bonusAdd += bonus.bonusValue;
  this.hud.setMultiplier(this.getDisplayedMultiplier());
  this.playOneShot("bonusUp");
  this.kickFlightRagdollFromBonus(bonus.bonusValue);
  this.showBonusPop(bonus.x, bonus.y, bonus.bonusValue);
  this.cameras.main.shake(bonus.bonusValue >= 5 ? 150 : 75, bonus.bonusValue >= 5 ? 0.006 : 0.003);
  this.pauseForBonus(bonus.bonusValue);
  this.tweens.killTweensOf(bonus);
  this.removeBonusItem(bonus);
  this.tweens.add({
    targets: bonus,
    scaleX: bonus.bonusValue >= 5 ? 2.25 : 1.75,
    scaleY: bonus.bonusValue >= 5 ? 2.25 : 1.75,
    alpha: 0,
    duration: bonus.bonusValue >= 5 ? 150 : 110,
    ease: "Back.out",
    onComplete: () => {
      bonus.destroy();
    }
  });
}

collectExtraBounceCoin(bonus) {
  const added = this.extraBounceAdder ? this.extraBounceAdder() : false;
  this.playOneShot("bonusUp");
  this.kickFlightRagdollFromBonus(2);
  if (added) {
    this.flightRoadSpeed = Math.max(this.flightRoadSpeed * 1.14, this.flightRoadSpeed + 80);
    this.showExtraBouncePop(bonus.x, bonus.y);
    this.cameras.main.shake(140, 0.005);
    this.pauseForBonus(2);
  }
  this.tweens.killTweensOf(bonus);
  this.removeBonusItem(bonus);
  this.tweens.add({
    targets: bonus,
    scaleX: added ? 2.05 : 1.35,
    scaleY: added ? 2.05 : 1.35,
    alpha: 0,
    duration: 150,
    ease: "Back.out",
    onComplete: () => bonus.destroy()
  });
}

showExtraBouncePop(x, y) {
  const pop = this.add.text(x, y - 58, "+1 BOUNCE", {
    fontFamily: CT.Config.fontFamily || "Arial",
    fontSize: "42px",
    color: "#c58cff",
    letterSpacing: CT.Config.fontLetterSpacing || 0,
    resolution: CT.Config.fontResolution || 1
  }).setOrigin(0.5).setDepth(18);
  this.tweens.add({
    targets: pop,
    y: pop.y - 76,
    scaleX: 1.22,
    scaleY: 1.22,
    alpha: 0,
    duration: 760,
    ease: "Cubic.out",
    onComplete: () => pop.destroy()
  });
}

pauseForBonus(value) {
  const token = ++this.bonusPauseToken;
  this.time.timeScale = value >= 5 ? 0.04 : 0.06;
  window.setTimeout(() => {
    if (this.bonusPauseToken === token) this.time.timeScale = 1;
  }, value >= 5 ? 820 : 560);
}

showBonusPop(x, y, value) {
  const pop = this.add.text(x, y - 54, "+" + this.formatX(value) + "x", {
    fontFamily: CT.Config.fontFamily || "Arial",
    fontSize: value >= 10 ? "54px" : "46px",
    color: "#ffcf30",
    letterSpacing: CT.Config.fontLetterSpacing || 0,
    resolution: CT.Config.fontResolution || 1
  }).setOrigin(0.5).setDepth(18);
  this.tweens.add({
    targets: pop,
    y: pop.y - 70,
    scaleX: 1.28,
    scaleY: 1.28,
    alpha: 0,
    duration: 720,
    ease: "Cubic.out",
    onComplete: () => pop.destroy()
  });
}

removeBonusItem(item) {
  const index = this.bonusItems.indexOf(item);
  if (index !== -1) this.bonusItems.splice(index, 1);
}

clearBonusItems() {
  this.bonusItems.forEach((item) => {
    if (!item) return;
    this.tweens.killTweensOf(item);
    if (item.active) item.destroy();
  });
  this.bonusItems = [];
}

getOldDummyTrailTextureKeys() {
  if (this.oldDummyTrailTextureKeys) return this.oldDummyTrailTextureKeys;
  this.oldDummyTrailTextureKeys = [
    "dummyPart_torso",
    "dummyPart_head",
    "dummyPart_pelvis",
    "dummyPart_upperArmL",
    "dummyPart_lowerArmL",
    "dummyPart_handL",
    "dummyPart_thighL",
    "dummyPart_shinL",
    "dummyPart_footL",
    "dummyPart_upperArmR",
    "dummyPart_lowerArmR",
    "dummyPart_handR",
    "dummyPart_thighR",
    "dummyPart_shinR",
    "dummyPart_footR"
  ].filter((key) => this.textures.exists(key));
  return this.oldDummyTrailTextureKeys;
}

pickOldDummyTrailTextureKey(keys) {
  const weights = [
    ["dummyPart_torso", 7.2],
    ["dummyPart_head", 6.4],
    ["dummyPart_thighL", 4.7],
    ["dummyPart_thighR", 4.7],
    ["dummyPart_pelvis", 3.6],
    ["dummyPart_shinL", 1.6],
    ["dummyPart_shinR", 1.6],
    ["dummyPart_upperArmL", 1.25],
    ["dummyPart_upperArmR", 1.25],
    ["dummyPart_lowerArmL", 0.9],
    ["dummyPart_lowerArmR", 0.9],
    ["dummyPart_handL", 0.42],
    ["dummyPart_handR", 0.42],
    ["dummyPart_footL", 0.34],
    ["dummyPart_footR", 0.34]
  ].filter((item) => keys.includes(item[0]));
  if (!weights.length) return keys[Math.floor(Math.random() * keys.length) % keys.length];
  const total = weights.reduce((sum, item) => sum + item[1], 0);
  let roll = Math.random() * total;
  for (const item of weights) {
    roll -= item[1];
    if (roll <= 0) return item[0];
  }
  return weights[0][0];
}

createOldDummyTrailPart(index) {
  const image = this.add.image(0, 0, "dummyPart_head")
    .setOrigin(0.5)
    .setAlpha(0.96);
  const part = this.add.container(0, 0, [image])
    .setVisible(false)
    .setActive(false);
  part.image = image;
  part.trailIndex = index;
  part.oldTrailRestY = 0;
  if (this.oldDummyTrailLayer) this.oldDummyTrailLayer.add(part);
  return part;
}

clearOldDummyTrailParts() {
  if (this.oldDummyTrailLayer) this.oldDummyTrailLayer.x = 0;
  this.oldDummyTrailReturnMode = false;
  if (!this.oldDummyTrailParts) return;
  this.oldDummyTrailParts.forEach((part) => {
    if (!part) return;
    this.tweens.killTweensOf(part);
    part.setAlpha(1).setScale(1).setVisible(false).setActive(false);
  });
}

prepareOldDummyTrailParts(options) {
  const previousFlights = Phaser.Math.Clamp(Math.floor(Number(this.dummyFlightHistoryCount) || 0), 0, 30);
  const pieceCount = previousFlights * 4;
  const keys = this.getOldDummyTrailTextureKeys();
  if (this.oldDummyTrailLayer) this.oldDummyTrailLayer.x = 0;
  this.oldDummyTrailReturnMode = false;
  if (!keys.length || !pieceCount) {
    this.clearOldDummyTrailParts();
    return;
  }

  const groundY = Number(options && options.groundY) || this.getGameplayGroundY();
  const bounceCount = Math.max(0, Number(options && options.bounceCount) || 0);
  const roadTravelWidth = CT.Config.width * (4.6 + Math.max(1, bounceCount) * 0.92 + previousFlights * 0.04);
  const pathStart = Math.max(CT.Config.width * 0.86, Number(options && options.trailStartX) || 0);
  const pathEnd = pathStart + roadTravelWidth;

  while (this.oldDummyTrailParts.length < pieceCount) {
    this.oldDummyTrailParts.push(this.createOldDummyTrailPart(this.oldDummyTrailParts.length));
  }

  this.oldDummyTrailParts.forEach((part, i) => {
    this.tweens.killTweensOf(part);
    if (i >= pieceCount) {
      part.setVisible(false).setActive(false);
      return;
    }

    const laneT = (i + Math.random() * 1.8) / Math.max(1, pieceCount);
    const cluster = Math.sin((i + 1) * 4.37) * 0.052;
    const rawX = Phaser.Math.Linear(pathStart, pathEnd, Phaser.Math.Clamp(laneT + cluster, 0, 1))
      + Phaser.Math.Between(-340, 340);
    const x = Math.max(pathStart + Phaser.Math.Between(0, 220), rawX);
    const y = groundY + Phaser.Math.Between(-8, 18);
    const key = this.pickOldDummyTrailTextureKey(keys);
    const heroPart = /torso|head|pelvis|thigh/i.test(key);
    const midPart = /shin|upperArm/i.test(key);
    const scale = heroPart
      ? Phaser.Math.FloatBetween(0.38, 0.58)
      : midPart
        ? Phaser.Math.FloatBetween(0.3, 0.46)
        : Phaser.Math.FloatBetween(0.22, 0.34);

    part.image
      .setTexture(key)
      .setScale(scale)
      .setAlpha(Phaser.Math.FloatBetween(0.78, 0.98));
    part
      .setPosition(x, y)
      .setAngle(Phaser.Math.Between(-170, 170))
      .setScale(1)
      .setAlpha(1)
      .setDepth(4.25 + (i % 7) * 0.01)
      .setVisible(true)
      .setActive(true);
    part.oldTrailRestY = y;
    part.oldTrailRestAngle = part.angle;
    part.oldTrailImpactUntil = 0;
  });
}

softenOldDummyTrailPartsForReturn() {
  if (!this.oldDummyTrailParts || !this.oldDummyTrailParts.length) return;
  this.oldDummyTrailReturnMode = true;
  this.oldDummyTrailParts.forEach((part, i) => {
    if (!part || !part.active || !part.visible) return;
    this.tweens.killTweensOf(part);
    const targetScale = Phaser.Math.FloatBetween(0.42, 0.58);
    const targetAlpha = Phaser.Math.FloatBetween(0.34, 0.52);
    this.tweens.add({
      targets: part,
      scaleX: targetScale,
      scaleY: targetScale,
      alpha: targetAlpha,
      duration: 150 + (i % 5) * 14,
      ease: "Sine.out"
    });
  });
}

bumpOldDummyTrailPartsAt(x, y, strength) {
  if (!this.oldDummyTrailParts || !this.oldDummyTrailParts.length) return;
  const cameraX = this.cameras && this.cameras.main ? (Number(this.cameras.main.scrollX) || 0) : 0;
  const layerX = this.oldDummyTrailLayer ? (Number(this.oldDummyTrailLayer.x) || 0) : 0;
  const hitX = (Number(x) || 0) - cameraX;
  const hitY = Number(y) || this.getGameplayGroundY();
  const now = this.time ? this.time.now : 0;
  const radiusX = 138;
  const radiusY = 54;
  const maxImpacts = this.isMobilePerfMode() ? 4 : 7;
  const power = Math.max(0.35, Number(strength) || 1);
  const candidates = [];

  this.oldDummyTrailParts.forEach((part) => {
    if (!part || !part.active || !part.visible) return;
    if (part.oldTrailImpactUntil && part.oldTrailImpactUntil > now) return;
    const screenX = layerX + part.x;
    const dx = screenX - hitX;
    const dy = (part.oldTrailRestY || part.y) - hitY;
    if (Math.abs(dx) > radiusX || Math.abs(dy) > radiusY) return;
    const dist = Math.sqrt(Math.pow(dx / radiusX, 2) + Math.pow(dy / radiusY, 2));
    if (dist > 1) return;
    candidates.push({ part, dx, dist });
  });

  candidates
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxImpacts)
    .forEach(({ part, dx, dist }) => {
      this.tweens.killTweensOf(part);
      const falloff = Phaser.Math.Clamp(1 - dist, 0.16, 1);
      const impulse = power * falloff;
      const dir = dx >= 0 ? 1 : -0.35;
      const startX = part.x;
      const startY = part.y;
      const startAngle = part.angle;
      const landX = part.x + (Phaser.Math.FloatBetween(28, 92) * impulse) * dir + Phaser.Math.FloatBetween(10, 34) * impulse;
      const landY = part.oldTrailRestY || part.y;
      const jump = Phaser.Math.FloatBetween(14, 46) * impulse;
      const spinDir = dx >= 0 ? 1 : -1;
      const spin = Phaser.Math.FloatBetween(46, 178) * impulse * spinDir;
      const settleSpin = Phaser.Math.FloatBetween(-16, 22) * impulse;
      const duration = Phaser.Math.Between(300, 430);
      const arc = { t: 0 };

      part.oldTrailImpactUntil = now + duration + 260;
      part.setDepth(4.8);
      this.tweens.add({
        targets: arc,
        t: 1,
        duration,
        ease: "Linear",
        onUpdate: () => {
          const t = arc.t;
          const slideT = Phaser.Math.Easing.Sine.Out(t);
          part.x = Phaser.Math.Linear(startX, landX, slideT);
          part.y = Phaser.Math.Linear(startY, landY, t) - Math.sin(Math.PI * t) * jump;
          part.angle = startAngle + spin * slideT + settleSpin * Math.sin(Math.PI * t);
        },
        onComplete: () => {
          part.setPosition(landX, landY);
          part.oldTrailRestY = landY;
          part.oldTrailRestAngle = part.angle;
          part.setDepth(4.25 + (part.trailIndex % 7) * 0.01);
        }
      });
    });
}

getBounceCount(multiplier) {
  const cfg = CT.Config;
  if (this.bonusGameActive) {
    const target = Math.max(1, Math.floor(Number(cfg.gameplay.bonusGameBounces) || 10));
    return this.state === "running" ? Phaser.Math.Clamp(this.bonusGameBounceDisplay, 0, target) : target;
  }
  const value = Math.max(0, Number(multiplier || 0));
  const raw = value < 2 ? 0 : Math.floor(Math.log2(value));
  const boosterBounce = this.jumpBoosterEnabled ? 1 : 0;
  return Phaser.Math.Clamp(raw + this.rareBounceCount + boosterBounce, cfg.gameplay.minBounces, cfg.gameplay.maxBounces);
}

settleDummy(payout) {
  const groundY = this.getGameplayGroundY();
  this.flightRoadSpeed = 0;

  // Every final landing gets a tiny finishing pop, then hard freeze.
  if (this.flightRagdoll) this.flightRagdoll.finalLandingPop = true;

  this.startFlightRagdollSettle();
  const finalLandingMs = this.flightRagdoll && this.flightRagdoll.finalLandingPopActive ? 680 : 360;
  this.tweens.add({
    targets: this.dummy,
    y: groundY + 2,
    angle: this.dummy.angle + 18,
    duration: finalLandingMs,
    ease: "Sine.out",
    onUpdate: () => this.updateDummyFlightShadow(),
    onComplete: () => {
      this.updateDummyFlightShadow();
      this.bumpOldDummyTrailPartsAt(this.dummy.x, groundY, 0.72);
      this.showCrashFinal(payout);
    }
  });
}

showCrashFinal(payout) {
  const finalMultiplier = this.multiplier + this.bonusAdd;
  const payoutBet = this.bonusGameActive ? this.bonusGamePayoutBet : (this.wallet.getPayoutBet ? this.wallet.getPayoutBet() : this.wallet.currentBet);
  const finalPayout = payoutBet * finalMultiplier;
  this.wallet.addWin(finalPayout);
  this.hud.update();
  this.hud.setResult("LAST WIN +$" + this.wallet.format(finalPayout), CT.Config.colors.ok);
  this.showFinalWinCounter(finalPayout, () => {
    this.time.delayedCall(120, () => this.returnCameraToStart(true));
  });
}

showFinalWinCounter(finalPayout, onComplete) {
  if (!this.multiplierPanel || !this.multiplierText || !this.finalWinText) {
    onComplete && onComplete();
    return;
  }

  this.applyMultiplierTheme("win", false, true);
  this.transitionMultiplierLabel("YOUR WIN", "#D8FFD8");
  this.tweens.killTweensOf([this.multiplierPanel, this.multiplierText, this.finalWinText]);
  this.finalWinText
    .setText("$0.00")
    .setColor("#29FF50")
    .setVisible(true)
    .setAlpha(0)
    .setScale(0.42)
    .setPosition(0, 0);
  this.multiplierText.setAlpha(1).setPosition(0, 0).setScale(1).setAngle(0);

  this.tweens.add({
    targets: this.multiplierText,
    y: 62,
    scaleX: 0.24,
    scaleY: 0.24,
    duration: 330,
    ease: "Cubic.out"
  });
  this.tweens.add({
    targets: this.finalWinText,
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
    duration: 280,
    ease: "Back.out"
  });
  const counter = { value: 0 };
  this.tweens.add({
    targets: counter,
    value: finalPayout,
    duration: 720,
    ease: "Cubic.out",
    onUpdate: () => {
      this.finalWinText.setText("$" + this.wallet.format(counter.value));
    },
    onComplete: () => {
      this.finalWinText.setText("$" + this.wallet.format(finalPayout));
      this.tweens.add({
        targets: this.multiplierPanel,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 130,
        yoyo: true,
        ease: "Sine.inOut",
        onComplete: () => {
          this.multiplierPanel.setScale(1);
          this.time.delayedCall(110, () => this.animateFinalWinPanelReset(onComplete));
        }
      });
    }
  });
}

transitionMultiplierLabel(nextText, color) {
  if (!this.multiplierPanel || !this.multiplierPanelLabel) return;
  const labelY = -72;
  const family = CT.Config.fontFamily || "Arial";
  this.tweens.killTweensOf(this.multiplierPanelLabel);
  if (this.multiplierLabelGhost) {
    this.multiplierLabelGhost.destroy();
    this.multiplierLabelGhost = null;
  }
  if (this.multiplierPanelLabel.text === nextText && this.multiplierPanelLabel.alpha > 0.7) {
    this.multiplierPanelLabel.setColor(color).setPosition(0, labelY).setAlpha(0.86);
    return;
  }
  const ghost = this.add.text(0, labelY - 28, nextText, {
    fontFamily: family,
    fontSize: "34px",
    color,
    letterSpacing: CT.Config.fontLetterSpacing || 0,
    resolution: CT.Config.fontResolution || 1
  }).setOrigin(0.5).setAlpha(0);
  this.multiplierPanel.add(ghost);
  this.multiplierLabelGhost = ghost;
  this.tweens.add({
    targets: this.multiplierPanelLabel,
    y: labelY + 28,
    alpha: 0,
    duration: 170,
    ease: "Cubic.in"
  });
  this.tweens.add({
    targets: ghost,
    y: labelY,
    alpha: 0.86,
    duration: 240,
    ease: "Cubic.out",
    onComplete: () => {
      this.multiplierPanelLabel
        .setText(nextText)
        .setColor(color)
        .setPosition(0, labelY)
        .setAlpha(0.86);
      ghost.destroy();
      if (this.multiplierLabelGhost === ghost) this.multiplierLabelGhost = null;
    }
  });
}

animateFinalWinPanelReset(onComplete) {
  const startMultiplier = this.getDisplayedMultiplier();
  const counter = { value: startMultiplier };
  this.applyMultiplierTheme("idle", false, true);
  this.hideMultiplierLabel();
  this.tweens.killTweensOf([this.multiplierText, this.finalWinText]);
  this.tweens.add({
    targets: this.finalWinText,
    alpha: 0,
    scaleX: 0.58,
    scaleY: 0.58,
    duration: 260,
    ease: "Cubic.in",
    onComplete: () => {
      this.finalWinText.setVisible(false).setText("$0.00");
    }
  });
  this.tweens.add({
    targets: this.multiplierText,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    duration: 460,
    ease: "Cubic.inOut"
  });
  this.tweens.add({
    targets: counter,
    value: 0,
    duration: 460,
    ease: "Cubic.inOut",
    onUpdate: () => {
      const value = Math.max(0, counter.value);
      this.multiplierText.setText(value <= 0.01 ? "0x" : value.toFixed(2) + "x");
    },
    onComplete: () => {
      this.multiplierText.setText("0x").setPosition(0, 0).setScale(1).setAlpha(1);
      onComplete && onComplete();
    }
  });
}

hideMultiplierLabel() {
  if (!this.multiplierPanelLabel) return;
  this.tweens.killTweensOf(this.multiplierPanelLabel);
  if (this.multiplierLabelGhost) {
    this.multiplierLabelGhost.destroy();
    this.multiplierLabelGhost = null;
  }
  this.tweens.add({
    targets: this.multiplierPanelLabel,
    y: -44,
    alpha: 0,
    duration: 220,
    ease: "Cubic.in",
    onComplete: () => {
      this.multiplierPanelLabel.setText("").setPosition(0, -72).setAlpha(0);
    }
  });
}

engineFail() {
  if (this.state !== "running") return;
  const baseCarY = this.getGameplayRoadY() - 54;
  this.state = "failed";
  this.turbo = false;
  this.turboPower = 0;
  this.stopEngineAudio();
  this.playOneShot("carEngineFail");
  this.hud.setTurbo(false);
  this.hud.setLocked(true);
  this.setPageControlsDimmed(false);
  this.tweens.killTweensOf(this.car);
  this.setWheelPlayback(false);
  this.hideCarLightSweep();
  this.updateCarFlame();
  this.cameras.main.shake(180, 0.006);
  this.spawnSmoke(this.car.x + 94, this.car.y - 8, 22, 0x3e454a);
  this.hud.setResult("ENGINE BROKE!", "#ffffff");
  this.animateMultiplierFail();
  this.speed = 0;
  this.visualSpeed = 0;
  this.updateBounceText();
  this.tweens.add({
    targets: this.car,
    x: this.car.x + 42,
    y: baseCarY,
    angle: 3,
    duration: 260,
    ease: "Cubic.out",
    onUpdate: () => this.updateCarGroundShadow(),
    onComplete: () => {
      this.updateCarGroundShadow();
      this.hud.setResult("LAST LOSS -$" + this.wallet.format(this.wallet.currentBet), CT.Config.colors.danger);
      this.hud.floatText(CT.Config.width / 2, 350, "-$" + this.wallet.format(this.wallet.currentBet), CT.Config.colors.danger, 42);
      this.time.delayedCall(140, () => this.returnCameraToStart(true));
    }
  });
}

returnCameraToStart(spawnNewCar) {
  this.state = "returning";
  this.turbo = false;
  this.turboPower = 0;
  this.stopEngineAudio();
  this.setPageControlsDimmed(false);
  this.hud.setTurbo(false);
  this.fadeDummyFlightShadow(300);
  this.softenOldDummyTrailPartsForReturn();
  if (spawnNewCar) {
    this.car.setAlpha(1);
    if (this.car.turboFire) this.car.turboFire.setAlpha(0);
    this.updateCarGroundShadow();
    const cfg = CT.Config;
    const awayScrollX = -Phaser.Math.Clamp(cfg.width * 1.85, 980, 1580);
    this.prepareTestBackgroundPropsForReturn(awayScrollX);
    const awayMotion = { scrollX: this.cameras.main.scrollX };
    let lastAwayScrollX = awayMotion.scrollX;
    const launchCar = () => {
      this.resetRunStateOnly();
      this.car.setAlpha(0);
      this.updateCarGroundShadow();
      this.recycleFailedCarToStart(false, null, 0);
      this.dummy.setPosition(-22, -45).setAngle(0).setScale(1).setDepth(0);
      if (this.dummy.parentContainer !== this.car) {
        this.car.add(this.dummy);
      }
      this.dummy.setVisible(false);
      this.cameras.main.scrollX = 0;
      this.car.setAlpha(1);
      this.updateCarGroundShadow();
      this.recycleFailedCarToStart(true, () => {
        this.state = "ready";
        this.hud.setRunning(false);
        this.updateCarFlame();
        this.queueAutospinNextRun();
      }, 0);
    };
    this.tweens.add({
      targets: awayMotion,
      scrollX: awayScrollX,
      duration: 380,
      ease: "Cubic.inOut",
      onUpdate: () => {
        const diff = awayMotion.scrollX - lastAwayScrollX;
        lastAwayScrollX = awayMotion.scrollX;
        this.cameras.main.scrollX = awayMotion.scrollX;
        this.advanceRoad(diff);
      },
      onComplete: () => {
        const finalDiff = awayScrollX - lastAwayScrollX;
        if (Math.abs(finalDiff) > 0.01) {
          lastAwayScrollX = awayScrollX;
          this.cameras.main.scrollX = awayScrollX;
          this.advanceRoad(finalDiff);
        }
        launchCar();
      }
    });
    return;
  } else {
    this.resetRunVisuals(false);
  }
  this.tweens.add({
    targets: this.cameras.main,
    scrollX: 0,
    duration: Math.max(280, Math.min(720, this.cameras.main.scrollX * 0.62)),
    ease: "Cubic.inOut",
    onComplete: () => {
      this.state = "ready";
      this.hud.setRunning(false);
      this.updateCarFlame();
      this.queueAutospinNextRun();
    }
  });
}

resetRunVisuals(launchPosition) {
  const cfg = CT.Config;
  this.clearFlightRagdoll();
  this.hideDummyFlightShadow();
  this.tweens.killTweensOf([this.car, this.dummy]);
  this.stopCrashDebrisRoadLock();
  this.barrier.setVisible(false);
  this.barrier.setAlpha(this.hitWallAlpha).setScale(1);
  this.updateHitWallLayout();
  this.car.setPosition(launchPosition ? cfg.gameplay.carStartX : cfg.gameplay.carReadyX, this.getGameplayRoadY() - 54).setAngle(0).setAlpha(1);
  this.dummy.setPosition(-22, -45).setAngle(0).setScale(1).setDepth(0);
  if (this.dummy.parentContainer !== this.car) {
    this.car.add(this.dummy);
  }
  this.dummy.setVisible(false);
  this.multiplier = cfg.gameplay.startMultiplier;
  this.speed = 0;
  this.visualSpeed = 0;
  this.turbo = false;
  this.turboPower = 0;
  this.stopEngineAudio();
  this.autoCrash = false;
  this.autospinRoundActive = false;
  this.autospinLaunching = false;
  this.bonusGameActive = false;
  this.bonusGameStarting = false;
  this.bonusGameIntroElapsed = 0;
  this.bonusGameIntroComplete = false;
  this.bonusGamePostIntroElapsed = 0;
  this.bonusGameCrashQueued = false;
  this.bonusGameBounceDisplay = 0;
  this.bonusGamePayoutBet = 0;
  this.bonusAdd = 0;
  this.rareBounceCount = 0;
  this.nextRareBounceAt = 0;
  this.remainingBounces = null;
  this.extraBounceAdder = null;
  this.extraBounceBonusCount = 0;
  this.bonusPauseToken++;
  this.time.timeScale = 1;
  this.clearBonusItems();
  this.clearOldDummyTrailParts();
  if (this.hud) {
    this.hud.setMultiplier(this.multiplier);
    this.hud.setTurbo(false);
  }
  if (this.car && this.car.bodyRig) this.car.bodyRig.y = this.car.bodyBaseY || 0;
  if (this.car && this.car.bodyRig) this.car.bodyRig.angle = 0;
  this.setWheelPlayback(false);
  this.setCarCrashVisual(false);
  this.hideCarLightSweep();
  this.nextCarLightSweepAt = 0;
  this.updateCarFlame();
  this.updateCarGroundShadow();
  this.resetTestBackgroundProps();
  this.applyMultiplierTheme("idle");
  this.updateBounceText();
  this.smokeLayer.removeAll(true);
}

resetRunStateOnly() {
  const cfg = CT.Config;
  this.clearFlightRagdoll();
  this.hideDummyFlightShadow();
  this.stopCrashDebrisRoadLock();
  this.barrier.setVisible(false);
  this.barrier.setAlpha(this.hitWallAlpha).setScale(1);
  this.updateHitWallLayout();
  this.multiplier = cfg.gameplay.startMultiplier;
  this.speed = 0;
  this.visualSpeed = 0;
  this.turbo = false;
  this.turboPower = 0;
  this.stopEngineAudio();
  this.autoCrash = false;
  this.autospinRoundActive = false;
  this.autospinLaunching = false;
  this.bonusGameActive = false;
  this.bonusGameStarting = false;
  this.bonusGameIntroElapsed = 0;
  this.bonusGameIntroComplete = false;
  this.bonusGamePostIntroElapsed = 0;
  this.bonusGameCrashQueued = false;
  this.bonusGameBounceDisplay = 0;
  this.bonusGamePayoutBet = 0;
  this.bonusAdd = 0;
  this.rareBounceCount = 0;
  this.nextRareBounceAt = 0;
  this.remainingBounces = null;
  this.extraBounceAdder = null;
  this.extraBounceBonusCount = 0;
  this.bonusPauseToken++;
  this.time.timeScale = 1;
  this.clearBonusItems();
  this.clearOldDummyTrailParts();
  if (this.hud) {
    this.hud.setMultiplier(this.multiplier);
    this.hud.setTurbo(false);
  }
  if (this.car && this.car.bodyRig) this.car.bodyRig.y = this.car.bodyBaseY || 0;
  if (this.car && this.car.bodyRig) this.car.bodyRig.angle = 0;
  this.setWheelPlayback(false);
  this.setCarCrashVisual(false);
  this.hideCarLightSweep();
  this.nextCarLightSweepAt = 0;
  this.updateCarFlame();
  this.updateCarGroundShadow();
  this.resetTestBackgroundProps();
  this.applyMultiplierTheme("idle");
  this.updateBounceText();
  this.smokeLayer.removeAll(true);
}

spawnSmoke(x, y, count, color) {
  const puffCount = this.isMobilePerfMode()
    ? Math.max(1, Math.ceil((Number(count) || 1) * 0.42))
    : count;
  for (let i = 0; i < puffCount; i++) {
    const puff = this.add.circle(x + Phaser.Math.Between(-8, 12), y + Phaser.Math.Between(-18, 18), Phaser.Math.Between(10, 24), color, 0.34)
      .setDepth(8);
    this.smokeLayer.add(puff);
    this.tweens.add({
      targets: puff,
      x: puff.x - Phaser.Math.Between(40, 110),
      y: puff.y - Phaser.Math.Between(18, 84),
      scaleX: Phaser.Math.FloatBetween(1.8, 3.2),
      scaleY: Phaser.Math.FloatBetween(1.8, 3.2),
      alpha: 0,
      duration: Phaser.Math.Between(520, 940),
      ease: "Cubic.out",
      onComplete: () => puff.destroy()
    });
  }
}

update(_time, delta) {
  const cfg = CT.Config;
  const dt = delta / 1000;
  if (_time >= this.nextFenceLightUpdateAt) {
    this.nextFenceLightUpdateAt = _time + 33;
    this.updateFenceLights(_time);
  }
  this.updateCarIdleShake(_time);
  this.updateFlightRagdoll(delta);
  if (this.state === "dummyFlight") {
    let roadDx = 0;
    if (this.flightRoadSpeed > 0.5) {
      this.flightRoadSpeed *= Math.pow(0.9993, delta / 16.6667);
      roadDx = this.flightRoadSpeed * 1.45 * dt;
      this.advanceRoad(roadDx);
    } else {
      this.flightRoadSpeed = 0;
    }
    this.advanceCrashDebris(roadDx);
    this.updateDummyFlightShadow();
    this.updateDummyCamera();
    return;
  }

  if (this.state !== "running") return;
  if (this.bonusGameActive) {
    this.updateBonusGameIntro(delta);
    return;
  }
  const factor = 1 + (cfg.gameplay.turboFactor - 1) * this.turboPower;
  this.speed += cfg.gameplay.acceleration * factor * (1 + this.speed * cfg.gameplay.speedProgression) * dt;
  this.visualSpeed = cfg.gameplay.roadBaseSpeed + this.speed * cfg.gameplay.roadSpeedScale;
  const speedRate = cfg.gameplay.multiplierBaseRate + this.speed * cfg.gameplay.multiplierSpeedRate;
  const multiplierEase = 1 + Math.sqrt(Math.max(0, this.multiplier)) * 0.026;
  this.multiplier = Math.min(cfg.gameplay.maxMultiplier, this.multiplier + speedRate * factor * multiplierEase * dt);
  this.hud.setMultiplier(this.getDisplayedMultiplier());
  this.updateBounceText();
  this.tryRareBounceProc(dt);
  if (this.checkAutospinCrash()) return;

  const roadSpeed = this.visualSpeed * factor;
  const dx = roadSpeed * dt;
  if (this.car.x < cfg.gameplay.carCruiseX) {
    this.car.x = Math.min(cfg.gameplay.carCruiseX, this.car.x + dx);
  }
  const leverLift = Phaser.Math.Easing.Cubic.Out(this.turboPower);
  const lift = leverLift * 5.04;
  this.car.y = this.getGameplayRoadY() - 54 - lift;
  this.car.angle = this.turboPower > 0.03 ? -Phaser.Math.Linear(0.25, 3.57, leverLift) : 0;
  this.updateCarBodyBounce(this.time.now);
  this.setWheelPlayback(true, Phaser.Math.Linear(0.38, 1.65, Phaser.Math.Clamp(roadSpeed / 980, 0, 1)));
  this.updateCarFlame();
  this.updateCarLightSweep(roadSpeed);
  this.updateCarGroundShadow();
  this.advanceRoad(dx);
  if (this.multiplier >= this.engineBreakAt) {
    this.engineFail();
    return;
  }

  if (this.multiplier >= cfg.gameplay.maxMultiplier) {
    this.autoCrash = true;
    this.cashOutCrash();
  }
}

advanceRoad(dx) {
  if (!this.roadTiles || !this.roadTiles.length) return;
  this.advanceTestBackground(dx);
  const patternWidth = this.getRoadTileWidth() * 3;
  this.roadOffset = Phaser.Math.Wrap(this.roadOffset + dx, 0, patternWidth);
  if (this.fenceTiles && this.fenceTiles.length) {
    const fenceWidth = this.getFenceTileWidth();
    this.fenceOffset = Phaser.Math.Wrap(this.fenceOffset + dx, 0, fenceWidth);
  }
  this.advanceLoopObjectLayers(dx);
  this.advanceOldDummyTrailLayer(dx);
  this.updateRoadTilesLayout();
}

advanceOldDummyTrailLayer(dx) {
  if (!this.oldDummyTrailLayer || !this.oldDummyTrailParts || !this.oldDummyTrailParts.length) return;
  const hasVisibleParts = this.oldDummyTrailParts.some((part) => part && part.active && part.visible);
  if (!hasVisibleParts) return;
  const factor = this.oldDummyTrailReturnMode || this.state === "returning" ? 0.42 : 1;
  this.oldDummyTrailLayer.x -= (Number(dx) || 0) * factor;
}

updateDummyCamera() {
  const target = Math.max(0, this.dummy.x - CT.Config.width * 0.56);
  this.cameras.main.scrollX = target;
}

updateBounceText() {
  const count = this.remainingBounces === null ? this.getBounceCount(this.multiplier) : this.remainingBounces;
  this.showBounceBadge(count);
}

tryRareBounceProc(dt) {
  if (this.time.now < this.nextRareBounceAt || this.rareBounceCount >= 5) return;
  const chancePerSecond = 0.068;
  if (Math.random() >= chancePerSecond * dt) return;
  this.rareBounceCount++;
  this.nextRareBounceAt = this.time.now + 2200;
  this.updateBounceText();
  this.flashRareBounce();
}

flashRareBounce() {
  if (!this.bounceBadge) return;
  const x = this.multiplierPanel.x + this.bounceBadge.x;
  const y = this.multiplierPanel.y + this.bounceBadge.y;
  this.bounceBadge.setVisible(true).setAlpha(1).setScale(1.28).setAngle(-7);
  this.bounceBadgeIcon.setAlpha(0);
  this.bounceBadgeExtraIcon.setAlpha(1);
  this.bounceBadgeText.setColor("#ffffff");
  this.tweens.killTweensOf([this.bounceBadgeIcon, this.bounceBadgeExtraIcon, this.bounceBadgeText]);
  this.tweens.add({
    targets: this.bounceBadge,
    scaleX: 1,
    scaleY: 1,
    angle: -7,
    duration: 360,
    ease: "Back.out"
  });
  this.tweens.add({
    targets: this.bounceBadgeExtraIcon,
    alpha: 0,
    duration: 820,
    ease: "Sine.inOut"
  });
  this.tweens.add({
    targets: this.bounceBadgeIcon,
    alpha: 1,
    duration: 820,
    ease: "Sine.inOut"
  });
  this.time.delayedCall(620, () => {
    if (this.bounceBadgeText && this.bounceBadgeText.active) this.bounceBadgeText.setColor("#ffffff");
  });

  const label = this.add.text(x, y - 58, "+1 RARE BOUNCE", {
    fontFamily: CT.Config.fontFamily || "Arial",
    fontSize: "28px",
    color: "#d97cff",
    letterSpacing: CT.Config.fontLetterSpacing || 0,
    resolution: CT.Config.fontResolution || 1
  }).setOrigin(0.5).setDepth(18).setScrollFactor(0);
  this.tweens.add({
    targets: label,
    y: label.y - 54,
    alpha: 0,
    duration: 900,
    ease: "Cubic.out",
    onComplete: () => label.destroy()
  });

  for (let i = 0; i < 18; i++) {
    const p = this.add.circle(x, y, Phaser.Math.Between(3, 7), 0xd97cff, 0.85)
      .setDepth(17)
      .setScrollFactor(0);
    this.tweens.add({
      targets: p,
      x: x + Phaser.Math.Between(-95, 95),
      y: y + Phaser.Math.Between(-70, 70),
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: Phaser.Math.Between(520, 900),
      ease: "Cubic.out",
      onComplete: () => p.destroy()
    });
  }
}

setMultiplierDisplay(value) {
  if (!this.multiplierText) return;
  const n = Number(value || 0);
  const nextText = n <= 0 ? "0x" : n.toFixed(2) + "x";
  if (this.multiplierText.text !== nextText) this.multiplierText.setText(nextText);
  if (n > 0 && Math.abs(n - this.lastMultiplierDisplay) > 0.035 && this.time.now - this.lastMultiplierPulseAt > 150) {
    this.lastMultiplierDisplay = n;
    this.lastMultiplierPulseAt = this.time.now;
    this.tweens.killTweensOf(this.multiplierText);
    this.multiplierText.setScale(1.08);
    this.tweens.add({
      targets: this.multiplierText,
      scaleX: 1,
      scaleY: 1,
      duration: 130,
      ease: "Sine.out"
    });
  }
}

animateMultiplierFail() {
  if (!this.multiplierText) return;
  this.applyMultiplierTheme("fail");
  this.tweens.killTweensOf([this.multiplierText, this.multiplierPanel]);
  const counter = { value: this.getDisplayedMultiplier() };
  this.tweens.add({
    targets: counter,
    value: 0,
    duration: 360,
    ease: "Cubic.in",
    onUpdate: () => {
      const n = Math.max(0, counter.value);
      this.multiplierText.setText(n <= 0.01 ? "0x" : n.toFixed(2) + "x");
    }
  });
  this.tweens.add({
    targets: this.multiplierText,
    scaleX: 1.08,
    scaleY: 1.08,
    duration: 90,
    yoyo: true,
    repeat: 2,
    ease: "Sine.inOut",
    onComplete: () => {
      this.multiplierText.setAngle(0).setScale(1).setText("0x");
      this.tweens.add({
        targets: this.multiplierPanel,
        alpha: 0.72,
        duration: 180,
        yoyo: true,
        ease: "Sine.inOut",
        onComplete: () => this.applyMultiplierTheme("idle")
      });
    }
  });
}

getDisplayedMultiplier() {
  return this.multiplier + this.bonusAdd;
}

formatX(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

setPageControlsDimmed(dimmed) {
  if (window.CrashTestSetPageControlsDim) {
    window.CrashTestSetPageControlsDim(!!dimmed);
  }
}

hideBootLoader() {
  const loader = document.getElementById("bootLoader");
  if (!loader) return;
  loader.classList.add("is-hidden");
  window.setTimeout(() => {
    if (loader.parentNode) loader.parentNode.removeChild(loader);
  }, 320);
}

}

CT.GameScene = GameScene;})();
