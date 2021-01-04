import { waitForDOMContentLoaded } from "../utils/async-utils";

export const offsetRelativeTo = (() => {
  const y = new THREE.Vector3(0, 1, 0);
  const z = new THREE.Vector3(0, 0, -1);
  const QUARTER_CIRCLE = Math.PI / 2;
  const offsetVector = new THREE.Vector3();
  const targetWorldPos = new THREE.Vector3();

  return function(
    obj,
    target,
    offset,
    lookAt = false,
    orientation = 1,
    parent = null,
    outPos = null,
    outQuaternion = null
  ) {
    if (parent === null) {
      parent = obj.parent;
    }

    if (outPos === null) {
      outPos = obj.position;
      if (orientation !== 1 || lookAt) throw new Error("Orientation/lookAt on non-object target not supported");
    }

    if (outQuaternion === null) {
      outQuaternion = obj.quaternion;
      if (orientation !== 1 || lookAt) throw new Error("Orientation/lookAt on non-object target not supported");
    }

    offsetVector.copy(offset);
    target.localToWorld(offsetVector);
    if (parent) {
      parent.worldToLocal(offsetVector);
    }
    outPos.copy(offsetVector);
    if (lookAt) {
      target.getWorldPosition(targetWorldPos);
      obj.updateMatrices(true);
      obj.lookAt(targetWorldPos);
    } else {
      target.getWorldQuaternion(outQuaternion);
    }

    // See doc/image_orientations.gif
    switch (orientation) {
      case 8:
        obj.rotateOnAxis(z, 3 * QUARTER_CIRCLE);
        break;
      case 7:
        obj.rotateOnAxis(z, 3 * QUARTER_CIRCLE);
        obj.rotateOnAxis(y, 2 * QUARTER_CIRCLE);
        break;
      case 6:
        obj.rotateOnAxis(z, QUARTER_CIRCLE);
        break;
      case 5:
        obj.rotateOnAxis(z, QUARTER_CIRCLE);
        obj.rotateOnAxis(y, 2 * QUARTER_CIRCLE);
        break;
      case 4:
        obj.rotateOnAxis(z, 2 * QUARTER_CIRCLE);
        obj.rotateOnAxis(y, 2 * QUARTER_CIRCLE);
        break;
      case 3:
        obj.rotateOnAxis(z, 2 * QUARTER_CIRCLE);
        break;
      case 2:
        obj.rotateOnAxis(y, 2 * QUARTER_CIRCLE);
        break;
      case 1:
      default:
        break;
    }

    if (obj) {
      obj.matrixNeedsUpdate = true;
    }
  };
})();

/**
 * Positions an entity relative to a given target when the given event is fired.
 * @component offset-relative-to
 */
AFRAME.registerComponent("offset-relative-to", {
  schema: {
    target: {
      type: "selector"
    },
    offset: {
      type: "vec3"
    },
    on: {
      type: "string"
    },
    orientation: {
      default: 1 // see doc/image_orientations.gif
    },
    selfDestruct: {
      default: false
    },
    lookAt: {
      default: false
    }
  },
  init() {
    this.updateOffset = this.updateOffset.bind(this);

    waitForDOMContentLoaded().then(() => {
      if (this.data.on) {
        this.el.sceneEl.addEventListener(this.data.on, this.updateOffset);
      } else {
        this.updateOffset();
      }
    });
  },

  updateOffset: function() {
    const { target, offset, lookAt, orientation } = this.data;
    const obj = this.el.object3D;
    offsetRelativeTo(obj, target.object3D, offset, lookAt, orientation);

    if (this.data.selfDestruct) {
      if (this.data.on) {
        this.el.sceneEl.removeEventListener(this.data.on, this.updateOffset);
      }
      this.el.removeAttribute("offset-relative-to");
    }
  }
});
