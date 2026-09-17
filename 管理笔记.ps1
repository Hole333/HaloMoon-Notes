param(
    [ValidateSet('menu', 'new', 'delete', 'sync', 'pull')]
    [string]$Action = 'menu'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$NotesRoot = Join-Path $RepoRoot 'notes'
Set-Location $RepoRoot

function Invoke-Git([string[]]$Arguments, [switch]$AllowFailure) {
    & git @Arguments
    if (-not $AllowFailure -and $LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed"
    }
    return $LASTEXITCODE
}

function Test-Slug([string]$Value) {
    return $Value -match '^[a-z0-9]+(?:-[a-z0-9]+)*$'
}

function Sync-Notes {
    Invoke-Git @('pull', '--rebase', '--autostash')
    Invoke-Git @('add', '-A')
    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'No note changes to sync.' -ForegroundColor Yellow
        return
    }
    $defaultMessage = 'notes: sync ' + (Get-Date -Format 'yyyy-MM-dd HH:mm')
    $message = Read-Host "Commit message (default: $defaultMessage)"
    if ([string]::IsNullOrWhiteSpace($message)) { $message = $defaultMessage }
    Invoke-Git @('commit', '-m', $message)
    Invoke-Git @('push')
    Write-Host 'Notes pushed. GitHub Actions is updating the blog.' -ForegroundColor Green
}

function New-Note {
    $categories = Get-ChildItem -LiteralPath $NotesRoot -Directory | Sort-Object Name
    Write-Host "`nCategories:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $categories.Count; $i++) { Write-Host "[$($i + 1)] $($categories[$i].Name)" }
    $choice = Read-Host 'Choose a category number, or type a new lowercase category name'
    $category = if ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $categories.Count) {
        $categories[[int]$choice - 1].Name
    } else { $choice.Trim().ToLowerInvariant() }
    if (-not (Test-Slug $category)) { throw 'Category must contain lowercase letters, numbers, and single hyphens only.' }
    $categoryDir = Join-Path $NotesRoot $category
    New-Item -ItemType Directory -Force -Path $categoryDir | Out-Null

    $title = Read-Host 'Note title'
    if ([string]::IsNullOrWhiteSpace($title)) { throw 'Title is required.' }
    $description = Read-Host 'Short description'
    if ([string]::IsNullOrWhiteSpace($description)) { $description = $title }
    $tagsInput = Read-Host 'Tags, separated by commas'
    if ([string]::IsNullOrWhiteSpace($tagsInput)) { $tagsInput = $category }
    $defaultSlug = 'note-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
    $slug = Read-Host "URL slug (default: $defaultSlug)"
    if ([string]::IsNullOrWhiteSpace($slug)) { $slug = $defaultSlug }
    $slug = $slug.Trim().ToLowerInvariant()
    if (-not (Test-Slug $slug)) { throw 'Slug must contain lowercase letters, numbers, and single hyphens only.' }

    $file = Join-Path $categoryDir "$slug.md"
    if (Test-Path -LiteralPath $file) { throw "Note already exists: $file" }
    $date = Get-Date -Format 'yyyy-MM-dd'
    $safeTitle = $title.Replace("'", "''")
    $safeDescription = $description.Replace("'", "''")
    $tags = ($tagsInput -split '[,，]' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $tagsYaml = ($tags | ForEach-Object { "'$($_.Replace("'", "''"))'" }) -join ', '
    @"
---
title: '$safeTitle'
description: '$safeDescription'
created: '$date'
updated: '$date'
tags: [$tagsYaml]
draft: false
---

<!-- Write the note here, save it, then return to this window. -->
"@ | Set-Content -Encoding utf8 -LiteralPath $file

    Write-Host "Created: $file" -ForegroundColor Green
    $vscode = Get-Command code -ErrorAction SilentlyContinue
    if ($vscode) {
        Write-Host 'Opening the Markdown note in VS Code. Save it, then close the editor tab/window to continue.' -ForegroundColor Cyan
        & $vscode.Source --wait $file
        if ($LASTEXITCODE -ne 0) { throw 'VS Code exited with an error.' }
    } else {
        Start-Process -FilePath $file
        Read-Host 'After saving the note, press Enter to sync and publish'
    }
    $content = Get-Content -Raw -LiteralPath $file
    $body = [regex]::Replace($content, '^---[\s\S]*?---', '')
    $body = [regex]::Replace($body, '<!--[\s\S]*?-->', '').Trim()
    if ([string]::IsNullOrWhiteSpace($body)) { throw 'The note body is empty. The file was kept but not published.' }
    Sync-Notes
}

function Remove-Note {
    $files = @(Get-ChildItem -LiteralPath $NotesRoot -Filter '*.md' -File -Recurse | Sort-Object FullName)
    if ($files.Count -eq 0) { Write-Host 'No notes found.' -ForegroundColor Yellow; return }
    for ($i = 0; $i -lt $files.Count; $i++) {
        $relative = [System.IO.Path]::GetRelativePath($RepoRoot, $files[$i].FullName)
        $titleLine = Select-String -LiteralPath $files[$i].FullName -Pattern '^title:\s*["'']?(.*?)["'']?$' | Select-Object -First 1
        $label = if ($titleLine) { $titleLine.Matches[0].Groups[1].Value } else { $files[$i].BaseName }
        Write-Host "[$($i + 1)] $label  ($relative)"
    }
    $choice = Read-Host 'Choose the note number to delete'
    if ($choice -notmatch '^\d+$' -or [int]$choice -lt 1 -or [int]$choice -gt $files.Count) { throw 'Invalid selection.' }
    $target = $files[[int]$choice - 1]
    $resolvedRoot = [System.IO.Path]::GetFullPath($NotesRoot)
    $resolvedTarget = [System.IO.Path]::GetFullPath($target.FullName)
    if (-not $resolvedTarget.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Delete target is outside the notes directory.' }
    $confirm = Read-Host "Type DELETE to remove $($target.Name)"
    if ($confirm -cne 'DELETE') { Write-Host 'Cancelled.'; return }
    Remove-Item -LiteralPath $resolvedTarget -Force
    Sync-Notes
}

function Show-Menu {
    Write-Host "`nHaloMoon Notes" -ForegroundColor Cyan
    Write-Host '[1] New note and publish'
    Write-Host '[2] Delete note and publish'
    Write-Host '[3] Sync existing changes'
    Write-Host '[4] Pull remote changes'
    $choice = Read-Host 'Choose an action'
    switch ($choice) {
        '1' { New-Note }
        '2' { Remove-Note }
        '3' { Sync-Notes }
        '4' { Invoke-Git @('pull', '--rebase', '--autostash') }
        default { throw 'Invalid selection.' }
    }
}

switch ($Action) {
    'new' { New-Note }
    'delete' { Remove-Note }
    'sync' { Sync-Notes }
    'pull' { Invoke-Git @('pull', '--rebase', '--autostash') }
    default { Show-Menu }
}
