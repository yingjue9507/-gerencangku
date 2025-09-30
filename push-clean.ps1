Param(
  [Parameter(Mandatory=$true)][string]$Owner,
  [string]$Repo = 'duochuangkou',
  [string]$Branch = 'main'
)

$Remote = "https://github.com/$Owner/$Repo.git"
Write-Host "Preparing clean push to $Remote on branch $Branch..." -ForegroundColor Cyan

# Ensure git user is configured (local scope)
try {
  $userName = git config user.name
  $userEmail = git config user.email
  if (-not $userName -or -not $userEmail) {
    Write-Host "Git user not configured. Setting temporary local identity..." -ForegroundColor Yellow
    git config user.name "Auto Import"
    git config user.email "auto-import@example.local"
  }
} catch {}

# Initialize repository if needed
if (-not (Test-Path ".git")) {
  git init | Out-Null
}

# Append .gitignore rules to avoid pushing large archives and local artifacts
$ignoreLines = @(
  "# Added by push-clean.ps1",
  "*.zip",
  "*.7z",
  "*.rar",
  "*.log",
  "*.lnk",
  "dist/",
  "build/",
  "release/",
  "portable-app/node_modules/",
  "node_modules/"
)

if (Test-Path ".gitignore") {
  $existing = Get-Content ".gitignore"
  $toAppend = $ignoreLines | Where-Object { $_ -notin $existing }
  if ($toAppend.Count -gt 0) {
    Add-Content -Path ".gitignore" -Value ($toAppend -join "`n")
  }
} else {
  Set-Content -Path ".gitignore" -Value ($ignoreLines -join "`n")
}

# Remove large archives from working tree (they will no longer be tracked)
Get-ChildItem -Recurse -Filter *.zip -ErrorAction SilentlyContinue | ForEach-Object { 
  try { Remove-Item -Force $_.FullName } catch {}
}

# Create a clean orphan branch with a fresh history
git checkout --orphan clean-$Branch
git rm -rf --cached . 2>$null | Out-Null
git add .
git commit -m "Initial clean import (without large archives)" | Out-Null

# Configure remote and push (force to ensure remote gets the clean history)
git remote remove origin 2>$null | Out-Null
git remote add origin $Remote
git push -f origin HEAD:$Branch

# Rename local branch to target branch and set upstream
git branch -M $Branch
git push -u origin $Branch

Write-Host "Clean push completed." -ForegroundColor Green