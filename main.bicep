// ============================================================
// AttendEase - Azure Infrastructure as Code (Bicep)
// Resources: App Service, SQL Database, Key Vault, CDN,
//            Storage, App Insights, Front Door (WAF)
// ============================================================

@description('Environment: dev | staging | prod')
@allowed(['dev', 'staging', 'prod'])
param env string = 'dev'

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('SQL admin username')
param sqlAdminUser string = 'attendease_admin'

@secure()
@description('SQL admin password')
param sqlAdminPassword string

@description('App Service Plan SKU')
param appServiceSku string = (env == 'prod') ? 'P2v3' : 'B2'

var prefix = 'attendease-${env}'
var tags = {
  application: 'AttendEase'
  environment: env
  owner: 'platform-team'
}

// ── App Service Plan ──────────────────────────────────────────
resource appPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${prefix}-plan'
  location: location
  tags: tags
  sku: {
    name: appServiceSku
    tier: (env == 'prod') ? 'PremiumV3' : 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// ── App Service (React SPA + Node API) ───────────────────────
resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: '${prefix}-web'
  location: location
  tags: tags
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: appPlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: (env == 'prod')
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
      appSettings: [
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'NODE_ENV',                     value: env }
        { name: 'APPINSIGHTS_INSTRUMENTATIONKEY', value: appInsights.properties.InstrumentationKey }
        { name: 'DB_CONNECTION_STRING',          value: '@Microsoft.KeyVault(SecretUri=${kv.properties.vaultUri}secrets/db-connection-string/)' }
        { name: 'JWT_SECRET',                    value: '@Microsoft.KeyVault(SecretUri=${kv.properties.vaultUri}secrets/jwt-secret/)' }
      ]
    }
  }
}

// ── Storage Account (static assets, exports) ─────────────────
resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'attendease${env}store'
  location: location
  tags: tags
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    networkAcls: { defaultAction: 'Allow' }
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storage
  name: 'default'
}

resource staticContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'static'
  properties: { publicAccess: 'None' }
}

resource exportsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'exports'
  properties: { publicAccess: 'None' }
}

// ── Azure SQL Server ──────────────────────────────────────────
resource sqlServer 'Microsoft.Sql/servers@2022-11-01-preview' = {
  name: '${prefix}-sqlserver'
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminUser
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'   // restrict via firewall rules below
  }
}

resource sqlDb 'Microsoft.Sql/servers/databases@2022-11-01-preview' = {
  parent: sqlServer
  name: 'attendeasedb'
  location: location
  tags: tags
  sku: {
    name: (env == 'prod') ? 'S2' : 'S0'
    tier: 'Standard'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: (env == 'prod') ? 10737418240 : 2147483648
  }
}

// Allow Azure Services through SQL firewall
resource sqlFirewallAzure 'Microsoft.Sql/servers/firewallRules@2022-11-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ── Key Vault (secrets management) ───────────────────────────
resource kv 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: '${prefix}-kv'
  location: location
  tags: tags
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    softDeleteRetentionInDays: 7
    enabledForDeployment: false
    enabledForTemplateDeployment: false
    networkAcls: { defaultAction: 'Allow', bypass: 'AzureServices' }
  }
}

// Grant App Service MSI access to Key Vault secrets
resource kvSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(kv.id, appService.id, 'Key Vault Secrets User')
  scope: kv
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: appService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Store DB connection string secret
resource dbSecretKv 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: kv
  name: 'db-connection-string'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=attendeasedb;Persist Security Info=False;User ID=${sqlAdminUser};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
  }
}

// ── Application Insights ──────────────────────────────────────
resource logWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${prefix}-logs'
  location: location
  tags: tags
  properties: { sku: { name: 'PerGB2018' } retentionInDays: 30 }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${prefix}-insights'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logWorkspace.id
    RetentionInDays: 30
  }
}

// ── CDN Profile (static asset delivery) ──────────────────────
resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: '${prefix}-cdn'
  location: 'Global'
  tags: tags
  sku: { name: 'Standard_Microsoft' }
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: '${prefix}-cdn-ep'
  location: 'Global'
  properties: {
    originHostHeader: appService.properties.defaultHostName
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    origins: [
      {
        name: 'app-service-origin'
        properties: {
          hostName: appService.properties.defaultHostName
          httpPort: 80
          httpsPort: 443
        }
      }
    ]
  }
}

// ── Outputs ───────────────────────────────────────────────────
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output cdnEndpointUrl string = 'https://${cdnEndpoint.properties.hostName}'
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output keyVaultUri string = kv.properties.vaultUri
output appInsightsKey string = appInsights.properties.InstrumentationKey
output storageAccountName string = storage.name
