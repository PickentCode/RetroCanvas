class Vector {
    /**
     * Creates a new Vector.
     * @param {number} x - The x component.
     * @param {number} y - The y component.
     */
    constructor(x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Vector constructor requires two numbers.');
        }
        this.x = x;
        this.y = y;
    }

    /**
     * Sets the components of the Vector.
     * @param {number} x - The x component.
     * @param {number} y - The y component.
     */
    set(x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Vector.set requires two numbers.');
        }
        this.x = x;
        this.y = y;
    }

    /**
     * Adds a Vector or a number to this Vector.
     * @param {Vector|number} v - The Vector or number to add.
     */
    add(v) {
        if (v instanceof Vector) {
            this.x += v.x;
            this.y += v.y;
        } else if (typeof v === 'number') {
            this.x += v;
            this.y += v;
        } else {
            throw new Error('Vector.add requires a Vector or a number.');
        }
        return this.copy();
    }

    /**
     * Subtracts a Vector or a number from this Vector.
     * @param {Vector|number} v - The Vector or number to subtract.
     */
    sub(v) {
        if (v instanceof Vector) {
            this.x -= v.x;
            this.y -= v.y;
        } else if (typeof v === 'number') {
            this.x -= v;
            this.y -= v;
        } else {
            throw new Error('Vector.sub requires a Vector or a number.');
        }
        return this.copy();
    }

    /**
     * Multiplies this Vector by a Vector or a number.
     * @param {Vector|number} v - The Vector or number to multiply by.
     */
    mult(v) {
        if (v instanceof Vector) {
            this.x *= v.x;
            this.y *= v.y;
        } else if (typeof v === 'number') {
            this.x *= v;
            this.y *= v;
        } else {
            throw new Error('Vector.mult requires a Vector or a number.');
        }
        return this.copy();
    }

    
    /**
     * Divides this Vector by a Vector or a number.
     * @param {Vector|number} v - The Vector or number to divide by.
     */
    div(v) {
        if (v instanceof Vector) {
            if (v.x === 0 || v.y === 0) {
                throw new Error('Cannot divide by a Vector with a zero component.');
            }
            this.x /= v.x;
            this.y /= v.y;
        } else if (typeof v === 'number') {
            if (v === 0) {
                throw new Error('Cannot divide by zero.');
            }
            this.x /= v;
            this.y /= v;
        } else {
            throw new Error('Vector.div requires a Vector or a number.');
        }
        return this.copy();
    }
    
    /**
     * Normalizes this Vector, making it a unit Vector.
     */
    normalize() {
        const len = Math.sqrt(this.x * this.x + this.y * this.y);
        if (len === 0) {
            //throw new Error('Cannot normalize a zero Vector.');
            console.warn('Cannot normalize a zero Vector.');
        }
        this.x /= len;
        this.y /= len;
        return this.copy();
    }

    /**
     * Rotates this Vector by 90 degrees counterclockwise.
     * @returns {Vector} This vector after rotation.
     */
    rotate90() {
        const temp = this.x;
        this.x = -this.y;
        this.y = temp;
        return this;
    }

    /**
     * Returns the magnitude (length) of this Vector.
     * @returns {number} The magnitude of this Vector.
     */
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Returns the distance between this Vector and another Vector.
     * @param {Vector} v - The other Vector.
     * @returns {number} The distance.
     */
    distance(v) {
        if (!(v instanceof Vector)) {
            throw new Error('Vector.distance requires a Vector.');
        }
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Returns the distance between this Vector and another Vector.
     * @param {Vector} v - The other Vector.
     * @returns {number} The angle in radians.
     */
    angle(v) {
        if (!(v instanceof Vector)) {
            throw new Error('Vector.angle requires a Vector.');
        }
        return Math.atan2(v.y - this.y, v.x - this.x);
    }

    /**
     * Returns the dot product of this Vector and another Vector.
     * @param {Vector} v - The other Vector.
     * @returns {number} The dot product.
     */
    dot(v) {
        if (!(v instanceof Vector)) {
            throw new Error('Vector.dot requires a Vector.');
        }
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Returns a new Vector that is a copy of this Vector.
     * @returns {Vector} The new Vector.
     */
    copy() {
        return new Vector(this.x, this.y);
    }

    // Static function.
    
    /**
     * Returns a new Vector that is the result of adding two Vectors together.
     * @param {Vector} v1 - The first Vector.
     * @param {Vector} v2 - The second Vector.
     * @returns {Vector} The resulting Vector.
     */
    static add(v1, v2) {
        if (!(v1 instanceof Vector) || !(v2 instanceof Vector)) {
            throw new Error('Vector.add requires two Vectors.');
        }
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    /**
     * Returns a new Vector that is the result of subtracting one Vector from another.
     * @param {Vector} v1 - The Vector to subtract from.
     * @param {Vector} v2 - The Vector to subtract.
     * @returns {Vector} The resulting Vector.
     */
    static sub(v1, v2) {
        if (!(v1 instanceof Vector) || !(v2 instanceof Vector)) {
            throw new Error('Vector.sub requires two Vectors.');
        }
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    /**
     * Returns a new Vector that is the result of multiplying a Vector by a number.
     * @param {Vector} v - The Vector to multiply.
     * @param {number} n - The number to multiply by.
     * @returns {Vector} The resulting Vector.
     */
    static mult(v, n) {
        if (!(v instanceof Vector) || typeof n !== 'number') {
            throw new Error('Vector.mult requires a Vector and a number.');
        }
        return new Vector(v.x * n, v.y * n);
    }

    /**
     * Returns a new Vector that is the result of dividing a Vector by a number.
     * @param {Vector} v - The Vector to divide.
     * @param {number} n - The number to divide by.
     * @returns {Vector} The resulting Vector.
     */
    static div(v, n) {
        if (!(v instanceof Vector) || typeof n !== 'number') {
            throw new Error('Vector.div requires a Vector and a number.');
        }
        if (n === 0) {
            throw new Error('Cannot divide by zero.');
        }
        return new Vector(v.x / n, v.y / n);
    }

    /**
     * Returns a new Vector that is a normalized version of the given Vector.
     * @param {Vector} v - The Vector to normalize.
     * @returns {Vector} The resulting Vector.
     */
    static normalize(v) {
        if (!(v instanceof Vector)) {
            throw new Error('Vector.normalize requires a Vector.');
        }
        const len = v.mag();
        if (len === 0) {
            throw new Error('Cannot normalize a zero Vector.');
        }
        return new Vector(v.x / len, v.y / len);
    }

    /**
     * Returns the dot product of two Vectors.
     * @param {Vector} v1 - The first Vector.
     * @param {Vector} v2 - The second Vector.
     * @returns {number} The dot product.
     */
    static dot(v1, v2) {
        if (!(v1 instanceof Vector) || !(v2 instanceof Vector)) {
            throw new Error('Vector.dot requires two Vectors.');
        }
        return v1.x * v2.x + v1.y * v2.y;
    }
}