const { Mesh, MeshStandardMaterial, Vector3, VertexColors, BufferGeometry, Box3, BufferAttribute, Object3D } = THREE;
const material = new MeshStandardMaterial({ vertexColors: VertexColors, metalness: 0, roughness: 1 });
const tmp = new Vector3();

const setVertexColor = shader => {
  shader.vertexShader = shader.vertexShader.replace("#include <color_vertex>", "vColor.xyz = color.xyz / 255.0;");
};

material.onBeforeCompile = setVertexColor;

class Terrain extends Object3D {
  constructor() {
    super();
    const mesh = new Mesh(new BufferGeometry(), material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.add(mesh);
    this.mesh = mesh;
    this.worldAABB = new Box3();
    this.frustumCulled = false;
    this.heightmap = new Uint8Array(64 * 64);
  }

  update({ chunk, geometries }) {
    const { mesh } = this;
    this.chunk = chunk;
    this.matrixNeedsUpdate = true;

    const { color, position, uv, normal } = geometries.opaque;
    if (!position.length) {
      mesh.visible = false;
    }

    const { geometry } = mesh;

    geometry.setAttribute("color", new BufferAttribute(color, 3));
    geometry.setAttribute("position", new BufferAttribute(position, 3));
    geometry.setAttribute("uv", new BufferAttribute(uv, 2));
    geometry.setAttribute("normal", new BufferAttribute(normal, 3));
    {
      const len = (position.length / 3 / 4) * 6;
      const index = new Uint16Array(len);
      for (let i = 0, v = 0; i < len; i += 6, v += 4) {
        index[i] = v;
        index[i + 1] = v + 1;
        index[i + 2] = v + 2;
        index[i + 3] = v + 2;
        index[i + 4] = v + 3;
        index[i + 5] = v;
      }
      geometry.setIndex(new BufferAttribute(index, 1));
    }

    mesh.visible = true;

    this.updateHeightmap({ chunk, geometry });

    this.getWorldPosition(tmp);
    this.worldAABB.min.x = tmp.x;
    this.worldAABB.max.x = tmp.x + 8;
    this.worldAABB.min.z = tmp.z;
    this.worldAABB.max.z = tmp.z + 8;
    this.worldAABB.min.y = 0;
    this.worldAABB.max.y = chunk.height / 8 + 1 / 8;
  }

  updateHeightmap({ chunk, geometry }) {
    const { heightmap } = this;
    const aux = { x: 0, y: 0, z: 0 };
    const position = geometry.getAttribute("position");
    const uv = geometry.getAttribute("uv");
    const { count } = uv;
    const offsetY = chunk.y * 16;
    for (let i = 0; i < count; i += 4) {
      if (uv.getY(i) === 0) {
        aux.x = 0xff;
        aux.y = 0;
        aux.z = 0xff;
        for (let j = 0; j < 4; j += 1) {
          aux.x = Math.min(aux.x, Math.floor(position.getX(i + j) / 8));
          aux.y = Math.max(aux.y, offsetY + Math.ceil(position.getY(i + j) / 8));
          aux.z = Math.min(aux.z, Math.floor(position.getZ(i + j) / 8));
        }
        const index = aux.x * 64 + aux.z;
        heightmap[index] = Math.max(heightmap[index], aux.y);
      }
    }
  }

  dispose() {
    const { mesh, geometry } = this;
    geometry.dispose();
    mesh.geometry.dispose();
  }
}

export default Terrain;
