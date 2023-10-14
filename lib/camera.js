class Camera {
    #gameWidth;
    #gameHeight;
    #canvasWidth;
    #canvasHeight;
    #aspectRatio;
    #boundResizeCanvas;
    #fullscreenHandler;
    #fpsUpdateRate;
    #canvas;
    #ctx;
    #renderer;
    #renderLoop;
    #canvasName;
    #deltaTime = 0;
    #currentTime = 0;
    #lastTime = 0;
    #startTime;
    #fps = 0;
    #displayFPS = false;
    #frames = 0;
    #lastFPSUpdate = 0;
    #isPostProcessingOverridden = false;

    /**
     * Creates a new Camera.
     * @param {number} gameWidth - The width of the game/camera.
     * @param {number} gameHeight - The height of the game/camera.
     * @param {number} canvasWidth - The width of the canvas.
     * @param {number} canvasHeight - The height of the canvas.
     * @param {number} fpsUpdateRate - The FPS update rate.
     * @param {string} canvasName - The name (id) of the canvas to draw on.
     */
    constructor(gameWidth, gameHeight, canvasWidth, canvasHeight, fpsUpdateRate, canvasName) {
        if (typeof gameWidth !== 'number' || gameWidth <= 0) {
            throw new Error('Invalid gameWidth: Expected a positive number.');
        }
        if (typeof gameHeight !== 'number' || gameHeight <= 0) {
            throw new Error('Invalid gameHeight: Expected a positive number.');
        }
        if (typeof canvasWidth !== 'number' || canvasWidth <= 0) {
            throw new Error('Invalid canvasWidth: Expected a positive number.');
        }
        if (typeof canvasHeight !== 'number' || canvasHeight <= 0) {
            throw new Error('Invalid canvasHeight: Expected a positive number.');
        }
        if (typeof fpsUpdateRate !== 'number' || fpsUpdateRate <= 0) {
            throw new Error('Invalid fpsUpdateRate: Expected a positive number.');
        }
        if (typeof canvasName !== 'string' || canvasName.trim() === '') {
            throw new Error('Invalid canvasName: Expected a non-empty string.');
        }

        this.#gameWidth = gameWidth;
        this.#gameHeight = gameHeight;
        this.#canvasWidth = canvasWidth;
        this.#canvasHeight = canvasHeight;
        this.#canvasName = canvasName;
        this.#aspectRatio = gameWidth / gameHeight;
        this.#fpsUpdateRate = fpsUpdateRate;
        this.#boundResizeCanvas = this.#resizeCanvas.bind(this);
        this.#renderer = this.#render.bind(this);
        this.#fullscreenHandler = this.#handleFullscreen.bind(this);

        // window.onload = (event) => {
        //     this.#initializeCanvas(canvasName);
        //     this.#startTime = performance.now();
        //     this.start();
        //     this.#renderLoop = window.requestAnimationFrame(this.#render.bind(this));
        // };
    }
    
    #initializeCanvas(canvasName) {
        this.#canvas = document.getElementById(canvasName);
    
        this.#ctx = this.#canvas.getContext('2d');
        this.#ctx.canvas.width = this.#gameWidth;
        this.#ctx.canvas.height = this.#gameHeight;
        this.#canvas.style.imageRendering = 'pixelated';
        this.#canvas.style.width = `${this.#canvasWidth}px`;
        this.#canvas.style.height = `${this.#canvasHeight}px`;
    
        // disable smooth upscaling
        this.#ctx.imageSmoothingEnabled = false;
        this.#ctx.mozImageSmoothingEnabled = false; // Firefox
        this.#ctx.webkitImageSmoothingEnabled = false; // Chrome, Safari
        this.#ctx.msImageSmoothingEnabled = false; // IE

        window.addEventListener("fullscreenchange", this.#fullscreenHandler);
    }

    #render() {
        this.#renderLoop = window.requestAnimationFrame(this.#render.bind(this));

        this.#lastTime = this.#currentTime;
        this.#currentTime = performance.now();
        this.#deltaTime = (this.#currentTime - this.#lastTime) / 1000;

        this.#ctx.clearRect(0, 0, this.#gameWidth, this.#gameHeight);

        this.update();

        if (this.postProcessing !== Camera.prototype.postProcessing && !this.#isPostProcessingOverridden) {
            this.#isPostProcessingOverridden = true;
            console.log("Post-processing is overridden!");
        }
        if (this.#isPostProcessingOverridden) {
            const imageData = this.#ctx.getImageData(0, 0, this.#gameWidth, this.#gameHeight);
            this.postProcessing(imageData);
            this.#ctx.putImageData(imageData, 0, 0);
        }   

        this.ui();

        if (this.#displayFPS) {
            this.#calculateFPS();
        }
    }

    #calculateFPS() {
        this.#frames++;
        if (this.#currentTime >= this.#lastFPSUpdate + this.#fpsUpdateRate) {
            this.#fps = (this.#frames / ((this.#currentTime - this.#lastFPSUpdate) / 1000)).toFixed(2);
            this.#frames = 0;
            this.#lastFPSUpdate = this.#currentTime;
        }
    
        // Calculate font size based on window width
        const fontSize = Math.max(Math.round(window.innerWidth / 50), 10); // Minimum size of 10px
    
        this.#ctx.font = `${fontSize}px Arial`;
        this.#ctx.fillStyle = "white";
        this.#ctx.fillText("FPS: " + Math.round(this.#fps), 10, fontSize + 10); // Adjust y position based on font size
    }

    /**
     * Initializes the camera and rendering loop. If the canvas is not present in the DOM,
     * this method can optionally wait and retry the initialization once the canvas becomes available.
     * 
     * @param {boolean} [autoWaitForCanvas=false] - If true, the method will keep checking for the presence of the canvas in the DOM.
     *                                             If false, it will make a single attempt and fail if the canvas is not present.
     * @param {number} [maxRetries=10] - Maximum number of times the method will check for the canvas's presence in the DOM.
     * @param {number} [retryInterval=50] - Time interval (in milliseconds) between each retry/check for the canvas's presence.
     * 
     * @throws {TypeError} If 'autoWaitForCanvas' is not of type boolean.
     * @throws {TypeError} If 'maxRetries' is not of type number or is less than 1.
     * @throws {TypeError} If 'retryInterval' is not of type number or is less than 0.
     * @throws {Error} If the canvas is not present and 'autoWaitForCanvas' is set to false.
     */
    init(autoWaitForCanvas = false, maxRetries = 10, retryInterval = 50) {
        if (typeof autoWaitForCanvas !== 'boolean') {
            throw new TypeError(`Expected 'autoWaitForCanvas' to be a boolean, but received ${typeof autoWaitForCanvas}.`);
        }

        if (typeof maxRetries !== 'number' || maxRetries < 1) {
            throw new TypeError(`Expected 'maxRetries' to be a positive number, but received ${maxRetries}.`);
        }

        if (typeof retryInterval !== 'number' || retryInterval < 0) {
            throw new TypeError(`Expected 'retryInterval' to be a non-negative number, but received ${retryInterval}.`);
        }

        const tryInitializeCanvas = () => {
            if (document.getElementById(this.#canvasName)) {
                if (this.observer) {
                    this.observer.disconnect();
                    this.observer = null;
                }

                this.#initializeCanvas(this.#canvasName);
                this.#startTime = performance.now();
                this.start();
                this.#renderLoop = window.requestAnimationFrame(this.#renderer);
            }
        };

        // Trying to initialize directly.
        tryInitializeCanvas();

        // If canvas isn't present yet and autoWait is true
        if (!this.#canvas && autoWaitForCanvas) {
            let retryCount = 0;

            const waitForBodyAndObserve = () => {
                if (document.body) {
                    this.observer = new MutationObserver(tryInitializeCanvas);
                    this.observer.observe(document.body, { childList: true, subtree: true });
                } else if (retryCount < maxRetries) {
                    retryCount++;
                    // If body is not available yet, try again after a delay
                    setTimeout(waitForBodyAndObserve, retryInterval);
                } else {
                    console.warn("Max retries reached while waiting for document.body.");
                }
            };

            waitForBodyAndObserve();
        } else if (!this.#canvas) {
            throw new Error(`Failed to initialize: Canvas with ID "${this.#canvasName}" is not present in the document. If you expect the canvas to be added later, consider setting 'autoWaitForCanvas' to true.`);
        }
    }

    /**
     * Toggles the display of the FPS counter.
     */
    toggleFPSDisplay() {
        this.#displayFPS = !this.#displayFPS;
    }

    /**
     * Returns the time elapsed since the last frame, in seconds.
     * @returns {number} The delta time, in seconds.
     */
    getDeltaTime() {
        return Math.min(this.#deltaTime, 1);
    }

    /**
     * Returns the total time the camera has been rendering, in seconds.
     * @returns {number} The total time, in seconds.
     */
    getTime() {
        return (this.#currentTime - this.#startTime) / 1000;
    }

    /**
     * Draws a color buffer (ImageData) onto the canvas.
     * 
     * @param {ImageData} imageData - The ImageData object representing the color buffer.
     * @throws {Error} Throws an error if the imageData is not an instance of ImageData.
     * @throws {Error} Throws an error if the imageData dimensions do not match the canvas dimensions.
     * @throws {Error} Throws an error if the imageData data length is not as expected.
     */
    drawImageData(imageData) {
        // Check if the imageData is an instance of ImageData
        if (!(imageData instanceof ImageData)) {
            throw new Error('Invalid argument: imageData should be an instance of ImageData.');
        }

        // Check if the dimensions match
        if (imageData.width !== this.#gameWidth || imageData.height !== this.#gameHeight) {
            throw new Error('Mismatched dimensions: The imageData dimensions do not match the canvas dimensions.');
        }

        // Ensure the data length is as expected
        if (imageData.data.length !== this.#gameWidth * this.#gameHeight * 4) {
            throw new Error('Invalid imageData data length.');
        }

        // Draw the color buffer onto the canvas
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Draws a color buffer (ImageData) onto the canvas, adjusting for potential mismatched dimensions.
     * 
     * @param {ImageData} imageData - The ImageData object representing the color buffer.
     * @throws {Error} Throws an error if the imageData is not an instance of ImageData.
     * @throws {Error} Throws an error if the imageData data length is not as expected.
     */
    drawImageDataWithMismatch(imageData) {
        // Check if the imageData is an instance of ImageData
        if (!(imageData instanceof ImageData)) {
            throw new Error('Invalid argument: imageData should be an instance of ImageData.');
        }

        // Ensure the data length is as expected
        if (imageData.data.length !== imageData.width * imageData.height * 4) {
            throw new Error('Invalid imageData data length.');
        }

        // Create a temporary canvas to draw the ImageData
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCtx.putImageData(imageData, 0, 0);

        // Draw the temporary canvas onto the main canvas, adjusting for dimensions
        this.ctx.drawImage(tempCanvas, 0, 0, this.#gameWidth, this.#gameHeight);
    }

    /**
     * Draws an image on the canvas with specified parameters.
     * 
     * @param {Image} image - The image to draw.
     * @param {Vector} position - The position vector at which to start drawing the image.
     * @param {number} width - The width of the image.
     * @param {number} height - The height of the image.
     * @param {number} [angle=0] - The rotation angle of the image in degrees.
     * @param {Vector} [sourcePosition=new Vector(0, 0)] - The position vector of the top-left corner of the source rectangle.
     * @param {number} [srcWidth=image.width] - The width of the source rectangle.
     * @param {number} [srcHeight=image.height] - The height of the source rectangle.
     * @param {boolean} [reflectX=false] - Whether to reflect the image along the X-axis.
     * @param {boolean} [reflectY=false] - Whether to reflect the image along the Y-axis.
     */
    drawImage(image, position, width, height, angle = 0, sourcePosition = new Vector(0, 0), srcWidth = image.width, srcHeight = image.height, reflectX = false, reflectY = false) {
        if (!(image instanceof Image)) {
            throw new Error('Invalid argument: image should be an instance of Image.');
        }
        if (!(position instanceof Vector) || !(sourcePosition instanceof Vector)) {
            throw new Error('Invalid arguments: Expected Vector objects for position and sourcePosition.');
        }
        if (typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Invalid arguments: width and height should be numbers.');
        }
        if (typeof angle !== 'number') {
            throw new Error('Invalid argument: angle should be a number.');
        }
        if (typeof reflectX !== 'boolean' || typeof reflectY !== 'boolean') {
            throw new Error('Invalid arguments: reflectX and reflectY should be booleans.');
        }
        this.#ctx.save();
        this.#ctx.translate(position.x, position.y);
        this.#ctx.rotate(angle * Math.PI / 180);
        
        // Handle reflection
        let scaleX = reflectX ? -1 : 1;
        let scaleY = reflectY ? -1 : 1;
        this.#ctx.scale(scaleX, scaleY);
    
        // Adjust position for reflection
        let drawX = -width / 2;
        let drawY = -height / 2;
    
        this.#ctx.drawImage(image, sourcePosition.x, sourcePosition.y, srcWidth, srcHeight, drawX, drawY, width, height);
        this.#ctx.restore();
    }

    /**
     * Draws a frame of an animation on the canvas.
     * 
     * @param {AnimationFrame} frame - The frame to draw.
     * @param {Vector} position - The position vector at which to start drawing the frame.
     * @param {number} width - The width of the frame.
     * @param {number} height - The height of the frame.
     * @param {number} [angle=0] - The rotation angle of the frame in degrees.
     * @param {boolean} [reflectX=false] - Whether to reflect the frame along the X-axis.
     * @param {boolean} [reflectY=false] - Whether to reflect the frame along the Y-axis.
     */
    drawAnimationFrame(frame, position, width, height, angle = 0, reflectX, reflectY) {
        if (!(frame instanceof AnimationFrame)) {
            throw new Error('Invalid argument: frame should be an instance of AnimationFrame.');
        }
        if (!(position instanceof Vector)) {
            throw new Error('Invalid position: Expected a Vector object.');
        }
        if (typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Invalid arguments: width and height should be numbers.');
        }
        if (typeof angle !== 'number') {
            throw new Error('Invalid argument: angle should be a number.');
        }
        if (typeof reflectX !== 'boolean' || typeof reflectY !== 'boolean') {
            throw new Error('Invalid arguments: reflectX and reflectY should be booleans.');
        }
        this.drawImage(frame.image, position, width, height, angle, new Vector(frame.srcX, frame.srcY), frame.width, frame.height, reflectX, reflectY);
    }

    /**
     * Draws a rectangle on the canvas with a specified rotation angle.
     * @param {Vector} position - The position vector of the rectangle's origin.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {Color} [color=new Color(127, 0, 0, 255)] - The color of the rectangle.
     * @param {number} angle - The rotation angle of the rectangle in degrees. Default is 0.
     */
    drawRect(position, width, height, color = new Color(127, 0, 0, 255), angle = 0) {
        if (!(position instanceof Vector)) {
            throw new Error('Invalid position: Expected a Vector object.');
        }
        if (typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for width and height.');
        }
        if (!(color instanceof Color)) {
            throw new Error('Invalid color: Expected a Color object.');
        }

        this.#ctx.save();
        this.#ctx.translate(position.x, position.y);
        this.#ctx.rotate(angle * Math.PI / 180);
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fillRect(-width / 2, -height / 2, width, height);
        this.#ctx.restore();
    }
    
    /**
     * Draws an outlined rectangle on the canvas with a specified rotation angle.
     * @param {Vector} position - The position vector at which to start drawing the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {Color} [color=new Color(127, 0, 0, 255)] - The color of the rectangle.
     * @param {Color} [outlineolor=new Color(255, 0, 0, 255)] - The color of the rectangle outline.
     * @param {number} lineWidth - The width of the outline. Default is 1.
     * @param {number} angle - The rotation angle of the rectangle in degrees. Default is 0.
     */
    drawRectOutline(position, width, height, color = new Color(127, 0, 0, 255), outlineColor = new Color(255, 0, 0, 255), lineWidth = 1, angle = 0) {
        if (!(position instanceof Vector)) {
            throw new Error('Invalid position: Expected a Vector object.');
        }
        if (typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Invalid arguments: width and height should be numbers.');
        }
        if (!(color instanceof Color) || !(outlineColor instanceof Color)) {
            throw new Error('Invalid arguments: color and outlineColor should be Color objects.');
        }
        if (typeof lineWidth !== 'number') {
            throw new Error('Invalid argument: lineWidth should be a number.');
        }

        this.#ctx.save();
        this.#ctx.translate(position.x, position.y);
        this.#ctx.rotate(angle * Math.PI / 180);
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fillRect(-width / 2, -height / 2, width, height);
        this.#ctx.lineWidth = lineWidth;
        this.#ctx.strokeStyle = outlineColor.getColorAsHex();
        this.#ctx.strokeRect(-width / 2, -height / 2, width, height);
        this.#ctx.restore();
    }

    /**
     * Draws a triangle on the canvas with a specified rotation angle.
     * @param {Vector} pos1 - First vertex of the triangle.
     * @param {Vector} pos2 - Second vertex of the triangle.
     * @param {Vector} pos3 - Third vertex of the triangle.
     * @param {Color} [color=new Color(127, 0, 0, 255)] - The color of the triangle.
     * @param {number} angle - The rotation angle of the triangle in degrees. Default is 0.
     */
    drawTriangle(pos1, pos2, pos3, color = new Color(127, 0, 0, 255), angle = 0) {
        if (!(pos1 instanceof Vector) || !(pos2 instanceof Vector) || !(pos3 instanceof Vector)) {
            throw new Error('Invalid positions: Expected Vector objects for pos1, pos2, and pos3.');
        }
        if (!(color instanceof Color)) {
            throw new Error('Invalid color: Expected a Color object.');
        }

        const centroid = new Vector((pos1.x + pos2.x + pos3.x) / 3, (pos1.y + pos2.y + pos3.y) / 3);

        this.#ctx.save();
        this.#ctx.translate(centroid.x, centroid.y);
        this.#ctx.rotate(angle * Math.PI / 180);
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.beginPath();
        this.#ctx.moveTo(pos1.x - centroid.x, pos1.y - centroid.y);
        this.#ctx.lineTo(pos2.x - centroid.x, pos2.y - centroid.y);
        this.#ctx.lineTo(pos3.x - centroid.x, pos3.y - centroid.y);
        this.#ctx.closePath();
        this.#ctx.fill();
        this.#ctx.restore();
    }

    /**
     * Draws an outlined triangle on the canvas with a specified rotation angle.
     * @param {Vector} pos1 - First vertex of the triangle.
     * @param {Vector} pos2 - Second vertex of the triangle.
     * @param {Vector} pos3 - Third vertex of the triangle.
     * @param {Color} [color=new Color(127, 0, 0, 255)] - The color of the triangle.
     * @param {Color} [outlineColor=new Color(255, 0, 0, 255)] - The color of the triangle outline.
     * @param {number} lineWidth - The width of the outline. Default is 1.
     * @param {number} angle - The rotation angle of the triangle in degrees. Default is 0.
     */
    drawTriangleOutline(pos1, pos2, pos3, color = new Color(127, 0, 0, 255), outlineColor = new Color(255, 0, 0, 255), lineWidth = 1, angle = 0) {
        if (!(pos1 instanceof Vector) || !(pos2 instanceof Vector) || !(pos3 instanceof Vector)) {
            throw new Error('Invalid positions: Expected Vector objects for pos1, pos2, and pos3.');
        }
        if (!(color instanceof Color) || !(outlineColor instanceof Color)) {
            throw new Error('Invalid arguments: color and outlineColor should be Color objects.');
        }
        if (typeof lineWidth !== 'number') {
            throw new Error('Invalid argument: lineWidth should be a number.');
        }

        const centroid = new Vector((pos1.x + pos2.x + pos3.x) / 3, (pos1.y + pos2.y + pos3.y) / 3);

        this.#ctx.save();
        this.#ctx.translate(centroid.x, centroid.y);
        this.#ctx.rotate(angle * Math.PI / 180);
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.strokeStyle = outlineColor.getColorAsHex();
        this.#ctx.lineWidth = lineWidth;
        this.#ctx.beginPath();
        this.#ctx.moveTo(pos1.x - centroid.x, pos1.y - centroid.y);
        this.#ctx.lineTo(pos2.x - centroid.x, pos2.y - centroid.y);
        this.#ctx.lineTo(pos3.x - centroid.x, pos3.y - centroid.y);
        this.#ctx.closePath();
        this.#ctx.fill();
        this.#ctx.stroke();
        this.#ctx.restore();
    }

    /**
     * Draws a filled polygon on the canvas.
     * @param {Vector} position - The position vector of the polygon's center.
     * @param {number} outerRadius - The distance from the center to the polygon's vertices.
     * @param {number} corners - The number of corners the polygon has.
     * @param {Color} [color=new Color(127, 0, 0, 255)] - The fill color of the polygon.
     * @param {number} angle - The rotation angle of the polygon in degrees. Default is 0.
     */
    drawPolygon(position, outerRadius, corners, color = new Color(127, 0, 0, 255), angle = 0) {
        if (!(position instanceof Vector)) {
            throw new Error('Invalid position: Expected a Vector object.');
        }
        if (typeof outerRadius !== 'number' || outerRadius <= 0) {
            throw new Error('Invalid outerRadius: Expected a positive number.');
        }
        if (typeof corners !== 'number' || corners < 3) {
            throw new Error('Invalid number of corners: Minimum is 3.');
        }
        if (!(color instanceof Color)) {
            throw new Error('Invalid color: Expected a Color object.');
        }

        const angleIncrement = (2 * Math.PI) / corners;

        this.#ctx.save();
        this.#ctx.translate(position.x, position.y);
        this.#ctx.rotate(angle * Math.PI / 180);
        this.#ctx.fillStyle = color.getColorAsHex();

        this.#ctx.beginPath();
        for (let i = 0; i < corners; i++) {
            const x = outerRadius * Math.cos(i * angleIncrement);
            const y = outerRadius * Math.sin(i * angleIncrement);
            if (i === 0) {
                this.#ctx.moveTo(x, y);
            } else {
                this.#ctx.lineTo(x, y);
            }
        }
        this.#ctx.closePath();
        this.#ctx.fill();

        this.#ctx.restore();
    }

    /**
     * Draws an outlined polygon on the canvas.
     * @param {Vector} position - The position vector of the polygon's center.
     * @param {number} outerRadius - The distance from the center to the polygon's vertices.
     * @param {number} corners - The number of corners the polygon has.
     * @param {Color} [color=new Color(127, 0, 0, 255)] - The fill color of the polygon.
     * @param {Color} [outlineColor=new Color(255, 0, 0, 255)] - The color of the polygon's outline.
     * @param {number} lineWidth - The width of the outline. Default is 1.
     * @param {number} angle - The rotation angle of the polygon in degrees. Default is 0.
     */
    drawPolygonOutline(position, outerRadius, corners, color = new Color(127, 0, 0, 255), outlineColor = new Color(255, 0, 0, 255), lineWidth = 1, angle = 0) {
        if (!(position instanceof Vector)) {
            throw new Error('Invalid position: Expected a Vector object.');
        }
        if (typeof outerRadius !== 'number' || outerRadius <= 0) {
            throw new Error('Invalid outerRadius: Expected a positive number.');
        }
        if (typeof corners !== 'number' || corners < 3) {
            throw new Error('Invalid number of corners: Minimum is 3.');
        }
        if (!(color instanceof Color) || !(outlineColor instanceof Color)) {
            throw new Error('Invalid arguments: color and outlineColor should be Color objects.');
        }
        if (typeof lineWidth !== 'number' || lineWidth <= 0) {
            throw new Error('Invalid lineWidth: Expected a positive number.');
        }

        const angleIncrement = (2 * Math.PI) / corners;

        this.#ctx.save();
        this.#ctx.translate(position.x, position.y);
        this.#ctx.rotate(angle * Math.PI / 180);

        this.#ctx.beginPath();
        for (let i = 0; i < corners; i++) {
            const x = outerRadius * Math.cos(i * angleIncrement);
            const y = outerRadius * Math.sin(i * angleIncrement);
            if (i === 0) {
                this.#ctx.moveTo(x, y);
            } else {
                this.#ctx.lineTo(x, y);
            }
        }
        this.#ctx.closePath();

        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fill();
        this.#ctx.lineWidth = lineWidth;
        this.#ctx.strokeStyle = outlineColor.getColorAsHex();
        this.#ctx.stroke();

        this.#ctx.restore();
    }

    /**
     * Draws an ellipse on the canvas.
     * @param {Vector} center - The position vector of the center of the ellipse.
     * @param {number} radiusX - The horizontal radius of the ellipse.
     * @param {number} radiusY - The vertical radius of the ellipse.
     * @param {Color} [color=new Color(127, 0, 0, 255)] - The color of the ellipse.
     */
    drawEllipse(center, radiusX, radiusY, color = new Color(127, 0, 0, 255)) {
        if (!(center instanceof Vector)) {
            throw new Error('Invalid center: Expected a Vector object.');
        }
        if (typeof radiusX !== 'number' || typeof radiusY !== 'number') {
            throw new Error('Invalid arguments: radiusX and radiusY should be numbers.');
        }
        if (!(color instanceof Color)) {
            throw new Error('Invalid color: Expected a Color object.');
        }

        this.#ctx.beginPath();
        this.#ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, 2 * Math.PI);
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fill();
    }

    /**
     * Draws an outlined ellipse on the canvas.
     * @param {Vector} center - The position vector of the center of the ellipse.
     * @param {number} radiusX - The horizontal radius of the ellipse.
     * @param {number} radiusY - The vertical radius of the ellipse.
     * @param {Color} [color=new Color(127, 0, 0, 255)] - The color of the ellipse.
     * @param {Color} [outlineColor=new Color(255, 0, 0, 255)] - The color of the ellipse outline.
     * @param {number} lineWidth - The width of the outline. Default is 1.
     */
    drawEllipseOutline(center, radiusX, radiusY, color = new Color(127, 0, 0, 255), outlineColor = new Color(255, 0, 0, 255), lineWidth = 1) {
        if (!(center instanceof Vector)) {
            throw new Error('Invalid center: Expected a Vector object.');
        }
        if (typeof radiusX !== 'number' || typeof radiusY !== 'number') {
            throw new Error('Invalid arguments: radiusX and radiusY should be numbers.');
        }
        if (!(color instanceof Color) || !(outlineColor instanceof Color)) {
            throw new Error('Invalid arguments: color and outlineColor should be Color objects.');
        }
        if (typeof lineWidth !== 'number') {
            throw new Error('Invalid argument: lineWidth should be a number.');
        }

        this.#ctx.beginPath();
        this.#ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, 2 * Math.PI);
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fill();
        this.#ctx.lineWidth = lineWidth;
        this.#ctx.strokeStyle = outlineColor.getColorAsHex();
        this.#ctx.stroke();
    }

    /**
     * Draws a line on the canvas.
     * @param {Vector} start - The position vector of the start of the line.
     * @param {Vector} end - The position vector of the end of the line.
     * @param {Color} [color=new Color(255, 0, 0, 255)] - The color of the line.
     * @param {number} lineWidth - The width of the line. Default is 1.
     */
    drawLine(start, end, color = new Color(255, 0, 0, 255), lineWidth = 1) {
        if (!(start instanceof Vector) || !(end instanceof Vector)) {
            throw new Error('Invalid arguments: Expected Vector objects for start and end positions.');
        }
        if (!(color instanceof Color)) {
            throw new Error('Invalid color: Expected a Color object.');
        }
        if (typeof lineWidth !== 'number' || lineWidth <= 0) {
            throw new Error('Invalid lineWidth: Expected a positive number.');
        }

        this.#ctx.beginPath();
        this.#ctx.moveTo(start.x, start.y);
        this.#ctx.lineTo(end.x, end.y);
        this.#ctx.lineWidth = lineWidth;
        this.#ctx.strokeStyle = color.getColorAsHex();
        this.#ctx.stroke();
    }

    /**
     * Draws text on the canvas.
     * @param {string} text - The text to draw.
     * @param {Vector} position - The position vector at which to start drawing the text.
     * @param {Color} [color=new Color(127, 0, 0, 255)] - The color of the text.
     * @param {string} font - The font of the text. Default is '16px Arial'.
     */
    drawText(text, position, color = new Color(127, 0, 0, 255), font = '16px Arial') {
        if (typeof text !== 'string') {
            throw new Error('Invalid text: Expected a string.');
        }
        if (!(position instanceof Vector)) {
            throw new Error('Invalid position: Expected a Vector object.');
        }
        if (!(color instanceof Color)) {
            throw new Error('Invalid color: Expected a Color object.');
        }
        if (typeof font !== 'string' || font.trim() === '') {
            throw new Error('Invalid font: Expected a non-empty string.');
        }

        this.#ctx.font = font;
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fillText(text, position.x, position.y);
    }

    /**
     * Toggles the fullscreen mode.
     * If the canvas is not already in fullscreen mode, this method will make it fullscreen
     * and resize it to maintain the aspect ratio. If the canvas is already in fullscreen,
     * this method will exit fullscreen mode.
     */
    toggleFullscreen() {
        if (!this.isFullscreen()) {
            if (this.#canvas.requestFullscreen) {
                this.#canvas.requestFullscreen();
            } else if (this.#canvas.mozRequestFullScreen) { /* Firefox */
                this.#canvas.mozRequestFullScreen();
            } else if (this.#canvas.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                this.#canvas.webkitRequestFullscreen();
            } else if (this.#canvas.msRequestFullscreen) { /* IE/Edge */
                this.#canvas.msRequestFullscreen();
            }
            //window.addEventListener('resize', this.#boundResizeCanvas);
            //this.#resizeCanvas();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { /* Firefox */
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE/Edge */
                document.msExitFullscreen();
            }
            // window.removeEventListener('resize', this.#boundResizeCanvas);
            // this.#canvas.style.width = `${this.#canvasWidth}px`;
            // this.#canvas.style.height = `${this.#canvasHeight}px`;
        }
    }

    /**
     * Check if a canvas element is currently in fullscreen mode.
     *
     * @param {HTMLCanvasElement} canvas - The canvas element to check.
     * @returns {boolean} True if the canvas is in fullscreen mode, false otherwise.
     */
    isFullscreen() {
        return document.fullscreenElement === this.#canvas ||
               document.mozFullScreenElement === this.#canvas || // Firefox
               document.webkitFullscreenElement === this.#canvas || // Chrome, Safari, Opera
               document.msFullscreenElement === this.#canvas; // Microsoft Edge/IE
    }

    #handleFullscreen() {
        if (this.isFullscreen()) {
            console.log("Fullscreen mode.");
            this.#resizeCanvas();
        } else {
            console.log("Fullscreen mode disabled.");
            this.#canvas.style.width = `${this.#canvasWidth}px`;
            this.#canvas.style.height = `${this.#canvasHeight}px`;
        }
    }

    /**
     * Set a new value for the canvas width and height.
     * @param {number} newWidth - The new width for the canvas.
     * @param {number} newHeight - The new height for the canvas.
     */
    setCanvasSize(newWidth, newHeight) {
        if (typeof newWidth !== 'number' || newWidth <= 0) {
            throw new Error('Invalid newWidth: Expected a positive number.');
        }
        if (typeof newHeight !== 'number' || newHeight <= 0) {
            throw new Error('Invalid newHeight: Expected a positive number.');
        }

        if (this.isFullscreen()) {
            console.log("Cannot resize canvas while in fullscreen mode.");
            return;
        }

        this.#canvasWidth = newWidth;
        this.#canvasHeight = newHeight;

        this.#canvas.style.width = `${this.#canvasWidth}px`;
        this.#canvas.style.height = `${this.#canvasHeight}px`;
    }

    /**
     * Zooms into the provided ImageData based on a position and zoom value.
     * @param {ImageData} imageData - The original pixel data.
     * @param {Vector} position - The target position to zoom into.
     * @param {number} zoomValue - The zoom multiplier (e.g., 2 means zoom in 2x).
     * @returns {ImageData} - The zoomed pixel data.
     */
    zoomImageData(imageData, position, zoomValue) {
        if (!(imageData instanceof ImageData)) {
            throw new Error("Invalid imageData: Expected an instance of ImageData.");
        }
        if (!(position instanceof Vector)) {
            throw new Error('Invalid position: Expected a Vector object.');
        }
        if (typeof zoomValue !== 'number' || zoomValue <= 0) {
            throw new Error("Invalid zoomValue: Expected a positive number.");
        }

        const sourceWidth = imageData.width;
        const sourceHeight = imageData.height;

        const destImageData = new ImageData(sourceWidth, sourceHeight);

        for (let y = 0; y < sourceHeight; y++) {
            for (let x = 0; x < sourceWidth; x++) {
                // Calculate source pixel position based on zoom and position vector
                const srcX = Math.round(position.x + (x - sourceWidth / 2) / zoomValue);
                const srcY = Math.round(position.y + (y - sourceHeight / 2) / zoomValue);

                if (srcX >= 0 && srcY >= 0 && srcX < sourceWidth && srcY < sourceHeight) {
                    const destIndex = (y * sourceWidth + x) * 4;
                    const srcIndex = (srcY * sourceWidth + srcX) * 4;

                    destImageData.data[destIndex] = imageData.data[srcIndex];
                    destImageData.data[destIndex + 1] = imageData.data[srcIndex + 1];
                    destImageData.data[destIndex + 2] = imageData.data[srcIndex + 2];
                    destImageData.data[destIndex + 3] = imageData.data[srcIndex + 3];
                }
            }
        }

        return destImageData;
    }

    /**
     * Resize the canvas element based on the window's size while maintaining the aspect ratio.
     * @private
     */
    #resizeCanvas() {
        let windowRatio = window.innerWidth / window.innerHeight;

        if (windowRatio < this.#aspectRatio) {
            this.#canvas.style.width = window.innerWidth + 'px';
            this.#canvas.style.height = (window.innerWidth / this.#aspectRatio) + 'px';
        } else {
            this.#canvas.style.width = (window.innerHeight * this.#aspectRatio) + 'px';
            this.#canvas.style.height = window.innerHeight + 'px';
        }
    }

    /**
     * Creates a new ImageData object with the given dimensions.
     * 
     * @param {number} width - The width for the ImageData object.
     * @param {number} height - The height for the ImageData object.
     */
    createImageData(width, height) {
        if (typeof width !== 'number' || width <= 0) {
            throw new Error('Invalid width: Expected a positive number.');
        }
        if (typeof height !== 'number' || height <= 0) {
            throw new Error('Invalid height: Expected a positive number.');
        }

        return this.ctx.createImageData(width, height);
    }

    /**
     * Retrieves the ImageData object representing the pixel data of the entire canvas.
     * 
     * @returns {ImageData} The ImageData object for the entire canvas.
     */
    getImageData() {
        return this.#ctx.getImageData(0, 0, this.#gameWidth, this.#gameHeight);
    }

    /**
     * Called when the game starts.
     * Should be overwritten.
     */
    start() {
        // Override this method in your game code.
    }

    /**
     * Called every frame to update the canvas and the game state.
     * Should be overwritten.
     */
    update() {
        // Override this method in your game code.
    }

    /**
     * Called every frame after update, but before ui.
     * Should be overwritten.
     * Should have imageData as parameter and performe modifications on it.
     */
    postProcessing(imageData) {
        // Default implementation does nothing.
    }

    /**
     * Called every frame to update the ui. Is called after the postProcessing() function.
     * Should be overwritten.
     */
    ui() {
        // Override this method in your game code.
    }

    /**
     * Returns the width of the game.
     * @returns {number} The width of the game, in pixels.
     */
    get gameWidth() {
        return this.#gameWidth;
    }

    /**
     * Returns the height of the game.
     * @returns {number} The height of the game, in pixels.
     */
    get gameHeight() {
        return this.#gameHeight;
    }

    /**
     * Returns the canvas context.
     * @returns {CanvasRenderingContext2D} The canvas context.
     */
    get ctx() {
        return this.#ctx;
    }

    /**
     * Returns the current frames per second.
     * @returns {number} The current frames per second.
     */
    get fps() {
        return this.#fps;
    }
}