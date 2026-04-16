const { createCanvas } = require('canvas');
const fs = require('fs');

const luisWeights = [{"date":"2026-02-28","w":87.4},{"date":"2026-03-15","w":89.5},{"date":"2026-03-16","w":87.7},{"date":"2026-03-19","w":87.6},{"date":"2026-03-21","w":86.9},{"date":"2026-03-23","w":87.9},{"date":"2026-03-24","w":88},{"date":"2026-04-01","w":89.6},{"date":"2026-04-02","w":88.4},{"date":"2026-04-04","w":89},{"date":"2026-04-06","w":88.5}];
const mileyWeights = [{"date":"2026-02-28","w":50.4},{"date":"2026-03-20","w":51.4},{"date":"2026-03-23","w":51},{"date":"2026-03-24","w":51.4}];

const luisCals = [{"date":"2026-03-14","cal":1565},{"date":"2026-03-15","cal":3538},{"date":"2026-03-16","cal":1822},{"date":"2026-03-17","cal":2385},{"date":"2026-03-18","cal":2040},{"date":"2026-03-19","cal":2384},{"date":"2026-03-20","cal":2892},{"date":"2026-03-21","cal":2714},{"date":"2026-03-22","cal":2659},{"date":"2026-03-23","cal":2511},{"date":"2026-03-24","cal":2593},{"date":"2026-03-25","cal":2733},{"date":"2026-03-26","cal":3233},{"date":"2026-03-27","cal":2132},{"date":"2026-03-28","cal":2420},{"date":"2026-03-29","cal":3582},{"date":"2026-03-30","cal":2918},{"date":"2026-03-31","cal":2021},{"date":"2026-04-01","cal":2368},{"date":"2026-04-02","cal":2937},{"date":"2026-04-03","cal":1443},{"date":"2026-04-04","cal":2408},{"date":"2026-04-05","cal":2392},{"date":"2026-04-06","cal":2415}];
const mileyCals = [{"date":"2026-03-14","cal":1106},{"date":"2026-03-15","cal":2130},{"date":"2026-03-16","cal":1870},{"date":"2026-03-17","cal":1777},{"date":"2026-03-18","cal":1927},{"date":"2026-03-19","cal":1713},{"date":"2026-03-20","cal":1812},{"date":"2026-03-21","cal":2225},{"date":"2026-03-22","cal":2133},{"date":"2026-03-23","cal":1735},{"date":"2026-03-24","cal":1841},{"date":"2026-03-25","cal":2092},{"date":"2026-03-26","cal":1781},{"date":"2026-03-27","cal":1679},{"date":"2026-03-28","cal":2362},{"date":"2026-03-29","cal":3070},{"date":"2026-03-30","cal":1874},{"date":"2026-03-31","cal":1489},{"date":"2026-04-01","cal":1180},{"date":"2026-04-02","cal":1693},{"date":"2026-04-03","cal":1526},{"date":"2026-04-04","cal":1901},{"date":"2026-04-05","cal":1772},{"date":"2026-04-06","cal":2462}];

// Build date range
const allDates = [...new Set([...luisCals.map(d=>d.date), ...mileyCals.map(d=>d.date)])].sort();
const startDate = new Date('2026-03-14');

const W = 1200, H = 700;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#1a1a2e';
ctx.fillRect(0, 0, W, H);

const margin = { top: 60, right: 80, bottom: 80, left: 70 };
const plotW = W - margin.left - margin.right;
const plotH = H - margin.top - margin.bottom;

// Title
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 22px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Weight vs Calories — Luis & Miley', W/2, 35);

// Scales
const calMin = 800, calMax = 4000;
const dateToX = (dateStr) => {
  const d = new Date(dateStr);
  const daysDiff = (d - startDate) / (1000*60*60*24);
  const totalDays = (new Date('2026-04-07') - startDate) / (1000*60*60*24);
  return margin.left + (daysDiff / totalDays) * plotW;
};
const calToY = (cal) => margin.top + plotH - ((cal - calMin) / (calMax - calMin)) * plotH;

// Luis weight scale (right axis): 85-91
const lwMin = 85, lwMax = 91;
const luisWToY = (w) => margin.top + plotH - ((w - lwMin) / (lwMax - lwMin)) * plotH;
// Miley weight scale (far right): 49-53
const mwMin = 49, mwMax = 53;
const mileyWToY = (w) => margin.top + plotH - ((w - mwMin) / (mwMax - mwMin)) * plotH;

// Grid lines
ctx.strokeStyle = '#333355';
ctx.lineWidth = 0.5;
for (let cal = 1000; cal <= 4000; cal += 500) {
  const y = calToY(cal);
  ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(W - margin.right, y); ctx.stroke();
}

// Y-axis labels (calories)
ctx.fillStyle = '#aaaacc';
ctx.font = '12px sans-serif';
ctx.textAlign = 'right';
for (let cal = 1000; cal <= 4000; cal += 500) {
  ctx.fillText(cal + ' kcal', margin.left - 8, calToY(cal) + 4);
}

// X-axis labels
ctx.textAlign = 'center';
ctx.fillStyle = '#aaaacc';
const weeks = ['Mar 14', 'Mar 21', 'Mar 28', 'Apr 4'];
const weekDates = ['2026-03-14', '2026-03-21', '2026-03-28', '2026-04-04'];
weekDates.forEach((d, i) => {
  const x = dateToX(d);
  ctx.fillText(weeks[i], x, H - margin.bottom + 20);
  ctx.strokeStyle = '#333355';
  ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke();
});

// Helper: draw line
function drawLine(data, xFn, yFn, color, lineWidth = 2) {
  if (data.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = xFn(d), y = yFn(d);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// Helper: draw dots
function drawDots(data, xFn, yFn, color, radius = 4) {
  data.forEach(d => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(xFn(d), yFn(d), radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Draw calorie bars (thin)
const barWidth = plotW / allDates.length * 0.35;

luisCals.forEach(d => {
  const x = dateToX(d.date);
  const y = calToY(d.cal);
  const barH = calToY(calMin) - y;
  ctx.fillStyle = 'rgba(66, 135, 245, 0.35)';
  ctx.fillRect(x - barWidth, y, barWidth, barH);
});

mileyCals.forEach(d => {
  const x = dateToX(d.date);
  const y = calToY(d.cal);
  const barH = calToY(calMin) - y;
  ctx.fillStyle = 'rgba(245, 66, 132, 0.35)';
  ctx.fillRect(x, y, barWidth, barH);
});

// Luis calorie target line
ctx.setLineDash([5, 5]);
ctx.strokeStyle = 'rgba(66, 135, 245, 0.5)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(margin.left, calToY(2616));
ctx.lineTo(W - margin.right, calToY(2616));
ctx.stroke();

// Miley calorie target line (average ~1800)
ctx.strokeStyle = 'rgba(245, 66, 132, 0.5)';
ctx.beginPath();
ctx.moveTo(margin.left, calToY(1800));
ctx.lineTo(W - margin.right, calToY(1800));
ctx.stroke();
ctx.setLineDash([]);

// Weight lines
drawLine(luisWeights, d => dateToX(d.date), d => luisWToY(d.w), '#42a5f5', 3);
drawDots(luisWeights, d => dateToX(d.date), d => luisWToY(d.w), '#42a5f5', 5);

drawLine(mileyWeights, d => dateToX(d.date), d => mileyWToY(d.w), '#f54284', 3);
drawDots(mileyWeights, d => dateToX(d.date), d => mileyWToY(d.w), '#f54284', 5);

// Weight labels on dots
ctx.font = 'bold 11px sans-serif';
luisWeights.forEach(d => {
  ctx.fillStyle = '#42a5f5';
  ctx.textAlign = 'center';
  ctx.fillText(d.w + 'kg', dateToX(d.date), luisWToY(d.w) - 10);
});
mileyWeights.forEach(d => {
  ctx.fillStyle = '#f54284';
  ctx.textAlign = 'center';
  ctx.fillText(d.w + 'kg', dateToX(d.date), mileyWToY(d.w) - 10);
});

// Right axis labels
ctx.textAlign = 'left';
ctx.font = '11px sans-serif';
ctx.fillStyle = '#42a5f5';
for (let w = 86; w <= 90; w++) {
  ctx.fillText(w + 'kg', W - margin.right + 5, luisWToY(w) + 4);
}
ctx.fillStyle = '#f54284';
for (let w = 50; w <= 52; w++) {
  ctx.fillText(w + 'kg', W - margin.right + 45, mileyWToY(w) + 4);
}

// Legend
const legendY = H - 25;
ctx.font = 'bold 13px sans-serif';
// Luis
ctx.fillStyle = '#42a5f5';
ctx.fillRect(W/2 - 250, legendY - 10, 15, 15);
ctx.fillText('Luis (weight + calories)', W/2 - 230, legendY + 2);
// Miley
ctx.fillStyle = '#f54284';
ctx.fillRect(W/2 + 50, legendY - 10, 15, 15);
ctx.fillText('Miley (weight + calories)', W/2 + 70, legendY + 2);

// Axis labels
ctx.save();
ctx.translate(15, margin.top + plotH/2);
ctx.rotate(-Math.PI/2);
ctx.fillStyle = '#aaaacc';
ctx.font = '13px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Daily Calories (kcal)', 0, 0);
ctx.restore();

// Save
const buf = canvas.toBuffer('image/png');
fs.writeFileSync('/workspace/group/weight-calories-chart.png', buf);
console.log('Chart saved');
