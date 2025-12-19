# Comment out all PrimeNG p- components in HTML files

$htmlFiles = Get-ChildItem -Path "src" -Filter "*.html" -Recurse | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match "<p-"
}

Write-Host "Found $($htmlFiles.Count) HTML files with PrimeNG components"

foreach ($file in $htmlFiles) {
    Write-Host "Processing: $($file.Name)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Comment out p- component tags (opening and closing)
    # This is a simple approach - just add <!-- before <p- and --> after closing tags
    $content = $content -replace "<p-([a-zA-Z-]+)", "<!-- <p-`$1"
    $content = $content -replace "</p-([a-zA-Z-]+)>", "</p-`$1> -->"
    $content = $content -replace "/>", " /> -->"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "Done! Commented out PrimeNG components in $($htmlFiles.Count) files"
