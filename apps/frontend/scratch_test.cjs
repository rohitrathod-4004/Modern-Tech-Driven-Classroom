const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  // Login first
  await page.goto('http://localhost:5173/login');
  await page.type('input[type="email"]', 'admin@example.com'); // Assume there's a login
  await page.type('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  // Navigate to lecture 6a0f8929885196ea9ae8a0b4
  await page.goto('http://localhost:5173/courses/6a0f8929885196ea9ae8a0b3/lectures/6a0f8929885196ea9ae8a0b4');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();
