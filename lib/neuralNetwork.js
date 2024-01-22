/**
 * Represents a Neural Network for basic machine learning tasks.
 */
class NeuralNetwork {
    #numberOfInputs;
    #numberOfHiddenLayers;
    #numberOfHiddenNodesInLayer;
    #numberOfOutputs;
    #layers;
    #biases;
    #learningRate;

    /**
     * Constructs a Neural Network.
     * @param {number} inputs - Number of input nodes.
     * @param {number} hiddenLayers - Number of hidden layers.
     * @param {number} hiddenNodesPerLayer - Number of nodes in each hidden layer.
     * @param {number} outputs - Number of output nodes.
     */
    constructor(inputs, hiddenLayers, hiddenNodesPerLayer, outputs) {
        if (inputs <= 0 || hiddenLayers <= 0 || hiddenNodesPerLayer <= 0 || outputs <= 0) {
            throw new Error('All arguments must be greater than 0');
        }

        this.#numberOfInputs = inputs;
        this.#numberOfHiddenLayers = hiddenLayers;
        this.#numberOfHiddenNodesInLayer = hiddenNodesPerLayer;
        this.#numberOfOutputs = outputs;

        this.#layers = new Array(hiddenLayers + 1);
        this.#biases = new Array(hiddenLayers + 1);

        this.#learningRate = 0.01; // Default learning rate

        for (let i = 0; i <= hiddenLayers; i++) {
            let layer, bias;
            if (i === 0) {
                layer = new Matrix(hiddenNodesPerLayer, inputs);
                bias = new Matrix(hiddenNodesPerLayer, 1);
                layer = this.#xavierInitialize(layer, hiddenNodesPerLayer);
            } else if (i === hiddenLayers) {
                layer = new Matrix(outputs, hiddenNodesPerLayer);
                bias = new Matrix(outputs, 1);
                layer = this.#xavierInitialize(layer, outputs);
            } else {
                layer = new Matrix(hiddenNodesPerLayer, hiddenNodesPerLayer);
                bias = new Matrix(hiddenNodesPerLayer, 1);
                layer = this.#xavierInitialize(layer, hiddenNodesPerLayer);
            }
            this.#layers[i] = layer;
            this.#biases[i] = bias;
        }
    }

    /**
     * Creates a neural network from a JSON string.
     * @param {string} jsonString - The JSON string representing the neural network.
     * @return {NeuralNetwork} The reconstructed neural network.
     */
    static fromJSON(jsonString) {
        try {
            const json = JSON.parse(jsonString);
    
            const nn = new NeuralNetwork(json.numberOfInputs, json.numberOfHiddenLayers, json.numberOfHiddenNodesInLayer, json.numberOfOutputs);
            nn.#layers = json.layers.map(layerJson => {
                const rows = layerJson.data.length;
                const cols = rows > 0 ? layerJson.data[0].length : 0;
                const layer = new Matrix(rows, cols);
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        layer.data[i][j] = layerJson.data[i][j];
                    }
                }
                return layer;
            });
            nn.#biases = json.biases.map(biasJson => {
                const rows = biasJson.data.length;
                const cols = rows > 0 ? biasJson.data[0].length : 0;
                const bias = new Matrix(rows, cols);
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        bias.data[i][j] = biasJson.data[i][j];
                    }
                }
                return bias;
            });
            nn.#learningRate = json.learningRate;
    
            return nn;
        } catch (error) {
            throw new Error('Error parsing the JSON string: ' + error.message);
        }
    }

    /**
     * Serializes the neural network into a JSON string.
     * @return {string} The JSON string representation of the neural network.
     */
    toJSON() {
        if (!this.#layers || !this.#biases) {
            throw new Error('Network layers or biases are not defined.');
        }
    
        const networkData = {
            numberOfInputs: this.#numberOfInputs,
            numberOfHiddenLayers: this.#numberOfHiddenLayers,
            numberOfHiddenNodesInLayer: this.#numberOfHiddenNodesInLayer,
            numberOfOutputs: this.#numberOfOutputs,
            layers: this.#layers.map(layer => ({ data: layer.data })),
            biases: this.#biases.map(bias => ({ data: bias.data })),
            learningRate: this.#learningRate
        };
    
        return JSON.stringify(networkData);
    }

    /**
     * Performs the feedforward operation.
     * @param {Array} inputArray - The input array.
     * @return {Array} The output array after feedforward computation.
     */
    feedForward(inputArray) {
        if (!Array.isArray(inputArray) || inputArray.length !== this.#numberOfInputs) {
            throw new Error('Input array must be an array with the correct number of inputs');
        }

        let nodeValues = new Array(this.#numberOfHiddenLayers + 2);
        let values;
        for (let i = 0; i < this.#numberOfHiddenLayers + 2; i++) {
            if (i === 0) {
                values = Matrix.fromArray(inputArray);
            } else {
                values = Matrix.matrixProduct(this.#layers[i - 1], nodeValues[i - 1]);
                values.add(this.#biases[i - 1]);
                values.applySigmoid();
            }
            nodeValues[i] = values;
        }

        return Matrix.toArray(nodeValues[this.#numberOfHiddenLayers + 1]);
    }

    /**
     * Feeds forward the input array for training purposes, capturing each layer's output.
     * @param {Array} inputArray - The input array.
     * @return {Array} Array of matrices representing the output of each layer.
     */
    #feedForwardForTraining(inputArray) {
        if (!Array.isArray(inputArray) || inputArray.length !== this.#numberOfInputs) {
            throw new Error('Input array must be an array with the correct number of inputs');
        }

        let nodeValues = new Array(this.#numberOfHiddenLayers + 2);
        let values;
        for (let i = 0; i < this.#numberOfHiddenLayers + 2; i++) {
            if (i === 0) {
                values = Matrix.fromArray(inputArray);
            } else {
                values = Matrix.matrixProduct(this.#layers[i - 1], nodeValues[i - 1]);
                values.add(this.#biases[i - 1]);
                values.applySigmoid();
            }
            nodeValues[i] = values;
        }

        return nodeValues;
    }

    /**
     * Trains the neural network on given input and target arrays.
     * @param {Array} inputArray - The input array.
     * @param {Array} targetArray - The target array.
     */
    trainNetwork(inputArray, targetArray) {
        if (!Array.isArray(inputArray) || inputArray.length !== this.#numberOfInputs) {
            throw new Error('Input array must be an array with the correct number of inputs');
        }
        if (!Array.isArray(targetArray) || targetArray.length !== this.#numberOfOutputs) {
            throw new Error('Target array must be an array with the correct number of outputs');
        }

        // Feed forward for training
        let nodeValues = this.#feedForwardForTraining(inputArray);

        // Backpropagation
        let errors = new Array(this.#numberOfHiddenLayers + 1);

        // Calculate output layer error
        let targets = Matrix.fromArray(targetArray);
        errors[this.#numberOfHiddenLayers] = Matrix.subtract(targets, nodeValues[this.#numberOfHiddenLayers + 1]);

        // Calculate hidden layer errors
        for (let i = this.#numberOfHiddenLayers - 1; i >= 0; i--) {
            let transposedWeights = Matrix.transpose(this.#layers[i + 1]);
            errors[i] = Matrix.matrixProduct(transposedWeights, errors[i + 1]);
        }

        // Calculate gradients and update weights and biases
        for (let i = 0; i <= this.#numberOfHiddenLayers; i++) {
            let gradients = Matrix.applyDerivativeOfSigmoid(nodeValues[i + 1]);
            gradients.matrixProduct(errors[i]);
            gradients.multiply(this.#learningRate);

            let transposedInput = i > 0 ? Matrix.transpose(nodeValues[i]) : Matrix.transpose(nodeValues[0]);
            let deltas = Matrix.matrixProduct(gradients, transposedInput);

            this.#layers[i].add(deltas);
            this.#biases[i].add(gradients);
        }
    }

    /**
     * Performs crossover and mutation between two neural networks.
     * @param {NeuralNetwork} nn1 - The first neural network.
     * @param {NeuralNetwork} nn2 - The second neural network.
     * @param {number} mutationPercent - The percentage chance of mutation for each element.
     * @return {NeuralNetwork} The new neural network after crossover and mutation.
     */
    static crossover(nn1, nn2, mutationPercent) {
        if (!(nn1 instanceof NeuralNetwork) || !(nn2 instanceof NeuralNetwork)) {
            throw new TypeError('Arguments must be instances of NeuralNetwork');
        }
        if (typeof mutationPercent !== 'number' || mutationPercent < 0 || mutationPercent > 100) {
            throw new TypeError('Mutation percent must be a number between 0 and 100');
        }

        let result = new NeuralNetwork(nn1.numberOfInputs, nn1.numberOfHiddenLayers, nn1.numberOfHiddenNodesInLayer, nn1.numberOfOutputs);
        for (let i = 0; i < result.layers.length; i++) {
            result.layers[i] = Matrix.crossover(nn1.layers[i], nn2.layers[i]);
            result.layers[i] = Matrix.mutate(result.layers[i], mutationPercent);
            result.biases[i] = Matrix.crossover(nn1.biases[i], nn2.biases[i]);
            result.biases[i] = Matrix.mutate(result.biases[i], mutationPercent);
        }
        return result;
    }

    /**
     * Initializes the weights of the given matrix using Xavier Initialization.
     * @param {Matrix} matrix - The matrix to initialize.
     * @param {number} layerSize - The size of the next layer in the network.
     * @return {Matrix} The matrix after applying Xavier Initialization.
     */
    #xavierInitialize(matrix, layerSize) {
        if (!(matrix instanceof Matrix)) {
            throw new TypeError('Argument must be an instance of Matrix');
        }
        if (typeof layerSize !== 'number' || layerSize <= 0) {
            throw new TypeError('Layer size must be a positive number');
        }

        const variance = Math.sqrt(2.0 / layerSize);
        for (let i = 0; i < matrix.rows; i++) {
            for (let j = 0; j < matrix.columns; j++) {
                matrix.data[i][j] = Math.random() * 2 * variance - variance;
            }
        }
        return matrix;
    }

    /**
     * Sets the learning rate of ANN (Value between 0 and 1).
     * @param {number} value - The new learning rate.
     */
    set learningRate(value) {
        if (typeof value !== 'number') {
            throw new Error("Learning rate must be a number.");
        }
        this.#learningRate = GameMath.clamp(value, 0, 1);
    }
}