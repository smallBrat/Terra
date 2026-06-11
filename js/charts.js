// TERRA - CHARTS JS
// Custom high-DPI vanilla HTML5 Canvas charts

document.addEventListener("DOMContentLoaded", () => {
  renderCharts();
});

// Expose renderCharts globally so it can be re-run when period changes or logs are submitted
window.renderCharts = function() {
  const userData = safeJSONParse(STORAGE_KEYS.user, null);
  const footprint = userData?.footprint || DEFAULT_PROFILE.footprint;
  drawDonutChart(footprint);
  drawTrendChart();
};

function getThemeColors() {
  // Get colors dynamically from CSS variables or use fallbacks
  const getVar = (name, fallback) => {
    const val = getComputedStyle(document.body).getPropertyValue(name).trim();
    return val || fallback;
  };

  return {
    travel: getVar("--amber-400", "#F59E0B"),
    home: getVar("--sage-500", "#5F8565"),
    food: getVar("--stone-400", "#A8A29E"),
    shop: getVar("--mineral-400", "#94A3B8"),
    textPrimary: getVar("--text-primary", "#1C2E24"),
    textMuted: getVar("--text-muted", "#7C8D82"),
    gridColor: getVar("--mineral-100", "#E2E8F0"),
    sageLight: getVar("--sage-100", "#EBF1EC")
  };
}

function drawDonutChart(footprint) {
  const canvas = document.getElementById("donutChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // Set visual dimensions and scale for high DPI
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 8;
  const innerRadius = radius - 12; // thickness of ring is 12px

  ctx.clearRect(0, 0, width, height);

  const colors = getThemeColors();
  
  // Data processing
  const data = [
    { label: "Commute", value: footprint.commute, color: colors.travel },
    { label: "Home energy", value: footprint.energy, color: colors.home },
    { label: "Food", value: footprint.food, color: colors.food },
    { label: "Shopping", value: footprint.shopping, color: colors.shop }
  ];

  const total = footprint.total;
  
  if (total === 0) {
    // Empty state
    ctx.beginPath();
    ctx.arc(centerX, centerY, (radius + innerRadius) / 2, 0, 2 * Math.PI);
    ctx.lineWidth = radius - innerRadius;
    ctx.strokeStyle = colors.gridColor;
    ctx.stroke();
    return;
  }

  let startAngle = -Math.PI / 2; // Start from top

  data.forEach(slice => {
    if (slice.value <= 0) return;
    const sliceAngle = (slice.value / total) * (2 * Math.PI);

    ctx.beginPath();
    // Draw arc using intermediate radius and stroke for perfect round lines
    ctx.arc(centerX, centerY, (radius + innerRadius) / 2, startAngle, startAngle + sliceAngle);
    ctx.lineWidth = radius - innerRadius;
    ctx.strokeStyle = slice.color;
    ctx.lineCap = "round"; // smooth rounded segment ends
    ctx.stroke();

    startAngle += sliceAngle;
  });

  // Draw center total value text
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Footprint total value
  ctx.font = "800 1.25rem 'DM Sans', sans-serif";
  ctx.fillStyle = colors.textPrimary;
  ctx.fillText(total.toFixed(1), centerX, centerY - 6);

  // Unit text below
  ctx.font = "700 0.5625rem 'DM Sans', sans-serif";
  ctx.fillStyle = colors.textMuted;
  ctx.fillText("KG CO₂e", centerX, centerY + 10);
}

function drawTrendChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  
  ctx.clearRect(0, 0, width, height);

  const colors = getThemeColors();

  // Define trend points (8 weeks) — use constants, scale to user data if available
  const userData = safeJSONParse(STORAGE_KEYS.user, null);
  const userTotal = userData?.footprint?.total;
  const baseTotal = DEFAULT_PROFILE.footprint.total;
  const scaleFactor = userTotal ? (userTotal / baseTotal) : 1;
  const trendData = DEFAULT_TREND_DATA.map((v, i) =>
    parseFloat((v * scaleFactor).toFixed(1))
  );
  // Ensure last point matches user's actual total
  if (userTotal) trendData[trendData.length - 1] = userTotal;

  // Find min and max for scaling
  const minVal = Math.min(...trendData) * 0.9;
  const maxVal = Math.max(...trendData) * 1.1;
  const valRange = maxVal - minVal;

  const paddingLeft = 15;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 15;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate pixel coordinates for the points
  const points = trendData.map((val, idx) => {
    const x = paddingLeft + (idx / (trendData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
    return { x, y, val };
  });

  // Draw grid line (horizontal average line or zero line helper)
  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.moveTo(paddingLeft, paddingTop + chartHeight * 0.5);
  ctx.lineTo(paddingLeft + chartWidth, paddingTop + chartHeight * 0.5);
  ctx.strokeStyle = colors.gridColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // Draw gradient area underneath the line
  const areaGradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
  areaGradient.addColorStop(0, "rgba(95, 133, 101, 0.22)"); // Sage green alpha
  areaGradient.addColorStop(1, "rgba(95, 133, 101, 0.0)");

  ctx.beginPath();
  ctx.moveTo(points[0].x, paddingTop + chartHeight);
  
  // Custom curved path (Bezier curve)
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      ctx.lineTo(points[i].x, points[i].y);
    } else {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, curr.x, curr.y);
    }
  }
  ctx.lineTo(points[points.length - 1].x, paddingTop + chartHeight);
  ctx.closePath();
  ctx.fillStyle = areaGradient;
  ctx.fill();

  // Draw the main trend line
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      ctx.moveTo(points[i].x, points[i].y);
    } else {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, curr.x, curr.y);
    }
  }
  ctx.strokeStyle = colors.home;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  // Draw circles at data points
  points.forEach((pt, idx) => {
    const isLast = idx === points.length - 1;

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, isLast ? 5 : 4, 0, 2 * Math.PI);
    ctx.fillStyle = isLast ? colors.home : "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = colors.home;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw value text labels for endpoints or highlights
    if (isLast || idx === 0) {
      ctx.font = "700 0.6875rem 'DM Sans', sans-serif";
      ctx.fillStyle = colors.textPrimary;
      ctx.textAlign = "center";
      ctx.fillText(pt.val.toFixed(1), pt.x, pt.y - 10);
    }
  });
}
