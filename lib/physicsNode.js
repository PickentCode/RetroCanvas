/**
 * Represents a node in a physics simulation.
 */
class PhysicsNode {
    #name = name;
    #position;
    #prevPosition;
    #rotation;
    #rotationSpeed;
    #radius;
    #mass;
    #bounciness;
    #airFriction;
    #surfaceFriction;
    #forces;
    #maxVelocityMagnitude;
    #locked;
    #collider;
    #parent;
    /**
     * Creates a new physics node.
     * @param {Vector} position - Initial position of the node.
     * @param {number} radius - Radius of the node.
     * @param {number} [mass=1] - Mass of the node.
     * @param {number} [bounciness=0] - Bounciness factor of the node.
     * @param {number} [airFriction=0.999] - Air friction coefficient.
     * @param {number} [surfaceFriction=0.75] - Surface friction coefficient.
     * @param {boolean} [locked=false] - Whether the node is locked in place.
     * @param {boolean} [collider=true] - Whether the node acts as a collider.
     * @param {string} [name="PhysicsNode"] - Name of the node.
     * @param {number} [maxVelocity=100] - Maximum traveling velocity of the node.
     */
    constructor(position, radius, mass = 1, bounciness = 0, airFriction = 0.999, surfaceFriction = 0.75, locked = false, collider = true, name = "PhysicsNode", maxVelocity = 100) {
        if (!(position && position.copy)) {
            throw new Error("Position must be a valid object with a copy method (e.g., a Vector instance).");
        }
        
        if (typeof radius !== 'number') {
            throw new Error("Radius must be a number.");
        }
        
        if (typeof mass !== 'number') {
            throw new Error("Mass must be a number.");
        }
        
        if (typeof bounciness !== 'number') {
            throw new Error("Bounciness must be a number.");
        }
        
        if (typeof airFriction !== 'number') {
            throw new Error("AirFriction must be a number.");
        }
        
        if (typeof surfaceFriction !== 'number') {
            throw new Error("SurfaceFriction must be a number.");
        }

        if (typeof locked !== 'boolean') {
            throw new Error("Locked must be a boolean.");
        }

        if (typeof collider !== 'boolean') {
            throw new Error("Collider must be a boolean.");
        }

        if (typeof name !== 'string') {
            throw new Error("Name must be a string.");
        }

        this.#name = name;
        this.#position = position.copy();
        this.#prevPosition = position.copy();
        this.#rotation = 0;
        this.#rotationSpeed = Math.PI * 0.5 / radius;
        this.#radius = radius;
        this.#mass = mass;
        this.#bounciness = GameMath.clamp(bounciness, 0, 1);
        this.#airFriction = GameMath.clamp(airFriction, 0, 1);
        this.#surfaceFriction = GameMath.clamp(surfaceFriction, 0, 1);
        this.#forces = new Vector(0, 0);
        this.#maxVelocityMagnitude = maxVelocity;
        this.#locked = locked;
        this.#collider = collider;
        this.#parent = null;
    }

    /**
     * Apply a force to the node.
     * @param {Vector} force - The force vector to apply.
     */
    addForce(force) {
        if (!(force && typeof force === 'object')) {
            throw new Error("Force must be a valid object (e.g., a Vector instance).");
        }
        this.#forces = Vector.add(this.#forces, force);
    }

    /**
     * Update the node's state based on applied forces and other factors.
     * @param {number} deltaTime - The time interval over which to simulate the node's movement.
     */
    update(deltaTime) {
        if (typeof deltaTime !== 'number') {
            throw new Error("deltaTime must be a number.");
        }

        if (this.#locked) this.#forces.set(0, 0);
    
        const tempPosition = this.#position.copy();
    
        // Calculate acceleration contribution from forces and gravity
        let accelerationTerm = Vector.mult(this.#forces, deltaTime * deltaTime);
    
        // Calculate velocity approximation based on difference in positions
        let velocityTerm = this.#clampVelocity(this.#maxVelocityMagnitude, deltaTime);
    
        // Apply air friction (affects both x and y)
        const adjustedAirFriction = Math.pow(this.airFriction, deltaTime);
        velocityTerm.x *= adjustedAirFriction;
        velocityTerm.y *= adjustedAirFriction;
    
        // Update position
        this.#position = Vector.add(Vector.add(this.#position, velocityTerm), accelerationTerm);
    
        // Store the original position (before this frame's update) as the "previous" position
        this.#prevPosition = tempPosition;
    
        // Reset forces after they have been applied
        this.#forces.set(0, 0);

        // Apply fake rotation based on movement direction.
        this.#rotation += this.#rotationSpeed * (this.#position.x - this.#prevPosition.x);
    }

    /**
     * This method serves as a placeholder for handling node collisions.
     * It should be overridden by specific implementations or instances to provide actual collision handling logic.
     * @param {PhysicsNode} other - The other node with which a collision may have occurred.
     */
    onCollision(other) {
        // Overwrite this.
    }

    /**
     * Private method to clamp the velocity of the node to prevent excessive speeds.
     * @param {number} maxVelocity - The maximum allowed velocity magnitude.
     * @returns {Vector} - The clamped velocity vector.
     * @private
     */
    #clampVelocity(maxVelocity, deltaTime) {
        let velocityTerm = Vector.sub(this.#position, this.#prevPosition);
        let magnitude = velocityTerm.mag();
    
        // Scale maxVelocity by deltaTime
        let scaledMaxVelocity = maxVelocity * deltaTime;

        if (magnitude > scaledMaxVelocity) {
            let scale = scaledMaxVelocity / magnitude;
            velocityTerm.mult(scale);
        }
    
        return velocityTerm;
    }

    // Getters for all properties
     /**
     * Gets the name of the node.
     * @returns {string} The name of the node.
     */
     get name() {
        return this.#name;
    }

    /**
     * Gets the current position of the node.
     * @returns {Vector} The current position.
     */
    get position() {
        return this.#position;
    }

    /**
     * Gets the previous position of the node.
     * @returns {Vector} The previous position.
     */
    get prevPosition() {
        return this.#prevPosition;
    }

    /**
     * Gets the rotation of the node.
     * @returns {number} The rotation.
     */
    get rotation() {
        return this.#rotation;
    }

    /**
     * Gets the rotationSpeed of the node.
     * @returns {number} The rotationSpeed.
     */
    get rotationSpeed() {
        return this.#rotationSpeed;
    }

    /**
     * Gets the radius of the node.
     * @returns {number} The radius.
     */
    get radius() {
        return this.#radius;
    }

    /**
     * Gets the mass of the node.
     * @returns {number} The mass.
     */
    get mass() {
        return this.#mass;
    }

    /**
     * Gets the bounciness factor of the node.
     * @returns {number} The bounciness factor.
     */
    get bounciness() {
        return this.#bounciness;
    }

    /**
     * Gets the air friction coefficient of the node.
     * @returns {number} The air friction coefficient.
     */
    get airFriction() {
        return this.#airFriction;
    }

    /**
     * Gets the surface friction coefficient of the node.
     * @returns {number} The surface friction coefficient.
     */
    get surfaceFriction() {
        return this.#surfaceFriction;
    }

    /**
     * Gets the current forces acting on the node.
     * @returns {Vector} The forces.
     */
    get forces() {
        return this.#forces;
    }

    /**
     * Gets the maximum allowed velocity magnitude for the node.
     * @returns {number} The max velocity magnitude.
     */
    get maxVelocityMagnitude() {
        return this.#maxVelocityMagnitude;
    }

    /**
     * Checks if the node is locked in place.
     * @returns {boolean} True if the node is locked, otherwise false.
     */
    get locked() {
        return this.#locked;
    }

    /**
     * Checks if the node acts as a collider.
     * @returns {boolean} True if the node is a collider, otherwise false.
     */
    get collider() {
        return this.#collider;
    }

    /**
     * Gets the parent node of this node.
     * @returns {PhysicsNode|null} The parent node or null if there isn't one.
     */
    get parent() {
        return this.#parent;
    }

    /**
     * Sets the name of the node.
     * @param {string} value - The new name.
     */
    set name(value) {
        if (typeof value !== 'string') {
            throw new Error("name must be a string.");
        }
        this.#name = value;
    }

    /**
     * Sets the position of the node.
     * @param {Vector} value - The new position.
     */
    set position(value) {
        if (!(value && value.copy)) {
            throw new Error("Position must be a valid object with a copy method (e.g., a Vector instance).");
        }
        this.#position = value.copy();
    }

    /**
     * Sets the previous position of the node.
     * @param {Vector} value - The new previous position.
     */
    set prevPosition(value) {
        if (!(value && value.copy)) {
            throw new Error("Previous position must be a valid object with a copy method (e.g., a Vector instance).");
        }
        this.#prevPosition = value.copy();
    }

    /**
     * Sets the rotationSpeed of the node.
     * @param {number} value - The new rotationSpeed.
     */
    set rotationSpeed(value) {
        if (typeof value !== 'number') {
            throw new Error("rotationSpeed must be a number.");
        }
        this.#rotationSpeed = value;
    }

    /**
     * Sets the radius of the node.
     * @param {number} value - The new radius.
     */
    set radius(value) {
        if (typeof value !== 'number') {
            throw new Error("radius must be a number.");
        }
        this.#radius = value;
    }

    /**
     * Sets the mass of the node.
     * @param {number} value - The new mass.
     */
    set mass(value) {
        if (typeof value !== 'number') {
            throw new Error("mass must be a number.");
        }
        this.#mass = value;
    }

    /**
     * Sets the bounciness factor of the node.
     * @param {number} value - The new bounciness factor.
     */
    set bounciness(value) {
        if (typeof value !== 'number') {
            throw new Error("bounciness must be a number.");
        }
        this.#bounciness = value;
    }

    /**
     * Sets the air friction coefficient of the node.
     * @param {number} value - The new air friction coefficient.
     */
    set airFriction(value) {
        if (typeof value !== 'number') {
            throw new Error("airFriction must be a number.");
        }
        this.#airFriction = value;
    }

    /**
     * Sets the surface friction coefficient of the node.
     * @param {number} value - The new surface friction coefficient.
     */
    set surfaceFriction(value) {
        if (typeof value !== 'number') {
            throw new Error("surfaceFriction must be a number.");
        }
        this.#surfaceFriction = value;
    }

    /**
     * Locks or unlocks the node.
     * @param {boolean} value - True to lock the node, false to unlock.
     */
    set locked(value) {
        if (typeof value !== 'boolean') {
            throw new Error("locked must be a boolean value.");
        }
        this.#locked = value;
    }

    /**
     * Sets whether the node acts as a collider.
     * @param {boolean} value - True if the node is a collider, otherwise false.
     */
    set collider(value) {
        if (typeof value !== 'boolean') {
            throw new Error("collider must be a boolean value.");
        }
        this.#collider = value;
    }

    /**
     * Sets the parent of the node.
     * @param {PhysicsObject|null} value - The new parent node or null to unset the parent.
     */
    set parent(value) {
        if (!(value instanceof PhysicsObject) && value !== null) {
            throw new Error("Parent must be an instance of PhysicsNode or null.");
        }
        this.#parent = value;
    }

    /**
     * Sets the maximum allowed velocity magnitude for the node.
     * @param {number} value - The max velocity magnitude.
     */
    set maxVelocityMagnitude(value) {
        if (typeof value !== 'number') {
            throw new Error("maxVelocityMagnitude must be a number.");
        }
        this.#maxVelocityMagnitude = value;
    }
}