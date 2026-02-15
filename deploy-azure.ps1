<#
.SYNOPSIS
    Deploys the House Rental Manager to Azure Container Apps.

.DESCRIPTION
    Creates all required Azure resources (Resource Group, Container Registry,
    SQL Database, Container Apps) and deploys both the frontend and backend.

    Edit the parameters below to customise names, region, and credentials.

.EXAMPLE
    .\deploy-azure.ps1
    .\deploy-azure.ps1 -Location westus2 -AppName myrentals
#>

[CmdletBinding()]
param(
    # ── Customise these ─────────────────────────────────────────
    [string]$AppName          = "houserental",       # Base name used for all resources
    [string]$Location         = "eastus",            # Azure region (az account list-locations -o table)
    [string]$SqlLocation      = "",                  # SQL region (defaults to $Location; change if region blocks SQL)
    [string]$SqlAdminUser     = "sqladmin",          # SQL admin username
    [string]$SqlAdminPassword = "HouseRental!2026Str0ng",  # SQL admin password (change this!)
    [string]$SqlDatabaseName  = "HouseRentalDb",     # SQL database name
    [int]$MinReplicas         = 1,                   # Minimum container replicas (0 = scale to zero)
    [int]$MaxReplicas         = 3                    # Maximum container replicas
)

$ErrorActionPreference = "Stop"

# ── Derived names ───────────────────────────────────────────────
if (-not $SqlLocation) { $SqlLocation = $Location }

$ResourceGroup = "rg-$AppName"
$AcrName       = ($AppName -replace '[^a-zA-Z0-9]','') + "acr"   # ACR requires alphanumeric only
$EnvName       = "$AppName-env"
$SqlServerName = "$AppName-sqlsvr"
$Timestamp     = Get-Date -Format "yyyyMMddHHmmss"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  House Rental Manager - Azure Deployment"     -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  App Name       : $AppName"
Write-Host "  Resource Group : $ResourceGroup"
Write-Host "  Location       : $Location"
Write-Host "  SQL Location   : $SqlLocation"
Write-Host "  ACR Name       : $AcrName"
Write-Host "  SQL Server     : $SqlServerName"
Write-Host "  SQL Database   : $SqlDatabaseName"
Write-Host "  Min Replicas   : $MinReplicas"
Write-Host ""

# ── Helper ──────────────────────────────────────────────────────
function Write-Step($step, $msg) {
    Write-Host ""
    Write-Host "[$step] $msg" -ForegroundColor Yellow
    Write-Host ("-" * 50)
}

# ── 1. Check prerequisites ──────────────────────────────────────
Write-Step "1/12" "Checking prerequisites"

$null = az account show 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to Azure. Opening browser..." -ForegroundColor Red
    az login
    if ($LASTEXITCODE -ne 0) { throw "Azure login failed." }
}
Write-Host "Logged in to Azure." -ForegroundColor Green

$null = docker info 2>$null
if ($LASTEXITCODE -ne 0) { throw "Docker is not running. Please start Docker Desktop and try again." }
Write-Host "Docker is running." -ForegroundColor Green

# ── 2. Register resource providers ──────────────────────────────
Write-Step "2/12" "Registering resource providers"

$providers = @("Microsoft.ContainerRegistry", "Microsoft.App", "Microsoft.OperationalInsights", "Microsoft.Sql")
foreach ($p in $providers) {
    $state = (az provider show -n $p --query "registrationState" -o tsv 2>$null)
    if ($state -ne "Registered") {
        Write-Host "  Registering $p..."
        az provider register --namespace $p --wait 2>$null
    } else {
        Write-Host "  $p already registered." -ForegroundColor DarkGray
    }
}

# Wait until all registered
foreach ($p in $providers) {
    $maxWait = 120
    $elapsed = 0
    while ($true) {
        $state = (az provider show -n $p --query "registrationState" -o tsv 2>$null)
        if ($state -eq "Registered") { break }
        if ($elapsed -ge $maxWait) { throw "Timed out waiting for $p to register." }
        Write-Host "  Waiting for $p... ($state)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 10
        $elapsed += 10
    }
}
Write-Host "All providers registered." -ForegroundColor Green

# ── 3. Create Resource Group ────────────────────────────────────
Write-Step "3/12" "Creating resource group: $ResourceGroup"

az group create --name $ResourceGroup --location $Location -o none
Write-Host "Resource group created." -ForegroundColor Green

# ── 4. Create Azure Container Registry ──────────────────────────
Write-Step "4/12" "Creating Container Registry: $AcrName"

az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --admin-enabled true -o none
az acr login --name $AcrName
Write-Host "ACR created and logged in." -ForegroundColor Green

# ── 5. Create Azure SQL Server & Database ───────────────────────
Write-Step "5/12" "Creating SQL Server: $SqlServerName ($SqlLocation)"

az sql server create `
    --name $SqlServerName `
    --resource-group $ResourceGroup `
    --location $SqlLocation `
    --admin-user $SqlAdminUser `
    --admin-password $SqlAdminPassword `
    -o none

Write-Host "SQL Server created." -ForegroundColor Green

Write-Step "6/12" "Creating SQL Database: $SqlDatabaseName (serverless)"

az sql db create `
    --resource-group $ResourceGroup `
    --server $SqlServerName `
    --name $SqlDatabaseName `
    --edition GeneralPurpose `
    --compute-model Serverless `
    --family Gen5 `
    --capacity 1 `
    --auto-pause-delay 60 `
    -o none

# Allow Azure services through firewall
az sql server firewall-rule create `
    --resource-group $ResourceGroup `
    --server $SqlServerName `
    --name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 `
    -o none

Write-Host "SQL Database created and firewall configured." -ForegroundColor Green

# ── 7. Create Container Apps Environment ────────────────────────
Write-Step "7/12" "Creating Container Apps Environment: $EnvName"

az containerapp env create `
    --name $EnvName `
    --resource-group $ResourceGroup `
    --location $Location `
    -o none

Write-Host "Container Apps environment created." -ForegroundColor Green

# ── 8. Build & push backend API image ──────────────────────────
Write-Step "8/12" "Building and pushing backend API image"

$ApiImage = "$AcrName.azurecr.io/api:$Timestamp"
docker build -t $ApiImage -f src/HouseRental.Api/Dockerfile src/HouseRental.Api/
docker push $ApiImage
Write-Host "API image pushed: $ApiImage" -ForegroundColor Green

# ── 9. Deploy backend API container ─────────────────────────────
Write-Step "9/12" "Deploying backend API container"

$AcrPassword = (az acr credential show --name $AcrName --query "passwords[0].value" -o tsv)
$SqlFqdn     = "$SqlServerName.database.windows.net"
$ConnString   = "Server=$SqlFqdn;Database=$SqlDatabaseName;User Id=$SqlAdminUser;Password=$SqlAdminPassword;TrustServerCertificate=true;"

az containerapp create `
    --name api `
    --resource-group $ResourceGroup `
    --environment $EnvName `
    --image $ApiImage `
    --registry-server "$AcrName.azurecr.io" `
    --registry-username $AcrName `
    --registry-password $AcrPassword `
    --target-port 8080 `
    --ingress internal `
    --min-replicas $MinReplicas `
    --max-replicas $MaxReplicas `
    --env-vars `
        "ASPNETCORE_ENVIRONMENT=Production" `
        "ASPNETCORE_URLS=http://+:8080" `
        "ConnectionStrings__DefaultConnection=$ConnString" `
        "Cors__AllowedOrigins__0=https://placeholder.azurecontainerapps.io" `
    -o none

# Get the API internal FQDN
$ApiFqdn = (az containerapp show --name api --resource-group $ResourceGroup --query "properties.configuration.ingress.fqdn" -o tsv)
Write-Host "API deployed. Internal FQDN: $ApiFqdn" -ForegroundColor Green

# ── 10. Build & push frontend with correct backend URL ──────────
Write-Step "10/12" "Building frontend with backend URL: https://$ApiFqdn"

# Patch nginx.conf with the real backend FQDN
$NginxPath = "frontend/nginx.conf"
$NginxContent = Get-Content $NginxPath -Raw
$NginxContent = $NginxContent -replace '__API_BACKEND_URL__', "https://$ApiFqdn"
$NginxContent = $NginxContent -replace '__API_BACKEND_HOST__', $ApiFqdn
Set-Content -Path $NginxPath -Value $NginxContent -NoNewline

$FrontendImage = "$AcrName.azurecr.io/frontend:$Timestamp"
docker build -t $FrontendImage -f frontend/Dockerfile frontend/
docker push $FrontendImage

# Restore nginx.conf to template form
$NginxContent = Get-Content $NginxPath -Raw
$NginxContent = $NginxContent -replace [regex]::Escape("https://$ApiFqdn"), '__API_BACKEND_URL__'
$NginxContent = $NginxContent -replace [regex]::Escape($ApiFqdn), '__API_BACKEND_HOST__'
Set-Content -Path $NginxPath -Value $NginxContent -NoNewline

Write-Host "Frontend image pushed: $FrontendImage" -ForegroundColor Green

# ── 11. Deploy frontend container ───────────────────────────────
Write-Step "11/12" "Deploying frontend container"

az containerapp create `
    --name frontend `
    --resource-group $ResourceGroup `
    --environment $EnvName `
    --image $FrontendImage `
    --registry-server "$AcrName.azurecr.io" `
    --registry-username $AcrName `
    --registry-password $AcrPassword `
    --target-port 80 `
    --ingress external `
    --min-replicas $MinReplicas `
    --max-replicas $MaxReplicas `
    -o none

$FrontendFqdn = (az containerapp show --name frontend --resource-group $ResourceGroup --query "properties.configuration.ingress.fqdn" -o tsv)
Write-Host "Frontend deployed: https://$FrontendFqdn" -ForegroundColor Green

# ── 12. Update CORS on backend ──────────────────────────────────
Write-Step "12/12" "Updating CORS on backend API"

az containerapp update `
    --name api `
    --resource-group $ResourceGroup `
    --set-env-vars "Cors__AllowedOrigins__0=https://$FrontendFqdn" `
    -o none

Write-Host "CORS updated." -ForegroundColor Green

# ── Done ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Deployment Complete!"                        -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend URL  : https://$FrontendFqdn"     -ForegroundColor Cyan
Write-Host "  API (internal): https://$ApiFqdn"           -ForegroundColor Cyan
Write-Host "  SQL Server    : $SqlFqdn"                   -ForegroundColor Cyan
Write-Host "  SQL Database  : $SqlDatabaseName"           -ForegroundColor Cyan
Write-Host ""
Write-Host "  Login with: admin / admin123"               -ForegroundColor White
Write-Host ""
Write-Host "  Resource Group: $ResourceGroup"             -ForegroundColor DarkGray
Write-Host "  To delete everything: az group delete --name $ResourceGroup --yes --no-wait" -ForegroundColor DarkGray
Write-Host ""
