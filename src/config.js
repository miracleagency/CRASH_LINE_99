(function () {
  const CT = window.CrashTest = window.CrashTest || {};

  CT.Config = {
    build: "2026-06-15-start",
    phaserVersion: "3.88.2",
    width: 720,
    height: 1280,
    startBalance: 1000,
    startBet: 1,
    betOptions: [1, 2, 5, 10, 50, 100],
    gameplay: {
      startMultiplier: 0,
      maxMultiplier: 1000,
      multiplierBaseRate: 0.22,
      multiplierSpeedRate: 0.0022,
      baseSpeed: 0,
      acceleration: 4.2,
      speedProgression: 0.008,
      turboFactor: 5,
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
})();
