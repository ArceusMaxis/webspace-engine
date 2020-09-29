import avatarSheetImgSrc from "!!url-loader!../assets/images/avatar-sheet.png";
import avatarSheetBasisSrc from "!!url-loader!../assets/images/avatar-sheet.basis";
import HubsTextureLoader from "../../hubs/loaders/HubsTextureLoader";
import { createBasisTexture } from "../../hubs/utils/media-utils";
import { getCreator, getNetworkedEntity } from "../../jel/utils/ownership-utils";
import { DynamicInstancedMesh } from "../objects/DynamicInstancedMesh";
import { RENDER_ORDER } from "../../hubs/constants";
import { addVertexCurvingToShader } from "./terrain-system";
import { AvatarSphereBufferGeometry } from "../objects/avatar-sphere-buffer-geometry";

const {
  ShaderMaterial,
  Color,
  MeshBasicMaterial,
  Matrix4,
  ShaderLib,
  UniformsUtils,
  MeshToonMaterial,
  NearestFilter,
  LinearFilter,
  DataTexture,
  Vector4
} = THREE;

const USE_BASIS = true;
const MAX_ANISOTROPY = 16;

const EYE_DECAL_NEUTRAL = 0;
const EYE_DECAL_UP = 1;
const EYE_DECAL_DOWN = 2;
const EYE_DECAL_LEFT = 3;
const EYE_DECAL_RIGHT = 4;
const EYE_DECAL_BLINK1 = 5;
const EYE_DECAL_BLINK2 = 6;
const EYE_DECAL_BLINK3 = 7;
const EYE_SHIFT_DECALS = [EYE_DECAL_LEFT, EYE_DECAL_RIGHT, EYE_DECAL_UP, EYE_DECAL_DOWN];
const BLINK_TRIGGER_PROBABILITY = 0.005;
const SHIFT_TRIGGER_PROBABILITY = 0.005;
const BLINK_FRAME_DURATION_MS = 25.0;
const EYE_SHIFT_DURATION_MS = 500.0;

let toonGradientMap;

(() => {
  const colors = new Uint8Array(3);

  for (let c = 0; c <= colors.length; c++) {
    colors[c] = (c / colors.length) * 256;
  }

  toonGradientMap = new DataTexture(colors, colors.length, 1, THREE.LuminanceFormat);
  toonGradientMap.minFilter = NearestFilter;
  toonGradientMap.magFilter = NearestFilter;
  toonGradientMap.generateMipmaps = false;
})();

const IDENTITY = new Matrix4();
const ZERO = new Vector4();
ZERO.w = 0.0;
const AVATAR_RADIUS = 0.4;

const avatarMaterial = new ShaderMaterial({
  name: "avatar",
  fog: true,
  fragmentShader: ShaderLib.phong.fragmentShader,
  vertexShader: ShaderLib.phong.vertexShader,
  lights: true,
  defines: {
    ...new MeshToonMaterial().defines,
    TWOPI: 3.1415926538
  },
  uniforms: {
    ...UniformsUtils.clone(ShaderLib.phong.uniforms),
    ...{
      decalMap: {
        type: "t",
        value: null
      },
      time: { value: 0.0 }
    }
  }
});

avatarMaterial.uniforms.gradientMap.value = toonGradientMap;
avatarMaterial.uniforms.shininess.value = 0.0001;
avatarMaterial.uniforms.diffuse.value = new Color(0.5, 0.5, 0.5);

avatarMaterial.stencilWrite = true; // Avoid SSAO
avatarMaterial.stencilFunc = THREE.AlwaysStencilFunc;
avatarMaterial.stencilRef = 2;
avatarMaterial.stencilZPass = THREE.ReplaceStencilOp;

const outlineMaterial = new MeshBasicMaterial({ color: new Color(0, 0, 0) });
const highlightMaterial = new MeshBasicMaterial({ color: new Color(1, 1, 1) });

avatarMaterial.onBeforeCompile = shader => {
  // Float oscillation, vary period and freq by instance index
  const postCurveShader = [
    "gl_Position.y = gl_Position.y + sin(time * TWOPI * 0.001 * (mod(instanceIndex, 10.0) / 7.0) + instanceIndex * 7.0) * 0.025;"
  ].join("\n");

  addVertexCurvingToShader(shader, postCurveShader);

  // Add shader code to add decals
  shader.vertexShader = shader.vertexShader.replace(
    "#include <uv2_pars_vertex>",
    [
      "#include <uv2_pars_vertex>",
      "attribute vec3 instanceColor;",
      "varying vec3 vInstanceColor;",
      "uniform float time;",
      "attribute vec3 duv;",
      "varying vec3 vDuv;",
      "attribute float colorScale;",
      "varying float vColorScale;",
      "attribute vec4 duvOffset;",
      "attribute float instanceIndex;",
      "varying vec4 vDuvOffset;"
    ].join("\n")
  );

  shader.vertexShader = shader.vertexShader.replace(
    "#include <color_vertex>",
    [
      "#include <color_vertex>",
      "vDuv = duv;",
      "vDuvOffset = duvOffset;",
      "vColorScale = colorScale;",
      "vInstanceColor = instanceColor;"
    ].join("\n")
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <gradientmap_pars_fragment>",
    [
      "#include <gradientmap_pars_fragment>",
      "precision highp sampler2D;",
      "uniform sampler2D decalMap;",
      "varying vec3 vDuv;",
      "varying vec4 vDuvOffset;",
      "varying vec3 vInstanceColor;",
      "varying float vColorScale;"
    ].join("\n")
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <color_fragment>",
    ["#include <color_fragment>", "diffuseColor.rgb = vInstanceColor.rgb;"].join("\n")
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <tonemapping_fragment>",
    [
      // Refactored below: "float duOffset = vDuv.z == 0.0 ? vDuvOffset.x : vDuvOffset.z;",
      "float clampedLayer = clamp(vDuv.z, 0.0, 1.0);",
      "float duOffset = mix(vDuvOffset.x, vDuvOffset.z, clampedLayer);",
      "float dvOffset = mix(vDuvOffset.y, vDuvOffset.w, clampedLayer);",
      "vec4 texel = texture(decalMap, vec2(vDuv.x / 8.0 + duOffset / 8.0, vDuv.y / 16.0 + dvOffset / 16.0 + vDuv.z * 0.5));",
      "vec3 color = gl_FragColor.rgb * (1.0 - texel.a) + texel.rgb * texel.a;",
      "vec3 scaled = clamp(max(color * vColorScale, step(1.1, vColorScale)), 0.0, 1.0);",
      "gl_FragColor = vec4(scaled, gl_FragColor.a);",
      "#include <tonemapping_fragment>"
    ].join("\n")
  );
};

outlineMaterial.onBeforeCompile = shader => addVertexCurvingToShader(shader);
highlightMaterial.onBeforeCompile = shader => addVertexCurvingToShader(shader);

const MAX_AVATARS = 128;

// The is the number of ticks we continue to update the instance matrices of dirty
// avatars, since lerping may need to occur.
const MAX_LERP_TICKS = 30;

// Draws instanced avatar heads. IK controller now sets instanced heads to non-visible to avoid draw calls.
export class AvatarSystem {
  constructor(sceneEl, atmosphereSystem) {
    this.sceneEl = sceneEl;
    this.atmosphereSystem = atmosphereSystem;
    this.avatarEls = Array(MAX_AVATARS).fill(null);
    this.avatarCreatorIds = Array(MAX_AVATARS).fill(null);
    this.currentVisemes = Array(MAX_AVATARS).fill(-1);
    this.dirtyMatrices = Array(MAX_AVATARS).fill(0);
    this.dirtyColors = Array(MAX_AVATARS).fill(false);
    this.avatarIkControllers = Array(MAX_AVATARS).fill(null);

    this.scheduledEyeDecals = Array(MAX_AVATARS);

    for (let i = 0; i < this.scheduledEyeDecals.length; i++) {
      this.scheduledEyeDecals[i] = { t: 0.0, decal: 0, state: 0 };
    }

    for (let i = 0; i < this.currentVisemes.length; i++) {
      this.currentVisemes[i] = -1;
    }

    this.maxRegisteredIndex = -1;
    this.loadedDecals = false;

    this.createMesh();
  }

  async loadDecalMap() {
    let decalMap;

    if (USE_BASIS) {
      decalMap = (await createBasisTexture(avatarSheetBasisSrc))[0];
    } else {
      decalMap = await new HubsTextureLoader().load(avatarSheetImgSrc);
    }

    decalMap.magFilter = LinearFilter;
    decalMap.minFilter = LinearFilter;
    decalMap.anisotropy = MAX_ANISOTROPY;
    avatarMaterial.uniforms.decalMap.value = decalMap;
    avatarMaterial.uniformsNeedUpdate = true;
  }

  register(el) {
    const index = this.mesh.addInstance(ZERO, ZERO, IDENTITY);
    this.maxRegisteredIndex = Math.max(index, this.maxRegisteredIndex);
    this.avatarEls[index] = el;
    this.dirtyMatrices[index] = 0;
    this.dirtyColors[index] = true;
    this.avatarIkControllers[index] = el.components["ik-controller"];

    getNetworkedEntity(el).then(e => (this.avatarCreatorIds[index] = getCreator(e)));
  }

  unregister(el) {
    for (let i = 0; i <= this.maxRegisteredIndex; i++) {
      if (el === this.avatarEls[i]) {
        this.avatarEls[i] = null;
        this.avatarCreatorIds[i] = null;
        this.avatarIkControllers[i] = null;
        this.mesh.freeInstance(i);
        return;
      }
    }
  }

  markMatrixDirty(el) {
    for (let i = 0; i <= this.maxRegisteredIndex; i++) {
      if (this.avatarEls[i] === el) {
        this.dirtyMatrices[i] = MAX_LERP_TICKS;
        return;
      }
    }
  }

  markPersonaAvatarDirty(creatorId) {
    for (let i = 0; i <= this.maxRegisteredIndex; i++) {
      if (this.avatarCreatorIds[i] === creatorId) {
        this.dirtyColors[i] = true;
        return;
      }
    }
  }

  createMesh() {
    this.mesh = new DynamicInstancedMesh(
      new AvatarSphereBufferGeometry(AVATAR_RADIUS, MAX_AVATARS),
      avatarMaterial,
      MAX_AVATARS
    );
    this.mesh.renderOrder = RENDER_ORDER.INSTANCED_AVATAR;
    this.mesh.castShadow = true;
    this.duvOffsetAttribute = this.mesh.geometry.instanceAttributes[0][1];
    this.instanceColorAttribute = this.mesh.geometry.instanceAttributes[1][1];

    this.sceneEl.object3D.add(this.mesh);
  }

  tick(t) {
    if (!this.loadedDecals) {
      this.loadDecalMap();
      this.loadedDecals = true;
    }

    if (!avatarMaterial.uniforms.decalMap.value) return;

    avatarMaterial.uniforms.time.value = t;

    const {
      scheduledEyeDecals,
      currentVisemes,
      avatarCreatorIds,
      avatarEls,
      maxRegisteredIndex,
      duvOffsetAttribute,
      instanceColorAttribute,
      mesh,
      atmosphereSystem,
      dirtyMatrices,
      dirtyColors,
      avatarIkControllers
    } = this;

    const presenceState = window.APP.spaceChannel.presence.state;

    const nafAdapter = NAF.connection.adapter;
    let duvNeedsUpdate = false,
      instanceMatrixNeedsUpdate = false,
      instanceColorNeedsUpdate = false;

    for (let i = 0; i <= maxRegisteredIndex; i++) {
      const el = avatarEls[i];
      if (el === null) continue;

      const scheduledEyeDecal = scheduledEyeDecals[i];
      const hasScheduledDecal = scheduledEyeDecal.t > 0.0;

      if (!hasScheduledDecal) {
        this.maybeScheduleEyeDecal(t, i);
      }

      const networkId = avatarCreatorIds[i];
      const hasDirtyMatrix = dirtyMatrices[i] > 0;
      const hasEyeDecalChange = hasScheduledDecal && scheduledEyeDecal.t < t;
      const prevViseme = currentVisemes[i];

      const hasDirtyColor = dirtyColors[i];
      if (hasDirtyColor && networkId) {
        const { r, g, b } = presenceState[networkId].metas[0].profile.persona.avatar.primary_color;
        instanceColorAttribute.array[i * 3 + 0] = r;
        instanceColorAttribute.array[i * 3 + 1] = g;
        instanceColorAttribute.array[i * 3 + 2] = b;
        instanceColorNeedsUpdate = true;
        dirtyColors[i] = false;
      }

      let currentViseme = 0;

      if (nafAdapter && networkId !== null) {
        currentViseme = nafAdapter.getCurrentViseme(networkId);
      }

      const hasNewViseme = currentViseme !== prevViseme;

      if (!hasDirtyMatrix && !hasEyeDecalChange && !hasNewViseme && !hasDirtyColor) continue;

      if (hasEyeDecalChange) {
        duvOffsetAttribute.array[i * 4] = scheduledEyeDecal.decal;
        duvNeedsUpdate = true;

        this.eyeDecalStateTransition(t, i);
      }

      if (hasNewViseme) {
        currentVisemes[i] = currentViseme;

        if (currentViseme <= 7) {
          duvOffsetAttribute.array[i * 4 + 2] = currentViseme;
          duvOffsetAttribute.array[i * 4 + 3] = 0;
        } else {
          duvOffsetAttribute.array[i * 4 + 2] = currentViseme - 8;
          duvOffsetAttribute.array[i * 4 + 3] = 1;
        }

        duvNeedsUpdate = true;
      }

      if (hasDirtyMatrix) {
        const head = avatarIkControllers[i].head;

        head.updateMatrices();

        mesh.setMatrixAt(i, head.matrixWorld);
        instanceMatrixNeedsUpdate = true;

        atmosphereSystem.updateShadows();

        dirtyMatrices[i] -= 1;
      }
    }

    duvOffsetAttribute.needsUpdate = duvNeedsUpdate;
    instanceColorAttribute.needsUpdate = instanceColorNeedsUpdate;
    mesh.instanceMatrix.needsUpdate = instanceMatrixNeedsUpdate;
  }

  maybeScheduleEyeDecal(t, i) {
    const scheduledEyeDecal = this.scheduledEyeDecals[i];

    // No scheduled decal change, see if we should generate one.
    const r = Math.random();

    // First see if we will potentially schedule a blink or a shift.
    if (r > 0.5 && r - 0.5 <= BLINK_TRIGGER_PROBABILITY) {
      scheduledEyeDecal.t = t + BLINK_FRAME_DURATION_MS;
      scheduledEyeDecal.decal = EYE_DECAL_BLINK1;
    } else if (r < 0.5 && r <= SHIFT_TRIGGER_PROBABILITY) {
      scheduledEyeDecal.t = t + EYE_SHIFT_DURATION_MS;
      scheduledEyeDecal.decal = EYE_SHIFT_DECALS[Math.floor(Math.random() * EYE_SHIFT_DECALS.length)];
    }
  }

  eyeDecalStateTransition(t, i) {
    const scheduledEyeDecal = this.scheduledEyeDecals[i];
    const { decal } = scheduledEyeDecal;

    // Perform decal state machine for blink/shift
    switch (decal) {
      case EYE_DECAL_BLINK1:
        scheduledEyeDecal.t = t + BLINK_FRAME_DURATION_MS;
        scheduledEyeDecal.decal = scheduledEyeDecal.state === 0 ? EYE_DECAL_BLINK2 : EYE_DECAL_NEUTRAL;
        break;
      case EYE_DECAL_BLINK2:
        scheduledEyeDecal.t = t + BLINK_FRAME_DURATION_MS;
        scheduledEyeDecal.decal = scheduledEyeDecal.state === 0 ? EYE_DECAL_BLINK3 : EYE_DECAL_BLINK1;
        break;
      case EYE_DECAL_BLINK3:
        scheduledEyeDecal.t = t + BLINK_FRAME_DURATION_MS;
        scheduledEyeDecal.decal = EYE_DECAL_BLINK2;
        scheduledEyeDecal.state = 1; // Used to know if closing or opening eyes in blink.
        break;
      case EYE_DECAL_UP:
      case EYE_DECAL_DOWN:
      case EYE_DECAL_LEFT:
      case EYE_DECAL_RIGHT:
        scheduledEyeDecal.t = t + EYE_SHIFT_DURATION_MS;
        scheduledEyeDecal.decal = EYE_DECAL_NEUTRAL;
        break;
      case EYE_DECAL_NEUTRAL:
        // Eye now neutral, deschedule decals.
        scheduledEyeDecal.t = 0.0;
        scheduledEyeDecal.state = 0;
    }
  }
}
