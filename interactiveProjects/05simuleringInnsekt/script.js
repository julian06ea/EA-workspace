class Celle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.mat = false;
    this.insekt = null;
  }

  erTom() {
    if (this.mat === false && this.insekt === null) {
      return true;
    } else {
      return false;
    }
  }

  fjernMat() {
    this.mat = false;
  }
}

class Innsekt {
  constructor(celle) {
    this.energi = 5;
    this.celle = celle;
  }

  flyttTil(nyCelle) {
    this.celle.insekt = null;
    nyCelle.insekt = this;
    this.celle = nyCelle;
  }

  oppdater(naboer) {
    const tilgjengeligeCeller = [];

    for (let i = 0; i < naboer.length; i++) {
      const celle = naboer[i];
      if (celle.insekt === null) {
        tilgjengeligeCeller.push(celle);
      }
    }

    if (tilgjengeligeCeller.length === 0) {
      return true;
    }

    const nyCelle =
      tilgjengeligeCeller[
        Math.floor(Math.random() * tilgjengeligeCeller.length)
      ];
    this.flyttTil(nyCelle);

    if (nyCelle.mat) {
      this.energi = Math.min(10, this.energi + 2);
      nyCelle.fjernMat();
    } else {
      this.energi--;
    }

    if (this.energi <= 0) {
      nyCelle.insekt = null;
      return false;
    }
    return true;
  }
}

class Spill {
  constructor() {
    this.brett = [];
    this.insekter = [];
    this.start();
  }

  start() {
    this.lagBrett();
    this.leggTilInsekter(5);
    this.leggTilMat(10);
    this.kjorRunde();
  }

  lagBrett() {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        this.brett.push(new Celle(x, y));
      }
    }
  }

  hentCelle(x, y) {
    for (let i = 0; i < this.brett.length; i++) {
      const celle = this.brett[i];
      if (celle.x === x && celle.y === y) {
        return celle;
      }
    }
  }

  sjekkNaboer(x, y) {
    const naboer = [];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) {
          continue;
        }

        const naboX = x + dx;
        const naboY = y + dy;

        if (naboX >= 0 && naboX < 10 && naboY >= 0 && naboY < 10) {
          const naboCelle = this.hentCelle(naboX, naboY);
          naboer.push(naboCelle);
        }
      }
    }

    return naboer;
  }

  leggTilInsekter(antall) {
    let tommeCeller = [];

    for (let i = 0; i < this.brett.length; i++) {
      let celle = this.brett[i];
      if (celle.erTom()) {
        tommeCeller.push(celle);
      }
    }

    for (let i = 0; i < antall && tommeCeller.length > 0; i++) {
      const index = Math.floor(Math.random() * tommeCeller.length);

      const celle = tommeCeller[index];
      tommeCeller.splice(index, 1);
      this.insekter.push(new Innsekt(celle));
    }
  }

  leggTilMat(antall) {
    let tommeCeller = [];

    for (let i = 0; i < this.brett.length; i++) {
      let celle = this.brett[i];
      if (celle.erTom()) {
        tommeCeller.push(celle);
      }
    }

    for (let i = 0; i < antall && tommeCeller.length > 0; i++) {
      const index = Math.floor(Math.random() * tommeCeller.length);
      tommeCeller.splice(index, 1)[0].mat = true;
    }
  }

  tegnBrett() {
    const brettDiv = document.getElementById("spillbrett");
    brettDiv.innerHTML = "";
    for (let i = 0; i < this.brett.length; i++) {
      const celle = this.brett[i];
      const celleDiv = document.createElement("div");
      celleDiv.className = "celle";

      if (celle.insekt) {
        celleDiv.innerHTML = "&#128030;";
      } else if (celle.mat) {
        celleDiv.innerHTML = "&#127807;";
      }

      brettDiv.appendChild(celleDiv);
    }
  }

  kjorRunde() {
    if (this.insekter.length === 0) {
      document.getElementById("melding").innerHTML = "Alle innsektene er døde!";
      return;
    }

    const nyeInsekter = [];

    for (let i = 0; i < this.insekter.length; i++) {
      const insekt = this.insekter[i];
      const naboer = this.sjekkNaboer(insekt.celle.x, insekt.celle.y);

      if (insekt.oppdater(naboer)) {
        nyeInsekter.push(insekt);
      }
    }

    this.insekter = nyeInsekter;

    this.leggTilMat(2); //Å legge til 5 nye matbiter per runde var litt mye og spillet ville ikke stoppe da
    this.tegnBrett();

    setTimeout(() => this.kjorRunde(), 1000); //går til neste runde etter 1000 millisekunder (1 sekund) automatisk
  }
}

window.onload = () => {
  new Spill();
};
