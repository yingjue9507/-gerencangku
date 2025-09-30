Param(
  [Parameter(Mandatory=$true)][string]$Owner,
  [string]$Repo = 'duochuangkou',
  [string]$Branch = 'main'
)

Write-Host "Setting up remote https://github.com/$Owner/$Repo.git and pushing $Branch..." -ForegroundColor Cyan

# Ensure git user is configured (fallbacks to local-only if global not set)
try {
  $userName = git config user.name
  $userEmail = git config user.email
  if (-not $userName -or -not $userEmail) {
    Write-Host "Git user not configured. Setting temporary local identity..." -ForegroundColor Yellow
    git config user.name "Auto Import"
    git config user.email "auto-import@example.local"
  }
} catch {}

# Initialize repo if needed
if (-not (Test-Path ".git")) {
  git init | Out-Null
}

# Create initial commit if none exists
try {
  git rev-parse --verify HEAD 2>$null 1>$null
} catch {
  git add .
  git commit -m "Initial import: Multi-AI integrated browser" | Out-Null
}

# Set remote and push
git remote remove origin 2>$null 1>$null
git remote add origin "https://github.com/$Owner/$Repo.git"
git branch -M $Branch
git push -u origin $Branch

Write-Host "Push completed." -ForegroundColor Green