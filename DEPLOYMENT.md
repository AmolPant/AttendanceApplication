# AttendEase – Azure Deployment Guide

## Architecture Overview

```
Internet
   │
   ▼
Azure Front Door / CDN (Global)
   │
   ▼
Azure App Service (Southeast Asia – Singapore)
   │                    │
   ▼                    ▼
Azure SQL Database   Azure Blob Storage
   │
   ▼
Azure Key Vault  ←→  App Insights / Log Analytics
```

---

## Resources Created

| Resource | Purpose | SKU (prod) |
|---|---|---|
| App Service Plan | Hosts the web app | P2v3 (Linux) |
| App Service | Serves React SPA + API | – |
| Azure SQL Server | Relational database | Standard S2 |
| Azure SQL Database | Student records | 10 GB |
| Key Vault | Secrets (DB passwords, JWT) | Standard |
| Storage Account | Static assets, exports | Standard LRS |
| Application Insights | Monitoring & telemetry | PerGB2018 |
| Log Analytics Workspace | Centralised logs | PerGB2018 |
| CDN Profile + Endpoint | Fast asset delivery | Standard Microsoft |

---

## Prerequisites

- Azure CLI installed: `brew install azure-cli` or https://docs.microsoft.com/cli/azure/install-azure-cli
- Node.js 20+ installed
- An Azure subscription (free trial: https://azure.microsoft.com/free)
- Git installed

---

## Step 1 – Local Development Setup

```bash
# Clone and install
git clone <your-repo-url>
cd attendance-app
npm install

# Run locally
npm start
# Opens http://localhost:3000
```

---

## Step 2 – Create Azure Service Principal (for CI/CD)

```bash
# Login to Azure
az login

# Create a service principal and get credentials
az ad sp create-for-rbac \
  --name "attendease-cicd" \
  --role contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID> \
  --sdk-auth
```

Copy the full JSON output — you will add this as a GitHub secret named **AZURE_CREDENTIALS**.

---

## Step 3 – Add GitHub Secrets

In your GitHub repo → Settings → Secrets → Actions, add:

| Secret | Value |
|---|---|
| `AZURE_CREDENTIALS` | JSON from step 2 |
| `SQL_ADMIN_PASSWORD` | A strong password (min 8 chars, upper+lower+digit+symbol) |

---

## Step 4 – Manual Infrastructure Deploy (first time)

```bash
# Login
az login

# Create Resource Group
az group create \
  --name rg-attendease-prod \
  --location southeastasia

# Deploy Bicep (replace SQL password)
az deployment group create \
  --resource-group rg-attendease-prod \
  --template-file infrastructure/main.bicep \
  --parameters env=prod sqlAdminPassword='YourStr0ng!Pass'
```

This takes ~5 minutes and creates all Azure resources.

---

## Step 5 – Deploy Application

### Option A – Via GitHub Actions (Recommended)
Push to the `main` branch:
```bash
git add .
git commit -m "feat: initial deployment"
git push origin main
```
The GitHub Actions pipeline (`.github/workflows/deploy.yml`) will:
1. Build the React app
2. Deploy Bicep infrastructure
3. Deploy the build to App Service
4. Run a health check

### Option B – Manual Deploy
```bash
# Build
npm run build

# Deploy build folder to App Service
az webapp deploy \
  --resource-group rg-attendease-prod \
  --name attendease-prod-web \
  --src-path build/ \
  --type zip
```

---

## Step 6 – Database Setup (SQL Schema)

Connect to your Azure SQL Database and run:

```sql
-- Students table
CREATE TABLE Students (
  Id           INT           IDENTITY(1,1) PRIMARY KEY,
  Name         NVARCHAR(200) NOT NULL,
  Sex          NVARCHAR(20)  NOT NULL,
  City         NVARCHAR(100),
  Town         NVARCHAR(100),
  Country      NVARCHAR(100),
  Pincode      NVARCHAR(20),
  CountryCode  NVARCHAR(10),
  Phone        NVARCHAR(30),
  Email        NVARCHAR(200) NOT NULL UNIQUE,
  Role         NVARCHAR(50),
  Hobbies      NVARCHAR(500),  -- JSON array stored as string
  LocationType NVARCHAR(20),
  CreatedAt    DATETIME2     DEFAULT GETUTCDATE(),
  UpdatedAt    DATETIME2     DEFAULT GETUTCDATE()
);

-- Index for fast search
CREATE INDEX IX_Students_Role     ON Students(Role);
CREATE INDEX IX_Students_Location ON Students(LocationType);
CREATE INDEX IX_Students_Email    ON Students(Email);
```

---

## Step 7 – Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group rg-attendease-prod \
  --webapp-name attendease-prod-web \
  --hostname yourdomain.com

# Add SSL certificate (free managed cert)
az webapp config ssl bind \
  --resource-group rg-attendease-prod \
  --name attendease-prod-web \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

---

## Environment URLs (after deploy)

| Environment | URL |
|---|---|
| Dev (local) | http://localhost:3000 |
| Production | https://attendease-prod-web.azurewebsites.net |
| CDN | https://attendease-prod-cdn-ep.azureedge.net |

---

## Monitoring

- **Application Insights**: Azure Portal → attendease-prod-insights
- **Live Metrics**: See real-time traffic and errors
- **Log Analytics**: Run KQL queries on all app logs
- **Alerts**: Set up email alerts for error rates > 5%

---

## Cost Estimate (SGD/month)

| Resource | Dev | Prod |
|---|---|---|
| App Service (B2 / P2v3) | ~$25 | ~$180 |
| Azure SQL (S0 / S2) | ~$7 | ~$120 |
| Storage | < $5 | < $10 |
| CDN | < $5 | < $20 |
| Key Vault | < $2 | < $5 |
| App Insights | < $5 | ~$15 |
| **Total** | **~$45** | **~$350** |

Costs are approximate and depend on usage. Use the [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/) for exact estimates.

---

## Security Checklist

- [x] HTTPS enforced (HTTP redirects to HTTPS)
- [x] TLS 1.2 minimum on all services
- [x] Secrets stored in Key Vault (never in code)
- [x] Managed Identity for Key Vault access (no stored credentials)
- [x] SQL firewall allows only Azure services
- [x] FTP disabled on App Service
- [x] Application Insights for anomaly detection
- [x] Soft delete enabled on Key Vault
