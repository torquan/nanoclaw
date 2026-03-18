#!/usr/bin/env node
// Usage: node table-image.js <output.png> <title> <json-headers> <json-rows>
// Generates a styled dark-theme table as a PNG image.

const fs = require('fs');
const { execSync } = require('child_process');

const [,, output, title, headersJson, rowsJson] = process.argv;
const headers = JSON.parse(headersJson);
const rows = JSON.parse(rowsJson);

const headerCells = headers.map(h => `<th>${h}</th>`).join('');
const bodyRows = rows.map(row => {
  const cells = row.map((cell, i) => `<td class="${i === 0 ? 'first' : ''}">${cell}</td>`).join('');
  return `<tr>${cells}</tr>`;
}).join('');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: fit-content; width: fit-content; }
  body {
    background: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 20px;
    display: inline-block;
    min-width: 320px;
  }
  h2 {
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    letter-spacing: 0.03em;
  }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th {
    background: #2a2a2a;
    color: #888;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.08em;
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #333;
  }
  td {
    padding: 8px 12px;
    color: #ddd;
    border-bottom: 1px solid #252525;
    white-space: nowrap;
  }
  td.first { color: #fff; font-weight: 500; }
  tr:last-child td { border-bottom: none; }
</style>
</head>
<body>
  ${title ? `<h2>${title}</h2>` : ''}
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;

const htmlPath = output.replace(/\.png$/, '.html');
fs.writeFileSync(htmlPath, html);

// Take screenshot via agent-browser, get body dimensions, then crop
const rawPng = output.replace(/\.png$/, '-raw.png');
execSync(`agent-browser open "file://${htmlPath}"`, { stdio: 'inherit' });
const boundsJson = execSync(`agent-browser eval "JSON.stringify(document.body.getBoundingClientRect())"`).toString().trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
const bounds = JSON.parse(boundsJson);
const w = Math.ceil(bounds.width);
const h = Math.ceil(bounds.height);
execSync(`agent-browser screenshot "${rawPng}" --full`);
execSync(`agent-browser close`);

// Crop using sharp
const sharp = require('/workspace/extra/fitness-challenge/node_modules/sharp');
sharp(rawPng)
  .extract({ left: 0, top: 0, width: w, height: h })
  .toBuffer()
  .then(buf => {
    fs.writeFileSync(output, buf);
    fs.unlinkSync(rawPng);
    console.log(output);
  })
  .catch(err => {
    // Fallback: just use raw
    fs.copyFileSync(rawPng, output);
    fs.unlinkSync(rawPng);
    console.log(output);
  });
