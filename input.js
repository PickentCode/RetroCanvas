class Input {
    constructor(canvasId) {
        this.position = new Vector(0, 0);
        this.canvas = document.getElementById(canvasId);
        this.canvas.addEventListener('mousemove', (e) => this.updatePosition(e), false);
    }

    updatePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;    // relationship bitmap vs. element for X
        const scaleY = this.canvas.height / rect.height;  // relationship bitmap vs. element for Y

        this.position.x = (e.clientX - rect.left) * scaleX;   // scale mouse coordinates after they have
        this.position.y = (e.clientY - rect.top) * scaleY;    // been adjusted to be relative to element
    }

    get mousePosition() {
        return this.position;
    }
}