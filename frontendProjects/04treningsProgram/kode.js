class Treningsokt {
    constructor(dato, sett, repetisjoner, motstand, ovelse) {
        this.dato = dato;
        this.sett = sett;
        this.repetisjoner = repetisjoner;
        this.motstand = motstand;
        this.ovelse = ovelse;
    }
}

function fyllSelect(muskelgruppeID) {
    document.getElementById("pMelding").innerHTML ="";
    var html ="";
    switch (muskelgruppeID) {
        case 0:
            html += "<option>Bicepscurl med stang</option><option>Fransk press</option>";
            break;
        case 1:
            html += "<option>Stående militærpress</option><option>Sidehev</option>";
            break;
        case 2:
            html += "<option>Knebøy</option><option>Leg extension</option><option>Leg curl</option>";
            break;
        case 3:
            html += "<option>Nedtrekk</option><option>Roing</option>";
            break;
        case 4:
            html += "<option>Benkpress</option><option>Flies</option><option>Push up</option>";
            break;     
    }
    document.getElementById("Ovelser").innerHTML = html;
}

function visOvelse() {
    var mg = document.getElementById("Muskelgruppe");
    //var value = mg.options[mg.selectedIndex].value;
    var muskelgruppe = mg.options[mg.selectedIndex].text;

    var o = document.getElementById("Ovelser");
    var ovelseNavn = o.options[o.selectedIndex].text;
    document.getElementById("pMelding").innerHTML="Du valgte øvelsen " + ovelseNavn + " for  muskelgruppen " + muskelgruppe;
}

function fyllTreningsTab() {
    treningsTab = JSON.parse(localStorage.getItem("Trening"));
    if (treningsTab==null)
        treningsTab = [];
    visOversikt();
}

function btnRegistrer_onclick() {
    settNr++;
    var muskelgruppe = document.getElementById("Muskelgruppe").selectedIndex.value;
    treningsTab.push(new Treningsokt(new Date().toISOString().slice(0, 10), settNr, document.getElementById("antRep").valueAsNumber,document.getElementById("Motstand").valueAsNumber,document.getElementById("Ovelser").value, muskelgruppe));
    localStorage.setItem("Trening",JSON.stringify(treningsTab));
    visOversikt();
}

function visOversikt() {
    var treningsvolum=0;
    var html="<table id='tab'><th>Dato</th><th>Sett</th><th>Repetisjoner</th><th>Motstand</th><th>Øvelse</th>";

    for (let i = 0; i < treningsTab.length; i++) {
        html+="<tr><td>" + treningsTab[i].dato + "</td><td>"+ treningsTab[i].sett + ". sett</td><td>"+treningsTab[i].repetisjoner + "</td><td>"+ treningsTab[i].motstand + "</td><td>"+ treningsTab[i].ovelse + "</td></tr>";
        treningsvolum+= treningsTab[i].repetisjoner * treningsTab[i].motstand;
    }
    html+="</table>";
    html+="<p>Treningsvolum: " + treningsvolum + " kg</p>";

    document.getElementById("utskrift").innerHTML = html;
}

var settNr = 0;
var treningsTab = [];

fyllTreningsTab();
fyllSelect(0);  