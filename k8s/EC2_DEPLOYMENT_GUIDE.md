# Schedulux AWS EC2 & K3s Production Setup Guide

This guide details how to provision the `c7i-flex.large` EC2 instance, map DNS records for `schedulux.xyz`, install K3s, and run all microservices with automatic Let's Encrypt TLS.

---

## 1. Provision EC2 with Terraform

From your local machine in the repository root:

```bash
cd infra/terraform
terraform apply -auto-approve
```

Terraform will:
1. Generate an RSA 4096 SSH key pair and save the private key locally as `schedulux-dev-key.pem` (with `0400` permissions).
2. Create the Security Group allowing ports `22` (SSH), `80` (HTTP), `443` (HTTPS), and `6443` (K8s API).
3. Launch a `c7i-flex.large` instance (2 vCPUs, 4GB RAM, 40GB GP3 root disk).
4. Allocate an **Elastic IP (EIP)** and attach it to the instance.

Print outputs:
```bash
terraform output ec2_public_ip
terraform output ec2_ssh_command
```

---

## 2. Configure DNS A Records

In your domain registrar (Namecheap, GoDaddy, Cloudflare, Route 53) for `schedulux.xyz`:

| Type | Name / Host | Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `api` | `<EC2_PUBLIC_IP>` | 300 (or Auto) |
| **A** | `client-api` | `<EC2_PUBLIC_IP>` | 300 (or Auto) |
| **A** | `*` (Wildcard) | `<EC2_PUBLIC_IP>` | 300 (or Auto) |

---

## 3. Connect to EC2 & Install K3s

Using the generated SSH key:

```bash
ssh -i infra/terraform/schedulux-dev-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 3.1 Install K3s with Low Disk Pressure Threshold:

```bash
# Configure K3s eviction threshold
sudo mkdir -p /etc/rancher/k3s
sudo tee /etc/rancher/k3s/config.yaml << 'EOF'
kubelet-arg:
  - "eviction-hard=imagefs.available<5%,nodefs.available<5%"
  - "eviction-minimum-reclaim=imagefs.available=1%,nodefs.available=1%"
EOF

# Install K3s
curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
```

### 3.2 Enable Traefik Let's Encrypt ACME:

```bash
sudo tee /var/lib/rancher/k3s/server/manifests/traefik-config.yaml << 'EOF'
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    additionalArguments:
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=cjmartingarrix@gmail.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/data/acme.json"
    ports:
      web:
        redirectTo:
          port: websecure
    persistence:
      enabled: true
      path: /data
      size: 128Mi
EOF
```

---

## 4. Install Operators (Doppler & KEDA)

```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 1. Install Doppler Kubernetes Operator
helm repo add doppler https://helm.doppler.com
helm repo update
helm install doppler-operator doppler/doppler-kubernetes-operator \
  --namespace doppler-operator-system \
  --create-namespace

# 2. Install KEDA
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda \
  --namespace keda \
  --create-namespace
```

---

## 5. Deploy Schedulux Microservices

Copy the repository or clone it on the EC2 server, then apply:

```bash
# Apply secrets & k8s base
kubectl apply -f k8s/base/doppler-secrets.yaml
kubectl apply -f k8s/base/
```

Verify everything is running:
```bash
kubectl get pods -n schedulux
```

---

## 6. Verify HTTPS SSL/TLS

```bash
curl -i https://api.schedulux.xyz/health
curl -i https://client-api.schedulux.xyz/health
```

Traefik will serve valid Let's Encrypt SSL certificates automatically.


//ssh -i infra/terraform/schedulux-dev-key.pem ubuntu@<EC2_PUBLIC_IP>

scp -i infra/terraform/schedulux-dev-key.pem -r k8s ubuntu@<EC2_PUBLIC_IP>:~/