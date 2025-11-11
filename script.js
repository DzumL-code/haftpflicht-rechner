// HTML und CSS werden vor JavaScript geladen, damit keine Fehler passieren,
// wenn JavaScript Elemente lesen will, die noch nicht im DOM existieren.
document.addEventListener('DOMContentLoaded', function () {

    // --- GESCHÄFTSLOGIK & REGELN ---
    const BASE_PRICE = 60; // Grundpreis der Versicherung in Euro.

    // Tarifgruppen-Aufschläge
    const SURCHARGE_CHILD = 25;   // Aufschlag für die Tarifgruppe "Ich und Kind/er".
    const SURCHARGE_COUPLE = 20;  // Aufschlag für die Tarifgruppe "Paar ohne Kind/er".
    const SURCHARGE_FAMILY = 40;  // Aufschlag für die Tarifgruppe "Familie".

    // Alters-Regeln
    const MIN_AGE = 18;           // Mindestalter für den Abschluss einer Versicherung.
    const MIN_BIRTH_YEAR_TO_ACCEPT = 1909; // Ältestes akzeptiertes Geburtsjahr. (Referenz: älteste lebende Person)
    const MAX_AGE = 116;          // Maximales Alter, bis zu dem eine Berechnung durchgeführt wird (Stand: 2025).
    const RISK_AGE_LIMIT = 25;    // Altersgrenze für den Risiko-Aufschlag.
    const RISK_FACTOR_U25 = 1.2;  // Faktor für den 20% Risiko-Aufschlag für Personen unter 25 Jahren.

    // PLZ-Aufschläge
    const SURCHARGE_BERLIN = 15; // Aufschlag für Postleitzahlen im Bereich Berlin.
    const SURCHARGE_MUNICH = 17; // Aufschlag für Postleitzahlen im Bereich München.
    const SURCHARGE_COLOGNE = 16; // Aufschlag für Postleitzahlen im Bereich Köln.

    // PLZ-Arrays (basierend auf den ersten zwei Ziffern der Postleitzahl)
    const ZIP_BERLIN = ['10', '11', '12', '13', '14']; // Liste der Anfangsziffern für Berliner PLZ.
    const ZIP_MUNICH = ['80', '81']; // Liste der Anfangsziffern für Münchner PLZ.
    const ZIP_COLOGNE = ['50', '51']; // Liste der Anfangsziffern für Kölner PLZ.

    // Rabatte
    const DISCOUNT_JOB = 0.9;     // Multiplikationsfaktor für 10% Rabatt (Öffentlicher Dienst).
    const DISCOUNT_NO_DAMAGE = 0.85; // Multiplikationsfaktor für 15% Rabatt (5 Jahre schadenfrei).

    // --- ENDE REGELN ---

    // --- Globale Variablen ---
    let currentPrice = 0; // Variable für den aktuell berechneten Jahrespreis.

    let isMonthlyNow = false; // Zustand, der angibt, ob der Preis gerade pro Monat angezeigt wird (true) oder pro Jahr (false).

    // -- Elemente finden und Event-Listeners --

    // Button und Event-Listener, um die Berechnung zu starten.
    const btnCalculate = document.getElementById('bStart');
    btnCalculate.addEventListener('click', calculate);
    // Button und Event-Listener, um die Eingaben zurückzusetzen.
    const btnReset = document.getElementById('bReset');
    btnReset.addEventListener('click', reset);
    // Button und Event-Listener, um den Monatspreis zu berechnen + zwischen Monats- und Jahrespreisansicht zu wechseln.
    const btnMonthly = document.getElementById('bMonthly');
    btnMonthly.addEventListener('click', togglePriceView);
    // Referenz auf den HTML-Bereich, in dem das Ergebnis angezeigt wird.
    const resultBox = document.getElementById('result');

    // Referenzen auf Select- und Input-Felder durch die Definition von Variablen.
    const birthDaySelect = document.getElementById('birthDay');
    const birthMonthSelect = document.getElementById('birthMonth');
    const birthYearSelect = document.getElementById('birthYear');
    const postInput = document.getElementById('postcode');
    const cityInput = document.getElementById('city');

    // Verhinderung, dass Buchstaben in die PLZ eingetragen werden können.
    postInput.addEventListener('input', () => postInput.value = postInput.value.replace(/[^0-9]/g, ''));
    
    // Namen der Radio-Gruppen (für einfaches Speichern und Laden aus localStorage).
    const radioGroupNames = ['a1', 'jobStatus', 'damageStatus'];

    // --- EVENT LISTENERS ZUM SPEICHERN (localStorage) ---

    // Event-Listener, die Änderungen an Select- und Textfeldern registrieren
    // und deren Werte sofort im localStorage speichern.
    birthDaySelect.addEventListener('change', () => localStorage.setItem('userDaySelect', birthDaySelect.value));
    birthMonthSelect.addEventListener('change', () => localStorage.setItem('userMonthSelect', birthMonthSelect.value));
    birthYearSelect.addEventListener('change', () => localStorage.setItem('userYearSelect', birthYearSelect.value));
    postInput.addEventListener('input', () => localStorage.setItem('userPostcode', postInput.value));
    cityInput.addEventListener('input', () => localStorage.setItem('userCity', cityInput.value));

    // Radio-Buttons speichern: Funktion, die bei einer Auswahl den Wert der Gruppe speichert.
    function saveRadioSelection(event) {
        if (event.target.checked) {
            // Speichert den WERT (z.B. "yes") unter dem NAMEN der Gruppe (z.B. "jobStatus")
            localStorage.setItem(event.target.name, event.target.value);
        }
    }
    document.querySelectorAll('input[type="radio"]').forEach(radio => { radio.addEventListener('change', saveRadioSelection); });

    // --- Funktion zur Generierung der Datums-Optionen in den Dropdowns ---
    function populateDateDropdowns() {

        // Generiert die Optionen für den Tag (1 bis 31).
        for (let i = 1; i <= 31; i++) {
            const dayOption = document.createElement('option'); // Erstellt ein neues <option>-Element.
            dayOption.value = i; // Setzt den internen Wert des <option>-Elements auf die aktuelle Zahl (i).
            dayOption.textContent = i; // Setzt den sichtbaren Text des <option>-Elements auf die aktuelle Zahl (i).
            birthDaySelect.appendChild(dayOption); // Fügt das erstellte <option>-Element dem Tag-Dropdown hinzu.
        };

        // Generiert die Optionen für den Monat (1 bis 12).
        for (let i = 1; i <= 12; i++) {
            const monthOption = document.createElement('option');
            monthOption.value = i;
            monthOption.textContent = i;
            birthMonthSelect.appendChild(monthOption);
        };

        const currentYear = new Date().getFullYear(); // Ermittelt das aktuelle Jahr.
        const startYear = currentYear - MIN_AGE; // Berechnet das früheste Geburtsjahr basierend auf dem Mindestalter.


        // Generiert die Optionen für das Jahr (vom Startjahr bis zum ältesten akzeptierten Geburtsjahr).
        for (let i = startYear; i >= MIN_BIRTH_YEAR_TO_ACCEPT; i--) {
            const yearOption = document.createElement('option');
            yearOption.value = i;
            yearOption.textContent = i;
            birthYearSelect.appendChild(yearOption);
        };
    };

    populateDateDropdowns(); // Die Funktion zur Generierung der Datum-Dropdowns wird beim Laden der Seite ausgeführt.


    // --- FUNKTION ZUM LADEN GESPEICHERTER DATEN (localStorage) ---
    function loadSavedData() {
        // Lädt die Werte für Tag, Monat, Jahr, Postleitzahl und Ort aus dem localStorage
        // und setzt sie in die entsprechenden Select- und Input-Felder ein.
        // `|| ''` (Fallback) stellt sicher, dass ein leerer String gesetzt wird, falls kein Wert gespeichert ist.
        birthDaySelect.value = localStorage.getItem('userDaySelect') || '';
        birthMonthSelect.value = localStorage.getItem('userMonthSelect') || '';
        birthYearSelect.value = localStorage.getItem('userYearSelect') || '';
        postInput.value = localStorage.getItem('userPostcode') || '';
        cityInput.value = localStorage.getItem('userCity') || '';

        // Lädt die Auswahl der Radio-Buttons für jede definierte Gruppe.
        radioGroupNames.forEach(groupName => {
            const savedValue = localStorage.getItem(groupName); // Holt den gespeicherten Wert für die aktuelle Radiogruppe (z.B. "jobStatus").
            if (savedValue) { // Prüft, ob überhaupt ein Wert für diese Gruppe gespeichert wurde.
                // Findet den spezifischen Radio-Button, der sowohl den korrekten Namen als auch den gespeicherten Wert hat.
                const radioToSelect = document.querySelector(`input[name="${groupName}"][value="${savedValue}"]`);
                if (radioToSelect) {
                    radioToSelect.checked = true; // Markiert diesen Radio-Button als ausgewählt.
                }
            }
        });
    }

    loadSavedData(); // Die Funktion zum Laden der gespeicherten Daten wird beim Start ausgeführt.

    // --- HAUPT-FUNKTIONEN ---

    // Funktion zur Berechnung des Versicherungsbeitrags.
    function calculate() {

        let basicPrice = BASE_PRICE; // Initialisiert den Preis mit dem Grundpreis.

        // Abfrage der ausgewählten Tarifgruppe.
        const whoChecked = document.querySelector('input[name="a1"]:checked'); // Ermittelt den aktuell ausgewählten Radio-Button der Gruppe "a1".

        if (!whoChecked) { // Prüft, ob eine Tarifgruppe ausgewählt wurde.
            resultBox.innerHTML = `<p class="error-text">Bitte wählen Sie aus, <strong>wer versichert</strong> werden soll!</p>`;
            resultBox.classList.add('is-visible');
            return; // Beendet die Funktion, wenn keine Auswahl getroffen wurde.
        }
        const who = whoChecked.value; // Holt den Wert des ausgewählten Radio-Buttons.
        if (who === 'child') basicPrice += SURCHARGE_CHILD; // Addiert Aufschlag für "Ich und Kind/er".
        else if (who === 'couple') basicPrice += SURCHARGE_COUPLE; // Addiert Aufschlag für "Paar ohne Kind/er".
        else if (who === 'family') basicPrice += SURCHARGE_FAMILY; // Addiert Aufschlag für "Familie" (Partner mit Kind/ern).

        // Geburtsdatum Prüfung und Altersberechnung.
        const birthValue = `${birthYearSelect.value}-${parseInt(birthMonthSelect.value) - 1}-${birthDaySelect.value}`;
        // Erstellt einen Datumsstring im Format "YYYY-MM-DD".
        // Beim Monat wird 1 abgezogen, da JavaScript-Date-Objekte Monate von 0 (Januar) bis 11 (Dezember) zählen.

        if (!birthDaySelect.value || !birthMonthSelect.value || !birthYearSelect.value) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie Ihr <strong>Geburtsdatum</strong> ein!</p>`;
            resultBox.classList.add('is-visible');
            return; // Beendet die Funktion, wenn das Geburtsdatum unvollständig ist.
        }

        const birthDate = new Date(birthValue); // Erstellt ein Date-Objekt aus dem erfassten Geburtsdatum.
        const today = new Date(); // Erstellt ein Date-Objekt für das aktuelle Datum.
        let age = today.getFullYear() - birthDate.getFullYear(); // Berechnet die grobe Altersdifferenz in Jahren.
        const monthDiff = today.getMonth() - birthDate.getMonth(); // Berechnet die Differenz der Monate.

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--; // Reduziert das Alter um ein Jahr, wenn der Geburtstag im aktuellen Kalenderjahr noch nicht stattgefunden hat.
        };

        if (age > MAX_AGE) {
            resultBox.innerHTML = `<p class="error-text">Bitte melden Sie sich bei uns <strong>persönlich</strong>!</p>`;
            resultBox.classList.add('is-visible');
            return; // Beendet die Funktion und zeigt eine Meldung für Personen über dem Maximalalter an (ein kleines Gimmick für sehr alte Personen).
        }
        else if (age < RISK_AGE_LIMIT) {
            basicPrice *= RISK_FACTOR_U25;
        }; // Erhöht den Preis um 20% als Risiko-Aufschlag für Personen unter 25 Jahren.

        // Wohnort Prüfung und PLZ-Aufschläge.
        const postValue = postInput.value; // Holt den Wert der eingegebenen Postleitzahl.

        if (!postValue) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie Ihre <strong>Postleitzahl</strong> ein!</p>`;
            resultBox.classList.add('is-visible');
            return; // Beendet die Funktion, wenn keine Postleitzahl angegeben wurde.
        }

        if (ZIP_BERLIN.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_BERLIN; // Fügt den Berlin-Aufschlag hinzu, wenn die PLZ mit einer der Berliner Präfixe beginnt.
        } else if (ZIP_MUNICH.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_MUNICH; // Fügt den München-Aufschlag hinzu.
        } else if (ZIP_COLOGNE.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_COLOGNE; // Fügt den Köln-Aufschlag hinzu.
        }

        // Öffentlicher Dienst Prüfung und Rabatt.
        const jobChecked = document.querySelector('input[name="jobStatus"]:checked');
        // Findet den Radio-Button der Gruppe "jobStatus", der aktuell ausgewählt (`:checked`) ist.

        if (!jobChecked) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie an, ob Sie beim <strong>öffentlichen Dienst</strong> arbeiten!</p>`;
            resultBox.classList.add('is-visible');
            return; // Beendet die Funktion, wenn keine Auswahl zum öffentlichen Dienst getroffen wurde.
        };

        if (jobChecked.value === 'yes') {
            basicPrice *= DISCOUNT_JOB;
        }; // Wendet den Rabatt für Personen an, die im öffentlichen Dienst arbeiten.

        // Schadenfreiheits-Prüfung (5 Jahre) und Rabatt.
        const damageChecked = document.querySelector('input[name="damageStatus"]:checked'); // Ermittelt den ausgewählten Radio-Button der Gruppe "damageStatus".

        if (!damageChecked) {
            resultBox.innerHTML = `<p class="error-text">Bitte geben Sie an, ob Sie die letzten 5 Jahre <strong>schadenfrei</strong> waren!</p>`;
            resultBox.classList.add('is-visible');
            return; // Beendet die Funktion, wenn keine Auswahl zur Schadenfreiheit getroffen wurde.
        };
        if (damageChecked.value === 'yes') {
            basicPrice *= DISCOUNT_NO_DAMAGE;
        }; // Wendet den Rabatt für Personen an, die länger als 5 Jahre schadenfrei sind.

        currentPrice = basicPrice; // Speichert den finalen Jahrespreis in der globalen Variable.

        const resultText = "Ihre Haftpflichtversicherung kostet:";
        const displayPrice = `${basicPrice.toFixed(2)}€ pro Jahr`; // Wir defenieren unseren Ergebnistext und lassen nur zwei Nachkommastellen zu

        resultBox.innerHTML = `
        <p class="result-text">${resultText}</p>
        <div class="result-price">${displayPrice}</div>
        `; // Aktualisiert den HTML-Inhalt der Ergebnisbox mit dem berechneten Preis.
        resultBox.classList.add('is-visible'); // Macht die Ergebnisbox sichtbar.
        btnMonthly.classList.remove('is-hidden'); // Zeigt den "Preis pro Monat"-Button an.
        btnReset.classList.remove('is-hidden'); // Zeigt den "Eingaben zurücksetzen"-Button an.
        isMonthlyNow = false; // Setzt den Anzeigestatus auf "pro Jahr".
        btnMonthly.innerHTML = 'Preis pro Monat'; // Setzt den Text des Buttons auf "Preis pro Monat".
    };

    // --- Funktion zum Umschalten zwischen Monats- und Jahrespreisansicht ---
    function togglePriceView() {
        const priceElement = document.querySelector('.result-price'); // Holt das Element, das den Preis anzeigt.
        if (isMonthlyNow) {
            // Wenn aktuell der Monatspreis angezeigt wird, wechsle zum Jahrespreis.
            priceElement.innerHTML = `${currentPrice.toFixed(2)}€ pro Jahr`;
            btnMonthly.innerHTML = 'Preis pro Monat';
            isMonthlyNow = false;
        }
        else {
            // Wenn aktuell der Jahrespreis angezeigt wird, wechsle zum Monatspreis.
            const monthlyPrice = currentPrice / 12; // Berechnet den Monatspreis.
            isMonthlyNow = true;
            btnMonthly.innerHTML = 'Preis pro Jahr';
            if (priceElement) { // Sicherheitshalber prüfen, ob das Element existiert.
                priceElement.innerHTML = `${monthlyPrice.toFixed(2)}€ pro Monat`;
            }
        }
    };

    // --- Reset-Funktion: Setzt alle Eingaben und das Ergebnis zurück ---
    function reset() {
        currentPrice = 0; // Setzt den Preis zurück.
        // Setzt alle Select-Felder auf ihren Standardwert (leer).
        birthDaySelect.value = '';
        birthMonthSelect.value = '';
        birthYearSelect.value = '';
        // Löscht die Inhalte der Input-Felder.
        postInput.value = '';
        cityInput.value = '';

        // Deaktiviert alle Radio-Buttons.
        const radioBtns = document.querySelectorAll('input[type="radio"]');
        radioBtns.forEach(radio => {
            radio.checked = false;
        });

        resultBox.innerHTML = ''; // Löscht den Inhalt der Ergebnisbox.
        resultBox.classList.remove('is-visible'); // Blendet die Ergebnisbox aus.
        btnMonthly.classList.add('is-hidden'); // Blendet den Monats-/Jahres-Button aus.
        localStorage.clear(); // Löscht alle gespeicherten Daten im Browser.
    }
});