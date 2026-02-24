<#
.SYNOPSIS
    Create GitHub issues from tasks.md for feature 001-discord-proxy-bot

.DESCRIPTION
    Parses tasks from specs/001-discord-proxy-bot/tasks.md and creates GitHub issues
    using the GitHub CLI (gh). Automatically creates missing labels and skips existing issues.

.PARAMETER DryRun
    Preview issues without creating them

.PARAMETER StartFrom
    Start from specific task number (default: 1)

.PARAMETER EndAt
    End at specific task number (default: 128)
#>

param(
    [switch]$DryRun,
    [int]$StartFrom = 1,
    [int]$EndAt = 128,
    [string]$Repo = "ericksantos12/ProxyTickets"
)

$ErrorActionPreference = "Stop"

$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"
$ColorSkip = "DarkGray"

function Write-Info($msg) { Write-Host "INFO: $msg" -ForegroundColor $ColorInfo }
function Write-Success($msg) { Write-Host "✓ $msg" -ForegroundColor $ColorSuccess }
function Write-Warn($msg) { Write-Host "⚠ $msg" -ForegroundColor $ColorWarning }
function Write-Fail($msg) { Write-Host "✗ $msg" -ForegroundColor $ColorError }
function Write-Skip($msg) { Write-Host "⏭ $msg" -ForegroundColor $ColorSkip }

function Get-RandomColor {
    $colors = @("B60205", "D93F0B", "FBCA04", "0E8A16", "006B75", "1D76DB", "0052CC", "5319E7", "E99695", "F9D0C4", "FEF2C0", "C2E0C6", "BFDADC", "D4C5F9")
    return $colors | Get-Random
}

function Ensure-Labels {
    param (
        [string[]]$RequiredLabels
    )
    
    Write-Info "Checking labels..."
    
    try {
        $existingJson = gh label list --repo $Repo --limit 500 --json name 2>$null | Out-String
        if (-not [string]::IsNullOrWhiteSpace($existingJson)) {
            $existingLabels = ($existingJson | ConvertFrom-Json).name
        } else {
            $existingLabels = @()
        }
    } catch {
        Write-Warn "Could not fetch existing labels. Assuming all need creation."
        $existingLabels = @()
    }

    $uniqueNeeded = $RequiredLabels | Select-Object -Unique

    foreach ($label in $uniqueNeeded) {
        if ($label -notin $existingLabels) {
            if ($DryRun) {
                Write-Warn "[DRY RUN] Would create label: $label"
            } else {
                $color = Get-RandomColor
                Write-Info "Creating missing label: $label (Color: #$color)"
                gh label create "$label" --color $color --repo $Repo --force 2>&1 | Out-Null
            }
        }
    }
}

Write-Info "Checking prerequisites..."

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Fail "GitHub CLI (gh) not found. Install from: https://cli.github.com/"
    exit 1
}

$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Not authenticated with GitHub. Run: gh auth login"
    exit 1
}

$repoRoot = git rev-parse --show-toplevel 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Not in a git repository"
    exit 1
}

$tasksFile = Join-Path $repoRoot "specs/001-discord-proxy-bot/tasks.md"
if (-not (Test-Path $tasksFile)) {
    Write-Fail "Tasks file not found: $tasksFile"
    exit 1
}

Write-Success "Tasks file found: $tasksFile"

Write-Info "Parsing tasks from $tasksFile..."

$content = Get-Content $tasksFile -Raw
$tasks = @()

$pattern = '- \[ \] (T\d{3})\s*(?:\[P\])?\s*(?:\[(US\d+)\])?\s*(.+?)(?=\n|$)'
$matches = [regex]::Matches($content, $pattern)

foreach ($match in $matches) {
    $taskId = $match.Groups[1].Value
    $userStory = $match.Groups[2].Value
    $description = $match.Groups[3].Value.Trim()
    
    $taskNum = [int]($taskId -replace 'T', '')
    
    $phase = switch ($taskNum) {
        { $_ -ge 1 -and $_ -le 11 }   { "Phase 1: Setup" }
        { $_ -ge 12 -and $_ -le 30 }  { "Phase 2: Foundation" }
        { $_ -ge 31 -and $_ -le 44 }  { "Phase 3: US1 - Tickets" }
        { $_ -ge 45 -and $_ -le 60 }  { "Phase 4: US2 - Forms" }
        { $_ -ge 61 -and $_ -le 83 }  { "Phase 5: US3 - Payment" }
        { $_ -ge 84 -and $_ -le 99 }  { "Phase 6: US4 - Processing" }
        { $_ -ge 100 -and $_ -le 115 } { "Phase 7: US5 - Admin" }
        { $_ -ge 116 -and $_ -le 128 } { "Phase 8: Polish" }
        default { "Unknown" }
    }
    
    $labels = @("001-discord-proxy-bot")
    
    if ($phase -match "Phase (\d+)") {
        $pNum = $matches[1]
        switch ($pNum) {
            "1" { $labels += "phase:setup" }
            "2" { $labels += "phase:foundation" }
            "3" { $labels += "phase:us1" }
            "4" { $labels += "phase:us2" }
            "5" { $labels += "phase:us3" }
            "6" { $labels += "phase:us4" }
            "7" { $labels += "phase:us5" }
            "8" { $labels += "phase:polish" }
        }
    }
    
    if ($description -match "test|Unit test|Integration test|Contract test") {
        $labels += "type:test"
    } elseif ($description -match "Create .+|Add .+") {
        $labels += "type:implementation"
    } elseif ($description -match "Install|Configure") {
        $labels += "type:setup"
    } elseif ($description -match "documentation|README|guide") {
        $labels += "type:docs"
    }
    
    if ($userStory) { $labels += $userStory.ToLower() }
    
    if ($phase -match "Phase 1|Phase 2") {
        $labels += "priority:critical"
    } elseif ($phase -match "Phase 3") {
        $labels += "priority:high"
    } elseif ($phase -match "Phase 4|Phase 5") {
        $labels += "priority:medium"
    } else {
        $labels += "priority:low"
    }
    
    $body = @"
**Task ID**: $taskId
**Phase**: $phase
**Description**: $description

---

**Related Files**:
- Spec: [specs/001-discord-proxy-bot/spec.md](../blob/001-discord-proxy-bot/specs/001-discord-proxy-bot/spec.md)
- Tasks: [specs/001-discord-proxy-bot/tasks.md](../blob/001-discord-proxy-bot/tasks.md)
- Plan: [specs/001-discord-proxy-bot/plan.md](../blob/001-discord-proxy-bot/specs/001-discord-proxy-bot/plan.md)

**Constitution Note**: Per Constitution v2.0.0, tests are optional but encouraged.

---
*Auto-generated from tasks.md*
"@
    
    $tasks += [PSCustomObject]@{
        Id = $taskId
        Number = $taskNum
        Phase = $phase
        Title = "$taskId - $description"
        Body = $body
        Labels = $labels
    }
}

Write-Success "Parsed $($tasks.Count) tasks"

$filteredTasks = $tasks | Where-Object { $_.Number -ge $StartFrom -and $_.Number -le $EndAt }
Write-Info "Targeting tasks $StartFrom to $EndAt ($($filteredTasks.Count) tasks)"

$allLabels = $filteredTasks.Labels
Ensure-Labels -RequiredLabels $allLabels

Write-Info "Buscando issues já existentes pra evitar duplicata..."
$existingTitles = @()
try {
    $existingIssuesJson = gh issue list --repo $Repo --state all --limit 1000 --json title 2>$null | Out-String
    if (-not [string]::IsNullOrWhiteSpace($existingIssuesJson)) {
        $parsed = $existingIssuesJson | ConvertFrom-Json
        if ($null -ne $parsed) {
            $existingTitles = @($parsed.title)
        }
    }
} catch {
    Write-Warn "Não consegui puxar as issues existentes, vai tentar criar tudo e pode duplicar."
}

Write-Info "Achamos $($existingTitles.Count) issues cadastradas no repo."

if ($DryRun) {
    Write-Warn "DRY RUN MODE - No issues will be created"
} else {
    $confirm = Read-Host "Create $($filteredTasks.Count) GitHub issues in $Repo? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Info "Cancelled"
        exit 0
    }
}

$created = 0
$skipped = 0
$failed = 0

foreach ($task in $filteredTasks) {
    Write-Progress -Activity "Creating Issues" -Status $task.Id -PercentComplete (($created + $skipped + $failed) / $filteredTasks.Count * 100)
    
    $isDupe = $false
    foreach ($title in $existingTitles) {
        if ($title -match "^$($task.Id)\b") {
            $isDupe = $true
            break
        }
    }

    if ($isDupe) {
        Write-Skip "$($task.Id) já existe no repo. Pulando..."
        $skipped++
        continue
    }

    if ($DryRun) {
        Write-Host "[DRY RUN] $($task.Title)" -ForegroundColor Yellow
        continue
    }
    
    try {
        $ghArgs = @("issue", "create", "--title", $task.Title, "--body", $task.Body, "--repo", $Repo)
        foreach ($lbl in $task.Labels) {
            $ghArgs += "--label"
            $ghArgs += $lbl
        }

        $result = gh @ghArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$($task.Id) created: $result"
            $created++
        } else {
            throw $result
        }
        
        Start-Sleep -Milliseconds 1000
    } catch {
        Write-Fail "$($task.Id) failed: $_"
        $failed++
    }
}

Write-Host ""
Write-Success "Criadas: $created"
Write-Skip "Puladas: $skipped"
if ($failed -gt 0) { Write-Fail "Falhas: $failed" }

Write-Host ""
Write-Host "View: https://github.com/$Repo/issues?q=label:001-discord-proxy-bot"

exit $(if ($failed -gt 0) { 1 } else { 0 })