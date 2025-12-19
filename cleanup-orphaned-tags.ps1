# Clean up orphaned closing tags from conversion

$files = Get-ChildItem -Path "src" -Filter "*.html" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Remove orphaned p- closing tags
    $content = $content -replace '</p-toast>', ''
    $content = $content -replace '</p-checkbox>', ''
    $content = $content -replace '</p-fileUpload>', ''
    $content = $content -replace '</p-button>', ''
    $content = $content -replace '</p-inputNumber>', ''
    $content = $content -replace '</p-calendar>', ''
    $content = $content -replace '</p-dropdown>', ''
    $content = $content -replace '</p-progressBar>', ''
    $content = $content -replace '</p-progressSpinner>', ''
    $content = $content -replace '</p-tag>', ''
    $content = $content -replace '</p-messages>', ''
    $content = $content -replace '</p-steps>', ''
    $content = $content -replace '</p-menu>', ''
    $content = $content -replace '</p-selectButton>', ''
    $content = $content -replace '</p-iconfield>', ''
    $content = $content -replace '</p-inputicon>', ''
    
    # Clean up extra divs from ng-template conversions
    $content = $content -replace '</div>\s*</ng-template>', '</ng-template>'
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "✅ Cleaned up orphaned tags"
