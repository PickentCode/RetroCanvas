class Ray {
    constructor(pos, dir, length, cellSize, map) {
        if (!Array.isArray(map) || !Array.isArray(map[0])) {
            throw new Error('Invalid map: Expected a 2D array.');
        }

        this.position = pos;
        this.direction = dir;
        this.length = length;
        this.cellSize = cellSize;
        this.map = map;
        this.hit = null;
        this.hitSide = 0;
    }

    updateData(pos, dir) {
        this.position = pos;
        this.direction = dir;
    }

    // scuffed DDA implementation
    cast (map) {
        let xCollision = false;
        let yCollision = false;
        let stepX = 0;
        let stepY = 0;
        let dx = this.cellSize - this.position.x % this.cellSize;
        let dy = this.cellSize - this.position.y % this.cellSize;
        let result = null;
        let resultLength = this.length;
        let counter = 0;
        let xFactor, yFactor;
        // transparent object variables
        let xTransparentHit = false;
        let yTransparentHit = false;
        // step should increase based on the ray direction
        if (this.direction.x < 0)
        {
            xFactor = -1;
            dx -= this.cellSize;
        }
        else
        {
            xFactor = 1;
        }
        if (this.direction.y < 0)
        {
            yFactor = -1;
            dy -= this.cellSize;
        }
        else
        {
            yFactor = 1;
        }
        while ((!xCollision || !yCollision) && (stepX <= this.length) || (stepY <= this.length)) { //  && stepX <= (this.length || stepY <= this.length)
            // for infinite loop
            counter ++;
            if (counter >= (map[0].length + map.length) * 2) {
                console.warn("DDA ran too long! Reduce the lengths of the rays.");
                break;
            }
            if (stepX < stepY) {
                if (this.direction.x == 0) {
                    stepX = this.length;
                } else {
                    let moveX = dx;
                    let moveY = (this.direction.y / this.direction.x) * dx;
                    stepX = Math.sqrt(Math.pow(moveX, 2) + Math.pow(moveY, 2));
                    dx += this.cellSize * xFactor;
                    let x = (this.position.x + moveX + xFactor) / this.cellSize;
                    let y = (this.position.y + moveY) / this.cellSize;
                    if (x < map[0].length && y < map.length && x > 0 && y > 0) {
                        // if transparent block (window, door), then increase the steb by half the block
                        if (map[Math.floor(y)][Math.floor(x)] < 0 && !xTransparentHit) {
                            xTransparentHit = true;
                            dx -= this.cellSize * xFactor / 2;
                        } else {
                            xCollision = map[Math.floor(y)][Math.floor(x)] != 0;
                            result = xCollision && stepX < resultLength ? new Vector(x * this.cellSize, y * this.cellSize) : result;
                            this.hitSide = xCollision && stepX < resultLength ? 1 : this.hitSide;
                            resultLength = xCollision && stepX < resultLength ? stepX : resultLength;
                        }
                    }
                }
            } else {
                if (this.direction.y == 0) {
                    stepY = this.length;
                } else {
                    let moveX = (this.direction.x / this.direction.y) * dy;
                    let moveY = dy;
                    stepY = Math.sqrt(Math.pow(moveX, 2) + Math.pow(moveY, 2));
                    dy += this.cellSize * yFactor;
                    let x = (this.position.x + moveX) / this.cellSize;
                    let y = (this.position.y + moveY + yFactor) / this.cellSize;
                    if (x < map[0].length && y < map.length && x > 0 && y > 0) {
                        // if transparent block (window, door), then increase the steb by half the block
                        if (map[Math.floor(y)][Math.floor(x)] < 0 && !yTransparentHit) {
                            yTransparentHit = true;
                            dy -= this.cellSize * yFactor / 2;
                        } else {
                            yCollision = map[Math.floor(y)][Math.floor(x)] != 0;
                            result = yCollision && stepY < resultLength ? new Vector(x * this.cellSize, y * this.cellSize) : result;
                            this.hitSide = yCollision && stepY < resultLength ? 2 : this.hitSide;
                            resultLength = yCollision && stepY < resultLength ? stepY : resultLength;
                        }
                    }
                }
            }
            
        }
        return result;
    }
}