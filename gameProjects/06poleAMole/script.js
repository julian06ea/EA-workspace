class Game {
  constructor() {
    this.moleHoles = [
      [55, 354],
      [424, 330],
      [424, 505],
      [581, 453],
      [709, 376]
    ]
    new Mole(this);
    this.score = 0;
    document.getElementById("score").innerText = `Score: ${this.score}`;
    this.timer = 30;
    document.getElementById("timer").innerText = `Remaining Time: ${this.timer}s`

let game;

function startGame() {
  game = new Game();
  document.getElementById("startGame").style.display = "none";
}
    this.isActive = true;
    this.lastHole = null;

    document.getElementById("mole").addEventListener("click", () => { this.incrementScore() })

    document.getElementById("summary").style.display = "none";
    this.handleTimer()
  }

  incrementScore() {
    if(this.isActive) {
      new Mole(this);
      this.score++; 
      document.getElementById("score").innerText = `Score: ${this.score}`;
    }
  }

  handleTimer() {
    let timeInterval = setInterval(() => {
      if(this.timer > 0) {
        this.timer--; 
        document.getElementById("timer").innerText = `Remaining Time: ${this.timer}s`
      } else {
         clearInterval(timeInterval)
        this.summary();
      }
    }, 1000);
  }

  summary() {
    this.isActive = false;
    document.getElementById("summary").style.display = "block";
    document.getElementById("scoreSummary").innerText = `Din score ble: ${this.score}`;
    document.getElementById("startGame").style.display = "block";

  }

}

class Mole {
  constructor(game) {
    this.game = game;
    this.holeIndex = Math.floor(Math.random() * 5);
    while(this.holeIndex === this.game.lastHole) {
      this.holeIndex = Math.floor(Math.random() * 5);
    }
    this.game.lastHole = this.holeIndex;
    this.mole = document.getElementById("mole");
    this.x = this.game.moleHoles[this.holeIndex][0];
    this.y = this.game.moleHoles[this.holeIndex][1];
    this.spawnMole();
  }

  spawnMole() {
    this.mole.style.left = `${this.x}px`
    this.mole.style.top =`${this.y}px`
    this.mole.style.display = "block";
  }

}

let game;

function startGame() {
  game = new Game();
  document.getElementById("startGame").style.display = "none";
}



