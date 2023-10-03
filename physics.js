/**
 * A class that handles physics simulation for a set of objects.
 */
class Physics {
    #gravity;
    #objects;
    #lastUpdate;
    #maxTimeStep;
    #canvasWidth;
    #canvasHeight;
    #intervalID;
    #frameRate;
    
    /**
     * Create a physics simulation.
     * @param {number} canvasWidth - The width of the canvas.
     * @param {number} canvasHeight - The height of the canvas.
     * @param {number} refreshRate - The refresh rate of the simulation in Hz.
     * @param {number} gravity - The gravity to apply to objects in the simulation. Default is 9.81 m/s².
     * @param {number} maxTimeStep - The maximum allowed time between updates in seconds. Default is 0.05 s.
     */
    constructor(canvasWidth, canvasHeight, refreshRate = 60, gravity = 9.81, maxTimeStep = 0.05) {
        if (typeof canvasWidth !== 'number' || typeof canvasHeight !== 'number' || typeof refreshRate !== 'number' || typeof gravity !== 'number' || typeof maxTimeStep !== 'number') {
            throw new Error('Invalid arguments: All parameters must be numbers.');
        }
        this.#gravity = gravity;
        this.#objects = [];
        this.#lastUpdate = performance.now();
        this.#maxTimeStep = maxTimeStep;
        this.#canvasWidth = canvasWidth;
        this.#canvasHeight = canvasHeight;
        this.#frameRate = 1000 / refreshRate; // Convert Hz to ms
        this.start();
    }

    /**
     * Start the simulation.
     */
    start() {
        if (this.#intervalID !== undefined) {
            throw new Error('Simulation is already running.');
        }
        this.#intervalID = setInterval(() => {
            const now = performance.now();
            let dt = (now - this.#lastUpdate) / 1000;
            dt = Math.min(dt, this.#frameRate / 1000); // Convert frameRate to seconds and limit the time step
            this.#lastUpdate = now;
            this.#update(dt);
        }, this.#frameRate);
    }

    /**
     * Stop the simulation.
     */
    stop() {
        if (this.#intervalID === undefined) {
            throw new Error('Simulation is not running.');
        }
        cancelAnimationFrame(this.#intervalID);
        this.#intervalID = null;
    }

    /**
     * Add a physics object to the simulation.
     * @param {Object} object - The object to add.
     */
    addPhysicsObject(object) {
        // You might want to check object properties before pushing it to the objects array
        this.#objects.push(object);
    }

    /**
     * Update the state of the simulation.
     * @param {number} dt - The time step to use.
     */
    #update(dt) {
        if (dt > this.#maxTimeStep) return; // If lag detected, don't update simulation

        // Sort objects based on y-axis value in descending order
        //this.#objects.sort((a, b) => a.position.y - b.position.y);

        this.#objects.forEach(object => object.update(this.#gravity, dt, this.#canvasWidth, this.#canvasHeight));
        this.#handleCollisions();
    }

    /**
     * Handle collisions between all objects in the simulation.
     * Currently supports circle-circle and circle-line collisions.
     * @private
     */
    #handleCollisions() {
        if (!Array.isArray(this.#objects)) {
            throw new Error('Invalid property: objects must be an array.');
        }
    
        for (let i = 0; i < this.#objects.length; i++) {
            const object1 = this.#objects[i];
            if (!this.#validatePhysicsObject(object1)) continue;
    
            for (let j = i + 1; j < this.#objects.length; j++) {
                const object2 = this.#objects[j];
                if (!this.#validatePhysicsObject(object2)) continue;
    
                if (object1.isCollider && object2.isCollider) continue;
    
                const circle1 = object1.collider instanceof CircleCollider ? object1 : null;
                const circle2 = object2.collider instanceof CircleCollider ? object2 : null;
                const rect1 = object1.collider instanceof RectangleCollider ? object1 : null;
                const rect2 = object2.collider instanceof RectangleCollider ? object2 : null;
                const line1 = object1.collider instanceof LineCollider ? object1 : null;
                const line2 = object2.collider instanceof LineCollider ? object2 : null;
    
                let collision;
    
                if (circle1 && circle2) {
                    collision = Collision.circleCircleCollision(circle1.position, circle1.collider.radius, circle2.position, circle2.collider.radius);
                    if (collision.collided) {
                        this.#resolveCollisionCircleCircle(circle1, circle2);
                        circle1.onCollision(circle2);
                        circle2.onCollision(circle1);
                    }
                } else if (circle1 && line2) {
                    collision = Collision.lineCircleCollision(line2.collider.point1, line2.collider.point2, circle1.position, circle1.collider.radius);
                    if (collision.collided) {
                        this.#resolveCollisionCircleLine(circle1, line2, collision);
                        circle1.onCollision(line2);
                        line2.onCollision(circle1);
                    }
                } else if (line1 && circle2) {
                    collision = Collision.lineCircleCollision(line1.collider.point1, line1.collider.point2, circle2.position, circle2.collider.radius);
                    if (collision.collided) {
                        this.#resolveCollisionCircleLine(circle2, line1, collision);
                        circle2.onCollision(line1);
                        line1.onCollision(circle2);
                    }
                } else if (rect1 && circle2) {
                    collision = Collision.circleRectCollision(circle2.position, circle2.collider.radius, rect1.position, rect1.collider.width, rect1.collider.height, rect1.collider.angle);
                    if (collision.collided) {
                        this.#resolveCollisionCircleRect(circle2, rect1, collision);
                        rect1.onCollision(circle2);
                        circle2.onCollision(rect1);
                    }
                } else if (circle1 && rect2) {
                    collision = Collision.circleRectCollision(circle1.position, circle1.collider.radius, rect2.position, rect2.collider.width, rect2.collider.height, rect2.collider.angle);
                    if (collision.collided) {
                        this.#resolveCollisionCircleRect(circle1, rect2, collision);
                        circle1.onCollision(rect2);
                        rect2.onCollision(circle1);
                    }
                }
            }
        }
    }      

    /**
     * Validate a physics object and its properties.
     * @param {Object} object - The object to validate.
     * @returns {boolean} Whether the object is valid.
     * @private
     */
    #validatePhysicsObject(object) {
        if (typeof object !== 'object' || object === null) {
            console.warn('Invalid physics object: must be an object and not null.');
            return false;
        }

        if (!('isKinematic' in object)) {
            console.warn('Invalid physics object: missing isKinematic property.');
            return false;
        }

        if (!('collider' in object)) {
            console.warn('Invalid physics object: missing collider property.');
            return false;
        }

        return true;
    }  

    /**
     * Resolve collisions between two circular objects.
     * @param {PhysicsObject} object1 - First object involved in the collision.
     * @param {PhysicsObject} object2 - Second object involved in the collision.
     * @private
     */
    #resolveCollisionCircleCircle(object1, object2) {
        // Unit vectors
        const unitNormal = object2.position.copy().sub(object1.position).normalize();
        const unitTangent = new Vector(-unitNormal.y, unitNormal.x);
    
        // Initial velocities along normal and tangent directions
        const v1n = Vector.dot(unitNormal, object1.velocity);
        const v1t = Vector.dot(unitTangent, object1.velocity);
        const v2n = Vector.dot(unitNormal, object2.velocity);
        const v2t = Vector.dot(unitTangent, object2.velocity);
    
        // Masses
        const [m1, m2] = [object1.mass, object2.mass];
    
        // Bounciness
        const bounciness = Math.sqrt(object1.bounciness * object2.bounciness);
    
        // Post-collision velocities along the normal direction (tangential velocities don't change)
        const [v_1n, v_2n] = [
            (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2) * bounciness,
            (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2) * bounciness
        ];
    
        // Final velocities
        const final1v = unitNormal.copy().mult(v_1n).add(unitTangent.copy().mult(v1t));
        const final2v = unitNormal.copy().mult(v_2n).add(unitTangent.copy().mult(v2t));
    
        // Overlap
        const overlap = Math.max(1, object1.collider.radius + object2.collider.radius - object1.position.distance(object2.position));
    
        // If the objects are not colliders, update their velocities and correct their positions
        [object1, object2].forEach((object, index) => {
            const otherObject = index === 0 ? object2 : object1;
            if (!object.isKinematic) {
                object.velocity = index === 0 ? final1v : final2v;
                if (overlap > 0) {
                    const correctionFactor = otherObject.isKinematic ? 1 : 0.5;
                    const correction = unitNormal.copy().mult((index === 0 ? 1 : -1) * overlap * correctionFactor);
                    object.position.sub(correction);
                }
            }
        });
    }       

    /**
     * Resolves collision between a circle and a line.
     * Reflects the circle's velocity and moves the circle outside of the line to prevent overlap.
     *
     * @param {Object} circle - The circle object.
     * @param {Object} line - The line object.
     * @param {Object} collision - The collision information.
     */
    #resolveCollisionCircleLine(circle, line, collision) {
        // Vector from the start of the line to the circle's position
        const lineToCircle = circle.position.copy().sub(line.collider.point1);

        // The unitNormal is perpendicular to the line, pointing towards the circle
        const unitNormal = line.collider.point2.copy().sub(line.collider.point1).rotate90().normalize();

        // If the circle is behind the line, flip the normal direction
        if (Vector.dot(lineToCircle, unitNormal) < 0) unitNormal.mult(-1);

        // Calculate velocity components along normal and tangent
        const [velocityNormal, velocityTangent] = [unitNormal, unitNormal.copy().rotate90()].map(unit => Vector.dot(circle.velocity, unit));

        // Reflect the normal component of velocity, tangential component remains the same
        circle.velocity = unitNormal.mult(-velocityNormal * circle.bounciness).add(unitNormal.copy().rotate90().mult(velocityTangent));

        // Correct circle's position to prevent overlap with the line
        const overlap = Math.max(1, circle.collider.radius - collision.point.distance(circle.position));
        if (overlap > 0) circle.position.add(unitNormal.mult(overlap));
    }

    /**
     * Resolves collision between a circle and a rectangle.
     * Reflects the circle's velocity and moves the circle outside of the rectangle to prevent overlap.
     *
     * @param {Object} circle - The circle object.
     * @param {Object} rectangle - The rectangle object.
     * @param {Object} collision - The collision information.
     */
    #resolveCollisionCircleRect(circle, rectangle, collision) {
        // Reflect the velocity vector about the collision normal and apply the bounciness factor
        const normal = Vector.normalize(Vector.sub(circle.position, collision.point));
        const dot = Vector.dot(circle.velocity, normal);
        const reflection = Vector.sub(circle.velocity, Vector.mult(normal, 2 * dot));
        circle.velocity.set(reflection.x * circle.bounciness, reflection.y * circle.bounciness);
    
        // Correct the circle's position to prevent overlap with the rectangle
        const overlap = Math.max(1, circle.collider.radius - collision.point.distance(circle.position));
        if (overlap > 0) {
            const correction = Vector.mult(normal, overlap);
            circle.position.add(correction);
        }
    }
    
    // #resolveCollisionCircleRect(circle, rectangle, collision) {
    //     // Vector from the center of the rectangle to the circle's position
    //     const rectToCircle = Vector.sub(circle.position, rectangle.position);

    //     // Calculate the unitNormal direction, perpendicular to the face of the collision
    //     const unitNormal = Vector.normalize(rectToCircle);

    //     // If the circle is inside the rectangle, flip the normal direction
    //     if (Vector.dot(rectToCircle, unitNormal) < 0) unitNormal.mult(-1);

    //     // Calculate velocity components along normal and tangent
    //     const velocityNormal = Vector.dot(circle.velocity, unitNormal);
    //     const velocityTangent = Vector.dot(circle.velocity, Vector.normalize(unitNormal).rotate90());

    //     // Reflect the normal component of velocity, tangential component remains the same
    //     circle.velocity = Vector.add(Vector.mult(unitNormal, -velocityNormal * circle.bounciness), Vector.mult(Vector.normalize(unitNormal).rotate90(), velocityTangent));

    //     // Correct circle's position to prevent overlap with the rectangle
    //     const overlap = circle.collider.radius - collision.point.distance(circle.position);
    //     if (overlap > 0) circle.position = Vector.add(circle.position, Vector.mult(unitNormal, overlap));
    // }

    /**
     * Get the gravity of the simulation.
     * @returns {number} The gravity of the simulation.
     */
    get gravity() {
        return this.#gravity;
    }

    /**
     * Returns the array of objects in the physics simulation.
     * @returns {Array} The array of objects.
     */
    get objects() {
        return this.#objects;
    }

    /**
     * Set the gravity of the simulation.
     * @param {number} gravity - The new gravity to set.
     */
    set gravity(gravity) {
        if (typeof gravity !== 'number') {
            throw new Error('Invalid argument: gravity should be a number.');
        }
        this.#gravity = gravity;
    }
}

/**
 * A class that represents an object in the physics simulation.
 */
class PhysicsObject {
    #position;
    #mass;
    #friction;
    #bounciness;
    #gravitySensitivity;
    #collider;
    #isKinematic;
    #velocity;
    #canvasColliderEnabled;

    /**
     * Create a new physics object.
     * @param {Vector} position - The initial position of the object.
     * @param {number} mass - The mass of the object.
     * @param {number} friction - The friction coefficient of the object (clamped between 0 and 1).
     * @param {number} bounciness - The bounciness of the object (clamped between 0 and 1).
     * @param {number} gravitySensitivity - How much the object follows gravity (clamped between 0 and 1).
     * @param {Collider} collider - The collider of the object.
     * @param {boolean} isKinematic - Whether the object is kinematic. Default is false.
     */
    constructor(position, mass, friction, bounciness, gravitySensitivity, collider, isKinematic = true) {
        if (!(position instanceof Vector) || typeof mass !== 'number' || typeof friction !== 'number' || typeof bounciness !== 'number' || typeof gravitySensitivity !== 'number' || !(collider instanceof Collider) || typeof isKinematic !== 'boolean') {
            throw new Error('Invalid arguments: Wrong types provided.');
        }
        if (!isKinematic && (collider.type === 'rectangle' || collider.type === 'line')) {
            throw new Error('Invalid arguments: Currently, non-kinematic objects can only have circle colliders.');
        }
        this.#position = position;
        this.#mass = mass;
        this.#friction = GameMath.clamp(friction, 0, 1);
        this.#bounciness = GameMath.clamp(bounciness, 0, 1);
        this.#gravitySensitivity = GameMath.clamp(gravitySensitivity, 0, 1);
        this.#collider = collider;
        this.#isKinematic = isKinematic;
        this.#velocity = new Vector(0, 0);
        this.#canvasColliderEnabled = true;
    }

    /**
     * Apply a force to the object.
     * @param {Vector} force - The force to apply.
     */
    addForce(force) {
        if (!(force instanceof Vector)) {
            throw new Error('Invalid argument: Force must be a Vector.');
        }
        this.#velocity.add(force);
    }

    /**
     * Toggle canvas collider (object cant leave the canvas area).
     */
    toggleCanvasCollider() {
        this.#canvasColliderEnabled = !this.#canvasColliderEnabled;
        console.log(this.#canvasColliderEnabled);
    }

    /**
     * Update the object's state based on the global gravity, time step, and canvas dimensions.
     * @param {number} globalGravity - The global gravity to apply to the object.
     * @param {number} dt - The time step.
     * @param {number} canvasWidth - The width of the canvas.
     * @param {number} canvasHeight - The height of the canvas.
     */
    update(globalGravity, dt, canvasWidth, canvasHeight) {
        if (typeof globalGravity !== 'number' || typeof dt !== 'number' || typeof canvasWidth !== 'number' || typeof canvasHeight !== 'number') {
            throw new Error('Invalid arguments: All parameters must be numbers.');
        }
        if (!this.#isKinematic) {
            let gravity = new Vector(0, globalGravity * this.#gravitySensitivity);
            this.#velocity.add(gravity.mult(dt * 200));
            this.#velocity.mult(Math.pow(this.#friction, dt));
            this.#position.add(this.#velocity.copy().mult(dt));

            if (this.#canvasColliderEnabled) {
                // Reflect the object's velocity when it hits the canvas edges and adjust its position
                if (this.#position.x - this.#collider.radius < 0) {
                    this.#position.x = this.#collider.radius;
                    this.#velocity.x *= -1 * this.#bounciness;
                } else if (this.#position.x + this.#collider.radius > canvasWidth) {
                    this.#position.x = canvasWidth - this.#collider.radius;
                    this.#velocity.x *= -1 * this.#bounciness;
                }
                if (this.#position.y - this.#collider.radius < 0) {
                    this.#position.y = this.#collider.radius;
                    this.#velocity.y *= -1 * this.#bounciness;
                } else if (this.#position.y + this.#collider.radius > canvasHeight) {
                    this.#position.y = canvasHeight - this.#collider.radius;
                    this.#velocity.y *= -1 * this.#bounciness;
                }
            };
        }
    }

    /**
     * This method will be called when this object collides with another object.
     * @param {PhysicsObject} other - The other object this object is colliding with.
     */
    onCollision(other) {
        // Users of this class should override this method.
    }

    // getters
    get position() {
        return this.#position;
    }

    get mass() {
        return this.#mass;
    }

    get friction() {
        return this.#friction;
    }

    get bounciness() {
        return this.#bounciness;
    }

    get gravitySensitivity() {
        return this.#gravitySensitivity;
    }

    get collider() {
        return this.#collider;
    }

    get isKinematic() {
        return this.#isKinematic;
    }

    get velocity() {
        return this.#velocity;
    }

    // setters
    set position(value) {
        if (!(value instanceof Vector)) {
            throw new Error('Invalid argument: Position must be a Vector.');
        }
        this.#position = value;
    }

    set mass(value) {
        if (typeof value !== 'number') {
            throw new Error('Invalid argument: Mass must be a number.');
        }
        this.#mass = value;
    }

    set friction(value) {
        if (typeof value !== 'number') {
            throw new Error('Invalid argument: Friction must be a number.');
        }
        this.#friction = value;
    }

    set bounciness(value) {
        if (typeof value !== 'number') {
            throw new Error('Invalid argument: Bounciness must be a number.');
        }
        this.#bounciness = value;
    }

    set gravitySensitivity(value) {
        if (typeof value !== 'number') {
            throw new Error('Invalid argument: GravitySensitivity must be a number.');
        }
        this.#gravitySensitivity = value;
    }

    set velocity(value) {
        if (!(value instanceof Vector)) {
            throw new Error('Invalid argument: Velocity must be a Vector.');
        }
        this.#velocity = value;
    }
}

/**
 * Base Collider class. 
 * This class should not be instantiated directly.
 */
class Collider {
    /**
     * Constructor for the base Collider class.
     * @param {string} type - The type of the collider.
     */
    constructor(type) {
        if (new.target === Collider) {
            throw new TypeError("Cannot construct Collider instances directly");
        }
        this.type = type;
    }

    /**
     * Factory method for creating a CircleCollider.
     * @param {number} radius - The radius of the circle.
     * @returns {CircleCollider} - A new CircleCollider instance.
     */
    static circle(radius) {
        return new CircleCollider(radius);
    }

    /**
     * Factory method for creating a RectangleCollider.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {number} angle - The angle of the rectangle.
     * @returns {RectangleCollider} - A new RectangleCollider instance.
     */
    static rectangle(width, height, angle) {
        return new RectangleCollider(width, height, angle);
    }

    /**
     * Factory method for creating a LineCollider.
     * @param {Vector} point1 - The first point of the line.
     * @param {Vector} point2 - The second point of the line.
     * @returns {LineCollider} - A new LineCollider instance.
     */
    static line(point1, point2) {
        return new LineCollider(point1, point2);
    }
}

/**
 * CircleCollider class. Represents a circular collider.
 */
class CircleCollider extends Collider {
    /**
     * Constructor for the CircleCollider class.
     * @param {number} radius - The radius of the circle.
     */
    constructor(radius) {
        super('circle');
        if (typeof radius !== 'number' || radius <= 0) {
            throw new Error('Invalid radius: Should be a positive number.');
        }
        this.radius = radius;
    }
}

/**
 * RectangleCollider class. Represents a rectangular collider.
 */
class RectangleCollider extends Collider {
    /**
     * Constructor for the RectangleCollider class.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {number} angle - The angle of the rectangle.
     */
    constructor(width, height, angle) {
        super('rectangle');
        if (typeof width !== 'number' || width <= 0 || typeof height !== 'number' || height <= 0) {
            throw new Error('Invalid width or height: Both should be positive numbers.');
        }
        if (typeof angle !== 'number') {
            throw new Error('Invalid angle: Angle should be a number.');
        }
        this.width = width;
        this.height = height;
        this.angle = angle
    }
}

/**
 * LineCollider class. Represents a line collider.
 */
class LineCollider extends Collider {
    /**
     * Constructor for the LineCollider class.
     * @param {Vector} point1 - The first point of the line.
     * @param {Vector} point2 - The second point of the line.
     */
    constructor(point1, point2) {
        super('line');
        if (!(point1 instanceof Vector) || !(point2 instanceof Vector)) {
            throw new Error('Invalid points: Both should be instances of Vector.');
        }
        this.point1 = point1;
        this.point2 = point2;
    }
}

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