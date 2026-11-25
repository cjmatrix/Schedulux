# Schedulux Docker Build Guide

This document contains all Docker build commands for the backend microservices in this monorepo.

> **Important**: All `docker build` commands **must be executed from the repository root directory** so that Docker has access to root lockfiles (`pnpm-lock.yaml`, `uv.lock`), shared configs (`turbo.json`), and shared workspace packages (`packages/proto`, `packages/circuit-breaker`).

---

## 1. Node.js / TypeScript Services

All Node.js services utilize the unified Turborepo-pruned [Dockerfile.node](file:///home/cjmatrix/Documents/Schedulux/Schedulx-core/docker/Dockerfile.node). Pass the appropriate `--build-arg APP_NAME` and `--build-arg APP_DIR`.

### 1.1 API Gateway

- **Package**: `@repo/api-gateway`
- **Directory**: `apps/api-gateway`
- **Port**: `5000` (HTTP)

```bash
docker build -f docker/Dockerfile.node \
  --build-arg APP_NAME=@repo/api-gateway \
  --build-arg APP_DIR=apps/api-gateway \
  -t schedulux/api-gateway:latest .
```

---

### 1.2 Customer API Gateway

- **Package**: `@repo/customer-api-gateway`
- **Directory**: `apps/customer-api-gateway`
- **Port**: `5001` (HTTP / WebSocket)

```bash
docker build -f docker/Dockerfile.node \
  --build-arg APP_NAME=@repo/customer-api-gateway \
  --build-arg APP_DIR=apps/customer-api-gateway \
  -t schedulux/customer-api-gateway:latest .
```

---

### 1.3 Identity & Tenant Microservice

- **Package**: `@repo/identity-tenant`
- **Directory**: `apps/identity-tenant`
- **Port**: `50051` (gRPC)

```bash
docker build -f docker/Dockerfile.node \
  --build-arg APP_NAME=@repo/identity-tenant \
  --build-arg APP_DIR=apps/identity-tenant \
  -t schedulux/identity-tenant:latest .
```

---

### 1.4 Scheduling & Inventory Microservice

- **Package**: `@repo/scheduling-inventory`
- **Directory**: `apps/scheduling-inventory`
- **Port**: `50053` (gRPC)

```bash
docker build -f docker/Dockerfile.node \
  --build-arg APP_NAME=@repo/scheduling-inventory \
  --build-arg APP_DIR=apps/scheduling-inventory \
  -t schedulux/scheduling-inventory:latest .
```

---

### 1.5 Kafka Consumer Service

- **Package**: `@repo/kafka-consumer`
- **Directory**: `apps/kafka-consumer`

```bash
docker build -f docker/Dockerfile.node \
  --build-arg APP_NAME=@repo/kafka-consumer \
  --build-arg APP_DIR=apps/kafka-consumer \
  -t schedulux/kafka-consumer:latest .
```

---

## 2. Python Services

Python services use dedicated `uv`-optimized Dockerfiles for fast, lean multi-stage builds.

### 2.1 AI Orchestration Microservice

- **Dockerfile**: [Dockerfile.python](file:///home/cjmatrix/Documents/Schedulux/Schedulx-core/docker/Dockerfile.python)
- **Directory**: `apps/AI-orchestration`
- **Port**: `50052` (gRPC)

```bash
docker build -f docker/Dockerfile.python \
  -t schedulux/ai-orchestration:latest .
```

---

### 2.2 Crawler & Document Indexer Worker

- **Dockerfile**: [Dockerfile.python-worker](file:///home/cjmatrix/Documents/Schedulux/Schedulx-core/docker/Dockerfile.python-worker)
- **Directory**: `apps/crawler-worker`

```bash
docker build -f docker/Dockerfile.python-worker \
  -t schedulux/crawler-worker:latest .
```

---

## 3. Build All Services Script

To build all backend images in one command:

```bash
# Set image prefix / registry
REGISTRY="schedulux"
TAG="latest"

# 1. API Gateway
docker build -f docker/Dockerfile.node \
  --build-arg APP_NAME=@repo/api-gateway \
  --build-arg APP_DIR=apps/api-gateway \
  -t ${REGISTRY}/api-gateway:${TAG} .

# 2. Customer API Gateway
docker build -f docker/Dockerfile.node \
  --build-arg APP_NAME=@repo/customer-api-gateway \
  --build-arg APP_DIR=apps/customer-api-gateway \
  -t ${REGISTRY}/customer-api-gateway:${TAG} .

# 3. Identity Tenant
docker build -f docker/Dockerfile.node \
  --build-arg APP_NAME=@repo/identity-tenant \
  --build-arg APP_DIR=apps/identity-tenant \
  -t ${REGISTRY}/identity-tenant:${TAG} .

# 4. Scheduling & Inventory
docker build -f docker/Dockerfile.node \
  --build-arg APP_NAME=@repo/scheduling-inventory \
  --build-arg APP_DIR=apps/scheduling-inventory \
  -t ${REGISTRY}/scheduling-inventory:${TAG} .

# 5. Kafka Consumer
docker build -f docker/Dockerfile.node \
  --build-arg APP_NAME=@repo/kafka-consumer \
  --build-arg APP_DIR=apps/kafka-consumer \
  -t ${REGISTRY}/kafka-consumer:${TAG} .

# 6. AI Orchestration (Python)
docker build -f docker/Dockerfile.python \
  -t ${REGISTRY}/ai-orchestration:${TAG} .

# 7. Crawler & Document Indexer Worker (Python)
docker build -f docker/Dockerfile.python-worker \
  -t ${REGISTRY}/crawler-worker:${TAG} .
```

---

## 4. Pushing Images to Docker Hub

To tag and push all built microservices to Docker Hub (for account `cjmatrix`):

```bash
# Tag all images for Docker Hub
docker tag schedulux/api-gateway:latest cjmatrix/api-gateway:latest
docker tag schedulux/customer-api-gateway:latest cjmatrix/customer-api-gateway:latest
docker tag schedulux/identity-tenant:latest cjmatrix/identity-tenant:latest
docker tag schedulux/scheduling-inventory:latest cjmatrix/scheduling-inventory:latest
docker tag schedulux/ai-orchestration:latest cjmatrix/ai-orchestration:latest
docker tag schedulux/crawler-worker:latest cjmatrix/crawler-worker:latest
docker tag schedulux/kafka-consumer:latest cjmatrix/kafka-consumer:latest

# Push all images to Docker Hub
docker push cjmatrix/api-gateway:latest
docker push cjmatrix/customer-api-gateway:latest
docker push cjmatrix/identity-tenant:latest
docker push cjmatrix/scheduling-inventory:latest
docker push cjmatrix/ai-orchestration:latest
docker push cjmatrix/crawler-worker:latest
docker push cjmatrix/kafka-consumer:latest
```

---

## 5. Importing Images into K3s (Local Cluster Alternative)

If you are running a local K3s cluster without pulling from Docker Hub:

```bash
# Save and import images directly into K3s containerd
docker save cjmatrix/api-gateway:latest | sudo k3s ctr images import -
docker save cjmatrix/customer-api-gateway:latest | sudo k3s ctr images import -
docker save cjmatrix/identity-tenant:latest | sudo k3s ctr images import -
docker save cjmatrix/scheduling-inventory:latest | sudo k3s ctr images import -
docker save cjmatrix/kafka-consumer:latest | sudo k3s ctr images import -
docker save cjmatrix/ai-orchestration:latest | sudo k3s ctr images import -
docker save cjmatrix/crawler-worker:latest | sudo k3s ctr images import -
```
