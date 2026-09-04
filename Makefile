PORT ?= 8080

.PHONY: up dev down logs build publish setup help

up: ## Build & start on http://localhost:$(PORT)
	@PORT=$(PORT) docker compose up -d --build
	@echo "→ http://localhost:$(PORT)"

dev: ## Local dev server (no Docker)
	@npm install && npm run dev

down: ## Stop & remove containers
	@docker compose down

logs: ## Follow nginx logs
	@docker compose logs -f

build: ## Build the image without starting
	@docker compose build

setup: ## chmod scripts & install node deps
	@chmod +x up.sh publish.sh
	@npm install

publish: ## Push image to ghcr.io/oak8989/volunteertrac
	@docker build -t ghcr.io/oak8989/volunteertrac:latest .
	@docker push ghcr.io/oak8989/volunteertrac:latest

help: ## Show all targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  make \033[1m%-8s\033[0m %s\n", $$1, $$2}'
