class TileCamera extends Camera {
    /**
     * Creates a new TileCamera.
     * @param {Array<Array<number>>} map - The map matrix.
     * @param {Array<{data: Uint8ClampedArray, width: number, height: number}>} images - The image array.
     * @param {Array<Light>} lights - The light sources.
     */
    constructor(gameWidth, gameHeight, canvasWidth, canvasHeight, fpsUpdateRate, canvasName, map, images, lights) {
        super(gameWidth, gameHeight, canvasWidth, canvasHeight, fpsUpdateRate, canvasName);
        if (!Array.isArray(map) || !Array.isArray(map[0]) || !map.every(row => row.every(Number.isInteger))) {
            throw new Error('Invalid map: Expected a 2D array of integers.');
        }
        this.map = map;

        if (!Array.isArray(images) || !images.every(image => image instanceof Image)) {
            throw new Error('Invalid images: Expected an array of Image objects.');
        }
        this.images = images;

        if (!Array.isArray(lights) || !lights.every(light => light instanceof Light)) {
            throw new Error('Invalid lights: Expected an array of Light instances.');
        }
        this.lights = lights;
    }

    /**
     * Fills the renderer data with tiles.
     */
    render() {
        const tileWidth = this.gameWidth / this.map[0].length;
        const tileHeight = this.gameHeight / this.map.length;

        // Draw the tiles
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const tileIndex = this.map[y][x];
                const tileImage = this.images[tileIndex];
                this.ctx.drawImage(tileImage, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
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
}