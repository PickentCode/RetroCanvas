class TileCamera extends Camera {
    #map;
    #lights;
    #images;
    #zoomValue = 1; // Default zoom value
    #zoomTarget = new Vector(this.gameWidth / 2, this.gameHeight / 2);
    #tileEnlargment;
    /**
     * Creates a new TileCamera.
     * @param {Array<Array<number>>} map - The map matrix.
     * @param {Array<{data: Uint8ClampedArray, width: number, height: number}>} images - The image array.
     * @param {Array<Light>} lights - The light sources.
     * @param {Number} tileEnlargment - How many pixels to make the tile longer and taller (helps to reduce gaps between tiles).
     */
    constructor(gameWidth, gameHeight, canvasWidth, canvasHeight, canvasName, map, images, lights = [new Light(0, 0, 100, 1, 0.5)], tileEnlargment = 0) {
        super(gameWidth, gameHeight, canvasWidth, canvasHeight, canvasName);
        if (!Array.isArray(map) || !Array.isArray(map[0]) || !map.every(row => row.every(Number.isInteger))) {
            throw new Error('Invalid map: Expected a 2D array of integers.');
        }
        if (map.some(row => row.length !== map[0].length)) {
            throw new Error('Invalid map: Every row in the map has to have the same number of indices.');
        }        

        if (map.every(row => row.every(index => index >= images.length))) {
            throw new Error('Invalid map: One of the indecies is higher than the number of images provided.');
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
        this.#tileEnlargment = tileEnlargment;
    }

    /**
     * Fills the renderer data with tiles.
     */
    render() {   
        const tileWidth = (this.gameWidth / this.#map[0].length) * this.#zoomValue;
        const tileHeight = (this.gameHeight / this.#map.length) * this.#zoomValue;
    
        const offsetX = this.#zoomTarget.x * (1 - this.#zoomValue);
        const offsetY = this.#zoomTarget.y * (1 - this.#zoomValue);
    
        // Draw the tiles
        for (let y = 0; y < this.#map.length; y++) {
            for (let x = 0; x < this.#map[y].length; x++) {
                const tileIndex = this.#map[y][x];
                const tileImage = this.images[tileIndex];
    
                // Calculate the exact position where the tile should be rendered.
                const renderX = (x * tileWidth) + offsetX;
                const renderY = (y * tileHeight) + offsetY;
    
                if (renderX > this.gameWidth || renderX + tileWidth < 0 || renderY > this.gameHeight || renderY + tileHeight < 0) continue;
                this.ctx.drawImage(tileImage, renderX, renderY, tileWidth + this.#tileEnlargment, tileHeight + this.#tileEnlargment);
                //this.drawImage(tileImage, new Vector(renderX, renderY), tileWidth + this.#tileEnglargment, tileHeight + this.#tileEnglargment);
            }
        }
    }

    /**
     * Draws an object on the canvas at the specified grid position, scaled by the current zoom level.
     * The object is not drawn if it is outside the visible area of the canvas.
     * 
     * @param {number} objX - The X position of the object in grid coordinates.
     * @param {number} objY - The Y position of the object in grid coordinates.
     * @param {Image} objectImage - The image to be drawn.
     * @param {number} objectWidth - The width of the object in pixels before scaling.
     * @param {number} objectHeight - The height of the object in pixels before scaling.
     */
    drawObject(objX, objY, objectImage, objectWidth, objectHeight) {
        if (typeof objX !== 'number') {
            throw new Error('drawObject: objX must be a number.');
        }
        if (typeof objY !== 'number') {
            throw new Error('drawObject: objY must be a number.');
        }
        if (!(objectImage instanceof Image)) {
            throw new Error('drawObject: objectImage must be an instance of Image.');
        }
        if (typeof objectWidth !== 'number') {
            throw new Error('drawObject: objectWidth must be a number.');
        }
        if (typeof objectHeight !== 'number') {
            throw new Error('drawObject: objectHeight must be a number.');
        }

        // Dimensions of a tile
        const tileWidth = (this.gameWidth / this.#map[0].length) * this.#zoomValue;
        const tileHeight = (this.gameHeight / this.#map.length) * this.#zoomValue;
    
        // Offset based on the zoom target
        const offsetX = this.#zoomTarget.x * (1 - this.#zoomValue);
        const offsetY = this.#zoomTarget.y * (1 - this.#zoomValue);
    
        // Object's grid position to the canvas position
        const renderX = (objX * tileWidth) + offsetX;
        const renderY = (objY * tileHeight) + offsetY;
    
        if (renderX + objectWidth < 0 || renderX > this.gameWidth || renderY + objectHeight < 0 || renderY > this.gameHeight) {
            return;
        }
    
        const scaledObjectWidth = objectWidth * this.#zoomValue;
        const scaledObjectHeight = objectHeight * this.#zoomValue;
    
        this.ctx.drawImage(objectImage, renderX, renderY, scaledObjectWidth, scaledObjectHeight);
    }    

    /**
     * Draws an animation frame on the canvas at the specified grid position, scaled by the current zoom level.
     * The frame is not drawn if it is outside the visible area of the canvas.
     * Optionally, the image can be reflected along the X and/or Y axis.
     * 
     * @param {number} objX - The X position of the object in grid coordinates.
     * @param {number} objY - The Y position of the object in grid coordinates.
     * @param {Image} animationFrame - The animation frame to be drawn.
     * @param {number} width - The width of the frame in pixels before scaling.
     * @param {number} height - The height of the frame in pixels before scaling.
     * @param {boolean} [reflectX=false] - Whether to reflect the image along the X axis.
     * @param {boolean} [reflectY=false] - Whether to reflect the image along the Y axis.
     */
    drawAnimation(objX, objY, animationFrame, width, height, reflectX = false, reflectY = false) {
        if (typeof objX !== 'number') {
            throw new Error('drawAnimation: objX must be a number.');
        }
        if (typeof objY !== 'number') {
            throw new Error('drawAnimation: objY must be a number.');
        }
        if (!(animationFrame instanceof AnimationFrame)) {
            throw new Error('drawAnimation: animationFrame must be an instance of AnimationFrame.');
        }
        if (typeof width !== 'number') {
            throw new Error('drawAnimation: width must be a number.');
        }
        if (typeof height !== 'number') {
            throw new Error('drawAnimation: height must be a number.');
        }
        if (typeof reflectX !== 'boolean') {
            throw new Error('drawAnimation: reflectX must be a boolean.');
        }
        if (typeof reflectY !== 'boolean') {
            throw new Error('drawAnimation: reflectY must be a boolean.');
        }

        // Dimensions of a tile
        const tileWidth = (this.gameWidth / this.#map[0].length) * this.#zoomValue;
        const tileHeight = (this.gameHeight / this.#map.length) * this.#zoomValue;
    
        // Offset based on the zoom target
        const offsetX = this.#zoomTarget.x * (1 - this.#zoomValue);
        const offsetY = this.#zoomTarget.y * (1 - this.#zoomValue);
    
        // Object's grid position to the canvas position
        const renderX = (objX * tileWidth) + offsetX;
        const renderY = (objY * tileHeight) + offsetY;
    
        if (renderX + width < 0 || renderX > this.gameWidth || renderY + height < 0 || renderY > this.gameHeight) {
            return;
        }
    
        const scaledObjectWidth = width * this.#zoomValue;
        const scaledObjectHeight = height * this.#zoomValue;
    
        this.drawAnimationFrame(animationFrame, new Vector(renderX, renderY), scaledObjectWidth, scaledObjectHeight, 0, reflectX, reflectY);
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
        if (!(target instanceof Vector)) {
            throw new Error("Target should be a Vector.");
        }

        this.#zoomValue = zoomValue;
        this.#zoomTarget = target.copy();
    }

    /**
     * Set a specific tile value in the map at the given x and y coordinates.
     * 
     * @param {number} x - The x-coordinate of the tile. Must be a whole number.
     * @param {number} y - The y-coordinate of the tile. Must be a whole number.
     * @param {number} value - The value to set for the tile. Must be a whole number.
     * 
     * @throws {Error} If any parameter is not a number or if they are not whole numbers greater than or equal to 1.
     */
    setTile(x, y, value) {
        if (typeof x !== 'number' || x < 1 || x !== Math.floor(x)) {
            throw new Error('Invalid x-coordinate: Expected a whole number greater than or equal to 1.');
        }
        if (typeof y !== 'number' || y < 1 || y !== Math.floor(y)) {
            throw new Error('Invalid y-coordinate: Expected a whole number greater than or equal to 1.');
        }
        if (typeof value !== 'number' || value !== Math.floor(value)) {
            throw new Error('Invalid tile value: Expected a whole number.');
        }
        this.#map[~~y][~~x] = ~~value;
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

    get zoomValue() {
        return this.#zoomValue;
    }

    get zoomTarget() {
        return this.#zoomTarget;
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