class AssetLoader {
    /**
     * Creates a new AssetLoader.
     */
    constructor() {}

    /**
     * Loads the specified images, textures, and audio files and dispatches a custom event when all assets have been loaded.
     * @param {string} eventName - The name of the event that is called once the assets are loaded.
     * @param {Array<Object>} assets - An array of objects where each object represents a category of assets.
     */
    loadAssets(eventName, assets = []) {
        if (typeof eventName !== 'string') {
            throw new Error('Invalid argument: eventName should be a string.');
        }
        if (!Array.isArray(assets)) {
            throw new Error('Invalid argument: assets should be an array.');
        }

        const promises = assets.map((asset, index) => {
            if (typeof asset !== 'object' || asset === null) {
                throw new Error(`Invalid argument: assets[${index}] should be an object.`);
            }
            const { type, paths, name } = asset;
            if (type !== 'image' && type !== 'audio' && type !== 'texture') {
                throw new Error(`Invalid argument: assets[${index}].type should be either 'image', 'audio' or 'texture'.`);
            }
            if (typeof name !== 'string') {
                throw new Error(`Invalid argument: assets[${index}].name should be a string.`);
            }
            if (!Array.isArray(paths) || !paths.every(path => typeof path === 'string')) {
                throw new Error(`Invalid argument: assets[${index}].paths should be an array of strings.`);
            }
            if (type === 'audio') {
                return this.#loadAudios(paths);
            } else if (type === 'texture') {
                return this.#loadTextures(paths);
            } else {
                return this.#loadImages(paths);
            }
        });

        Promise.all(promises)
            .then(loadedAssets => {
                const eventDetail = {};
                assets.forEach((asset, index) => {
                    eventDetail[asset.name] = loadedAssets[index];
                });
                const event = new CustomEvent(eventName, { detail: eventDetail });
                window.dispatchEvent(event);
            })
            .catch(error => {
                console.error("Failed to load assets: ", error);
            });
    }

    #loadImages(paths) {
        return Promise.all(paths.map(path => this.#loadImage(path)));
    }

    #loadTextures(paths) {
        return Promise.all(paths.map(path => this.#loadTexture(path)));
    }

    #loadAudios(paths) {
        return Promise.all(paths.map(path => this.#loadAudio(path)));
    }

    #loadImage(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = path;
        });
    }

    #loadTexture(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(this.#imageToTexture(img));
            img.onerror = reject;
            img.src = path;
        });
    }

    #loadAudio(path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.onloadeddata = () => resolve(audio);
            audio.onerror = reject;
            audio.src = path;
        });
    }

    /**
     * Converts an image to a texture.
     * @param {Image} image - The image to convert.
     * @returns {Object} The texture, containing the pixel data and the width and height of the image.
     */
    #imageToTexture(image) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        return {
            data: imageData.data,
            width: image.width,
            height: image.height
        };
    }      
}