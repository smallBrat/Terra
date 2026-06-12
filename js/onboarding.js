let currentStep = 1;
// totalSteps, defaultProfile, stepInfo now come from constants.js

/**
 * Bind a range slider to update a display element on input.
 * @param {string} sliderId — The range input element ID
 * @param {string} displayId — The element ID to update with the value
 */
function bindSliderDisplay(sliderId, displayId) {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(displayId);
  if (slider && display) {
    slider.addEventListener("input", () => { display.textContent = slider.value; });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Bind range sliders to their display values
  bindSliderDisplay("commuteKm", "commuteKmVal");
  bindSliderDisplay("deliveries", "deliveriesVal");
  bindSliderDisplay("flights", "flightsVal");

  // Bind the final submit button
  const submitBtn = document.querySelector("#step-7 .btn-primary");
  if (submitBtn) {
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      saveOnboardingData();
      window.location.href = "dashboard.html";
    });
  }
});

// Stepper Navigation
function nextStep() {
  if (currentStep < totalSteps) {
    // Hide current panel
    document.getElementById(`step-${currentStep}`).classList.remove("active");
    // Show next panel
    currentStep++;
    document.getElementById(`step-${currentStep}`).classList.add("active");
    updateUI();
  }
}

function prevStep() {
  if (currentStep > 1) {
    // Hide current panel
    document.getElementById(`step-${currentStep}`).classList.remove("active");
    // Show previous panel
    currentStep--;
    document.getElementById(`step-${currentStep}`).classList.add("active");
    updateUI();
  }
}

function updateUI() {
  // Update progress bar
  const progressFill = document.getElementById("progressFill");
  if (progressFill) {
    progressFill.style.setProperty('--progress-pct', `${(currentStep / totalSteps) * 100}`);
  }

  // Update header counter display
  const counterDisplay = document.getElementById("stepCounterDisplay");
  if (counterDisplay) {
    counterDisplay.textContent = `Step ${currentStep} of ${totalSteps}`;
  }

  // Update sidebar contents
  const sidebarTag = document.getElementById("sidebarTag");
  const sidebarTitle = document.getElementById("sidebarTitle");
  const sidebarDesc = document.getElementById("sidebarDesc");
  if (sidebarTag && sidebarTitle && sidebarDesc) {
    sidebarTag.textContent = stepInfo[currentStep].tag;
    sidebarTitle.textContent = stepInfo[currentStep].title;
    sidebarDesc.textContent = stepInfo[currentStep].desc;
  }

  // Update step indicators in sidebar
  const stepsNavItems = document.querySelectorAll("#stepsNav .ob-step-item");
  stepsNavItems.forEach((item, index) => {
    const stepNum = index + 1;
    if (stepNum === currentStep) {
      item.classList.add("active");
    } else if (stepNum < currentStep) {
      item.classList.add("completed");
      item.classList.remove("active");
    } else {
      item.classList.remove("active", "completed");
    }
  });
}

// Option Selection Helpers

// Single Select Cards
function selectSingle(element, groupName) {
  // Find all sibling cards in the same form-group/group level
  const siblings = element.parentNode.querySelectorAll(".ob-option-card, .ob-option-row");
  siblings.forEach(sib => sib.classList.remove("selected"));
  
  // Select the clicked element
  element.classList.add("selected");
  
  // Store the select value in a data attribute
  element.parentNode.setAttribute("data-selected-value", element.innerText.trim().split("\n")[0]);
}

// Multi-select commute options
function toggleOption(element) {
  element.classList.toggle("selected");
}

// Multi-select habits (chips)
function toggleChip(element) {
  element.classList.toggle("active");
}

// Multi-select goals
function toggleGoal(element) {
  element.classList.toggle("selected");
}

/* ====================================================
   ONBOARDING DATA GATHERING & SAVE
   ==================================================== */

/** Read selected text from the first matching element in a group. */
function readSelectedText(selector, fallback) {
  const el = document.querySelector(selector);
  return el ? (el.querySelector("strong")?.innerText || el.innerText || fallback) : fallback;
}

/** Read all selected card texts within a step. */
function readSelectedCards(stepSelector) {
  return Array.from(document.querySelectorAll(`${stepSelector} .ob-option-card.selected`))
    .map(card => card.innerText.trim().split("\n")[0]);
}

/** Gather all onboarding form data into a structured object. */
function gatherOnboardingInputs() {
  const cityRaw = document.getElementById("city")?.value || "";
  const city = validateCity(cityRaw).value;

  const commuteKmRaw = document.getElementById("commuteKm")?.value || "15";
  const commuteKm = validateRange(commuteKmRaw, VALIDATION.commuteKm.min, VALIDATION.commuteKm.max).value;
  const commuteModes = readSelectedCards("#step-2");

  const cooking = document.querySelector("#step-3 [data-selected-value]")?.getAttribute("data-selected-value") || "LPG / piped gas";
  const acSelected = document.querySelectorAll("#step-3 .ob-option-card.selected");
  const ac = acSelected.length > 0 ? acSelected[0].innerText.trim().split("\n")[0] : "Seasonally";

  const electricBill = document.getElementById("electricBill")?.value || "₹1,000 – ₹2,500";
  const diet = readSelectedText("#step-4 .ob-option-row.selected", "Flexitarian");

  const deliveriesRaw = document.getElementById("deliveriesVal")?.textContent || "3";
  const deliveries = validateRange(deliveriesRaw, VALIDATION.deliveries.min, VALIDATION.deliveries.max).value;
  const shoppingFreq = document.querySelector("#step-5 .ob-option-row.selected")?.innerText || "Occasionally";
  const sustainableChips = Array.from(document.querySelectorAll("#step-5 .chip.active")).map(c => c.innerText.trim());

  const flightsRaw = document.getElementById("flightsVal")?.textContent || "2";
  const flights = validateRange(flightsRaw, VALIDATION.flights.min, VALIDATION.flights.max).value;
  const flightType = readSelectedText("#step-6 .ob-option-card.selected", "Domestic");

  const goals = Array.from(document.querySelectorAll("#step-7 .ob-goal-card.selected"))
    .map(card => card.querySelector("strong")?.innerText || "");
  const targetReduction = document.getElementById("targetReduction")?.value || "Reduce by 10–20% this year";

  return {
    city, homeType: document.getElementById("homeType")?.value || "Apartment (medium)",
    household: document.getElementById("household")?.value || "3–4 people",
    commuteKm, commuteModes, cooking, ac, electricBill, diet,
    deliveries, shoppingFreq, sustainableChips, flights, flightType,
    goals, targetReduction,
  };
}

function saveOnboardingData() {
  const inputs = gatherOnboardingInputs();
  const footprint = calculateFootprint(inputs);

  const userProfile = {
    name: DEFAULT_PROFILE.name,
    city: inputs.city, homeType: inputs.homeType, household: inputs.household,
    commuteKm: inputs.commuteKm, commuteModes: inputs.commuteModes,
    cooking: inputs.cooking, ac: inputs.ac, electricBill: inputs.electricBill,
    diet: inputs.diet, deliveries: inputs.deliveries, shoppingFreq: inputs.shoppingFreq,
    sustainableChips: inputs.sustainableChips, flights: inputs.flights, flightType: inputs.flightType,
    goals: inputs.goals, targetReduction: inputs.targetReduction,
    footprint: {
      commute: footprint.commute, energy: footprint.energy,
      food: footprint.food, shopping: footprint.shopping, total: footprint.total,
      comparisonPct: footprint.comparisonPct, comparisonLabel: footprint.comparisonLabel,
    },
  };

  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userProfile));
}
