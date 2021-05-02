import { Validator } from "jsonschema";
import mixpanel from "mixpanel-browser";
import merge from "deepmerge";
import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";

const LOCAL_STORE_KEY = "___jel_store";
const STORE_STATE_CACHE_KEY = Symbol();
const OAUTH_FLOW_CREDENTIALS_KEY = "ret-oauth-flow-account-credentials";
const validator = new Validator();
import { EventTarget } from "event-target-shim";
import { fetchRandomDefaultAvatarId, generateRandomName } from "../utils/identity.js";

const capitalize = str => str[0].toUpperCase() + str.slice(1);

function randomString(len) {
  const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return [...Array(len)].reduce(a => a + p[~~(Math.random() * p.length)], "");
}

// Durable (via local-storage) schema-enforced state that is meant to be consumed via forward data flow.
// (Think flux but with way less incidental complexity, at least for now :))
export const SCHEMA = {
  id: "/JelStore",

  definitions: {
    context: {
      type: "object",
      additionalProperties: false,
      properties: {
        spaceId: { type: "string" },
        lastJoinedHubId: { type: "string" }, // Deprecated
        lastJoinedHubIds: { type: "object" },
        isFirstVisitToSpace: { type: "boolean" }, // true the very first time a space is visited, for initial setup
        isSpaceCreator: { type: "boolean" } // true if this user ever created a space on this device
      }
    },

    profile: {
      type: "object",
      additionalProperties: false,
      properties: {
        displayName: { type: "string", pattern: "^[A-Za-z0-9 -]{3,32}$" },
        avatarId: { type: "string" }
      }
    },

    credentials: {
      type: "object",
      additionalProperties: false,
      properties: {
        token: { type: ["null", "string"] },
        matrixAccessToken: { type: ["null", "string"] },
        deviceId: { type: ["null", "string"] },
        email: { type: ["null", "string"] }
      }
    },

    activity: {
      type: "object",
      additionalProperties: false,
      properties: {
        hasRotated: { type: "boolean" }, // Legacy
        hasScaled: { type: "boolean" }, // Legacy
        hasFoundWiden: { type: "boolean" }, // Legacy
        lastEnteredAt: { type: "string" },
        entryCount: { type: "number" },
        narrow: { type: "boolean" },
        widen: { type: "boolean" },
        unmute: { type: "boolean" },
        toggleMuteKey: { type: "boolean" },
        wasd: { type: "boolean" },
        createMenu: { type: "boolean" },
        createWorld: { type: "boolean" },
        createChannel: { type: "boolean" },
        avatarEdit: { type: "boolean" },
        showInvite: { type: "boolean" },
        rightDrag: { type: "boolean" },
        narrowMouseLook: { type: "boolean" },
        rotated: { type: "boolean" },
        scaled: { type: "boolean" },
        mediaTextEdit: { type: "boolean" },
        mediaTextEditClose: { type: "boolean" },
        mediaTextCreate: { type: "boolean" },
        mediaRemove: { type: "boolean" },
        chat: { type: "boolean" },
        hasShownJumpedToMember: { type: "boolean" }
      }
    },

    settings: {
      type: "object",
      additionalProperties: false,
      properties: {
        preferredMicDeviceId: { type: "string" },
        hideKeyTips: { type: "boolean" },
        defaultDetailLevel: { type: "number" },
        defaultDetailLevelUntilSeconds: { type: "number" },
        hideNotificationBannerUntilSeconds: { type: "number" }
      }
    },

    equips: {
      type: "object",
      additionalProperties: false,
      properties: {
        launcher: { type: "string" },
        launcherSlot1: { type: "string" },
        launcherSlot2: { type: "string" },
        launcherSlot3: { type: "string" },
        launcherSlot4: { type: "string" },
        launcherSlot5: { type: "string" },
        launcherSlot6: { type: "string" },
        launcherSlot7: { type: "string" },
        launcherSlot8: { type: "string" },
        launcherSlot9: { type: "string" },
        launcherSlot10: { type: "string" },
        color: { type: "array" },
        colorSlot1: { type: "array" },
        colorSlot2: { type: "array" },
        colorSlot3: { type: "array" },
        colorSlot4: { type: "array" },
        colorSlot5: { type: "array" },
        colorSlot6: { type: "array" },
        colorSlot7: { type: "array" },
        colorSlot8: { type: "array" },
        colorSlot9: { type: "array" },
        colorSlot10: { type: "array" }
      }
    },

    preferences: {
      type: "object",
      additionalProperties: false,
      properties: {
        shouldPromptForRefresh: { type: "bool" },
        muteMicOnEntry: { type: "bool" },
        audioOutputMode: { type: "string" },
        invertTouchscreenCameraMove: { type: "bool" },
        enableOnScreenJoystickLeft: { type: "bool" },
        enableOnScreenJoystickRight: { type: "bool" },
        onlyShowNametagsInFreeze: { type: "bool" },
        allowMultipleHubsInstances: { type: "bool" },
        disableIdleDetection: { type: "bool" },
        preferMobileObjectInfoPanel: { type: "bool" },
        maxResolutionWidth: { type: "number" },
        maxResolutionHeight: { type: "number" },
        globalVoiceVolume: { type: "number" },
        globalMediaVolume: { type: "number" },
        snapRotationDegrees: { type: "number" },
        materialQualitySetting: { type: "string" },
        disableSoundEffects: { type: "bool" },
        disableMovement: { type: "bool" },
        disableBackwardsMovement: { type: "bool" },
        disableStrafing: { type: "bool" },
        disableTeleporter: { type: "bool" },
        disableAutoPixelRatio: { type: "bool" },
        movementSpeedModifier: { type: "number" },
        disableEchoCancellation: { type: "bool" },
        disableNoiseSuppression: { type: "bool" },
        disableAutoGainControl: { type: "bool" },
        disableAudioAmbience: { type: "bool" }
      }
    },

    embedTokens: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          hubId: { type: "string" },
          embedToken: { type: "string" }
        }
      }
    },

    onLoadActions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          action: { type: "string" },
          args: { type: "object" }
        }
      }
    },

    uiState: {
      type: "object",
      additionalProperties: false,
      properties: {
        navPanelWidth: { type: "number" },
        presencePanelWidth: { type: "number" },
        mediaTextColorPresetIndex: { type: "number" },
        closedNotificationBanner: { type: "boolean" } // Deprecated
      }
    },

    expandedTreeNodes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          nodeId: { type: "string" }
        }
      }
    }
  },

  type: "object",

  properties: {
    context: { $ref: "#/definitions/context" },
    profile: { $ref: "#/definitions/profile" },
    credentials: { $ref: "#/definitions/credentials" },
    activity: { $ref: "#/definitions/activity" },
    settings: { $ref: "#/definitions/settings" },
    equips: { $ref: "#/definitions/equips" },
    preferences: { $ref: "#/definitions/preferences" },
    uiState: { $ref: "#/definitions/uiState" },
    embedTokens: { $ref: "#/definitions/embedTokens" },
    onLoadActions: { $ref: "#/definitions/onLoadActions" },
    expandedTreeNodes: { $ref: "#/definitions/expandedTreeNodes" }
  },

  additionalProperties: false
};

export default class Store extends EventTarget {
  constructor() {
    super();

    if (localStorage.getItem(LOCAL_STORE_KEY) === null) {
      localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify({}));
    }

    // When storage is updated in another window
    window.addEventListener("storage", e => {
      if (e.key !== LOCAL_STORE_KEY) return;
      delete this[STORE_STATE_CACHE_KEY];
      this.dispatchEvent(new CustomEvent("statechanged"));
    });

    this.update({
      context: {},
      activity: {},
      settings: {},
      equips: {},
      credentials: {},
      profile: {},
      embedTokens: [],
      onLoadActions: [],
      expandedTreeNodes: [],
      preferences: {},
      uiState: {}
    });

    this._shouldResetAvatarOnInit = false;

    const oauthFlowCredentials = Cookies.getJSON(OAUTH_FLOW_CREDENTIALS_KEY);
    if (oauthFlowCredentials) {
      this.update({ credentials: oauthFlowCredentials });
      this._shouldResetAvatarOnInit = true;
      Cookies.remove(OAUTH_FLOW_CREDENTIALS_KEY);
    }

    this._signOutOnExpiredAuthToken();
  }

  _signOutOnExpiredAuthToken = () => {
    if (!this.state.credentials.token) return;

    const expiry = jwtDecode(this.state.credentials.token).exp * 1000;
    if (expiry <= Date.now()) {
      this.clearCredentials();
    }
  };

  clearCredentials() {
    this.update({ credentials: { token: null, matrixAccessToken: null, deviceId: null, email: null } });
  }

  initDefaults = async () => {
    if (this._shouldResetAvatarOnInit) {
      await this.resetToRandomDefaultAvatar();
    } else {
      this.update({
        profile: { avatarId: await fetchRandomDefaultAvatarId(), ...(this.state.profile || {}) }
      });
    }

    // Regenerate name to encourage users to change it.
    if (!this.state.activity.hasChangedName) {
      this.update({ profile: { displayName: generateRandomName() } });
    }

    if (!this.state.equips.launcher) {
      this.update({
        equips: {
          launcher: "😀",
          launcherSlot1: "😀",
          launcherSlot2: "😂",
          launcherSlot3: "🤔",
          launcherSlot4: "😍",
          launcherSlot5: "😘",
          launcherSlot6: "🥺",
          launcherSlot7: "😭",
          launcherSlot8: "👍",
          launcherSlot9: "👏",
          launcherSlot10: "❤"
        }
      });
    }

    if (!this.state.equips.color) {
      this.update({
        equips: {
          color: [200, 0, 0],
          colorSlot1: [120, 239, 21],
          colorSlot2: [231, 200, 12],
          colorSlot3: [22, 230, 44],
          colorSlot4: [22, 230, 44],
          colorSlot5: [22, 230, 44],
          colorSlot6: [22, 230, 44],
          colorSlot7: [242, 230, 44],
          colorSlot8: [22, 230, 44],
          colorSlot9: [22, 230, 44],
          colorSlot10: [22, 230, 44]
        }
      });
    }

    if (!this.state.credentials.deviceId) {
      this.update({ credentials: { deviceId: randomString(32) } });
    }
  };

  resetToRandomDefaultAvatar = async () => {
    this.update({
      profile: { ...(this.state.profile || {}), avatarId: await fetchRandomDefaultAvatarId() }
    });
  };

  get state() {
    if (!this.hasOwnProperty(STORE_STATE_CACHE_KEY)) {
      this[STORE_STATE_CACHE_KEY] = JSON.parse(localStorage.getItem(LOCAL_STORE_KEY));
    }

    return this[STORE_STATE_CACHE_KEY];
  }

  get credentialsAccountId() {
    if (this.state.credentials.token) {
      return jwtDecode(this.state.credentials.token).sub;
    } else {
      return null;
    }
  }

  bumpEntryCount() {
    const currentEntryCount = this.state.activity.entryCount || 0;
    this.update({ activity: { entryCount: currentEntryCount + 1 } });
  }

  // Sets a one-time action to perform the next time the page loads
  enqueueOnLoadAction(action, args) {
    this.update({ onLoadActions: [{ action, args }] });
  }

  executeOnLoadActions(sceneEl) {
    for (let i = 0; i < this.state.onLoadActions.length; i++) {
      const { action, args } = this.state.onLoadActions[i];

      if (action === "emit_scene_event") {
        sceneEl.emit(args.event, args.detail);
      }
    }

    this.clearOnLoadActions();
  }

  setLastJoinedHubId(spaceId, hubId) {
    const lastJoinedHubIds = this.state.context.lastJoinedHubIds || {};
    lastJoinedHubIds[spaceId] = hubId;
    this.update({ context: { lastJoinedHubIds } });
  }

  clearLastJoinedHubId(spaceId) {
    const lastJoinedHubIds = this.state.context.lastJoinedHubIds || {};

    if (lastJoinedHubIds[spaceId]) {
      delete lastJoinedHubIds[spaceId];
      this.update({ context: { lastJoinedHubIds } });
    }
  }

  clearOnLoadActions() {
    this.clearStoredArray("onLoadActions");
  }

  clearStoredArray(key) {
    const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
    const update = {};
    update[key] = [];

    this.update(update, { arrayMerge: overwriteMerge });
  }

  update(newState, mergeOpts) {
    const finalState = merge(this.state, newState, mergeOpts);
    const { valid } = validator.validate(finalState, SCHEMA);

    if (!valid) {
      // Intentionally not including details about the state or validation result here, since we don't want to leak
      // sensitive data in the error message.
      throw new Error(`Write to store failed schema validation.`);
    }

    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(finalState));
    delete this[STORE_STATE_CACHE_KEY];

    if (newState.profile !== undefined) {
      this.dispatchEvent(new CustomEvent("profilechanged"));
    }
    if (newState.context !== undefined) {
      this.dispatchEvent(new CustomEvent("contextchanged"));
    }

    this.dispatchEvent(new CustomEvent("statechanged"));

    for (const key of Object.keys(newState)) {
      this.dispatchEvent(new CustomEvent(`statechanged-${key}`));
    }

    return finalState;
  }

  handleActivityFlag(flag) {
    const val = this.state.activity[flag];

    if (val === undefined) {
      this.update({ activity: { [flag]: true } });
      mixpanel.track(`First ${capitalize(flag)}`, {});
      this.dispatchEvent(new CustomEvent("activityflagged"));
    }
  }
}
