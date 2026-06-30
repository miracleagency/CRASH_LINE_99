(function () {
  const CT = window.CrashTest = window.CrashTest || {};

  class GameScene extends Phaser.Scene {
    constructor() {
      super("GameScene");
      this.wallet = null;
      this.hud = null;
      this.state = "ready";
      this.round = 0;
      this.multiplier = 0;
      this.speed = 0;
      this.turbo = false;
      this.turboPower = 0;
      this.engineBreakAt = 0;
      this.roadOffset = 0;
      this.fenceOffset = 0;
      this.visualSpeed = 0;
      this.flightRoadSpeed = 0;
      this.pendingPayout = 0;
      this.autoCrash = false;
      this.safeMode = false;
      this.bonusAdd = 0;
      this.bonusItems = [];
      this.bonusPauseToken = 0;
      this.lastMultiplierDisplay = -1;
      this.lastMultiplierPulseAt = 0;
      this.rareBounceCount = 0;
      this.nextRareBounceAt = 0;
      this.remainingBounces = null;
      this.extraBounceAdder = null;
      this.extraBounceBonusCount = 0;
      this.sfx = {};
      this.engineAudioToken = 0;
      this.engineLoopTimer = null;
      this.engineLoopIndex = 0;
      this.roadTiles = [];
      this.fenceTiles = [];
      this.loopObjectLayers = [];
      this.crashDebrisActive = false;
      this.fencePoleItems = [];
      this.fencePoleLayer = null;
      this.fenceOverlayItems = [];
      this.fenceOverlayLayer = null;
      this.fenceOverlayKeys = [];
      this.roadArtY = 0;
      this.roadArtScale = 1;
      this.fenceArtY = 0;
      this.fenceArtScale = 1;
      this.fencePoleX = 0;
      this.fencePoleY = 0;
      this.fencePoleSpacing = 247;
      this.fencePoleScale = 0.5;
      this.fenceLightOffsetY = -29;
      this.fenceLightScale = 0.4;
      this.fenceLightIntensity = 0.79;
      this.fenceLightDelay = 0.085;
      this.fenceOverlayX = 0;
      this.fenceOverlayY = 760;
      this.fenceOverlayHeight = 64;
      this.fenceOverlaySpacing = 420;
      this.fenceOverlayJitterX = 110;
      this.fenceOverlayCount = 24;
      this.fenceOverlayChance = 0.36;
      this.fenceOverlayScaleMin = 0.42;
      this.fenceOverlayScaleMax = 0.62;
      this.fenceOverlayAlpha = 0.96;
      this.hitWallX = 570;
      this.hitWallY = 888;
      this.hitWallScale = 0.34;
      this.hitWallAlpha = 1;
      this.hitWallImage = null;
      this.hitWallPreview = false;
      this.carControlConfig = null;
      this.carControlRoot = null;
      this.carControlJson = null;
      this.nextCarLightSweepAt = 0;
    }

    create() {
      console.log("GAME TEXTURES:", {
        bounceIcon: this.textures.exists("bounceIcon"),
        bounceIconExtra: this.textures.exists("bounceIconExtra"),
        hitWall: this.textures.exists("hitWall"),
        fencePole: this.textures.exists("fencePole"),
        fenceLight: this.textures.exists("fenceLight"),
        roadBgOverlay1: this.textures.exists("roadBgOverlay1"),
        carBody: this.textures.exists("carBody"),
        wheel1: this.textures.exists("wheel1"),
        wheelShadow: this.textures.exists("wheelShadow"),
        carGroundShadow: this.textures.exists("carGroundShadow"),
        turboFire1: this.textures.exists("turboFire1"),
        carCrashBody1: this.textures.exists("carCrashBody1"),
        carLightSweep1: this.textures.exists("carLightSweep1")
      });
      this.wallet = new CT.Wallet();
      this.cameras.main.setBounds(-1800, 0, CT.Config.gameplay.worldWidth + 1800, CT.Config.height);
      this.cameras.main.setScroll(0, 0);
      this.createBackground();
      this.createPlayfield();
      this.hud = new CT.Hud(this, this.wallet, {
        onLeverPress: () => this.handleLeverPress(),
        onLeverPower: (power) => this.setTurboPower(power),
        onLeverRelease: () => this.handleLeverRelease(),
        onSafeToggle: () => this.toggleSafeMode(),
        onMultiplierDisplay: (value) => this.setMultiplierDisplay(value)
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

    createBackground() {
      const cfg = CT.Config;
      const W = cfg.width;
      const H = cfg.height;
      this.cameras.main.setBackgroundColor(cfg.colors.bg);

      const g = this.add.graphics().setDepth(-20);
      g.setScrollFactor(0);
      g.fillStyle(0x071012, 1).fillRect(0, 0, W, H);
      g.fillStyle(0x132126, 1).fillRect(0, 170, W, H - 406);
      g.fillStyle(0x1f2426, 1).fillRect(0, H - 326, W, 148);
      g.fillStyle(0x0b171a, 1).fillRect(0, H - 178, W, 178);
      g.fillStyle(0x293237, 1).fillRect(0, CT.Config.gameplay.roadY - 36, W, 118);
      g.lineStyle(2, 0x37e5ff, 0.16);
      for (let y = 246; y < H - 410; y += 86) {
        g.lineBetween(52, y, W - 52, y);
      }
    }

    createPlayfield() {
      const cfg = CT.Config;
      const W = cfg.width;
      const H = cfg.height;
      this.createCarControlConfig();
      this.createRoadLoop();

      this.barrier = this.add.container(this.hitWallX, this.hitWallY).setDepth(6).setVisible(false);
      this.hitWallImage = this.add.image(0, 0, "hitWall")
          .setOrigin(0.5, 1)
          .setScale(this.hitWallScale);
      this.barrier.add(this.hitWallImage);
      this.updateHitWallLayout();

      this.smokeLayer = this.add.container(0, 0).setDepth(8);
      this.car = this.createCar();
      this.dummy = this.createDummy();
      this.car.add(this.dummy);
      this.dummy.setVisible(false);
      this.multiplierPanel = this.add.container(W / 2, cfg.gameplay.roadY - 345).setDepth(9);
      this.multiplierPanel.setScrollFactor(0);
      this.multiplierGlow = this.add.circle(0, 0, 178, 0xffcf30, 0.12).setBlendMode(Phaser.BlendModes.ADD);
      this.multiplierPanelBg = this.add.rectangle(0, 0, 438, 188, 0x071012, 0.84)
        .setStrokeStyle(7, 0xffcf30, 0.9);
      this.multiplierPanelInner = this.add.rectangle(0, 0, 396, 146, 0x1b2327, 0.58)
        .setStrokeStyle(3, 0xffffff, 0.28);
      this.multiplierPanelLabel = this.add.text(0, -72, "MULTIPLIER", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#baf7ff",
        fontStyle: "bold"
      }).setOrigin(0.5).setAlpha(0.85);
      this.multiplierText = this.add.text(0, 15, "0x", {
        fontFamily: "Arial",
        fontSize: "114px",
        color: "#ffcf30",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 14,
        shadow: {
          offsetX: 0,
          offsetY: 4,
          color: "#7a3600",
          blur: 0,
          fill: true
        }
      }).setOrigin(0.5);
      this.multiplierPanel.add([this.multiplierGlow, this.multiplierPanelBg, this.multiplierPanelInner, this.multiplierPanelLabel, this.multiplierText]);
      this.createBounceBadge();
      this.createCarControlUI();
      this.applyMultiplierTheme("idle");
    }

    createRoadLoop() {
      const cfg = CT.Config;
      this.applyRoadArtDefaults();
      this.roadTiles = [];
      this.fenceTiles = [];
      this.loopObjectLayers = [];
      this.fencePoleItems = [];
      this.fencePoleLayer = null;
      this.fenceOverlayItems = [];
      this.fenceOverlayLayer = null;

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
          x: this.fenceOverlayX,
          y: this.fenceOverlayY,
          spacing: this.fenceOverlaySpacing
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
        count: 32,
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
          item.pole.setScale(this.fencePoleScale);
          item.light.setPosition(0, this.fenceLightOffsetY);
          item.light.baseScale = this.fenceLightScale;
        }
      });
      this.fencePoleItems = this.fencePoleLayer.items;
    }

    layoutFenceOverlayItem(item) {
      const activeCount = Math.round(Phaser.Math.Clamp(this.fenceOverlayCount, 0, 48));
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

      const yOffset = this.seededUnit(logicalIndex, 37) * this.fenceOverlayHeight;
      const xJitter = (this.seededUnit(logicalIndex, 41) * 2 - 1) * this.fenceOverlayJitterX;
      const scaleLow = Math.min(this.fenceOverlayScaleMin, this.fenceOverlayScaleMax);
      const scaleHigh = Math.max(this.fenceOverlayScaleMin, this.fenceOverlayScaleMax);
      const scale = Phaser.Math.Linear(scaleLow, scaleHigh, this.seededUnit(logicalIndex, 53));

      item.setVisible(true);
      item.x += xJitter;
      item.y = this.fenceOverlayY + yOffset;
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
        active: true
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
      layer.offset = Phaser.Math.Wrap(layer.travel, 0, spacing);
      const baseIndex = Math.floor(layer.travel / spacing);

      layer.items.forEach((item, i) => {
        item.x = (Number(layout.x) || 0) + i * spacing - spacing - layer.offset;
        item.y = Number.isFinite(Number(layout.y)) ? Number(layout.y) : 0;
        item.logicalIndex = baseIndex + i - 1;
        if (layer.onLayout) layer.onLayout(item, i, layer, layout);
      });
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
      this.roadArtY = gp.roadArtY;
      this.roadArtScale = gp.roadArtScale;
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
      this.hitWallScale = gp.hitWallScale;
      this.hitWallAlpha = gp.hitWallAlpha;
    }

    updateHitWallLayout() {
      if (!this.barrier) return;
      this.barrier.setPosition(this.hitWallX, this.hitWallY).setAlpha(this.hitWallAlpha);
      if (this.hitWallImage) this.hitWallImage.setScale(this.hitWallScale);
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
      this.roadOffset = Phaser.Math.Wrap(this.roadOffset, 0, patternWidth);
      this.roadTiles.forEach((tile, i) => {
        tile.setScale(this.roadArtScale);
        tile.y = this.roadArtY;
        tile.x = i * tileWidth - tileWidth - this.roadOffset;
      });
      if (this.fenceTiles && this.fenceTiles.length) {
        const fenceWidth = this.getFenceTileWidth();
        this.fenceOffset = Phaser.Math.Wrap(this.fenceOffset, 0, fenceWidth);
        this.fenceTiles.forEach((tile, i) => {
          tile.setScale(this.fenceArtScale);
          tile.y = this.fenceArtY;
          tile.x = i * fenceWidth - fenceWidth - this.fenceOffset;
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
        const logicalIndex = item.logicalIndex || 0;
        const cycle = Phaser.Math.Wrap(time * 0.00062 + logicalIndex * delayStep, 0, 1);
        const darkHold = 0.58;
        const active = cycle <= darkHold ? 0 : (cycle - darkHold) / (1 - darkHold);
        const pulse = active > 0 ? Math.pow(Math.sin(active * Math.PI), 1.45) : 0;
        const alpha = pulse <= 0 ? 0 : peakAlpha * pulse;
        const pulseScale = 1 + pulse * intensity * 0.13;
        item.light.setAlpha(alpha);
        item.light.setScale(this.fenceLightScale * pulseScale);
      });
    }

    createCarControlConfig() {
      const defaults = JSON.parse(JSON.stringify(CT.Config.gameplay.carArt || {}));
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem("crashTestCarArtV4") || "null");
      } catch (e) {
        saved = null;
      }
      this.carControlConfig = this.mergeCarControlConfig(defaults, saved);
    }

    mergeCarControlConfig(defaults, saved) {
      const result = JSON.parse(JSON.stringify(defaults));
      if (!saved || typeof saved !== "object") return result;
      Object.keys(result).forEach((groupKey) => {
        const group = saved[groupKey];
        if (!group || typeof group !== "object") return;
        Object.keys(result[groupKey]).forEach((key) => {
          const fallback = result[groupKey][key];
          if (typeof fallback === "number") {
            const value = Number(group[key]);
            if (Number.isFinite(value)) result[groupKey][key] = value;
          } else if (typeof fallback === "string") {
            result[groupKey][key] = this.normalizeHexColor(group[key], fallback);
          }
        });
      });
      return result;
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

      if (this.car) {
        if (this.car.visualRoot) this.car.visualRoot.setPosition(cfg.root.x, cfg.root.y).setScale(cfg.root.scale);
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

      if (save) {
        localStorage.setItem("crashTestCarArtV4", JSON.stringify(cfg));
      }
      this.updateCarControlJson();
    }

    createCarControlUI() {
      const root = document.getElementById("control-ui");
      if (!root || !this.carControlConfig) return;
      this.carControlRoot = root;
      root.innerHTML = "";

      root.appendChild(this.makeCarControlTitle("Whole car"));
      root.appendChild(this.makeCarSlider("x", this.carControlConfig.root, "x", -360, 360, 1));
      root.appendChild(this.makeCarSlider("y", this.carControlConfig.root, "y", -260, 260, 1));
      root.appendChild(this.makeCarSlider("scale", this.carControlConfig.root, "scale", 0.05, 2.5, 0.01));
      root.appendChild(this.makeCarControlTitle("Car body"));
      root.appendChild(this.makeCarSlider("x", this.carControlConfig.body, "x", -360, 360, 1));
      root.appendChild(this.makeCarSlider("y", this.carControlConfig.body, "y", -260, 260, 1));
      root.appendChild(this.makeCarSlider("scale", this.carControlConfig.body, "scale", 0.01, 1.5, 0.01));
      root.appendChild(this.makeCarControlTitle("Rear wheel"));
      root.appendChild(this.makeCarSlider("x", this.carControlConfig.rearWheel, "x", -360, 360, 1));
      root.appendChild(this.makeCarSlider("y", this.carControlConfig.rearWheel, "y", -260, 260, 1));
      root.appendChild(this.makeCarSlider("scale", this.carControlConfig.rearWheel, "scale", 0.01, 1.5, 0.01));
      root.appendChild(this.makeCarControlTitle("Front wheel"));
      root.appendChild(this.makeCarSlider("x", this.carControlConfig.frontWheel, "x", -360, 360, 1));
      root.appendChild(this.makeCarSlider("y", this.carControlConfig.frontWheel, "y", -260, 260, 1));
      root.appendChild(this.makeCarSlider("scale", this.carControlConfig.frontWheel, "scale", 0.01, 1.5, 0.01));
      root.appendChild(this.makeCarControlTitle("Wheel shadow"));
      root.appendChild(this.makeCarSlider("x", this.carControlConfig.wheelShadow, "x", -360, 360, 1));
      root.appendChild(this.makeCarSlider("y", this.carControlConfig.wheelShadow, "y", -260, 260, 1));
      root.appendChild(this.makeCarSlider("scale", this.carControlConfig.wheelShadow, "scale", 0.01, 1.5, 0.01));
      root.appendChild(this.makeCarSlider("alpha", this.carControlConfig.wheelShadow, "alpha", 0, 1, 0.01));
      root.appendChild(this.makeCarControlTitle("Turbo fire"));
      root.appendChild(this.makeCarSlider("x", this.carControlConfig.turboFire, "x", -420, 260, 1));
      root.appendChild(this.makeCarSlider("y", this.carControlConfig.turboFire, "y", -220, 220, 1));
      root.appendChild(this.makeCarSlider("scale", this.carControlConfig.turboFire, "scale", 0.01, 1.5, 0.01));
      root.appendChild(this.makeCarSlider("alpha", this.carControlConfig.turboFire, "alpha", 0, 1, 0.01));
      root.appendChild(this.makeCarControlTitle("Turbo tint"));
      root.appendChild(this.makeCarSlider("phase", this.carControlConfig.turboFireTint, "preview", 0, 1, 0.01));
      root.appendChild(this.makeCarColor("orange", this.carControlConfig.turboFireTint, "orange"));
      root.appendChild(this.makeCarColor("yellow", this.carControlConfig.turboFireTint, "yellow"));
      root.appendChild(this.makeCarColor("green", this.carControlConfig.turboFireTint, "green"));
      root.appendChild(this.makeCarColor("blue", this.carControlConfig.turboFireTint, "blue"));
      root.appendChild(this.makeCarColor("purple", this.carControlConfig.turboFireTint, "purple"));

      const actions = document.createElement("div");
      actions.className = "control-ui__actions";

      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copy JSON";
      copy.onclick = async () => {
        const text = JSON.stringify(this.carControlConfig, null, 2);
        try {
          await navigator.clipboard.writeText(text);
          copy.textContent = "Copied!";
          window.setTimeout(() => { copy.textContent = "Copy JSON"; }, 700);
        } catch (e) {
          copy.textContent = "Copy failed";
          window.setTimeout(() => { copy.textContent = "Copy JSON"; }, 900);
        }
      };

      const reset = document.createElement("button");
      reset.type = "button";
      reset.textContent = "Reset";
      reset.onclick = () => this.resetCarArt();

      actions.appendChild(copy);
      actions.appendChild(reset);
      root.appendChild(actions);

      this.carControlJson = document.createElement("pre");
      root.appendChild(this.carControlJson);
      this.updateCarControlJson();
    }

    resetCarArt() {
      this.carControlConfig = JSON.parse(JSON.stringify(CT.Config.gameplay.carArt || {}));
      localStorage.removeItem("crashTestCarArtV4");
      this.applyCarControlConfig(false);
      this.createCarControlUI();
    }

    makeCarControlTitle(text) {
      const title = document.createElement("div");
      title.className = "control-ui__title";
      title.textContent = text;
      return title;
    }

    makeCarSlider(labelText, target, key, min, max, step) {
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
        target[key] = Number(next);
        this.applyCarControlConfig(true);
        range.value = target[key];
        value.value = target[key];
      };

      range.oninput = () => sync(range.value);
      value.oninput = () => sync(value.value);

      label.appendChild(name);
      label.appendChild(range);
      label.appendChild(value);
      return label;
    }

    makeCarColor(labelText, target, key) {
      const label = document.createElement("label");
      label.className = "control-ui__row control-ui__row--color";

      const name = document.createElement("span");
      name.textContent = labelText;

      const color = document.createElement("input");
      color.type = "color";
      color.value = this.normalizeHexColor(target[key], CT.Config.gameplay.carArt.turboFireTint[key]);

      const value = document.createElement("input");
      value.type = "text";
      value.value = color.value;

      const sync = (next) => {
        target[key] = this.normalizeHexColor(next, target[key]);
        color.value = target[key];
        value.value = target[key];
        this.applyCarControlConfig(true);
      };

      color.oninput = () => sync(color.value);
      value.onchange = () => sync(value.value);

      label.appendChild(name);
      label.appendChild(color);
      label.appendChild(value);
      return label;
    }

    updateCarControlJson() {
      if (!this.carControlJson || !this.carControlConfig) return;
      this.carControlJson.textContent = JSON.stringify(this.carControlConfig, null, 2);
    }

    createBounceBadge() {
      this.bounceBadge = this.add.container(170, -88).setVisible(false).setAlpha(0).setScale(0.45);
      this.bounceBadgeIcon = this.add.image(0, 0, "bounceIcon").setScale(0.56);
      this.bounceBadgeExtraIcon = this.add.image(0, 0, "bounceIconExtra").setScale(0.56).setAlpha(0);
      this.bounceBadgeText = this.add.text(34, 2, "0", {
        fontFamily: "Arial",
        fontSize: "60px",
        color: "#000000",
        fontStyle: "bold"
      }).setOrigin(0.5);
      this.bounceBadge.add([this.bounceBadgeIcon, this.bounceBadgeExtraIcon, this.bounceBadgeText]);
      this.bounceBadge.lastCount = 0;
      this.multiplierPanel.add(this.bounceBadge);
    }

    applyMultiplierTheme(theme) {
      if (!this.multiplierText || !this.multiplierPanelBg) return;
      const themes = {
        idle: { main: 0x8f969b, text: "#8f969b", label: "#8f969b", glow: 0x8f969b, shadow: "#303538" },
        running: { main: 0x41ce44, text: "#41CE44", label: "#41CE44", glow: 0x41ce44, shadow: "#0f4a19" },
        fail: { main: 0xff3f3f, text: "#ff3f3f", label: "#ff6b6b", glow: 0xff3f3f, shadow: "#4a0f0f" }
      };
      const next = themes[theme] || themes.idle;
      this.multiplierGlow.setFillStyle(next.glow, theme === "idle" ? 0.08 : 0.16);
      this.multiplierPanelBg.setStrokeStyle(7, next.main, theme === "idle" ? 0.62 : 0.92);
      this.multiplierPanelInner.setStrokeStyle(3, next.main, theme === "idle" ? 0.18 : 0.32);
      this.multiplierPanelLabel.setColor(next.label);
      this.multiplierText.setColor(next.text);
      this.multiplierText.setShadow(0, 4, next.shadow, 0, true, true);
    }

    showBounceBadge(count) {
      if (!this.bounceBadge) return;
      const n = Math.max(0, Math.floor(Number(count || 0)));
      this.bounceBadgeText.setText(String(n));
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
            this.bounceBadge.setVisible(false).setScale(0.45).setAngle(0);
            this.bounceBadgeIcon.setAlpha(1);
            this.bounceBadgeExtraIcon.setAlpha(0);
            this.bounceBadgeText.setColor("#000000");
            this.bounceBadge.lastCount = 0;
          }
        });
        return;
      }

      if (!this.bounceBadge.visible) {
        this.bounceBadge.setVisible(true).setAlpha(0).setScale(0.45).setAngle(-10);
        this.tweens.killTweensOf(this.bounceBadge);
        this.tweens.add({
          targets: this.bounceBadge,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          angle: 0,
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
          duration: 220,
          ease: "Back.out"
        });
      }
      this.bounceBadge.lastCount = n;
    }

    createCar() {
      const car = this.add.container(CT.Config.gameplay.carStartX, CT.Config.gameplay.roadY - 54).setDepth(5);
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
      this.car.turboFire
        .setTint(this.getTurboFireTint(tintPhase))
        .setScale(fireCfg.scale * scalePower)
        .setAlpha(fireCfg.alpha * alphaPower);
      this.car.turboFire.anims.timeScale = running ? Phaser.Math.Linear(0.75, 2.1, power) : 0.5;
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
      const stops = [tint.orange, tint.yellow, tint.green, tint.blue, tint.purple]
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
      const rootScale = Math.max(0.01, Number(root.scale) || 1);
      const baseCarY = CT.Config.gameplay.roadY - 54;
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
      this.car.setPosition(viewScrollX + cfg.gameplay.carStartX, cfg.gameplay.roadY - 54).setAngle(0).setAlpha(1);
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
        return false;
      }

      const cfg = CT.Config;
      this.state = "running";
      this.round += 1;
      this.resetRunVisuals(false);
      this.multiplier = cfg.gameplay.startMultiplier;
      this.speed = cfg.gameplay.baseSpeed;
      this.turbo = false;
      this.turboPower = 0;
      this.autoCrash = false;
      this.engineBreakAt = this.pickEngineBreakAt();
      this.hud.update();
      this.hud.setMultiplier(this.multiplier);
      this.hud.setRunning(true);
      this.hud.setTurbo(false);
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
      const instantBustChance = 0.12;
      if (Math.random() < instantBustChance) {
        return Phaser.Math.FloatBetween(0.12, 0.98);
      }

      const houseEdge = 0.88;
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

    cashOutCrash() {
      if (this.state !== "running") return;
      const releaseTurboPower = this.turboPower;
      const releaseFactor = 1 + (CT.Config.gameplay.turboFactor - 1) * releaseTurboPower;
      const releaseRoadSpeed = Math.max(460, (this.visualSpeed || 340) * releaseFactor);
      this.setTurboPower(0);
      this.stopEngineAudio();
      this.playOneShot("carCrash");
      this.state = "crashing";
      this.updateCarFlame();
      const payout = this.wallet.currentBet * this.multiplier;
      const crashRoadTravel = 820;
      const crashApproachDuration = Phaser.Math.Clamp((crashRoadTravel / releaseRoadSpeed) * 1000 * 0.48, 240, 390);
      const impactWallX = CT.Config.width * 0.57 + 142;
      const impactCarX = CT.Config.width * 0.57 - 10;
      const wallStartX = impactWallX + crashRoadTravel;
      this.pendingPayout = payout;
      this.bonusAdd = 0;
      this.clearBonusItems();
      this.hud.setLocked(true);
      this.hud.setResult(this.autoCrash ? "WALL HIT!" : "CRASH!", "#ffffff");
      this.barrier.setVisible(true);
      this.barrier.setPosition(wallStartX, this.hitWallY).setAlpha(this.hitWallAlpha).setScale(1);
      const carStartX = this.car.x;
      this.tweens.killTweensOf(this.car);
      this.tweens.killTweensOf(this.barrier);
      this.cameras.main.shake(360, 0.004);

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
      this.cameras.main.shake(420, 0.018);
      this.spawnSmoke(this.car.x + 96, this.car.y - 10, 20, 0xffcf30);
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
      this.dummy.setPosition(dummyWorldX, dummyWorldY).setDepth(9).setScale(1).setAngle(dummyWorldAngle).setVisible(true);
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

    playDummyFlight(payout) {
      const cfg = CT.Config;
      const groundY = cfg.gameplay.roadY + 8;
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
        },
        onComplete: () => {
          this.dummy.setPosition(impactX, groundY).setAngle(spinEnd);
          this.cameras.main.shake(150, 0.006);
          this.spawnSmoke(this.dummy.x, groundY + 8, 8, 0xd7dde2);
          this.playDummyBounces(payout, bounceCount);
        }
      });
    }

    playDummyBounces(payout, count) {
      const groundY = CT.Config.gameplay.roadY + 8;
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
            if (index >= totalBounces) {
              const brakeT = Phaser.Math.Clamp((u - 0.28) / 0.72, 0, 1);
              const brakeEase = Phaser.Math.Easing.Sine.InOut(brakeT);
              this.flightRoadSpeed = roadSpeedAtArcStart * Math.pow(1 - brakeEase, 0.55);
            }
            this.collectBonusesOnCurve(bonuses, u);
          },
          onComplete: () => {
            this.dummy.setPosition(endX, groundY).setAngle(endAngle);
            this.spawnSmoke(this.dummy.x, groundY + 6, 3, 0xd7dde2);
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
      return root;
    }

    createBonusCoin(x, y, value) {
      const root = this.add.container(x, y).setDepth(14);
      const palette = this.getBonusPalette(value);
      const bg = this.add.circle(0, 0, 34, palette.fill, 0.96).setStrokeStyle(4, palette.stroke, 0.94);
      const shine = this.add.circle(-10, -11, 9, 0xffffff, 0.34);
      const txt = this.add.text(0, 0, value + "x", {
        fontFamily: "Arial",
        fontSize: value < 1 || value >= 100 ? "20px" : "23px",
        color: palette.text,
        fontStyle: "bold"
      }).setOrigin(0.5);
      root.add([bg, shine, txt]);
      root.bonusValue = value;
      this.bonusItems.push(root);
      this.tweens.add({
        targets: root,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 260,
        ease: "Sine.inOut",
        yoyo: true,
        repeat: -1
      });
      return root;
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
      const total = weights.reduce((sum, item) => sum + item.weight, 0);
      let roll = Math.random() * total;
      for (const item of weights) {
        roll -= item.weight;
        if (roll <= 0) return item.value;
      }
      return 0.1;
    }

    getBonusPalette(value) {
      if (value >= 5000) return { fill: 0xffffff, stroke: 0xff38e8, text: "#5c004e" };
      if (value >= 4000) return { fill: 0xff38e8, stroke: 0xffffff, text: "#3a0035" };
      if (value >= 3000) return { fill: 0x7c4dff, stroke: 0xffffff, text: "#140038" };
      if (value >= 2000) return { fill: 0x318dff, stroke: 0xffffff, text: "#001f4d" };
      if (value >= 1000) return { fill: 0xfff36b, stroke: 0xffffff, text: "#473900" };
      if (value >= 500) return { fill: 0xff6b4a, stroke: 0xffffff, text: "#3d0900" };
      if (value >= 200) return { fill: 0x00ffa8, stroke: 0xffffff, text: "#003829" };
      if (value >= 100) return { fill: 0xf6f0ff, stroke: 0xc86bff, text: "#3b0061" };
      if (value >= 50) return { fill: 0xd97cff, stroke: 0xffffff, text: "#21002f" };
      if (value >= 20) return { fill: 0x47f2ff, stroke: 0xffffff, text: "#002f36" };
      if (value >= 10) return { fill: 0x63ff9f, stroke: 0xffffff, text: "#063318" };
      if (value >= 5) return { fill: 0xffea35, stroke: 0xffffff, text: "#392a00" };
      if (value >= 2) return { fill: 0xff43a9, stroke: 0xffffff, text: "#3b001f" };
      if (value >= 1) return { fill: 0x35d7ff, stroke: 0xffffff, text: "#002f3d" };
      if (value >= 0.5) return { fill: 0x8cff57, stroke: 0xffffff, text: "#123000" };
      if (value >= 0.25) return { fill: 0xff8a3d, stroke: 0xffffff, text: "#331100" };
      return { fill: 0x9b7cff, stroke: 0xffffff, text: "#18004a" };
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
      this.showBonusPop(bonus.x, bonus.y, bonus.bonusValue);
      this.cameras.main.shake(bonus.bonusValue >= 5 ? 150 : 75, bonus.bonusValue >= 5 ? 0.006 : 0.003);
      this.pauseForBonus(bonus.bonusValue);
      this.tweens.killTweensOf(bonus);
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
      if (added) {
        this.flightRoadSpeed = Math.max(this.flightRoadSpeed * 1.14, this.flightRoadSpeed + 80);
        this.showExtraBouncePop(bonus.x, bonus.y);
        this.cameras.main.shake(140, 0.005);
        this.pauseForBonus(2);
      }
      this.tweens.killTweensOf(bonus);
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
        fontFamily: "Arial",
        fontSize: "42px",
        color: "#c58cff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8
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
        fontFamily: "Arial",
        fontSize: value >= 10 ? "54px" : "46px",
        color: "#ffcf30",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8
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

    clearBonusItems() {
      this.bonusItems.forEach((item) => {
        if (item && item.active) item.destroy();
      });
      this.bonusItems = [];
    }

    getBounceCount(multiplier) {
      const cfg = CT.Config;
      const value = Math.max(0, Number(multiplier || 0));
      const raw = value < 2 ? 0 : Math.floor(Math.log2(value));
      return Phaser.Math.Clamp(raw + this.rareBounceCount, cfg.gameplay.minBounces, cfg.gameplay.maxBounces);
    }

    settleDummy(payout) {
      const groundY = CT.Config.gameplay.roadY + 8;
      this.flightRoadSpeed = 0;
      this.tweens.add({
        targets: this.dummy,
        y: groundY + 5,
        angle: this.dummy.angle + 18,
        duration: 80,
        yoyo: true,
        repeat: 1,
        ease: "Sine.inOut",
        onComplete: () => this.showCrashFinal(payout)
      });
    }

    showCrashFinal(payout) {
      const finalMultiplier = this.multiplier + this.bonusAdd;
      const finalPayout = this.wallet.currentBet * finalMultiplier;
      this.wallet.addWin(finalPayout);
      this.hud.update();
      this.hud.setResult("LAST WIN +$" + this.wallet.format(finalPayout), CT.Config.colors.ok);
      this.showFinalWinCounter(finalPayout, () => {
        this.time.delayedCall(120, () => this.returnCameraToStart(true));
      });
    }

    showFinalWinCounter(finalPayout, onComplete) {
      const centerX = this.cameras.main.scrollX + CT.Config.width / 2;
      const centerY = CT.Config.height / 2 - 20;
      const box = this.add.container(centerX, centerY).setDepth(40);
      const glow = this.add.circle(0, 0, 142, 0x63ff9f, 0.18).setBlendMode(Phaser.BlendModes.ADD);
      const bg = this.add.rectangle(0, 0, 430, 178, 0x071012, 0.88)
        .setStrokeStyle(5, 0x63ff9f, 0.92);
      const label = this.add.text(0, -52, "FINAL WIN", {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#ffffff",
        fontStyle: "bold"
      }).setOrigin(0.5);
      const valueText = this.add.text(0, 26, "$0.00", {
        fontFamily: "Arial",
        fontSize: "58px",
        color: "#63ff9f",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8
      }).setOrigin(0.5);
      box.add([glow, bg, label, valueText]);
      box.setScale(0.55).setAlpha(0);

      this.tweens.add({
        targets: box,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 220,
        ease: "Back.out"
      });

      const counter = { value: 0 };
      this.tweens.add({
        targets: counter,
        value: finalPayout,
        duration: 650,
        ease: "Cubic.out",
        onUpdate: () => {
          valueText.setText("$" + this.wallet.format(counter.value));
        },
        onComplete: () => {
          valueText.setText("$" + this.wallet.format(finalPayout));
          this.tweens.add({
            targets: [box, glow],
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 130,
            yoyo: true,
            ease: "Sine.inOut",
            onComplete: () => {
              this.time.delayedCall(160, () => {
                this.tweens.add({
                  targets: box,
                  alpha: 0,
                  scaleX: 0.86,
                  scaleY: 0.86,
                  duration: 150,
                  ease: "Cubic.in",
                  onComplete: () => {
                    box.destroy();
                    onComplete && onComplete();
                  }
                });
              });
            }
          });
        }
      });
    }

    engineFail() {
      if (this.state !== "running") return;
      const baseCarY = CT.Config.gameplay.roadY - 54;
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
      if (spawnNewCar) {
        const carVisibleInView = this.car.x > this.cameras.main.scrollX - 220 && this.car.x < this.cameras.main.scrollX + CT.Config.width + 220;
        this.car.setAlpha(carVisibleInView ? 0.82 : 0);
        if (this.car.turboFire) this.car.turboFire.setAlpha(0);
        this.updateCarGroundShadow();
        const cfg = CT.Config;
        const awayScrollX = -Phaser.Math.Clamp(cfg.width * 1.85, 980, 1580);
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
        }
      });
    }

    resetRunVisuals(launchPosition) {
      const cfg = CT.Config;
      this.tweens.killTweensOf([this.car, this.dummy]);
      this.stopCrashDebrisRoadLock();
      this.barrier.setVisible(false);
      this.barrier.setAlpha(this.hitWallAlpha).setScale(1);
      this.updateHitWallLayout();
      this.car.setPosition(launchPosition ? cfg.gameplay.carStartX : cfg.gameplay.carReadyX, cfg.gameplay.roadY - 54).setAngle(0).setAlpha(1);
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
      this.bonusAdd = 0;
      this.rareBounceCount = 0;
      this.nextRareBounceAt = 0;
      this.remainingBounces = null;
      this.extraBounceAdder = null;
      this.extraBounceBonusCount = 0;
      this.bonusPauseToken++;
      this.time.timeScale = 1;
      this.clearBonusItems();
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
      this.applyMultiplierTheme("idle");
      this.updateBounceText();
      this.smokeLayer.removeAll(true);
    }

    resetRunStateOnly() {
      const cfg = CT.Config;
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
      this.bonusAdd = 0;
      this.rareBounceCount = 0;
      this.nextRareBounceAt = 0;
      this.remainingBounces = null;
      this.extraBounceAdder = null;
      this.extraBounceBonusCount = 0;
      this.bonusPauseToken++;
      this.time.timeScale = 1;
      this.clearBonusItems();
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
      this.applyMultiplierTheme("idle");
      this.updateBounceText();
      this.smokeLayer.removeAll(true);
    }

    spawnSmoke(x, y, count, color) {
      for (let i = 0; i < count; i++) {
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
      this.updateFenceLights(_time);
      this.updateCarIdleShake(_time);
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
        this.updateDummyCamera();
        return;
      }

      if (this.state !== "running") return;
      const factor = 1 + (cfg.gameplay.turboFactor - 1) * this.turboPower;
      this.speed += cfg.gameplay.acceleration * factor * (1 + this.speed * cfg.gameplay.speedProgression) * dt;
      this.visualSpeed = cfg.gameplay.roadBaseSpeed + this.speed * cfg.gameplay.roadSpeedScale;
      const speedRate = cfg.gameplay.multiplierBaseRate + this.speed * cfg.gameplay.multiplierSpeedRate;
      const multiplierEase = 1 + Math.sqrt(Math.max(0, this.multiplier)) * 0.026;
      this.multiplier = Math.min(cfg.gameplay.maxMultiplier, this.multiplier + speedRate * factor * multiplierEase * dt);
      this.hud.setMultiplier(this.getDisplayedMultiplier());
      this.updateBounceText();
      this.tryRareBounceProc(dt);

      const roadSpeed = this.visualSpeed * factor;
      const dx = roadSpeed * dt;
      if (this.car.x < cfg.gameplay.carCruiseX) {
        this.car.x = Math.min(cfg.gameplay.carCruiseX, this.car.x + dx);
      }
      const leverLift = Phaser.Math.Easing.Cubic.Out(this.turboPower);
      const lift = leverLift * 5.04;
      this.car.y = cfg.gameplay.roadY - 54 - lift;
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
      const patternWidth = this.getRoadTileWidth() * 3;
      this.roadOffset = Phaser.Math.Wrap(this.roadOffset + dx, 0, patternWidth);
      if (this.fenceTiles && this.fenceTiles.length) {
        const fenceWidth = this.getFenceTileWidth();
        this.fenceOffset = Phaser.Math.Wrap(this.fenceOffset + dx, 0, fenceWidth);
      }
      this.advanceLoopObjectLayers(dx);
      this.updateRoadTilesLayout();
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
      this.bounceBadge.setVisible(true).setAlpha(1).setScale(1.28);
      this.bounceBadgeIcon.setAlpha(0);
      this.bounceBadgeExtraIcon.setAlpha(1);
      this.bounceBadgeText.setColor("#ffffff");
      this.tweens.killTweensOf([this.bounceBadgeIcon, this.bounceBadgeExtraIcon, this.bounceBadgeText]);
      this.tweens.add({
        targets: this.bounceBadge,
        scaleX: 1,
        scaleY: 1,
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
        if (this.bounceBadgeText && this.bounceBadgeText.active) this.bounceBadgeText.setColor("#000000");
      });

      const label = this.add.text(x, y - 58, "+1 RARE BOUNCE", {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#d97cff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6
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
      this.multiplierText.setText(n <= 0 ? "0x" : n.toFixed(2) + "x");
      if (n > 0 && Math.abs(n - this.lastMultiplierDisplay) > 0.035 && this.time.now - this.lastMultiplierPulseAt > 150) {
        this.lastMultiplierDisplay = n;
        this.lastMultiplierPulseAt = this.time.now;
        this.tweens.killTweensOf([this.multiplierText, this.multiplierGlow]);
        this.multiplierText.setScale(1.08);
        this.multiplierGlow.setAlpha(0.28).setScale(1.08);
        this.tweens.add({
          targets: this.multiplierText,
          scaleX: 1,
          scaleY: 1,
          duration: 130,
          ease: "Sine.out"
        });
        this.tweens.add({
          targets: this.multiplierGlow,
          alpha: 0.12,
          scaleX: 1,
          scaleY: 1,
          duration: 180,
          ease: "Sine.out"
        });
      }
    }

    animateMultiplierFail() {
      if (!this.multiplierText) return;
      this.applyMultiplierTheme("fail");
      this.tweens.killTweensOf([this.multiplierText, this.multiplierGlow, this.multiplierPanel]);
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

  CT.GameScene = GameScene;
})();
