(function () {
  const CT = window.CrashTest = window.CrashTest || {};

  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    preload() {
      const iconUrl = CT.asset("images/icon_for_bounces.png");
      const extraUrl = CT.asset("images/icon_for_bounces_extra.png");
      const playButtonUrl = CT.asset("images/play button.png");
      const audio = {
        mainTrack: CT.asset("audio/main_track_loop.mp3"),
        bonusUp: CT.asset("audio/bonus up.mp3"),
        carCrash: CT.asset("audio/car crash.mp3"),
        carEngineFail: CT.asset("audio/car_engin_fail.mp3"),
        carEngineStart: CT.asset("audio/car_engin_start.mp3"),
        carEngineLoop: CT.asset("audio/car_engin_loop.mp3")
      };

      console.log("ASSET ROOT:", CT.Config.assets.root);
      console.log("IMAGE ROOT:", CT.Config.assets.images);
      console.log("LOAD bounceIcon:", iconUrl);
      console.log("LOAD bounceIconExtra:", extraUrl);
      console.log("LOAD playButton:", playButtonUrl);

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
      this.load.image("playButton", playButtonUrl);
      Object.keys(audio).forEach((key) => {
        this.load.audio(key, audio[key]);
      });
    }

    create() {
      console.log("BOOT DONE:", {
        bounceIcon: this.textures.exists("bounceIcon"),
        bounceIconExtra: this.textures.exists("bounceIconExtra"),
        playButton: this.textures.exists("playButton")
      });
      this.scene.start("GameScene");
    }
  }

  CT.BootScene = BootScene;
})();
