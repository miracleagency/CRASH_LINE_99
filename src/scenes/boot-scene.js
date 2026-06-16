(function () {
  const CT = window.CrashTest = window.CrashTest || {};

  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    preload() {
      const iconUrl = CT.asset("images/icon_for_bounces.png");
      const extraUrl = CT.asset("images/icon_for_bounces_extra.png");

      console.log("ASSET ROOT:", CT.Config.assets.root);
      console.log("IMAGE ROOT:", CT.Config.assets.images);
      console.log("LOAD bounceIcon:", iconUrl);
      console.log("LOAD bounceIconExtra:", extraUrl);

      this.load.on("filecomplete-image-bounceIcon", () => {
        console.log("LOADED bounceIcon", this.textures.exists("bounceIcon"));
      });

      this.load.on("filecomplete-image-bounceIconExtra", () => {
        console.log("LOADED bounceIconExtra", this.textures.exists("bounceIconExtra"));
      });

      this.load.on("loaderror", (file) => {
        console.warn("FAILED ASSET:", file.key, file.src);
      });

      this.load.image("bounceIcon", iconUrl);
      this.load.image("bounceIconExtra", extraUrl);
    }

    create() {
      console.log("BOOT DONE:", {
        bounceIcon: this.textures.exists("bounceIcon"),
        bounceIconExtra: this.textures.exists("bounceIconExtra")
      });
      this.scene.start("GameScene");
    }
  }

  CT.BootScene = BootScene;
})();
