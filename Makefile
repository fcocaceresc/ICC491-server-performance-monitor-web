IMAGE_NAME := server-performance-monitor-web
CONTAINER_NAME := server-performance-monitor-web
PORT := 8000

up:
	docker compose build --no-cache
	docker compose up -d

down:
	docker compose down -v --remove-orphans