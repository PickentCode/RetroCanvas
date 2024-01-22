/**
 * Represents a Matrix with basic matrix operations.
 */
class Matrix {
    #rows;
    #columns;
    #data;

    /**
     * Constructs a Matrix with given rows and columns, initializing all values to 0.
     * @param {number} rows - Number of rows in the matrix.
     * @param {number} cols - Number of columns in the matrix.
     */
    constructor(rows, cols) {
        if (typeof rows !== 'number' || typeof cols !== 'number') {
            throw new TypeError('Rows and columns must be numbers');
        }
        if (rows <= 0 || cols <= 0) {
            throw new Error('Matrix dimensions must be positive');
        }

        this.#rows = rows;
        this.#columns = cols;
        this.#data = Array.from({ length: rows }, () => new Array(cols).fill(0));
    }

    /**
     * Multiplies two matrices and returns the result.
     * @param {Matrix} m1 - The first matrix.
     * @param {Matrix} m2 - The second matrix.
     * @return {Matrix} The product of the two matrices.
     */
    static matrixProduct(m1, m2) {
        if (!(m1 instanceof Matrix) || !(m2 instanceof Matrix)) {
            throw new TypeError('Arguments must be instances of Matrix');
        }
        if (m1.columns !== m2.rows) {
            throw new Error('Columns of first matrix must match rows of second matrix');
        }

        let result = new Matrix(m1.rows, m2.columns);
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.columns; j++) {
                let sum = 0;
                for (let k = 0; k < m1.columns; k++) {
                    sum += m1.data[i][k] * m2.data[k][j];
                }
                result.data[i][j] = sum;
            }
        }
        return result;
    }

    /**
     * Multiplies this matrix with another matrix element-wise.
     * @param {Matrix} m - The matrix to multiply with.
     */
    matrixProduct(m) {
        if (!(m instanceof Matrix)) {
            throw new TypeError('Argument must be an instance of Matrix');
        }
        if (this.#rows !== m.rows || this.#columns !== m.columns) {
            throw new Error('Matrices dimensions must match');
        }

        for (let i = 0; i < this.#rows; i++) {
            for (let j = 0; j < this.#columns; j++) {
                this.#data[i][j] *= m.data[i][j];
            }
        }
    }

    /**
     * Transposes the given matrix and returns the result.
     * @param {Matrix} m - The matrix to transpose.
     * @return {Matrix} The transposed matrix.
     */
    static transpose(m) {
        if (!(m instanceof Matrix)) {
            throw new TypeError('Argument must be an instance of Matrix');
        }

        let result = new Matrix(m.columns, m.rows);
        for (let i = 0; i < m.rows; i++) {
            for (let j = 0; j < m.columns; j++) {
                result.data[j][i] = m.data[i][j];
            }
        }
        return result;
    }

    /**
     * Multiplies each element of this matrix by a scalar.
     * @param {number} n - The scalar to multiply with.
     */
    multiply(n) {
        if (typeof n !== 'number') {
            throw new TypeError('Multiplier must be a number');
        }

        for (let i = 0; i < this.#rows; i++) {
            for (let j = 0; j < this.#columns; j++) {
                this.#data[i][j] *= n;
            }
        }
    }

    /**
     * Applies the sigmoid function to each element of this matrix.
     */
    applySigmoid() {
        for (let i = 0; i < this.#rows; i++) {
            for (let j = 0; j < this.#columns; j++) {
                this.#data[i][j] = 1 / (1 + Math.exp(-this.#data[i][j]));
            }
        }
    }

    /**
     * Applies the derivative of the sigmoid function to each element of the given matrix and returns the result.
     * @param {Matrix} m - The matrix to apply the derivative of the sigmoid function to.
     * @return {Matrix} The matrix after applying the derivative of the sigmoid function.
     */
    static applyDerivativeOfSigmoid(m) {
        if (!(m instanceof Matrix)) {
            throw new TypeError('Argument must be an instance of Matrix');
        }

        let result = new Matrix(m.rows, m.columns);
        for (let i = 0; i < m.rows; i++) {
            for (let j = 0; j < m.columns; j++) {
                result.data[i][j] = m.data[i][j] * (1 - m.data[i][j]);
            }
        }
        return result;
    }

    /**
     * Adds another matrix to this matrix.
     * @param {Matrix} m - The matrix to add.
     */
    add(m) {
        if (!(m instanceof Matrix)) {
            throw new TypeError('Argument must be an instance of Matrix');
        }
        if (this.#rows !== m.rows || this.#columns !== m.columns) {
            throw new Error('Matrices dimensions must match');
        }

        for (let i = 0; i < this.#rows; i++) {
            for (let j = 0; j < this.#columns; j++) {
                this.#data[i][j] += m.data[i][j];
            }
        }
    }

    /**
     * Subtracts one matrix from another and returns the result.
     * @param {Matrix} m1 - The matrix to subtract from.
     * @param {Matrix} m2 - The matrix to subtract.
     * @return {Matrix} The result of the subtraction.
     */
    static subtract(m1, m2) {
        if (!(m1 instanceof Matrix) || !(m2 instanceof Matrix)) {
            throw new TypeError('Arguments must be instances of Matrix');
        }
        if (m1.rows !== m2.rows || m1.columns !== m2.columns) {
            throw new Error('Matrices dimensions must match');
        }

        let result = new Matrix(m1.rows, m1.columns);
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.columns; j++) {
                result.data[i][j] = m1.data[i][j] - m2.data[i][j];
            }
        }
        return result;
    }

    /**
     * Calculates the binary cross entropy error between two matrices.
     * @param {Matrix} targets - The target matrix.
     * @param {Matrix} predictions - The predictions matrix.
     * @return {Matrix} The binary cross entropy error matrix.
     */
    static binaryCrossEntropyError(targets, predictions) {
        if (!(targets instanceof Matrix) || !(predictions instanceof Matrix)) {
            throw new TypeError('Arguments must be instances of Matrix');
        }
        if (targets.rows !== predictions.rows || targets.columns !== predictions.columns) {
            throw new Error('Matrices dimensions must match');
        }

        let errors = new Matrix(targets.rows, targets.columns);
        for (let i = 0; i < errors.rows; i++) {
            for (let j = 0; j < errors.columns; j++) {
                let target = targets.data[i][j];
                let prediction = predictions.data[i][j];
                if (prediction <= 0 || prediction >= 1) {
                    throw new Error('Prediction values must be between 0 and 1');
                }
                errors.data[i][j] = -target * Math.log(prediction) - (1 - target) * Math.log(1 - prediction);
            }
        }
        return errors;
    }

    /**
     * Converts an array to a single-column matrix.
     * @param {Array} array - The array to convert.
     * @return {Matrix} The resulting single-column matrix.
     */
    static fromArray(array) {
        if (!Array.isArray(array)) {
            throw new TypeError('Argument must be an array');
        }

        let m = new Matrix(array.length, 1);
        for (let i = 0; i < array.length; i++) {
            m.data[i][0] = array[i];
        }
        return m;
    }

    /**
     * Converts a single-column matrix to an array.
     * @param {Matrix} m - The matrix to convert.
     * @return {Array} The resulting array.
     */
    static toArray(m) {
        if (!(m instanceof Matrix)) {
            throw new TypeError('Argument must be an instance of Matrix');
        }
        if (m.columns !== 1) {
            throw new Error('Matrix must be a single column to convert to array');
        }

        let array = [];
        for (let i = 0; i < m.rows; i++) {
            for (let j = 0; j < m.columns; j++) { // This loop will run only once
                array.push(m.data[i][j]);
            }
        }
        return array;
    }

    /**
     * Performs a crossover operation between two matrices.
     * @param {Matrix} m1 - The first matrix.
     * @param {Matrix} m2 - The second matrix.
     * @return {Matrix} The result of the crossover.
     */
    static crossover(m1, m2) {
        if (!(m1 instanceof Matrix) || !(m2 instanceof Matrix)) {
            throw new TypeError('Arguments must be instances of Matrix');
        }
        if (m1.rows !== m2.rows || m1.columns !== m2.columns) {
            throw new Error('Matrices dimensions must match');
        }

        let result = new Matrix(m1.rows, m1.columns);
        for (let i = 0; i < m1.rows; i++) {
            for (let j = 0; j < m1.columns; j++) {
                result.data[i][j] = Math.random() < 0.5 ? m1.data[i][j] : m2.data[i][j];
            }
        }
        return result;
    }

    /**
     * Applies mutation to the matrix elements based on a given percentage.
     * @param {Matrix} m - The matrix to mutate.
     * @param {number} percent - The percentage chance of mutation for each element.
     * @return {Matrix} The mutated matrix.
     */
    static mutate(m, percent) {
        if (!(m instanceof Matrix)) {
            throw new TypeError('First argument must be an instance of Matrix');
        }
        if (typeof percent !== 'number' || percent < 0 || percent > 100) {
            throw new TypeError('Second argument must be a number between 0 and 100');
        }

        let result = new Matrix(m.rows, m.columns);
        for (let i = 0; i < m.rows; i++) {
            for (let j = 0; j < m.columns; j++) {
                if (Math.random() * 100 < percent) {
                    result.data[i][j] = Math.random() * 2 - 1; // Random float between -1.0 and 1.0
                } else {
                    result.data[i][j] = m.data[i][j];
                }
            }
        }
        return result;
    }

    /**
     * Getter for the number of rows in the matrix.
     * @return {number} The number of rows.
     */
    get rows() {
        return this.#rows;
    }

    /**
     * Getter for the number of columns in the matrix.
     * @return {number} The number of columns.
     */
    get columns() {
        return this.#columns;
    }

    /**
     * Getter for the data of the matrix.
     * @return {Array} The data array of the matrix.
     */
    get data() {
        return this.#data;
    }

    /**
     * Setter for the number of rows in the matrix.
     * @param {number} newValue - The new number of rows.
     */
    set rows(newValue) {
        if (typeof newValue !== 'number' || newValue < 0) {
            throw new Error('Number of rows must be a non-negative number');
        }
        // Adjust the data array to the new number of rows
        if (newValue > this.#rows) {
            // Add new rows with default values
            for (let i = this.#rows; i < newValue; i++) {
                this.#data.push(new Array(this.#columns).fill(0));
            }
        } else if (newValue < this.#rows) {
            // Remove excess rows
            this.#data = this.#data.slice(0, newValue);
        }
        this.#rows = newValue;
    }

    /**
     * Setter for the number of columns in the matrix.
     * @param {number} newValue - The new number of columns.
     */
    set columns(newValue) {
        if (typeof newValue !== 'number' || newValue < 0) {
            throw new Error('Number of columns must be a non-negative number');
        }
        // Adjust each row in the data array to the new number of columns
        this.#data = this.#data.map(row => {
            if (newValue > row.length) {
                return row.concat(new Array(newValue - row.length).fill(0));
            }
            return row.slice(0, newValue);
        });
        this.#columns = newValue;
    }

    /**
     * Setter for the data of the matrix.
     * @param {Array} newData - The new data array of the matrix.
     */
    set data(newData) {
        if (!Array.isArray(newData) || !newData.every(row => Array.isArray(row) && row.length === newData[0].length)) {
            throw new Error('Data must be a 2D array with equal-length rows');
        }
        this.#rows = newData.length;
        this.#columns = newData.length > 0 ? newData[0].length : 0;
        this.#data = newData;
    }
}