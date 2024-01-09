/**
 * Represents a physics simulation environment.
 */
class Physics {
    #nodes;
    #connections;
    #areaWidth;
    #areaHeight;
    #gravity;
    #subSteps;
    #MAX_DELTA;
    #responseCoef;
    #grid;
    #biggestNodeForGrid;

    /**
     * Creates a new physics simulation environment.
     * @param {number} areaWidth - The width of the simulation area.
     * @param {number} areaHeight - The height of the simulation area.
     * @param {Vector} [gravity=new Vector(0, 9.81)] - The gravitational force in the simulation.
     * @param {number} [subSteps=2] - Break the update into many sub-steps.
     * @param {number} [responseCoef=0.75] - How much overlapping should be resolved on collision (value between 0.5 to 1.5).
     * @param {number} [max_delta=0.045] - The maximum amount of time in seconds that a frame can take in order to run physics simulation.
     */
    constructor(areaWidth, areaHeight, gravity = new Vector(0, 9.81), subSteps = 2, responseCoef = 0.75, max_delta = 0.045) {
        if (typeof areaWidth !== 'number' || typeof areaHeight !== 'number' || typeof max_delta !== 'number') {
            throw new Error("max_delta, areaWidth and areaHeight must be numbers.");
        }
        if (!(gravity instanceof Vector)) {
            throw new Error("gravity must be an instance of Vector.");
        }

        this.#nodes = [];
        this.#connections = [];
        this.#areaWidth = areaWidth;
        this.#areaHeight = areaHeight;
        this.#gravity = gravity;
        this.#MAX_DELTA = max_delta;
        this.#subSteps = ~~subSteps;
        this.#responseCoef = GameMath.clamp(responseCoef, 0, 1);
        this.#biggestNodeForGrid = 10;
        this.#grid = new SpatialGrid(this.#biggestNodeForGrid * 2, areaWidth * 1.0, areaHeight * 1.0);
    }

    /**
     * Updates all nodes in the physics simulation.
     * @param {number} deltaTime - The time interval over which to simulate the nodes' movement.
     */
    update(deltaTime) {
        if (typeof deltaTime !== 'number') {
            throw new Error("deltaTime must be a number.");
        }

        const deltaTimeSubStep = deltaTime / this.#subSteps;

        for (let step = 0; step < this.#subSteps; step++) {
            // Update all nodes
            for (let node of this.#nodes) {
                // Avoid rappid jumping on alt + tab
                if (deltaTime > this.#MAX_DELTA) continue;
                node.update(deltaTimeSubStep, this.#gravity);
            }
            this.#resolveConnections();
            this.#resolveCollisions(deltaTimeSubStep);
        }
    }

    /**
     * Adds a node to the physics simulation.
     * @param {PhysicsNode} node - The node to add.
     */
    addPhysicsNode(node) {
        if (!(node instanceof PhysicsNode)) {
            throw new Error("node must be an instance of PhysicsNode.");
        }
        // If a node bigger than an optimization grid cell is added.
        if (node.radius > this.#biggestNodeForGrid) {
            this.#biggestNodeForGrid = node.radius;
            this.#grid = new SpatialGrid(this.#biggestNodeForGrid * 2, this.#areaWidth * 1.0, this.#areaHeight * 1.0);
            console.warn("Optimization grid cell changed to fit " + node.name + ". Performance might be worse.");
        }
        this.#nodes.push(node);
    }

    /**
     * Creates and adds a new node to the physics simulation.
     * @param {Vector} position - Initial position of the node.
     * @param {number} radius - Radius of the node.
     * @param {number} [mass=1] - Mass of the node.
     * @param {number} [bounciness=0] - Bounciness factor of the node.
     * @param {number} [airFriction=0.999] - Air friction coefficient.
     * @param {number} [surfaceFriction=0.75] - Surface friction coefficient.
     * @param {boolean} [locked=false] - Whether the node is locked in place.
     * @param {boolean} [collider=true] - Whether the node acts as a collider.
     * @param {string} [name="PhysicsNode"] - Name of the node.
     */
    makePhysicsNode(position, radius, mass = 1, bounciness = 0, airFriction = 0.999, surfaceFriction = 0.75, locked = false, collider = true, name = "PhysicsNode") {
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
        // If a node bigger than an optimization grid cell is added.
        if (radius > this.#biggestNodeForGrid) {
            this.#biggestNodeForGrid = radius;
            this.#grid = new SpatialGrid(this.#biggestNodeForGrid * 2, this.#areaWidth * 1.0, this.#areaHeight * 1.0);
            console.warn("Optimization grid cell changed to fit new node. Performance might be worse.");
        }
        const node = new PhysicsNode(position, radius, mass, bounciness, airFriction, surfaceFriction, locked, collider, name);
        this.#nodes.push(node);
    }

    /**
     * Adds a connection between two nodes to the simulation.
     * @param {PhysicsConnection} connection - The connection to add.
     */
    addPhysicsConnection(connection) {
        if (!(connection instanceof PhysicsConnection)) {
            throw new Error("connection must be an instance of PhysicsConnection.");
        }
        this.#connections.push(connection);
    }
    
    /**
     * Creates and adds a new connection between two nodes to the simulation.
     * @param {PhysicsNode} node1 - The first node to connect.
     * @param {PhysicsNode} node2 - The second node to connect.
     * @param {number} restingDistance - The resting distance between the nodes.
     * @param {boolean} [collider=true] - Indicates whether this connection should be treated as a collider.
     * @param {string} [name="PhysicsConnection"] - A name for this connection.
     */
    makePhysicsConnection(node1, node2, restingDistance, collider = true, name = "PhysicsConnection") {
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
        const connection = new PhysicsConnection(node1, node2, restingDistance, collider, name);
        this.#connections.push(connection);
    }

    /**
     * Removes a node from the physics simulation.
     * @param {PhysicsNode} node - The node to remove.
     */
    removePhysicsNode(node) {
        if (!(node instanceof PhysicsNode)) {
            throw new Error("node must be an instance of PhysicsNode.");
        }

        const index = this.#nodes.indexOf(node);
        if (index !== -1) {
            this.#nodes.splice(index, 1);
        } else {
            throw new Error("The specified node does not exist in the physics simulation.");
        }
    }

    /**
     * Removes a connection between two nodes from the simulation.
     * @param {PhysicsConnection} connection - The connection to remove.
     */
    removePhysicsConnection(connection) {
        if (!(connection instanceof PhysicsConnection)) {
            throw new Error("connection must be an instance of PhysicsConnection.");
        }

        const index = this.#connections.indexOf(connection);
        if (index !== -1) {
            this.#connections.splice(index, 1);
        } else {
            throw new Error("The specified connection does not exist in the physics simulation.");
        }
    }

    /**
     * Resolves the constraints between connected nodes.
     * @private
     */
    #resolveConnections() {
        for (let connection of this.#connections) {
            connection.solve();
        }
    }

    /**
     * Resolves collisions between nodes, nodes and the canvas, and nodes with connections.
     * @private
     */
    #resolveCollisions(deltaTime) {
        this.#grid.clear();
        for (let node of this.#nodes) {
            this.#grid.insert(node);
        }

        for (let node of this.#nodes) {
            this.#checkCollisionWithBoundary(node, deltaTime);
            const candidates = this.#grid.getNearby(node);
            for (let candidate of candidates) {
                if (node !== candidate && this.#checkCollisionNodeNode(node, candidate) && node.collider && candidate.collider) {
                    this.#resolveCollisionNodeNode(node, candidate);
                }
            }
        }

        for (let connection of this.#connections) {
            const candidates = this.#grid.getNodesForConnection(connection.node1, connection.node2);
            for (let candidate of candidates) {
                if (connection.collider && !(connection.node1 == candidate || connection.node2 == candidate) && candidate.collider) {
                    if (connection.parent != null && connection.parent.solidShape) {
                        if (this.#checkCollisionNodeShape(candidate, connection.parent) && this.#closestConnectionToNode(candidate, connection.parent) === connection) {
                            connection.parent.onCollision();
                            const closestPos = this.#closestPointOnConnection(candidate.position, connection.node1.position, connection.node2.position);
                            const dir = Vector.sub(candidate.position, closestPos).mult(-1.1);
                            candidate.position.add(dir);
                        }
                    }
                    if (connection.parent != null && this.#checkCollisionNodeConnection(candidate, connection)) this.#resolveCollisionNodeConnection(candidate, connection);
                }
            }
        }
    }

    /**
     * Checks for collision between two nodes.
     * @param {PhysicsNode} node1 - The first node.
     * @param {PhysicsNode} node2 - The second node.
     * @returns {boolean} True if there's a collision, otherwise false.
     * @private
     */
    #checkCollisionNodeNode(node1, node2) {
        if (!node1.collider || !node2.collider) return false;
        const distance = node1.position.distance(node2.position);
        return distance <= (node1.radius + node2.radius);
    }

    /**
     * Checks for collision between a node and a connection.
     * @param {PhysicsNode} node - The node.
     * @param {PhysicsConnection} connection - The connection.
     * @returns {boolean} True if there's a collision, otherwise false.
     * @private
     */
    #checkCollisionNodeConnection(node, connection) {
        const closestPoint = this.#closestPointOnConnection(node.position, connection.node1.position, connection.node2.position);
        const distanceToConnection = node.position.distance(closestPoint);
        return distanceToConnection <= node.radius;
    }

    /**
     * Checks for collision between a node and a shape.
     * @param {PhysicsNode} node - The node.
     * @param {PhysicsObject} shape - The shape, represented by its connections.
     * @returns {boolean} True if the node is inside the shape, otherwise false.
     * @private
     */
    #checkCollisionNodeShape(node, shape) {
        if (node.locked) return false;

        let intersectCount = 0;

        // For each connection (edge) in the shape
        shape.connections.forEach(connection => {
            const cn1 = connection.node1;
            const cn2 = connection.node2;

            if ((cn1.position.y > node.position.y) !== (cn2.position.y > node.position.y) && connection.collider) {
                const intersectX = cn1.position.x + (node.position.y - cn1.position.y) * (cn2.position.x - cn1.position.x) / (cn2.position.y - cn1.position.y);

                if (node.position.x < intersectX) {
                    intersectCount++;
                }
            }
        });

        return intersectCount % 2 !== 0;
    }

    /**
     * Resolves collisions between two nodes.
     * @param {PhysicsNode} node1 - The first node.
     * @param {PhysicsNode} node2 - The second node.
     * @private
     */
    #resolveCollisionNodeNode(node1, node2) {
        if (!node1.collider || !node2.collider) return;

        // Notify nodes about the collision
        node1.onCollision(node2);
        node2.onCollision(node1);

        if (node1.locked && node2.locked) return;
    
        // Calculate the distance vector between the two balls
        let responseCoef = this.#responseCoef; // How much overlapping should be resolved - default 0.75
        let difference = Vector.sub(node1.position.copy(), node2.position.copy());
        let dist2 = Math.pow(difference.x, 2) + Math.pow(difference.y, 2);
        let minDist = node1.radius + node2.radius;
    
        let distance = GameMath.clamp(Math.sqrt(dist2), 1, this.areaWidth + this.areaHeight);
        let n = Vector.div(difference.copy(), distance);
        
        // Calculate the average bounciness
        let avgBounciness = (node1.bounciness + node2.bounciness) / 2 * 10;
    
        // Modify delta based on the bounciness. Higher bounciness should result in a larger delta (more "rebound").
        let delta = 0.5 * responseCoef * (distance - minDist) * (1 + avgBounciness);
    
        if (node1.locked) {
            node2.position.add(n.copy().mult(delta));
        } else if (node2.locked) {
            node1.position.sub(n.copy().mult(delta));
        } else {
            let massRatio1 = node1.mass / (node1.mass + node2.mass);
            let massRatio2 = node2.mass / (node1.mass + node2.mass);
            node1.position.sub(n.copy().mult(massRatio2 * delta));
            node2.position.add(n.copy().mult(massRatio1 * delta));
        }
    }

    /**
     * Resolves collisions between a node and a connection.
     * @param {PhysicsNode} node - The node.
     * @param {PhysicsConnection} connection - The connection.
     * @private
     */
    #resolveCollisionNodeConnection(node, connection) {
        // Notify the involved entities about the collision
        node.onCollision(connection);
        connection.onCollision();
        connection.parent.onCollision();

        // Find the closest point on the connection to the node
        let closestPoint = this.#closestPointOnConnection(node.position, connection.node1.position, connection.node2.position);
        
        // Calculate the overlap between the node and the closest point on the connection
        let overlap = node.radius - node.position.distance(closestPoint);
        if (overlap <= 0) return; // No collision

        const direction = Vector.sub(closestPoint, node.position);
        if (direction.mag() < 1e-6) return; // Avoid resolving if too close (prevents jitter)
        direction.normalize();
        
        const avgBounciness = (node.bounciness + connection.node1.bounciness + connection.node2.bounciness) / 3 * 10;
        const responseCoef = this.#responseCoef; 
        overlap *= (1 + avgBounciness) * responseCoef;

        const NodeBias = node.mass;
        const parentBias = connection.node1.mass + connection.node2.mass;    
        const totalBias = NodeBias + parentBias;     
        const NodeAdjustment = overlap * parentBias / totalBias;
        const physicsObjectAdjustment = overlap * NodeBias / totalBias;     

        const distanceToNode1 = node.position.distance(connection.node1.position);
        const distanceToNode2 = node.position.distance(connection.node2.position);
        const totalDistance = distanceToNode1 + distanceToNode2;

        // Calculate the proportion of the adjustment to be applied based on distance
        const proportionForNode1 = distanceToNode2 / totalDistance; 
        const proportionForNode2 = distanceToNode1 / totalDistance;

        if (!node.locked) {
            node.position.sub(direction.copy().mult(NodeAdjustment));
        }
        if (!connection.node1.locked) connection.node1.position.add(direction.copy().mult(physicsObjectAdjustment * proportionForNode1));
        if (!connection.node2.locked) connection.node2.position.add(direction.copy().mult(physicsObjectAdjustment * proportionForNode2));
    }
    
    /**
     * Computes the closest point on a connection (line segment) to a given point.
     * @param {Vector} point - The point to find the closest position to.
     * @param {Vector} ConnectionStart - The starting point of the connection.
     * @param {Vector} ConnectionEnd - The ending point of the connection.
     * @returns {Vector} - The closest point on the connection to the given point.
     * @private
     */
    #closestPointOnConnection(point, ConnectionStart, ConnectionEnd) {
        const ConnectionLengthSquared = ConnectionStart.distance(ConnectionEnd) * ConnectionStart.distance(ConnectionEnd);
        if (ConnectionLengthSquared === 0) return ConnectionStart.copy();

        const t = Math.max(0, Math.min(1, Vector.dot(point.copy().sub(ConnectionStart), ConnectionEnd.copy().sub(ConnectionStart)) / ConnectionLengthSquared));
        const projection = ConnectionStart.copy().add(ConnectionEnd.copy().sub(ConnectionStart).mult(t));
        return projection;
    }

    /**
     * Finds the closest connection in a shape to a given node.
     * @param {PhysicsNode} node - The node.
     * @param {PhysicsShape} shape - The shape containing multiple connections.
     * @returns {PhysicsConnection} - The closest connection to the node.
     * @private
     */
    #closestConnectionToNode(node, shape) {
        let closestConnection = null;
        let closestDistance = Infinity;
    
        shape.connections.forEach(connection => {
            if (connection.collider) {
                const pointOnConnection = this.#closestPointOnConnection(node.position, connection.node1.position, connection.node2.position);
                const distance = node.position.distance(pointOnConnection); // Assuming distance is a method of your Vector class
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestConnection = connection;
                }
            }
        });
    
        return closestConnection;
    }
    
    /**
     * Checks and resolves collisions of a node with the canvas boundaries.
     * @param {PhysicsNode} node - The node to check.
     * @private
     */
    #checkCollisionWithBoundary(node, deltaTime) {
        let velocity = Vector.sub(node.position, node.prevPosition);
        let overlap = 0;  // Overlapping distance

        const adjustedBounciness = node.bounciness;
        const adjustedSurfaceFriction = Math.pow(node.surfaceFriction, deltaTime); // Change to 1 / (1 + (deltaTime * node.surfaceFriction)) later?
        //const adjustedSurfaceFriction = Math.pow(node.surfaceFriction, deltaTime);
        
        // Check collision with ground
        if (node.position.y + node.radius >= this.areaHeight) {
            overlap = node.position.y + node.radius - this.areaHeight;
            node.position.y -= overlap * (1 + adjustedBounciness);
            velocity.y *= -adjustedBounciness;  // Reflect the velocity with bounciness
            velocity.x *= adjustedSurfaceFriction;  // Apply friction to horizontal component
            node.prevPosition = Vector.sub(node.position, velocity);
        }
        
        // Check collision with ceiling
        if (node.position.y - node.radius <= 0) {
            overlap = node.radius - node.position.y;
            node.position.y += overlap * (1 + adjustedBounciness);
            velocity.y *= -adjustedBounciness;
            //velocity.x *= node.surfaceFriction;
            node.prevPosition = Vector.sub(node.position, velocity);
        }
        
        // Check collision with left boundary
        if (node.position.x - node.radius <= 0) {
            overlap = node.radius - node.position.x;
            node.position.x += overlap * (1 + adjustedBounciness);
            velocity.x *= -adjustedBounciness;
            //velocity.y *= node.surfaceFriction;
            node.prevPosition = Vector.sub(node.position, velocity);
        }
        
        // Check collision with right boundary
        if (node.position.x + node.radius >= this.areaWidth) {
            overlap = node.position.x + node.radius - this.areaWidth;
            node.position.x -= overlap * (1 + adjustedBounciness);
            velocity.x *= -adjustedBounciness;
            //velocity.y *= node.surfaceFriction;
            node.prevPosition = Vector.sub(node.position, velocity);
        }
    }

    /**
     * Gets the list of nodes in the physics simulation.
     * @returns {Array<PhysicsNode>} - The nodes in the simulation.
     */
    get nodes() {
        return this.#nodes;
    }

    /**
     * Gets the list of connections in the physics simulation.
     * @returns {Array<PhysicsConnection>} - The connections in the simulation.
     */
    get connections() {
        return this.#connections;
    }

    /**
     * Gets the width of the simulation area.
     * @returns {number} - The width of the simulation area.
     */
    get areaWidth() {
        return this.#areaWidth;
    }

    /**
     * Gets the height of the simulation area.
     * @returns {number} - The height of the simulation area.
     */
    get areaHeight() {
        return this.#areaHeight;
    }

    /**
     * Gets the gravity vector for the physics simulation.
     * @returns {Vector} - The gravity vector.
     */
    get gravity() {
        return this.#gravity;
    }

    /**
     * Gets the maximum delta time for the physics simulation.
     * @returns {number} - The maximum delta time.
     */
    get MAX_DELTA() {
        return this.#MAX_DELTA;
    }

    /**
     * Gets the spatial grid used for collision checks.
     * @returns {SpatialGrid} - The spatial grid.
     * @todo Make the grid cell size dependent and warn if an object is added with a bigger radius.
     */
    get grid() {
        return this.#grid;
    }
}