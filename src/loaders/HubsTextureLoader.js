import nextTick from "../utils/next-tick";
const MIN_FRAMES_BETWEEN_TEXTURE_UPLOADS = 2;

function loadAsync(loader, url, onProgress) {
  return new Promise((resolve, reject) => loader.load(url, resolve, onProgress, reject));
}

let nextUploadFrame = 0;

export default class HubsTextureLoader {
  static crossOrigin = "anonymous";

  constructor(manager = THREE.DefaultLoadingManager) {
    this.manager = manager;
  }

  load(url, onLoad, onProgress, onError) {
    const texture = new THREE.Texture();

    this.loadTextureAsync(texture, url, onProgress)
      .then(onLoad)
      .catch(onError);

    return texture;
  }

  async loadTextureAsync(texture, src, onProgress) {
    let imageLoader;

    if (window.createImageBitmap !== undefined) {
      imageLoader = new THREE.ImageBitmapLoader(this.manager);
      texture.flipY = false;
    } else {
      imageLoader = new THREE.ImageLoader(this.manager);
    }

    imageLoader.setCrossOrigin(this.crossOrigin);
    imageLoader.setPath(this.path);

    const resolvedUrl = this.manager.resolveURL(src);

    const image = await loadAsync(imageLoader, resolvedUrl, onProgress);

    // Upload one texture per frame
    const frameScheduler = AFRAME.scenes[0].systems["frame-scheduler"];
    while (nextUploadFrame > frameScheduler.frameIndex) await nextTick();
    nextUploadFrame = frameScheduler.frameIndex + MIN_FRAMES_BETWEEN_TEXTURE_UPLOADS;

    texture.image = image;

    // Image was just added to cache before this function gets called, disable caching by immediatly removing it
    THREE.Cache.remove(resolvedUrl);

    texture.needsUpdate = true;

    texture.onUpdate = function() {
      // Delete texture data once it has been uploaded to the GPU
      texture.image.close && texture.image.close();
      delete texture.image;
    };

    AFRAME.scenes[0].renderer.initTexture(texture);

    return texture;
  }

  setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  }

  setPath(value) {
    this.path = value;
    return this;
  }
}
