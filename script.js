// HTML und CSS werden vor JavaScript geladen, damit keine Fehler passieren,
// wenn JavaScript Elemente lesen will, die noch nicht im DOM existieren.
document.addEventListener('DOMContentLoaded', function () {

    // --- GESCHÄFTSLOGIK & REGELN ---
    const BASE_PRICE = 60; // 60€ Grundpreis

    // Tarifgruppen-Aufschläge
    const SURCHARGE_CHILD = 25;   // "Ich und Kind/er"
    const SURCHARGE_COUPLE = 20;  // "Paar ohne Kind/er"
    const SURCHARGE_FAMILY = 40;  // "Familie"

    // Alters-Regeln
    const MIN_AGE = 18;           // Mindestalter für Versicherung
    const MIN_BIRTH_YEAR_TO_ACCEPT = 1909; // Ältestes akzeptiertes Geburtsjahr (basierend auf der ältesten lebenden Person)
    const MAX_AGE = 116;          // Maximales Alter (Stand: 2025)
    const RISK_AGE_LIMIT = 25;    // Altersgrenze für Risiko-Aufschlag
    const RISK_FACTOR_U25 = 1.2;  // 20% Aufschlag für Personen unter 25

    // PLZ-Aufschläge
    const SURCHARGE_BERLIN = 15; // Aufschlag für Berlin
    const SURCHARGE_MUNICH = 17; // Aufschlag für München
    const SURCHARGE_COLOGNE = 16; // Aufschlag für Köln

    // PLZ-Arrays (erste zwei Ziffern)
    const ZIP_BERLIN = ['10', '11', '12', '13', '14'];
    const ZIP_MUNICH = ['80', '81'];
    const ZIP_COLOGNE = ['50', '51'];

    // Rabatte
    const DISCOUNT_JOB = 0.9;     // 10% Rabatt (Öffentlicher Dienst)
    const DISCOUNT_NO_DAMAGE = 0.85; // 15% Rabatt (5 Jahre schadenfrei)

    // --- ENDE REGELN ---

    // --- Globale Variablen ---
    let currentPrice = 0;
    let isMonthlyNow = false; // Zustand, ob der Preis aktuell pro Monat angezeigt wird

    // -- Elemente finden und Event-Listeners --

    // Button und Listener, um die Kalkulation zu starten
    const btnCalculate = document.getElementById('bStart');
    btnCalculate.addEventListener('click', calculate);
    // Button und Listener, um die Kalkulation zurückzusetzen
    const btnReset = document.getElementById('bReset');
    btnReset.addEventListener('click', reset);
    // Button und Listener, um den Preis pro Monat/Jahr anzuzeigen
    const btnMonthly = document.getElementById('bMonthly');
    btnMonthly.addEventListener('click', togglePriceView)
    // Ergebnisbereich
    const resultBox = document.getElementById('result');

    // Referenzen auf Select- und Input-Felder
    const birthDaySelect = document.getElementById('birthDay');
    const birthMonthSelect = document.getElementById('birthMonth');
    const birthYearSelect = document.getElementById('birthYear');
    const postInput = document.getElementById('postcode');
    const cityInput = document.getElementById('city');

    // Verhinderung, dass Buchstaben in die PLZ eingetragen werden können
    postInput.addEventListener('input', () => postInput.value = postInput.value.replace(/[^0-9]/g, ''));

    // Namen der Radio-Gruppen (für einfaches Speichern/Laden)
    const radioGroupNames = ['a1', 'jobStatus', 'damageStatus'];

    // --- 2. EVENT LISTENERS ZUM SPEICHERN (localStorage) ---

    // Select- und Textfelder speichern (liest jede Veränderung)
    // HINWEIS: Für Select-Felder ist 'change' oft zuverlässiger als 'input'
    birthDaySelect.addEventListener('change', () => localStorage.setItem('userDaySelect', birthDaySelect.value));
    birthMonthSelect.addEventListener('change', () => localStorage.setItem('userMonthSelect', birthMonthSelect.value));
    birthYearSelect.addEventListener('change', () => localStorage.setItem('userYearSelect', birthYearSelect.value));
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


    // --- Funktion zur Generierung der Datums-Optionen ---
    function populateDateDropdowns() {

        for (let i = 1; i <= 31; i++) {
            const dayOption = document.createElement('option'); // Variable umbenannt (Plural -> Singular)
            dayOption.value = i;
            dayOption.textContent = i;
            birthDaySelect.appendChild(dayOption); // Semikolon hinzugefügt
        };

        for (let i = 1; i <= 12; i++) {
            const monthOption = document.createElement('option'); // Variable umbenannt
            monthOption.value = i;
            monthOption.textContent = i;
            birthMonthSelect.appendChild(monthOption); // Semikolon hinzugefügt
        };

        const currentYear = new Date().getFullYear();
        const startYear = currentYear - MIN_AGE;


        for (let i = startYear; i >= MIN_BIRTH_YEAR_TO_ACCEPT; i--) {
            const yearOption = document.createElement('option'); // Variable umbenannt
            yearOption.value = i;
            yearOption.textContent = i;
            birthYearSelect.appendChild(yearOption); // Semikolon hinzugefügt
        };
    };

    populateDateDropdowns();


    // --- 4. DATEN LADEN FUNKTION (localStorage) ---
    function loadSavedData() {
        // Lade Text- und Select-Felder
        // (Das '|| '' ' ist ein "Fallback": Nimm den gespeicherten Wert ODER einen leeren String)
        birthDaySelect.value = localStorage.getItem('userDaySelect') || '';
        birthMonthSelect.value = localStorage.getItem('userMonthSelect') || '';
        birthYearSelect.value = localStorage.getItem('userYearSelect') || '';
        postInput.value = localStorage.getItem('userPostcode') || '';
        cityInput.value = localStorage.getItem('userCity') || '';

        // Lade Radio-Buttons
        radioGroupNames.forEach(groupName => {
            const savedValue = localStorage.getItem(groupName); // z.B. Lade den Wert für "jobStatus"
            if (savedValue) { // Wenn ein Wert gespeichert ist (z.B. "yes")
                // Finde den Radio-Button, der diesen Namen UND diesen Wert hat
                const radioToSelect = document.querySelector(`input[name="${groupName}"][value="${savedValue}"]`);
                if (radioToSelect) {
                    radioToSelect.checked = true; // Markiere ihn als ausgewählt
                }
            }
        });
    }

    loadSavedData();


    // --- 6. HAUPT-FUNKTIONEN ---

    // Funktion zur Berechnung
    function calculate() {

        let basicPrice = BASE_PRICE; // Das ist unser Grundpreis für die Versicherung

        // Tarifgruppe
        const whoChecked = document.querySelector('input[name="a1"]:checked'); // Der ausgewählte Radio-Button wird gelesen

        if (!whoChecked) { // Die Berechnung wird gestoppt, wenn keine Tarifgruppe ausgewählt wurde
            resultBox.innerHTML = `<p class="error-text">Bitte wählen Sie aus, <strong>wer versichert</strong> werden soll!</p>`;
            resultBox.classList.add('is-visible');
            return;
        }
        const who = whoChecked.value;
        if (who === 'child') basicPrice += SURCHARGE_CHILD; // Aufschlag für ein Kind/er
        else if (who === 'couple') basicPrice += SURCHARGE_COUPLE; // Aufschlag für Partner
        else if (who === 'family') basicPrice += SURCHARGE_FAMILY; // Aufschlag für Partner mit Kind/ern

        // Geburtsdatum Prüfung
        const birthValue = `${birthYearSelect.value}-${parseInt(birthMonthSelect.value) - 1}-${birthDaySelect.value}`;

        if (!birthDaySelect.value || !birthMonthSelect.value || !birthYearSelect.value) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie Ihr <strong>Geburtsdatum</strong> ein!</p>`;
            resultBox.classList.add('is-visible');
            return; // Code wird beendet, wenn kein Geburtsdatum angegeben wird
        }

        const birthDate = new Date(birthValue); // Geburtsdatum
        const today = new Date(); // Aktuelles Datum
        let age = today.getFullYear() - birthDate.getFullYear(); // Differenz der Jahre
        const monthDiff = today.getMonth() - birthDate.getMonth(); // Differenz der Monate

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--; // Es wird ein Jahr abgezogen, wenn der Geburtstag im aktuellen Jahr noch nicht war
        };

        if (age > MAX_AGE) {
            resultBox.innerHTML = `<p class="error-text">Bitte melden Sie sich bei uns <strong>persönlich</strong>!</p>`;
            resultBox.classList.add('is-visible');
            return;
        }
        else if (age < RISK_AGE_LIMIT) {
            basicPrice *= RISK_FACTOR_U25;
        }; // Aufschlag von 20% für jüngere Personen

        // Wohnort Prüfung
        const postValue = postInput.value;

        if (!postValue) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie Ihre <strong>Postleitzahl</strong> ein!</p>`;
            resultBox.classList.add('is-visible');
            return; // Code wird beendet, wenn keine PLZ angegeben wird
        }

        if (ZIP_BERLIN.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_BERLIN; // Das Array wird auf die ersten zwei Ziffern gescannt.
        } else if (ZIP_MUNICH.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_MUNICH;
        } else if (ZIP_COLOGNE.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_COLOGNE;
        }

        // Öffentlicher Dienst Prüfung
        const jobChecked = document.querySelector('input[name="jobStatus"]:checked');

        if (!jobChecked) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie an, ob Sie beim <strong>öffentlichen Dienst</strong> arbeiten!</p>`;
            resultBox.classList.add('is-visible');
            return;
        };

        if (jobChecked.value === 'yes') {
            basicPrice *= DISCOUNT_JOB;
        };

        // Schadenfreiheits-Prüfung (5 Jahre)
        const damageChecked = document.querySelector('input[name="damageStatus"]:checked');

        if (!damageChecked) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie an, ob Sie die letzten 5 Jahre <strong>schadenfrei</strong> waren!</p>`;
            resultBox.classList.add('is-visible');
            return;
        };
        if (damageChecked.value === 'yes') {
            basicPrice *= DISCOUNT_NO_DAMAGE;
        };

        currentPrice = basicPrice;

        const resultText = "Ihre Haftpflichtversicherung kostet:";
        const Price = `${basicPrice.toFixed(2)}€ pro Jahr`; // "Price" als Variable ist unüblich, würde "displayPrice" vorschlagen.
        resultBox.innerHTML = `
        <p class="result-text">${resultText}</p>
        <div class="result-price">${Price}</div>
        `;
        resultBox.classList.add('is-visible');
        btnMonthly.classList.remove('is-hidden');
        btnReset.classList.remove('is-hidden');
        isMonthlyNow = false;
        btnMonthly.innerHTML = 'Preis pro Monat';
    };

    // --- Preis pro Monat/Jahr Umschaltfunktion ---
    function togglePriceView() {
        const priceElement = document.querySelector('.result-price');
        if (isMonthlyNow) {
            priceElement.innerHTML = `${currentPrice.toFixed(2)}€ pro Jahr`; // Semikolon hinzugefügt
            btnMonthly.innerHTML = 'Preis pro Monat';
            isMonthlyNow = false;
        }
        else {
            const monthlyPrice = currentPrice / 12;
            isMonthlyNow = true;
            btnMonthly.innerHTML = 'Preis pro Jahr';
            if (priceElement) {
                priceElement.innerHTML = `${monthlyPrice.toFixed(2)}€ pro Monat`;
            }
        }
    };

    // --- Reset-Funktion ---
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