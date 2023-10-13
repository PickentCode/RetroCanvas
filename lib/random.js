
/**
 * Random utility class.
 * Provides methods for generating random and seeded random numbers.
 */
class Random {

    /**
     * Generates a pseudo-random float between [0, 1) based on the provided seed.
     * 
     * @param {number} seed - The seed value.
     * @returns {number} A pseudo-random float between [0, 1).
     */
    static seededRandom(seed) {
        if (typeof seed !== 'number') {
            throw new Error('Invalid seed: Expected a number.');
        }

        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    /**
     * Generates a pseudo-random float between [min, max) based on the provided seed.
     * 
     * @param {number} min - The minimum value (inclusive).
     * @param {number} max - The maximum value (exclusive).
     * @param {number} seed - The seed value.
     * @returns {number} A pseudo-random float between [min, max).
     */
    static seededRandomBetween(min, max, seed) {
        if (typeof min !== 'number' || typeof max !== 'number' || typeof seed !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for min, max, and seed.');
        }

        return this.seededRandom(seed) * (max - min) + min;
    }

    /**
     * Generates a random float between [min, max).
     * 
     * @param {number} min - The minimum value (inclusive).
     * @param {number} max - The maximum value (exclusive).
     * @returns {number} A random float between [min, max).
     */
    static randomBetween(min, max) {
        if (typeof min !== 'number' || typeof max !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for min and max.');
        }

        return Math.random() * (max - min) + min;
    }
}

/**
 * Class for generating Perlin Noise values.
 * Based on Raouf's blog post: https://rtouti.github.io/graphics/perlin-noise-algorithm
 */
class PerlinNoise {
    #repeatVal;
    #seed;

    /**
     * Constructor for the PerlinNoise class.
     * 
     * @param {number} seed - A seed value for generating random numbers.
     * @param {number} repeatVal - Defines the period before the noise pattern repeats.
     */
    constructor(seed = 0, repeatVal = 256) {
        if (typeof seed !== 'number') {
            throw new Error('Invalid seed: Expected a number.');
        }

        if (typeof repeatVal !== 'number' || repeatVal <= 0) {
            throw new Error('Invalid repeatVal: Expected a positive number.');
        }

        this.#repeatVal = GameMath.clamp(repeatVal, 0);
        this.#seed = GameMath.clamp(seed);
    }

    /**
     * Returns the Perlin noise value at the given x and y coordinates.
     * 
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {number} The Perlin noise value.
     */
    getValue(x, y) {
        if (typeof x !== 'number', typeof y !== 'number') {
            throw new Error('Invalid arguments: x and y are expected to be numbers.');
        }
        x = x - ~~(x / this.#repeatVal) * this.#repeatVal;
        y = y - ~~(y / this.#repeatVal) * this.#repeatVal;
        // Cell corners
        const pos1 = new Vector(~~x, ~~y);
        const pos2 = new Vector(~~x+1, ~~y);
        const pos3 = new Vector(~~x, ~~y+1);
        const pos4 = new Vector(~~x+1, ~~y+1);
        
        // Unique seeds for each corner
        const seed1 = this.#seed + (pos1.y % this.#repeatVal) * this.#repeatVal + (pos1.x % this.#repeatVal);
        const seed2 = this.#seed + (pos2.y % this.#repeatVal) * this.#repeatVal + (pos2.x % this.#repeatVal);
        const seed3 = this.#seed + (pos3.y % this.#repeatVal) * this.#repeatVal + (pos3.x % this.#repeatVal);
        const seed4 = this.#seed + (pos4.y % this.#repeatVal) * this.#repeatVal + (pos4.x % this.#repeatVal);

        // Vectors from corners
        const vec1 = new Vector(1 - Random.seededRandom(seed1) * 2, 1 - Random.seededRandom(seed1 + 1) * 2);
        const vec2 = new Vector(1 - Random.seededRandom(seed2) * 2, 1 - Random.seededRandom(seed2 + 1) * 2);
        const vec3 = new Vector(1 - Random.seededRandom(seed3) * 2, 1 - Random.seededRandom(seed3 + 1) * 2);
        const vec4 = new Vector(1 - Random.seededRandom(seed4) * 2, 1 - Random.seededRandom(seed4 + 1) * 2);
        // Vectors to point from corners
        const to1 = new Vector(x, y).sub(pos1);
        const to2 = new Vector(x, y).sub(pos2);
        const to3 = new Vector(x, y).sub(pos3);
        const to4 = new Vector(x, y).sub(pos4);
        // Use fade function for smoother transitions
        const u = this.#fade(x - ~~x);
        const v = this.#fade(y - ~~y);
        // Horizontal interpolations using the fade value for x
        const topVal = GameMath.lerp(Vector.dot(vec1, to1), Vector.dot(vec2, to2), u);
        const bottomVal = GameMath.lerp(Vector.dot(vec3, to3), Vector.dot(vec4, to4), u);

        // Vertical interpolation using the fade value for y
        return GameMath.lerp(topVal, bottomVal, v);
    }

    /**
     * Returns the Fractal Brownian Motion (FBM) value using Perlin noise.
     * 
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {number} octaves - The number of octaves to use for generating the FBM.
     * @param {number} persistence - The persistence value for generating the FBM.
     * @returns {number} The FBM value.
     */
    getFBMValue(x, y, octaves = 4, persistence = 0.5) {
        if (typeof x !== 'number' || typeof y !== 'number' || typeof octaves !== 'number' || typeof persistence !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for x, y, octaves, and persistence.');
        }

        if (octaves <= 0) {
            throw new Error('Invalid octaves: Expected a positive number.');
        }

        if (persistence < 0 || persistence > 1) {
            throw new Error('Invalid persistence: Expected a value between 0 and 1.');
        }
        
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for(let i = 0; i < octaves; i++) {
            total += this.getValue(x * frequency, y * frequency) * amplitude;

            maxValue += amplitude;

            amplitude *= persistence;
            frequency *= 2;
        }

        return total / maxValue;
    }

    /**
     * The fade function for smoothing transitions in the Perlin noise.
     * 
     * @param {number} t - The input value.
     * @returns {number} The faded value.
     */
    #fade(t) {
        if (typeof t !== 'number') {
            throw new Error('Invalid argument: Expected a number.');
        }
        return ((6*t - 15)*t + 10)*t*t*t;
    }
}

/**
 * Class for generating Voronoi Noise values.
 */
class VoronoiNoise {
    #cellCount;
    #repeatVal;
    #seed;
    #grid;
    #cellSize;

    /**
     * Constructor for the VoronoiNoise class.
     * 
     * @param {number} cellCount - The number of cells to partition the space.
     * @param {number} seed - A seed value for generating random numbers.
     * @param {number} repeatVal - Defines the period before the noise pattern repeats.
     */
    constructor(cellCount, seed = 0, repeatVal = 256) {
        if (typeof cellCount !== 'number' || cellCount <= 0) {
            throw new Error('Invalid cellCount: Expected a positive number.');
        }

        if (typeof seed !== 'number') {
            throw new Error('Invalid seed: Expected a number.');
        }

        if (typeof repeatVal !== 'number' || repeatVal <= 0) {
            throw new Error('Invalid repeatVal: Expected a positive number.');
        }

        this.#cellCount = cellCount;
        this.#repeatVal = repeatVal;
        this.#seed = seed;
        this.#cellSize = this.#repeatVal / this.#cellCount;

        this.#initializeGrid();
    }

    /**
     * Initializes the Voronoi grid with random points in each cell.
     */
    #initializeGrid() {
        this.#grid = new Array(this.#cellCount);
        let seed = this.#seed;
        for (let y = 0; y < this.#cellCount; y++) {
            this.#grid[y] = new Array(this.#cellCount);
            for (let x = 0; x < this.#cellCount; x++) {
                // If on the last row/column, the point should be taken from the opposite end to ensure tiling
                if (x === this.#cellCount - 1 && y !== this.#cellCount - 1) {
                    this.#grid[y][x] = new Vector(0, this.#grid[y][0].y);
                } else if (y === this.#cellCount - 1 && x !== this.#cellCount - 1) {
                    this.#grid[y][x] = new Vector(this.#grid[0][x].x, 0);
                } else if (x === this.#cellCount - 1 && y === this.#cellCount - 1) {
                    this.#grid[y][x] = new Vector(0, 0);
                } else {
                    this.#grid[y][x] = new Vector(
                        x * this.#cellSize + Random.seededRandom(seed) * this.#cellSize,
                        y * this.#cellSize + Random.seededRandom(seed) * this.#cellSize
                    );
                }
                seed += Random.seededRandomBetween(1, 10, seed);
            }
        }
    }    

    /**
     * Computes the tiling distance between two points considering the repeat value.
     * 
     * @param {Vector} p1 - The first point.
     * @param {Vector} p2 - The second point.
     * @returns {number} The tiling distance.
     */
    #getTilingDistance(p1, p2) {
        const dx = Math.abs(p2.x - p1.x);
        const dy = Math.abs(p2.y - p1.y);
        const tdx = this.#repeatVal - dx;
        const tdy = this.#repeatVal - dy;

        const minDx = Math.min(dx, tdx);
        const minDy = Math.min(dy, tdy);

        return Math.sqrt(minDx * minDx + minDy * minDy);
    }

    /**
     * Returns the Voronoi noise value at the given x and y coordinates.
     * 
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {number} The Voronoi noise value.
     */
    getValue(x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for x and y.');
        }

        const cellX = Math.floor(x / this.#cellSize);
        const cellY = Math.floor(y / this.#cellSize);

        let minDistance = Infinity;

        for (let offsetY = -1; offsetY <= 1; offsetY++) {
            for (let offsetX = -1; offsetX <= 1; offsetX++) {
                const curCellX = (cellX + offsetX + this.#grid[0].length) % this.#grid[0].length;
                const curCellY = (cellY + offsetY + this.#grid.length) % this.#grid.length;

                const point = this.#grid[curCellY][curCellX];
                const distance = this.#getTilingDistance(point, new Vector(x, y));

                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
        }

        return minDistance;
    }
}

/**
 * Cellular Automata for generating cave-like structures.
 */
class CellularAutomata {
    #width;
    #height;
    #map = [];
    #noiseMap;

    /**
     * Constructor for the CellularAutomata class.
     * 
     * @param {number} width - The width of the cave.
     * @param {number} height - The height of the cave.
     */
    constructor(width, height) {
        if (typeof width !== 'number' || width <= 0) {
            throw new Error('Invalid width: Expected a positive number.');
        }

        if (typeof height !== 'number' || height <= 0) {
            throw new Error('Invalid height: Expected a positive number.');
        }

        this.#width = width;
        this.#height = height;
    }

    /**
     * Generates and returns the cave structure.
     * 
     * @param {number} noiseDensity - The density of the noise.
     * @param {number} interations - Number of iterations for cellular automata processing.
     * @param {number} seed - A seed value for generating random numbers.
     * @returns {Array} The generated cave structure.
     */
    getCave(noiseDensity = 0.4, interations = 10, seed = 0) {
        if (typeof noiseDensity !== 'number' || noiseDensity < 0 || noiseDensity > 1) {
            throw new Error('Invalid noiseDensity: Expected a number between 0 and 1.');
        }

        if (typeof interations !== 'number' || interations <= 0) {
            throw new Error('Invalid interations: Expected a positive number.');
        }

        if (typeof seed !== 'number') {
            throw new Error('Invalid seed: Expected a number.');
        }
        
        this.#noiseMap = this.#getNoiseMap(noiseDensity, seed);
        for (let i = 0; i < interations; i++) {
            this.#iterate();
            this.#updateNoiseMap();
        }
        return this.#map;
    }

    #iterate() {
        for (let y = 0; y < this.#height; y++) {
            this.#map[y] = [];
            for (let x = 0; x < this.#width; x++) {
                this.#map[y][x] = this.#getCellValue(x, y);
            }
        }
    }

    #getCellValue(x, y) {
        let counter = 0;
        for (let j = y - 1; j <= y + 1; j++) {
            for (let i = x - 1; i <= x + 1; i++) {
                if (i == x && j == y) continue;
                if (i < 0 || j < 0 || i >= this.#width || j >= this.#height) {
                    counter++;
                } else {
                    counter = this.#noiseMap[j][i] === 0 ? counter + 1 : counter;
                }
            }
        }
        return counter > 4 ? 0 : 1;
    }

    #getNoiseMap(noiseDensity, seed) {
        let result = [];
        for (let y = 0; y < this.#height; y++) {
            result[y] = [];
            for (let x = 0; x < this.#width; x++) {
                result[y][x] = Random.seededRandom(seed) < noiseDensity ? 0 : 1;
                seed += Random.seededRandomBetween(1, 10, seed);
            }
        }
        return result;
    }

    #updateNoiseMap() {
        for (let y = 0; y < this.#height; y++) {
            for (let x = 0; x < this.#width; x++) {
                this.#noiseMap[y][x] = this.#map[y][x];
            }
        }
    }

    /**
     * Returns the width of the cave.
     * 
     * @returns {number} The width.
     */
    get width() {
        return this.#width;
    }

    /**
     * Returns the height of the cave.
     * 
     * @returns {number} The height.
     */
    get height() {
        return this.#height;
    }
}