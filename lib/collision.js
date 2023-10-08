class Collision {
    /**
     * Checks for a collision between two lines.
     * @param {Vector} line1Start - The start point of the first line.
     * @param {Vector} line1End - The end point of the first line.
     * @param {Vector} line2Start - The start point of the second line.
     * @param {Vector} line2End - The end point of the second line.
     * @returns {Object} An object with a `collided` property (a boolean indicating whether a collision occurred) and a `point` property (a `Vector` representing the point of collision, if one occurred).
     */
    static lineLineCollision(line1Start, line1End, line2Start, line2End) {
        if (!(line1Start instanceof Vector) || !(line1End instanceof Vector) || !(line2Start instanceof Vector) || !(line2End instanceof Vector)) {
            throw new Error('Invalid arguments: Expected four Vectors.');
        }

        const x1 = line1Start.x;
        const y1 = line1Start.y;
        const x2 = line1End.x;
        const y2 = line1End.y;
        const x3 = line2Start.x;
        const y3 = line2Start.y;
        const x4 = line2End.x;
        const y4 = line2End.y;

        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        // Lines are parallel
        if (denominator === 0) {
            return { collided: false, point: null };
        }

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            const x = x1 + t * (x2 - x1);
            const y = y1 + t * (y2 - y1);
            return { collided: true, point: new Vector(x, y) };
        }

        return { collided: false, point: null };
    }

    /**
     * Checks for a collision between a line and a circle.
     * @param {Vector} lineStart - The start point of the line.
     * @param {Vector} lineEnd - The end point of the line.
     * @param {Vector} circleCenter - The center of the circle.
     * @param {number} circleRadius - The radius of the circle.
     * @returns {Object} An object with a `collided` property (a boolean indicating whether a collision occurred) and a `point` property (a `Vector` representing the point of collision, if one occurred).
     */
    static lineCircleCollision(lineStart, lineEnd, circleCenter, circleRadius) {
        if (!(lineStart instanceof Vector) || !(lineEnd instanceof Vector) || !(circleCenter instanceof Vector)) {
            throw new Error('Invalid arguments: Expected Vectors for lineStart, lineEnd, and circleCenter.');
        }
        if (typeof circleRadius !== 'number') {
            throw new Error('Invalid argument: Expected a number for circleRadius.');
        }

        // Calculate the direction of the line
        const lineDirection = lineEnd.copy();
        lineDirection.sub(lineStart);

        // Calculate the vector from the line start to the circle center
        const startToCenter = circleCenter.copy();
        startToCenter.sub(lineStart);

        // Project startToCenter onto the line direction to find the closest point on the line to the circle center
        const projectionLength = startToCenter.dot(lineDirection) / lineDirection.mag();
        const projection = lineDirection.copy();
        projection.normalize();
        projection.mult(projectionLength);

        // If the projection is outside the line segment, clamp it to the closest endpoint
        if (projectionLength < 0) {
            projection.set(lineStart.x, lineStart.y);
        } else if (projectionLength > lineDirection.mag()) {
            projection.set(lineEnd.x, lineEnd.y);
        } else {
            projection.add(lineStart);
        }

        // If the distance from the circle center to the projection is less than the circle radius, there is a collision
        const distance = circleCenter.distance(projection);
        if (distance <= circleRadius) {
            return { collided: true, point: projection };
        }

        return { collided: false, point: null };
    }

    /**
     * Checks for a collision between a line and a rectangle.
     * @param {Vector} lineStart - The start point of the line.
     * @param {Vector} lineEnd - The end point of the line.
     * @param {Vector} rectPosition - The position of the rectangle.
     * @param {number} rectWidth - The width of the rectangle.
     * @param {number} rectHeight - The height of the rectangle.
     * @param {number} rectRotation - The rotation of the rectangle.
     * @returns {Object} An object with a `collided` property (a boolean indicating whether a collision occurred) and a `point` property (a `Vector` representing the point of collision, if one occurred).
     */
    static lineRectCollision(lineStart, lineEnd, rectPosition, rectWidth, rectHeight, rectRotation) {
        if (!(lineStart instanceof Vector) || !(lineEnd instanceof Vector) || !(rectPosition instanceof Vector)) {
            throw new Error('Invalid arguments: Expected Vectors for lineStart, lineEnd, and rectPosition.');
        }
        if (typeof rectWidth !== 'number' || typeof rectHeight !== 'number' || typeof rectRotation !== 'number') {
            throw new Error('Invalid arguments: Expected numbers for rectWidth, rectHeight, and rectRotation.');
        }

        const vertices = this.calculateRectangleVertices(rectPosition, rectWidth, rectHeight, rectRotation);
        const sides = [
            { start: vertices[0], end: vertices[1] },
            { start: vertices[1], end: vertices[2] },
            { start: vertices[2], end: vertices[3] },
            { start: vertices[3], end: vertices[0] },
        ];

        let collided = false;
        let points = [];

        for (let side of sides) {
            const result = this.lineLineCollision(lineStart, lineEnd, side.start, side.end);
            if (result.collided) {
                collided = true;
                points.push(result.point);
            }
        }

        if (collided) {
            const x = (points[0].x + points[1].x) / 2;
            const y = (points[0].y + points[1].y) / 2;
            return { collided: true, point: new Vector(x, y) };
        }

        return { collided: false, point: null };
    }

    /**
     * Checks for a collision between two circles.
     * @param {Vector} circle1Center - The center of the first circle.
     * @param {number} circle1Radius - The radius of the first circle.
     * @param {Vector} circle2Center - The center of the second circle.
     * @param {number} circle2Radius - The radius of the second circle.
     * @returns {Object} An object with a `collided` property (a boolean indicating whether a collision occurred) and a `point` property (a `Vector` representing the point of collision, if one occurred).
     */
    static circleCircleCollision(circle1Center, circle1Radius, circle2Center, circle2Radius) {
        if (!(circle1Center instanceof Vector) || !(circle2Center instanceof Vector)) {
            throw new Error('Invalid arguments: circle1Center and circle2Center should be Vectors.');
        }
        if (typeof circle1Radius !== 'number' || typeof circle2Radius !== 'number') {
            throw new Error('Invalid arguments: circle1Radius and circle2Radius should be numbers.');
        }
        const distance = circle1Center.distance(circle2Center);
        const collided = distance <= (circle1Radius + circle2Radius);
        let point = null;
        if (collided) {
            // Calculate the collision point based on the radius of the circles
            const totalRadius = circle1Radius + circle2Radius;
            const ratio = circle1Radius / totalRadius;
            const collisionX = circle1Center.x + ratio * (circle2Center.x - circle1Center.x);
            const collisionY = circle1Center.y + ratio * (circle2Center.y - circle1Center.y);
            point = new Vector(collisionX, collisionY);
        }
        return { collided, point };
    }

    /**
     * Checks for a collision between a circle and a rotated rectangle.
     * @param {Vector} circleCenter - The center of the circle.
     * @param {number} circleRadius - The radius of the circle.
     * @param {Vector} rectCenter - The center of the rectangle.
     * @param {number} rectWidth - The width of the rectangle.
     * @param {number} rectHeight - The height of the rectangle.
     * @param {number} rectRotation - The rotation of the rectangle in radians.
     * @returns {Object} An object with a `collided` property (a boolean indicating whether a collision occurred) and a `point` property (a `Vector` representing the point of collision, if one occurred).
     */
    static circleRectCollision(circleCenter, circleRadius, rectCenter, rectWidth, rectHeight, rectRotation) {
        if (!(circleCenter instanceof Vector) || !(rectCenter instanceof Vector)) {
            throw new Error('Invalid arguments: circleCenter and rectCenter should be Vectors.');
        }
        if (typeof circleRadius !== 'number' || typeof rectWidth !== 'number' || typeof rectHeight !== 'number' || typeof rectRotation !== 'number') {
            throw new Error('Invalid arguments: circleRadius, rectWidth, rectHeight, and rectRotation should be numbers.');
        }
    
        // Calculate the vertices of the rectangle
        const rectVertices = this.calculateRectangleVertices(rectCenter, rectWidth, rectHeight, rectRotation);

        // Calculate the total distance from the circle's center to each corner of the rectangle
        let totalDistance = 0;
        for (let vertex of rectVertices) {
            totalDistance += circleCenter.distance(vertex);
        }

        // If the total distance is less than the sum of the rectangle's diagonals,
        // then the circle's center is inside the rectangle
        const maxDistance = Math.sqrt(rectWidth * rectWidth + rectHeight * rectHeight) * 2;
        if (totalDistance <= maxDistance+1) {
            return { collided: true, point: circleCenter };
        }
    
        // Check if the circle collides with any of the rectangle's edges
        let collided = false;
        let closestPoint = null;
        let minDistance = Infinity;
        for (let i = 0; i < rectVertices.length; i++) {
            const start = rectVertices[i];
            const end = rectVertices[(i + 1) % rectVertices.length]; // Wrap around to the first vertex for the last edge
    
            const collision = this.lineCircleCollision(start, end, circleCenter, circleRadius);
            if (collision.collided) {
                collided = true;
                const distance = collision.point.distance(circleCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = collision.point;
                }
            }
        }
    
        return { collided, point: closestPoint };
    }     

    /**
     * Checks for a collision between two rectangles.
     * @param {Vector} rect1Pos - The position of the first rectangle.
     * @param {number} rect1Width - The width of the first rectangle.
     * @param {number} rect1Height - The height of the first rectangle.
     * @param {number} rect1Rotation - The rotation of the first rectangle in radians.
     * @param {Vector} rect2Pos - The position of the second rectangle.
     * @param {number} rect2Width - The width of the second rectangle.
     * @param {number} rect2Height - The height of the second rectangle.
     * @param {number} rect2Rotation - The rotation of the second rectangle in radians.
     * @returns {boolean} A boolean indicating whether a collision occurred.
     */
    static rectRectCollision(rect1Pos, rect1Width, rect1Height, rect1Rotation, rect2Pos, rect2Width, rect2Height, rect2Rotation) {
        if (!(rect1Pos instanceof Vector) || !(rect2Pos instanceof Vector)) {
            throw new Error('Invalid argument: rect1Pos and rect2Pos should be Vectors.');
        }
        if (typeof rect1Width !== 'number' || typeof rect1Height !== 'number' || typeof rect1Rotation !== 'number' ||
            typeof rect2Width !== 'number' || typeof rect2Height !== 'number' || typeof rect2Rotation !== 'number') {
            throw new Error('Invalid arguments: rect1Width, rect1Height, rect1Rotation, rect2Width, rect2Height, and rect2Rotation should be numbers.');
        }
        if (rect1Width <= 0 || rect1Height <= 0 || rect2Width <= 0 || rect2Height <= 0) {
            throw new Error('Invalid arguments: rect1Width, rect1Height, rect2Width, and rect2Height should be greater than 0.');
        }

        const rect1Vertices = this.calculateRectangleVertices(rect1Pos, rect1Width, rect1Height, rect1Rotation);
        const rect2Vertices = this.calculateRectangleVertices(rect2Pos, rect2Width, rect2Height, rect2Rotation);

        let axis1 = rect1Vertices[1].copy();
        axis1.sub(rect1Vertices[0]);
        let axis2 = rect1Vertices[3].copy();
        axis2.sub(rect1Vertices[0]);
        let axis3 = rect2Vertices[1].copy();
        axis3.sub(rect2Vertices[0]);
        let axis4 = rect2Vertices[3].copy();
        axis4.sub(rect2Vertices[0]);

        const axes = [axis1, axis2, axis3, axis4];

        for (const axis of axes) {
            axis.normalize();

            let [minA, maxA] = this.projectVerticesOntoAxis(axis, rect1Vertices);
            let [minB, maxB] = this.projectVerticesOntoAxis(axis, rect2Vertices);

            if (maxA < minB || maxB < minA) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculates the vertices of a rectangle.
     * @param {Vector} position - The position of the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {number} rotation - The rotation of the rectangle in radians.
     * @returns {Vector[]} The vertices of the rectangle in clockwise order.
     */
    static calculateRectangleVertices(position, width, height, rotation) {
        if (!(position instanceof Vector)) {
            throw new Error('Invalid argument: position should be a Vector.');
        }
        if (typeof width !== 'number' || typeof height !== 'number' || typeof rotation !== 'number') {
            throw new Error('Invalid arguments: width, height, and rotation should be numbers.');
        }
        if (width <= 0 || height <= 0) {
            throw new Error('Invalid arguments: width and height should be greater than 0.');
        }
    
        const halfWidth = width / 2;
        const halfHeight = height / 2;
    
        // The corners of the rectangle centered at the origin
        const corners = [
            new Vector(-halfWidth, -halfHeight),
            new Vector(halfWidth, -halfHeight),
            new Vector(halfWidth, halfHeight),
            new Vector(-halfWidth, halfHeight),
        ];
    
        rotation = GameMath.degreesToRadians(rotation);

        const cosTheta = Math.cos(rotation);
        const sinTheta = Math.sin(rotation);
    
        // Rotate and translate the corners
        const vertices = corners.map((corner) => {
            const x = corner.x * cosTheta - corner.y * sinTheta + position.x;
            const y = corner.x * sinTheta + corner.y * cosTheta + position.y;
            return new Vector(x, y);
        });
    
        return vertices;
    }
    

    /**
     * Projects a set of vertices onto an axis.
     * @param {Vector} axis - The axis to project onto.
     * @param {Vector[]} vertices - The vertices to project.
     * @returns {number[]} The minimum and maximum projections.
     */
    static projectVerticesOntoAxis(axis, vertices) {
        if (!(axis instanceof Vector)) {
            throw new Error('Invalid argument: axis should be a Vector.');
        }
        if (!Array.isArray(vertices) || vertices.some(vertex => !(vertex instanceof Vector))) {
            throw new Error('Invalid argument: vertices should be an array of Vectors.');
        }

        let min = axis.dot(vertices[0]);
        let max = min;

        for (let i = 1; i < vertices.length; i++) {
            const projection = axis.dot(vertices[i]);
            min = Math.min(min, projection);
            max = Math.max(max, projection);
        }

        return [min, max];
    }
}