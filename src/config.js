(function () {
  const CT = window.CrashTest = window.CrashTest || {};
  const assetRoot = new URL("./assets/", window.location.href).href;

  CT.Config = {
    build: "2026-06-16-game-version",
    gameVersion: "v0.1.0",
    phaserVersion: "3.88.2",
    width: 720,
    height: 1280,
    startBalance: 1000,
    startBet: 1,
    betOptions: [1, 2, 5, 10, 50, 100],
    assets: {
      root: assetRoot,
      images: new URL("images/", assetRoot).href
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
      roadBaseSpeed: 260,
      roadSpeedScale: 2.35,
      carStartX: -150,
      carReadyX: 210,
      carCruiseX: 345,
      roadY: 858,
      barrierX: 590,
      worldWidth: 24000,
      minBounces: 0,
      maxBounces: 10,
      bonusChance: 0.24,
      launchDistance: 1280,
      launchHeight: 310,
      launchDuration: 760,
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
