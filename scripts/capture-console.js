const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:5183/';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMsgs = [];
  page.on('console', msg => {
    consoleMsgs.push({ type: msg.type(), text: msg.text(), location: msg.location() });
  });

  page.on('pageerror', err => {
    consoleMsgs.push({ type: 'pageerror', text: err.message, stack: err.stack });
  });

  try {
    console.log('Opening', url);
    await page.goto(url, { waitUntil: 'networkidle' });
    // Games pages were removed in this deployment. Try to find any links to games
    // but don't navigate to hardcoded game routes.
    const link = await page.$(`text=/SpellBee|Spell Bee|Spellbee|Spell-bee|Games|Play/i`);
    if (link) {
      console.log('Found a link/button mentioning games or SpellBee; clicking to capture console output...');
      await link.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('No game links found on homepage. Games routes have been removed from this build.');
    }

    console.log('\n=== Captured Console / Page Errors ===');
    if (consoleMsgs.length === 0) console.log('No console messages captured.');
    for (const m of consoleMsgs) {
      console.log('---');
      console.log('TYPE:', m.type);
      console.log('TEXT:', m.text);
      if (m.location) console.log('LOCATION:', m.location);
      if (m.stack) console.log('STACK:\n', m.stack);
    }
  } catch (err) {
    console.error('Error during page navigation:', err);
  } finally {
    await browser.close();
  }
})();
