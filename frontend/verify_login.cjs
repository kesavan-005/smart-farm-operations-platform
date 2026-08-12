const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/');

    console.log('Waiting for page load...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(__dirname, 'step1_landing.png') });
    console.log('Screenshot of landing page saved as step1_landing.png');

    // Click "Register" or similar if we see it, or fill phone if already on login/register page
    console.log('Checking if we need to navigate to login/register form...');
    const registerLink = page.locator('text=Register here, text=Create an account, text=Sign up');
    if (await registerLink.count() > 0) {
      console.log('Clicking registration link...');
      await registerLink.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(__dirname, 'step2_register_page.png') });
    }

    // Check if we are on the form. Let's see if Name and Mobile Number are required.
    // If we already registered this user, let's try to just log in, or fill the fields.
    // Let's check for phone input.
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="Phone"], input[placeholder*="Mobile"]');
    const nameInput = page.locator('input[placeholder*="Name"], input[placeholder*="name"]');

    if (await nameInput.count() > 0 && await nameInput.isVisible()) {
      console.log('Filling out Registration Form...');
      await nameInput.fill('John Doe');
      await phoneInput.fill('9876543210');
      await page.screenshot({ path: path.join(__dirname, 'step3_filled_register.png') });
      console.log('Clicking Send OTP...');
      const sendOtpBtn = page.locator('button:has-text("Send OTP"), button:has-text("OTP"), button[type="submit"]');
      await sendOtpBtn.first().click();
    } else if (await phoneInput.count() > 0 && await phoneInput.isVisible()) {
      console.log('Filling out Login Form...');
      await phoneInput.fill('9876543210');
      await page.screenshot({ path: path.join(__dirname, 'step3_filled_login.png') });
      console.log('Clicking Send OTP...');
      const sendOtpBtn = page.locator('button:has-text("Send OTP"), button:has-text("OTP")');
      await sendOtpBtn.first().click();
    } else {
      console.log('Could not find input fields. Current DOM:');
      const html = await page.content();
      console.log(html.substring(0, 1000));
      throw new Error('Form fields not found.');
    }

    console.log('Waiting for OTP generation...');
    await page.waitForTimeout(5000);

    // Read the backend log file
    const logPath = 'C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\db0f6b75-ccc3-4229-99d2-bc6ad2117f2d\\.system_generated\\tasks\\task-132.log';
    console.log(`Reading backend logs from: ${logPath}`);
    if (!fs.existsSync(logPath)) {
      throw new Error(`Backend log file not found at ${logPath}`);
    }

    const logs = fs.readFileSync(logPath, 'utf8');
    const lines = logs.split('\n');
    let otp = null;

    // Search from the bottom of the log file for the latest OTP
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('Your Smart Farm code is:')) {
        const match = line.match(/Your Smart Farm code is:\s*(\d{6})/);
        if (match) {
          otp = match[1];
          console.log(`Found OTP code: ${otp} from log line: "${line.trim()}"`);
          break;
        }
      }
    }

    if (!otp) {
      throw new Error('Failed to find OTP code in backend logs!');
    }

    // Now fill the OTP code
    console.log('Entering OTP...');
    const otpInput = page.locator('input[placeholder*="OTP"], input[placeholder*="code"], input[placeholder*="6-digit"]');
    await otpInput.fill(otp);
    await page.screenshot({ path: path.join(__dirname, 'step4_filled_otp.png') });

    // Click Login/Verify
    console.log('Clicking Verify OTP...');
    const verifyBtn = page.locator('button:has-text("Verify OTP"), button:has-text("Login"), button:has-text("Submit"), button[type="submit"]');
    await verifyBtn.first().click();

    console.log('Waiting for dashboard navigation...');
    await page.waitForTimeout(6000);

    await page.screenshot({ path: path.join(__dirname, 'step5_dashboard.png') });
    console.log('Screenshot of dashboard saved as step5_dashboard.png');

    // Confirm dashboard load by checking url or content
    const url = page.url();
    console.log(`Current page URL: ${url}`);
    if (url.includes('dashboard') || await page.locator('text=Dashboard').count() > 0) {
      console.log('SUCCESS: Successfully logged in and redirected to the dashboard!');
    } else {
      console.log('WARNING: Not redirected to dashboard. Check step5_dashboard.png.');
    }

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
