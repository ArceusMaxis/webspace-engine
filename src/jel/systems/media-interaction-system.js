import { paths } from "../../hubs/systems/userinput/paths";
import {
  getMediaViewComponent,
  performAnimatedRemove,
  MEDIA_INTERACTION_TYPES,
  cloneMedia
} from "../../hubs/utils/media-utils";
import { GUIDE_PLANE_MODES } from "./helpers-system";
import { TRANSFORM_MODE } from "../../hubs/systems/transform-selected-object";
import { waitForDOMContentLoaded } from "../../hubs/utils/async-utils";
import { ensureOwnership, getNetworkedEntitySync, isSynchronized } from "../../jel/utils/ownership-utils";
import { cursorIsVisible } from "../utils/dom-utils";
import { releaseEphemeralCursorLock, beginEphemeralCursorLock } from "../utils/dom-utils";
import qsTruthy from "../../hubs/utils/qs_truthy";

const REMOVE_ACTION_MAX_DELAY_MS = 500.0;
const isDirectorMode = qsTruthy("director");

// System which manages keyboard-based media interactions
export class MediaInteractionSystem {
  constructor(scene) {
    this.scene = scene;
    this.rightHand = null;
    this.transformSystem = null;
    this.scalingSystem = null;
    this.lastRemoveActionTarget = null;

    waitForDOMContentLoaded().then(() => {
      this.rightHand = document.getElementById("player-right-controller");
    });
  }

  tick() {
    const { scene, rightHand } = this;
    if (!rightHand) return;
    if (!window.APP.hubChannel.can("spawn_and_move_media")) return;
    if (!SYSTEMS.cameraSystem.cameraViewAllowsManipulation()) return;

    this.userinput = this.userinput || scene.systems.userinput;
    this.transformSystem = this.transformSystem || this.scene.systems["transform-selected-object"];

    this.interaction = this.interaction || scene.systems.interaction;
    const interaction = this.interaction;
    const hoverEl = interaction.state.rightRemote.hovered || interaction.state.leftRemote.hovered;
    const heldEl = interaction.state.rightRemote.held || interaction.state.leftRemote.held;

    if (this.userinput.get(paths.actions.mediaTransformReleaseAction)) {
      this.transformSystem.stopTransform();
      releaseEphemeralCursorLock();
      return;
    }

    if (this.userinput.get(paths.actions.mediaScaleReleaseAction)) {
      this.scaleSystem = this.scaleSystem || this.scene.systems["scale-object"];
      this.scaleSystem.endScaling();
      releaseEphemeralCursorLock();
      return;
    }

    const rightHeld = interaction.state.rightRemote.held;

    // Stop sliding if held was dropped or slide key lifted
    if (
      this.userinput.get(paths.actions.mediaSlideReleaseAction) ||
      (this.transformSystem.mode === TRANSFORM_MODE.SLIDE && this.transformSystem.transforming && !rightHeld)
    ) {
      this.transformSystem.stopTransform();
      releaseEphemeralCursorLock();
      SYSTEMS.helpersSystem.setGuidePlaneMode(GUIDE_PLANE_MODES.DISABLED);

      return;
    }

    if (heldEl) {
      this.handleHeld(heldEl);
    } else if (hoverEl) {
      this.handleHover(hoverEl);
    }
  }

  handleHover(hoverEl) {
    // Do not allow engaging media interactions if cursor has been hidden.
    if (!cursorIsVisible()) return;

    let interactionType = null;
    const isSynced = isSynchronized(hoverEl);
    const targetEl = isSynced ? getNetworkedEntitySync(hoverEl) : hoverEl;

    if (this.userinput.get(paths.actions.mediaPrimaryAction)) {
      interactionType = MEDIA_INTERACTION_TYPES.PRIMARY;
    } else if (this.userinput.get(paths.actions.mediaNextAction)) {
      if (!isDirectorMode) {
        interactionType = MEDIA_INTERACTION_TYPES.NEXT;
      } else {
        SYSTEMS.directorSystem.beginLerpingTrackedObject();
      }
    } else if (this.userinput.get(paths.actions.mediaBackAction)) {
      if (!isDirectorMode) {
        interactionType = MEDIA_INTERACTION_TYPES.BACK;
      } else {
        // Director mode
        SYSTEMS.directorSystem.setTrackedObject(hoverEl);
      }
    } else if (this.userinput.get(paths.actions.mediaUpAction)) {
      if (!isDirectorMode) {
        interactionType = MEDIA_INTERACTION_TYPES.UP;
      } else {
        // Director mode
        SYSTEMS.directorSystem.beginTrackingCamera();
      }
    } else if (this.userinput.get(paths.actions.mediaDownAction)) {
      if (!isDirectorMode) {
        interactionType = MEDIA_INTERACTION_TYPES.DOWN;
      } else {
        SYSTEMS.directorSystem.restart();
      }
    } else if (this.userinput.get(paths.actions.mediaSnapshotAction)) {
      interactionType = MEDIA_INTERACTION_TYPES.SNAPSHOT;
    } else if (this.userinput.get(paths.actions.mediaRotateAction)) {
      interactionType = MEDIA_INTERACTION_TYPES.ROTATE;
    } else if (this.userinput.get(paths.actions.mediaScaleAction)) {
      interactionType = MEDIA_INTERACTION_TYPES.SCALE;
    } else if (this.userinput.get(paths.actions.mediaCloneAction)) {
      interactionType = MEDIA_INTERACTION_TYPES.CLONE;
    } else if (this.userinput.get(paths.actions.mediaEditAction)) {
      interactionType = MEDIA_INTERACTION_TYPES.EDIT;
    } else if (this.userinput.get(paths.actions.mediaOpenAction)) {
      interactionType = MEDIA_INTERACTION_TYPES.OPEN;
    } else if (this.userinput.get(paths.actions.mediaRemoveAction)) {
      if (this.lastRemoveActionTarget !== hoverEl) {
        this.lastRemoveActionTarget = hoverEl;
        setTimeout(() => (this.lastRemoveActionTarget = null), REMOVE_ACTION_MAX_DELAY_MS);
      } else {
        interactionType = MEDIA_INTERACTION_TYPES.REMOVE;
        window.APP.store.handleActivityFlag("mediaRemove");
      }
    }

    if (interactionType !== null) {
      const component = getMediaViewComponent(hoverEl);

      if (component) {
        if (interactionType === MEDIA_INTERACTION_TYPES.CLONE) {
          const { entity } = cloneMedia(component.el, "#interactable-media");

          entity.object3D.scale.copy(component.el.object3D.scale);
          entity.object3D.matrixNeedsUpdate = true;

          entity.setAttribute("offset-relative-to", {
            target: "#avatar-pov-node",
            offset: { x: 0, y: 0, z: -1.15 * component.el.object3D.scale.z }
          });
        } else {
          if (isSynced && !ensureOwnership(targetEl)) return;

          if (interactionType === MEDIA_INTERACTION_TYPES.ROTATE) {
            beginEphemeralCursorLock();

            this.transformSystem.startTransform(targetEl.object3D, this.rightHand.object3D, {
              mode: TRANSFORM_MODE.CURSOR
            });
          } else if (interactionType === MEDIA_INTERACTION_TYPES.SCALE) {
            beginEphemeralCursorLock();

            this.scaleSystem = this.scaleSystem || this.scene.systems["scale-object"];
            this.scaleSystem.startScaling(targetEl.object3D, this.rightHand.object3D);
          } else if (interactionType === MEDIA_INTERACTION_TYPES.REMOVE) {
            performAnimatedRemove(targetEl);
          } else {
            component.handleMediaInteraction(interactionType);
          }
        }
      }
    }
  }

  handleHeld(heldEl) {
    let interactionType = null;
    const interaction = this.interaction;
    const isSynced = isSynchronized(heldEl);
    const targetEl = isSynced ? getNetworkedEntitySync(heldEl) : heldEl;

    if (this.userinput.get(paths.actions.mediaSlideAction)) {
      interactionType = MEDIA_INTERACTION_TYPES.SLIDE;
    }

    if (interactionType !== null) {
      const component = getMediaViewComponent(heldEl);

      if (component) {
        if (isSynced && !ensureOwnership(targetEl)) return;

        if (interactionType === MEDIA_INTERACTION_TYPES.SLIDE && !this.transformSystem.transforming) {
          const rightHeld = interaction.state.rightRemote.held;

          if (rightHeld) {
            beginEphemeralCursorLock();
            interaction.state.rightRemote.constraining = false;

            this.transformSystem.startTransform(targetEl.object3D, this.rightHand.object3D, {
              mode: TRANSFORM_MODE.SLIDE
            });

            SYSTEMS.helpersSystem.setGuidePlaneMode(GUIDE_PLANE_MODES.CAMERA);
          }
        } else {
          component.handleMediaInteraction(interactionType);
        }
      }
    }
  }
}
