const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    console.log('Navigating...');
    await page.goto('file://' + __dirname.replace(/\\/g, '/') + '/index.html', { waitUntil: 'networkidle0' });
    console.log('Done.');
    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
