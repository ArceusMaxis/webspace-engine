import { paths } from "./userinput/paths";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { canMove } from "../utils/permissions-utils";
import { isTagged } from "../components/tags";
import { isSynchronized, isMine } from "../../jel/utils/ownership-utils";
import { cloneMedia } from "../utils/media-utils";
import { setMatrixWorld } from "../utils/three-utils";

function findHandCollisionTargetForHand(bodyHelper) {
  const physicsSystem = this.el.sceneEl.systems["hubs-systems"].physicsSystem;

  const handCollisions = physicsSystem.getCollisions(bodyHelper.uuid);
  if (handCollisions) {
    for (let i = 0; i < handCollisions.length; i++) {
      const bodyData = physicsSystem.bodyUuidToData.get(handCollisions[i]);
      const object3D = bodyData && bodyData.object3D;
      if (object3D && isTagged(object3D.el, "isHandCollisionTarget")) {
        return object3D.el;
      }
    }
  }

  return null;
}

const notRemoteHoverTargets = new Map();
const remoteHoverTargets = new Map();
export function findRemoteHoverTarget(object3D, instanceId = null) {
  // If this was an instanced mesh, look up the source object3D in the relevant systems.
  let voxSource = SYSTEMS.voxSystem.getSourceForMeshAndInstance(object3D, instanceId);

  if (voxSource === null && instanceId !== null) {
    voxSource = SYSTEMS.voxmojiSystem.getSourceForMeshAndInstance(object3D, instanceId);
  }

  object3D = voxSource || object3D;

  if (!object3D) return null;
  if (notRemoteHoverTargets.get(object3D)) return null;

  const target = remoteHoverTargets.get(object3D);
  return target || findRemoteHoverTarget(object3D.parent);
}
AFRAME.registerComponent("is-remote-hover-target", {
  init: function() {
    remoteHoverTargets.set(this.el.object3D, this.el);
  },
  remove: function() {
    remoteHoverTargets.delete(this.el.object3D);
  }
});
AFRAME.registerComponent("is-not-remote-hover-target", {
  init: function() {
    notRemoteHoverTargets.set(this.el.object3D, this.el);
  },
  remove: function() {
    notRemoteHoverTargets.delete(this.el.object3D);
  }
});

export function isUI(el) {
  return isTagged(el, "singleActionButton") || isTagged(el, "holdableButton");
}

AFRAME.registerSystem("interaction", {
  updateCursorIntersection: function(intersection, left) {
    if (!left) {
      this.rightRemoteHoverTarget = intersection && findRemoteHoverTarget(intersection.object, intersection.instanceId);
      return this.rightRemoteHoverTarget;
    }

    this.leftRemoteHoverTarget = intersection && findRemoteHoverTarget(intersection.object, intersection.instanceId);
    return this.leftRemoteHoverTarget;
  },

  getActiveIntersection() {
    return (
      (this.state.rightRemote.hovered && this.rightCursorControllerEl.components["cursor-controller"].intersection) ||
      (this.state.leftRemote.hovered && this.leftCursorControllerEl.components["cursor-controller"].intersection)
    );
  },

  isHoldingAnything() {
    return !!(
      this.state.leftHand.held ||
      this.state.rightHand.held ||
      this.state.rightRemote.held ||
      this.state.leftRemote.held
    );
  },

  isHeld(el) {
    return (
      this.state.leftHand.held === el ||
      this.state.rightHand.held === el ||
      this.state.rightRemote.held === el ||
      this.state.leftRemote.held === el
    );
  },

  release(el) {
    if (this.state.leftHand.held === el) {
      this.state.leftHand.held = null;
      this.state.leftHand.constrained = true;
    }
    if (this.state.leftHand.hovered === el) {
      this.state.leftHand.hovered = null;
    }
    if (this.state.rightHand.held === el) {
      this.state.rightHand.held = null;
      this.state.rightHand.constrained = true;
    }
    if (this.state.rightHand.hovered === el) {
      this.state.rightHand.hovered = null;
    }
    if (this.state.rightRemote.held === el) {
      this.state.rightRemote.held = null;
      this.state.rightRemote.constrained = true;
    }
    if (this.state.rightRemote.hovered === el) {
      this.state.rightRemote.hovered = null;
    }
    if (this.state.leftRemote.held === el) {
      this.state.leftRemote.held = null;
      this.state.leftRemote.constrained = true;
    }
    if (this.state.leftRemote.hovered === el) {
      this.state.leftRemote.hovered = null;
    }
  },

  getRightRemoteHoverTarget() {
    return this.rightRemoteHoverTarget;
  },

  getLeftRemoteHoverTarget() {
    return this.leftRemoteHoverTarget;
  },

  init: function() {
    this.options = {
      leftHand: {
        entity: null,
        grabPath: paths.actions.leftHand.grab,
        dropPath: paths.actions.leftHand.drop,
        hoverFn: findHandCollisionTargetForHand
      },
      rightHand: {
        entity: null,
        grabPath: paths.actions.rightHand.grab,
        dropPath: paths.actions.rightHand.drop,
        hoverFn: findHandCollisionTargetForHand
      },
      rightRemote: {
        entity: null,
        grabPath: paths.actions.cursor.right.grab,
        dropPath: paths.actions.cursor.right.drop,
        hoverFn: this.getRightRemoteHoverTarget
      },
      leftRemote: {
        entity: null,
        grabPath: paths.actions.cursor.left.grab,
        dropPath: paths.actions.cursor.left.drop,
        hoverFn: this.getLeftRemoteHoverTarget
      }
    };
    this.state = {
      leftHand: {
        hovered: null,
        held: null,
        spawning: null,
        constraining: true // Can be used to disable constraints
      },
      rightHand: {
        hovered: null,
        held: null,
        spawning: null,
        constraining: true
      },
      rightRemote: {
        hovered: null,
        held: null,
        spawning: null,
        constraining: true
      },
      leftRemote: {
        hovered: null,
        held: null,
        spawning: null,
        constraining: true
      }
    };
    this.previousState = {
      leftHand: {
        hovered: null,
        held: null,
        spawning: null,
        constraining: true
      },
      rightHand: {
        hovered: null,
        held: null,
        spawning: null,
        constraining: true
      },
      rightRemote: {
        hovered: null,
        held: null,
        spawning: null,
        constraining: true
      },
      leftRemote: {
        hovered: null,
        held: null,
        spawning: null,
        constraining: true
      }
    };

    this.stateList = [this.state.leftHand, this.state.rightHand, this.state.leftRemote, this.state.rightRemote];

    this.previousStateList = [
      this.previousState.leftHand,
      this.previousState.rightHand,
      this.previousState.leftRemote,
      this.previousState.rightRemote
    ];

    waitForDOMContentLoaded().then(() => {
      this.options.leftHand.entity = document.getElementById("player-left-controller");
      this.options.rightHand.entity = document.getElementById("player-right-controller");
      this.options.rightRemote.entity = document.getElementById("right-cursor");
      this.options.leftRemote.entity = document.getElementById("left-cursor");
      this.rightCursorControllerEl = document.getElementById("right-cursor-controller");
      this.leftCursorControllerEl = document.getElementById("left-cursor-controller");
      this.ready = true;
    });
  },

  tickInteractor(options, state) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const controlPath = paths.device.keyboard.key("control");

    if (state.held) {
      const lostOwnership = isSynchronized(state.held) && !isMine(state.held);
      if (userinput.get(options.dropPath) || lostOwnership) {
        state.held = null;
        state.constraining = true;
      }
    } else {
      state.hovered = options.hoverFn.call(
        this,
        options.entity.components["body-helper"] && options.entity.components["body-helper"]
          ? options.entity.components["body-helper"]
          : null
      );
      if (state.hovered && SYSTEMS.cameraSystem.cameraViewAllowsManipulation()) {
        const entity = state.hovered;
        if (isTagged(entity, "isHoldable") && userinput.get(options.grabPath) && canMove(entity)) {
          entity.object3D.updateMatrices();

          let entityToGrab = entity;
          const shouldDuplicate = userinput.get(controlPath);

          if (shouldDuplicate) {
            entityToGrab = cloneMedia(entity, "#interactable-media", null, true, false, null, false).entity;
            setMatrixWorld(entityToGrab.object3D, entity.object3D.matrixWorld);
            entityToGrab.addEventListener(
              "media-loaded",
              () => {
                state.held = entityToGrab;
              },
              { once: true }
            );
          } else {
            state.held = entityToGrab;
          }
        }
      }
    }
  },

  tick2() {
    if (!this.el.is("entered")) return;

    const { previousStateList, stateList, options, state } = this;

    for (let i = 0, l = stateList.length; i < l; i++) {
      previousStateList[i].hovered = stateList[i].hovered;
      previousStateList[i].held = stateList[i].held;
      previousStateList[i].spawning = stateList[i].spawning;
      previousStateList[i].constraining = stateList[i].constraining;
    }

    if (options.leftHand.entity.object3D.visible && !state.leftRemote.held) {
      this.tickInteractor(options.leftHand, state.leftHand);
    }
    if (options.rightHand.entity.object3D.visible && !state.rightRemote.held) {
      this.tickInteractor(options.rightHand, state.rightHand);
    }
    if (!state.rightHand.held && !state.rightHand.hovered) {
      this.tickInteractor(options.rightRemote, state.rightRemote);
    }
    if (!state.leftHand.held && !state.leftHand.hovered) {
      this.tickInteractor(options.leftRemote, state.leftRemote);
    }
  }
});
