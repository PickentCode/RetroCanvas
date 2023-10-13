class Color {
    /**
     * Creates a new Color.
     * @param {number} r - The red component (0-255).
     * @param {number} g - The green component (0-255).
     * @param {number} b - The blue component (0-255).
     * @param {number} a - The alpha component (0-255).
     */
    constructor(r, g, b, a) {
        this.r = ~~r;
        this.g = ~~g;
        this.b = ~~b;
        this.a = ~~a;
    }
    
    /**
     * Mixes this color with another color.
     * @param {Color} color - The color to mix with.
     * @param {number} ratio - The ratio of the other color (0-1).
    */
    mix(color, ratio) {
        if (!(color instanceof Color)) {
            throw new Error('Color.mix requires a Color.');
        }
        if (ratio < 0 || ratio > 1) {
            throw new Error("The ratio must be between 0 and 1!");
        }
        this.r = ~~((this.r * (1 - ratio) + color.r * ratio));
        this.g = ~~((this.g * (1 - ratio) + color.g * ratio));
        this.b = ~~((this.b * (1 - ratio) + color.b * ratio));
        this.a = ~~((this.a * (1 - ratio) + color.a * ratio));
    }
    
    /**
     * Adds another color to this color.
     * @param {Color} color - The color to add.
    */
    add(color) {
        if (!(color instanceof Color)) {
           throw new Error('Color.add requires a Color.');
        }
        this.r = Math.min(255, this.r + color.r);
        this.g = Math.min(255, this.g + color.g);
        this.b = Math.min(255, this.b + color.b);
        this.a = Math.min(255, this.a + color.a);
    }
    
    /**
     * Subtracts another color from this color.
     * @param {Color} color - The color to subtract.
    */
    sub(color) {
       if (!(color instanceof Color)) {
           throw new Error('Color.sub requires a Color.');
        }
        this.r = Math.max(0, this.r - color.r);
        this.g = Math.max(0, this.g - color.g);
        this.b = Math.max(0, this.b - color.b);
        this.a = Math.max(0, this.a - color.a);
    }
    
    /**
     * Multiplies the color components by a factor.
     * @param {number} factor - The factor to multiply by (0-1).
    */
    mult(factor) {
       if (factor < 0 || factor > 1) {
           throw new Error("The factor must be between 0 and 1!");
        }
        this.r = ~~(this.r * factor);
        this.g = ~~(this.g * factor);
        this.b = ~~(this.b * factor);
        this.a = ~~(this.a * factor);
    }
    
    /**
     * Divides this color by another color.
     * @param {Color} color - The color to divide by.
    */
    div(color) {
       if (!(color instanceof Color)) {
           throw new Error('Color.div requires a Color.');
        }
        if (color.r === 0 || color.g === 0 || color.b === 0 || color.a === 0) {
            throw new Error('Cannot divide by a Color with a zero component.');
        }
        this.r = Math.max(0, Math.min(255, ~~(this.r / color.r)));
        this.g = Math.max(0, Math.min(255, ~~(this.g / color.g)));
        this.b = Math.max(0, Math.min(255, ~~(this.b / color.b)));
        this.a = Math.max(0, Math.min(255, ~~(this.a / color.a)));
    }

    /**
     * Returns the color as a hexadecimal string.
     * @returns {string} The color as a hexadecimal string.
     */
    getColorAsHex() {
        const r = this.r.toString(16).padStart(2, '0');
        const g = this.g.toString(16).padStart(2, '0');
        const b = this.b.toString(16).padStart(2, '0');
        const a = this.a.toString(16).padStart(2, '0');
        return `#${r}${g}${b}${a}`;
    }

    /**
     * Sets the color components from an integer.
     * @param {number} int - The integer color value.
     */
    intToColor(int) {
        if (typeof int !== 'number' || !Number.isInteger(int) || int < 0 || int > 4294967295) {
            throw new Error('Invalid integer: Expected an integer between 0 and 4294967295.');
        }
        this.r = (int & 0b00000000000000000000000011111111);
        this.g = (int & 0b00000000000000001111111100000000) >> 8;
        this.b = (int & 0b00000000111111110000000000000000) >> 16;
        this.a = (int & 0b11111111000000000000000000000000) >> 24;
    }
    
    /**
     * Returns the color as a 32-bit integer.
     * @returns {number} The color as a 32-bit integer.
    */
    getColorAs32Int() {
       return this.a << 24 | this.b << 16 | this.g << 8 | this.r; 
    }

    /**
     * Returns a new Color that is a copy of this Color.
     * @returns {Color} The new Color.
     */
    copy() {
        return new Color(this.r, this.g, this.b, this.a);
    }
}