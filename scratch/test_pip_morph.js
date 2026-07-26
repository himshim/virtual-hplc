import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to HPLC simulator...');
  await page.goto('http://localhost:8000/instruments/hplc/index.html', { waitUntil: 'networkidle' });

  await page.click('[data-mode="standard"]');
  await page.waitForTimeout(300);
  await page.click('#pumpBtn');
  await page.waitForTimeout(2500);
  await page.click('#injectBtn');
  await page.waitForTimeout(500);

  const rectBefore = await page.$eval('#chromatogramSentinel', el => el.getBoundingClientRect());
  console.log('Sentinel rect before scroll:', rectBefore);

  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(500);

  const rectAfter = await page.$eval('#chromatogramSentinel', el => el.getBoundingClientRect());
  console.log('Sentinel rect after scroll:', rectAfter);

  const containerClasses = await page.$eval('.chromatogram-container', el => el.className);
  console.log('Scroll down className:', containerClasses);

  await browser.close();
})();
