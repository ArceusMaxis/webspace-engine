import { ensureOwnership } from "../../jel/utils/ownership-utils";
import { setMatrixWorld } from "../../hubs/utils/three-utils";
import BezierEasing from "bezier-easing";
const easeInOut = BezierEasing(0.42, 0, 0.58, 1);
const tmpVec3 = new THREE.Vector3();
const lookAtMatrix = new THREE.Matrix4();

// Used for doing in-game video direction
//
// Point at an object and hit:
//   Q to set initial track point
//   E to set final track point, object will start lerping
//   T to being viewing camera from that angle
//
// director_lerp_duration=XXXX ms of lerp
// director_track_me=false to not track avatar
export class DirectorSystem {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.trackedEl = null;
    this.trackedMatrixWorldStart = new THREE.Matrix4();
    this.trackedElLookAtMe = false;
    this.trackingCamera = false;
  }

  setTrackedObject(el) {
    this.trackedEl = el;
    const obj = el.object3D;
    obj.updateMatrices();

    this.startPos = new THREE.Vector3();
    this.startRot = new THREE.Quaternion();
    obj.matrixWorld.decompose(this.startPos, this.startRot, new THREE.Vector3());
    this.avatarPov = document.querySelector("#avatar-pov-node");
    this.viewingCamera = document.querySelector("#viewing-camera");
  }

  beginLerpingTrackedObject(duration = 3000.0, lookAtMe = true) {
    this.endPos = new THREE.Vector3();
    this.endRot = new THREE.Quaternion();
    const obj = this.trackedEl.object3D;
    obj.updateMatrices();
    obj.matrixWorld.decompose(this.endPos, this.endRot, tmpVec3);

    this.lerpDuration = duration;
    this.lerpT = 0.0;
    this.updateLerp();
    this.trackedElLookAtMe = lookAtMe;
  }

  beginTrackingCamera() {
    this.trackingCamera = true;
  }

  tick(t, dt) {
    if (!this.endPos) return;
    this.lerpT += dt;
    this.updateLerp();

    if (!this.trackingCamera) return;
    const { cameraSystem } = SYSTEMS;
    const { playerHead } = cameraSystem;
    const ikController = playerHead && playerHead.parentEl.parentEl.parentEl.parentEl.components["ik-controller"];
    const head = playerHead && playerHead.object3D;
    head.visible = true;
    head.scale.copy(ikController.headScale);
    head.updateMatrices(true, true);
    head.updateMatrixWorld(true, true);
  }

  updateLerp() {
    let t;

    if (this.lerpT >= this.lerpDuration * 2.0) {
      t = (this.lerpT - this.lerpDuration * 2.0) / this.lerpDuration;
      this.lerpT = 0.0;
    } else if (this.lerpT >= this.lerpDuration) {
      t = 1.0 - (this.lerpT - this.lerpDuration) / this.lerpDuration;
    } else {
      t = this.lerpT / this.lerpDuration;
    }

    const y = easeInOut(t);
    const pos = new THREE.Vector3();

    pos.x = (1 - y) * this.startPos.x + y * this.endPos.x;
    pos.y = (1 - y) * this.startPos.y + y * this.endPos.y;
    pos.z = (1 - y) * this.startPos.z + y * this.endPos.z;

    ensureOwnership(this.trackedEl);

    const obj = this.trackedEl.object3D;
    obj.position.copy(pos);

    if (this.trackedElLookAtMe) {
      this.avatarPov.object3D.getWorldPosition(tmpVec3);
      lookAtMatrix.lookAt(obj.position, tmpVec3, obj.up);
      obj.quaternion.setFromRotationMatrix(lookAtMatrix);
    } else {
      THREE.Quaternion.slerp(this.startRot, this.endRot, obj.quaternion, 1 - y);
    }

    obj.matrixNeedsUpdate = true;

    if (this.trackingCamera) {
      obj.visible = true;
      obj.updateMatrices(true, true);
      obj.visible = false;
      setMatrixWorld(this.viewingCamera.object3D, obj.matrixWorld);
    }
  }
}
