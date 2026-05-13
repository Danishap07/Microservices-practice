.PHONY: build lint format test clean setup

# Build all TypeScript packages
build:
	npm run build --workspaces

# Run ESLint across all TypeScript files
lint:
	npx eslint . --ext .ts

# Auto-format with Prettier
format:
	npm run format

# Check formatting without editing
format-check:
	npm run format:check

# Run all tests
test:
	npm test

# Clean build outputs
clean:
	rm -rf packages/*/dist services/*/dist

# Full setup for new developers
setup:
	npm install
	npm run build --workspaces
	@echo "✓ Setup complete. Run 'make test' and 'make lint' to verify."

# Run everything locally (Docker Compose)
up:
	docker compose up --build

# Stop everything
down:
	docker compose down

# Show logs for a specific service (usage: make logs s=inventory)
logs:
	docker compose logs -f $(s)
