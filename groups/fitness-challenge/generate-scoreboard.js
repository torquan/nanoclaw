const { createCanvas } = require('canvas');
const fs = require('fs');

const W = 900, H = 780;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#0f0f1a';
ctx.fillRect(0, 0, W, H);

// Accent bar at top
const topGrad = ctx.createLinearGradient(0, 0, W, 0);
topGrad.addColorStop(0, '#42a5f5');
topGrad.addColorStop(1, '#f54284');
ctx.fillStyle = topGrad;
ctx.fillRect(0, 0, W, 4);

// Title
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 24px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('WEEKLY SCOREBOARD', W/2, 40);
ctx.font = '14px sans-serif';
ctx.fillStyle = '#888899';
ctx.fillText('Week 3  •  Mar 31 – Apr 6, 2026  •  Day 19–24 of 90', W/2, 62);

// Season record
ctx.font = 'bold 15px sans-serif';
ctx.fillStyle = '#ffcc00';
ctx.fillText('Season: Luis 1 — Miley 1', W/2, 84);

const tableTop = 105;
const rowH = 38;
const col0 = 30; // Category
const col1 = 310; // Weight
const col2 = 400; // Luis
const col3 = 550; // Luis Score
const col4 = 650; // Miley
const col5 = 800; // Miley Score

function drawRow(y, cells, isHeader, highlight) {
  if (isHeader) {
    ctx.fillStyle = '#1a1a33';
    ctx.fillRect(col0 - 10, y - 2, W - 40, rowH);
    ctx.fillStyle = '#aaaacc';
    ctx.font = 'bold 12px sans-serif';
  } else {
    if (highlight) {
      ctx.fillStyle = '#111122';
      ctx.fillRect(col0 - 10, y - 2, W - 40, rowH);
    }
    ctx.fillStyle = '#ccccdd';
    ctx.font = '13px sans-serif';
  }

  ctx.textAlign = 'left';
  ctx.fillText(cells[0], col0, y + 16);
  ctx.textAlign = 'center';
  ctx.fillText(cells[1], col1, y + 16);

  // Luis value
  ctx.fillStyle = '#42a5f5';
  ctx.font = isHeader ? 'bold 12px sans-serif' : 'bold 13px sans-serif';
  ctx.fillText(cells[2], col2, y + 16);
  ctx.fillText(cells[3], col3, y + 16);

  // Miley value
  ctx.fillStyle = '#f54284';
  ctx.fillText(cells[4], col4, y + 16);
  ctx.fillText(cells[5], col5, y + 16);
}

// Header
drawRow(tableTop, ['Category', 'Weight', 'Luis', 'Score', 'Miley', 'Score'], true);

// Data rows
const data = [
  ['Workout Consistency', '25%', '3/4 (75%)', '18.8', '3/3 (100%)', '25.0', true],
  ['Nutrition Logging', '20%', '7/7 (100%)', '20.0', '7/7 (100%)', '20.0', false],
  ['Protein Target Hit', '20%', '4/7 (57%)', '11.4', '7/7 (100%)', '20.0', true],
  ['Calorie Adherence*', '—', '84%', '—', '87%', '—', false],
  ['Volume Progression', '15%', '-30%', '0.0', '-26%', '0.0', true],
  ['Wellness Logging', '10%', '5/7 (71%)', '7.1', '5/7 (71%)', '7.1', false],
  ['Bonus (PRs)', '10%', '6 PRs', '7.0', '6 PRs', '7.0', true],
];

data.forEach((row, i) => {
  drawRow(tableTop + (i + 1) * rowH, row, false, row[6]);
});

// Total row
const totalY = tableTop + 8 * rowH;
ctx.fillStyle = '#1a1a44';
ctx.fillRect(col0 - 10, totalY - 2, W - 40, rowH + 4);
ctx.font = 'bold 16px sans-serif';
ctx.textAlign = 'left';
ctx.fillStyle = '#ffffff';
ctx.fillText('TOTAL', col0, totalY + 18);
ctx.textAlign = 'center';
ctx.fillStyle = '#42a5f5';
ctx.fillText('64.3', (col2 + col3) / 2, totalY + 18);
ctx.fillStyle = '#f54284';
ctx.fillText('79.1', (col4 + col5) / 2, totalY + 18);

// Winner banner
const winY = totalY + 55;
ctx.fillStyle = '#f54284';
ctx.font = 'bold 20px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('🏆  WEEK 3 WINNER: MILEY  🏆', W/2, winY);
ctx.font = '14px sans-serif';
ctx.fillStyle = '#ccccdd';
ctx.fillText('79.1 vs 64.3  (+14.8 margin)', W/2, winY + 22);
ctx.fillStyle = '#ffcc00';
ctx.font = 'bold 15px sans-serif';
ctx.fillText('Season: Luis 1 — Miley 2', W/2, winY + 48);

// Detail sections
const detY = winY + 80;
ctx.textAlign = 'left';
ctx.font = 'bold 14px sans-serif';
ctx.fillStyle = '#ffcc00';
ctx.fillText('PROTEIN BREAKDOWN', col0, detY);

ctx.font = '12px sans-serif';
const luisProtein = [
  ['Mar 31', '173g', '✅'], ['Apr 1', '238g', '✅'], ['Apr 2', '187g', '✅'],
  ['Apr 3', '90g', '❌'], ['Apr 4', '122g', '❌'], ['Apr 5', '141g', '❌'], ['Apr 6', '164g', '✅']
];
const mileyProtein = [
  ['Mar 31', '94g', '✅'], ['Apr 1', '117g', '✅'], ['Apr 2', '82g', '✅'],
  ['Apr 3', '82g', '✅'], ['Apr 4', '81g', '✅'], ['Apr 5', '111g', '✅'], ['Apr 6', '125g', '✅']
];

ctx.fillStyle = '#42a5f5';
ctx.font = 'bold 12px sans-serif';
ctx.fillText('Luis (target: 160g)', col0, detY + 20);
ctx.font = '11px sans-serif';
luisProtein.forEach((r, i) => {
  ctx.fillStyle = r[2] === '✅' ? '#44cc88' : '#ff5555';
  ctx.fillText(r[0] + ': ' + r[1] + ' ' + r[2], col0 + (i % 4) * 110, detY + 38 + Math.floor(i / 4) * 16);
});

ctx.fillStyle = '#f54284';
ctx.font = 'bold 12px sans-serif';
ctx.fillText('Miley (target: 80g)', col2 + 50, detY + 20);
ctx.font = '11px sans-serif';
mileyProtein.forEach((r, i) => {
  ctx.fillStyle = '#44cc88';
  ctx.fillText(r[0] + ': ' + r[1] + ' ' + r[2], col2 + 50 + (i % 4) * 110, detY + 38 + Math.floor(i / 4) * 16);
});

// PRs section
const prY = detY + 80;
ctx.fillStyle = '#ffcc00';
ctx.font = 'bold 14px sans-serif';
ctx.fillText('PERSONAL RECORDS', col0, prY);

ctx.font = '11px sans-serif';
ctx.fillStyle = '#42a5f5';
ctx.fillText('Luis: Smith Hip Thrust 100.4kg (+35kg!), Rear-Delt Fly 40kg, Ab Crunch 50kg, Torso Rot 52.5kg, Calf 60kg, Row 47.5kg', col0, prY + 18);
ctx.fillStyle = '#f54284';
ctx.fillText('Miley: Hip Thrust 140.4kg (+7.5kg), Deadlift 70kg (+5kg), Back Extension 25kg, Squat 40kg, Dip 27.5kg, Row 30kg', col0, prY + 36);

// Callout
const coY = prY + 62;
ctx.fillStyle = '#ffcc00';
ctx.font = 'bold 14px sans-serif';
ctx.fillText('CALLOUT OF THE WEEK', col0, coY);
ctx.font = '12px sans-serif';
ctx.fillStyle = '#ccccdd';
ctx.fillText('Miley hit protein 7/7 days — perfect week. Luis missed 3 days, including a brutal 90g on Apr 3.', col0, coY + 20);
ctx.fillText('Both volume dropped ~30% vs Week 2. Intensity there, but fewer total sets.', col0, coY + 38);

// Footnote
ctx.fillStyle = '#555566';
ctx.font = '10px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('* Calorie adherence shown for reference (not scored). Luis target: 2,616 kcal | Miley: 2,000 training / 1,600 rest days.', W/2, H - 15);

const buf = canvas.toBuffer('image/png');
fs.writeFileSync('/workspace/group/scoreboard-week3.png', buf);
console.log('Scoreboard saved');
