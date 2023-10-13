class TileCamera extends Camera {
    /**
     * Creates a new TileCamera.
     * @param {Array<Array<number>>} map - The map matrix.
     * @param {Array<{data: Uint8ClampedArray, width: number, height: number}>} images - The image array.
     * @param {Array<Light>} lights - The light sources.
     * @param {Number} tileEnlargment - How many pixels to make the tile longer and taller (helps to reduce gaps between tiles).
     */
    #map;
    #lights;
    #images;
    #zoomValue = 1; // Default zoom value
    #zoomTarget = new Vector(this.gameWidth / 2, this.gameHeight / 2);
    #tileEnglargment;
    constructor(gameWidth, gameHeight, canvasWidth, canvasHeight, fpsUpdateRate, canvasName, map, images, lights = [new Light(0, 0, 100, 1, 0.5)], tileEnlargment = 0) {
        super(gameWidth, gameHeight, canvasWidth, canvasHeight, fpsUpdateRate, canvasName);
        if (!Array.isArray(map) || !Array.isArray(map[0]) || !map.every(row => row.every(Number.isInteger))) {
            throw new Error('Invalid map: Expected a 2D array of integers.');
        }
        this.#map = map;

        if (!Array.isArray(images) || !images.every(image => image instanceof Image)) {
            throw new Error('Invalid images: Expected an array of Image objects.');
        }
        this.#images = images;

        if (!Array.isArray(lights) || !lights.every(light => light instanceof Light)) {
            throw new Error('Invalid lights: Expected an array of Light instances.');
        }
        this.#lights = lights;

        if (typeof tileEnlargment !== 'number' || tileEnlargment < 0) {
            throw new Error('Invalid tileEnlargment value: Expected a number bigger or equal than 0.');
        }
        this.#tileEnglargment = tileEnlargment;
    }

    /**
     * Fills the renderer data with tiles.
     */
    render() {   
        const tileWidth = (this.gameWidth / this.map[0].length) * this.#zoomValue;
        const tileHeight = (this.gameHeight / this.map.length) * this.#zoomValue;
    
        const offsetX = this.#zoomTarget.x * (1 - this.#zoomValue);
        const offsetY = this.#zoomTarget.y * (1 - this.#zoomValue);
    
        // Draw the tiles
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const tileIndex = this.map[y][x];
                const tileImage = this.images[tileIndex];
    
                // Calculate the exact position where the tile should be rendered.
                const renderX = (x * tileWidth) + offsetX;
                const renderY = (y * tileHeight) + offsetY;
    
                this.ctx.drawImage(tileImage, renderX, renderY, tileWidth + this.#tileEnglargment, tileHeight + this.#tileEnglargment);
            }
        }
    }    

    /**
     * Renders the lighting.
     */
    renderLighting() {
        // Create a separate canvas for the light mask
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = this.gameWidth;
        lightCanvas.height = this.gameHeight;
        const lightCtx = lightCanvas.getContext('2d');

        // Draw the light mask
        lightCtx.fillStyle = 'black';
        lightCtx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        lightCtx.globalCompositeOperation = 'xor';
        for (const light of this.lights) {
            const gradient = lightCtx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.dist);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${light.maxBrightness})`);
            gradient.addColorStop(light.gradientValue, `rgba(255, 255, 255, ${light.maxBrightness / 2})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            lightCtx.fillStyle = gradient;
            lightCtx.beginPath();
            lightCtx.arc(light.x, light.y, light.dist, 0, 2 * Math.PI);
            lightCtx.fill();
        }

        // Draw the light mask onto the main canvas
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.drawImage(lightCanvas, 0, 0, this.gameWidth, this.gameHeight);
        this.ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Adjusts the zoom level of the camera.
     * @param {number} zoomValue - The zoom multiplier. Values greater than 1 zoom in, values between 0 and 1 zoom out.
     * @param {number} targetX - The x coordinate of the zoom target.
     * @param {number} targetY - The y coordinate of the zoom target.
     */
    zoom(zoomValue, targetX, targetY) {
        if (typeof zoomValue !== 'number' || zoomValue < 1) {
            throw new Error('Invalid zoom value: Expected a number bigger or equal than 1.');
        }

        this.#zoomValue = zoomValue;
        this.#zoomTarget = new Vector(targetX, targetY);
    }

    // Getters and setters for private fields
    get map() {
        return this.#map;
    }

    get lights() {
        return this.#lights;
    }

    get images() {
        return this.#images;
    }

    /**
     * Sets the map matrix.
     * @param {Array<Array<number>>} newMap - The new map matrix.
     */
    set map(newMap) {
        if (!Array.isArray(newMap) || !Array.isArray(newMap[0]) || !newMap.every(row => row.every(Number.isInteger))) {
            throw new Error('Invalid map: Expected a 2D array of integers.');
        }
        this.#map = newMap;
    }

    /**
     * Sets the image array.
     * @param {Array<{data: Uint8ClampedArray, width: number, height: number}>} newImages - The new image array.
     */
    set images(newImages) {
        if (!Array.isArray(newImages) || !newImages.every(image => image instanceof Image)) {
            throw new Error('Invalid images: Expected an array of Image objects.');
        }
        this.#images = newImages;
    }

    /**
     * Sets the light sources.
     * @param {Array<Light>} newLights - The new light sources.
     */
    set lights(newLights) {
        if (!Array.isArray(newLights) || !newLights.every(light => light instanceof Light)) {
            throw new Error('Invalid lights: Expected an array of Light instances.');
        }
        this.#lights = newLights;
    }
}