.PHONY: dev build check preview clean install backup test test-watch test-e2e test-all

# Install dependencies and Playwright browsers
install:
	npm install
	npx playwright install chromium

# Start dev server
dev:
	npm run dev

# Run unit tests once
test:
	npm test

# Run unit tests in watch mode (for TDD)
test-watch:
	npm run test:watch

# Run end-to-end tests (Playwright)
test-e2e:
	npm run test:e2e

# Run unit tests, type-check, and e2e tests
test-all: test check test-e2e

# Type-check
check:
	npm run check

# Production build
build:
	npm run build

# Preview production build locally
preview: build
	npm run preview

# Back up the database
backup:
	@test -f data/trollskull.db || (echo "No database to back up." && exit 1)
	cp data/trollskull.db data/trollskull.db.bak
	@echo "Backed up to data/trollskull.db.bak"

# Reset database (delete and let schema re-create on next dev start)
clean:
	rm -f data/trollskull.db data/trollskull.db-shm data/trollskull.db-wal
	@echo "Database removed. Will be re-created on next 'make dev'."
