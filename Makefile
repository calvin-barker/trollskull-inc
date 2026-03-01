.PHONY: dev build check preview clean install backup test test-watch

# Development
dev:
	npm run dev

# Run tests once
test:
	npm test

# Run tests in watch mode (for TDD)
test-watch:
	npm run test:watch

# Type-check
check:
	npm run check

# Production build
build:
	npm run build

# Preview production build locally
preview: build
	npm run preview

# Install dependencies
install:
	npm install

# Back up the database (git commit the db file)
backup:
	@test -f data/trollskull.db || (echo "No database to back up." && exit 1)
	cp data/trollskull.db data/trollskull.db.bak
	@echo "Backed up to data/trollskull.db.bak"

# Reset database (delete and let schema re-create on next dev start)
clean:
	rm -f data/trollskull.db data/trollskull.db-shm data/trollskull.db-wal
	@echo "Database removed. Will be re-created on next 'make dev'."
