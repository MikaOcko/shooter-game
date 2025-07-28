// ---------- Imports ----------
// Canvas methods call
/** @type {HTMLCanvasElement} */

// ---------- Variables/elements ----------
// Get elements from the DOM
const canvas = document.getElementById("canvas1");
const collisionCanvas = document.getElementById('collisionCanvas');

// Canvas
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const collisionCtx = collisionCanvas.getContext("2d");
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

let score = 0;
let gameOver = false;

// Timestamp management
let timeToNextraven = 0;
let ravenInterval = 600; // in milliseconds
let lastTime = 0;

// Ennemies
let ravens = [];
let explosions = [];

// ---------- Functions/logic ----------
class Raven {
    constructor() {
        this.spriteWidth = 271; // longueur de l'image / nb de frame
        this.spriteHeight = 194;
        this.sizeModifier = Math.random() * 0.35 + 0.25; // ravens of different size
        this.width = this.spriteWidth * this.sizeModifier;
        this.height = this.spriteHeight * this.sizeModifier;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        this.directionX = Math.random() * 5 + 3; // Horizontal speed
        this.directionY = Math.random() * 5 -2.5; // Vertical bouncing
        this.markedForDeletion = false; // boolean to filter the array ravens
        this.image = new Image();
        this.image.src = 'assets/images/raven.png';
        this.frame = 0;
        this.maxFrame = 4;
        this.timeSinceFlap = 0;
        this.flapInterval = Math.random() * 50 + 50;
        this.randomColors = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
        this.color = 'rgb(' + this.randomColors[0] + ',' + this.randomColors[1] + ',' + this.randomColors[2] + ')';
    };

    update(deltaTime) {
        if (this.y < 0 || this.y > canvas.height - this.height) {
            this.directionY = this.directionY * -1;
        };
        this.x -= this.directionX; // Moving to left
        this.y += this.directionY;
        // if the raven is out of screen, delete it
        if (this.x < 0 - this.width) {
            this.markedForDeletion = true;
        };
        // Flap speed
        this.timeSinceFlap += deltaTime;
        if (this.timeSinceFlap > this.flapInterval) {
            // To run animation of flapping
            if (this.frame > this.maxFrame) {
                this.frame = 0;
            } else {
                this.frame ++;
            };
            this.timeSinceFlap = 0;
        };

        // Game over
        if (this.x < 0 - this.width) {
            gameOver = true;
        }
    };

    draw() {
        collisionCtx.fillStyle = this.color;
        collisionCtx.fillRect(this.x, this.y, this.width, this.height); // hitbox = collision detection area
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    };
}

class Explosion {
    constructor(x, y, size) {
        this.spriteWidth = 200; // longueur de l'image / nb de frame
        this.spriteHeight = 179;
        this.image = new Image();
        this.image.src = 'assets/images/boom.png';
        this.size = size;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.sound = new Audio();
        this.sound.src = 'assets/audio/crow_caw.wav';
        this.timeSinceLastFrame = 0;
        this.frameInterval = 200; // in milliseconds
        this.markedForDeletion = false; // boolean to filter the array explosions
    };

    update(deltaTime) {
        // Sound effect
        if (this.frame === 0) {
            this.sound.play();
        };
        // Sprite animation
        this.timeSinceLastFrame += deltaTime;
        if (this.timeSinceLastFrame > this.frameInterval) {
            this.frame ++;
            this.timeSinceLastFrame = 0;
            
            if (this.frame > 5) {
                this.markedForDeletion = true;
            }
        };
    };

    draw() {
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.size, this.size);
    };
}

// Display score
function drawScore() {
    ctx.font = '50px Impact';
    ctx.fillStyle = 'black';
    ctx.fillText('Score : ' + score, 50, 75);
    ctx.fillStyle = 'white';
    ctx.fillText('Score : ' + score, 55, 80);
}

// Display game over message
function drawGameOver() {
    ctx.font = '50px Impact';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText('GAME OVER, your score is : ' + score, canvas.width/2, canvas.height/2);
    ctx.fillStyle = 'white';
    ctx.fillText('GAME OVER, your score is : ' + score, canvas.width/2 + 5, canvas.height/2 + 5);
}

// On click event
window.addEventListener('click', function(e) {
    // RGBA color of a clicked pixel
    const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
    // console.log(detectPixelColor);
    //Compare hitbox color of each raven with color of clicked pixel
    const pixelColor = detectPixelColor.data;
    ravens.forEach(object => {
        if (object.randomColors[0] === pixelColor[0] &&
            object.randomColors[1] === pixelColor[1] &&
            object.randomColors[2] === pixelColor[2]
        ) {
            //same color = collision
            object.markedForDeletion = true;
            score ++;
            explosions.push(new Explosion(object.x, object.y, object.width));
        }
    });
});

// Raven animation and movement
function animate(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height);

    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextraven += deltaTime;

    if (timeToNextraven > ravenInterval) {
        ravens.push(new Raven());
        timeToNextraven = 0;
        // Put big ravens to the front and samller ravents to the back
        ravens.sort(function(a,b) {
            return a.width - b.width;
        });
    };

    // Display score
    drawScore();

    //array literal + spread operator
    [...ravens, ...explosions].forEach(object => object.update(deltaTime));
    [...ravens, ...explosions].forEach(object => object.draw());
    
    ravens = ravens.filter(object => !object.markedForDeletion); // replace ravens who are not out of the screen (markedForDeletion = false)
    explosions = explosions.filter(object => !object.markedForDeletion); // replace ravens who are not out of the screen (markedForDeletion = false)

    if (!gameOver) {
        requestAnimationFrame(animate);
    } else {
        drawGameOver();
    }
}

animate(0);