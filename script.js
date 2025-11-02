document.addEventListener('DOMContentLoaded', function () { // HTML und CSS werden vor Java Script geladen, damit keine Fehler passieren indem JS sachen lesen will, die es noch nicht gibt.

    // --- GESCHÄFTSLOGIK & REGELN ---

    const BASE_PRICE = 60; // 60€ Grundpreis

    // Tarifgruppen-Aufschläge
    const SURCHARGE_CHILD = 25;   // "Ich und Kind/er"
    const SURCHARGE_COUPLE = 20;  // "Paar ohne Kind/er"
    const SURCHARGE_FAMILY = 40;  // "Familie"

    // Alters-Regeln
    const MIN_AGE = 18;          // Mindestalter
    const RISK_AGE_LIMIT = 25;   // Grenze für Risiko-Aufschlag
    const RISK_FACTOR_U25 = 1.2; // 20% Aufschlag

    // PLZ-Aufschläge
    const SURCHARGE_BERLIN = 15; // Aufschlag Berlin
    const SURCHARGE_MUNICH = 17; // Aufschlag München
    const SURCHARGE_COLOGNE = 16; // Aufschlag Köln

    // PLZ-Arrays 
    const ZIP_BERLIN = ["10", "11", "12", "13", "14"];
    const ZIP_MUNICH = ["80", "81"];
    const ZIP_COLOGNE = ["50", "51"];

    // Rabatte
    const DISCOUNT_JOB = 0.9;    // 10% Rabatt (Öffentl. Dienst)
    const DISCOUNT_NO_DAMAGE = 0.85; // 15% Rabatt (Schadenfrei)

    // --- ENDE REGELN ---


    const btnCalculate = document.getElementById(`bStart`); // Button zur Berechnung wird gelesen
    const btnReset = document.getElementById(`bReset`); // Button um die Einstellungen zu löschen
    btnCalculate.addEventListener(`click`, calculate); // Button zu Berechnung wird überwacht und bringt unsere Funktion in gang, welche durch einen Klick auf den Button gestartet wird
    btnReset.addEventListener('click', reset);
    const resultBox = document.getElementById("result");

    // Funktion zur Berechnung
    function calculate() {

        let basicPrice = BASE_PRICE; // Das ist unser Grundpreis für die Versicherung

        // Tarifgruppe
        const whoChecked = document.querySelector(`input[name="a1"]:checked`); // Die radio Buttons werden gelesen

        if (!whoChecked) { // Die Berechnung wird gestoppt, wenn keine Tariffgruppe ausgewäht wurde
            resultBox.innerHTML = `<p>Bitte wähle aus, <strong>wer versichert</strong> werden soll!</p>`;
            return;
        }
        if (whoChecked) {
            const who = whoChecked.value;
            if (who === `child`) basicPrice += SURCHARGE_CHILD; // Aufschlag für ein Kind/er
            else if (who === `couple`) basicPrice += SURCHARGE_COUPLE; // Aufschlag für Partner
            else if (who === `family`) basicPrice += SURCHARGE_FAMILY; // Aufschlag für Partner mit Kind/er
        };

        // Geburtsdatum Prüfung
        const birthInput = document.getElementById("birthdate");
        const birthValue = birthInput.value;


        if (!birthValue) {
            resultBox.innerHTML = `<p>Bitte gib dein <strong>Geburtsdatum</strong> ein!</p>`;
            return;
        }

        const birthDate = new Date(birthValue); // Geburtsdatum
        const today = new Date(); // aktuelles Datum
        let age = today.getFullYear() - birthDate.getFullYear(); // Differens vom Datum
        const monthDiff = today.getMonth() - birthDate.getMonth(); // Differenz der Monate

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--; // Es wird ein Jahr abgezogen, wenn man im aktuellen Jahr noch keinen Geburtstag hatte
        };
        if (age < MIN_AGE) {
            resultBox.innerHTML = `<p>Du bist leider <strong>zu jung</strong> für einen Vertrag, komm gerne wieder zurück, wenn du <strong>Volljährig</strong> bist!</p>`;
            return; // Code wird beendet, wenn kein Geburtsdatum angegeben wird
        }
        else if (age < RISK_AGE_LIMIT) {
            basicPrice *= RISK_FACTOR_U25;
        }; // Aufschlag von 20% für jüngere Leute, da sie mehr Risiko ergeben

        // Wohnort Prüfung
        const postInput = document.getElementById(`postcode`);
        const postValue = postInput.value; // Das Inputfeld wird gelesen und die Einheit als Variable ausgegeben

        if (!postValue) {
            resultBox.innerHTML = `<p>Bitte gib deine <strong>Postleitzahl</strong> ein!</p>`;
            return; // Code wird beendet, wenn keine PLZ angegeben wird
        }

        if (ZIP_BERLIN.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_BERLIN; // Das Array wird auf die ersten zwei Ziffern gescannt und löst einen Zuschlag für eine Großstand aus, falls If = true
        } else if (ZIP_MUNICH.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_MUNICH;
        } else if (ZIP_COLOGNE.some(plz => postValue.startsWith(plz))) {
            basicPrice += SURCHARGE_COLOGNE;
        }

        // Öffentlicher Dienst Prüfung
        const jobChecked = document.querySelector(`input[name="jobStatus"]:checked`);
        
        if (!jobChecked) {
           resultBox.innerHTML = `<p>Bitte gib ab ob du beim <strong>öffetlicher Dienst</strong> bist!</p>`;
            return;
        };

        if (jobChecked.value === "yes" ) {
            basicPrice *= DISCOUNT_JOB;
        };


        // Schadensprüfung (5 Jahre)
        const damageCecked = document.querySelector(`input[name="damageStatus"]:checked`);

        if (!damageCecked) {
            resultBox.innerHTML = `<p>Bitte gib ab ob du die letzen 5 Jahre <strong>Schadensfrei</strong> warst!</p>`;
            return;
        };
        if (damageCecked.value === "yes") {
            basicPrice *= DISCOUNT_NO_DAMAGE;
        };

        resultBox.innerHTML = `<p>Deine Haftpflichtversicherung würde dich jährlich ${basicPrice.toFixed(2)}€ kosten.</p>`; // Ergebnis der Berechnung
    }

    // Reset Funktion
    function reset() {
        document.getElementById(`birthdate`).value = "";
        document.getElementById(`postcode`).value = "";
        document.getElementById(`city`).value = "";

        const radioBtns = document.querySelectorAll(`input[type="radio"]`)
        radioBtns.forEach(radio => {
            radio.checked = false;
        })
        resultBox.innerHTML = "";
        console.log("reset");
        
    }
});