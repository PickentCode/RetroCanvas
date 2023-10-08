/**
 * SpatialGrid class represents a grid-based spatial partitioning structure 
 * for efficient collision detection or proximity queries.
 */
class SpatialGrid {
    #width;
    #height;
    #cellSize;
    #columns;
    #rows;
    #grid;

    /**
     * Constructs a new SpatialGrid instance.
     * 
     * @param {number} cellSize - The size of each grid cell.
     * @param {number} width - The width of the grid in world units.
     * @param {number} height - The height of the grid in world units.
     */
    constructor(cellSize, width, height) {
        if (typeof cellSize !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
            throw new Error("cellSize, width, and height must be numbers.");
        }
        if (cellSize <= 0 || width <= 0 || height <= 0) {
            throw new Error("cellSize, width, and height must be positive values.");
        }

        this.#width = width;
        this.#height = height;
        this.#cellSize = cellSize;
        this.#columns = Math.ceil(width / cellSize);
        this.#rows = Math.ceil(height / cellSize);
        this.#grid = Array.from({ length: this.#rows }, () => Array.from({ length: this.#columns }, () => []));
    }

    /**
     * Inserts a Node into the grid based on its position.
     * 
     * @param {PhysicsNode} node - The Node object to be inserted into the grid. Its position property should be an instance of Vector.
     */
    insert(node) {
        if (!(node instanceof PhysicsNode) || !(node.position instanceof Vector)) {
            throw new Error("Invalid node. The node should be an instance of PhysicsNode and its position property should be an instance of Vector.");
        }
        const col = GameMath.clamp(~~(node.position.x / this.#cellSize), 0, ~~(this.#width / this.#cellSize));
        const row = GameMath.clamp(~~(node.position.y / this.#cellSize), 0, ~~(this.#height / this.#cellSize));
        this.#grid[row][col].push(node);
    }

    /**
     * Fetches nearby Nodes from the grid for a given Node.
     * 
     * @param {PhysicsNode} node - The reference Node object. Its position property should be an instance of Vector.
     * @returns {Array} - An array of nearby Nodes.
     */
    getNearby(node) {
        if (!(node instanceof PhysicsNode) || !(node.position instanceof Vector)) {
            throw new Error("Invalid node. The node should be an instance of PhysicsNode and its position property should be an instance of Vector.");
        }
        const col = Math.floor(node.position.x / this.#cellSize);
        const row = Math.floor(node.position.y / this.#cellSize);
        let nearbyNodes = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.#rows && newCol >= 0 && newCol < this.#columns) {
                    nearbyNodes = nearbyNodes.concat(this.#grid[newRow][newCol]);
                }
            }
        }
        return nearbyNodes;
    }

    
    /**
     * Retrieves nodes in the grid that are near a given connection defined by two Nodes.
     * 
     * @param {PhysicsNode} startNode - The starting Node of the connection.
     * @param {PhysicsNode} endNode - The ending Node of the connection.
     * @returns {Array} - An array of nodes.
     */
    getNodesForConnection(startNode, endNode) {
        if (!(startNode instanceof PhysicsNode) || !(startNode.position instanceof Vector)) {
            throw new Error("startNode should be an instance of PhysicsNode and its position should be an instance of Vector.");
        }
        if (!(endNode instanceof PhysicsNode) || !(endNode.position instanceof Vector)) {
            throw new Error("endNode should be an instance of PhysicsNode and its position should be an instance of Vector.");
        }

        const cells = this.#getCellsForConnection(startNode, endNode);
        let nodes = [];

        for (let cell of cells) {
            // Check the current cell and its adjacent cells
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = cell.row + i;
                    const newCol = cell.col + j;
                    if (newRow >= 0 && newRow < this.#rows && newCol >= 0 && newCol < this.#columns) {
                        nodes = nodes.concat(this.#grid[newRow][newCol]);
                        //camera.drawEllipse(new Vector((newCol + 0.5)*this.cellSize, (newRow + 0.5)*this.cellSize), 5, 5, new Color(50, 50, 50, 255)); // debugging
                    }
                }
            }
        }

        // Remove duplicate nodes (if any)
        nodes = [...new Set(nodes)];

        return nodes;
    }

    /**
     * Utilizes Bresenham's algorithm to get the cells that a connection (line segment) intersects.
     * 
     * @private
     * @param {PhysicsNode} startNode - The starting Node of the connection.
     * @param {PhysicsNode} endNode - The ending Node of the connection.
     * @returns {Array} - An array of cells.
     */
    #getCellsForConnection(startNode, endNode) {
        if (!(startNode instanceof PhysicsNode) || !(startNode.position instanceof Vector)) {
            throw new Error("startNode should be an instance of PhysicsNode and its position should be an instance of Vector.");
        }
        if (!(endNode instanceof PhysicsNode) || !(endNode.position instanceof Vector)) {
            throw new Error("endNode should be an instance of PhysicsNode and its position should be an instance of Vector.");
        }

        const cells = [];
        
        let x0 = Math.floor(startNode.position.x / this.#cellSize);
        let y0 = Math.floor(startNode.position.y / this.#cellSize);
        const x1 = Math.floor(endNode.position.x / this.#cellSize);
        const y1 = Math.floor(endNode.position.y / this.#cellSize);

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);

        const sx = (x0 < x1) ? 1 : -1;  // step direction for x
        const sy = (y0 < y1) ? 1 : -1;  // step direction for y

        let err = dx - dy;

        let counter = 0; // added for debugging
        while (true) {
            cells.push({ col: x0, row: y0 });

            if (x0 === x1 && y0 === y1) break;  // Connection has been fully processed

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }

            counter++;  // added for debugging
            if (counter > 1000) {
                console.error("Loop running for too long!");
                break;
            }
        }

        return cells;
    }         

    /**
     * Clears all objects from the grid.
     */
    clear() {
        for (let i = 0; i < this.#rows; i++) {
            for (let j = 0; j < this.#columns; j++) {
                this.#grid[i][j] = [];
            }
        }
    }
}