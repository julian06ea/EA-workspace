
class Lag {
  constructor(lagID, navn) {
    this.lagID = lagID;
    this.navn = navn;
    this.antKamper = 0;
    this.antKamperVunnet = 0;
    this.antKamperUavgjort = 0;
    this.antKamperTapt = 0;
    this.egneMaal = 0;
    this.maalMot = 0;
    this.maalforskjell = 0;
    this.poengsum = 0;
  }
}
class Kamp {
  constructor(hjemmelagID, bortelagID, kampresultat) {
    this.hjemmelagID = hjemmelagID;
    this.bortelagID = bortelagID;
    this.kampresultat = kampresultat;
  }
}
var lagTab = [];
var kampTab = [];

async function fyllLagTab() {
  let response = await fetch("SerielagV3.csv");
  var tekst = await response.text();
  var linje = tekst.split("\n");
  for (var i = 0; i < linje.length; i++) {
    var felt = linje[i].split(";");
    lagTab.push(new Lag(felt[0], felt[1]));
  }
  fyllSelectBokser();
  fyllKampTab();
}
function fyllSelectBokser() {
  var html = "";
  for (var i = 0; i < lagTab.length; i++) {
    html +="<option value='" + lagTab[i].lagID + "'>" + lagTab[i].navn + "</option>";
  }
  document.getElementById("hjemme").innerHTML = html;
  document.getElementById("borte").innerHTML = html;
}
function fyllKampTab() {
  kampTab = JSON.parse(localStorage.getItem("KampFil"));
  if (kampTab == null) 
    kampTab = [];
  visKampresultater();
}
function btnLagreKamp_onclick() {
  var h = document.getElementById("hjemme");
  var hID = h.options[h.selectedIndex].value;
  //var hjemmelag = h.options[h.selectedIndex].text;
  var b = document.getElementById("borte");
  var bID = b.options[b.selectedIndex].value;
  //var bortelag = b.options[b.selectedIndex].text;

  var funnet = false;
  for (var i = 0; i < kampTab.length; i++) {
    if (kampTab[i].hjemmelagID == hID && kampTab[i].bortelagID == bID) {
      funnet = true;
      break;
    }
  }
  if (funnet) {
    alert("Denne valgte kampen er allerede avholdt.");
    melding = "";
  } else {
    var kampresultat = document.getElementById("kampresultat").value;
    kampTab.push(new Kamp(hID, bID, kampresultat));
    localStorage.setItem("KampFil", JSON.stringify(kampTab));
    visKampresultater();
  }
}

function visKampresultater() {
  var html =
    "<tr><th>Hjemmelag</th><th>Bortelag</th><th>Kampresultat</th></tr>";
  for (var i = 0; i < kampTab.length; i++) {
    html +=`<tr><td>${hentNavn(kampTab[i].hjemmelagID)}</td><td>${hentNavn(kampTab[i].bortelagID)}</td><td>${kampTab[i].kampresultat}</td></tr>`;
  }
  document.getElementById("melding").innerHTML = html;
}

function visTabelloversikt() {
  //Nullstiller først akkumulatorene
  for (let i = 0; i < lagTab.length; i++) {
    lagTab[i].antKamper = 0;
    lagTab[i].antKamperVunnet = 0;
    lagTab[i].antKamperUavgjort = 0;
    lagTab[i].antKamperTapt = 0;
    lagTab[i].egneMaal = 0;
    lagTab[i].maalMot = 0;
    lagTab[i].maalforskjell = 0;
    lagTab[i].poengsum = 0;
  }

  for (let i = 0; i < kampTab.length; i++) {
    //Hjemmekamper blir da i index 0 og bortekamp i 1 ved split.
    let kamp = kampTab[i].kampresultat.split('-');
    let hjemmeSeier = parseInt(kamp[0]);
    let borteSeier = parseInt(kamp[1]);
  
    //legger inn summeringer for hvert av lagene
    let hLok = finnLag(kampTab[i].hjemmelagID);
    let bLok = finnLag(kampTab[i].bortelagID);
    lagTab[hLok].antKamper +=1;
    lagTab[bLok].antKamper +=1;
    lagTab[hLok].egneMaal +=hjemmeSeier;
    lagTab[bLok].egneMaal +=borteSeier;
    lagTab[hLok].maalMot +=borteSeier;
    lagTab[bLok].maalMot +=hjemmeSeier;

    if (hjemmeSeier > borteSeier) {  //Hjemmeseier
      lagTab[hLok].antKamperVunnet +=1;
      lagTab[bLok].antKamperTapt +=1;
      lagTab[hLok].poengsum +=3;
    }
    else if(hjemmeSeier< borteSeier) { //Borteseier
      lagTab[bLok].antKamperVunnet +=1;
      lagTab[hLok].antKamperTapt +=1;
      lagTab[bLok].poengsum +=3;
    }
    else { //Uavgjort
      lagTab[hLok].antKamperUavgjort +=1;
      lagTab[bLok].antKamperUavgjort +=1;
      lagTab[hLok].poengsum +=1;
      lagTab[bLok].poengsum +=1;
    }
  }
  lagTab = Utils.sorterPoster(lagTab,'poengsum','desc')
  let html ="<tr><th>Lag</th><th title='Antall kamper spilt'>Kamper</th><th  title='Antall kamper vunnet'>Vunnet</th><th  title='Antall kamper spilt uavgjort'>Uavgjort</th><th  title='Antall kamper tapt'>Tapt</th><th  title='Antall mål skåret'>Egne mål</th><th  title='Antall mål tatt av bortelag'>Mot</th><th  title='Malforskjell'>Målforskjell</th><th title='Antall poeng'>Poeng</th></tr>";
  for (let i = 0; i < lagTab.length; i++) {
    html +=`<tr><td>${lagTab[i].navn}</td><td>${lagTab[i].antKamper}</td><td>${lagTab[i].antKamperVunnet}</td><td>${lagTab[i].antKamperUavgjort}</td><td>${lagTab[i].antKamperTapt}</td><td>${lagTab[i].egneMaal}</td><td>${lagTab[i].maalMot}</td><td>${lagTab[i].egneMaal - lagTab[i].maalMot}</td><td>${lagTab[i].poengsum}</td></tr>`;   
  }
  document.getElementById("melding").innerHTML = html;
}

function finnLag(lagID) {
  for (let i = 0; i < lagTab.length; i++) {
    if(lagTab[i].lagID == lagID)
      return i;
  }
}
function hentNavn(id) {
  for (let i = 0; i < lagTab.length; i++) {
    if(lagTab[i].lagID == id)
      return lagTab[i].navn
  }
}

fyllLagTab();

class Utils {
  static sorterPoster(tab, felt, order) {
    return tab.sort((a, b) => {
      if (order === "asc") {
        if (a[felt] < b[felt]) {
          //merk [] når tekstfelt skal brukes
          return -1;
        }
        if (a[felt] > b[felt]) {
          return 1;
        }
        return 0;
      }
      if (order === "desc") {
        if (a[felt] > b[felt]) {
          return -1;
        }
        if (a[felt] < b[felt]) {
          return 1;
        }
        return 0;
      }
    });
  }
}
