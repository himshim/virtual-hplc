import { hplcParts, correctSequence } from "./partsData.js";
import { enableDrag } from "./dragDrop.js";

/* PART IDENTIFICATION */
const partsContainer = document.getElementById("parts-container");

hplcParts.forEach(part => {
  const row = document.createElement("div");
  row.className = "part-row";

  const label = document.createElement("span");
  label.textContent = part.function;

  const select = document.createElement("select");
  select.innerHTML = `
    <option value="">Select</option>
    ${hplcParts.map(p =>
      `<option value="${p.id}">${p.name}</option>`
    ).join("")}
  `;

  row.appendChild(label);
  row.appendChild(select);
  partsContainer.appendChild(row);
});

/* SEQUENCE LOGIC */
const sequenceArea = document.getElementById("sequence-area");

[...hplcParts]
  .sort(() => Math.random() - 0.5)
  .forEach(part => {
    const div = document.createElement("div");
    div.className = "sequence-item";
    div.draggable = true;
    div.dataset.id = part.id;
    div.textContent = part.name;
    sequenceArea.appendChild(div);
  });

enableDrag(sequenceArea);

document.getElementById("checkSequence").onclick = () => {
  const userSequence = [...sequenceArea.children].map(
    el => el.dataset.id
  );

  const result = document.getElementById("sequenceResult");

  if (JSON.stringify(userSequence) === JSON.stringify(correctSequence)) {
    result.textContent = "✅ Correct sequence!";
    showObservation();
  } else {
    result.textContent = "❌ Incorrect sequence. Try again.";
  }
};

/* OBSERVATION */
function showObservation() {
  const obs = document.getElementById("observation");
  obs.classList.remove("hidden");

  document.getElementById("observationText").innerHTML = `
    <strong>Observation:</strong><br>
    The mobile phase flows from reservoir to pump where it is pressurized.
    The sample is injected, separated in the column, detected, and recorded.<br><br>
    <strong>Conclusion:</strong><br>
    Correct sequencing of HPLC components is essential for reproducible and
    accurate chromatographic analysis.
  `;
}