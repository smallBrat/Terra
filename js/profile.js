/**
 * TERRA — PROFILE PAGE
 * Renders user profile data from localStorage into the profile screen.
 */

/* ====================================================
   GOAL ICON & PROGRESS MAPPING
   Maps goal keywords to icons and default progress percentages.
   ==================================================== */

const GOAL_MAPPINGS = [
  { keywords: ["commute"],           icon: "🚗", pct: 60 },
  { keywords: ["energy", "cooling"], icon: "🏠", pct: 40 },
  { keywords: ["diet", "food"],      icon: "🍽️", pct: 80 },
  { keywords: ["travel"],            icon: "✈️", pct: 30 },
];

function resolveGoalDisplay(goal) {
  const lower = goal.toLowerCase();
  for (const mapping of GOAL_MAPPINGS) {
    if (mapping.keywords.some(kw => lower.includes(kw))) {
      return { icon: mapping.icon, pct: mapping.pct };
    }
  }
  return { icon: "📊", pct: 20 };
}

/* ====================================================
   PROFILE DATA RENDERING
   ==================================================== */

function populateProfileData(profile) {
  const nameEl = document.querySelector(".profile-name");
  if (nameEl) nameEl.textContent = profile.name || "You";

  // Data rows
  const rows = document.querySelectorAll(".data-row");
  if (rows.length >= 6) {
    const values = [
      `${profile.city || "Mumbai"}, India`,
      profile.household || "3–4 people",
      profile.commuteModes ? profile.commuteModes.join(", ") : "Public transit",
      profile.electricBill || "₹1,000 – ₹2,500",
      profile.diet || "Flexitarian",
      `${profile.flights || 0} round trip${profile.flights === 1 ? "" : "s"} / year`,
    ];
    values.forEach((val, i) => {
      const el = rows[i]?.querySelector(".data-row-value");
      if (el) el.textContent = val;
    });
  }

  // Streak
  const streakVal = localStorage.getItem("terra_streak_count") || "11";
  const streakEl = document.querySelector(".profile-stat-val");
  if (streakEl) streakEl.textContent = streakVal;
}

function renderGoals(goals) {
  const goalsList = document.querySelector(".goals-list");
  if (!goalsList || !goals?.length) return;

  goalsList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  goals.forEach(goal => {
    const { icon, pct } = resolveGoalDisplay(goal);
    const safeGoal = escapeHTML(goal);
    const row = document.createElement("div");
    row.className = "goal-row";
    row.innerHTML = `<div class="goal-icon">${icon}</div>
      <div class="goal-info">
        <div class="goal-name">${safeGoal}</div>
        <div class="goal-progress-wrap">
          <div class="goal-progress-track"><div class="goal-progress-fill" style="--bar-pct: ${pct}"></div></div>
          <span class="goal-pct">${pct}%</span>
        </div>
      </div>`;
    fragment.appendChild(row);
  });
  goalsList.appendChild(fragment);
}

/* ====================================================
   INIT
   ==================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const data = localStorage.getItem("terra_user");
  if (!data) return;

  try {
    const profile = JSON.parse(data);
    populateProfileData(profile);
    renderGoals(profile.goals);
  } catch (e) {
    console.error("Failed to load profile data:", e);
  }
});
