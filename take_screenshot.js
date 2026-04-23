const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to a common laptop size
  await page.setViewport({ width: 1440, height: 900 });
  
  // Use file protocol for local index.html
  const fileUrl = 'file://' + path.resolve(__dirname, 'index.html');
  console.log('Navigating to', fileUrl);
  
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  // Get dimensions of the page body to check scrollability
  const dimensions = await page.evaluate(() => {
    return {
      bodyScrollHeight: document.body.scrollHeight,
      bodyClientHeight: document.body.clientHeight,
      homeSectionHeight: document.getElementById('home-section').offsetHeight,
      homeSectionScrollHeight: document.getElementById('home-section').scrollHeight,
      windowInnerHeight: window.innerHeight,
      productsSectionHeight: document.getElementById('products-section').offsetHeight
    };
  });
  
  console.log('Dimensions:', dimensions);
  
  await page.screenshot({ path: 'screenshot.png' });
  console.log('Saved screenshot to screenshot.png');
  
  await browser.close();
})();
