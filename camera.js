class Camera {
    #gameWidth;
    #gameHeight;
    #canvasWidth;
    #canvasHeight;
    #aspectRatio;
    #boundResizeCanvas;
    #fpsUpdateRate;
    #canvas;
    #ctx;
    #renderLoop;
    #deltaTime = 0;
    #currentTime = 0;
    #lastTime = 0;
    #startTime;
    #fps = 0;
    #displayFPS = false;
    #frames = 0;
    #lastFPSUpdate = 0;

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
        this.#aspectRatio = gameWidth / gameHeight;
        this.#boundResizeCanvas = this.#resizeCanvas.bind(this);
        this.#fpsUpdateRate = fpsUpdateRate;

        window.onload = (event) => {
            this.#initializeCanvas(canvasName);
            this.#startTime = performance.now();
            this.start();
            this.#renderLoop = window.requestAnimationFrame(this.#render.bind(this));
        };
    }
    
    #initializeCanvas(canvasName) {
        this.#canvas = document.getElementById(canvasName);
        this.#ctx = this.#canvas.getContext('2d');
        this.#ctx.canvas.width  = this.#gameWidth;
        this.#ctx.canvas.height = this.#gameHeight;
        this.#canvas.style.imageRendering = 'pixelated';
        this.#canvas.style.width = `${this.#canvasWidth}px`;
        this.#canvas.style.height = `${this.#canvasHeight}px`;
        // disable smooth upscaling
        this.#ctx.imageSmoothingEnabled = false;
        this.#ctx.mozImageSmoothingEnabled = false; // Firefox
        this.#ctx.webkitImageSmoothingEnabled = false; // Chrome, Safari
        this.#ctx.msImageSmoothingEnabled = false; // IE
    }

    #render() {
        this.#renderLoop = window.requestAnimationFrame(this.#render.bind(this));

        this.#lastTime = this.#currentTime;
        this.#currentTime = performance.now();
        this.#deltaTime = (this.#currentTime - this.#lastTime) / 1000;

        this.#ctx.clearRect(0, 0, this.#gameWidth, this.#gameHeight);

        this.update();
        this.UI();

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
        return this.#deltaTime;
    }

    /**
     * Returns the total time the camera has been rendering, in seconds.
     * @returns {number} The total time, in seconds.
     */
    getTime() {
        return (this.#currentTime - this.#startTime) / 1000;
    }

    /**
     * Draws an image on the canvas with a specified rotation angle.
     * @param {Image} image - The image to draw.
     * @param {number} x - The x-coordinate at which to start drawing the image.
     * @param {number} y - The y-coordinate at which to start drawing the image.
     * @param {number} width - The width of the image.
     * @param {number} height - The height of the image.
     * @param {number} angle - The rotation angle of the image in degrees. Default is 0.
     * @param {number} [srcX=0] - The x-coordinate of the top left corner of the source rectangle.
     * @param {number} [srcY=0] - The y-coordinate of the top left corner of the source rectangle.
     * @param {number} [srcWidth=image.width] - The width of the source rectangle.
     * @param {number} [srcHeight=image.height] - The height of the source rectangle.
     */
    drawImage(image, x, y, width, height, angle = 0, srcX = 0, srcY = 0, srcWidth = image.width, srcHeight = image.height) {
        if (!(image instanceof Image)) {
            throw new Error('Invalid argument: image should be an instance of Image.');
        }
        if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Invalid arguments: x, y, width, and height should be numbers.');
        }
        if (typeof angle !== 'number') {
            throw new Error('Invalid argument: angle should be a number.');
        }
        if (typeof srcX !== 'number' || typeof srcY !== 'number' || typeof srcWidth !== 'number' || typeof srcHeight !== 'number') {
            throw new Error('Invalid arguments: srcX, srcY, srcWidth, and srcHeight should be numbers.');
        }
        if (srcX < 0 || srcY < 0 || srcWidth <= 0 || srcHeight <= 0) {
            throw new Error('Invalid arguments: srcX, srcY should be greater than or equal to 0, srcWidth, and srcHeight should be greater than 0.');
        }
        if (srcX + srcWidth > image.width || srcY + srcHeight > image.height) {
            throw new Error('Invalid arguments: The source rectangle should be within the bounds of the image.');
        }
        this.#ctx.save();
        this.#ctx.translate(x, y);
        this.#ctx.rotate(angle * Math.PI / 180);
        this.#ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight, -width / 2, -height / 2, width, height);
        this.#ctx.restore();
    }

    /**
     * Draws a frame of an animation on the canvas.
     * @param {AnimationFrame} frame - The frame to draw.
     * @param {number} x - The x-coordinate at which to start drawing the frame.
     * @param {number} y - The y-coordinate at which to start drawing the frame.
     * @param {number} width - The width of the frame.
     * @param {number} height - The height of the frame.
     * @param {number} angle - The rotation angle of the frame in degrees. Default is 0.
     */
    drawAnimationFrame(frame, x, y, width, height, angle = 0) {
        if (!(frame instanceof AnimationFrame)) {
            throw new Error('Invalid argument: frame should be an instance of AnimationFrame.');
        }
        if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Invalid arguments: x, y, width, and height should be numbers.');
        }
        if (typeof angle !== 'number') {
            throw new Error('Invalid argument: angle should be a number.');
        }
        this.drawImage(frame.image, x, y, width, height, angle, frame.srcX, frame.srcY, frame.width, frame.height);
    }

    /**
     * Draws a rectangle on the canvas with a specified rotation angle.
     * @param {number} x - The x-coordinate of the rectangle.
     * @param {number} y - The y-coordinate of the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {Color} color - The color of the rectangle.
     * @param {number} angle - The rotation angle of the rectangle in degrees. Default is 0.
     */
    drawRect(x, y, width, height, color, angle = 0) {
        if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for x, y, width, and height.');
        }
        if (!(color instanceof Color)) {
            throw new Error('Invalid color: Expected a Color object.');
        }
        this.#ctx.save();
        this.#ctx.translate(x, y);
        this.#ctx.rotate(angle * Math.PI / 180);
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fillRect(-width / 2, -height / 2, width, height);
        this.#ctx.restore();
    }
    
    /**
     * Draws an outlined rectangle on the canvas with a specified rotation angle.
     * @param {number} x - The x-coordinate at which to start drawing the rectangle.
     * @param {number} y - The y-coordinate at which to start drawing the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {Color} color - The color of the rectangle.
     * @param {Color} outlineColor - The color of the rectangle outline.
     * @param {number} lineWidth - The width of the outline.
     * @param {number} angle - The rotation angle of the rectangle in degrees. Default is 0.
     */
    drawRectOutline(x, y, width, height, color, outlineColor, lineWidth = 1, angle = 0) {
        if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Invalid arguments: x, y, width, and height should be numbers.');
        }
        if (!(color instanceof Color) || !(outlineColor instanceof Color)) {
            throw new Error('Invalid arguments: color and outlineColor should be Color objects.');
        }
        if (typeof lineWidth !== 'number') {
            throw new Error('Invalid argument: lineWidth should be a number.');
        }
        this.#ctx.save();
        this.#ctx.translate(x, y);
        this.#ctx.rotate(angle * Math.PI / 180);
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fillRect(-width / 2, -height / 2, width, height);
        this.#ctx.lineWidth = lineWidth;
        this.#ctx.strokeStyle = outlineColor.getColorAsHex();
        this.#ctx.strokeRect(-width / 2, -height / 2, width, height);
        this.#ctx.restore();
    }

    /**
     * Draws an ellipse on the canvas.
     * @param {number} x - The x-coordinate of the center of the ellipse.
     * @param {number} y - The y-coordinate of the center of the ellipse.
     * @param {number} radiusX - The horizontal radius of the ellipse.
     * @param {number} radiusY - The vertical radius of the ellipse.
     * @param {Color} color - The color of the ellipse.
     */
    drawEllipse(x, y, radiusX, radiusY, color) {
        if (typeof x !== 'number' || typeof y !== 'number' || typeof radiusX !== 'number' || typeof radiusY !== 'number') {
            throw new Error('Invalid arguments: x, y, radiusX, and radiusY should be numbers.');
        }
        if (!(color instanceof Color)) {
            throw new Error('Invalid color: Expected a Color object.');
        }
        this.#ctx.beginPath();
        this.#ctx.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fill();
    }

    /**
     * Draws an outlined ellipse on the canvas.
     * @param {number} x - The x-coordinate of the center of the ellipse.
     * @param {number} y - The y-coordinate of the center of the ellipse.
     * @param {number} radiusX - The horizontal radius of the ellipse.
     * @param {number} radiusY - The vertical radius of the ellipse.
     * @param {Color} color - The color of the ellipse.
     * @param {Color} outlineColor - The color of the ellipse outline.
     * @param {number} lineWidth - The width of the outline.
     */
    drawEllipseOutline(x, y, radiusX, radiusY, color, outlineColor, lineWidth = 1) {
        if (typeof x !== 'number' || typeof y !== 'number' || typeof radiusX !== 'number' || typeof radiusY !== 'number') {
            throw new Error('Invalid arguments: x, y, radiusX, and radiusY should be numbers.');
        }
        if (!(color instanceof Color) || !(outlineColor instanceof Color)) {
            throw new Error('Invalid arguments: color and outlineColor should be Color objects.');
        }
        if (typeof lineWidth !== 'number') {
            throw new Error('Invalid argument: lineWidth should be a number.');
        }
        this.#ctx.beginPath();
        this.#ctx.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fill();
        this.#ctx.lineWidth = lineWidth;
        this.#ctx.strokeStyle = outlineColor.getColorAsHex();
        this.#ctx.stroke();
    }

    /**
     * Draws a line on the canvas.
     * @param {number} x1 - The x-coordinate of the start of the line.
     * @param {number} y1 - The y-coordinate of the start of the line.
     * @param {number} x2 - The x-coordinate of the end of the line.
     * @param {number} y2 - The y-coordinate of the end of the line.
     * @param {Color} color - The color of the line.
     * @param {number} lineWidth - The width of the line.
     */
    drawLine(x1, y1, x2, y2, color, lineWidth = 1) {
        if (typeof x1 !== 'number' || typeof y1 !== 'number' || typeof x2 !== 'number' || typeof y2 !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for x1, y1, x2, and y2.');
        }
        if (!(color instanceof Color)) {
            throw new Error('Invalid color: Expected a Color object.');
        }
        if (typeof lineWidth !== 'number' || lineWidth <= 0) {
            throw new Error('Invalid lineWidth: Expected a positive number.');
        }
        this.#ctx.beginPath();
        this.#ctx.moveTo(x1, y1);
        this.#ctx.lineTo(x2, y2);
        this.#ctx.lineWidth = lineWidth;
        this.#ctx.strokeStyle = color.getColorAsHex();
        this.#ctx.stroke();
    }

    /**
     * Draws text on the canvas.
     * @param {string} text - The text to draw.
     * @param {number} x - The x-coordinate at which to start drawing the text.
     * @param {number} y - The y-coordinate at which to start drawing the text.
     * @param {Color} color - The color of the text.
     * @param {string} font - The font of the text.
     */
    drawText(text, x, y, color, font = '16px Arial') {
        if (typeof text !== 'string') {
            throw new Error('Invalid text: Expected a string.');
        }
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for x and y.');
        }
        if (!(color instanceof Color)) {
            throw new Error('Invalid color: Expected a Color object.');
        }
        if (typeof font !== 'string' || font.trim() === '') {
            throw new Error('Invalid font: Expected a non-empty string.');
        }
        this.#ctx.font = font;
        this.#ctx.fillStyle = color.getColorAsHex();
        this.#ctx.fillText(text, x, y);
    }

    /**
     * Toggles the fullscreen mode.
     * If the canvas is not already in fullscreen mode, this method will make it fullscreen
     * and resize it to maintain the aspect ratio. If the canvas is already in fullscreen,
     * this method will exit fullscreen mode.
     */
    /**
     * Toggles the fullscreen mode.
     * If the canvas is not already in fullscreen mode, this method will make it fullscreen
     * and resize it to maintain the aspect ratio. If the canvas is already in fullscreen,
     * this method will exit fullscreen mode.
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (this.#canvas.requestFullscreen) {
                this.#canvas.requestFullscreen();
            } else if (this.#canvas.mozRequestFullScreen) { /* Firefox */
                this.#canvas.mozRequestFullScreen();
            } else if (this.#canvas.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                this.#canvas.webkitRequestFullscreen();
            } else if (this.#canvas.msRequestFullscreen) { /* IE/Edge */
                this.#canvas.msRequestFullscreen();
            }
            window.addEventListener('resize', this.#boundResizeCanvas);
            this.#resizeCanvas();
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
            window.removeEventListener('resize', this.#boundResizeCanvas);
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

        if (document.fullscreenElement) {
            console.log("Cannot resize canvas while in fullscreen mode.");
            return;
        }

        this.#canvasWidth = newWidth;
        this.#canvasHeight = newHeight;

        this.#canvas.style.width = `${this.#canvasWidth}px`;
        this.#canvas.style.height = `${this.#canvasHeight}px`;
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
     * Called when the game starts.
     */
    start() {
        // Override this method in your game code.
    }

    /**
     * Called every frame to update the canvas and the game state.
     */
    update() {
        // Override this method in your game code.
    }

    /**
     * Called every frame to update the UI. Is called after the update() function.
     */
    UI() {
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