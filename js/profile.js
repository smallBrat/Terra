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
  setText(S.profileName, profile.name || "You");

  // Data rows
  const rows = document.querySelectorAll(S.dataRows);
  if (rows.length >= 6) {
    const values = [
      `${profile.city || "Mumbai"}, India",
      profile.household || "3–4 people",
      profile.commuteModes ? profile.commuteModes.join(", ") : "Public transit",
      profile.electricBill || "₹1,000 – ₹2,500",
      profile.diet || "Flexitarian",
      `${profile.flights || 0} round trip${profile.flights === 1 ? "" : "s"} / year`,
    ];
    values.forEach((val, i) => {
      const el = rows[i]?.querySelector(S.dataRowValue);
      if (el) el.textContent = val;
    });
  }

  // Streak
  const streakVal = localStorage.getItem("terra_streak_count") || "11";
  const streakEl = document.querySelector(S.profileStatVal);
  if (streakEl) streakEl.textContent = streakVal;
}

function renderGoals(goals) {
  const goalsList = document.querySelector(S.goalsList);
  if (!goalsList || !goals?.length) return;

  goalsList.innerHTML = "";
  goals.forEach(goal => {
    const { icon, pct } = resolveGoalDisplay(goal);

    const row = document.createElement("div");
    row.className = "goal-row";

    const iconEl = document.createElement("div");
    iconEl.className = "goal-icon";
    iconEl.textContent = icon;
    row.appendChild(iconEl);

    const info = document.createElement("div");
    info.className = "goal-info";

    const nameEl = document.createElement("div");
    nameEl.className = "goal-name";
    nameEl.textContent = goal;
    info.appendChild(nameEl);

    const wrap = document.createElement("div");
    wrap.className = "goal-progress-wrap";

    const track = document.createElement("div");
    track.className = "goal-progress-track";
    const fill = document.createElement("div");
    fill.className = "goal-progress-fill";
    fill.style.setProperty("--bar-pct", String(pct));
    track.appendChild(fill);
    wrap.appendChild(track);

    const pctEl = document.createElement("span");
    pctEl.className = "goal-pct";
    pctEl.textContent = `${pct}%`;
    wrap.appendChild(pctEl);

    info.appendChild(wrap);
    row.appendChild(info);
    goalsList.appendChild(row);
  });
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
