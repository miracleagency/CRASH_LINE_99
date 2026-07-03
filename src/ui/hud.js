(function () {
  const CT = window.CrashTest = window.CrashTest || {};

  class Hud {
    constructor(scene, wallet, callbacks) {
      this.scene = scene;
      this.wallet = wallet;
      this.callbacks = callbacks || {};
      this.betPopup = null;
      this.create();
      this.update();
    }

    create() {
      const cfg = CT.Config;
      const W = cfg.width;
      const H = cfg.height;

      this.top = this.scene.add.container(0, 0).setDepth(10);
      this.top.setScrollFactor(0);
      const title = this.scene.add.text(W / 2, 25, "CRASHLINE 99", {
        fontFamily: "Arial",
        fontSize: "28px",
        color: cfg.colors.text,
        fontStyle: "bold"
      }).setOrigin(0.5);
      const gameVersion = this.scene.add.text(W / 2, 58, "GAME " + cfg.gameVersion + " / " + cfg.build, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#6f8088",
        fontStyle: "bold"
      }).setOrigin(0.5);
      this.resultText = this.scene.add.text(W / 2, 104, "LAST RESULT --", {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#93a4ad",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);
      this.top.add([title, gameVersion, this.resultText]);

      this.balanceText = this.scene.add.text(18, H - 60, "", {
        fontFamily: "Arial",
        fontSize: "25px",
        color: cfg.colors.text,
        fontStyle: "bold"
      }).setDepth(10).setScrollFactor(0);

      this.betButton = this.scene.add.container(W - 108, H - 50).setDepth(10);
      this.betButton.setScrollFactor(0);
      const betBg = this.scene.add.rectangle(0, 0, 148, 54, 0x2f2f2f, 0.92)
        .setStrokeStyle(3, cfg.colors.panelStroke, 0.75);
      this.betText = this.scene.add.text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: cfg.colors.text,
        fontStyle: "bold"
      }).setOrigin(0.5);
      const betHit = this.scene.add.zone(0, 0, 148, 54).setInteractive({ useHandCursor: true });
      betHit.on("pointerdown", () => this.showBetPopup());
      this.betButton.add([betBg, this.betText, betHit]);
      this.betButton.hit = betHit;

      this.createLever(W / 2, H - 154);

      this.safeButton = this.createCommandButton(W - 88, 184, 128, 56, 0x2f2f2f, "SAFE", "#ffffff", () => {
        if (this.callbacks.onSafeToggle) this.callbacks.onSafeToggle();
      });

      this.createBetPopup();
      this.setRunning(false);
    }

    createLever(x, y) {
      const cfg = CT.Config;
      this.leverNeutralX = -188;
      this.leverMaxX = 198;
      this.leverPower = 0;
      this.leverDragging = false;
      this.leverLocked = false;

      const lever = this.scene.add.container(x, y).setDepth(10);
      lever.setScrollFactor(0);
      const bg = this.scene.add.rectangle(0, 0, 586, 150, 0x11171a, 0.96)
        .setStrokeStyle(4, 0xffffff, 0.2);
      const rail = this.scene.add.rectangle(0, 28, 430, 18, 0x2c363a, 1)
        .setStrokeStyle(2, 0xffffff, 0.18);
      this.turboFill = this.scene.add.rectangle(this.leverNeutralX, 28, 1, 14, cfg.colors.accent, 0.78)
        .setOrigin(0, 0.5);
      const neutralMark = this.scene.add.rectangle(this.leverNeutralX, 28, 12, 54, cfg.colors.gold, 0.8);
      const releaseLabel = this.scene.add.text(this.leverNeutralX + 170, -42, "RELEASE = CRASH", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ff6b6b",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);

      this.turboLight = this.scene.add.container(158, -44);
      this.turboGlow = this.scene.add.circle(0, 0, 43, cfg.colors.accent, 0.08).setBlendMode(Phaser.BlendModes.ADD);
      this.turboLamp = this.scene.add.circle(0, 0, 20, 0x123238, 1).setStrokeStyle(3, 0xffffff, 0.24);
      this.turboLabel = this.scene.add.text(0, 34, "TURBO", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#3a7880",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);
      this.turboLight.add([this.turboGlow, this.turboLamp, this.turboLabel]);

      this.leverKnob = this.scene.add.container(this.leverNeutralX, 28);
      this.leverStem = this.scene.add.rectangle(0, -20, 24, 72, 0xd7dde2, 1)
        .setStrokeStyle(4, 0x111111, 0.8);
      this.leverHandleGlow = this.scene.add.circle(0, -62, 45, cfg.colors.gold, 0.14).setBlendMode(Phaser.BlendModes.ADD);
      this.leverHandle = this.scene.add.circle(0, -62, 38, cfg.colors.gold, 1)
        .setStrokeStyle(5, 0xffffff, 0.9);
      this.leverHandleText = this.scene.add.text(0, -62, "GO", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#171717",
        fontStyle: "bold"
      }).setOrigin(0.5);
      this.leverKnob.add([this.leverStem, this.leverHandleGlow, this.leverHandle, this.leverHandleText]);

      const hit = this.scene.add.zone(0, 0, 586, 170).setInteractive({ useHandCursor: true });
      hit.on("pointerdown", (pointer) => this.startLeverDrag(pointer));
      this.scene.input.on("pointermove", (pointer) => {
        if (this.leverDragging) this.updateLeverDrag(pointer);
      });
      this.scene.input.on("pointerup", () => {
        if (this.leverDragging) this.releaseLever();
      });
      hit.on("pointerupoutside", () => {
        if (this.leverDragging) this.releaseLever();
      });

      lever.add([bg, rail, this.turboFill, neutralMark, releaseLabel, this.turboLight, this.leverKnob, hit]);
      lever.hit = hit;
      this.lever = lever;
      this.setLeverPower(0, true);
    }

    startLeverDrag(pointer) {
      if (this.leverLocked) return;
      this.leverDragging = true;
      if (this.callbacks.onLeverPress) this.callbacks.onLeverPress();
      this.scene.tweens.killTweensOf(this.leverKnob);
      this.leverKnob.setScale(1.06);
      this.updateLeverDrag(pointer);
    }

    updateLeverDrag(pointer) {
      const localX = Phaser.Math.Clamp(pointer.x - this.lever.x, this.leverNeutralX, this.leverMaxX);
      this.leverKnob.x = localX;
      const power = (localX - this.leverNeutralX) / (this.leverMaxX - this.leverNeutralX);
      this.setLeverPower(power);
    }

    releaseLever() {
      this.leverDragging = false;
      if (this.callbacks.onLeverPower) this.callbacks.onLeverPower(0);
      if (this.callbacks.onLeverRelease) this.callbacks.onLeverRelease(this.leverPower);
      this.animateLeverCenter();
    }

    animateLeverCenter() {
      this.setLeverPower(0, true);
      this.scene.tweens.killTweensOf(this.leverKnob);
      this.scene.tweens.add({
        targets: this.leverKnob,
        x: this.leverNeutralX,
        scaleX: 1,
        scaleY: 1,
        duration: 170,
        ease: "Back.out"
      });
    }

    setLeverPower(power, silent) {
      const value = Phaser.Math.Clamp(Number(power || 0), 0, 1);
      if (Math.abs(this.leverPower - value) < 0.005 && !silent) return;
      this.leverPower = value;
      this.turboFill.width = Math.max(1, (this.leverMaxX - this.leverNeutralX) * value);
      this.turboGlow.setAlpha(0.08 + value * 0.46);
      this.turboLamp.setFillStyle(value > 0.03 ? 0x37e5ff : 0x123238, 1);
      this.turboLabel.setColor(value > 0.03 ? "#baf7ff" : "#3a7880");
      this.turboLabel.setText(value > 0.03 ? "TURBO " + Math.round(value * 100) + "%" : "TURBO");
      this.leverHandleGlow.setAlpha(0.14 + value * 0.34);
      this.leverHandle.setFillStyle(value > 0.03 ? CT.Config.colors.accent : CT.Config.colors.gold, 1);
      this.leverHandleText.setColor("#171717");
      this.leverHandleText.setText(value > 0.03 ? Math.round(value * 100) + "%" : "GO");
      if (!silent && this.callbacks.onLeverPower) this.callbacks.onLeverPower(value);
    }

    createCommandButton(x, y, width, height, color, label, textColor, onClick, hold) {
      const button = this.scene.add.container(x, y).setDepth(10);
      button.setScrollFactor(0);
      const bg = this.scene.add.rectangle(0, 0, width, height, color, 1)
        .setStrokeStyle(5, 0xffffff, 0.88);
      const text = this.scene.add.text(0, 0, label, {
        fontFamily: "Arial",
        fontSize: label.length > 5 ? "30px" : "34px",
        color: textColor,
        fontStyle: "bold"
      }).setOrigin(0.5);
      const hit = this.scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
      const releaseHold = () => {
        this.releaseButton(button);
        if (hold && hold.onUp) hold.onUp();
      };
      hit.on("pointerdown", () => {
        this.pressButton(button, 0.92);
        if (hold && hold.onDown) hold.onDown();
      });
      hit.on("pointerup", () => {
        this.releaseButton(button);
        if (hold && hold.onUp) hold.onUp();
        else if (onClick) onClick();
      });
      hit.on("pointerout", releaseHold);
      hit.on("pointerupoutside", releaseHold);
      button.add([bg, text, hit]);
      button.bg = bg;
      button.label = text;
      button.hit = hit;
      return button;
    }

    update() {
      this.balanceText.setText("BALANCE $" + this.wallet.format(this.wallet.balance));
      this.betText.setText("BET $" + this.wallet.format(this.wallet.currentBet));
    }

    setMultiplier(value) {
      if (this.callbacks.onMultiplierDisplay) {
        this.callbacks.onMultiplierDisplay(Number(value || 0));
      }
    }

    setResult(text, color) {
      this.resultText.setText(text || "LAST RESULT --");
      this.resultText.setColor(color || "#93a4ad");
    }

    setRunning(running) {
      this.lever.setVisible(true);
      this.leverLocked = false;
      this.safeButton.setVisible(!running);
      this.betButton.setAlpha(running ? 0.5 : 1);
      if (running) this.betButton.hit.disableInteractive();
      else this.betButton.hit.setInteractive({ useHandCursor: true });
      if (running) this.hideBetPopup();
    }

    setLocked(locked) {
      if (!locked) {
        this.setRunning(false);
        return;
      }
      this.lever.setVisible(false);
      this.leverLocked = true;
      this.leverDragging = false;
      this.animateLeverCenter();
      this.safeButton.setVisible(false);
      this.betButton.setAlpha(0.5);
      this.betButton.hit.disableInteractive();
      this.hideBetPopup();
    }

    setTurbo(enabled) {
      if (!this.leverDragging) this.setLeverPower(enabled ? 1 : 0);
    }

    setSafeMode(enabled) {
      this.safeButton.bg.setFillStyle(enabled ? 0x7cff55 : 0x2f2f2f, 1);
      this.safeButton.label.setText(enabled ? "SAFE ON" : "SAFE");
      this.safeButton.label.setFontSize(enabled ? "20px" : "24px");
      this.safeButton.label.setColor(enabled ? "#071012" : "#ffffff");
    }

    pressButton(target, scale) {
      this.scene.tweens.killTweensOf(target);
      this.scene.tweens.add({
        targets: target,
        scaleX: scale,
        scaleY: scale,
        duration: 70,
        ease: "Quad.out"
      });
    }

    releaseButton(target) {
      this.scene.tweens.killTweensOf(target);
      this.scene.tweens.add({
        targets: target,
        scaleX: 1,
        scaleY: 1,
        duration: 130,
        ease: "Back.out"
      });
    }

    createBetPopup() {
      const cfg = CT.Config;
      const W = cfg.width;
      const H = cfg.height;
      this.betPopup = this.scene.add.container(W / 2, H / 2).setDepth(40).setVisible(false);
      this.betPopup.setScrollFactor(0);
      const shade = this.scene.add.rectangle(0, 0, W, H, 0x000000, 0.55).setInteractive();
      const panel = this.scene.add.rectangle(0, 0, 420, 420, 0x242424, 0.98)
        .setStrokeStyle(4, cfg.colors.panelStroke, 0.8);
      const title = this.scene.add.text(0, -166, "BET", {
        fontFamily: "Arial",
        fontSize: "38px",
        color: cfg.colors.text,
        fontStyle: "bold"
      }).setOrigin(0.5);
      this.betPopup.add([shade, panel, title]);

      this.wallet.betOptions.forEach((value, i) => {
        const x = (i % 2 === 0) ? -104 : 104;
        const y = -84 + Math.floor(i / 2) * 98;
        const opt = this.scene.add.container(x, y);
        const active = value === this.wallet.currentBet;
        const bg = this.scene.add.rectangle(0, 0, 150, 70, active ? cfg.colors.accent : 0xc89a22, 1)
          .setStrokeStyle(3, cfg.colors.panelStroke, 0.95);
        const txt = this.scene.add.text(0, 0, String(value), {
          fontFamily: "Arial",
          fontSize: "32px",
          color: cfg.colors.text,
          fontStyle: "bold"
        }).setOrigin(0.5);
        const hit = this.scene.add.zone(0, 0, 150, 70).setInteractive({ useHandCursor: true });
        hit.on("pointerdown", () => {
          this.wallet.setBet(value);
          this.update();
          this.hideBetPopup();
        });
        opt.add([bg, txt, hit]);
        this.betPopup.add(opt);
      });

      shade.on("pointerdown", () => this.hideBetPopup());
    }

    showBetPopup() {
      if (this.betButton.alpha < 1) return;
      this.betPopup.setVisible(true).setAlpha(0);
      this.scene.tweens.add({ targets: this.betPopup, alpha: 1, duration: 120, ease: "Quad.out" });
    }

    hideBetPopup() {
      if (this.betPopup) this.betPopup.setVisible(false);
    }

    floatText(x, y, text, color, size) {
      const label = this.scene.add.text(x, y, text, {
        fontFamily: "Arial",
        fontSize: (size || 30) + "px",
        color: color || CT.Config.colors.text,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 5
      }).setOrigin(0.5).setDepth(30).setScrollFactor(0);

      this.scene.tweens.add({
        targets: label,
        y: y - 54,
        alpha: 0,
        duration: 820,
        ease: "Cubic.easeOut",
        onComplete: () => label.destroy()
      });
    }
  }

  CT.Hud = Hud;
})();
