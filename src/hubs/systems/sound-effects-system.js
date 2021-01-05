/* global fetch THREE */
import URL_TICK from "../../assets/jel/sfx/click.wav";
import URL_TICK_DOWN from "../../assets/jel/sfx/click-down.wav";
import URL_TOGGLE_TICK from "../../assets/hubs/sfx/tick.mp3";
import URL_TELEPORT_LOOP from "../../assets/hubs/sfx/teleport-loop.mp3";
import URL_QUICK_TURN from "../../assets/hubs/sfx/quickTurn.mp3";
import URL_TAP_MELLOW from "../../assets/hubs/sfx/tap_mellow.mp3";
import URL_PEN_SPAWN from "../../assets/hubs/sfx/PenSpawn.mp3";
import URL_PEN_DRAW from "../../assets/hubs/sfx/PenDraw1.mp3";
import URL_CAMERA_SNAPSHOT from "../../assets/hubs/sfx/PicSnapHey.mp3";
import URL_WELCOME from "../../assets/hubs/sfx/welcome.mp3";
import URL_QUACK from "../../assets/hubs/sfx/quack.mp3";
import URL_SPECIAL_QUACK from "../../assets/hubs/sfx/specialquack.mp3";
import URL_POP from "../../assets/hubs/sfx/pop.mp3";
import URL_FREEZE from "../../assets/hubs/sfx/Eb_blip.mp3";
import URL_TACK from "../../assets/hubs/sfx/tack.mp3";
import URL_MEDIA_LOADED from "../../assets/jel/sfx/loaded.mp3";
import URL_MEDIA_LOADING from "../../assets/jel/sfx/loading.mp3";
import URL_MEDIA_REMOVED from "../../assets/jel/sfx/remove.mp3";
import URL_SPAWN_EMOJI from "../../assets/hubs/sfx/emoji.mp3";
import URL_LAUNCHER_1 from "../../assets/jel/sfx/launcher1.mp3";
import URL_LAUNCHER_2 from "../../assets/jel/sfx/launcher2.mp3";
import URL_LAUNCHER_3 from "../../assets/jel/sfx/launcher3.mp3";
import URL_LAUNCHER_4 from "../../assets/jel/sfx/launcher4.mp3";
import URL_LAUNCHER_5 from "../../assets/jel/sfx/launcher5.mp3";
import URL_LAUNCHER_BIG from "../../assets/jel/sfx/launcher_big.mp3";
import { setMatrixWorld } from "../utils/three-utils";

let soundEnum = 0;
export const SOUND_HOVER_OR_GRAB = soundEnum++;
export const SOUND_RELEASE = soundEnum++;
export const SOUND_THAW = soundEnum++;
export const SOUND_PEN_STOP_DRAW = soundEnum++;
export const SOUND_PEN_UNDO_DRAW = soundEnum++;
export const SOUND_PEN_CHANGE_COLOR = soundEnum++;
export const SOUND_TOGGLE_MIC = soundEnum++;
export const SOUND_TELEPORT_START = soundEnum++;
export const SOUND_TELEPORT_END = soundEnum++;
export const SOUND_WAYPOINT_START = soundEnum++;
export const SOUND_WAYPOINT_END = soundEnum++;
export const SOUND_SNAP_ROTATE = soundEnum++;
export const SOUND_SPAWN_PEN = soundEnum++;
export const SOUND_PEN_START_DRAW = soundEnum++;
export const SOUND_CAMERA_TOOL_TOOK_SNAPSHOT = soundEnum++;
export const SOUND_ENTER_SCENE = soundEnum++;
export const SOUND_QUACK = soundEnum++;
export const SOUND_SPECIAL_QUACK = soundEnum++;
export const SOUND_CHAT_MESSAGE = soundEnum++;
export const SOUND_FREEZE = soundEnum++;
export const SOUND_PIN = soundEnum++;
export const SOUND_MEDIA_LOADING = soundEnum++;
export const SOUND_MEDIA_LOADED = soundEnum++;
export const SOUND_MEDIA_REMOVED = soundEnum++;
export const SOUND_CAMERA_TOOL_COUNTDOWN = soundEnum++;
export const SOUND_PREFERENCE_MENU_HOVER = soundEnum++;
export const SOUND_SPAWN_EMOJI = soundEnum++;
export const SOUND_LAUNCHER_1 = soundEnum++;
export const SOUND_LAUNCHER_2 = soundEnum++;
export const SOUND_LAUNCHER_3 = soundEnum++;
export const SOUND_LAUNCHER_4 = soundEnum++;
export const SOUND_LAUNCHER_5 = soundEnum++;
export const SOUND_LAUNCHER_BIG = soundEnum++;

// Safari doesn't support the promise form of decodeAudioData, so we polyfill it.
function decodeAudioData(audioContext, arrayBuffer) {
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(arrayBuffer, resolve, reject);
  });
}

export class SoundEffectsSystem {
  constructor(scene) {
    this.pendingAudioSourceNodes = [];
    this.pendingPositionalAudios = [];
    this.positionalAudiosStationary = [];
    this.positionalAudiosFollowingObject3Ds = [];

    this.audioContext = THREE.AudioContext.getContext();
    this.scene = scene;

    const soundsAndUrls = [
      [SOUND_HOVER_OR_GRAB, URL_TICK],
      [SOUND_RELEASE, URL_TICK_DOWN],
      [SOUND_THAW, URL_TICK],
      [SOUND_PEN_STOP_DRAW, URL_TICK],
      [SOUND_PEN_UNDO_DRAW, URL_TICK],
      [SOUND_PEN_CHANGE_COLOR, URL_TICK],
      [SOUND_TOGGLE_MIC, URL_TOGGLE_TICK],
      [SOUND_CAMERA_TOOL_COUNTDOWN, URL_TICK],
      [SOUND_TELEPORT_START, URL_TELEPORT_LOOP],
      [SOUND_TELEPORT_END, URL_QUICK_TURN],
      [SOUND_WAYPOINT_START, URL_QUICK_TURN],
      [SOUND_WAYPOINT_END, URL_TICK],
      [SOUND_SNAP_ROTATE, URL_TAP_MELLOW],
      [SOUND_SPAWN_PEN, URL_PEN_SPAWN],
      [SOUND_PEN_START_DRAW, URL_PEN_DRAW],
      [SOUND_CAMERA_TOOL_TOOK_SNAPSHOT, URL_CAMERA_SNAPSHOT],
      [SOUND_ENTER_SCENE, URL_WELCOME],
      [SOUND_QUACK, URL_QUACK],
      [SOUND_SPECIAL_QUACK, URL_SPECIAL_QUACK],
      [SOUND_CHAT_MESSAGE, URL_POP],
      [SOUND_FREEZE, URL_FREEZE],
      [SOUND_PIN, URL_TACK],
      [SOUND_MEDIA_LOADING, URL_MEDIA_LOADING],
      [SOUND_MEDIA_LOADED, URL_MEDIA_LOADED],
      [SOUND_MEDIA_REMOVED, URL_MEDIA_REMOVED],
      [SOUND_PREFERENCE_MENU_HOVER, URL_FREEZE],
      [SOUND_SPAWN_EMOJI, URL_SPAWN_EMOJI],
      [SOUND_LAUNCHER_1, URL_LAUNCHER_1],
      [SOUND_LAUNCHER_2, URL_LAUNCHER_2],
      [SOUND_LAUNCHER_3, URL_LAUNCHER_3],
      [SOUND_LAUNCHER_4, URL_LAUNCHER_4],
      [SOUND_LAUNCHER_5, URL_LAUNCHER_5],
      [SOUND_LAUNCHER_BIG, URL_LAUNCHER_BIG]
    ];
    const loading = new Map();
    const load = url => {
      let audioBufferPromise = loading.get(url);
      if (!audioBufferPromise) {
        audioBufferPromise = fetch(url)
          .then(r => r.arrayBuffer())
          .then(arrayBuffer => decodeAudioData(this.audioContext, arrayBuffer));
        loading.set(url, audioBufferPromise);
      }
      return audioBufferPromise;
    };
    this.sounds = new Map();
    soundsAndUrls.map(([sound, url]) => {
      load(url).then(audioBuffer => {
        this.sounds.set(sound, audioBuffer);
      });
    });

    this.isDisabled = window.APP.store.state.preferences.disableSoundEffects;
    window.APP.store.addEventListener("statechanged", () => {
      const shouldBeDisabled = window.APP.store.state.preferences.disableSoundEffects;
      if (shouldBeDisabled && !this.isDisabled) {
        this.stopAllPositionalAudios();
        // TODO: Technically we should stop any other sounds that have been started,
        // but we do not hold references to these and they're short-lived so I didn't bother.
      }
      this.isDisabled = shouldBeDisabled;
    });
  }

  enqueueSound(sound, loop) {
    if (this.isDisabled) return null;
    const audioBuffer = this.sounds.get(sound);
    if (!audioBuffer) return null;
    // The nodes are very inexpensive to create, according to
    // https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.loop = loop;
    this.pendingAudioSourceNodes.push(source);
    return source;
  }

  enqueuePositionalSound(sound, loop) {
    if (this.isDisabled) return null;
    const audioBuffer = this.sounds.get(sound);
    if (!audioBuffer) return null;

    const disablePositionalAudio = window.APP.store.state.preferences.audioOutputMode === "audio";
    const positionalAudio = disablePositionalAudio
      ? new THREE.Audio(this.scene.audioListener)
      : new THREE.PositionalAudio(this.scene.audioListener);
    positionalAudio.setBuffer(audioBuffer);
    positionalAudio.loop = loop;
    this.pendingPositionalAudios.push(positionalAudio);
    return positionalAudio;
  }

  playPositionalSoundAt(sound, position, loop) {
    const positionalAudio = this.enqueuePositionalSound(sound, loop);
    if (!positionalAudio) return null;
    positionalAudio.position.copy(position);
    positionalAudio.matrixWorldNeedsUpdate = true;
    this.positionalAudiosStationary.push(positionalAudio);
  }

  playPositionalSoundFollowing(sound, object3D, loop) {
    const positionalAudio = this.enqueuePositionalSound(sound, loop);
    if (!positionalAudio) return null;
    this.positionalAudiosFollowingObject3Ds.push({ positionalAudio, object3D });
    return positionalAudio;
  }

  playSoundOneShot(sound) {
    console.log("enqueue", sound);
    return this.enqueueSound(sound, false);
  }

  playSoundLooped(sound) {
    return this.enqueueSound(sound, true);
  }

  playSoundLoopedWithGain(sound) {
    if (this.isDisabled) return null;
    const audioBuffer = this.sounds.get(sound);
    if (!audioBuffer) return null;

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    source.buffer = audioBuffer;
    source.connect(gain);
    gain.connect(this.audioContext.destination);
    source.loop = true;
    this.pendingAudioSourceNodes.push(source);
    return { gain, source };
  }

  stopSoundNode(node) {
    const index = this.pendingAudioSourceNodes.indexOf(node);
    if (index !== -1) {
      this.pendingAudioSourceNodes.splice(index, 1);
    } else {
      node.stop();
    }
  }

  stopPositionalAudio(inPositionalAudio) {
    const pendingIndex = this.pendingPositionalAudios.indexOf(inPositionalAudio);
    if (pendingIndex !== -1) {
      this.pendingPositionalAudios.splice(pendingIndex, 1);
    } else {
      if (inPositionalAudio.isPlaying) {
        inPositionalAudio.stop();
      }
      if (inPositionalAudio.parent) {
        inPositionalAudio.parent.remove(inPositionalAudio);
      }
    }
    this.positionalAudiosStationary = this.positionalAudiosStationary.filter(
      positionalAudio => positionalAudio !== inPositionalAudio
    );
    this.positionalAudiosFollowingObject3Ds = this.positionalAudiosFollowingObject3Ds.filter(
      ({ positionalAudio }) => positionalAudio !== inPositionalAudio
    );
  }

  stopAllPositionalAudios() {
    for (let i = this.positionalAudiosStationary.length - 1; i >= 0; i--) {
      const positionalAudio = this.positionalAudiosStationary[i];
      this.stopPositionalAudio(positionalAudio);
    }

    for (let i = this.positionalAudiosFollowingObject3Ds.length - 1; i >= 0; i--) {
      const positionalAudioAndObject3D = this.positionalAudiosFollowingObject3Ds[i];
      const positionalAudio = positionalAudioAndObject3D.positionalAudio;
      this.stopPositionalAudio(positionalAudio);
    }
  }

  tick() {
    if (this.isDisabled) {
      return;
    }

    for (let i = 0; i < this.pendingAudioSourceNodes.length; i++) {
      this.pendingAudioSourceNodes[i].start();
    }
    this.pendingAudioSourceNodes.length = 0;

    for (let i = 0; i < this.pendingPositionalAudios.length; i++) {
      const pendingPositionalAudio = this.pendingPositionalAudios[i];
      this.scene.object3D.add(pendingPositionalAudio);
      pendingPositionalAudio.play();
    }
    this.pendingPositionalAudios.length = 0;

    for (let i = this.positionalAudiosStationary.length - 1; i >= 0; i--) {
      const positionalAudio = this.positionalAudiosStationary[i];
      if (!positionalAudio.isPlaying) {
        this.stopPositionalAudio(positionalAudio);
      }
    }

    for (let i = this.positionalAudiosFollowingObject3Ds.length - 1; i >= 0; i--) {
      const positionalAudioAndObject3D = this.positionalAudiosFollowingObject3Ds[i];
      const positionalAudio = positionalAudioAndObject3D.positionalAudio;
      const object3D = positionalAudioAndObject3D.object3D;
      if (!positionalAudio.isPlaying || !object3D.parent) {
        this.stopPositionalAudio(positionalAudio);
      } else {
        object3D.updateMatrices();
        setMatrixWorld(positionalAudio, object3D.matrixWorld);
      }
    }
  }
}
