/**
 * Represents an Inverse Kinematics system for handling and solving 
 * the positioning of a chain of segments in 2D space. This system 
 * aims to adjust the segments to reach a specific target point, optionally 
 * orienting segments towards an anchor point.
 */
class InverseKinematics {
    #points = [];
    #segments;
    #length;

    /**
     * Constructs an InverseKinematics object.
     * @param {Vector} position - The starting position of the IK chain.
     * @param {Array} segments - An array of segment lengths.
     */
    constructor(position, segments = []) {
        if (!(position instanceof Vector)) {
            throw new Error("position must be an instance of Vector");
        }
        if (!Array.isArray(segments)) {
            throw new Error("segments must be an array");
        }

        this.#segments = segments;
        this.#length = 0;
        this.#points.push(position);

        let newPoint = position.copy();
        segments.forEach(len => {
            if (typeof len !== 'number' || len <= 0) {
                throw new Error("Segment length must be a positive number");
            }
            this.#length += len;
            this.#points.push(newPoint.copy().add(new Vector(0, len)));
        });
    }

    /**
     * Adds a segment to the IK chain.
     * @param {number} length - The length of the new segment.
     */
    addSegment(length) {
        if (typeof length !== 'number' || length <= 0) {
            throw new Error("Segment length must be a positive number");
        }
        this.#segments.push(length);
        this.#length += length;
        this.#points.push(this.#points[this.#points.length-1].copy().add(new Vector(Math.random(), Math.random()).normalize().mult(length)));
    }

    /**
     * Removes a segment from the IK chain at a specified index.
     * @param {number} index - The index of the segment to remove.
     */
    removeSegment(index) {
        if (typeof index !== 'number' || index < 0 || index >= this.#segments.length) {
            throw new Error("Index out of bounds");
        }

        // Remove the segment at the specified index
        this.#segments.splice(index, 1);

        // Adjust the total length of the segments
        this.#length = this.#segments.reduce((acc, len) => acc + len, 0);

        // Remove the corresponding point but maintain the chain's integrity
        if (index < this.#points.length - 1) {
            this.#points.splice(index + 1, 1);
        }
    }

    /**
     * Solves the IK problem by adjusting the segments to reach a target.
     * @param {Vector} target - The target position to reach.
     * @param {number} allowedError - The allowed distance error from the target.
     * @param {number} iterations - The number of iterations to perform.
     * @param {Vector} anchor - The anchor point to aim the segments at.
     * @returns {Array} The adjusted points of the segments.
     */
    solve(target, allowedError = 1, iterations = 1, anchor = null) {
        if (!(target instanceof Vector)) {
            throw new Error("target must be an instance of Vector");
        }
        if (typeof allowedError !== 'number' || allowedError < 0) {
            throw new Error("allowedError must be a non-negative number");
        }
        if (typeof iterations !== 'number' || iterations <= 0) {
            throw new Error("iterations must be a positive integer");
        }
        if (anchor !== null && !(anchor instanceof Vector)) {
            throw new Error("anchor must be an instance of Vector or null");
        }

        if (this.#points[0].distance(target) >= this.#length) {
            let dir = target.copy().sub(this.#points[0]).normalize();
            for (let i = 0; i < this.#segments.length; i++) {
                let vecToAdd = dir.copy().mult(this.#segments[i]);
                this.#points[i + 1] = this.#points[i].copy().add(vecToAdd);
            }
        } else if (this.#points[this.#points.length - 1].distance(target) > allowedError) {
            for (let i = 0; i < iterations; i++) {
                if (i < iterations / 2 && anchor != null) {
                    for (let i = 0; i < this.#segments.length; i++) {
                        let dir;
                        dir = anchor.copy().sub(this.#points[i]).normalize();
                        this.#points[i + 1] = this.#points[i].copy().add(dir.mult(this.#segments[i]));
                    }
                }
                let shiftedPoints = [];
                shiftedPoints.push(target);
                for (let j = this.#points.length - 2; j >= 0; j--) {
                    let newShiftedPoint = this.#points[j].copy().sub(shiftedPoints[this.#points.length - 2 - j]);
                    newShiftedPoint.normalize();
                    newShiftedPoint.mult(this.#segments[j]);
                    newShiftedPoint.add(shiftedPoints[this.#points.length - 2 - j]);
                    shiftedPoints.push(newShiftedPoint);
                }
                for (let k = 1; k < this.#points.length; k++) {
                    let newPoint = shiftedPoints[shiftedPoints.length - 1 - k].copy().sub(this.#points[k - 1]);
                    newPoint.normalize();
                    newPoint.mult(this.#segments[k - 1]);
                    newPoint.add(this.#points[k - 1]);
                    this.#points[k] = newPoint;
                }
            }
        }

        return this.#points;
    }

    /**
     * Updates the base position of the IK chain.
     * @param {Vector} position - The new base position.
     */
    updatePosition(position) {
        if (!(position instanceof Vector)) {
            throw new Error("position must be an instance of Vector");
        }

        let shiftedPoints = [];
        shiftedPoints.push(position);
        for (let j = this.#points.length - 2; j >= 0; j--) {
            let newShiftedPoint = this.#points[j].copy().sub(shiftedPoints[this.#points.length - 2 - j]);
            newShiftedPoint.normalize();
            newShiftedPoint.mult(this.#segments[j]);
            newShiftedPoint.add(shiftedPoints[this.#points.length - 2 - j]);
            shiftedPoints.push(newShiftedPoint);
        }
        for (let i = 0; i < shiftedPoints.length; i++) {
            this.#points[i] = shiftedPoints[i];
        }
    }

    /**
     * Gets the points of the IK chain.
     * @returns {Array<Vector>} An array of points representing the joints of the IK chain.
     */
    get points() {
        return this.#points;
    }

    /**
     * Gets the segment lengths of the IK chain.
     * @returns {Array<number>} An array of numbers representing the lengths of each segment in the IK chain.
     */
    get segments() {
        return this.#segments;
    }

    /**
     * Gets the total length of the IK chain.
     * @returns {number} The sum of the lengths of all segments in the IK chain.
     */
    get length() {
        return this.#length;
    }
}