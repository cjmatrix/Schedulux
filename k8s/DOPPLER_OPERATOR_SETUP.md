# Doppler Kubernetes Operator Guide for Schedulux (K3s)

This cluster utilizes the official [Doppler Kubernetes Operator](https://github.com/DopplerHQ/kubernetes-operator) to automatically synchronize production secrets from the Doppler cloud into native Kubernetes Secrets (`schedulux-secrets`).

---

## 1. Install Doppler Kubernetes Operator on K3s

Run the following command on your K3s cluster:

```bash
# Using Helm (Recommended)
helm repo add doppler https://helm.doppler.com
helm repo update
helm install doppler-operator doppler/doppler-kubernetes-operator \
  --namespace doppler-operator-system \
  --create-namespace

# OR directly with kubectl:
kubectl apply -f https://github.com/DopplerHQ/kubernetes-operator/releases/latest/download/recommended.yaml
```

The operator controller pod runs at `~15MB` RAM footprint, easily fitting within your 4GB instance budget.

---

## 2. How Secret Synchronization Works

1. **Authentication Secret**: [k8s/base/doppler-secrets.yaml](file:///home/cjmatrix/Documents/Schedulux/Schedulx-core/k8s/base/doppler-secrets.yaml) provides `doppler-token-secret` using the Doppler Service Token created for the `prd` configuration in project `schedulux`.
2. **Custom Resource (`DopplerSecret`)**: The `schedulux-doppler-secret` resource instructs the Doppler Operator to continuously sync all production secrets into the Kubernetes Secret `schedulux-secrets`.
3. **Microservice Consumption**: All microservices (`api-gateway`, `customer-api-gateway`, `identity-tenant`, `scheduling-inventory`, `ai-orchestration`, `crawler-worker`, `kafka-consumer`) read their environment directly from Doppler via:
   ```yaml
   envFrom:
     - secretRef:
         name: schedulux-secrets
   ```

---

## 3. Secret Rotation & Live Reloading

* When you update or rotate a secret (e.g. `VOYAGE_API_KEY`, `PADDLE_API_KEY`, `DATABASE_URL`) in the Doppler dashboard:
  1. The Doppler Operator detects the webhook/change within seconds.
  2. The operator updates the in-cluster Secret `schedulux-secrets`.
  3. Deployments with auto-reload annotations are automatically rolled forward with zero downtime.

---

## 4. Deploying the Schedulux Stack

```bash
# Apply entire K3s stack including Doppler operator CRDs
kubectl apply -k k8s/base/
```



//echo "127.0.0.1 api.schedulux.com client-api.schedulux.com" | sudo tee -a /etc/hosts

//kubectl describe node | grep -A 5 "Taints:"
