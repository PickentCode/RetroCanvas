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