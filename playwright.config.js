// @ts-check
const { defineConfig, devices } = require("@playwright/test");

// Begge profiler kører i Chromium, så testen virker uden WebKit installeret.
// iPhone-profilen giver iPhones skærmstørrelse, touch og user agent, men ikke Safaris motor.
module.exports = defineConfig({
  testDir: "test",
  testMatch: "e2e.spec.js",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    command: "node test/server.js",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: true
  },
  projects: [
    { name: "iphone-13", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "pixel-7", use: { ...devices["Pixel 7"] } }
  ]
});
