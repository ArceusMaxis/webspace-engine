import { takeOwnership, getNetworkId, getNetworkedEntity } from "../utils/ownership-utils";
import { MEDIA_PRESENCE } from "../../utils/media-utils";

const MAX_CONCURRENT_TRANSITIONS = 4;

AFRAME.registerComponent("shared-media", {
  schema: {
    selectedMediaLayer: { default: 0 },
    activeMediaLayers: { default: 1 }
  },

  setActiveLayer(mediaLayer) {
    takeOwnership(this.el);
    this.el.setAttribute("shared-media", {
      activeMediaLayers: 0x1 << mediaLayer,
      selectedMediaLayer: mediaLayer
    });
  },

  update(oldData) {
    if (oldData.activeMediaLayers !== this.data.activeMediaLayers) {
      const mediaPresenceSystem = this.el.sceneEl.systems["hubs-systems"].mediaPresenceSystem;

      for (const entity of Object.values(SAF.entities.entities)) {
        if (entity.components["media-loader"]) {
          mediaPresenceSystem.updateDesiredMediaPresence(entity);
        }
      }
    }
  }
});

// System which manages media presence based upon media layers and eventually other contexts.
//
// The general contract for this is we publish "desired" media presence state for each network id,
// and this system will eventually let each relevant media component transition itself. Transitions
// are transactions and not cancellable, so before we transition to HIDDEN for example if a transition
// to PRESENT was underway, it will be allowed to complete.
export class MediaPresenceSystem {
  constructor(scene) {
    this.scene = scene;
    this.mediaPresence = new Map();
    this.desiredMediaPresence = new Map();
    this.mediaComponents = new Map();
    this.transitioningNetworkIds = new Set();
  }

  getMediaPresence(component) {
    const presence = this.mediaPresence.get(component);
    return presence || MEDIA_PRESENCE.UNKNOWN;
  }

  setMediaPresence(component, presence) {
    this.mediaPresence.set(component, presence);
    this.checkForNewTransitionsNextTick = true;
  }

  tick() {
    if (!this.checkForNewTransitionsNextTick) return;
    this.checkForNewTransitionsNextTick = false;

    // Look for new transitions
    for (const [networkId, desiredMediaPresence] of this.desiredMediaPresence.entries()) {
      const mediaComponent = this.mediaComponents.get(networkId);
      if (!mediaComponent) continue;
      const mediaPresence = this.getMediaPresence(mediaComponent);

      if (mediaPresence !== MEDIA_PRESENCE.PENDING && mediaPresence !== desiredMediaPresence) {
        if (desiredMediaPresence === MEDIA_PRESENCE.HIDDEN) {
          // if it's hidden, just do it right away since it's cheap.
          mediaComponent.setMediaPresence(desiredMediaPresence);
        } else if (this.transitioningNetworkIds.size < MAX_CONCURRENT_TRANSITIONS) {
          this.beginTransitionOfMediaPresence(networkId, desiredMediaPresence);
        }
      }
    }
  }

  getActiveMediaLayers() {
    const el = document.querySelector("[shared-media]");
    if (!el) {
      console.warn("Trying to get active media layers but no media presenting space entity in scene.");
      return 1;
    }

    return el.components["shared-media"].data.activeMediaLayers;
  }

  isMediaLayerActive(mediaLayer) {
    const activeMediaLayers = this.getActiveMediaLayers();
    return !!((0x1 << mediaLayer) & activeMediaLayers);
  }

  updateDesiredMediaPresence(el) {
    const networkId = getNetworkId(el);
    const mediaLayer = el.components["media-loader"].data.mediaLayer;
    const presence = this.isMediaLayerActive(mediaLayer) ? MEDIA_PRESENCE.PRESENT : MEDIA_PRESENCE.HIDDEN;

    this.desiredMediaPresence.set(networkId, presence);
    this.checkForNewTransitionsNextTick = true;
  }

  async beginTransitionOfMediaPresence(networkId, presence) {
    const mediaComponent = this.mediaComponents.get(networkId);
    this.transitioningNetworkIds.add(networkId);
    await mediaComponent.setMediaPresence(presence);
    this.transitioningNetworkIds.delete(networkId);
    this.checkForNewTransitionsNextTick = true;
  }

  registerMediaComponent(component) {
    try {
      getNetworkedEntity(component.el)
        .then(networkedEl => {
          const networkId = getNetworkId(networkedEl);
          this.mediaComponents.set(networkId, component);
          this.setMediaPresence(this, MEDIA_PRESENCE.INIT);
          this.checkForNewTransitionsNextTick = true;
        })
        .catch(() => {}); //ignore exception, entity might not be networked
    } catch (e) {
      // NAF/SAF may not exist on scene landing page
    }
  }

  unregisterMediaComponent(component) {
    for (const [networkId, c] of this.mediaComponents) {
      if (c !== component) continue;
      this.mediaComponents.delete(networkId);
      this.desiredMediaPresence.delete(networkId);
      this.mediaPresence.delete(networkId);
      this.checkForNewTransitionsNextTick = true;
      break;
    }
  }
}
