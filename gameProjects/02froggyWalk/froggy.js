class Spill {
    constructor() {
        this.container = document.getElementById("spill");
        this.frosk = null;   //objekt
        this.bilTab = [];    //Liste med Bil-objekter
        this.innsekt = null; //objekt
        this.intervallId = null;
        this.poeng = 0;
        this.initialisering();
    }

    initialisering() {
        document.getElementById("melding").innerHTML = "";

        this.insekt = new Innsekt();
        this.frosk = new Frosk(this);
        this.startBiler();

        if (this.intervalId) 
            clearInterval(this.intervalId);
        this.intervalId = setInterval(this.sjekkKollisjon.bind(this), 10);
    }
    startBiler() {
        var fart;
        this.bilTab = [];
        for (let i = 1; i <= 5; i++) {
            fart = Math.floor(Math.random() * 3) + 1;
            this.bilTab.push(new Bil(i, fart));
        }
    }
    sjekkKollisjon() {
        const froskRect = this.frosk.froskBilde.getBoundingClientRect();
        for (let bil of this.bilTab) {
            if (bil.sjekkKolisjonMed(froskRect)) {
                this.ferdig();
                return;
            }
        }
        this.flyttBilene();
    }
    flyttBilene() {
         // this.bilTab.forEach(bil => bil.flytt());
        for (let bil of this.bilTab) {
            bil.flytt();
        }
    }
    ferdig() {
        clearInterval(this.intervalId);
        this.intervalId = null;
        document.getElementById("melding").innerHTML = `Game over – du klarte ${this.poeng} poeng!`;
        spill.frosk = null;
    }
}

class Frosk {
    constructor(spill) {
        this.spill = spill;
        this.hopplengde = 54;
        this.over = false;
        this.froskBilde =  document.getElementById("frosk");
        this.initialisering();
    }

    initialisering() {
        this.froskBilde.style.top = "460px";
        this.froskBilde.src = "media/froskOpp.gif";
    }
    flyttFroskVedTastetrykk(e) {
        const fb = this.froskBilde;
        switch (e.key) {
            case "ArrowUp":
                if (fb.offsetTop > 170) {
                    this.over = false;
                    fb.src = "media/froskOpp.gif";
                    fb.style.top = fb.offsetTop - this.hopplengde + "px";
                }
                if (fb.offsetTop < 170 && !this.over) {
                    this.over = true;
                    this.spill.poeng++;
                    this.spill.insekt.plasserInnsekt(460);
                    fb.style.top = "127px";
                }
                break;
            case "ArrowDown":
                if (fb.offsetTop < 450) {
                    this.over = false;
                    fb.src = "media/froskNed.gif";
                    fb.style.top = fb.offsetTop + this.hopplengde + "px";
                }
                if (fb.offsetTop > 450 && !this.over && spill.insekt.bilde.offsetTop==460) {
                    this.over = true;
                    this.spill.poeng++;
                    this.spill.insekt.plasserInnsekt(120);
                    fb.style.top = "460px";
                    this.spill.startBiler(); // For variasjon
                }
                break;
        }
    }
}

class Bil {
    constructor(bilNr, fart) {
        this.bilNr = bilNr;
        this.fart = fart;
        this.bilBilde = document.getElementById("bil" + this.bilNr);;
        this.initialisering();
    }
    initialisering() {
        this.bilBilde.style.left = "460px";
    }
    flytt() {
         const bil = this.bilBilde.offsetLeft;
         if(bil <= -60) {
            this.bilBilde.style.left = "430px";
         } else {
            this.bilBilde.style.left = bil - this.fart + "px";
         }
    }
    sjekkKolisjonMed(froskRect) {
        const car = this.bilBilde.getBoundingClientRect();
        if (froskRect.right > car.left && froskRect.left < car.right &&
            froskRect.bottom > car.top && froskRect.top < car.bottom) {
            return true;
        }
        else {
            return false;
        }    
    }
}

class Innsekt {
    constructor() {
        this.bilde = document.getElementById("insekt");
        this.initialisering();
    }

    initialisering() {
        this.bilde.style.top = "120px";
    }
    plasserInnsekt(yPos) {
        this.bilde.style.top = yPos+"px";
    }
}

let spill = null;

function startSpill() {
    spill = new Spill();
    //spill.initialisering();
}

document.getElementById("btnStart").addEventListener("click", startSpill);

document.addEventListener("keydown", function(e) {
    if (spill && spill.frosk) {
        spill.frosk.flyttFroskVedTastetrykk(e);
    }
});