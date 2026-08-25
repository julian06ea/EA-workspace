class Vaerdata {
    constructor(by) {
        this.by = by;
        this.temperatur = null;
        this.beskrivelse = null;
    }

    async hentVaer() {
        const url = "https://api.open-meteo.com/v1/forecast?latitude=60.39&longitude=5.32&current_weather=true";
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                this.temperatur = data.current_weather.temperature;
                this.beskrivelse = data.current_weather.weathercode;
            } else {
                console.error("Feil ved henting av værdata");
            }
        } catch (error) {
            console.error("Nettverksfeil:", error);
        }
    }

    visVaer() {
        const weatherInfo = document.getElementById('weather-info');
        if (this.temperatur !== null) {
            weatherInfo.textContent = `I ${this.by} er det ${this.temperatur}°C. Værkode: ${this.beskrivelse}.`;
        } else {
            weatherInfo.textContent = "Ingen værdata tilgjengelig.";
        }
    }
}

const bergenVaer = new Vaerdata("Bergen");
bergenVaer.hentVaer().then(() => bergenVaer.visVaer());
