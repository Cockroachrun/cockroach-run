/**
 * AssetLoader class for Cockroach Run
 * Handles loading of 3D models, textures, sounds, and other assets
 */

export class AssetLoader {
  constructor() {
    this.models = new Map();
    this.textures = new Map();
    this.sounds = new Map();

    this.totalAssets = 0;
    this.loadedAssets = 0;

    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;

    this.gltfLoader = new THREE.GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    // For sounds, you can add an audio loader if needed
  }

  /**
   * Load multiple assets
   * @param {Object} assetManifest - { models: [], textures: [], sounds: [] }
   * @param {Function} onProgress - progress callback
   * @param {Function} onComplete - complete callback
   * @param {Function} onError - error callback
   */
  loadAssets(assetManifest, onProgress, onComplete, onError) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;

    const modelList = assetManifest.models || [];
    const textureList = assetManifest.textures || [];
    const soundList = assetManifest.sounds || [];

    this.totalAssets = modelList.length + textureList.length + soundList.length;
    this.loadedAssets = 0;

    if (this.totalAssets === 0) {
      if (this.onComplete) this.onComplete();
      return;
    }

    modelList.forEach(({ name, url }) => this.loadModel(name, url));
    textureList.forEach(({ name, url }) => this.loadTexture(name, url));
    soundList.forEach(({ name, url }) => this.loadSound(name, url));
  }

  loadModel(name, url) {
    this.gltfLoader.load(
      url,
      (gltf) => {
        this.models.set(name, gltf);
        this.assetLoaded();
      },
      undefined,
      (error) => {
        console.error(`Failed to load model ${name} from ${url}`, error);
        if (this.onError) this.onError(name, error);
        this.assetLoaded();
      }
    );
  }

  loadTexture(name, url) {
    this.textureLoader.load(
      url,
      (texture) => {
        this.textures.set(name, texture);
        this.assetLoaded();
      },
      undefined,
      (error) => {
        console.error(`Failed to load texture ${name} from ${url}`, error);
        if (this.onError) this.onError(name, error);
        this.assetLoaded();
      }
    );
  }

  loadSound(name, url) {
    // Placeholder: implement sound loading if needed
    // For now, simulate immediate load
    this.sounds.set(name, url);
    this.assetLoaded();
  }

  assetLoaded() {
    this.loadedAssets++;
    if (this.onProgress) {
      this.onProgress(this.loadedAssets, this.totalAssets);
    }
    if (this.loadedAssets === this.totalAssets) {
      if (this.onComplete) this.onComplete();
    }
  }

  getModel(name) {
    return this.models.get(name);
  }

  getTexture(name) {
    return this.textures.get(name);
  }

  getSound(name) {
    return this.sounds.get(name);
  }
}

window.AssetLoader = AssetLoader;
