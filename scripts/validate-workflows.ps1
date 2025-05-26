# Workflow Validation Script
# This script validates that all workflow files are properly configured

param(
    [switch]$Verbose
)

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    if ($Verbose) {
        Write-Host "ℹ️  $Message" -ForegroundColor Cyan
    }
}

Write-Host "🔍 Validating GitHub Workflows Configuration" -ForegroundColor Blue
Write-Host "=" * 50

# Check if .github/workflows directory exists
$workflowDir = ".github/workflows"
if (-not (Test-Path $workflowDir)) {
    Write-Error "Workflows directory not found: $workflowDir"
    exit 1
}

Write-Success "Workflows directory found"

# Expected workflow files
$expectedWorkflows = @(
    "ci.yml",
    "dev.yml", 
    "release.yml",
    "master-protection.yml"
)

# Check each workflow file
foreach ($workflow in $expectedWorkflows) {
    $workflowPath = Join-Path $workflowDir $workflow
    if (Test-Path $workflowPath) {
        Write-Success "Workflow found: $workflow"
        
        # Basic YAML syntax validation
        try {
            $content = Get-Content $workflowPath -Raw
            if ($content -match "name:\s*(.+)") {
                Write-Info "  Name: $($matches[1].Trim())"
            }
            if ($content -match "on:\s*") {
                Write-Info "  Has trigger configuration"
            }
            if ($content -match "jobs:\s*") {
                Write-Info "  Has jobs defined"
            }
        } catch {
            Write-Warning "  Could not parse workflow file: $workflow"
        }
    } else {
        Write-Error "Missing workflow: $workflow"
    }
}

# Check package.json for required scripts
Write-Host ""
Write-Host "📦 Checking package.json scripts" -ForegroundColor Blue

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    $requiredScripts = @(
        "test",
        "lint", 
        "check-types",
        "package",
        "release:prepare"
    )
    
    foreach ($script in $requiredScripts) {
        if ($packageJson.scripts.PSObject.Properties.Name -contains $script) {
            Write-Success "Script found: $script"
            Write-Info "  Command: $($packageJson.scripts.$script)"
        } else {
            Write-Warning "Missing script: $script"
        }
    }
} else {
    Write-Error "package.json not found"
}

# Check for release helper scripts
Write-Host ""
Write-Host "🛠️  Checking release helper scripts" -ForegroundColor Blue

$releaseScripts = @(
    "scripts/prepare-release.ps1",
    "scripts/prepare-release.sh"
)

foreach ($script in $releaseScripts) {
    if (Test-Path $script) {
        Write-Success "Release script found: $script"
    } else {
        Write-Warning "Release script missing: $script"
    }
}

# Check for documentation
Write-Host ""
Write-Host "📚 Checking documentation" -ForegroundColor Blue

$docFiles = @(
    ".github/WORKFLOW_DOCUMENTATION.md",
    ".github/BRANCH_PROTECTION_SETUP.md"
)

foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        Write-Success "Documentation found: $doc"
    } else {
        Write-Warning "Documentation missing: $doc"
    }
}

# Check current branch
Write-Host ""
Write-Host "🌿 Checking current branch" -ForegroundColor Blue

try {
    $currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($currentBranch) {
        Write-Info "Current branch: $currentBranch"
        
        if ($currentBranch -eq "dev") {
            Write-Success "On development branch (recommended for development)"
        } elseif ($currentBranch -eq "master") {
            Write-Warning "On master branch (use dev branch for development)"
        } else {
            Write-Info "On feature branch: $currentBranch"
        }
    }
} catch {
    Write-Warning "Could not determine current branch (not a git repository?)"
}

# Check for required secrets (if we can determine them)
Write-Host ""
Write-Host "🔐 Required GitHub Secrets" -ForegroundColor Blue
Write-Info "The following secrets need to be configured in GitHub repository settings:"
Write-Host "  • VSCE_PAT - VS Code Marketplace Personal Access Token" -ForegroundColor Gray
Write-Host "  • GITHUB_TOKEN - Automatically provided by GitHub Actions" -ForegroundColor Gray

Write-Host ""
Write-Host "✨ Workflow validation complete!" -ForegroundColor Green
Write-Host "For detailed setup instructions, see .github/WORKFLOW_DOCUMENTATION.md" -ForegroundColor Gray
