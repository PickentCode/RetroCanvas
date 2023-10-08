/**
 * Represents a physics object composed of nodes and connections.
 */
class PhysicsObject {
    #physicsSimulation;
    #name;
    #nodes;
    #connections;
    #solidShape;
    #referenceVector;
    #rotation;

    /**
     * Constructs a PhysicsObject.
     * 
     * @param {Physics} physicsSimulation - An instance of the Physics class to which nodes and connections will be added.
     * @param {Array} nodes - List of PhysicsNode instances that form the object.
     * @param {Array} connections - List of PhysicsConnection instances that connect the nodes.
     * @param {string} [name="PhysicsObject"] - Optional name for the physics object.
     * @param {boolean} solidShape - Indicates if the object is a solid shape.
     */
    constructor(physicsSimulation, nodes, connections, name = "PhysicsObject", solidShape) {
        if (!physicsSimulation) {
            throw new Error("A valid physics simulation instance is required.");
        }
        if (!Array.isArray(nodes) || nodes.some(node => !(node instanceof PhysicsNode))) {
            throw new Error("nodes should be an array of PhysicsNode instances.");
        }
        if (!Array.isArray(connections) || connections.some(conn => !(conn instanceof PhysicsConnection))) {
            throw new Error("connections should be an array of PhysicsConnection instances.");
        }
        if (typeof name !== 'string') {
            throw new Error("name should be a string.");
        }
        if (typeof solidShape !== 'boolean') {
            throw new Error("solidShape should be a boolean value.");
        }

        this.#physicsSimulation = physicsSimulation;
        this.#name = name;
        this.#nodes = nodes;
        this.#connections = connections;
        this.#solidShape = solidShape;

        // Assuming the first two nodes define the initial orientation (for rotation)
        this.#referenceVector = Vector.sub(this.#nodes[1].position, this.#nodes[0].position);
        this.#rotation = 0; // Initial rotation in radians

        // Setting parents
        this.#nodes.forEach((node) => node.parent = this);
        this.#connections.forEach((connection) => connection.parent = this);

        // Add nodes and connections to the provided physics simulation
        this.#nodes.forEach(node => this.#physicsSimulation.addPhysicsNode(node));
        this.#connections.forEach(connection => this.#physicsSimulation.addPhysicsConnection(connection));
    }

    /**
     * Applies a force to all nodes within the physics object.
     * 
     * @param {Vector} force - The force to be applied.
     */
    addForce(force) {
        if (!(force instanceof Vector)) {
            throw new Error("The force should be an instance of Vector.");
        }

        for (let node of this.#nodes) {
            node.addForce(force);
        }
    }

    /**
     * Callback when the physics object collides with another object.
     * 
     * @param {PhysicsObject} other - The other physics object.
     */
    onCollision(other) {
        // Overwrite this in subclasses or instances as needed
    }

    /**
     * Calculates the position of the physics object based on the weighted average 
     * of the positions of its nodes.
     * 
     * @returns {Vector} - The weighted position of the physics object.
     */
    getWeightedPosition() {
        let totalMass = 0;
        let weightedPosition = new Vector(0, 0);

        for (let node of this.#nodes) {
            totalMass += node.mass;
            let weightedNodePosition = node.position.copy().mult(node.mass);
            weightedPosition.add(weightedNodePosition);
        }

        if (totalMass == 0) return new Vector(0, 0);

        return weightedPosition.div(totalMass);
    }

    /**
     * Calculates the average position of the physics object based on the positions of its nodes.
     * 
     * @returns {Vector} - The average position of the physics object.
     */
    getPosition() {
        let sumPosition = new Vector(0, 0);

        for (let node of this.#nodes) {
            sumPosition.add(node.position);
        }

        if (this.#nodes.length == 0) return new Vector(0, 0);

        return sumPosition.div(this.#nodes.length);
    }

    /**
     * Computes the rotation of the physics object based on the orientation 
     * of its first two nodes.
     * 
     * @returns {number} - The rotation of the physics object in radians.
     */
    getRotation() {
        const currentVector = Vector.sub(this.#nodes[1].position, this.#nodes[0].position);
        return this.#computeRotation(this.#referenceVector, currentVector);
    }

    /**
     * Calculates the total mass of the physics object by summing up the masses 
     * of its nodes.
     * 
     * @returns {number} - The total mass of the physics object.
     */
    getMass() {
        let totalMass = 0;
        for (let node of this.#nodes) {
            totalMass += node.mass;
        }
        return totalMass;
    }

    /**
     * Removes all nodes and connections associated with this physics object from the physics simulation.
     * @param {Physics} physicsSimulation - An instance of the Physics class from which the nodes and connections will be removed.
     */
    removeFromSimulation() {
        for (let node of this.#nodes) {
            this.#physicsSimulation.removePhysicsNode(node);
        }

        for (let connection of this.#connections) {
            this.#physicsSimulation.removePhysicsConnection(connection);
        }
    }

    /**
     * Computes the rotation between two vectors.
     * 
     * @private
     * @param {Vector} referenceVector - The reference vector.
     * @param {Vector} currentVector - The current vector.
     * @returns {number} - The rotation between the two vectors in radians.
     */
    #computeRotation(referenceVector, currentVector) {
        let dotProduct = referenceVector.dot(currentVector);
        let magnitudeProduct = referenceVector.mag() * currentVector.mag();
        
        // Safeguard against edge cases
        if (magnitudeProduct == 0) return 0;
    
        let cosineTheta = dotProduct / magnitudeProduct;
        
        // Clamp the value to the [-1, 1] range to avoid computational errors
        cosineTheta = Math.min(Math.max(cosineTheta, -1), 1);
        
        let theta = Math.acos(cosineTheta);
    
        // Determine the rotation direction using cross product
        let rotationDirection = referenceVector.cross(currentVector);
    
        // If the rotation direction is negative, then the angle should be negative as well
        if (rotationDirection < 0) {
            theta = -theta;
        }
    
        return theta * 180 / Math.PI;
    }

    // Getters
    /**
     * Gets the name of the physics object.
     * 
     * @returns {string} - The name of the physics object.
     */
    get name() {
        return this.#name;
    }

    /**
     * Gets the nodes of the physics object.
     * 
     * @returns {Array} - An array of nodes.
     */
    get nodes() {
        return this.#nodes;
    }

    /**
     * Gets the connections of the physics object.
     * 
     * @returns {Array} - An array of connections.
     */
    get connections() {
        return this.#connections;
    }

    /**
     * Gets the solid shape property of the physics object.
     * 
     * @returns {boolean} - The solid shape property.
     */
    get solidShape() {
        return this.#solidShape;
    }

    // Setters
    /**
     * Sets the name of the physics object.
     * 
     * @param {string} value - The new name for the physics object.
     */
    set name(value) {
        if (typeof value !== 'string') {
            throw new Error("Name must be a string.");
        }
        this.#name = value;
    }

    /**
     * Sets the solid shape property of the physics object.
     * 
     * @param {boolean} value - The new solid shape value.
     */
    set solidShape(value) {
        if (typeof value !== 'boolean') {
            throw new Error("solidShape must be a boolean.");
        }
        this.#solidShape = value;
    }
}

/**
 * Represents a rectangular physics object composed of four nodes and six connections.
 * This class extends the PhysicsObject class.
 */
class PhysicsRect extends PhysicsObject {
    /**
     * Constructs a PhysicsRect with the specified dimensions and node properties.
     * 
     * @param {Physics} physicsSimulation - An instance of the Physics class to which nodes and connections will be added.
     * @param {Vector} position - The center position of the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number} height - The height of the rectangle.
     * @param {string} [rectName="PhysicsRect"] - The name of the rectangular object.
     * @param {number} [radius=3] - The radius of each node in the rectangle.
     * @param {number} [mass=1] - The mass of each node in the rectangle.
     * @param {number} [bounciness=0] - The bounciness of each node in the rectangle.
     * @param {number} [airFriction=0.999] - The air friction of each node in the rectangle.
     * @param {number} [surfaceFriction=0.75] - The surface friction of each node in the rectangle.
     * @param {boolean} [collider=true] - Whether each node in the rectangle should act as a collider.
     * @param {string} [nodeName="PhysicsNode"] - The name for each node in the rectangle.
     */
    constructor(physicsSimulation, position, width, height, rectName = "PhysicsRect", radius = 3, mass = 1, bounciness = 0, airFriction = 0.999, surfaceFriction = 0.75, collider = true, nodeName = "PhysicsNode") {
        if (!physicsSimulation) {
            throw new Error("A valid physics simulation instance is required.");
        }

        if (!(position instanceof Vector)) {
            throw new Error("Position must be an instance of Vector.");
        }

        if (typeof width !== 'number' || width <= 0) {
            throw new Error("Width must be a positive number.");
        }

        if (typeof height !== 'number' || height <= 0) {
            throw new Error("Height must be a positive number.");
        }

        if (typeof radius !== 'number' || radius <= 0) {
            throw new Error("Radius must be a positive number.");
        }

        if (typeof mass !== 'number' || mass <= 0) {
            throw new Error("Mass must be a positive number.");
        }

        if (typeof bounciness !== 'number' || bounciness < 0) {
            throw new Error("Bounciness must be a non-negative number.");
        }

        if (typeof airFriction !== 'number' || airFriction < 0 || airFriction > 1) {
            throw new Error("AirFriction must be a number between 0 and 1.");
        }

        if (typeof surfaceFriction !== 'number' || surfaceFriction < 0 || surfaceFriction > 1) {
            throw new Error("SurfaceFriction must be a number between 0 and 1.");
        }

        if (typeof collider !== 'boolean') {
            throw new Error("Collider must be a boolean value.");
        }

        if (typeof rectName !== 'string' || typeof nodeName !== 'string') {
            throw new Error("Both rectName and nodeName should be string values.");
        }
        
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        // Create nodes for each corner of the rectangle
        const topLeft = new PhysicsNode(new Vector(position.x - halfWidth, position.y - halfHeight), radius, mass, bounciness, airFriction, surfaceFriction, false, collider, nodeName);
        const topRight = new PhysicsNode(new Vector(position.x + halfWidth, position.y - halfHeight), radius, mass, bounciness, airFriction, surfaceFriction, false, collider, nodeName);
        const bottomLeft = new PhysicsNode(new Vector(position.x - halfWidth, position.y + halfHeight), radius, mass, bounciness, airFriction, surfaceFriction, false, collider, nodeName);
        const bottomRight = new PhysicsNode(new Vector(position.x + halfWidth, position.y + halfHeight), radius, mass, bounciness, airFriction, surfaceFriction, false, collider, nodeName);

        const nodes = [topLeft, topRight, bottomLeft, bottomRight];

        // Create connections for each side and diagonals of the rectangle
        const topConnection = new PhysicsConnection(topLeft, topRight, width);
        const bottomConnection = new PhysicsConnection(bottomLeft, bottomRight, width);
        const leftConnection = new PhysicsConnection(topLeft, bottomLeft, height);
        const rightConnection = new PhysicsConnection(topRight, bottomRight, height);
        const diagonalConnectionTopDown = new PhysicsConnection(topLeft, bottomRight, Math.sqrt(width * width + height * height), false);
        const diagonalConnectionDownTop = new PhysicsConnection(topRight, bottomLeft, Math.sqrt(width * width + height * height), false);

        const connections = [topConnection, bottomConnection, leftConnection, rightConnection, diagonalConnectionTopDown, diagonalConnectionDownTop];

        super(physicsSimulation, nodes, connections, rectName, true);
    }
}

/**
 * Represents a polygonal physics object composed of nodes and connections.
 */
class PhysicsPolygon extends PhysicsObject {
    #outerRadius;
    #corners;
    /**
     * Constructs a PhysicsPolygon with the specified number of corners and node properties.
     * 
     * @param {Physics} physicsSimulation - An instance of the Physics class to which nodes and connections will be added.
     * @param {Vector} position - The center position of the polygon.
     * @param {number} outerRadius - The distance from the center to each node (basically the radius of the circumscribed circle of the polygon).
     * @param {number} corners - The number of corners of the polygon (ranging from 3 to 10).
     * @param {string} [polygonName="PhysicsPolygon"] - The name of the polygonal object.
     * @param {number} [nodeRadius=3] - The radius of each node in the polygon.
     * @param {number} [nodeMass=1] - The mass of each node in the polygon.
     * @param {number} [nodeBounciness=0] - The bounciness of each node in the polygon.
     * @param {number} [nodeAirFriction=0.999] - The air friction of each node in the polygon.
     * @param {number} [nodeSurfaceFriction=0.75] - The surface friction of each node in the polygon.
     * @param {boolean} [collider=true] - Whether each node in the polygon should act as a collider.
     * @param {string} [nodeName="PhysicsNode"] - The name for each node in the polygon.
     */
    constructor(physicsSimulation, position, outerRadius, corners, polygonName = "PhysicsPolygon", nodeRadius = 3, nodeMass = 1, nodeBounciness = 0, nodeAirFriction = 0.999, nodeSurfaceFriction = 0.75, collider = true, nodeName = "PhysicsNode") {
        if (!physicsSimulation) {
            throw new Error("A valid physics simulation instance is required.");
        }
        
        if (!(position instanceof Vector)) {
            throw new Error("Position must be an instance of Vector.");
        }

        if (typeof outerRadius !== 'number' || outerRadius <= 0) {
            throw new Error("outerRadius must be a positive number.");
        }

        if (typeof nodeRadius !== 'number' || nodeRadius <= 0) {
            throw new Error("nodeRadius must be a positive number.");
        }

        if (typeof corners !== 'number' || corners < 3 || corners > 10) {
            throw new Error("The number of corners must be a number between 3 and 10.");
        }

        if (typeof nodeMass !== 'number' || nodeMass <= 0) {
            throw new Error("nodeMass must be a positive number.");
        }

        if (typeof nodeBounciness !== 'number' || nodeBounciness < 0) {
            throw new Error("nodeBounciness must be a non-negative number.");
        }

        if (typeof nodeAirFriction !== 'number' || nodeAirFriction < 0 || nodeAirFriction > 1) {
            throw new Error("nodeAirFriction must be a number between 0 and 1.");
        }

        if (typeof nodeSurfaceFriction !== 'number' || nodeSurfaceFriction < 0 || nodeSurfaceFriction > 1) {
            throw new Error("nodeSurfaceFriction must be a number between 0 and 1.");
        }

        if (typeof collider !== 'boolean') {
            throw new Error("collider must be a boolean value.");
        }

        if (typeof polygonName !== 'string' || typeof nodeName !== 'string') {
            throw new Error("Both polygonName and nodeName should be string values.");
        }

        const nodes = [];
        const connections = [];
        const angleIncrement = 2 * Math.PI / corners;
        
        // Create nodes for each corner of the polygon
        for (let i = 0; i < corners; i++) {
            const x = position.x + outerRadius * Math.cos(i * angleIncrement);
            const y = position.y + outerRadius * Math.sin(i * angleIncrement);
            const node = new PhysicsNode(new Vector(x, y), nodeRadius, nodeMass, nodeBounciness, nodeAirFriction, nodeSurfaceFriction, false, collider, nodeName);
            nodes.push(node);
        }

        // Create connections between every node and every other node in the polygon
        for (let i = 0; i < corners; i++) {
            for (let j = i + 1; j < corners; j++) {
                const startNode = nodes[i];
                const endNode = nodes[j];
                const connection = new PhysicsConnection(startNode, endNode, Vector.distance(startNode.position, endNode.position));
                
                // Set inner connections as non-collidable
                if (j !== i + 1 && j !== (i - 1 + corners) % corners) {
                    connection.collider = false;
                }
                
                connections.push(connection);
            }
        }
        
        super(physicsSimulation, nodes, connections, polygonName, true);
        
        this.#outerRadius = outerRadius;
        this.#corners = corners;
    }

    /**
     * Gets the outer radius of the polygon.
     * @returns {number} The outer radius.
     */
    get outerRadius() {
        return this.#outerRadius;
    }

    /**
     * Gets the corners of the polygon.
     * @returns {number} The corner count.
     */
    get corners() {
        return this.#corners;
    }
}

/**
 * Represents a rope-like physics object composed of a series of connected nodes.
 */
class PhysicsRope extends PhysicsObject {
    /**
     * Constructs a PhysicsRope with the specified start and end positions and a given number of nodes.
     * 
     * @param {Physics} physicsSimulation - Your instance of the physics class.
     * @param {Vector} startPosition - The starting position of the rope.
     * @param {Vector} endPosition - The ending position of the rope.
     * @param {number} nodeCount - The number of nodes in the rope.
     * @param {number} nodeRadius - The radius of each node in the rope.
     * @param {number} [nodeMass=1] - The mass of each node.
     * @param {boolean} [collider=true] - Whether each node in the rope should act as a collider.
     * @param {string} [nodeName="PhysicsNode"] - The name for each node in the rope.
     */
    constructor(physicsSimulation, startPosition, endPosition, nodeCount, nodeRadius, nodeMass = 1, collider = true, nodeName = "PhysicsNode") {
        if (!physicsSimulation) {
            throw new Error("A valid physics simulation instance is required.");
        }

        if (!(startPosition instanceof Vector) || !(endPosition instanceof Vector)) {
            throw new Error("Start and end positions should be instances of Vector.");
        }

        if (typeof nodeCount !== "number" || nodeCount < 2) {
            throw new Error("Node count should be a number greater than or equal to 2.");
        }

        if (typeof nodeRadius !== "number" || nodeRadius <= 0) {
            throw new Error("Node radius should be a positive number.");
        }

        if (typeof nodeMass !== "number" || nodeMass <= 0) {
            throw new Error("Node mass should be a positive number.");
        }

        if (typeof collider !== "boolean") {
            throw new Error("Collider should be a boolean value.");
        }

        if (typeof nodeName !== "string") {
            throw new Error("Node name should be a string.");
        }

        const nodes = [];
        const connections = [];

        // Calculate the direction and distance between each node
        const totalDistance = Vector.sub(endPosition, startPosition);
        const nodeSpacing = totalDistance.div(nodeCount - 1); // The spacing between nodes

        // Create nodes for the rope
        for (let i = 0; i < nodeCount; i++) {
            const position = new Vector(startPosition.x + i * nodeSpacing.x, startPosition.y + i * nodeSpacing.y);
            const node = new PhysicsNode(position, nodeRadius, nodeMass, 0, 0.999, 0.75, false, collider, nodeName);
            nodes.push(node);

            // Create connections between nodes except for the first node
            if (i !== 0) {
                const connection = new PhysicsConnection(nodes[i-1], node, Vector.distance(nodes[i-1].position, node.position));
                connection.collider = false; // Ensure the connection does not act as a collider
                connections.push(connection);
            }
        }

        super(physicsSimulation, nodes, connections, "PhysicsRope", false);
    }
}