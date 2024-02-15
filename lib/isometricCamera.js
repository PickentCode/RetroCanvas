class IsometricCamera extends Camera {
    #map;
    #images;
    #tileEnlargement;
    #zoomValue = 1; // Default zoom level is 1 (no zoom)
    #zoomTarget = new Vector(this.gameWidth / 2, this.gameHeight / 2);

    /**
     * Represents an Isometric Camera with capabilities to render a game map with zoom and tile enlargement features.
     * Extends the Camera class to utilize basic camera functionalities with additional isometric-specific properties.
     * 
     * @param {number} gameWidth - The width of the game world.
     * @param {number} gameHeight - The height of the game world.
     * @param {number} canvasWidth - The width of the canvas on which the game is rendered.
     * @param {number} canvasHeight - The height of the canvas on which the game is rendered.
     * @param {string} canvasName - The identifier for the canvas element.
     * @param {Array} map - The game map represented as a 2D array.
     * @param {Array} images - An array containing image assets used in rendering the map.
     * @param {number} [tileEnlargement=0] - Optional enlargement factor for the tiles.
     */
    constructor(gameWidth, gameHeight, canvasWidth, canvasHeight, canvasName, map, images, tileEnlargement = 0) {
        super(gameWidth, gameHeight, canvasWidth, canvasHeight, canvasName);

        // Validate numeric parameters
        if (![gameWidth, gameHeight, canvasWidth, canvasHeight, tileEnlargement].every(Number.isFinite)) {
            throw new Error("IsometricCamera constructor: gameWidth, gameHeight, canvasWidth, canvasHeight, and tileEnlargement must be numbers.");
        }
        
        // Validate non-numeric parameters
        if (typeof canvasName !== 'string') {
            throw new Error("IsometricCamera constructor: canvasName must be a string.");
        }
        if (!Array.isArray(map) || !Array.isArray(map[0]) || !map.every(row => row.every(Number.isInteger))) {
            throw new Error('Invalid map: Expected a 2D array of integers.');
        }
        if (map.some(row => row.length !== map[0].length)) {
            throw new Error('Invalid map: Every row in the map has to have the same number of indices.');
        }        

        if (map.every(row => row.every(index => index >= images.length))) {
            throw new Error('Invalid map: One of the indecies is higher than the number of images provided.');
        }

        if (!Array.isArray(images) || !images.every(image => image instanceof Image)) {
            throw new Error('Invalid images: Expected an array of Image objects.');
        }

        this.#map = map;
        this.#images = images;
        this.#tileEnlargement = tileEnlargement;
    }

    #calculateIsometricPositioning() {
        const tileBaseWidth = this.gameWidth / this.#map[0].length;
        const tileBaseHeight = tileBaseWidth / 2; // 2:1 ratio for isometric tiles
        const tileWidth = tileBaseWidth * this.#zoomValue;
        const tileHeight = tileBaseHeight * this.#zoomValue;
    
        // Center of the map in isometric coordinates
        const mapCenterX = (this.#map[0].length - this.#map.length) * tileWidth / 4;
        const mapCenterY = (this.#map[0].length + this.#map.length) * tileHeight / 4;
    
        // Adjust offset for zoom, focusing on the zoom target
        const offsetX = (this.gameWidth / 2 - mapCenterX) - (this.#zoomTarget.x - this.gameWidth / 2) * (this.#zoomValue - 1);
        const offsetY = (this.gameHeight / 2 - mapCenterY) - (this.#zoomTarget.y - this.gameHeight / 2) * (this.#zoomValue - 1);
    
        return { tileWidth, tileHeight, offsetX, offsetY };
    }

    /**
     * Renders the game map using the tile images stored in the #images property.
     * Tiles are drawn in an isometric perspective based on the #map array.
     */
    render() {
        const { tileWidth, tileHeight, offsetX, offsetY } = this.#calculateIsometricPositioning();
    
        for (let y = 0; y < this.#map.length; y++) {
            for (let x = 0; x < this.#map[y].length; x++) {
                const tileIndex = this.#map[y][x];
                const tileImage = this.#images[tileIndex];
    
                const isoX = (x - y) * tileWidth / 2;
                const isoY = (x + y) * tileHeight / 2;
    
                const renderX = isoX + offsetX;
                const renderY = isoY + offsetY;
    
                const drawWidth = tileWidth + this.#tileEnlargement;
    
                if (renderX + tileWidth < 0 || renderX - drawWidth > this.gameWidth || renderY + tileHeight < 0 || renderY > this.gameHeight) continue;
    
                this.ctx.drawImage(tileImage, renderX - drawWidth / 2, renderY, drawWidth, tileHeight + this.#tileEnlargement);
            }
        }
    }

    /**
     * Draws an object on the isometric map at specified grid coordinates.
     * 
     * @param {number} objX - The X position of the object in grid coordinates.
     * @param {number} objY - The Y position of the object in grid coordinates.
     * @param {Image} objectImage - The image of the object to draw.
     * @param {number} [sizeX=1] - The horizontal size multiplier for the object.
     * @param {number} [sizeY=1] - The vertical size multiplier for the object.
     * @param {boolean} [adjustAspectRatio=false] - Adjusts the aspect ratio to match tile height if true.
     */
    drawObject(objX, objY, objectImage, sizeX = 1, sizeY = 1, adjustAspectRatio = false) {
        if (typeof objX !== 'number' || typeof objY !== 'number' ||
            typeof sizeX !== 'number' || typeof sizeY !== 'number') {
            throw new Error('drawObject: objX, objY, sizeX, sizeY must be numbers.');
        }

        if (!(objectImage instanceof Image)) {
            throw new Error('drawObject: objectImage must be instance of Image.');
        }

        if (typeof adjustAspectRatio !== 'boolean') {
            throw new Error('drawObject: adjustedAspectRatio must be boolean.');
        }

        const { tileWidth, tileHeight, offsetX, offsetY } = this.#calculateIsometricPositioning();
    
        const isoX = (objX - objY) * tileWidth / 2;
        const isoY = (objX + objY) * tileHeight / 2;
    
        // Adjusted for object size and aspect ratio
        let drawWidth = tileWidth * sizeX;
        let drawHeight = adjustAspectRatio ? tileHeight : tileWidth;
        drawHeight *= sizeY;
        const renderX = isoX + offsetX;
        const renderY = isoY + offsetY;
    
        // Render the tile with potential enlargement to fill gaps
        let drawY = adjustAspectRatio ? 0 : drawHeight / 2;
        this.ctx.drawImage(objectImage, renderX - drawWidth / 2, renderY - drawY, drawWidth, drawHeight);
    }

    /**
     * Draws an animated object on the isometric map, potentially with reflection and aspect ratio adjustment.
     * 
     * @param {number} objX - The X position of the animated object in grid coordinates.
     * @param {number} objY - The Y position of the animated object in grid coordinates.
     * @param {Image} animationFrame - The current frame of the animation to draw.
     * @param {number} [sizeX=1] - The horizontal size multiplier for the animation.
     * @param {number} [sizeY=1] - The vertical size multiplier for the animation.
     * @param {boolean} [adjustAspectRatio=false] - Adjusts the aspect ratio to match tile height if true.
     * @param {boolean} [reflectX=false] - Reflects the animation frame along the X-axis if true.
     * @param {boolean} [reflectY=false] - Reflects the animation frame along the Y-axis if true.
     */
    drawAnimation(objX, objY, animationFrame, sizeX = 1, sizeY = 1, adjustAspectRatio = false, reflectX = false, reflectY = false) {
        if (typeof objX !== 'number' || typeof objY !== 'number' ||
            typeof sizeX !== 'number' || typeof sizeY !== 'number') {
            throw new Error('drawObject: objX, objY, sizeX, sizeY must be numbers.');
        }

        if (!(animationFrame instanceof AnimationFrame)) {
            throw new Error('drawObject: animationFrame must be instance of AnimationFrame.');
        }

        if (typeof adjustAspectRatio !== 'boolean' || typeof reflectX !== 'boolean' || typeof reflectY !== 'boolean') {
            throw new Error('drawObject: adjustedAspectRatio, reflectX, reflectY must be booleans.');
        }
        
        const { tileWidth, tileHeight, offsetX, offsetY } = this.#calculateIsometricPositioning();
    
        const isoX = (objX - objY) * tileWidth / 2;
        const isoY = (objX + objY) * tileHeight / 2;
    
        // Adjusted for object size and aspect ratio
        let drawWidth = tileWidth * sizeX;
        let drawHeight = adjustAspectRatio ? tileHeight : tileWidth;
        drawHeight *= sizeY;
        const renderX = isoX + offsetX;
        const renderY = isoY + offsetY;
    
        // Render the tile with potential enlargement to fill gaps
        let drawY = adjustAspectRatio ? 0 : drawHeight / 2;
        this.drawAnimationFrame(animationFrame, new Vector(renderX, renderY - drawY), drawWidth, drawHeight, 0, reflectX, reflectY);
    }
    
    /**
     * Adjusts the zoom level of the camera.
     * @param {number} zoomValue - The zoom multiplier. Values greater than 1 zoom in, values between 0 and 1 zoom out.
     * @param {number} targetX - The x coordinate of the zoom target.
     * @param {number} targetY - The y coordinate of the zoom target.
     */
    zoom(zoomValue, target) {
        if (typeof zoomValue !== 'number' || zoomValue < 1) {
            throw new Error("Invalid zoom value: Expected a number bigger or equal than 1.");
        }
        if (!(target instanceof Vector)) {
            throw new Error("Target should be a Vector.");
        }

        this.#zoomValue = zoomValue;
        this.#zoomTarget = target.copy();
    }

    /**
     * Retrieves the value at a specific coordinate in the map.
     * Throws an error if the coordinates are out of the map's bounds.
     * 
     * @param {number} x - The x coordinate of the tile to retrieve.
     * @param {number} y - The y coordinate of the tile to retrieve.
     * @returns {*} The value at the given coordinates in the map.
     */
    getTile(x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error("getTile: Coordinates must be numbers.");
        }
        if (x < 0 || y < 0 || y >= this.#map.length || x >= this.#map[y].length) {
            throw new Error("Invalid tile coordinates");
        }
        return this.#map[y][x];
    }

    /**
     * Sets the value at a specific coordinate in the map.
     * Throws an error if the coordinates are out of the map's bounds or if the value is invalid.
     * 
     * @param {number} x - The x coordinate of the tile to set.
     * @param {number} y - The y coordinate of the tile to set.
     * @param {*} value - The value to set at the given coordinates in the map.
     */
    setTile(x, y, value) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error("getTile: Coordinates must be numbers.");
        }
        if (x < 0 || y < 0 || y >= this.#map.length || x >= this.#map[y].length) {
            throw new Error("Invalid tile coordinates");
        }
        this.#map[y][x] = value;
    }


    // Getters and setters for private fields


    /**
     * Gets the current game map.
     * @returns {Array} The game map as a 2D array.
     */
    get map() {
        return this.#map;
    }

   /**
     * Gets the current images array.
     * @returns {Array} The array containing image assets used in rendering the map.
     */
    get images() {
        return this.#images;
    }

    /**
     * Gets the current zoom value.
     * @returns {number} The zoom value.
     */
    get zoomValue() {
        return this.#zoomValue;
    }

    /**
     * Gets the current zoom target.
     * @returns {Vector} The zoom target position.
     */
    get zoomTarget() {
        return this.#zoomTarget;
    }

    /**
     * Sets a new game map.
     * @param {Array} newMap - The new map to set as the game map.
     */
    set map(newMap) {
        if (!Array.isArray(newMap) || !newMap.every(row => Array.isArray(row))) {
            throw new Error("set map: newMap must be a 2D array.");
        }
        this.#map = newMap;
    }

    /**
     * Sets a new images array.
     * @param {Array} newImages - The new array of images to be used for rendering.
     */
    set images(newImages) {
        if (!Array.isArray(newImages) || !newImages.every(img => img instanceof Image)) {
            throw new Error("set images: newImages must be an array of Image instances.");
        }
        this.#images = newImages;
    }
}