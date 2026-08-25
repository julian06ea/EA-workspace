class GjettTall {
    #minsteTall;
    #storsteTall;
    #tilfeldigTall;
    #antForsok;
    constructor(minsteTall, storsteTall) {
        this.#minsteTall = minsteTall;
        this.#storsteTall = storsteTall;
        this.#tilfeldigTall = this.#lagTilfeldigTall();
        this.#antForsok = 0;
    }
    #lagTilfeldigTall () {
        //Fikset denne til å også bruke #minsteTall
        return Math.floor(Math.random() * (this.#storsteTall - this.#minsteTall + 1)) + this.#minsteTall;
    }
    sjekkTipp(spillerTipp) {
        this.#antForsok++;
        var melding;
        if(spillerTipp === this.#tilfeldigTall)
            melding = `Gratulerer! Du gjettet det rettet tallet ${this.#tilfeldigTall} på ${this.#antForsok} forsøk.`;
        else if (spillerTipp < this.#tilfeldigTall){
            melding = "For lavt! Prøv igjen.";
        }
        else {
            melding = "For høyt! Prøv igjen";
        }
        return melding;
    }
}

function btnBekreftValg_onclick() {
    var gjettelement = document.getElementById("gjettTall");
    var meldingsfelt = document.getElementById("melding");
    var gjett = gjettelement.valueAsNumber;
    if(!isNaN(gjett)) {
        var resultat = spill.sjekkTipp(gjett);
        meldingsfelt.innerHTML = resultat;
        if(resultat.includes("Gratulerer")) {
            document.getElementById("btnBekreft").style.display="none";
            document.getElementById("btnNy").style.display="block";
            document.getElementById("gjettTall").style.visibility = "hidden"; //burde også tatt bort ledeteksten
        }
    }
    else {
        meldingsfelt.innerHTML = "Vennligst oppgi et gyldig heltall";
    }
}
function btnNy_onclick() {
    document.getElementById("btnBekreft").style.display="block";
    document.getElementById("btnNy").style.display="none";
    document.getElementById("gjettTall").style.visibility = "visible";
    document.getElementById("melding").innerHTML = "";
    document.getElementById("gjettTall").value = "";  
    spill = new GjettTall(1,1000);
}
var spill = new GjettTall(1,100);