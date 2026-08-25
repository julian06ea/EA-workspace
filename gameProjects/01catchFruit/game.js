// Spill klasser
class Basket {
    constructor() {
        this.width = 100;
        this.height = 20;
        this.x = (gameArea.offsetWidth - this.width) / 2;
        this.speed = 5;
        this.direction = 0; // 0 = ingen bevegelse, -1 = venstre, 1 = høyre
        this.element = document.getElementById("basket");
        this.updatePosition();
    }

    move() {
        if (this.direction === -1 && this.x > 0) {
            this.x -= this.speed;
        } else if (this.direction === 1 && this.x < gameArea.offsetWidth - this.width) {
            this.x += this.speed;
        }
        this.updatePosition();
    }

    updatePosition() {
        this.element.style.left = `${this.x}px`;
    }
}

class Fruit {
    constructor() {
        this.size = 30;
        this.x = Math.random() * (gameArea.offsetWidth - this.size);
        this.y = -this.size; // Starter utenfor skjermen
        this.speed = 2 + Math.random() * 3; // Random hastighet
        this.type = Math.random() > 0.5 ? 'apple' : 'banana'; // To typer frukt
        this.element = document.createElement("div");
        this.element.classList.add("fruit", this.type);
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        gameArea.appendChild(this.element);
    }

    fall() {
        this.y += this.speed;
        this.element.style.top = `${this.y}px`;
    }

    remove() {
        this.element.remove();
    }
}

class Game {
    constructor() {
        this.basket = new Basket();
        this.fruits = [];
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.isPlaying = false;
    }

    start() {
        this.isPlaying = true;
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        document.querySelector(".scoreboard").classList.remove("hidden");
        document.getElementById("score").textContent = this.score;
        document.getElementById("lives").textContent = this.lives;
        this.fruits = [];
        gameLoop();
    }

    spawnFruit() {
        const fruit = new Fruit();
        this.fruits.push(fruit);
    }

    checkCollision(fruit) {
        const basket = this.basket;
        return fruit.x + fruit.size > basket.x &&
               fruit.x < basket.x + basket.width &&
               fruit.y + fruit.size > gameArea.offsetHeight - basket.height;
    }

    update() {
        if (this.gameOver) return;

        this.basket.move();
        
        // Beveg og tegn fruktene
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            fruit.fall();

            // Sjekk om frukten er fanget
            if (this.checkCollision(fruit)) {
                this.score++;
                document.getElementById("score").textContent = this.score;
                fruit.remove();
                this.fruits.splice(i, 1);
                this.spawnFruit();
            }
            // Sjekk om frukten har nådd bunnen
            else if (fruit.y > gameArea.offsetHeight) {
                this.lives--;
                document.getElementById("lives").textContent = this.lives;
                fruit.remove();
                this.fruits.splice(i, 1);
                this.spawnFruit();
            }
        }

        // Sjekk om spillet er over
        if (this.lives <= 0) {
            this.gameOver = true;
            alert("Game Over!");
        }
    }

    handleKeydown(event) {
        if (event.key === "ArrowLeft") {
            this.basket.direction = -1;
        } else if (event.key === "ArrowRight") {
            this.basket.direction = 1;
        }
    }

    handleKeyup(event) {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            this.basket.direction = 0;
        }
    }
}

// Initialiser spill og spillkontroll
const game = new Game();

document.getElementById("startBtn").addEventListener("click", () => {
    game.start();
    document.getElementById("startBtn").classList.add("hidden");
});

window.addEventListener("keydown", (event) => game.handleKeydown(event));
window.addEventListener("keyup", (event) => game.handleKeyup(event));

// Spillets hovedloop
function gameLoop() {
    if (game.isPlaying) {
        game.update();
        requestAnimationFrame(gameLoop);
    }
}
