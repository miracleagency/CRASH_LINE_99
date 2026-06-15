(function () {
  const CT = window.CrashTest = window.CrashTest || {};

  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    create() {
      this.scene.start("GameScene");
    }
  }

  CT.BootScene = BootScene;
})();
