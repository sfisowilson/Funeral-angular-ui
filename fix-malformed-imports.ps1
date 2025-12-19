# Fix malformed imports arrays in specific files

$files = @(
    "src/app/pages/personnel/personnel.component.ts",
    "src/app/pages/policies/policies.component.ts",
    "src/app/pages/policy/policy.component.ts",
    "src/app/pages/policy-attributes/policy-attributes.component.ts",
    "src/app/pages/roles/roles.component.ts",
    "src/app/pages/tenant-settings/tenant-settings.component.ts",
    "src/app/pages/onboarding-settings/terms-management/terms-management.component.ts",
    "src/app/pages/onboarding-settings/required-documents/required-documents.component.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path (Get-Location) $file
    if (Test-Path $fullPath) {
        $content = Get-Content -Path $fullPath -Raw
        
        # Fix imports line with malformed modules
        $content = $content -replace "imports:\s*\[CommonModule,\s*FormsModule[^\]]*\]", "imports: [CommonModule, FormsModule]"
        $content = $content -replace "imports:\s*\[\s*CommonModule[^\]]*\]", "imports: [CommonModule, FormsModule]"
        
        # Fix constructor with orphaned private:
        $content = $content -replace "constructor\(\s*private:\)\s*\{\}", "constructor() {}"
        $content = $content -replace "constructor\(\s*private:\s*private\s+", "constructor(private "
        
        # Fix messageService/confirmationService method calls
        $content = $content -replace "this\.\.(add|confirm)\(", "// Removed PrimeNG toast call: this.messageService.`$1("
        
        Set-Content -Path $fullPath -Value $content -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "`n✅ Fixed malformed imports arrays"
