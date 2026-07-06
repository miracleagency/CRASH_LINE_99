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
      const backTestBgUrl = CT.asset("images/BACK_TEST_BG.png");
      const barrelUrl = CT.asset("images/barrol.png");
      const girlUrl = CT.asset("images/girl.png");
      const mainScreenRefOverlayUrl = CT.asset("images/Main_screen_ref_overlay.png");
      const fencePoleUrl = CT.asset("images/stolb_lamp_1.png");
      const fenceLightUrl = CT.asset("images/yelow_light_1.png");
      const barrelFireFrameCount = 25;
      const barrelFireUrls = Array.from({ length: barrelFireFrameCount }, (_, index) => {
        const frame = String(index + 1).padStart(2, "0");
        return CT.asset("images/FIRE_from_barrol_seq/fire1_ " + frame + ".png");
      });
      const carBodyUrl = CT.asset("images/car_body.png");
      const carCrashBodyFrames = 9;
      const carCrashBodyUrls = Array.from({ length: carCrashBodyFrames }, (_, index) => {
        const frame = String(index + 1).padStart(2, "0");
        return CT.asset("images/CAR_BODY_CRASH_SEQ/CAR_CRASH_" + frame + ".png");
      });
      const carLightSweepFrames = 5;
      const carLightSweepUrls = Array.from({ length: carLightSweepFrames }, (_, index) => {
        return CT.asset("images/light_sweep_car_seq/light_sweep_" + (index + 1) + ".png");
      });
      const wheelShadowUrl = CT.asset("images/shadow_for_wheels.png");
      const carGroundShadowUrl = CT.asset("images/shadow_under_car_wheels.png");
      const monekenShadowUrl = CT.asset("images/moneken_shadow.png");
      const wheelUrls = [1, 2, 3, 4, 5].map((index) => CT.asset("images/wheel_seq/wheel_" + index + ".png"));
      const turboFireUrls = [1, 2, 3, 4, 5, 6, 7, 8].map((index) => CT.asset("images/turbo_fire_seq/turbo_fire_" + index + ".png"));
      const dummyPartFiles = {
        head: "dummy_head.png",
        torso: "dummy_torso.png",
        pelvis: "dummy_pelvis.png",
        upperArmL: "dummy_upper_arm_l.png",
        lowerArmL: "dummy_lower_arm_l.png",
        handL: "dummy_hand_l.png",
        thighL: "dummy_thigh_l.png",
        shinL: "dummy_shin_l.png",
        footL: "dummy_foot_l.png",
        upperArmR: "dummy_upper_arm_r.png",
        lowerArmR: "dummy_lower_arm_r.png",
        handR: "dummy_hand_r.png",
        thighR: "dummy_thigh_r.png",
        shinR: "dummy_shin_r.png",
        footR: "dummy_foot_r.png"
      };
      const dummyPartUrls = Object.keys(dummyPartFiles).map((key) => ({
        key: "dummyPart_" + key,
        url: CT.asset("images/DUMMY_PARTS/" + dummyPartFiles[key])
      }));
      dummyPartUrls.push({
        key: "dummyPart_handRThumbUp",
        url: CT.asset("images/DUMMY_PARTS/dummy_hand_r_thumb_up.png")
      });
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
      this.load.image("backTestBg", backTestBgUrl);
      this.load.image("barrel", barrelUrl);
      this.load.image("girl", girlUrl);
      this.load.image("mainScreenRefOverlay", mainScreenRefOverlayUrl);
      this.load.image("fencePole", fencePoleUrl);
      this.load.image("fenceLight", fenceLightUrl);
      barrelFireUrls.forEach((url, index) => {
        this.load.image("barrelFire" + (index + 1), url);
      });
      this.load.image("carBody", carBodyUrl);
      carCrashBodyUrls.forEach((url, index) => {
        this.load.image("carCrashBody" + (index + 1), url);
      });
      carLightSweepUrls.forEach((url, index) => {
        this.load.image("carLightSweep" + (index + 1), url);
      });
      this.load.image("wheelShadow", wheelShadowUrl);
      this.load.image("carGroundShadow", carGroundShadowUrl);
      this.load.image("monekenShadow", monekenShadowUrl);
      wheelUrls.forEach((url, index) => {
        this.load.image("wheel" + (index + 1), url);
      });
      turboFireUrls.forEach((url, index) => {
        this.load.image("turboFire" + (index + 1), url);
      });
      dummyPartUrls.forEach((item) => {
        this.load.image(item.key, item.url);
      });
      roadBgOverlayUrls.forEach((url, index) => {
        this.load.image("roadBgOverlay" + (index + 1), url);
      });
      Object.keys(audio).forEach((key) => {
        this.load.audio(key, audio[key]);
      });
    }

    create() {
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
      if (!this.anims.exists("carBodyCrash")) {
        this.anims.create({
          key: "carBodyCrash",
          frames: Array.from({ length: 9 }, (_, index) => ({ key: "carCrashBody" + (index + 1) })),
          frameRate: 24,
          repeat: 0
        });
      }
      if (!this.anims.exists("carLightSweep")) {
        this.anims.create({
          key: "carLightSweep",
          frames: Array.from({ length: 5 }, (_, index) => ({ key: "carLightSweep" + (index + 1) })),
          frameRate: 24,
          repeat: 0
        });
      }
      if (!this.anims.exists("barrelFireLoop")) {
        this.anims.create({
          key: "barrelFireLoop",
          frames: Array.from({ length: 25 }, (_, index) => ({ key: "barrelFire" + (index + 1) })),
          frameRate: 24,
          repeat: -1
        });
      }
      this.scene.start("GameScene");
    }
  }

  CT.BootScene = BootScene;
})();
