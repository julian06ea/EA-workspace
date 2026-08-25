var kursTab = [];
var postnr = 0;

class Kurs {
    constructor(landkode, kursen, faktor){
        this.landkode = landkode;
        this.kursen = kursen;
        this.faktor = faktor;
    }
}
function fyllKursTab() {
    kursTab = JSON.parse(localStorage.getItem("Kursfil24"));
    if(kursTab == null)
        kursTab = [];
}
function fyllSelect() {
    var selLand = document.getElementById("selLand");
    while(selLand.options.length > 0)
        selLand.remove(0);

    for (let i = 0; i < kursTab.length; i++) {
        var nyOpt = document.createElement("option");
        nyOpt.text = kursTab[i].landkode;
        selLand.add(nyOpt);  
    }
}
function body_onload() {
    fyllKursTab();
    fyllSelect();
    btnForrige_onclick();
}
function btnLagre_onclick() {
      
    var landkode = document.getElementById("landkode").value;
    var kursen = document.getElementById("kurs").valueAsNumber;
    var faktor = document.getElementById("faktor").valueAsNumber;
    
    if(postnr == kursTab.length) {
      kursTab.push(new Kurs(landkode, kursen, faktor));
      fyllSelect();
    }
    else {
      kursTab[postnr].landkode = landkode;
      kursTab[postnr].kursen = kursen;
      kursTab[postnr].faktor = faktor;
    }
    visLokasjon();
    //lagrer endringen eller den nye posten på filen
    localStorage.setItem("Kursfil24", JSON.stringify(kursTab));
  }
  function btnNy_onclick() {
    document.getElementById("landkode").value = "";
    document.getElementById("kurs").value = "";
    document.getElementById("faktor").value = "";
    document.getElementById("melding").innerHTML = "";
    document.getElementById("landkode").focus();

    postnr = kursTab.length;
  }
  function visLokasjon() {
    document.getElementById("sLokasjon").innerHTML = "Post " + (postnr + 1) + " av " + kursTab.length;
  }
  function btnForrige_onclick() {
    if(postnr >0) {
      postnr -=1;
    }
    document.getElementById("landkode").value = kursTab[postnr].landkode;
    document.getElementById("kurs").value = kursTab[postnr].kursen;
    document.getElementById("faktor").value = kursTab[postnr].faktor;
    visLokasjon();
    
  }
  function btnNeste_onclick() {
    if(postnr < kursTab.length) {
      postnr +=1;
      document.getElementById("landkode").value = kursTab[postnr].landkode;
      document.getElementById("kurs").value = kursTab[postnr].kursen;
      document.getElementById("faktor").value = kursTab[postnr].faktor;
      visLokasjon();
    }
  }
function btnBeregn_onclick() {
    var nok = document.getElementById("norskeKr").valueAsNumber;
    var indeks = document.getElementById("selLand").selectedIndex;

    var valuta = nok /kursTab[indeks].kursen * kursTab[indeks].faktor;
    document.getElementById("melding").innerHTML = "Valutabeløpet blir "+valuta.toFixed(2);
}