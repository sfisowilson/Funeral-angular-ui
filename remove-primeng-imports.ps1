# Script to remove all PrimeNG imports from TypeScript files

$files = Get-ChildItem -Path "src" -Filter "*.ts" -Recurse | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match "from 'primeng"
}

Write-Host "Found $($files.Count) files with PrimeNG imports"

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Remove all PrimeNG import lines
    $content = $content -replace "import\s+\{[^}]+\}\s+from\s+'primeng/[^']+';?\r?\n", ""
    $content = $content -replace "import\s+\{[^}]+\}\s+from\s+`"primeng/[^`"]+`";?\r?\n", ""
    
    # Clean up multiple blank lines
    $content = $content -replace "(\r?\n){3,}", "`r`n`r`n"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "Done! Removed PrimeNG imports from $($files.Count) files"
