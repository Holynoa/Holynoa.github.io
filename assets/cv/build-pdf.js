// Builds assets/Resume-Noa-Yaakobovitz.pdf from assets/cv/resume.html (needs Node + Playwright).
//   node assets/cv/build-pdf.js
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const src = path.join(__dirname, "resume.html");
  const out = path.join(__dirname, "..", "Resume-Noa-Yaakobovitz.pdf");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("file://" + src, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const over = await page.evaluate(() => document.body.scrollHeight - document.body.clientHeight);
  if (over > 0) console.warn(`Warning: content is ${over}px taller than one A4 page and will be cut off.`);
  await page.pdf({ path: out, format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await browser.close();
  console.log("Wrote " + out);
})();
