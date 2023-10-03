/**
 * Represents a light source.
 */
class Light {
    /**
     * Creates a new light source.
     * @param {number} x - The x-coordinate of the light source.
     * @param {number} y - The y-coordinate of the light source.
     * @param {number} dist - The distance the light travels.
     * @param {number} maxBrightness - The maximum brightness of the light (between 0 and 1).
     * @param {number} gradientValue - The value that controls the transition of the light dimming (between 0 and 1).
     */
    constructor(x, y, dist, maxBrightness, gradientValue) {
        if (typeof x !== 'number' || typeof y !== 'number' || typeof dist !== 'number') {
            throw new Error('Invalid light parameters: x, y, and dist must be numbers.');
        }
        if (typeof maxBrightness !== 'number' || maxBrightness < 0 || maxBrightness > 1) {
            throw new Error('Invalid maxBrightness: must be a number between 0 and 1.');
        }
        if (typeof gradientValue !== 'number' || gradientValue < 0 || gradientValue > 1) {
            throw new Error('Invalid gradientValue: must be a number between 0 and 1.');
        }

        this.x = x;
        this.y = y;
        this.dist = dist;
        this.maxBrightness = maxBrightness;
        this.gradientValue = gradientValue;
    }

    /**
     * Moves the light source to a new position.
     * @param {number} x - The new x-coordinate.
     * @param {number} y - The new y-coordinate.
     */
    moveTo(x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Invalid parameters: x and y must be numbers.');
        }
        this.x = x;
        this.y = y;
    }

    /**
     * Sets the distance the light travels.
     * @param {number} dist - The new distance.
     */
    setDistance(dist) {
        if (typeof dist !== 'number') {
            throw new Error('Invalid parameter: dist must be a number.');
        }
        this.dist = dist;
    }

    /**
     * Sets the maximum brightness of the light.
     * @param {number} maxBrightness - The new maximum brightness (between 0 and 1).
     */
    setMaxBrightness(maxBrightness) {
        if (typeof maxBrightness !== 'number') {
            throw new Error('Invalid maxBrightness: must be a number.');
        }
        this.maxBrightness = this.#clamp(maxBrightness, 0, 1, 'maxBrightness');
    }

    /**
     * Sets the value that controls the transition of the light dimming.
     * @param {number} gradientValue - The new gradient value (between 0 and 1).
     */
    setGradientValue(gradientValue) {
        if (typeof gradientValue !== 'number') {
            throw new Error('Invalid gradientValue: must be a number.');
        }
        this.gradientValue = this.#clamp(gradientValue, 0, 1, 'gradientValue');
    }

    /**
     * Clamps a value to a specified range and logs a warning if the value was clamped.
     * @param {number} value - The value to clamp.
     * @param {number} min - The minimum value.
     * @param {number} max - The maximum value.
     * @param {string} name - The name of the value (for the warning message).
     * @returns {number} The clamped value.
     */
    #clamp(value, min, max, name) {
        if (value < min || value > max) {
            console.warn(`Value of ${name} should be between ${min} and ${max}. Clamping value.`);
            return Math.max(min, Math.min(max, value));
        }
        return value;
    }
}