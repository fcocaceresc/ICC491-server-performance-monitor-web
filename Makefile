IMAGE_NAME := server-performance-monitor-web
CONTAINER_NAME := server-performance-monitor-web
PORT := 8000

up:
	docker build -t $(IMAGE_NAME) .
	docker run -d --name $(CONTAINER_NAME) -p $(PORT):$(PORT) $(IMAGE_NAME)

down:
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

clean: down
	docker rmi $(IMAGE_NAME) || true