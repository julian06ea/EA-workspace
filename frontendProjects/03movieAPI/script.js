class Film {
    constructor(id, tittel, beskrivelse) {
        this.id = id;
        this.tittel = tittel;
        this.beskrivelse = beskrivelse;
    }

    lagElement(leggTilFavorittCallback) {
        const div = document.createElement('div');
        div.className = 'film';
        div.innerHTML = `<h3>${this.tittel}</h3><p>${this.beskrivelse}</p>`;
        const knapp = document.createElement('button');
        knapp.textContent = 'Legg til favoritt';
        knapp.onclick = () => leggTilFavorittCallback(this);
        div.appendChild(knapp);
        return div;
    }

    lagFavorittElement(fjernFavorittCallback) {
        const div = document.createElement('div');
        div.className = 'favoritt';
        div.innerHTML = `<h4>${this.tittel}</h4>`;
        const knapp = document.createElement('button');
        knapp.textContent = 'Fjern';
        knapp.onclick = () => fjernFavorittCallback(this);
        div.appendChild(knapp);
        return div;
    }
}

class FilmApp {
    constructor() {
        this.filmer = [];
        this.favoritter = [];
        this.lesFavoritterFraLagring();
    }

    async lastFilmer() {
        const response = await fetch('data.json');
        const data = await response.json();
        this.filmer = data.map(f => new Film(f.id, f.tittel, f.beskrivelse));
        this.visFilmer();
    }

    visFilmer() {
        const liste = document.getElementById('film-liste');
        liste.innerHTML = '';
        this.filmer.forEach(film => {
            liste.appendChild(film.lagElement(film => this.leggTilFavoritt(film)));
        });
    }

    visFavoritter() {
        const favDiv = document.getElementById('favoritter');
        favDiv.innerHTML = '';
        this.favoritter.forEach(film => {
            favDiv.appendChild(film.lagFavorittElement(film => this.fjernFavoritt(film)));
        });
    }

    leggTilFavoritt(film) {
        if (!this.favoritter.find(f => f.id === film.id)) {
            this.favoritter.push(film);
            this.lagreFavoritter();
            this.visFavoritter();
        }
    }

    fjernFavoritt(film) {
        this.favoritter = this.favoritter.filter(f => f.id !== film.id);
        this.lagreFavoritter();
        this.visFavoritter();
    }

    lagreFavoritter() {
        localStorage.setItem('favoritter', JSON.stringify(this.favoritter));
    }

    lesFavoritterFraLagring() {
        const lagrede = localStorage.getItem('favoritter');
        if (lagrede) {
            const data = JSON.parse(lagrede);
            this.favoritter = data.map(f => new Film(f.id, f.tittel, f.beskrivelse));
            this.visFavoritter();
        }
    }
}

const app = new FilmApp();

document.getElementById('last-filmer').addEventListener('click', () => {
    app.lastFilmer();
});
