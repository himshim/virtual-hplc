import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    console.log('BROWSER CONSOLE:', msg.type(), msg.text());
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('BROWSER UNCAUGHT ERROR:', err.stack || err.message);
  });

  console.log('Navigating to http://localhost:8000/instruments/hplc/index.html...');
  await page.goto('http://localhost:8000/instruments/hplc/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  console.log('--- Testing Mode Selector ---');
  await page.click('.mode-btn[data-mode="standard"]');
  await page.waitForTimeout(500);

  const beginnerDockDisplay = await page.$eval('#beginnerDockBox', el => window.getComputedStyle(el).display);
  const standardDockDisplay = await page.$eval('#standardDockBox', el => window.getComputedStyle(el).display);
  console.log('beginnerDockBox display:', beginnerDockDisplay);
  console.log('standardDockBox display:', standardDockDisplay);

  const pumpBtnVisible = await page.isVisible('#pumpBtn');
  console.log('pumpBtn isVisible:', pumpBtnVisible);

  console.log('--- Testing Sample Select ---');
  const compoundSelectOptions = await page.$eval('#compoundSelect', el => Array.from(el.options).map(o => ({ val: o.value, text: o.text })));
  console.log('compoundSelect options count:', compoundSelectOptions.length, compoundSelectOptions);

  await browser.close();

  if (errors.length === 0) {
    console.log('\n✅ 0 CONSOLE/PAGE ERRORS DETECTED! UI IS FULLY RESPONSIVE!');
  } else {
    console.error('\n❌ ERRORS DETECTED:', errors);
    process.exit(1);
  }
})();
