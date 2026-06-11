let currentStep = 1;
// totalSteps, defaultProfile, stepInfo now come from constants.js

document.addEventListener("DOMContentLoaded", () => {
  // Initialize slider values
  const commuteKmSlider = document.getElementById("commuteKm");
  if (commuteKmSlider) {
    commuteKmSlider.addEventListener("input", (e) => {
      document.getElementById("commuteKmVal").textContent = e.target.value;
    });
  }

  // Bind the final submit button to calculate and save
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

// Calculations and LocalStorage Save
function saveOnboardingData() {
  // ── Input validation ──
  const cityRaw = document.getElementById("city")?.value || "";
  const cityValidation = validateCity(cityRaw);
  const city = cityValidation.value;

  const homeType = document.getElementById("homeType")?.value || "Apartment (medium)";
  const household = document.getElementById("household")?.value || "3–4 people";

  // Commute
  const commuteKmRaw = document.getElementById("commuteKm")?.value || "15";
  const commuteKmValidation = validateRange(commuteKmRaw, VALIDATION.commuteKm.min, VALIDATION.commuteKm.max);
  const commuteKm = commuteKmValidation.value;

  const selectedCommuteCards = document.querySelectorAll("#step-2 .ob-option-card.selected");
  const commuteModes = Array.from(selectedCommuteCards).map(card => card.innerText.trim().split("\n")[0]);

  // Energy
  const cookingGroup = document.querySelector("#step-3 [data-selected-value]");
  const cooking = cookingGroup ? cookingGroup.getAttribute("data-selected-value") : "LPG / piped gas";

  const acGroup = document.querySelectorAll("#step-3 .ob-option-card.selected");
  let ac = "Seasonally";
  if (acGroup.length > 0) ac = acGroup[0].innerText.trim().split("\n")[0];

  const electricBill = document.getElementById("electricBill")?.value || "₹1,000 – ₹2,500";

  // Diet
  const dietGroup = document.querySelector("#step-4 .ob-option-row.selected");
  const diet = dietGroup ? dietGroup.querySelector("strong")?.innerText || "Flexitarian" : "Flexitarian";

  // Shopping
  const deliveriesRaw = document.getElementById("deliveriesVal")?.textContent || "3";
  const deliveriesValidation = validateRange(deliveriesRaw, VALIDATION.deliveries.min, VALIDATION.deliveries.max);
  const deliveries = deliveriesValidation.value;
  const shoppingGroup = document.querySelector("#step-5 .ob-option-row.selected");
  const shoppingFreq = shoppingGroup ? shoppingGroup.innerText : "Occasionally";
  const selectedChips = document.querySelectorAll("#step-5 .chip.active");
  const sustainableChips = Array.from(selectedChips).map(chip => chip.innerText.trim());
  
  // Long-distance travel
  const flightsRaw = document.getElementById("flightsVal")?.textContent || "2";
  const flightsValidation = validateRange(flightsRaw, VALIDATION.flights.min, VALIDATION.flights.max);
  const flights = flightsValidation.value;

  const flightTypeCard = document.querySelector("#step-6 .ob-option-card.selected");
  const flightType = flightTypeCard ? flightTypeCard.querySelector("strong")?.innerText || "Domestic" : "Domestic";

  // Goals
  const selectedGoals = document.querySelectorAll("#step-7 .ob-goal-card.selected");
  const goals = Array.from(selectedGoals).map(card => card.querySelector("strong")?.innerText || "");
  const targetReduction = document.getElementById("targetReduction")?.value || "Reduce by 10–20% this year";

  // ── Pure footprint calculation ──
  const footprint = calculateFootprint({
    commuteKm, commuteModes, electricBill, cooking, ac,
    diet, deliveries, shoppingFreq, sustainableChips, flights, flightType
  });

  const userProfile = {
    name: DEFAULT_PROFILE.name,
    city, homeType, household, commuteKm, commuteModes,
    cooking, ac, electricBill, diet, deliveries, shoppingFreq,
    sustainableChips, flights, flightType, goals, targetReduction,
    footprint: {
      commute: footprint.commute,
      energy: footprint.energy,
      food: footprint.food,
      shopping: footprint.shopping,
      total: footprint.total,
      comparisonPct: footprint.comparisonPct,
      comparisonLabel: footprint.comparisonLabel
    }
  };

  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userProfile));
}
