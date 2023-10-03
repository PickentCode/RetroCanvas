class GameMath {
    /**
     * Clamps a value to a specified range.
     * @param {number} value - The value to clamp.
     * @param {number} min - The minimum value.
     * @param {number} max - The maximum value.
     * @returns {number} The clamped value.
     */
    static clamp(value, min, max) {
        if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for value, min, and max.');
        }
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Performs linear interpolation between two values.
     * @param {number} a - The first value.
     * @param {number} b - The second value.
     * @param {number} t - The interpolation factor (between 0 and 1).
     * @returns {number} The interpolated value.
     */
    static lerp(a, b, t) {
        if (typeof a !== 'number' || typeof b !== 'number' || typeof t !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for a, b, and t.');
        }
        return (1 - t) * a + t * b;
    }

    /**
     * Remaps a number from one range to another.
     * @param {number} value - The value to remap.
     * @param {number} inputMin - The minimum value of the input range.
     * @param {number} inputMax - The maximum value of the input range.
     * @param {number} outputMin - The minimum value of the output range.
     * @param {number} outputMax - The maximum value of the output range.
     * @returns {number} The remapped value.
     */
    static remap(value, inputMin, inputMax, outputMin, outputMax) {
        if (typeof value !== 'number' || typeof inputMin !== 'number' || typeof inputMax !== 'number' || typeof outputMin !== 'number' || typeof outputMax !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for value, inputMin, inputMax, outputMin, and outputMax.');
        }
        return outputMin + ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin);
    }

    /**
     * Returns the Euclidean distance between two points.
     * @param {number} x1 - The x-coordinate of the first point.
     * @param {number} y1 - The y-coordinate of the first point.
     * @param {number} x2 - The x-coordinate of the second point.
     * @param {number} y2 - The y-coordinate of the second point.
     * @returns {number} The distance between the points.
     */
    static distance(x1, y1, x2, y2) {
        if (typeof x1 !== 'number' || typeof y1 !== 'number' || typeof x2 !== 'number' || typeof y2 !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for x1, y1, x2, and y2.');
        }
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Returns the angle in radians between two points.
     * @param {number} x1 - The x-coordinate of the first point.
     * @param {number} y1 - The y-coordinate of the first point.
     * @param {number} x2 - The x-coordinate of the second point.
     * @param {number} y2 - The y-coordinate of the second point.
     * @returns {number} The angle in radians.
     */
    static angle(x1, y1, x2, y2) {
        if (typeof x1 !== 'number' || typeof y1 !== 'number' || typeof x2 !== 'number' || typeof y2 !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for x1, y1, x2, and y2.');
        }
        return Math.atan2(y2 - y1, x2 - x1);
    }

    /**
     * Converts an angle from degrees to radians.
     * @param {number} degrees - The angle in degrees.
     * @returns {number} The angle in radians.
     */
    static degreesToRadians(degrees) {
        if (typeof degrees !== 'number') {
            throw new Error('Invalid argument: Expected a number for degrees.');
        }
        return degrees * (Math.PI / 180);
    }

    /**
     * Converts an angle from radians to degrees.
     * @param {number} radians - The angle in radians.
     * @returns {number} The angle in degrees.
     */
    static radiansToDegrees(radians) {
        if (typeof radians !== 'number') {
            throw new Error('Invalid argument: Expected a number for radians.');
        }
        return radians * (180 / Math.PI);
    }
}