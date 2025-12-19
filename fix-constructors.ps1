# Fix broken constructors with "private:"

$files = Get-ChildItem -Path "src" -Filter "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match "private:\s*\n") {
        Write-Host "Fixing: $($file.Name)"
        
        # Remove orphaned "private:" lines
        $content = $content -replace "private:\s*\n\s*private", "private"
        $content = $content -replace "private:\s*\n\s*\)", ")"
        $content = $content -replace "\(\s*private:\s*\n\s*private", "(private"
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
    }
}

Write-Host "Done!"
