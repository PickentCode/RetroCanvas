/**
 * The AnimationManager class is responsible for managing multiple Animation instances.
 * It provides methods to add and remove animations, and to update all animations in a single loop.
 */
class AnimationManager {
    #animations;
    /**
     * Creates a new AnimationManager instance.
     */
    constructor() {
        /**
         * A Set of all animations managed by this AnimationManager.
         * @type {Set<Animation>}
         */
        this.#animations = new Set();
        this.update();
    }

    /**
     * Adds an animation to the manager.
     * @param {Animation} animation - The animation to add.
     */
    addAnimation(animation) {
        if (!(animation instanceof Animation)) {
            throw new Error('Invalid argument: animation should be an instance of Animation.');
        }
        this.#animations.add(animation);
    }

    /**
     * Removes an animation from the manager.
     * @param {Animation} animation - The animation to remove.
     */
    removeAnimation(animation) {
        if (!(animation instanceof Animation)) {
            throw new Error('Invalid argument: animation should be an instance of Animation.');
        }
        this.#animations.delete(animation);
    }

    /**
     * Updates all animations managed by this AnimationManager.
     * This method should be called once per frame, and it uses requestAnimationFrame to schedule the next update.
     */
    update() {
        const now = performance.now();
        for (const animation of this.#animations) {
            if (animation.isPlaying) {
                animation.update(now);
            }
        }
        requestAnimationFrame(() => this.update());
    }

    /**
     * Returns the animation array of the animationi manager.
     * @returns {Array<Animation>} The animation array of the animationi manager.
     */
    get animations() {
        return this.#animations;
    }
}

/**
 * Represents a frame of an animation.
 */
class AnimationFrame {
    #image;
    #srcX;
    #srcY;
    #width;
    #height;

    /**
     * Creates a new AnimationFrame.
     * @param {Image} image - The image of the animation.
     * @param {number} srcX - The x-coordinate of the top left corner of the source rectangle.
     * @param {number} srcY - The y-coordinate of the top left corner of the source rectangle.
     * @param {number} width - The width of the source rectangle.
     * @param {number} height - The height of the source rectangle.
     */
    constructor(image, srcX, srcY, width, height) {
        if (!(image instanceof Image)) {
            throw new Error('Invalid argument: image should be an instance of Image.');
        }
        if (typeof srcX !== 'number' || typeof srcY !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Invalid arguments: srcX, srcY, width, and height should be numbers.');
        }
        if (srcX < 0 || srcY < 0 || width <= 0 || height <= 0) {
            throw new Error('Invalid arguments: srcX, srcY should be greater than or equal to 0, width, and height should be greater than 0.');
        }
        if (srcX + width > image.width || srcY + height > image.height) {
            throw new Error('Invalid arguments: The source rectangle should be within the bounds of the image.');
        }
        this.#image = image;
        this.#srcX = srcX;
        this.#srcY = srcY;
        this.#width = width;
        this.#height = height;
    }

    /**
     * Returns the image of the animation frame.
     * @returns {Image} The image of the animation frame.
     */
    get image() {
        return this.#image;
    }

    /**
     * Returns the x-coordinate of the top left corner of the source rectangle.
     * @returns {number} The x-coordinate of the top left corner of the source rectangle.
     */
    get srcX() {
        return this.#srcX;
    }

    /**
     * Returns the y-coordinate of the top left corner of the source rectangle.
     * @returns {number} The y-coordinate of the top left corner of the source rectangle.
     */
    get srcY() {
        return this.#srcY;
    }

    /**
     * Returns the width of the source rectangle.
     * @returns {number} The width of the source rectangle.
     */
    get width() {
        return this.#width;
    }

    /**
     * Returns the height of the source rectangle.
    * @returns {number} The height of the source rectangle.
    */
    get height() {
        return this.#height;
    }
}

class Animation {
    #image;
    #frameCount;
    #frameDuration;
    #frameWidth;
    #frameHeight;
    #rows;
    #columns;
    #position;
    #sizeFactor;
    #currentFrame;
    #elapsedTime;
    #isPlaying;
    #lastUpdateTime;
    #once;

    /**
     * Creates a new Animation.
     * @param {Image} image - The sprite sheet image.
     * @param {number} frameCount - The total number of frames in the animation.
     * @param {number} frameDuration - The duration of each frame in milliseconds.
     * @param {number} frameWidth - The width of each frame in pixels.
     * @param {number} frameHeight - The height of each frame in pixels.
     * @param {number} rows - The number of rows in the sprite sheet.
     * @param {number} columns - The number of columns in the sprite sheet.
     */
    constructor(image, frameCount, frameDuration, frameWidth, frameHeight, columns = frameCount, rows = 1, position = new Vector(0, 0), sizeFactor) {
        if (!(image instanceof Image)) {
            throw new Error('Invalid argument: image should be an instance of Image.');
        }
        if (typeof frameCount !== 'number' || frameCount <= 0) {
            throw new Error('Invalid argument: frameCount should be a positive number.');
        }
        if (typeof frameDuration !== 'number' || frameDuration <= 0) {
            throw new Error('Invalid argument: frameDuration should be a positive number.');
        }
        if (typeof frameWidth !== 'number' || frameWidth <= 0) {
            throw new Error('Invalid argument: frameWidth should be a positive number.');
        }
        if (typeof frameHeight !== 'number' || frameHeight <= 0) {
            throw new Error('Invalid argument: frameHeight should be a positive number.');
        }
        if (typeof rows !== 'number' || rows <= 0) {
            throw new Error('Invalid argument: rows should be a positive number.');
        }
        if (typeof columns !== 'number' || columns <= 0) {
            throw new Error('Invalid argument: columns should be a positive number.');
        }
        if (!(position instanceof Vector)) {
            throw new Error('Invalid argument: position must be an instance of Vector.');
        }
        if (typeof sizeFactor !== 'number' || sizeFactor <= 0) {
            throw new Error('Invalid argument: sizeFactor should be a positive number.');
        }

        this.#image = image;
        this.#frameCount = frameCount;
        this.#frameDuration = frameDuration;
        this.#frameWidth = frameWidth;
        this.#frameHeight = frameHeight;
        this.#rows = rows;
        this.#columns = columns;
        this.#position = position;
        this.#sizeFactor = sizeFactor;

        this.#currentFrame = 0;
        this.#elapsedTime = 0;
        this.#isPlaying = false;
        this.#lastUpdateTime = 0;
        this.#once = false;
    }

    /**
     * Starts or resumes the animation.
     */
    play() {
        this.#isPlaying = true;
        this.#lastUpdateTime = performance.now();
        this.#once = false;
    }

    /**
     * Starts the animation and stops it after one loop.
     */
    playOnce() {
        this.#isPlaying = true;
        this.#lastUpdateTime = performance.now();
        this.#once = true;
    }

    /**
     * Pauses the animation without resetting the current frame.
     */
    pause() {
        this.#isPlaying = false;
    }

    /**
     * Stops the animation and resets the current frame to the first frame.
     */
    stop() {
        this.#isPlaying = false;
        this.#currentFrame = 0;
        this.#elapsedTime = 0;
    }

    /**
     * Updates the animation based on the elapsed time.
     */
    update(now) {
        const elapsed = now - this.#lastUpdateTime;
        if (elapsed > this.#frameDuration) {
            this.#currentFrame++;
            if (this.#once && this.#currentFrame >= this.#frameCount) {
                this.stop();
            } else {
                this.#currentFrame %= this.#frameCount;
            }
            this.#lastUpdateTime = now;
        }
    }

    /**
     * Returns an object containing the source coordinates and dimensions of the current frame.
     * @returns {AnimationFrame} An object with properties `srcX`, `srcY`, `width`, and `height`.
     */
    getCurrentFrame() {
        const rowIndex = Math.floor(this.#currentFrame / this.#columns);
        const colIndex = this.#currentFrame % this.#columns;
        
        const srcX = colIndex * this.#frameWidth;
        const srcY = rowIndex * this.#frameHeight;
        
        return new AnimationFrame(this.#image, srcX, srcY, this.#frameWidth, this.#frameHeight);
    }

    /**
     * Returns the sprite sheet image of the animation.
     * @returns {Image} The sprite sheet image.
     */
    get image() {
        return this.#image;
    }

    /**
     * Returns the number of frames in the animation.
     * @returns {number} The number of frames.
     */
    get frameCount() {
        return this.#frameCount;
    }

    /**
     * Returns the duration of each frame in milliseconds.
     * @returns {number} The frame duration.
     */
    get frameDuration() {
        return this.#frameDuration;
    }

    /**
     * Sets the duration of each frame in milliseconds.
     * @param {number} value - The new frame duration.
     */
    set frameDuration(value) {
        if (typeof value !== 'number' || value <= 0) {
            throw new Error('Invalid argument: frameDuration should be a positive number.');
        }
        this.#frameDuration = value;
    }

    /**
     * Returns the width of each frame in pixels.
     * @returns {number} The frame width.
     */
    get frameWidth() {
        return this.#frameWidth;
    }

    /**
     * Returns the height of each frame in pixels.
     * @returns {number} The frame height.
     */
    get frameHeight() {
        return this.#frameHeight;
    }

    /**
     * Returns the current frame index.
     * @returns {number} The current frame index.
     */
    get currentFrame() {
        return this.#currentFrame;
    }

    /**
     * Returns the elapsed time since the last frame update.
     * @returns {number} The elapsed time.
     */
    get elapsedTime() {
        return this.#elapsedTime;
    }

    /**
     * Returns whether the animation is currently playing.
     * @returns {boolean} True if the animation is playing, false otherwise.
     */
    get isPlaying() {
        return this.#isPlaying;
    }

    /**
     * Returns the position of the animation.
     * @returns {Vector} The position.
     */
    get position() {
        return this.#position;
    }

    /**
     * Returns the sizeFactor.
     * @returns {number} The sizeFactor.
     */
    get sizeFactor() {
        return this.#sizeFactor;
    }

    /**
     * Sets the position of the animation.
     * @param {Vector} position - The position.
     */
    set position(position) {
        if (!(position instanceof Vector)) {
            throw new Error('Invalid argument: position must be an instance of Vector.');
        }
        this.#position = position;
    }

    /**
     * Sets the sizeFactor.
     * @param {number} sizeFactor - The sizeFactor.
     */
    set sizeFactor(sizeFactor) {
        if (typeof sizeFactor !== 'number' || sizeFactor <= 0) {
            throw new Error('Invalid argument: sizeFactor should be a positive number.');
        }
        this.#sizeFactor = sizeFactor;
    }
}