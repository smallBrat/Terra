/**
 * TERRA — SHARED CONSTANTS
 * Centralized configuration values, emission factors, and defaults.
 * Single source of truth for all magic numbers and hardcoded strings.
 */

/* ====================================================
   EMISSION FACTORS (kg CO₂e per unit)
   ==================================================== */
const EMISSION_FACTORS = {
  commute: {
    car: 0.18,        // per km
    cab: 0.15,
    ev: 0.05,
    publicTransit: 0.03,
    cycling: 0.0,
    weekendBuffer: 2.0 // weekly additive
  },
  energy: {
    billRanges: {
      under500: 3.0,
      range500_1000: 6.0,
      range1000_2500: 9.6,
      range2500_5000: 18.0,
      over5000: 32.0
    },
    cookingAdjustment: {
      electric: -1.0,
      solar: -1.0,
      biomass: 2.0
    },
    acAdjustment: {
      noAC: -2.0,
      seasonal: 0.0,
      mostOfYear: 3.0
    }
  },
  food: {
    flexitarian: 6.0,
    vegetarian: 4.2,
    regularMeat: 8.4,
    heavyMeat: 12.5
  },
  shopping: {
    base: 0.5,
    perDelivery: 0.1,
    frequently: 0.8,
    rarely: -0.2,
    greenHabitReduction: 0.1,
    minimum: 0.2
  },
  flights: {
    domestic: 400,       // kg CO₂e per round trip
    shortHaul: 900,
    longHaul: 2200,
    weeksPerYear: 52
  },
  dailySavings: {
    bicyclePerKm: 0.18,
    transitPerKm: 0.12,
    carpoolPerKm: 0.08,
    meatFreeMeal: 0.8,
    ac24: 0.4,
    acOff: 0.8,
    batching: 0.3
  }
};

/* ====================================================
   BENCHMARKS
   ==================================================== */
const BENCHMARKS = {
  nationalAverageWeekly: 41.7,  // kg CO₂e
  climateEfficientMin: 22.0,
  climateEfficientMax: 28.0,
  comparisonBaseMax: 48.0       // for bar chart scaling
};

/* ====================================================
   DEFAULT PROFILE
   ==================================================== */
const DEFAULT_PROFILE = {
  name: "Arjun",
  city: "Mumbai",
  homeType: "Apartment (medium, 3–4 rooms)",
  household: "3–4 people",
  commuteKm: 15,
  commuteModes: ["Public transit", "Two-wheeler"],
  cooking: "LPG / piped gas",
  ac: "Seasonally",
  electricBill: "₹1,000 – ₹2,500",
  diet: "Flexitarian",
  deliveries: 3,
  shoppingFreq: "Occasionally — a few purchases per month",
  sustainableChips: ["I bring reusable bags", "I batch my deliveries"],
  flights: 2,
  flightType: "Domestic",
  goals: ["Reduce my commute footprint", "Cut my home energy usage"],
  targetReduction: "Reduce by 10–20% this year",
  footprint: {
    commute: 17.8,
    energy: 9.6,
    food: 6.1,
    shopping: 0.7,
    total: 34.2,
    comparisonPct: 18,
    comparisonLabel: "below the national average"
  }
};

/* ====================================================
   LOCAL STORAGE KEYS
   ==================================================== */
const STORAGE_KEYS = {
  user: "terra_user",
  savedActions: "terra_saved_actions",
  streakCount: "terra_streak_count",
  loggedToday: "terra_logged_today"
};

/* ====================================================
   ONBOARDING CONFIG
   ==================================================== */
const ONBOARDING = {
  totalSteps: 7,
  stepInfo: {
    1: {
      tag: "Step 1 of 7",
      title: "Your home & location",
      desc: "Where you live shapes a big part of your carbon picture — energy grids, climate, and transit options all vary by location."
    },
    2: {
      tag: "Step 2 of 7",
      title: "Commute habits",
      desc: "Daily travel is typically the largest contributor to an individual's carbon footprint. Let's look at your weekly travel habits."
    },
    3: {
      tag: "Step 3 of 7",
      title: "Home energy",
      desc: "How you power, cool, and cook in your home influences your utility emissions. These depend heavily on your local grid."
    },
    4: {
      tag: "Step 4 of 7",
      title: "Food preferences",
      desc: "Agricultural systems carry diverse impacts. Small, flexible shifts in diet can be surprisingly effective levers for change."
    },
    5: {
      tag: "Step 5 of 7",
      title: "Shopping & delivery",
      desc: "Manufacturing, packaging, and shipping logistics add up. Mindful shopping habits and batched orders help lower this footprint."
    },
    6: {
      tag: "Step 6 of 7",
      title: "Travel patterns",
      desc: "Long distance flights are major emissions events. Tracking flights helps put daily changes into perspective."
    },
    7: {
      tag: "Step 7 of 7",
      title: "Your goals",
      desc: "Select what elements of footprint tracking you want to focus on. We will prioritize your recommendations based on these goals."
    }
  }
};

/* ====================================================
   TREND CHART DEFAULT DATA
   ==================================================== */
const DEFAULT_TREND_DATA = [42.1, 40.5, 39.8, 38.2, 36.9, 37.5, 35.4, 34.2];

/* ====================================================
   UTILITY: Safe JSON parse
   ==================================================== */
function safeJSONParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Corrupted localStorage key "${key}", resetting to default.`);
    localStorage.removeItem(key);
    return fallback;
  }
}

/* ====================================================
   UTILITY: Escape HTML to prevent XSS
   ==================================================== */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ====================================================
   INPUT VALIDATION
   ==================================================== */
const VALIDATION = {
  city: {
    pattern: /^[a-zA-Z\s\-,.'()]{2,50}$/,
    message: "City must be 2–50 letters, spaces, or hyphens."
  },
  commuteKm: { min: 0, max: 300 },
  deliveries: { min: 0, max: 50 },
  flights: { min: 0, max: 52 }
};

function validateCity(city) {
  const trimmed = (city || "").trim();
  if (!trimmed) return { valid: false, value: "Mumbai", message: "City is required." };
  if (trimmed.length < 2 || trimmed.length > 50) return { valid: false, value: trimmed.slice(0, 50), message: VALIDATION.city.message };
  if (!VALIDATION.city.pattern.test(trimmed)) return { valid: false, value: trimmed.replace(/[^a-zA-Z\s\-,.()']/g, "").slice(0, 50), message: VALIDATION.city.message };
  return { valid: true, value: trimmed };
}

function validateRange(val, min, max) {
  const num = parseInt(val, 10);
  if (isNaN(num)) return { valid: false, value: min };
  if (num < min) return { valid: false, value: min };
  if (num > max) return { valid: false, value: max };
  return { valid: true, value: num };
}

/* ====================================================
   PURE FOOTPRINT CALCULATION
   Testable business logic — no DOM access.
   ==================================================== */
function calculateFootprint(inputs) {
  const {
    commuteKm = 15,
    commuteModes = [],
    electricBill = "₹1,000 – ₹2,500",
    cooking = "LPG / piped gas",
    ac = "Seasonally",
    diet = "Flexitarian",
    deliveries = 3,
    shoppingFreq = "Occasionally",
    sustainableChips = [],
    flights = 2,
    flightType = "Domestic"
  } = inputs;

  // Default factor (0.08) represents mixed-mode commuting (transit + walking) for users
  // who haven't selected a specific mode. This matches India's urban average.
  let commuteFactor = 0.08;
  if (commuteModes.includes("Personal car")) commuteFactor = EMISSION_FACTORS.commute.car;
  else if (commuteModes.includes("Cab / rideshare")) commuteFactor = EMISSION_FACTORS.commute.cab;
  else if (commuteModes.includes("Electric vehicle")) commuteFactor = EMISSION_FACTORS.commute.ev;
  else if (commuteModes.includes("Public transit")) commuteFactor = EMISSION_FACTORS.commute.publicTransit;
  else if (commuteModes.includes("Cycling / walking")) commuteFactor = EMISSION_FACTORS.commute.cycling;

  let commuteWeekly = (commuteKm * 5 * commuteFactor) + EMISSION_FACTORS.commute.weekendBuffer;

  // Energy from bill range
  let energyWeekly = EMISSION_FACTORS.energy.billRanges.range1000_2500; // default
  if (electricBill.includes("Under ₹500")) energyWeekly = EMISSION_FACTORS.energy.billRanges.under500;
  else if (electricBill.includes("₹500 – ₹1,000")) energyWeekly = EMISSION_FACTORS.energy.billRanges.range500_1000;
  else if (electricBill.includes("₹2,500 – ₹5,000")) energyWeekly = EMISSION_FACTORS.energy.billRanges.range2500_5000;
  else if (electricBill.includes("Over ₹5,000")) energyWeekly = EMISSION_FACTORS.energy.billRanges.over5000;

  if (cooking === "Electric induction" || cooking === "Solar") energyWeekly += EMISSION_FACTORS.energy.cookingAdjustment.electric;
  else if (cooking === "Biomass / firewood") energyWeekly += EMISSION_FACTORS.energy.cookingAdjustment.biomass;
  if (ac.includes("No AC")) energyWeekly += EMISSION_FACTORS.energy.acAdjustment.noAC;
  else if (ac.includes("most of the year")) energyWeekly += EMISSION_FACTORS.energy.acAdjustment.mostOfYear;

  // Food from diet
  let foodWeekly = EMISSION_FACTORS.food.flexitarian;
  if (diet.includes("vegetarian") || diet.includes("Mostly vegetarian")) foodWeekly = EMISSION_FACTORS.food.vegetarian;
  else if (diet.includes("Regular meat")) foodWeekly = EMISSION_FACTORS.food.regularMeat;
  else if (diet.includes("Heavy meat")) foodWeekly = EMISSION_FACTORS.food.heavyMeat;

  // Shopping
  let shoppingWeekly = EMISSION_FACTORS.shopping.base + (deliveries * EMISSION_FACTORS.shopping.perDelivery);
  if (shoppingFreq.includes("Frequently")) shoppingWeekly += EMISSION_FACTORS.shopping.frequently;
  else if (shoppingFreq.includes("Rarely")) shoppingWeekly += EMISSION_FACTORS.shopping.rarely;
  shoppingWeekly -= (sustainableChips.length * EMISSION_FACTORS.shopping.greenHabitReduction);
  shoppingWeekly = Math.max(EMISSION_FACTORS.shopping.minimum, shoppingWeekly);

  // Flights
  let flightFactor = EMISSION_FACTORS.flights.domestic;
  if (flightType === "Short-haul intl.") flightFactor = EMISSION_FACTORS.flights.shortHaul;
  else if (flightType === "Long-haul") flightFactor = EMISSION_FACTORS.flights.longHaul;
  const flightWeekly = (flights * flightFactor) / EMISSION_FACTORS.flights.weeksPerYear;
  commuteWeekly += flightWeekly;

  const totalWeekly = commuteWeekly + energyWeekly + foodWeekly + shoppingWeekly;

  const commuteVal = parseFloat(commuteWeekly.toFixed(1));
  const energyVal = parseFloat(energyWeekly.toFixed(1));
  const foodVal = parseFloat(foodWeekly.toFixed(1));
  const shoppingVal = parseFloat(shoppingWeekly.toFixed(1));
  const totalVal = parseFloat(totalWeekly.toFixed(1));

  const diff = BENCHMARKS.nationalAverageWeekly - totalVal;
  const comparisonPct = Math.round((Math.abs(diff) / BENCHMARKS.nationalAverageWeekly) * 100);
  const comparisonLabel = diff >= 0 ? "below the national average" : "above the national average";

  return {
    commute: commuteVal, energy: energyVal, food: foodVal, shopping: shoppingVal, total: totalVal,
    comparisonPct, comparisonLabel
  };
}
