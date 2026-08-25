class Oppgave {
    constructor(tekst, ferdig) {
        this.oppgavetekst = tekst;
        this.ferdig = ferdig;
    }
}
class OppgaveHandling {
    constructor() {
        this.oppgaveTab =  [];
        this.klargjor();
    }

    async klargjor() {
        await this.fyllOppgaveTab()

        document.getElementById("btnLeggTil").addEventListener("click", this.LeggTil_onclick.bind(this));
       
        const buttons = document.querySelectorAll('.visHuskeliste');
        // Legg til en hendelse på hver knapp
        buttons.forEach(button => {
            button.addEventListener('click', (event) => {
                const param = event.target.dataset.param;
                this.visHuskeliste(param);
            });
        });
    }
    LeggTil_onclick() {
        var tekst = document.getElementById("oppgavetekst").value;
        document.getElementById("oppgavetekst").value = "";
        document.getElementById("oppgavetekst").focus();
        this.oppgaveTab.push(new Oppgave(tekst, false));
        this.oppdater();
    }
    
    async fyllOppgaveTab() {
        this.oppgaveTab = await JSON.parse(localStorage.getItem("Oppgaver"));
        if (this.oppgaveTab == null) 
            this.oppgaveTab = [];
        this.visHuskeliste(0);
    }
    visHuskeliste(filter) {
        var html = "";
        for (let i = 0; i < this.oppgaveTab.length; i++) {
            if (this.oppgaveTab[i].ferdig == true) {
                if (filter != 2)
                    html += `<li class="ferdig"><span>${this.oppgaveTab[i].oppgavetekst}</span><button onclick="oppgave.btnBekreft(${i})">&#10004;</button><button onclick="oppgave.btnSlett(${i})">&#10060;</button></li>`;
            } else {
                if (filter != 1)
                    html += `<li class="klar"><span>${this.oppgaveTab[i].oppgavetekst}</span><button onclick="oppgave.btnBekreft(${i})">&#10004;</button><button onclick="oppgave.btnSlett(${i})">&#10060;</button></li>`;
            }
        }
        document.getElementById("huskeListe").innerHTML = html;
    }
    btnBekreft(index) {
        this.oppgaveTab[index].ferdig = true;
        this.oppdater();
    }
    btnSlett(index) {
        this.oppgaveTab.splice(index, 1);
        this.oppdater();
    }
    oppdater() {
        localStorage.setItem("Oppgaver", JSON.stringify(this.oppgaveTab));
        this.visHuskeliste(0);
    }
}

const oppgave = new OppgaveHandling();
