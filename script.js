// HTML und CSS werden vor Java Script geladen, damit keine Fehler passieren indem JS sachen lesen will, die es noch nicht gibt.
document.addEventListener('DOMContentLoaded', function () {

    // --- GESCHÄFTSLOGIK & REGELN ---
    const BASE_PRICE = 60; // 60€ Grundpreis

    // Tarifgruppen-Aufschläge
    const SURCHARGE_CHILD = 25;   // "Ich und Kind/er"
    const SURCHARGE_COUPLE = 20;  // "Paar ohne Kind/er"
    const SURCHARGE_FAMILY = 40;  // "Familie"

    // Alters-Regeln
    const MIN_AGE = 18;          // Mindestalter
    const MIN_BIRTH_YEAR_TO_ACCEPT = 1909; // Aktuell älteste lebende Person
    const MAX_AGE = 116;         // Maximales Alter dato 2025
    const RISK_AGE_LIMIT = 25;   // Grenze für Risiko-Aufschlag
    const RISK_FACTOR_U25 = 1.2; // 20% Aufschlag

    // PLZ-Aufschläge
    const SURCHARGE_BERLIN = 15; // Aufschlag Berlin
    const SURCHARGE_MUNICH = 17; // Aufschlag München
    const SURCHARGE_COLOGNE = 16; // Aufschlag Köln

    // PLZ-Arrays 
    const ZIP_BERLIN = ['10', '11', '12', '13', '14'];
    const ZIP_MUNICH = ['80', '81'];
    const ZIP_COLOGNE = ['50', '51'];

    // Rabatte
    const DISCOUNT_JOB = 0.9;    // 10% Rabatt (Öffentl. Dienst)
    const DISCOUNT_NO_DAMAGE = 0.85; // 15% Rabatt (Schadenfrei)

    // --- ENDE REGELN ---

    // --- Globale Variable für den aktuellen Preis ---
    let currentPrice = 0; 

    // -- Elemente finden und Event-Listeners --

    // Button und Hörer um die Kalkulation zu starten
    const btnCalculate = document.getElementById('bStart');
    btnCalculate.addEventListener('click', calculate);
    // Button und Hörer um die Kalkulation zu reseten
    const btnReset = document.getElementById('bReset'); 
    btnReset.addEventListener('click', reset);
    // Button und Hörer um den Preis pro Monat anzuzeigen
    const btnMonthly = document.getElementById('bMonthly');
    btnMonthly.addEventListener('click',showMonthly)
    // Ergebnissbereich
    const resultBox = document.getElementById('result');

    // Lesen von Selectoren und Inputs
    const birthDaySelect = document.getElementById('birthDay');
    const birthMonthSelect = document.getElementById('birthMonth');
    const birthYearSelect = document.getElementById('birthYear');
    const postInput = document.getElementById('postcode');
    const cityInput = document.getElementById('city');

    // Verhinderung das Buchstaben in die PLZ eingetragen werden können
    postInput.addEventListener('input', () => postInput.value = postInput.value.replace(/[^0-9]/g, ''));

    // Namen der Radio-Gruppen (für einfaches Speichern/Laden)
    const radioGroupNames = ['a1', 'jobStatus', 'damageStatus'];

    // --- 2. EVENT LISTENERS ZUM SPEICHERN (localStorage) ---

    // Textfelder speichern (Input ließt jede Veränderung)
    birthDaySelect.addEventListener('input', () => localStorage.setItem('userDaySelect',birthDaySelect.value));
    birthMonthSelect.addEventListener('input', () => localStorage.setItem('userMonthSelect',birthMonthSelect.value));
    birthYearSelect.addEventListener('input', () => localStorage.setItem('userYearSelect',birthYearSelect.value));
    postInput.addEventListener('input', () => localStorage.setItem('userPostcode', postInput.value));
    cityInput.addEventListener('input', () => localStorage.setItem('userCity', cityInput.value));

    // Radio-Buttons speichern
    function saveRadioSelection(event) {
        if (event.target.checked) {
            // Speichert den WERT (z.B. "yes") unter dem NAMEN der Gruppe (z.B. "jobStatus")
            localStorage.setItem(event.target.name, event.target.value);
        }
    }
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', saveRadioSelection);
    });

    // --- 4. DATEN LADEN FUNKTION (localStorage) ---
    function loadSavedData() {
        // Lade Textfelder
        // (Das '|| '' ' ist ein "Fallback": Nimm das Gespeicherte ODER (||) einen leeren String)
        birthDaySelect.value = localStorage.getItem('userDaySelect') || '';
        birthMonthSelect.value = localStorage.getItem('userMonthSelect') || '';
        birthYearSelect.value = localStorage.getItem('userYearSelect') || '';
        postInput.value = localStorage.getItem('userPostcode') || '';
        cityInput.value = localStorage.getItem('userCity') || '';

        // Lade Radio-Buttons
        radioGroupNames.forEach(groupName => {
            const savedValue = localStorage.getItem(groupName); // z.B. Lade den Wert für "jobStatus"
            if (savedValue) { // z.B. "yes"
                // Finde den Button, der diesen Namen UND diesen Wert hat
                const radioToSelect = document.querySelector(`input[name="${groupName}"][value="${savedValue}"]`);
                if (radioToSelect) {
                    radioToSelect.checked = true; // Hake ihn an
                }
            }
        });
    }

    // --- 5. LADE-FUNKTION AUFRUFEN ---
    // Rufe die Funktion EINMAL beim Start auf
    loadSavedData();

    // --- Funktion zur generierung der Datums Optionen ---
    function populateDateDropdowns(){

        for (let i = 1; i <= 31; i++){
            const dayOptions = document.createElement('option');
            dayOptions.value = i;
            dayOptions.textContent = i;
            birthDaySelect.appendChild(dayOptions)
        };

        for (let i = 1; i <= 12; i++){
            const monthOptions = document.createElement('option');
            monthOptions.value = i;
            monthOptions.textContent = i;
            birthMonthSelect.appendChild(monthOptions)
        };

        const currentYear = new Date().getFullYear();
        const startYear = currentYear - MIN_AGE;
        
        
        for (let i = startYear; i >= MIN_BIRTH_YEAR_TO_ACCEPT; i--){
            const yearOptions = document.createElement('option');
            yearOptions.value = i;
            yearOptions.textContent = i;
            birthYearSelect.appendChild(yearOptions)
        };
    };
    populateDateDropdowns();

    // --- 6. HAUPT-FUNKTIONEN ---

    // Funktion zur Berechnung
    function calculate() {

        let basicPrice = BASE_PRICE; // Das ist unser Grundpreis für die Versicherung

        // Tarifgruppe
        const whoChecked = document.querySelector('input[name="a1"]:checked'); // Die radio Buttons werden gelesen

        if (!whoChecked) { // Die Berechnung wird gestoppt, wenn keine Tariffgruppe ausgewäht wurde
            resultBox.innerHTML = `<p class="error-text">Bitte wähle Sie aus, <strong>wer versichert</strong> werden soll!</p>`;
            resultBox.classList.add('is-visible');
            return;
        }
        const who = whoChecked.value; // Wir brauchen kein 'if (whoChecked)' mehr, da wir oben schon mit 'return' stoppen
        if (who === 'child') basicPrice += SURCHARGE_CHILD; // Aufschlag für ein Kind/er
        else if (who === 'couple') basicPrice += SURCHARGE_COUPLE; // Aufschlag für Partner
        else if (who === 'family') basicPrice += SURCHARGE_FAMILY; // Aufschlag für Partner mit Kind/er

        // Geburtsdatum Prüfung
        const birthValue = `${birthYearSelect.value}-${parseInt(birthMonthSelect.value) - 1}-${birthDaySelect.value}`;
      
        if (!birthDaySelect.value || !birthMonthSelect.value || !birthYearSelect.value) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie ihr <strong>Geburtsdatum</strong> ein!</p>`;
            resultBox.classList.add('is-visible');
            return; // Code wird beendet, wenn kein Geburtsdatum angegeben wird
        }

        const birthDate = new Date(birthValue); // Geburtsdatum
        const today = new Date(); // aktuelles Datum
        let age = today.getFullYear() - birthDate.getFullYear(); // Differens vom Datum
        const monthDiff = today.getMonth() - birthDate.getMonth(); // Differenz der Monate

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--; // Es wird ein Jahr abgezogen, wenn man im aktuellen Jahr noch keinen Geburtstag hatte
        };

        if (age > MAX_AGE) {
            resultBox.innerHTML = `<p class="error-text">Bitte melden Sie sich bei uns persöhnlich!</p>`;
            resultBox.classList.add('is-visible');
            return;
        }
        else if (age < RISK_AGE_LIMIT) {
            basicPrice *= RISK_FACTOR_U25;
        }; // Aufschlag von 20% für jüngere Leute...

        // Wohnort Prüfung
        const postValue = postInput.value;

        if (!postValue) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie ihre <strong>Postleitzahl</strong> ein!</p>`;
            resultBox.classList.add('is-visible');
            return; // Code wird beendet, wenn keine PLZ angegeben wird
        }

        if (ZIP_BERLIN.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_BERLIN; // Das Array wird auf die ersten zwei Ziffern gescannt...
        } else if (ZIP_MUNICH.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_MUNICH;
        } else if (ZIP_COLOGNE.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_COLOGNE;
        }

        // Öffentlicher Dienst Prüfung
        const jobChecked = document.querySelector('input[name="jobStatus"]:checked');

        if (!jobChecked) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie an, ob sie beim <strong>öffentlichen Dienst</strong> arbeiten!</p>`;
            resultBox.classList.add('is-visible');
            return;
        };

        if (jobChecked.value === 'yes') {
            basicPrice *= DISCOUNT_JOB;
        };

        // Schadensprüfung (5 Jahre)
        const damageChecked = document.querySelector('input[name="damageStatus"]:checked'); // Tippfehler "Cecked" behoben

        if (!damageChecked) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie an, ob sie die letzten 5 Jahre <strong>Schadensfrei</strong> waren!</p>`;
            resultBox.classList.add('is-visible');
            return;
        };
        if (damageChecked.value === 'yes') { // Logik-Fehler behoben (war "no")
            basicPrice *= DISCOUNT_NO_DAMAGE;
        };

        currentPrice = basicPrice;

        const resultText = "Ihre Haftpflichtversicherung kostet:";
        const Price = `${basicPrice.toFixed(2)}€ im Jahr`;
        resultBox.innerHTML = `
        <p class="result-text">${resultText}</p>
        <div class="result-price">${Price}</div>
        `;
        resultBox.classList.add('is-visible');
        btnMonthly.classList.remove('is-hidden');
        btnReset.classList.remove('is-hidden');
    };

    // --- Preis pro Monat Funktion ---
    function showMonthly (){
        const monthlyPrice = currentPrice / 12;
        const priceElement = document.querySelector('.result-price');

        if (priceElement) {

            priceElement.innerHTML = `${monthlyPrice.toFixed(2)}€ pro Monat`;
        }
    };

    // --- Reset Funktion ---
    function reset() {
        currentPrice = 0;
        birthDaySelect.value = '';
        birthMonthSelect.value = '';
        birthYearSelect.value = '';
        postInput.value = '';
        cityInput.value = '';

        const radioBtns = document.querySelectorAll('input[type="radio"]');
        radioBtns.forEach(radio => {
            radio.checked = false;
        });

        resultBox.innerHTML = '';
        resultBox.classList.remove('is-visible');
        btnMonthly.classList.add('is-hidden');
        localStorage.clear(); // Lösche alle gespeicherten Daten
    }
});