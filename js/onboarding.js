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

/** Deselect all siblings, select the clicked element, store value in data attribute. */
function selectSingle(element) {
  const siblings = element.parentNode.querySelectorAll(".ob-option-card, .ob-option-row");
  siblings.forEach(sib => sib.classList.remove("selected"));
  element.classList.add("selected");
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

// Calculations and LocalStorage Save

/**
 * Read all onboarding form values from the DOM.
 * Returns a raw data object with validated fields.
 */
function gatherOnboardingData() {
  const cityRaw = document.getElementById("city")?.value || "";
  const city = validateCity(cityRaw).value;

  const commuteKmRaw = document.getElementById("commuteKm")?.value || "15";
  const commuteKm = validateRange(commuteKmRaw, VALIDATION.commuteKm.min, VALIDATION.commuteKm.max).value;

  const commuteModes = Array.from(
    document.querySelectorAll("#step-2 .ob-option-card.selected")
  ).map(card => card.innerText.trim().split("\n")[0]);

  const cooking = document.querySelector("#step-3 [data-selected-value]")?.getAttribute("data-selected-value") || "LPG / piped gas";
  const acSelected = document.querySelectorAll("#step-3 .ob-option-card.selected");
  const ac = acSelected.length > 0 ? acSelected[0].innerText.trim().split("\n")[0] : "Seasonally";

  const diet = document.querySelector("#step-4 .ob-option-row.selected")?.querySelector("strong")?.innerText || "Flexitarian";

  const deliveriesRaw = document.getElementById("deliveriesVal")?.textContent || "3";
  const deliveries = validateRange(deliveriesRaw, VALIDATION.deliveries.min, VALIDATION.deliveries.max).value;

  const shoppingFreq = document.querySelector("#step-5 .ob-option-row.selected")?.innerText || "Occasionally";
  const sustainableChips = Array.from(document.querySelectorAll("#step-5 .chip.active")).map(c => c.innerText.trim());

  const flightsRaw = document.getElementById("flightsVal")?.textContent || "2";
  const flights = validateRange(flightsRaw, VALIDATION.flights.min, VALIDATION.flights.max).value;

  const flightType = document.querySelector("#step-6 .ob-option-card.selected")?.querySelector("strong")?.innerText || "Domestic";
  const goals = Array.from(document.querySelectorAll("#step-7 .ob-goal-card.selected")).map(c => c.querySelector("strong")?.innerText || "");
  const targetReduction = document.getElementById("targetReduction")?.value || "Reduce by 10–20% this year";

  return {
    city, homeType: document.getElementById("homeType")?.value || "Apartment (medium)",
    household: document.getElementById("household")?.value || "3–4 people",
    commuteKm, commuteModes, cooking, ac,
    electricBill: document.getElementById("electricBill")?.value || "₹1,000 – ₹2,500",
    diet, deliveries, shoppingFreq, sustainableChips,
    flights, flightType, goals, targetReduction,
  };
}

/**
 * Build a complete user profile from onboarding form data.
 * @param {Object} data — Output of gatherOnboardingData()
 * @returns {Object} Full user profile ready for localStorage
 */
function buildUserProfile(data) {
  const footprint = calculateFootprint({
    commuteKm: data.commuteKm, commuteModes: data.commuteModes,
    electricBill: data.electricBill, cooking: data.cooking, ac: data.ac,
    diet: data.diet, deliveries: data.deliveries, shoppingFreq: data.shoppingFreq,
    sustainableChips: data.sustainableChips, flights: data.flights, flightType: data.flightType,
  });

  return {
    name: DEFAULT_PROFILE.name,
    city: data.city, homeType: data.homeType, household: data.household,
    commuteKm: data.commuteKm, commuteModes: data.commuteModes,
    cooking: data.cooking, ac: data.ac, electricBill: data.electricBill,
    diet: data.diet, deliveries: data.deliveries, shoppingFreq: data.shoppingFreq,
    sustainableChips: data.sustainableChips, flights: data.flights,
    flightType: data.flightType, goals: data.goals, targetReduction: data.targetReduction,
    footprint: {
      commute: footprint.commute, energy: footprint.energy,
      food: footprint.food, shopping: footprint.shopping,
      total: footprint.total, comparisonPct: footprint.comparisonPct,
      comparisonLabel: footprint.comparisonLabel,
    },
  };
}

/**
 * Orchestrate: gather form → build profile → persist.
 */
function saveOnboardingData() {
  const formData = gatherOnboardingData();
  const userProfile = buildUserProfile(formData);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userProfile));
}
