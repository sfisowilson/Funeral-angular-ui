# Fix HTML structure issues after conversion

$files = Get-ChildItem -Path "src/app/building-blocks" -Filter "*.html" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Remove duplicate/nested accordion wrappers
    $content = $content -replace '<div class="accordion" id="accordion">\s*<div class="accordion" id="accordion">', '<div class="accordion" id="accordion">'
    $content = $content -replace '</div></div></div>\s*<div class="accordion"', '</div></div>
<div class="accordion"'
    
    # Fix extra closing divs at end of accordion items
    $content = $content -replace '</div></div></div>\s*</div>', '</div></div></div>'
    $content = $content -replace '</div></div></div></div>', '</div></div></div>'
    
    # Remove standalone </div></div> orphans
    $content = $content -replace '</div></div>\s*$', '</div>'
    
    if ($content -ne $original) {
        Write-Host "Fixed: $($file.Name)"
        Set-Content -Path $file.FullName -Value $content -NoNewline
    }
}

Write-Host "✅ Fixed accordion structures"
