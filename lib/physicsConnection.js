/**
 * Represents a connection between two nodes in a physics simulation.
 */
class PhysicsConnection {
    #name;
    #node1;
    #node2;
    #restingDistance;
    #collider;
    #parent;
    
    /**
     * Creates a new physics connection between two nodes.
     * @param {Node} node1 - The first node in the connection.
     * @param {Node} node2 - The second node in the connection.
     * @param {number} restingDistance - The desired distance between the two nodes when no forces are acting on them.
     * @param {boolean} [collider=true] - Indicates whether this connection should be treated as a collider.
     * @param {string} [name="PhysicsConnection"] - A name for this connection.
     */
    constructor(node1, node2, restingDistance, collider = true, name = "PhysicsConnection") {
        if (!(node1 instanceof PhysicsNode) || !(node2 instanceof PhysicsNode)) {
            throw new Error("Both node1 and node2 must be instances of PhysicsNode.");
        }
        
        if (typeof restingDistance !== 'number') {
            throw new Error("restingDistance must be a number.");
        }

        if (typeof collider !== 'boolean') {
            throw new Error("collider must be a boolean value.");
        }

        if (typeof name !== 'string') {
            throw new Error("name must be a string.");
        }

        this.#name = name;
        this.#node1 = node1;
        this.#node2 = node2;
        this.#restingDistance = restingDistance || node1.position.distance(node2.position);
        this.#collider = collider;
        this.#parent = null;
    }

    /**
     * Placeholder for collision handling logic. Should be overwritten by subclasses or instances.
     * @param {PhysicsConnection} other - Another connection that this connection has collided with.
     */
    onCollision(other) {
        // Overwrite this.#
    }

    /**
     * Resolves the constraint between the two connected nodes.
     * This ensures the nodes remain at their desired resting distance.
     */
    solve() {
        let dir = Vector.sub(this.#node1.position, this.#node2.position);
        let currentDistance = dir.mag();
        dir.normalize();
    
        // Calculate deviation from the resting length
        let deviation = currentDistance - this.#restingDistance;
    
        let correctionOffset;
        correctionOffset = deviation;
    
        let offset = correctionOffset / 2;
    
        // Compute the weight for each node based on their masses
        let totalMass = this.#node1.mass + this.#node2.mass;
        let w1 = this.#node2.mass / totalMass;  // weight of node1 is based on mass of node2
        let w2 = this.#node1.mass / totalMass;  // weight of node2 is based on mass of node1
    
        let offset1 = new Vector(dir.x * offset * w2, dir.y * offset * w2);
        let offset2 = new Vector(dir.x * offset * w1, dir.y * offset * w1);
    
        if (!this.#node1.locked) {
            this.#node1.position.sub(offset1);
        }
    
        if (!this.#node2.locked) {
            this.#node2.position.add(offset2);
        }
    }

    /**
     * Gets the first node in the connection.
     * @returns {Node} The first node.
     */
    get node1() {
        return this.#node1;
    }

    /**
     * Gets the second node in the connection.
     * @returns {Node} The second node.
     */
    get node2() {
        return this.#node2;
    }

    /**
     * Gets the name of the connection.
     * @returns {string} The name.
     */
    get name() {
        return this.#name;
    }

    /**
     * Sets the name of the connection.
     * @param {string} value - The new name.
     */
    set name(value) {
        if (typeof value !== 'string') {
            throw new Error("name must be a string.");
        }
        this.#name = value;
    }

    /**
     * Gets the resting distance of the connection.
     * @returns {number} The resting distance.
     */
    get restingDistance() {
        return this.#restingDistance;
    }

    /**
     * Sets the resting distance of the connection.
     * @param {number} value - The new resting distance.
     */
    set restingDistance(value) {
        if (typeof value !== 'number') {
            throw new Error("restingDistance must be a number.");
        }
        this.#restingDistance = value;
    }

    /**
     * Gets the collider status of the connection.
     * @returns {boolean} The collider status.
     */
    get collider() {
        return this.#collider;
    }

    /**
     * Sets the collider status of the connection.
     * @param {boolean} value - The new collider status.
     */
    set collider(value) {
        if (typeof value !== 'boolean') {
            throw new Error("collider must be a boolean value.");
        }
        this.#collider = value;
    }

    /**
     * Gets the parent node of this node.
     * @returns {PhysicsNode|null} The parent node or null if there isn't one.
     */
    get parent() {
        return this.#parent;
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
}