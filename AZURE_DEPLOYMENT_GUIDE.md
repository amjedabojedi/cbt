# Azure DevOps Deployment Guide for ResilienceHub

## 📋 Prerequisites

- Azure account with active subscription
- Azure DevOps organization and project
- Git repository connected to Azure DevOps
- PostgreSQL database (Neon or Azure Database for PostgreSQL)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Azure App Service

1. **Go to Azure Portal** (https://portal.azure.com)
2. **Create a new resource** → Search for "App Service"
3. **Configure settings**:
   - **Resource Group**: Create new or use existing
   - **Name**: `resiliencehub-app` (must be globally unique)
   - **Publish**: Code
   - **Runtime stack**: Node 20 LTS
   - **Operating System**: Linux
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select based on needs (F1 Free tier for testing)
4. **Click "Review + Create"** → **Create**

### Step 2: Configure Azure DevOps Service Connection

1. **Go to Azure DevOps** → Your Project
2. **Project Settings** (bottom left) → **Service connections**
3. **New service connection** → **Azure Resource Manager**
4. **Authentication method**: Service principal (automatic)
5. **Scope level**: Subscription (or Resource Group)
6. **Select your subscription and resource group**
7. **Service connection name**: `Azure-Production` (remember this name)
8. **Click "Save"**

### Step 3: Configure Environment Variables in Azure DevOps

1. **Pipelines** → **Library** → **+ Variable group**
2. **Name**: `ResilienceHub-Production`
3. **Add the following variables**:

   **Required Variables:**
   ```
   DATABASE_URL          = your_neon_database_url
   SESSION_SECRET        = generate_random_string_here
   ```

   **Optional Variables (if using these services):**
   ```
   OPENAI_API_KEY       = your_openai_key (mark as secret 🔒)
   SPARKPOST_API_KEY    = your_sparkpost_key (mark as secret 🔒)
   VITE_POSTHOG_KEY     = your_posthog_key
   VITE_POSTHOG_HOST    = your_posthog_host
   STRIPE_SECRET_KEY    = your_stripe_key (mark as secret 🔒)
   ```

   **Important**: Click the lock icon 🔒 to mark sensitive values as secret

4. **Click "Save"**

### Step 4: Update azure-pipelines.yml

Edit `azure-pipelines.yml` and update these variables:

```yaml
variables:
  azureSubscription: 'Azure-Production'  # Match your service connection name
  webAppName: 'resiliencehub-app'        # Match your Azure App Service name
```

### Step 5: Configure Azure App Service Settings

1. **Azure Portal** → Your App Service
2. **Configuration** → **Application settings**
3. **Add all environment variables**:
   - DATABASE_URL
   - SESSION_SECRET
   - OPENAI_API_KEY
   - SPARKPOST_API_KEY
   - VITE_POSTHOG_KEY
   - VITE_POSTHOG_HOST
   - STRIPE_SECRET_KEY
   - NODE_ENV = production

4. **General settings** → **Startup Command**:
   ```
   npm run dev
   ```

5. **Click "Save"**

### Step 6: Set up Azure DevOps Pipeline

1. **Pipelines** → **Create Pipeline**
2. **Select**: Azure Repos Git (or your repo source)
3. **Select your repository**
4. **Configure**: Existing Azure Pipelines YAML file
5. **Path**: /azure-pipelines.yml
6. **Click "Continue"** → **Run**

---

## 🔧 Pipeline Configuration Options

### Option A: Current Setup (Full-Stack on App Service)
- ✅ Deploys both frontend and backend
- ✅ Uses your existing `npm run dev` command
- ✅ Good for development and small-scale production

### Option B: Separate Frontend (Static Web App)
If you want to deploy frontend separately:

```yaml
# Add this stage before Deploy
  - stage: DeployFrontend
    displayName: 'Deploy Frontend to Static Web App'
    dependsOn: Build
    jobs:
      - deployment: DeployStaticWebApp
        environment: 'production-frontend'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureStaticWebApp@0
                  inputs:
                    app_location: 'client'
                    output_location: 'dist'
                    azure_static_web_apps_api_token: $(STATIC_WEB_APP_TOKEN)
```

---

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Store all secrets in Azure DevOps Library (marked as secret)
- ✅ Never commit `.env` files to repository
- ✅ Use Azure Key Vault for production secrets (optional but recommended)

### 2. Database Security
- ✅ Use connection string with SSL enabled
- ✅ Whitelist Azure App Service IP in your database firewall
- ✅ For Neon: Add your App Service to allowed IPs

### 3. CORS Configuration
Update your backend to allow Azure domain:

```javascript
// server/index.ts
const allowedOrigins = [
  'https://resiliencehub-app.azurewebsites.net',
  'https://your-custom-domain.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

---

## 🐛 Troubleshooting

### Build Fails
**Check**:
- Node version matches (20.x)
- All dependencies in package.json
- Environment variables are set correctly

**Fix**:
```bash
# Run locally to test build
npm ci
npm run build
```

### Deployment Succeeds but App Doesn't Start
**Check Azure logs**:
1. App Service → **Log stream**
2. Look for error messages

**Common issues**:
- Missing environment variables
- Database connection failed
- Port binding issue (Azure uses PORT environment variable)

**Fix**: Ensure your server listens on `process.env.PORT || 5000`

### Database Connection Errors
**Check**:
- DATABASE_URL is correct
- Neon database is active (not suspended)
- IP whitelisting allows Azure

**Enable in Neon**:
1. Neon Console → Your project → Settings
2. IP Allow → Add Azure App Service outbound IPs

### Static Assets Not Loading
**Check**:
- `dist` folder exists after build
- Vite config base path is correct
- Azure serves static files properly

**Fix in vite.config.ts**:
```typescript
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist'
  }
});
```

---

## 📊 Monitoring & Logs

### View Deployment Logs
1. **Azure DevOps** → Pipelines → Your pipeline
2. Click on a run to see detailed logs

### View Application Logs
1. **Azure Portal** → App Service → **Log stream**
2. Or use Azure CLI:
   ```bash
   az webapp log tail --name resiliencehub-app --resource-group YOUR_RESOURCE_GROUP
   ```

### Enable Application Insights (Recommended)
1. Azure Portal → App Service → **Application Insights**
2. Click "Turn on Application Insights"
3. Creates automatic monitoring and diagnostics

---

## 🔄 CI/CD Workflow

### Automatic Deployments
Every push to `main` or `master` branch will:
1. ✅ Install dependencies
2. ✅ Build Vite frontend
3. ✅ Create deployment package
4. ✅ Deploy to Azure App Service
5. ✅ Restart the app

### Manual Deployments
1. **Pipelines** → Select your pipeline
2. **Run pipeline** → Select branch
3. **Run**

---

## 🌐 Custom Domain Setup

### Add Custom Domain
1. **App Service** → **Custom domains**
2. **Add custom domain**
3. **Domain**: yourdomain.com
4. **Validate** → **Add**

### SSL Certificate
1. **App Service** → **TLS/SSL settings**
2. **Private Key Certificates** → **Create App Service Managed Certificate**
3. Select your custom domain → **Create**
4. **Bindings** → **Add TLS/SSL Binding**

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured in Azure
- [ ] Database URL is correct and accessible
- [ ] Service connection created in Azure DevOps
- [ ] Pipeline variables updated (subscription, app name)
- [ ] App Service startup command configured
- [ ] CORS origins updated for Azure domain
- [ ] Secrets marked as secret in variable groups
- [ ] Database migrations run (if needed)
- [ ] Test the deployed app thoroughly
- [ ] Set up custom domain (optional)
- [ ] Enable Application Insights for monitoring

---

## 📚 Additional Resources

- [Azure App Service Documentation](https://learn.microsoft.com/azure/app-service/)
- [Azure DevOps Pipelines](https://learn.microsoft.com/azure/devops/pipelines/)
- [Neon Database with Azure](https://neon.tech/docs/guides/azure)
- [Node.js on Azure](https://learn.microsoft.com/azure/app-service/quickstart-nodejs)

---

## 🆘 Need Help?

### Common Commands

**Restart App Service:**
```bash
az webapp restart --name resiliencehub-app --resource-group YOUR_RESOURCE_GROUP
```

**View Environment Variables:**
```bash
az webapp config appsettings list --name resiliencehub-app --resource-group YOUR_RESOURCE_GROUP
```

**Stream Logs:**
```bash
az webapp log tail --name resiliencehub-app --resource-group YOUR_RESOURCE_GROUP
```

---

**Good luck with your deployment! 🚀**
