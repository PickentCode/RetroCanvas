class Pathfinder {
    static getPath(grid, startPos, targetPos, canMoveCells = [0], movementType = "orthogonal", maxIterations = 1000) {
        if (!this.#isValidStartAndTarget(grid, startPos, targetPos, canMoveCells)) {
            console.error("Invalid start or target position.");
            return [];
        }

        let openList = [startPos]; // Open list using an array of Vector objects
        let cameFrom = new Map(); // Mapping of Vector => Vector for tracking paths
        let gScore = new Map(); // Map with Vector keys for cost from start node to current node
        let fScore = new Map(); // Map with Vector keys for estimated cost from start to end through the current node

        gScore.set(startPos, 0);
        fScore.set(startPos, this.#heuristic(startPos, targetPos, movementType));

        let iterations = 0;
        while (openList.length > 0 && iterations < maxIterations) {
            iterations++;
            let current = openList.reduce((a, b) => fScore.get(a) < fScore.get(b) ? a : b);

            if (current.equals(targetPos)) {
                //console.log(iterations);
                return this.#reconstructPath(cameFrom, current);
            }

            openList = openList.filter(v => !v.equals(current));
            this.#getNeighbors(grid, current, movementType, canMoveCells).forEach(neighbor => {
                let tentativeGScore = gScore.get(current) + 1;

                if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeGScore);
                    fScore.set(neighbor, tentativeGScore + this.#heuristic(neighbor, targetPos, movementType));

                    if (!openList.some(v => v.equals(neighbor))) {
                        openList.push(neighbor);
                    }
                }
            });
        }

        return [];
    }

    static #getNeighbors(grid, pos, movementType, canMoveCells) {
        const directions = movementType === "diagonal"
            ? [new Vector(-1, 0), new Vector(1, 0), new Vector(0, -1), new Vector(0, 1),
               new Vector(-1, -1), new Vector(-1, 1), new Vector(1, -1), new Vector(1, 1)]
            : [new Vector(-1, 0), new Vector(1, 0), new Vector(0, -1), new Vector(0, 1)];

        const neighbors = [];
        for (let direction of directions) {
            const newX = pos.x + direction.x, newY = pos.y + direction.y;
            if (newX >= 0 && newX < grid.length && newY >= 0 && newY < grid[0].length && canMoveCells.includes(grid[newY][newX])) {
                neighbors.push(new Vector(newX, newY));
            }
        }
        return neighbors;
    }

    static #isValidStartAndTarget(grid, startPos, targetPos, canMoveCells) {
        return startPos.x >= 0 && startPos.x < grid.length && startPos.y >= 0 && startPos.y < grid[0].length && canMoveCells.includes(grid[startPos.y][startPos.x]) &&
               targetPos.x >= 0 && targetPos.x < grid.length && targetPos.y >= 0 && targetPos.y < grid[0].length && canMoveCells.includes(grid[targetPos.y][targetPos.x]);
    }

    static #heuristic(posA, posB, movementType) {
        // If diagonal, return euclidean dist, otherwise Manhattan dist
        return movementType == "diagonal" ? Vector.distance(posA, posB) : Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y);
    }

    static #reconstructPath(cameFrom, current) {
        let totalPath = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            totalPath.unshift(current); // No need to copy since we're working directly with Vector instances
        }
        return totalPath;
    }
}