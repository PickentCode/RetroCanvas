/**
 * The Input class provides a unified way to handle user input, 
 * including mouse, keyboard, and gamepad events.
 */
class Input {
    #canvasId;
    #canvas;
    // Keyboard attributes
    #keys;
    // Mouse attributes
    #position;
    #mouseButtons;
    // Gamepad attributes
    #gamepads = [];
    #gamepadButtonStates = [];
    #gamepadAxesStates = [];
    #gamepadConnected = [];

    /**
     * Creates an instance of the Input class.
     * @param {string} canvasId - The ID of the canvas element to attach event listeners to.
     */
    constructor(canvasId) {
        if (typeof canvasId !== 'string') {
            throw new Error('Invalid canvasId provided. Ensure it corresponds to an existing canvas element.');
        }
        this.#position = new Vector(0, 0);
        this.#canvasId = canvasId;

        // Mouse
        this.#mouseButtons = {
            [MouseButtons.LEFT]: false,
            [MouseButtons.MIDDLE]: false,
            [MouseButtons.RIGHT]: false,
            [MouseButtons.BACK]: false,
            [MouseButtons.FORWARD]: false,
        };

        // Keyboard
        this.#keys = {};
    }

    /**
     * Initializes the event listeners for the canvas element.
     */
    init() {
        this.#canvas = document.getElementById(this.#canvasId);
        if (!this.#canvas) {
            throw new Error('Failed to initialize. Ensure canvasId corresponds to an existing canvas element.');
        }
        this.#initializeEventListeners();
    }

    /**
     * Registers event listeners for mouse, keyboard, and gamepad events.
     */
    #initializeEventListeners() {
        // Mouse
        this.#canvas.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
        this.#canvas.addEventListener('mousemove', (e) => this.#updatePosition(e), false);
        this.#canvas.addEventListener('mousedown', (e) => this.onMouseButtonDown(e), false);
        this.#canvas.addEventListener('mousedown', (e) => this.#handleMouseDown(e), false);
        this.#canvas.addEventListener('mouseup', (e) => this.onMouseButtonUp(e), false);
        this.#canvas.addEventListener('mouseup', (e) => this.#handleMouseUp(e), false);
        this.#canvas.addEventListener('wheel', (e) => this.onMouseWheel(e), false);

        // Keyboard
        window.addEventListener('keydown', (e) => this.#handleKeyDown(e), false);
        window.addEventListener('keyup', (e) => this.#handleKeyUp(e), false);
        window.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        window.addEventListener('keyup', (e) => this.onKeyUp(e), false);

        // Gamepad
        window.addEventListener('gamepadconnected', (e) => this.#handleGamepadConnected(e), false);
        window.addEventListener('gamepaddisconnected', (e) => this.#handleGamepadDisconnected(e), false);
    }
    
    // Mouse

    /**
     * Update the mouse position based on the current mouse event.
     * @param {MouseEvent} e - The mouse event object.
     */
    #updatePosition(e) {
        const rect = this.#canvas.getBoundingClientRect();
        const scaleX = this.#canvas.width / rect.width;
        const scaleY = this.#canvas.height / rect.height;

        this.#position.x = (e.clientX - rect.left) * scaleX;
        this.#position.y = (e.clientY - rect.top) * scaleY;
    }

    /**
     * Handle the mouse down event and set the respective button state to true.
     * @param {MouseEvent} e - The mouse event object.
     */
    #handleMouseDown(e) {
        switch (e.button) {
            case 0:
                this.#mouseButtons[MouseButtons.LEFT] = true;
                break;
            case 1:
                this.#mouseButtons[MouseButtons.MIDDLE] = true;
                break;
            case 2:
                this.#mouseButtons[MouseButtons.RIGHT] = true;
                break;
            case 3:
                this.#mouseButtons[MouseButtons.BACK] = true;
                break;
            case 4:
                this.#mouseButtons[MouseButtons.FORWARD] = true;
                break;
            default:
                break;
        }
    }    

    /**
     * Handle the mouse up event and set the respective button state to false.
     * @param {MouseEvent} e - The mouse event object.
     */
    #handleMouseUp(e) {
        switch (e.button) {
            case 0:
                this.#mouseButtons[MouseButtons.LEFT] = false;
                break;
            case 1:
                this.#mouseButtons[MouseButtons.MIDDLE] = false;
                break;
            case 2:
                this.#mouseButtons[MouseButtons.RIGHT] = false;
                break;
            case 3:
                this.#mouseButtons[MouseButtons.BACK] = false;
                break;
            case 4:
                this.#mouseButtons[MouseButtons.FORWARD] = false;
                break;
            default:
                break;
        }
    }

    /**
     * Event handler to be overridden when the mouse is moved.
     * @param {MouseEvent} e - The mouse event object.
     */
    onMouseMove(e) {
        // Placeholder for user implementation
    }

    /**
     * Event handler to be overridden when the mouse wheel is used.
     * @param {MouseEvent} e - The mouse event object.
     */
    onMouseWheel(e) {
        // Placeholder for user implementation
    }

    /**
     * Event handler to be overridden when a mouse button is pressed down.
     * @param {MouseEvent} e - The mouse event object.
     */
    onMouseButtonDown(e) {
        // Placeholder for user implementation
    }

    /**
     * Event handler to be overridden when a mouse button is released.
     * @param {MouseEvent} e - The mouse event object.
     */
    onMouseButtonUp(e) {
        // Placeholder for user implementation
    }

    /**
     * Get the current state of a mouse button.
     * @param {MouseButtons} button - The mouse button to check.
     * @returns {boolean} - The current state of the mouse button.
     */
    getMouseButton(button) {
        if (!this.#mouseButtons.hasOwnProperty(button)) {
            throw new Error(`Invalid mouse button: ${button}`);
        }
        return this.#mouseButtons[button];
    }

    /**
     * Get the current position of the mouse.
     * @returns {Vector} - The current position of the mouse.
     */
    getMousePosition() {
        return this.#position;
    }

    /**
     * Handle the key down event and set the respective key state to true.
     * @param {KeyboardEvent} e - The keyboard event object.
     */
    #handleKeyDown(e) {
        this.#keys[e.code] = true;
    }

    /**
     * Handle the key up event and set the respective key state to false.
     * @param {KeyboardEvent} e - The keyboard event object.
     */
    #handleKeyUp(e) {
        this.#keys[e.code] = false;
    }

    /**
     * Event handler to be overridden when a key is pressed down.
     * @param {KeyboardEvent} e - The keyboard event object.
     */
    onKeyDown(e) {
        // Placeholder for user implementation
    }

    /**
     * Event handler to be overridden when a key is released.
     * @param {KeyboardEvent} e - The keyboard event object.
     */
    onKeyUp(e) {
        // Placeholder for user implementation
    }

    /**
     * Get the current state of a key.
     * @param {string} keyCode - The code of the key to check.
     * @returns {boolean} - The current state of the key.
     */
    getKey(keyCode) {
        if (typeof keyCode !== 'string') {
            throw new Error('Invalid keyCode. It should be a string.');
        }
        return !!this.#keys[keyCode];
    }

    // Gamepad

    /**
     * Handle the gamepad connection event and store the state of the connected gamepad.
     * @param {GamepadEvent} event - The gamepad connection event object.
     */
    #handleGamepadConnected(event) {
        console.log(`GamePad ${event.gamepad.index} connected.`);
        const gamepadIndex = event.gamepad.index;
        this.#gamepads[gamepadIndex] = event.gamepad;
        this.#gamepadButtonStates[gamepadIndex] = new Array(event.gamepad.buttons.length).fill(false);
        this.#gamepadAxesStates[gamepadIndex] = new Array(event.gamepad.axes.length).fill(0.0);
        this.#attachGamepadListeners();
    }

    /**
     * Handle the gamepad disconnection event and remove the state of the disconnected gamepad.
     * @param {GamepadEvent} event - The gamepad disconnection event object.
     */
    #handleGamepadDisconnected(event) {
        console.log(`GamePad ${event.gamepad.index} disconnected.`);
        const disconnectedGamepadIndex = event.gamepad.index;
        this.#gamepads[disconnectedGamepadIndex] = undefined;
        this.#gamepadButtonStates[disconnectedGamepadIndex] = [];
        this.#gamepadAxesStates[disconnectedGamepadIndex] = [];
    }

    /**
     * Attach listeners for gamepad button presses and axis changes.
     * Polls the gamepad state at a regular interval.
     */
    #attachGamepadListeners() {
        const AXIS_CHANGE_THRESHOLD = 0.01; // Only detect significant changes

        const handleButtonsChange = (gamepad) => {
            gamepad.buttons.forEach((button, index) => {
                if (this.#gamepadButtonStates[gamepad.index][index] !== button.pressed) {
                    this.#gamepadButtonStates[gamepad.index][index] = button.pressed;
                    if (button.pressed) {
                        this.onGamepadButtonPressed(index, gamepad.index);
                    } else {
                        this.onGamepadButtonReleased(index, gamepad.index);
                    }
                }
            });
        };

        const handleAxesChange = (gamepad) => {
            gamepad.axes.forEach((axis, index) => {
                if (Math.abs(this.#gamepadAxesStates[gamepad.index][index] - axis) > AXIS_CHANGE_THRESHOLD) {
                    this.#gamepadAxesStates[gamepad.index][index] = axis;
                    this.onGamepadAxisChanged(index, axis, gamepad.index);
                }
            });
        };

        setInterval(() => {
            const gamepads = navigator.getGamepads();
            for (const gamepad of gamepads) {
                if (gamepad) {
                    handleButtonsChange(gamepad);
                    handleAxesChange(gamepad);
                }
            }
        }, 17); // Check every 17ms, 60fps
    }

    /**
     * Check the state of a specific gamepad button.
     * @param {number} gamepadIndex - The index of the gamepad.
     * @param {number} buttonIndex - The index of the gamepad button.
     * @returns {boolean} - The current state of the gamepad button.
     */
    getGamepadButton(gamepadIndex, buttonIndex) {
        if (!this.#gamepads[gamepadIndex]) {
            throw new Error(`No gamepad connected at index ${gamepadIndex}.`);
        }
        if (buttonIndex < 0 || buttonIndex >= this.#gamepads[gamepadIndex].buttons.length) {
            throw new Error(`Invalid button index. Valid indices are between 0 and ${this.#gamepads[gamepadIndex].buttons.length - 1}.`);
        }
        return this.#gamepadButtonStates[gamepadIndex][buttonIndex];
    }

    /**
     * Event handler to be overridden when a gamepad button is pressed.
     * @param {number} buttonIndex - The index of the gamepad button.
     * @param {number} gamepadIndex - The index of the gamepad.
     */
    onGamepadButtonPressed(buttonIndex, gamepadIndex) {
        // Handle the logic when a gamepad button is pressed
        console.log(`Button ${buttonIndex} pressed on gamepad ${gamepadIndex}`);
    }

     /**
     * Event handler to be overridden when a gamepad button is released.
     * @param {number} buttonIndex - The index of the gamepad button.
     * @param {number} gamepadIndex - The index of the gamepad.
     */
    onGamepadButtonReleased(buttonIndex, gamepadIndex) {
        // Handle the logic when a gamepad button is released
        console.log(`Button ${buttonIndex} released on gamepad ${gamepadIndex}`);
    }

    /**
     * Event handler to be overridden when a gamepad axis value changes.
     * @param {number} axisIndex - The index of the gamepad axis.
     * @param {number} value - The current value of the gamepad axis.
     * @param {number} gamepadIndex - The index of the gamepad.
     */
    onGamepadAxisChanged(axisIndex, value, gamepadIndex) {
        // Handle the logic when a gamepad axis value changes
        console.log(`Axis ${axisIndex} value changed to ${value} on gamepad ${gamepadIndex}`);
    }

    /**
     * Check if a specific gamepad is currently connected.
     * @param {number} gamepadIndex - The index of the gamepad to check.
     * @returns {boolean} - Whether the gamepad is connected or not.
     */
    isGamepadConnected(gamepadIndex) {
        if (gamepadIndex < 0 || gamepadIndex >= this.#gamepads.length) {
            return false;
        }
        return this.#gamepads[gamepadIndex] !== undefined;
    }
}

/**
 * Enum representing key codes for a selection of keyboard keys.
 * Each property corresponds to a specific keyboard key and holds its respective key code.
 * These key codes can be used to identify specific keys during keyboard events, such as 'keydown' or 'keyup'.
 * @constant
 * @type {object}
 */
const KeyCode = {
    A: 'KeyA',
    B: 'KeyB',
    C: 'KeyC',
    D: 'KeyD',
    E: 'KeyE',
    F: 'KeyF',
    G: 'KeyG',
    H: 'KeyH',
    I: 'KeyI',
    J: 'KeyJ',
    K: 'KeyK',
    L: 'KeyL',
    M: 'KeyM',
    N: 'KeyN',
    O: 'KeyO',
    P: 'KeyP',
    Q: 'KeyQ',
    R: 'KeyR',
    S: 'KeyS',
    T: 'KeyT',
    U: 'KeyU',
    V: 'KeyV',
    W: 'KeyW',
    X: 'KeyX',
    Y: 'KeyY',
    Z: 'KeyZ',
    ZERO: 'Digit0',
    ONE: 'Digit1',
    TWO: 'Digit2',
    THREE: 'Digit3',
    FOUR: 'Digit4',
    FIVE: 'Digit5',
    SIX: 'Digit6',
    SEVEN: 'Digit7',
    EIGHT: 'Digit8',
    NINE: 'Digit9',
    ESCAPE: 'Escape',
    SPACE: 'Space',
    ENTER: 'Enter',
    SHIFT: 'Shift',
    CONTROL: 'Control',
    ALT: 'Alt',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    NUMPAD_0: 'Numpad0',
    NUMPAD_1: 'Numpad1',
    NUMPAD_2: 'Numpad2',
    NUMPAD_3: 'Numpad3',
    NUMPAD_4: 'Numpad4',
    NUMPAD_5: 'Numpad5',
    NUMPAD_6: 'Numpad6',
    NUMPAD_7: 'Numpad7',
    NUMPAD_8: 'Numpad8',
    NUMPAD_9: 'Numpad9',
    NUMPAD_ADD: 'NumpadAdd',
    NUMPAD_SUBTRACT: 'NumpadSubtract',
    NUMPAD_MULTIPLY: 'NumpadMultiply',
    NUMPAD_DIVIDE: 'NumpadDivide',
    NUMPAD_DECIMAL: 'NumpadDecimal',
    NUMPAD_ENTER: 'NumpadEnter',
    NUMPAD_CLEAR: 'NumpadClear',
    NUMPAD_EQUALS: 'NumpadEqual',
};

/**
 * Enum representing button indices for a standard gamepad.
 * Each property corresponds to a specific gamepad button and holds its respective index.
 * These indices can be used to identify specific buttons during gamepad events or when querying the state of a gamepad.
 * @constant
 * @type {object}
 */
const GamepadButtons = {
    // Standard buttons
    A: 0,
    B: 1,
    X: 2,
    Y: 3,
    LEFT_BUMPER: 4,
    RIGHT_BUMPER: 5,
    LEFT_TRIGGER: 6,
    RIGHT_TRIGGER: 7,
    BACK: 8,
    START: 9,
    LEFT_STICK_CLICK: 10,
    RIGHT_STICK_CLICK: 11,
    DPAD_UP: 12,
    DPAD_DOWN: 13,
    DPAD_LEFT: 14,
    DPAD_RIGHT: 15,
    HOME: 16,

    // Analog sticks (axes)
    LEFT_STICK_X: 0,
    LEFT_STICK_Y: 1,
    RIGHT_STICK_X: 2,
    RIGHT_STICK_Y: 3
};


/**
 * Enum representing button codes for mouse buttons.
 * Each property corresponds to a specific mouse button and holds its respective button code.
 * These codes can be used to identify specific buttons during mouse events, such as 'mousedown' or 'mouseup'.
 * @constant
 * @type {object}
 */
const MouseButtons = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
    BACK: 3,
    FORWARD: 4,
    WHEEL_UP: 'WHEEL_UP',
    WHEEL_DOWN: 'WHEEL_DOWN'
};