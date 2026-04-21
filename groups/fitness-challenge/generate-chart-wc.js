const { createCanvas } = require('canvas');
const fs = require('fs');

const luisWeights = [{"date":"2026-02-28","w":87.4},{"date":"2026-03-15","w":89.5},{"date":"2026-03-16","w":87.7},{"date":"2026-03-19","w":87.6},{"date":"2026-03-19","w":88},{"date":"2026-03-21","w":86.9},{"date":"2026-03-23","w":87.9},{"date":"2026-03-24","w":88},{"date":"2026-04-01","w":89.6},{"date":"2026-04-02","w":88.4},{"date":"2026-04-04","w":89},{"date":"2026-04-06","w":88.5},{"date":"2026-04-11","w":87.5},{"date":"2026-04-14","w":88.5},{"date":"2026-04-15","w":88},{"date":"2026-04-16","w":88},{"date":"2026-04-17","w":88},{"date":"2026-04-18","w":87.5}];
const mileyWeights = [{"date":"2026-02-28","w":50.4},{"date":"2026-03-20","w":51.4},{"date":"2026-03-23","w":51},{"date":"2026-03-24","w":51.4},{"date":"2026-04-08","w":52}];

const luisCals = [{"date":"2026-03-14","cal":1565},{"date":"2026-03-15","cal":3538},{"date":"2026-03-16","cal":1822},{"date":"2026-03-17","cal":2385},{"date":"2026-03-18","cal":2040},{"date":"2026-03-19","cal":2384},{"date":"2026-03-20","cal":2892},{"date":"2026-03-21","cal":2714},{"date":"2026-03-22","cal":2659},{"date":"2026-03-23","cal":2511},{"date":"2026-03-24","cal":2593},{"date":"2026-03-25","cal":2733},{"date":"2026-03-26","cal":3233},{"date":"2026-03-27","cal":2132},{"date":"2026-03-28","cal":2420},{"date":"2026-03-29","cal":3582},{"date":"2026-03-30","cal":2918},{"date":"2026-03-31","cal":2021},{"date":"2026-04-01","cal":2368},{"date":"2026-04-02","cal":2937},{"date":"2026-04-03","cal":1443},{"date":"2026-04-04","cal":2408},{"date":"2026-04-05","cal":2392},{"date":"2026-04-06","cal":2415},{"date":"2026-04-07","cal":2617},{"date":"2026-04-08","cal":2184},{"date":"2026-04-09","cal":2668},{"date":"2026-04-10","cal":3188},{"date":"2026-04-11","cal":2857},{"date":"2026-04-12","cal":2277},{"date":"2026-04-13","cal":2740},{"date":"2026-04-14","cal":1990},{"date":"2026-04-15","cal":2722},{"date":"2026-04-16","cal":2687},{"date":"2026-04-17","cal":2386},{"date":"2026-04-18","cal":2054}];
const mileyCals = [{"date":"2026-03-14","cal":1106},{"date":"2026-03-15","cal":2130},{"date":"2026-03-16","cal":1870},{"date":"2026-03-17","cal":1777},{"date":"2026-03-18","cal":1927},{"date":"2026-03-19","cal":1713},{"date":"2026-03-20","cal":1812},{"date":"2026-03-21","cal":2225},{"date":"2026-03-22","cal":2133},{"date":"2026-03-23","cal":1735},{"date":"2026-03-24","cal":1841},{"date":"2026-03-25","cal":2092},{"date":"2026-03-26","cal":1781},{"date":"2026-03-27","cal":1679},{"date":"2026-03-28","cal":2362},{"date":"2026-03-29","cal":3070},{"date":"2026-03-30","cal":1874},{"date":"2026-03-31","cal":1489},{"date":"2026-04-01","cal":1180},{"date":"2026-04-02","cal":1693},{"date":"2026-04-03","cal":1526},{"date":"2026-04-04","cal":1901},{"date":"2026-04-05","cal":1772},{"date":"2026-04-06","cal":2462},{"date":"2026-04-07","cal":1520},{"date":"2026-04-08","cal":1626},{"date":"2026-04-09","cal":1496},{"date":"2026-04-10","cal":1573},{"date":"2026-04-11","cal":2576},{"date":"2026-04-12","cal":1012},{"date":"2026-04-13","cal":1855},{"date":"2026-04-14","cal":1750},{"date":"2026-04-15","cal":1599},{"date":"2026-04-16","cal":1626},{"date":"2026-04-17","cal":1586},{"date":"2026-04-18","cal":1975}];

function rollingAvg(data, window = 5) {
  return data.map((d, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((s, x) => s + x.cal, 0) / slice.length;
    return { date: d.date, cal: Math.round(avg) };
  });
}

const luisAvg = rollingAvg(luisCals, 5);
const mileyAvg = rollingAvg(mileyCals, 5);

const startDate = new Date('2026-03-14');
const endDate = new Date('2026-04-18');
const totalDays = (endDate - startDate) / (1000*60*60*24);

function drawChart(name, cals, avg, weights, calTarget, weightRange, accentColor, accentLight, accentDark, filename, subtitle) {
  const W = 1100, H = 520;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, 0, 120);
  grad.addColorStop(0, accentDark);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 120);

  const margin = { top: 65, right: 75, bottom: 60, left: 65 };
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(name, margin.left, 30);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#888899';
  ctx.fillText(subtitle, margin.left, 50);

  const dateToX = (dateStr) => {
    const d = new Date(dateStr);
    const daysDiff = (d - startDate) / (1000*60*60*24);
    return margin.left + (daysDiff / totalDays) * plotW;
  };

  const calMin = 800, calMax = 4000;
  const calToY = (cal) => margin.top + plotH - ((cal - calMin) / (calMax - calMin)) * plotH;

  const [wMin, wMax] = weightRange;
  const wToY = (w) => margin.top + plotH - ((w - wMin) / (wMax - wMin)) * plotH;

  ctx.strokeStyle = '#1a1a33';
  ctx.lineWidth = 0.8;
  for (let cal = 1000; cal <= 3500; cal += 500) {
    const y = calToY(cal);
    ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(W - margin.right, y); ctx.stroke();
  }

  ctx.fillStyle = '#666688';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  for (let cal = 1000; cal <= 3500; cal += 500) {
    ctx.fillText(cal.toLocaleString(), margin.left - 10, calToY(cal) + 4);
  }
  ctx.save();
  ctx.translate(14, margin.top + plotH/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillStyle = '#666688';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Calories (kcal)', 0, 0);
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.fillStyle = accentColor;
  ctx.font = '11px sans-serif';
  const wStep = (wMax - wMin) > 3 ? 1 : 0.5;
  for (let w = Math.ceil(wMin); w <= wMax; w += wStep) {
    ctx.fillText(w + 'kg', W - margin.right + 8, wToY(w) + 4);
  }
  ctx.save();
  ctx.translate(W - 12, margin.top + plotH/2);
  ctx.rotate(Math.PI/2);
  ctx.fillStyle = accentColor;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Weight (kg)', 0, 0);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#666688';
  ctx.font = '11px sans-serif';
  const xLabels = [
    ['Mar 14', '2026-03-14'], ['Mar 21', '2026-03-21'],
    ['Mar 28', '2026-03-28'], ['Apr 4', '2026-04-04'],
    ['Apr 11', '2026-04-11'], ['Apr 18', '2026-04-18']
  ];
  xLabels.forEach(([label, d]) => {
    const x = dateToX(d);
    ctx.fillText(label, x, H - margin.bottom + 18);
    ctx.strokeStyle = '#1a1a33';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke();
  });

  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#555577';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin.left, calToY(calTarget));
  ctx.lineTo(W - margin.right, calToY(calTarget));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#555577';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Target ' + calTarget + ' kcal', W - margin.right, calToY(calTarget) - 6);

  const barW = Math.max(plotW / totalDays * 0.65, 6);
  cals.forEach(d => {
    const x = dateToX(d.date);
    const y = calToY(d.cal);
    const h = calToY(calMin) - y;
    const barGrad = ctx.createLinearGradient(0, y, 0, y + h);
    barGrad.addColorStop(0, accentLight);
    barGrad.addColorStop(1, accentDark);
    ctx.fillStyle = barGrad;
    const r = Math.min(3, barW/2);
    ctx.beginPath();
    ctx.moveTo(x - barW/2 + r, y);
    ctx.arcTo(x + barW/2, y, x + barW/2, y + r, r);
    ctx.lineTo(x + barW/2, y + h);
    ctx.lineTo(x - barW/2, y + h);
    ctx.arcTo(x - barW/2, y, x - barW/2 + r, y, r);
    ctx.fill();
  });

  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  avg.forEach((d, i) => {
    const x = dateToX(d.date), y = calToY(d.cal);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  if (weights.length >= 2) {
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    weights.forEach((d, i) => {
      const x = dateToX(d.date), y = wToY(d.w);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    weights.forEach(d => {
      const x = dateToX(d.date), y = wToY(d.w);
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 8;
      ctx.fillStyle = accentColor;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0f0f1a';
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.w + '', x, y - 12);
    });
  }

  const ly = H - 18;
  ctx.font = '12px sans-serif';

  ctx.fillStyle = accentLight;
  ctx.fillRect(margin.left, ly - 9, 14, 10);
  ctx.fillStyle = '#aaaacc';
  ctx.textAlign = 'left';
  ctx.fillText('Daily Calories', margin.left + 18, ly);

  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(margin.left + 140, ly - 4); ctx.lineTo(margin.left + 160, ly - 4); ctx.stroke();
  ctx.fillStyle = '#aaaacc';
  ctx.fillText('5-Day Rolling Avg', margin.left + 165, ly);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(margin.left + 310, ly - 4); ctx.lineTo(margin.left + 330, ly - 4); ctx.stroke();
  ctx.fillStyle = accentColor;
  ctx.beginPath(); ctx.arc(margin.left + 320, ly - 4, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#aaaacc';
  ctx.textAlign = 'left';
  ctx.fillText('Weight', margin.left + 336, ly);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buf);
  console.log('Saved', filename);
}

drawChart('Luis', luisCals, luisAvg, luisWeights, 2616,
  [85.5, 91], '#42a5f5', 'rgba(66,165,245,0.55)', 'rgba(66,165,245,0.08)',
  '/workspace/group/chart-luis-wc.png',
  'Weight & Daily Calories  \u2022  Mar 14 \u2013 Apr 18, 2026');

drawChart('Miley', mileyCals, mileyAvg, mileyWeights, 1800,
  [49.5, 53], '#f54284', 'rgba(245,66,132,0.55)', 'rgba(245,66,132,0.08)',
  '/workspace/group/chart-miley-wc.png',
  'Weight & Daily Calories  \u2022  Mar 14 \u2013 Apr 18, 2026');
