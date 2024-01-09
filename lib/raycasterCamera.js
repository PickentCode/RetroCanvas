class RaycasterCamera extends Camera {

    #map;
    #floorMap;
    #ceilingMap;
    #wallTextures;
    #floorTextures;
    #floorTexture;
    #ceilingTextures;
    #ceilingTexture;
    #lightTravelDist;
    #maxLightVal;
    #rayLength;
    #position;
    #lookOffsetZ;
    #rotation;
    #velocity;
    #friction;
    #fov;
    #blockSize;
    #playerHeight;
    #distFromPlayerToProjectionPlane;
    #camWallGapFactor;
    #rays;
    #cellSize;

    constructor(gameWidth, gameHeight, canvasWidth, canvasHeight, canvasName, map, floorMap, ceilingMap, wallTextures, floorTextures, ceilingTextures, position, rotation = 0, friction = 5, fov = 60, blockSize = 32) {
        if (!Array.isArray(wallTextures) || !wallTextures.every(image => image instanceof Image)) {
            throw new Error('Invalid images: Expected an array of Image objects.');
        }

        if (!Array.isArray(map) || !Array.isArray(map[0]) || !map.every(row => row.every(Number.isInteger))) {
            throw new Error('Invalid map: Expected a 2D array of integers.');
        }

        if (map.some(row => row.length !== map[0].length)) {
            throw new Error('Invalid map: Every row in the map has to have the same number of indices.');
        }

        if (map.every(row => row.every(index => index >= wallTextures.length))) {
            throw new Error('Invalid map: One of the indecies is higher than the number of images provided.');
        }

        if (!(position instanceof Vector)) {
            throw new Error('Invalid position: Expected a Vector object.');
        }

        if (typeof rotation !== 'number') {
            throw new Error('Invalid rotation: Expected a number.');
        }

        // For raycaster, the gameHeight has to be dividable by 2
        const adjustedGameHeight = ~~gameHeight % 2 == 0 ? ~~gameHeight : ~~gameHeight+1;
        super(gameWidth, adjustedGameHeight, canvasWidth, canvasHeight, canvasName);
        this.#map = map;
        this.#floorMap = floorMap;
        this.#ceilingMap = ceilingMap;
        this.#wallTextures = wallTextures;
        this.#floorTextures = floorTextures;
        this.#ceilingTextures = ceilingTextures;
        this.#lightTravelDist = blockSize * 10;
        this.#maxLightVal = 1;
        this.#rayLength = blockSize * 11;
        this.#position = position;
        this.#rotation = rotation;
        this.#lookOffsetZ = 0;
        this.#velocity = new Vector(0, 0);
        this.#friction = GameMath.clamp(friction, 0, 10);
        this.#fov = fov;
        this.#blockSize = blockSize;
        this.#playerHeight = ~~(blockSize / 2);
        this.#distFromPlayerToProjectionPlane = ((this.gameWidth / 2) / Math.tan((fov / 2) * Math.PI / 180));
        this.#camWallGapFactor = 2;
        this.#rays = [];
        this.initializeRays();
    }

    initializeRays() {
        const totalRays = this.gameWidth;
        const angleBetweenRays = this.#fov / totalRays;
        let currentAngle = -(this.#fov / 2) + this.#rotation;

        for (let i = 0; i < totalRays; i++) {
            currentAngle += angleBetweenRays;
            const dirX = Math.cos(GameMath.degreesToRadians(currentAngle));
            const dirY = Math.sin(GameMath.degreesToRadians(currentAngle));
            const ray = new Ray(this.#position, new Vector(dirX, dirY), this.#rayLength, this.#blockSize, this.#map);
            this.#rays.push(ray);
        }
    }

    updateRays() {
        const deltaTime = this.getDeltaTime();
        const totalRays = this.#rays.length;
        const angleBetweenRays = this.#fov / totalRays;
        let currentAngle = -(this.#fov / 2) + this.#rotation;
        for (let i = 0; i < totalRays; i++) {
            currentAngle += angleBetweenRays;
            const dirX = Math.cos(GameMath.degreesToRadians(currentAngle));
            const dirY = Math.sin(GameMath.degreesToRadians(currentAngle));
            this.#rays[i].updateData(this.#position, new Vector(dirX, dirY));
        }
    
        // Apply friction and scale the velocity by deltaTime
        const reductionFactor = Math.exp(-this.#friction * deltaTime);
        this.#velocity.mult(reductionFactor);
    
        // Calculate future position and check if it's within bounds
        const dirX = this.#velocity.x > 0 ? 1 : -1;
        const dirY = this.#velocity.y > 0 ? 1 : -1;
        const gapFactor = this.#camWallGapFactor;
    
        let moveFactorX = this.#map[~~((this.#position.y) / this.#blockSize)][~~((this.#position.x + this.#velocity.x * deltaTime + gapFactor * dirX) / this.#blockSize)] == 0 ? 1 : 0;
        moveFactorX *= (this.#position.x + this.#velocity.x * deltaTime + gapFactor >= (this.#map[0].length - 1) * this.#blockSize) || (this.#position.x + this.#velocity.x * deltaTime - gapFactor <= 0) ? 0 : 1;
    
        let moveFactorY = this.#map[~~((this.#position.y + this.#velocity.y * deltaTime + gapFactor * dirY) / this.#blockSize)][~~((this.#position.x) / this.#blockSize)] == 0 ? 1 : 0;
        moveFactorY *= (this.#position.y + this.#velocity.y * deltaTime + gapFactor >= (this.#map.length - 1) * this.#blockSize) || (this.#position.y + this.#velocity.y * deltaTime - gapFactor <= 0) ? 0 : 1;
    
        // Scale the velocity by the move factors to prevent movement through walls
        this.#velocity.mult(new Vector(moveFactorX, moveFactorY));
    
        // Scale the position change by deltaTime to make movement frame-rate independent
        this.#position.add(this.#velocity.copy().mult(deltaTime));
    }
    

    move(speed) {
        const deltaTime = this.getDeltaTime();
        const force = new Vector(Math.cos(GameMath.degreesToRadians(this.#rotation)), Math.sin(GameMath.degreesToRadians(this.#rotation)));
        // Multiply the speed by deltaTime to ensure consistent movement across different frame rates
        force.mult(speed * deltaTime);
        this.#velocity.add(force);
    }
    
    rotate(speed) {
        const deltaTime = this.getDeltaTime();
        // Multiply the speed by deltaTime to ensure consistent rotation across different frame rates
        this.#rotation += speed * deltaTime;
    }
    
    strafe(speed) {
        const deltaTime = this.getDeltaTime();
        const force = new Vector(Math.cos(GameMath.degreesToRadians(this.#rotation + 90)), Math.sin(GameMath.degreesToRadians(this.#rotation + 90)));
        // Multiply the speed by deltaTime to ensure consistent strafing across different frame rates
        force.mult(speed * deltaTime);
        this.#velocity.add(force);
    }

    tilt(speed) {
        const deltaTime = this.getDeltaTime();
        const maxTiltValue = this.gameHeight / 2;
        // Multiply the speed by deltaTime to ensure consistent tilt across different frame rates
        this.#lookOffsetZ = GameMath.clamp(this.#lookOffsetZ + (speed * deltaTime), -maxTiltValue, maxTiltValue);
    }

    /**
     * Draws the map in pseudo 3D.
    */
    render3D() {
        this.updateRays();
        this.#renderFloorAndCeiling();
        this.#renderWalls();
    }
    
    #renderWalls() {
        for (let column = 0; column < this.#rays.length; column++) {
            const hitPosition = this.#rays[column].cast(this.#map);
            if (hitPosition) {
                let distHit = Math.sqrt(Math.pow(hitPosition.x - this.#position.x, 2) + Math.pow(hitPosition.y - this.#position.y, 2));
                // Calculate the angle of the ray relative to the player's view direction
                let rayAngle = this.#rotation + (column / this.gameWidth - 0.5) * this.#fov;
                // Convert to radians
                rayAngle = GameMath.degreesToRadians(rayAngle);
                // Calculate the actual distance to the wall without the fisheye effect
                distHit = distHit * Math.cos(rayAngle - GameMath.degreesToRadians(this.#rotation));
    
                const sliceHeight = ~~(this.#blockSize / distHit * this.#distFromPlayerToProjectionPlane);
                let drawHeight = sliceHeight;
                let startY = this.gameHeight / 2 - drawHeight / 2;
                
                // Fake looking up and down.
                startY += this.#lookOffsetZ;                
    
                // Determine the texture to use
                const adjustedHit = Vector.mult(hitPosition, 0.00001);
                const textureIndex = this.#map[~~(adjustedHit.y / this.#blockSize)][~~(adjustedHit.x / this.#blockSize)];
                const texture = this.#wallTextures[textureIndex-1];
                if (!texture) {
                    //console.log(Math.floor(hitPosition.y / this.#blockSize) + ", " + Math.floor(hitPosition.x / this.#blockSize));
                    continue;
                }
    
                // Calculate texture coordinates
                let textureX;
                if (this.#rays[column].hitSide === 2) { // Vertical wall
                    textureX = hitPosition.x % this.#blockSize;
                } else { // Horizontal wall
                    textureX = hitPosition.y % this.#blockSize;
                }
                textureX = ~~(textureX * (texture.width / this.#blockSize));
    
                // Calculate the texture slice to draw based on the distance to the wall
                let textureY = 0;
                let textureHeight = texture.height;
    
                // Draw the floor and ceiling before the walls.
    
                // Draw the textured wall slice
                this.ctx.drawImage(
                    texture,
                    textureX, textureY, 1, textureHeight, // Source rectangle
                    column, startY, 1, drawHeight // Destination rectangle
                    );
    
                // Apply shading and lighting
                const lightingVal = GameMath.remap(distHit, 0, this.#lightTravelDist, 1 - this.#maxLightVal, 1);
                const shadeFactor = this.#rays[column].hitSide == 2 ? 0 : this.#maxLightVal * 0.3; // Darken more if the hit side is 2
                //this.ctx.fillStyle = "rgba(0, 0, 0, + " + lightingVal * shadeFactor + ")";
                this.ctx.fillStyle = `rgba(0, 0, 0, ${lightingVal + shadeFactor})`;
                this.ctx.fillRect(column, startY-1, 1, drawHeight+2);
            }
        }
    }

    #renderFloorAndCeiling() {
        // Use the projection width and height directly from the object's properties
        const width = this.gameWidth;
        const adjustedHight = ~~(this.gameHeight + Math.abs(this.#lookOffsetZ) * 2);
        const height = adjustedHight % 2 == 0 ? adjustedHight : adjustedHight + 1;
        const halfHeight = height / 2; // Half the height for drawing the floor and ceiling separately
        const playerHeight = this.#playerHeight; // Use the player height as defined in the constructor
        // const floorTexture = this.#floorTextures[0]; // Use the first floor texture
        // const ceilingTexture = this.#ceilingTextures[0]; // Use the first ceiling texture

        // Create image data objects for the floor and ceiling
        let imageData = this.ctx.createImageData(width, height);

        let interpolationSkip;

        // Loop through each pixel in the image data for floor and ceiling
        for (let y = 0; y <= halfHeight; y++) {
            interpolationSkip = 10;
            const adjustedY = this.#lookOffsetZ < 0 ? y : y;
            for (let x = 0; x < this.gameWidth-1; x+=interpolationSkip) {
                // Calculate distance to floor point, factoring in the blockSize
                let distToFloorPoint = Math.abs(this.#distFromPlayerToProjectionPlane * (this.#playerHeight / (adjustedY - height / 2)));
                distToFloorPoint /= Math.cos((this.#fov / 2 - x * (this.#fov / this.gameWidth)) * Math.PI / 180);

                let textPixel = this.#getFloorCeilingTextureIndex(x, distToFloorPoint);
                let floorTexture = this.#floorTexture;
                let ceilingTexture = this.#ceilingTexture;
                //const nextIndex = x + interpolationSkip >= this.gameWidth ? this.gameWidth - 1 : x + interpolationSkip;
                if (x + interpolationSkip >= this.gameWidth) {
                    interpolationSkip = 1;
                }
                const nextIndex = x + interpolationSkip;
                let textPixelFuture = this.#getFloorCeilingTextureIndex(nextIndex, distToFloorPoint);

                if (textPixel == null || textPixelFuture == null) continue;

                const mapPoint = new Vector(~~(textPixel.x / this.#blockSize), ~~(textPixel.y / this.#blockSize));
                const mapPointFuture = new Vector(~~(textPixelFuture.x / this.#blockSize), ~~(textPixelFuture.y / this.#blockSize));

                const imageDataIndex = (x + (height - adjustedY) * width) * 4;
                const imageDataIndexCeiling = (x + (adjustedY) * width) * 4;


                const colorVal = GameMath.remap(distToFloorPoint, 0, this.#lightTravelDist, this.#maxLightVal, 0);

                for (let i = 0; i < interpolationSkip; i++) {
                    if (mapPoint.x != mapPointFuture.x || mapPoint.y != mapPointFuture.y) {
                        //continue;
                        let accuratePixel = this.#getFloorCeilingTextureIndex(x + i, distToFloorPoint);
                        floorTexture = this.#floorTexture;
                        ceilingTexture = this.#ceilingTexture;
                        if (accuratePixel == null) continue;
                        const floorPixel = (accuratePixel.y * floorTexture.width + accuratePixel.x) * 4;
                        const ceilingPixel = (accuratePixel.y * ceilingTexture.width + accuratePixel.x) * 4;
                        const index = imageDataIndex + i * 4;
                        imageData.data[index] = floorTexture.data[floorPixel] * colorVal; // Red
                        imageData.data[index + 1] = floorTexture.data[floorPixel + 1] * colorVal; // Green
                        imageData.data[index + 2] = floorTexture.data[floorPixel + 2] * colorVal; // Blue
                        imageData.data[index + 3] = floorTexture.data[floorPixel + 3] * colorVal; // Alpha
                        const ceilingIndex = imageDataIndexCeiling + i * 4;
                        imageData.data[ceilingIndex] = ceilingTexture.data[ceilingPixel] * colorVal; // Red
                        imageData.data[ceilingIndex + 1] = ceilingTexture.data[ceilingPixel + 1] * colorVal; // Green
                        imageData.data[ceilingIndex + 2] = ceilingTexture.data[ceilingPixel + 2] * colorVal; // Blue
                        imageData.data[ceilingIndex + 3] = ceilingTexture.data[ceilingPixel + 3] * colorVal; // Alpha
                        continue;
                    }
                    const interpolatedX = ~~GameMath.lerp(textPixel.x, textPixelFuture.x, i / interpolationSkip);
                    const interpolatedY = ~~GameMath.lerp(textPixel.y, textPixelFuture.y, i / interpolationSkip);
                    const floorPixel = (interpolatedY * floorTexture.width + interpolatedX) * 4;
                    const ceilingPixel = (interpolatedY * ceilingTexture.width + interpolatedX) * 4;
                    const index = imageDataIndex + i * 4;
                    imageData.data[index] = floorTexture.data[floorPixel] * colorVal; // Red
                    imageData.data[index + 1] = floorTexture.data[floorPixel + 1] * colorVal; // Green
                    imageData.data[index + 2] = floorTexture.data[floorPixel + 2] * colorVal; // Blue
                    imageData.data[index + 3] = floorTexture.data[floorPixel + 3] * colorVal; // Alpha
                    const ceilingIndex = imageDataIndexCeiling + i * 4;
                    imageData.data[ceilingIndex] = ceilingTexture.data[ceilingPixel] * colorVal; // Red
                    imageData.data[ceilingIndex + 1] = ceilingTexture.data[ceilingPixel + 1] * colorVal; // Green
                    imageData.data[ceilingIndex + 2] = ceilingTexture.data[ceilingPixel + 2] * colorVal; // Blue
                    imageData.data[ceilingIndex + 3] = ceilingTexture.data[ceilingPixel + 3] * colorVal; // Alpha
                }
            }
        }

        // Draw the floor and ceiling image data
        if (this.#lookOffsetZ < 0) {
            this.ctx.putImageData(imageData, 0, 0 + this.#lookOffsetZ * 2);
        } else {
            this.ctx.putImageData(imageData, 0, 0);
        }
    }

    #getFloorCeilingTextureIndex(x, distToFloorPoint) {
        if (distToFloorPoint >= this.#lightTravelDist) return null;
        // Calculate the actual floor point that the ray hits
        let floorPoint = this.#position.copy();
        let rayDirection = this.#rays[x].direction.copy();
        rayDirection.normalize(); // Ensure the direction vector is normalized
        rayDirection.mult(distToFloorPoint); // Scale the direction vector by the distance to the floor point
        floorPoint.add(rayDirection); // Translate the player's position by the scaled direction vector to get the floor point

        // Convert the floor point to map coordinates
        let pointMapX = Math.ceil(floorPoint.x / this.#blockSize) - 1;
        let pointMapY = Math.ceil(floorPoint.y / this.#blockSize) - 1;

        // Check if the map coordinates are within the bounds of the floor map
        if (pointMapX >= 0 && pointMapX < this.#floorMap[0].length && pointMapY >= 0 && pointMapY < this.#floorMap.length) {
            // Get the texture index from the floor map
            const floorTextureIndex = this.#floorMap[pointMapY][pointMapX];
            this.#floorTexture = this.#floorTextures[floorTextureIndex];
            const ceilingTextureIndex = this.#ceilingMap[pointMapY][pointMapX];
            this.#ceilingTexture = this.#ceilingTextures[ceilingTextureIndex];

            // Calculate the texture coordinates for the current floor point
            let textureX = Math.floor((floorPoint.x % this.#blockSize) * (this.#floorTexture.width / this.#blockSize));
            let textureY = Math.floor((floorPoint.y % this.#blockSize) * (this.#floorTexture.height / this.#blockSize));

            // Return the texture coordinates
            return new Vector(textureX, textureY);
        } else {
            // Return null if the floor point is outside the bounds of the floor map
            return null;
        }
    }

    render2D() {
        this.updateRays();
        const blockWidth = (this.gameWidth / this.#map[0].length);
        const blockHeight = (this.gameHeight / this.#map.length);
        const screenToWorldRatio = new Vector(this.gameWidth / (this.#map[0].length * this.#blockSize), this.gameHeight / (this.#map.length * this.#blockSize));
        const screenPosition = this.#position.copy().mult(screenToWorldRatio);

        this.drawRect(new Vector(this.gameWidth / 2, this.gameHeight / 2), this.gameWidth, this.gameHeight, new Color(255, 255, 255, 255));

        for (let y = 0; y < this.#map.length; y++) {
            for (let x = 0; x < this.#map[y].length; x++) {
                const block = this.#map[y][x];
                if (block != 0) {
                    const blockImage = this.images[block-1];

                    // Calculate the exact position where the tile should be rendered.
                    const renderX = (x * blockWidth);
                    const renderY = (y * blockHeight);

                    this.ctx.drawImage(blockImage, renderX, renderY, blockWidth, blockHeight);
                }
            }
        }
        for (let y = 0; y < this.#map.length; y++) this.drawLine(new Vector(0, y * (this.gameHeight / this.#map.length)), new Vector(this.gameWidth, y * (this.gameHeight / this.#map.length)), new Color(0, 0, 0, 255), 3);
        for (let x = 0; x < this.#map[0].length; x++) this.drawLine(new Vector(x * (this.gameWidth / this.#map[0].length), 0), new Vector(x * (this.gameWidth / this.#map[0].length), this.gameHeight), new Color(0, 0, 0, 255), 3);

        this.#rays.forEach(ray => {
            const hit = ray.cast(this.#map);
            if (hit) {
                hit.mult(screenToWorldRatio);
                this.drawLine(screenPosition, hit);
            } else {
                const rayEnd = this.#position.copy().add(ray.direction.mult(ray.length));
                rayEnd.mult(screenToWorldRatio);
                this.drawLine(screenPosition, rayEnd);
            }
        });

        const radX = (this.gameWidth / this.#map[0].length) * 0.3;
        const radY = (this.gameHeight / this.#map.length) * 0.3;
        //const drawPos = new Vector();
        this.drawEllipse(screenPosition, radX, radY);
    }

    /**
     * Draws the minimap.
     */
    renderMinimap(position, sizeFactor, colorFloor, colorWall) {

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

    get images() {
        return this.#wallTextures;
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
        this.#wallTextures = newImages;
    }
}