# 🧪 Origin Energy UI Automation (Playwright + TypeScript)

This project automates the **Origin Energy Pricing Page** using **Playwright** with **TypeScript** and the **Page Object Model (POM)** pattern.

---

## 🎯 Scenario Automated

1. Navigate to [Origin Energy Pricing Page](https://www.originenergy.com.au/pricing.html)
2. Search for an address (e.g. `17 Bolinda Road, Balwyn North, VIC 3104`)
3. Select the address from suggestions
4. Verify that the list of plans appears
5. Uncheck the **Electricity** checkbox
6. Verify that plans are still displayed
7. Open a random plan link (opens PDF in a new tab)
8. Verify that the plan details page opens in a new tab
9. Download the plan PDF
10. Verify that the PDF is a **Gas plan**

---

## ⚙️ Tech Stack

- **Playwright** (UI automation framework)
- **TypeScript**
- **Page Object Model (POM)** design pattern
- **Node.js / npm**
- **pdf-parse** (for PDF validation)
- **HTML test report**

---

## 🧩 Project Structure

```

origin-energy-automation/
├── config/               # Constants for timeouts, URLs, etc.
│   └── constants.ts
├── pages/                # Page Object Model classes
│   └── PricingPage.ts
├── tests/                # Playwright test files
│   └── origin-energy.spec.ts
├── playwright.config.ts  # Playwright config (timeouts, workers, etc.)
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md

````

---

## 🛠️ Setup Instructions

### 1️⃣ Clone the project

```bash

git clone https://github.com/YOUR_GITHUB_USERNAME/origin-energy-automation.git
cd origin-energy-automation
````

### 2️⃣ Install dependencies

```bash

npm install
```

### 3️⃣ Install Playwright browsers

```bash

npx playwright install
```

### 4️⃣ Run the test locally

```bash

npx playwright test
```

### 5️⃣ View HTML test report

```bash

npx playwright show-report
```

---

### 🐳 Run in Docker
### Build and run tests
```bash

docker build -t origin-energy-tests .
docker run --rm -v ./playwright-report:/app/playwright-report origin-energy-tests
```
### Or use docker-compose
```bash

docker-compose up --build
```
After tests finish, open:
```bash

playwright-report/index.html
```

## 🧠 Notes & Best Practices

* Uses **`test.step()`** for readable, structured test reports.
* All constants (timeouts, base URL, delays) are centralized in `config/constants.ts`.
* The code follows **Playwright best practices** for:
    * Explicit waits (`toBeVisible`, `waitForLoadState`)
    * Reusable locators
    * Page Object Model structure
* The test automatically **verifies PDF content** to confirm it’s a Gas plan.
* Failures automatically capture **screenshots** and **videos** (see `/playwright-report`).

---

## ⚡ Example Command Summary

| Action               | Command                      |
| -------------------- | ---------------------------- |
| Run tests            | `npx playwright test`        |
| Open report          | `npx playwright show-report` |
| Install dependencies | `npm install`                |
| Install browsers     | `npx playwright install`     |


## 🧑‍💻 Author

**Igor**
Senior QA Automation Engineer
---
