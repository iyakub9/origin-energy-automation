# Use official Playwright image with browsers preinstalled
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app

# Copy dependencies first
COPY package*.json ./
RUN npm ci

# Copy test code
COPY . .

# Install browsers (safely re-runs even if preinstalled)
RUN npx playwright install --with-deps

# Run tests in headless mode by default
CMD ["npx", "playwright", "test", "--reporter=html"]