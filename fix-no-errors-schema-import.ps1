# Add NO_ERRORS_SCHEMA import to all component files that use it

$files = Get-ChildItem -Path "src" -Recurse -Filter "*.component.ts"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if file has schemas: [NO_ERRORS_SCHEMA] but no import
    if ($content -match "schemas:\s*\[NO_ERRORS_SCHEMA\]" -and $content -notmatch "import.*NO_ERRORS_SCHEMA") {
        # Add import after @angular/core import
        $content = $content -replace "(import\s*\{[^}]*)\}\s*from\s*'@angular/core';", "`$1, NO_ERRORS_SCHEMA } from '@angular/core';"
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "`n✅ Fixed NO_ERRORS_SCHEMA imports"
