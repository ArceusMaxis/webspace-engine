import { DynamicInstancedMesh } from "../objects/DynamicInstancedMesh";
import { RENDER_ORDER } from "../../hubs/constants";
import { WORLD_SIZE, VOXELS_PER_CHUNK, VOXEL_SIZE } from "./terrain-system";
import { SkyBeamBufferGeometry, BEAM_HEIGHT } from "../objects/sky-beam-buffer-geometry";
import { addVertexCurvingToShader } from "./terrain-system";

const { Color, ShaderMaterial, MeshBasicMaterial, Matrix4, ShaderLib, UniformsUtils, Vector3 } = THREE;

const IDENTITY = new Matrix4();
const ZERO = new Vector3();
const tmpPos = new Vector3();

const beamMaterial = new ShaderMaterial({
  name: "beam",
  fog: false,
  fragmentShader: ShaderLib.basic.fragmentShader,
  vertexShader: ShaderLib.basic.vertexShader,
  lights: false,
  transparent: true,
  defines: {
    ...new MeshBasicMaterial().defines
  },
  uniforms: {
    ...UniformsUtils.clone(ShaderLib.basic.uniforms)
  }
});

beamMaterial.uniforms.diffuse.value = new Color(0.5, 0.5, 0.5);

beamMaterial.stencilWrite = true; // Avoid SSAO
beamMaterial.stencilFunc = THREE.AlwaysStencilFunc;
beamMaterial.stencilRef = 2;
beamMaterial.stencilZPass = THREE.ReplaceStencilOp;

beamMaterial.onBeforeCompile = shader => {
  addVertexCurvingToShader(shader);

  // Add shader code to add decals
  shader.vertexShader = shader.vertexShader.replace(
    "#include <uv2_pars_vertex>",
    [
      "#include <uv2_pars_vertex>",
      "attribute vec3 instanceColor;",
      "varying vec3 vInstanceColor;",
      "varying float vBeamAlpha;",
      "attribute float alpha;",
      "varying float vAlpha;",
      "attribute float illumination;",
      "varying float vIllumination;",
      "attribute float xOffset;",
      "varying float vXOffset;",
      "attribute float instanceIndex;"
    ].join("\n")
  );

  shader.vertexShader = shader.vertexShader.replace(
    "#include <color_vertex>",
    [
      "#include <color_vertex>",
      "vXOffset = xOffset; vIllumination = illumination; vAlpha = alpha; vInstanceColor = instanceColor;"
    ].join("\n")
  );

  shader.vertexShader = shader.vertexShader.replace(
    "#include <fog_vertex>",
    [
      "#include <fog_vertex>",
      // Avoid clipping by clamping by far distance
      "mvPosition.z = min(mvPosition.z, gl_Position.w - 0.01);",
      "gl_Position.z = min(gl_Position.z, gl_Position.w - 0.01);",
      // Alpha increases with distance
      "vBeamAlpha = clamp(gl_Position.z * gl_Position.z / 2800.0, 0.06, 0.7);",
      // Perform offset in view space to give beam width
      "gl_Position.x = gl_Position.x + vXOffset;",
      // Clip verts to hide them if too close, to skip drawing this beam to avoid stencil buffer write.
      "gl_Position.w = gl_Position.w * step(13.5, gl_Position.z);"
    ].join("\n")
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <color_pars_fragment>",
    [
      "#include <color_pars_fragment>",
      "varying float vXOffset; varying float vIllumination; varying float vAlpha; varying vec3 vInstanceColor; varying float vBeamAlpha;"
    ].join("\n")
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <color_fragment>",
    [
      "#include <color_fragment>",
      "diffuseColor.rgb = vInstanceColor.rgb;",
      "diffuseColor.rgb = clamp(diffuseColor.rgb + vIllumination, 0.0, 1.0);"
    ].join("\n")
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <tonemapping_fragment>",
    ["gl_FragColor.a = vBeamAlpha * vAlpha;", "#include <tonemapping_fragment>"].join("\n")
  );
};

const MAX_BEAMS = 256;

// Draws instanced sky beams.
export class SkyBeamSystem {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.beamEls = Array(MAX_BEAMS).fill(null);
    this.dirtyMatrices = Array(MAX_BEAMS).fill(0);
    this.dirtyColors = Array(MAX_BEAMS).fill(false);

    this.maxRegisteredIndex = -1;

    this.createMesh();
  }

  register(el) {
    const index = this.mesh.addInstance(ZERO, IDENTITY);
    this.maxRegisteredIndex = Math.max(index, this.maxRegisteredIndex);
    this.beamEls[index] = el;
    this.dirtyMatrices[index] = 0;
    this.dirtyColors[index] = true;
  }

  unregister(el) {
    for (let i = 0; i <= this.maxRegisteredIndex; i++) {
      if (el === this.beamEls[i]) {
        this.beamEls[i] = null;
        this.mesh.freeInstance(i);
        return;
      }
    }
  }

  markMatrixDirty(el) {
    for (let i = 0; i <= this.maxRegisteredIndex; i++) {
      if (this.beamEls[i] === el) {
        this.dirtyMatrices[i] = 1;
        return;
      }
    }
  }

  createMesh() {
    this.mesh = new DynamicInstancedMesh(new SkyBeamBufferGeometry(MAX_BEAMS), beamMaterial, MAX_BEAMS);
    this.mesh.renderOrder = RENDER_ORDER.INSTANCED_BEAM;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;
    this.instanceColorAttribute = this.mesh.geometry.instanceAttributes[0][1];

    this.sceneEl.object3D.add(this.mesh);
  }

  tick() {
    const { beamEls, maxRegisteredIndex, instanceColorAttribute, mesh, dirtyMatrices, dirtyColors } = this;

    let instanceMatrixNeedsUpdate = false,
      instanceColorNeedsUpdate = false;

    for (let i = 0; i <= maxRegisteredIndex; i++) {
      const el = beamEls[i];
      if (el === null) continue;

      const hasDirtyMatrix = true; //dirtyMatrices[i] > 0;
      const hasDirtyColor = true; //dirtyColors[i];

      if (hasDirtyColor) {
        const color = { r: 0.1, g: 0.6, b: 0.8 };

        instanceColorAttribute.array[i * 3 + 0] = color.r;
        instanceColorAttribute.array[i * 3 + 1] = color.g;
        instanceColorAttribute.array[i * 3 + 2] = color.b;

        instanceColorNeedsUpdate = true;
        dirtyColors[i] = false;
      }

      if (!hasDirtyMatrix && !hasDirtyColor) continue;

      if (hasDirtyMatrix) {
        const obj = beamEls[i].object3D;

        obj.updateMatrices();

        // Set position (x, z) from object
        const x = obj.matrixWorld.elements[12];
        const y = obj.matrixWorld.elements[13];
        const z = obj.matrixWorld.elements[14];

        mesh.instanceMatrix.array[i * 16 + 12] = x;
        mesh.instanceMatrix.array[i * 16 + 13] = y + BEAM_HEIGHT / 2;
        mesh.instanceMatrix.array[i * 16 + 14] = z;

        instanceMatrixNeedsUpdate = true;

        dirtyMatrices[i] -= 1;
      }
    }

    instanceColorAttribute.needsUpdate = instanceColorNeedsUpdate;
    mesh.instanceMatrix.needsUpdate = instanceMatrixNeedsUpdate;
  }
}
