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
      this.turboExhaustClock = 0;
      this.engineBreakAt = 0;
      this.roadOffset = 0;
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
    }

    create() {
      console.log("GAME TEXTURES:", {
        bounceIcon: this.textures.exists("bounceIcon"),
        bounceIconExtra: this.textures.exists("bounceIconExtra")
      });
      this.wallet = new CT.Wallet();
      this.cameras.main.setBounds(0, 0, CT.Config.gameplay.worldWidth, CT.Config.height);
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
      this.resetRunVisuals();
      this.hideBootLoader();
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
      this.roadLines = [];
      for (let i = 0; i < 8; i++) {
        const line = this.add.rectangle(i * 128 - 40, cfg.gameplay.roadY + 24, 68, 10, 0xffcf30, 0.88)
          .setOrigin(0.5)
          .setDepth(1)
          .setScrollFactor(0);
        this.roadLines.push(line);
      }

      this.barrier = this.add.container(cfg.gameplay.barrierX, cfg.gameplay.roadY - 36).setDepth(4).setVisible(false);
      this.barrier.add([
        this.add.rectangle(0, 0, 42, 132, 0xd7dde2, 1).setStrokeStyle(4, 0x6b747c, 1),
        this.add.rectangle(0, -42, 64, 18, 0xe13f35, 1).setAngle(-18),
        this.add.rectangle(0, 0, 64, 18, 0xe13f35, 1).setAngle(-18),
        this.add.rectangle(0, 42, 64, 18, 0xe13f35, 1).setAngle(-18)
      ]);

      this.smokeLayer = this.add.container(0, 0).setDepth(8);
      this.car = this.createCar();
      this.dummy = this.createDummy();
      this.car.add(this.dummy);
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
      this.applyMultiplierTheme("idle");
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
      const shadow = this.add.ellipse(4, 62, 224, 34, 0x000000, 0.32);
      const body = this.add.rectangle(0, 8, 220, 72, 0xb72420, 1).setStrokeStyle(5, 0x3b0d0b, 1);
      const hood = this.add.rectangle(68, -22, 84, 46, 0xd63d2d, 1).setStrokeStyle(4, 0x3b0d0b, 1);
      const stripe = this.add.rectangle(-40, 10, 124, 12, 0xffcf30, 1);
      const bumper = this.add.rectangle(124, 20, 18, 58, 0xbec8cf, 1);
      const wheelBack = this.add.circle(-70, 46, 30, 0x111111, 1).setStrokeStyle(7, 0x555555, 1);
      const wheelFront = this.add.circle(72, 46, 30, 0x111111, 1).setStrokeStyle(7, 0x555555, 1);
      const hubBack = this.add.circle(-70, 46, 12, 0xd7dde2, 1);
      const hubFront = this.add.circle(72, 46, 12, 0xd7dde2, 1);
      const engineGlow = this.add.circle(120, -4, 12, 0xff8a2a, 0.92).setBlendMode(Phaser.BlendModes.ADD);
      car.add([shadow, body, hood, stripe, bumper, wheelBack, wheelFront, hubBack, hubFront, engineGlow]);
      car.wheels = [wheelBack, wheelFront, hubBack, hubFront];
      car.engineGlow = engineGlow;
      return car;
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
      return true;
    }

    handleLeverPress() {
      if (this.state === "ready") this.startRun();
    }

    handleLeverRelease() {
      this.setTurboPower(0);
      if (this.state === "running") {
        this.cashOutCrash();
        return;
      }
    }

    pickEngineBreakAt() {
      if (this.safeMode) return Number.POSITIVE_INFINITY;
      if (this.round > 0 && this.round % 4 === 0 && Math.random() < 0.70) {
        return Phaser.Math.FloatBetween(10.2, 24);
      }

      const roll = Math.random();
      if (roll < 0.34) return Phaser.Math.FloatBetween(0.12, 0.95);
      if (roll < 0.68) return Phaser.Math.FloatBetween(1.02, 1.95);
      if (roll < 0.90) return Phaser.Math.FloatBetween(2.05, 6.5);
      return Phaser.Math.FloatBetween(9, 18);
    }

    setTurboPower(power) {
      const nextPower = this.state === "running" ? Phaser.Math.Clamp(Number(power || 0), 0, 1) : 0;
      const nextTurbo = nextPower > 0.03;
      if (Math.abs(this.turboPower - nextPower) < 0.005 && this.turbo === nextTurbo) return;
      this.turboPower = nextPower;
      this.turbo = nextTurbo;
      this.hud.setTurbo(this.turbo);
      this.car.engineGlow.setScale(1 + this.turboPower * 0.85);
      if (!this.turbo) this.turboExhaustClock = 0;
    }

    toggleSafeMode() {
      if (this.state !== "ready") return;
      this.safeMode = !this.safeMode;
      this.hud.setSafeMode(this.safeMode);
      this.hud.setResult(this.safeMode ? "ENGINE SAFE MODE" : "LAST RESULT --", this.safeMode ? CT.Config.colors.ok : "#93a4ad");
    }

    cashOutCrash() {
      if (this.state !== "running") return;
      this.setTurboPower(0);
      this.state = "crashing";
      const cfg = CT.Config;
      const W = CT.Config.width;
      const payout = this.wallet.currentBet * this.multiplier;
      this.pendingPayout = payout;
      this.bonusAdd = 0;
      this.clearBonusItems();
      this.hud.setLocked(true);
      this.hud.setResult(this.autoCrash ? "WALL HIT!" : "CRASH!", "#ffffff");
      this.barrier.setVisible(true);
      this.barrier.setPosition(W + 92, cfg.gameplay.roadY - 36).setAlpha(1).setScale(1);
      this.tweens.killTweensOf(this.car);
      this.tweens.killTweensOf(this.barrier);
      this.cameras.main.shake(360, 0.004);

      const roadMotion = { t: 0 };
      let lastRoadT = 0;
      this.tweens.add({
        targets: roadMotion,
        t: 1,
        duration: 430,
        ease: "Cubic.in",
        onUpdate: () => {
          const diff = roadMotion.t - lastRoadT;
          lastRoadT = roadMotion.t;
          this.advanceRoad(diff * 820);
        }
      });
      this.tweens.add({
        targets: this.barrier,
        x: cfg.gameplay.barrierX,
        duration: 430,
        ease: "Cubic.in",
        onComplete: () => this.playCrashImpact(payout)
      });
      this.tweens.add({
        targets: this.car,
        x: cfg.gameplay.barrierX - 126,
        duration: 430,
        ease: "Sine.in"
      });
    }

    playCrashImpact(payout) {
      this.cameras.main.shake(420, 0.022);
      this.impactFlash();
      this.spawnSmoke(this.car.x + 96, this.car.y - 10, 14, 0xffcf30);
      this.tweens.add({
        targets: this.car,
        x: this.car.x - 22,
        angle: -11,
        duration: 150,
        yoyo: true,
        ease: "Quad.out"
      });

      this.car.remove(this.dummy, false);
      this.children.add(this.dummy);
      this.dummy.setPosition(this.car.x - 22, this.car.y - 45).setDepth(9).setScale(1);
      this.tweens.add({
        targets: this.dummy,
        scaleX: 1.12,
        scaleY: 0.92,
        duration: 70,
        ease: "Quad.out",
        yoyo: true
      });
      this.state = "dummyFlight";
      this.flightRoadSpeed = Math.max(620, (this.visualSpeed || 280) * 1.18);
      this.playDummyFlight(payout);
    }

    impactFlash() {
      const flash = this.add.rectangle(
        this.cameras.main.scrollX + CT.Config.width / 2,
        CT.Config.height / 2,
        CT.Config.width,
        CT.Config.height,
        0xffffff,
        0.22
      ).setDepth(50);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 170,
        ease: "Quad.out",
        onComplete: () => flash.destroy()
      });
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
        ease: "Sine.out",
        onUpdate: () => {
          const t = flight.t;
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
      let index = 0;

      const next = () => {
        if (index >= count) {
          this.flightRoadSpeed = 0;
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
        const isLastBounce = index >= count;
        const roadSpeedAtArcStart = this.flightRoadSpeed;
        this.remainingBounces = Math.max(0, count - index);
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
            if (isLastBounce) {
              const brakeT = Phaser.Math.Clamp((u - 0.48) / 0.52, 0, 1);
              this.flightRoadSpeed = roadSpeedAtArcStart * Math.pow(1 - brakeT, 2.2);
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
        const t = i / Math.max(1, count - 1);
        const height = Math.max(120, firstHeight * (1 - t * 0.10));
        const startX = firstStartX + hopDistance * i;
        const endX = startX + hopDistance;
        const bonuses = this.createCurveBonuses(startX, endX, groundY, height, 10, i);
        plans.push({ startX, endX, height, bonuses });
      }
      return plans;
    }

    createCurveBonuses(startX, endX, groundY, height, slots, bounceIndex) {
      const cfg = CT.Config;
      const bonuses = [];
      const baseTier = Phaser.Math.Clamp(Number(bounceIndex || 0) / Math.max(1, cfg.gameplay.maxBounces - 1), 0, 1);
      const tier = Math.pow(baseTier, 0.62);
      const spawnChance = Phaser.Math.Clamp(cfg.gameplay.bonusChance - 0.05 + tier * 0.22, 0.14, 0.58);
      const arcDistance = Math.max(1, endX - startX);
      const cameraAhead = CT.Config.width * 0.56;
      const introT = Phaser.Math.Clamp(cameraAhead / arcDistance, 0.34, 0.44);
      const outroT = 0.96;
      for (let i = 0; i < slots; i++) {
        const slotT = slots <= 1 ? 0.5 : i / (slots - 1);
        const t = Phaser.Math.Linear(introT, outroT, slotT);
        if (Math.random() > spawnChance) continue;
        const x = Phaser.Math.Linear(startX, endX, t);
        const y = groundY - Math.sin(Math.PI * t) * height;
        const bonus = this.createBonusCoin(x, y, this.pickBonusMultiplier(tier));
        bonus.pathT = t;
        bonuses.push(bonus);
      }
      return bonuses;
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
        { value: 1, weight: 8 + 13 * t },
        { value: 2, weight: 2.5 + 18 * t },
        { value: 5, weight: 0.65 + 19 * highBias },
        { value: 10, weight: 0.16 + 15 * highBias },
        { value: 20, weight: 0.04 + 11 * highBias },
        { value: 100, weight: 0.008 + 5.8 * highBias },
        { value: 200, weight: 0.003 + 3.6 * highBias },
        { value: 500, weight: 0.0012 + 2.1 * highBias },
        { value: 1000, weight: 0.0005 + 1.25 * highBias },
        { value: 2000, weight: 0.0002 + 0.72 * highBias },
        { value: 3000, weight: 0.0001 + 0.45 * highBias },
        { value: 4000, weight: 0.00005 + 0.28 * highBias },
        { value: 5000, weight: 0.00002 + 0.18 * highBias }
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
      this.bonusAdd += bonus.bonusValue;
      this.hud.setMultiplier(this.getDisplayedMultiplier());
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
        duration: 120,
        yoyo: true,
        repeat: 2,
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
        this.time.delayedCall(420, () => this.returnCameraToStart());
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
        duration: 950,
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
              this.time.delayedCall(480, () => {
                this.tweens.add({
                  targets: box,
                  alpha: 0,
                  scaleX: 0.86,
                  scaleY: 0.86,
                  duration: 220,
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
      this.state = "failed";
      this.turbo = false;
      this.turboPower = 0;
      this.turboExhaustClock = 0;
      this.hud.setTurbo(false);
      this.hud.setLocked(true);
      this.setPageControlsDimmed(false);
      this.tweens.killTweensOf(this.car);
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
        angle: 3,
        duration: 360,
        ease: "Cubic.out",
        onComplete: () => {
          this.hud.setResult("LAST LOSS -$" + this.wallet.format(this.wallet.currentBet), CT.Config.colors.danger);
          this.hud.floatText(CT.Config.width / 2, 350, "-$" + this.wallet.format(this.wallet.currentBet), CT.Config.colors.danger, 42);
          this.time.delayedCall(820, () => this.returnCameraToStart());
        }
      });
    }

    returnCameraToStart() {
      this.state = "returning";
      this.turbo = false;
      this.turboPower = 0;
      this.turboExhaustClock = 0;
      this.setPageControlsDimmed(false);
      this.hud.setTurbo(false);
      this.resetRunVisuals(false);
      this.tweens.add({
        targets: this.cameras.main,
        scrollX: 0,
        duration: Math.max(420, Math.min(1050, this.cameras.main.scrollX * 0.9)),
        ease: "Cubic.inOut",
        onComplete: () => {
          this.state = "ready";
          this.hud.setRunning(false);
        }
      });
    }

    resetRunVisuals(launchPosition) {
      const cfg = CT.Config;
      this.tweens.killTweensOf([this.car, this.dummy]);
      this.barrier.setVisible(false);
      this.barrier.setAlpha(1).setScale(1);
      this.car.setPosition(launchPosition ? cfg.gameplay.carStartX : cfg.gameplay.carReadyX, cfg.gameplay.roadY - 54).setAngle(0).setAlpha(1);
      this.dummy.setPosition(-22, -45).setAngle(0).setScale(1).setDepth(0);
      if (this.dummy.parentContainer !== this.car) {
        this.car.add(this.dummy);
      }
      this.multiplier = cfg.gameplay.startMultiplier;
      this.speed = 0;
      this.visualSpeed = 0;
      this.turbo = false;
      this.turboPower = 0;
      this.turboExhaustClock = 0;
      this.autoCrash = false;
      this.bonusAdd = 0;
      this.rareBounceCount = 0;
      this.nextRareBounceAt = 0;
      this.remainingBounces = null;
      this.bonusPauseToken++;
      this.time.timeScale = 1;
      this.clearBonusItems();
      if (this.hud) {
        this.hud.setMultiplier(this.multiplier);
        this.hud.setTurbo(false);
      }
      if (this.car && this.car.engineGlow) this.car.engineGlow.setScale(1);
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

    spawnTurboExhaust(count) {
      const power = Phaser.Math.Clamp(this.turboPower, 0, 1);
      const colors = this.getTurboParticleColors(power);
      const travel = 92 + power * 330;
      const spread = 7 + power * 24;
      const amount = Phaser.Math.Clamp(Math.floor(count || 1), 1, 2);
      for (let i = 0; i < amount; i++) {
        const color = colors[Phaser.Math.Between(0, colors.length - 1)];
        const puff = this.add.circle(
          this.car.x - 118 + Phaser.Math.Between(-8, 10),
          this.car.y + 10 + Phaser.Math.Between(-10, 16),
          Phaser.Math.Between(5, 11 + Math.round(power * 6)),
          color,
          0.2 + power * 0.2
        ).setDepth(8).setBlendMode(power > 0.68 ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
        this.smokeLayer.add(puff);
        this.tweens.add({
          targets: puff,
          x: puff.x - Phaser.Math.Between(Math.round(travel * 0.82), Math.round(travel * 1.25)),
          y: puff.y + Phaser.Math.Between(-Math.round(spread), Math.round(spread * 0.55)),
          scaleX: Phaser.Math.FloatBetween(1.45, 2.35 + power * 2.4),
          scaleY: Phaser.Math.FloatBetween(0.85, 1.45 + power * 0.95),
          alpha: 0,
          duration: Phaser.Math.Between(Math.round(820 - power * 120), Math.round(1160 - power * 140)),
          ease: "Cubic.out",
          onComplete: () => puff.destroy()
        });
      }
    }

    getTurboParticleColors(power) {
      if (power >= 0.98) return [0xb45cff, 0xd94dff, 0x8a3dff, 0x37e5ff];
      if (power >= 0.70) return [0x37e5ff, 0x7cf7ff, 0xff433f, 0xb45cff];
      if (power >= 0.50) return [0xff433f, 0xff7b2f, 0xffcf30];
      if (power >= 0.20) return [0xffcf30, 0xffe86b, 0xb8b8b8];
      return [0x9b9b9b, 0xb8b8b8, 0xd0d0d0];
    }

    updateTurboExhaust(delta) {
      if (this.turboPower <= 0.03) {
        this.turboExhaustClock = 0;
        return;
      }

      const interval = Phaser.Math.Linear(185, 92, this.turboPower);
      this.turboExhaustClock += delta;
      let spawned = 0;
      while (this.turboExhaustClock >= interval && spawned < 3) {
        this.turboExhaustClock -= interval;
        this.spawnTurboExhaust(1);
        spawned += 1;
      }
      if (spawned >= 3) this.turboExhaustClock = 0;
    }

    update(_time, delta) {
      const cfg = CT.Config;
      const dt = delta / 1000;
      if (this.state === "dummyFlight") {
        if (this.flightRoadSpeed > 0.5) {
          this.flightRoadSpeed *= Math.pow(0.996, delta / 16.6667);
          this.advanceRoad(this.flightRoadSpeed * 1.35 * dt);
        } else {
          this.flightRoadSpeed = 0;
        }
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
      const lift = leverLift * 24;
      this.car.y = cfg.gameplay.roadY - 54 - lift + Math.sin(this.time.now * 0.035) * (2.2 + this.turboPower * 1.9);
      this.car.angle = this.turboPower > 0.03 ? -Phaser.Math.Linear(1.2, 17, leverLift) : 0;
      this.car.wheels.forEach((wheel) => { wheel.angle += dx * 2.65; });
      this.advanceRoad(dx);
      this.updateTurboExhaust(delta);
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
      this.roadOffset = (this.roadOffset + dx) % 128;
      this.roadLines.forEach((line, i) => {
        line.x = i * 128 - 40 - this.roadOffset;
        if (line.x < -80) line.x += 1024;
      });
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
