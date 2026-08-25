class Spill {
    fart;
    hoyde;
    bredde;
    spillbettDiv;
    padde;
    baller;
    intervallID;

    constructor(fart) {
        this.fart = fart;
        this.hoyde = 700;
        this.bredde = 500;
        this.spillbrettDiv = document.getElementById("spill");
        this.padde = Object;
        this.baller = [];
        this.intervallID = null;
    }

    start() {
        //Sletter melding, padde og baller fra eventuelt forrige spill
		document.getElementById("melding").innerHTML ="";
		document.querySelectorAll('.ball').forEach(ball => ball.remove());
        this.padde = null;

        this.padde = new Padde();
        this.leggTilBall();
        //Start spilloppdatering for å flytte ballene
        this.intervallID = setInterval(this.sjekkKollisjonOgFlyttball.bind(this),this.fart);
        
    }
    sjekkKollisjonOgFlyttball()  {
        for (let i = 0; i < this.baller.length; i++) {

           this.baller[i].x += this.baller[i].speedX;
           this.baller[i].y += this.baller[i].speedY;

          //Sjekker om padden er truffet
          if (this.baller[i].y + this.baller[i].ballDiv.offsetHeight >= this.padde.paddeDiv.offsetTop && this.baller[i].x >= this.padde.paddeDiv.offsetLeft && this.baller[i].x <= this.padde.paddeDiv.offsetLeft + this.padde.paddeDiv.offsetWidth) {
            //Endre retning og legger til ny ball siden padden er truffet
            this.baller[i].speedY = -this.baller[i].speedY;
            this.leggTilBall();
            } else if (this.baller[i].x + this.baller[i].ballDiv.offsetWidth >= this.bredde || this.baller[i].x <= 0) {
                //Endre retning på ballen når den treffer en av sidene
                this.baller[i].speedX = -this.baller[i].speedX;
            } else if (this.baller[i].y <= 0) {
                //Snu ballen når den treffer toppen
                this.baller[i].speedY = -this.baller[i].speedY;
            } else if (this.baller[i].y + this.baller[i].ballDiv.offsetHeight > this.hoyde) {
                //Spillet avsluttes siden en ball har gått utenfor kanten av spillet
                clearInterval(this.intervallID);
                document.getElementById("melding").innerHTML = "Du klarte " + this.baller.length + " baller";
            }   
           this.baller[i].ballDiv.style.left = this.baller[i].x +"px";
           this.baller[i].ballDiv.style.top = this.baller[i].y +"px";
            
        }
    }
    leggTilBall() {
        // Lar ballen komme ut fra ulike steder
        let x = Math.floor(Math.random() * (400-100)+100);
        let y = Math.floor(Math.random() * (300-100)+100);
        this.baller.push(new Ball(x,y));
    }

}

class Padde {
    flytteLengde;
    paddeDiv;

    constructor() {
        this.flytteLengde = 50;
        this.paddeDiv = document.getElementById("padde");
        this.initiering();
	
	}
	initiering() {
		if(paddeAktiv==false) {
			document.addEventListener("keydown", this.flyttPadde.bind(this));
			paddeAktiv= true;
		}
	}

    flyttPadde(e) {
        switch (e.key) {
            case "ArrowLeft":
                if(this.paddeDiv.offsetLeft > 0)
                    this.paddeDiv.style.left = this.paddeDiv.offsetLeft - this.flytteLengde + "px";
                break;
            case "ArrowRight":
                if(this.paddeDiv.offsetLeft + 100 < spill.bredde)
                    this.paddeDiv.style.left = this.paddeDiv.offsetLeft + this.flytteLengde + "px";
                break;
            default:
                break;
        }
    }
}


class Ball {
    x;
    y;
    speedX;
    speedY;
    ballDiv;

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speedX = 5;
        this.speedY = 5;
        this.ballDiv = document.createElement("div");
        this.ballDiv.className = "ball";
        this.ballDiv.style.backgroundColor = this.lagTilfeldigFarge();
        this.ballDiv.style.top = this.y + "px";
        this.ballDiv.style.left = this.x+ "px";
        spill.spillbrettDiv.appendChild(this.ballDiv);
    }

    lagTilfeldigFarge() {
        let min = 50; // Minimumsverdi for hver fargekanal slik at fargen ikke blir svart nyanse (eller helt hvit)
        let red = Math.floor(Math.random() * (255-min) +min);
        let green = Math.floor(Math.random() * (255-min) +min);
        let blue = Math.floor(Math.random() * (255-min) +min);

        return "rgb("+red+","+green + ","+ blue+")";
    }
}

function startSpill() {
    let vanskelighetsgrad = 30;
    spill = new Spill(vanskelighetsgrad);
   
    spill.start();
}

var spill;
var paddeAktiv = false;
document.getElementById("btnStart").addEventListener("click",startSpill);
