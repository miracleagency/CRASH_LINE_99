(function () {
  const CT = window.CrashTest = window.CrashTest || {};
  const cfg = CT.Config;

  if (window.__game) {
    try { window.__game.destroy(true); } catch (e) {}
  }

  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const soundBtn = document.getElementById("soundBtn");
  const controlBtn = document.getElementById("controlBtn");
  const controlUi = document.getElementById("control-ui");
  const controlsOpenKey = (cfg.storage && cfg.storage.controlsOpen) || "crashLineControlUiOpen";
  let soundMuted = localStorage.getItem(cfg.storage.muted) === "1";
  let controlsOpen = false;

  function hideBootLoader() {
    const loader = document.getElementById("bootLoader");
    if (!loader) return;
    loader.classList.add("is-hidden");
    window.setTimeout(() => {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 320);
  }

  function showBootError(message) {
    hideBootLoader();
    const div = document.createElement("div");
    div.className = "boot-error";
    div.textContent = message;
    document.body.appendChild(div);
  }

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function refreshGameScale() {
    window.setTimeout(() => {
      if (window.__game && window.__game.scale) {
        window.__game.scale.refresh();
      }
    }, 120);
  }

  function updateFullscreenButton() {
    if (!fullscreenBtn) return;
    fullscreenBtn.classList.toggle("is-hidden", isFullscreen());
  }

  function applySoundMute() {
    if (window.__game && window.__game.sound) {
      window.__game.sound.mute = soundMuted;
    }

    if (soundBtn) {
      soundBtn.innerHTML = soundMuted ? "&#215;" : "&#9835;";
      soundBtn.setAttribute("aria-label", soundMuted ? "Sound off" : "Sound on");
    }
  }

  function applyControlUiVisibility() {
    if (controlUi) {
      controlUi.classList.toggle("is-hidden", !controlsOpen);
    }

    if (controlBtn) {
      controlBtn.classList.toggle("is-active", controlsOpen);
      controlBtn.setAttribute("aria-label", controlsOpen ? "Hide controls" : "Show controls");
    }
  }

  window.CrashTestSetPageControlsDim = function (dimmed) {
    document.body.classList.toggle("controls-dimmed", !!dimmed);
  };

  function bindPageControls() {
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", () => {
        const root = document.documentElement;
        const request = root.requestFullscreen || root.webkitRequestFullscreen;

        if (!request) return;
        const result = request.call(root);
        if (result && result.then) {
          result.then(() => {
            if (screen.orientation && screen.orientation.lock) {
              screen.orientation.lock("portrait").catch(() => {});
            }
            updateFullscreenButton();
            refreshGameScale();
          }).catch(() => {});
        } else {
          updateFullscreenButton();
          refreshGameScale();
        }
      });

      document.addEventListener("fullscreenchange", () => {
        updateFullscreenButton();
        refreshGameScale();
      });
      document.addEventListener("webkitfullscreenchange", () => {
        updateFullscreenButton();
        refreshGameScale();
      });
      updateFullscreenButton();
    }

    if (soundBtn) {
      soundBtn.addEventListener("click", () => {
        soundMuted = !soundMuted;
        localStorage.setItem(cfg.storage.muted, soundMuted ? "1" : "0");
        applySoundMute();
      });
      applySoundMute();
    }

    if (controlBtn) {
      controlBtn.addEventListener("click", () => {
        controlsOpen = !controlsOpen;
        localStorage.setItem(controlsOpenKey, controlsOpen ? "1" : "0");
        applyControlUiVisibility();
      });
      applyControlUiVisibility();
    }
  }

  function waitForGameFont() {
    if (!document.fonts || !cfg.fontFamily) return Promise.resolve();
    return document.fonts.load("32px " + cfg.fontFamily)
      .then(() => document.fonts.ready)
      .catch(() => {});
  }

  function startPhaserGame() {
    window.__game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "gameWrap",
      width: cfg.width,
      height: cfg.height,
      backgroundColor: "#071012",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.NO_CENTER
      },
      physics: {
        default: "matter",
        arcade: { gravity: { y: 0 }, debug: false },
        matter: {
          gravity: { y: 0.9 },
          debug: false
        }
      },
      scene: [CT.BootScene, CT.GameScene],
      callbacks: {
        postBoot: applySoundMute
      }
    });
  }

  function boot() {
    if (!window.Phaser || Phaser.VERSION !== cfg.phaserVersion) {
      showBootError("Phaser 3.88.2 failed to load. Current version: " + (window.Phaser && Phaser.VERSION ? Phaser.VERSION : "none"));
      return;
    }

    bindPageControls();

    waitForGameFont().then(startPhaserGame);
  }

  boot();
})();
