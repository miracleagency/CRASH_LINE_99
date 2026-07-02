(function () {
  const CT = window.CrashTest = window.CrashTest || {};
  const assetRoot = new URL("./assets/", window.location.href).href;

  CT.Config = {
    build: "2026-07-02-v0.1.146-ragdoll-cleanup",
    gameVersion: "v0.1.146",
    phaserVersion: "3.88.2",
    width: 720,
    height: 1280,
    startBalance: 1000,
    startBet: 1,
    betOptions: [1, 2, 5, 10, 50, 100],
    assets: {
      root: assetRoot,
      images: new URL("images/", assetRoot).href,
      audio: new URL("audio/", assetRoot).href
    },
    gameplay: {
      startMultiplier: 0,
      maxMultiplier: 1000,
      multiplierBaseRate: 0.18,
      multiplierSpeedRate: 0.00175,
      baseSpeed: 0,
      acceleration: 4.2,
      speedProgression: 0.008,
      turboFactor: 7,
      roadBaseSpeed: 430,
      roadSpeedScale: 0.24,
      carStartX: -150,
      carReadyX: 345,
      carCruiseX: 345,
      roadY: 858,
      roadArtY: 875,
      roadArtScale: 0.55,
      fenceArtY: 808,
      fenceArtScale: 0.5,
      fencePoleX: 0,
      fencePoleY: 750,
      fencePoleSpacing: 180,
      fencePoleScale: 0.5,
      fenceLightOffsetY: -26,
      fenceLightScale: 0.4,
      fenceLightIntensity: 0.79,
      fenceLightDelay: 0.085,
      fenceOverlayX: 0,
      fenceOverlayY: 778,
      fenceOverlayHeight: 0,
      fenceOverlaySpacing: 266,
      fenceOverlayJitterX: 59,
      fenceOverlayCount: 20,
      fenceOverlayChance: 0.8,
      fenceOverlayScaleMin: 0.27,
      fenceOverlayScaleMax: 0.62,
      fenceOverlayAlpha: 1,
      barrierX: 590,
      hitWallX: 570,
      hitWallY: 902,
      hitWallVisualOffsetX: 70,
      hitWallScale: 0.528,
      hitWallAlpha: 1,
      carArt: {
        root: { x: -28, y: 14, scale: 0.94 },
        body: { x: 27, y: -34, scale: 0.64 },
        rearWheel: { x: -87, y: 44, scale: 0.64 },
        frontWheel: { x: 170, y: 44, scale: 0.64 },
        wheelShadow: { x: 27, y: -34, scale: 0.64, alpha: 1 },
        turboFire: { x: -226, y: 32, scale: 0.8, alpha: 1 },
        turboFireTint: {
          preview: 0,
          orange: "#ff6a00",
          yellow: "#ffd33d",
          green: "#42ff62",
          blue: "#37caff",
          purple: "#b15cff"
        }
      },
      carVisualScale: 1.2,
      worldWidth: 24000,
      minBounces: 0,
      maxBounces: 10,
      bonusChance: 0.21,
      doubleBounceBonusChance: 0.018,
      launchDistance: 1280,
      launchHeight: 310,
      launchDuration: 820,
      bounceDistance: 1180,
      bounceHeight: 330
    },
    storage: {
      muted: "crashTestMuted"
    },
    colors: {
      bg: 0x071012,
      panel: 0x161a1e,
      panelStroke: 0xffffff,
      text: "#ffffff",
      accent: 0x37e5ff,
      gold: 0xffcf30,
      danger: "#ff6b6b",
      ok: "#63ff9f"
    }
  };

  CT.asset = function asset(path) {
    return new URL(String(path || "").replace(/^\/+/, ""), CT.Config.assets.root).href;
  };
})();
