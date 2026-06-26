(function () {
  const CT = window.CrashTest = window.CrashTest || {};

  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    preload() {
      const iconUrl = CT.asset("images/icon_for_bounces.png");
      const extraUrl = CT.asset("images/icon_for_bounces_extra.png");
      const doubleBounceUrl = CT.asset("images/double_bounce_coin_bonus.png");
      const hitWallUrl = CT.asset("images/HIT_WALL.png");
      const roadLoopUrls = [
        CT.asset("images/ROAD LOOP_1.png"),
        CT.asset("images/ROAD LOOP_2.png"),
        CT.asset("images/ROAD LOOP_3.png")
      ];
      const roadFenceUrl = CT.asset("images/ROAD_bg1_3.png");
      const fencePoleUrl = CT.asset("images/stolb_lamp_1.png");
      const fenceLightUrl = CT.asset("images/yelow_light_1.png");
      const carBodyUrl = CT.asset("images/car_body.png");
      const wheelShadowUrl = CT.asset("images/shadow_for_wheels.png");
      const carGroundShadowUrl = CT.asset("images/shadow_under_car_wheels.png");
      const wheelUrls = [1, 2, 3, 4, 5].map((index) => CT.asset("images/wheel_seq/wheel_" + index + ".png"));
      const turboFireUrls = [1, 2, 3, 4, 5, 6, 7, 8].map((index) => CT.asset("images/turbo_fire_seq/turbo_fire_" + index + ".png"));
      const roadBgOverlayUrls = [
        CT.asset("images/ROAD_bg_overlays/ROAD_bg_overlay_1.png"),
        CT.asset("images/ROAD_bg_overlays/ROAD_bg_overlay_2.png"),
        CT.asset("images/ROAD_bg_overlays/ROAD_bg_overlay_3.png"),
        CT.asset("images/ROAD_bg_overlays/ROAD_bg_overlay_4.png"),
        CT.asset("images/ROAD_bg_overlays/ROAD_bg_overlay_5.png")
      ];
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
      console.log("LOAD doubleBounceCoin:", doubleBounceUrl);
      console.log("LOAD hitWall:", hitWallUrl);
      console.log("LOAD roadLoops:", roadLoopUrls);
      console.log("LOAD roadFence:", roadFenceUrl);
      console.log("LOAD fencePole:", fencePoleUrl);
      console.log("LOAD fenceLight:", fenceLightUrl);
      console.log("LOAD carBody:", carBodyUrl);
      console.log("LOAD wheelShadow:", wheelShadowUrl);
      console.log("LOAD carGroundShadow:", carGroundShadowUrl);
      console.log("LOAD wheels:", wheelUrls);
      console.log("LOAD turboFire:", turboFireUrls);
      console.log("LOAD roadBgOverlays:", roadBgOverlayUrls);

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
      this.load.image("doubleBounceCoin", doubleBounceUrl);
      this.load.image("hitWall", hitWallUrl);
      roadLoopUrls.forEach((url, index) => {
        this.load.image("roadLoop" + (index + 1), url);
      });
      this.load.image("roadFence", roadFenceUrl);
      this.load.image("fencePole", fencePoleUrl);
      this.load.image("fenceLight", fenceLightUrl);
      this.load.image("carBody", carBodyUrl);
      this.load.image("wheelShadow", wheelShadowUrl);
      this.load.image("carGroundShadow", carGroundShadowUrl);
      wheelUrls.forEach((url, index) => {
        this.load.image("wheel" + (index + 1), url);
      });
      turboFireUrls.forEach((url, index) => {
        this.load.image("turboFire" + (index + 1), url);
      });
      roadBgOverlayUrls.forEach((url, index) => {
        this.load.image("roadBgOverlay" + (index + 1), url);
      });
      Object.keys(audio).forEach((key) => {
        this.load.audio(key, audio[key]);
      });
    }

    create() {
      console.log("BOOT DONE:", {
        bounceIcon: this.textures.exists("bounceIcon"),
        bounceIconExtra: this.textures.exists("bounceIconExtra"),
        doubleBounceCoin: this.textures.exists("doubleBounceCoin"),
        hitWall: this.textures.exists("hitWall"),
        roadLoop1: this.textures.exists("roadLoop1"),
        roadLoop2: this.textures.exists("roadLoop2"),
        roadLoop3: this.textures.exists("roadLoop3"),
        roadFence: this.textures.exists("roadFence"),
        fencePole: this.textures.exists("fencePole"),
        fenceLight: this.textures.exists("fenceLight"),
        carBody: this.textures.exists("carBody"),
        wheelShadow: this.textures.exists("wheelShadow"),
        carGroundShadow: this.textures.exists("carGroundShadow"),
        wheel1: this.textures.exists("wheel1"),
        turboFire1: this.textures.exists("turboFire1"),
        roadBgOverlay1: this.textures.exists("roadBgOverlay1"),
        roadBgOverlay2: this.textures.exists("roadBgOverlay2"),
        roadBgOverlay3: this.textures.exists("roadBgOverlay3"),
        roadBgOverlay4: this.textures.exists("roadBgOverlay4"),
        roadBgOverlay5: this.textures.exists("roadBgOverlay5")
      });
      if (!this.anims.exists("wheelSpin")) {
        this.anims.create({
          key: "wheelSpin",
          frames: [1, 2, 3, 4, 5].map((index) => ({ key: "wheel" + index })),
          frameRate: 20,
          repeat: -1
        });
      }
      if (!this.anims.exists("turboFireLoop")) {
        this.anims.create({
          key: "turboFireLoop",
          frames: [1, 2, 3, 4, 5, 6, 7, 8].map((index) => ({ key: "turboFire" + index })),
          frameRate: 18,
          repeat: -1
        });
      }
      this.scene.start("GameScene");
    }
  }

  CT.BootScene = BootScene;
})();
