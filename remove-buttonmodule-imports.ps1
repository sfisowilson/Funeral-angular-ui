# PowerShell script to remove ButtonModule imports from TypeScript files
# After converting p-button elements to Bootstrap buttons

$files = @(
    "src\app\pages\timesheets\timesheets.component.ts",
    "src\app\pages\tenants\tenants.component.ts",
    "src\app\pages\tenant-settings\tenant-settings.component.ts",
    "src\app\pages\subscription-plans\subscription-plans.component.ts",
    "src\app\pages\roles\roles.component.ts",
    "src\app\pages\policies\policies.component.ts",
    "src\app\pages\policy\policy.component.ts",
    "src\app\pages\policy-attributes\policy-attributes.component.ts",
    "src\app\pages\personnel\personnel.component.ts",
    "src\app\pages\member-onboarding\member-onboarding.component.ts",
    "src\app\pages\auth\login.component.ts",
    "src\app\pages\auth\register.component.ts",
    "src\app\pages\auth\forgot-password.component.ts",
    "src\app\pages\auth\reset-password.component.ts",
    "src\app\shared\components\verification-status\verification-status.component.ts",
    "src\app\shared\components\identity-verification-widget\identity-verification-widget.component.ts"
)

Write-Host "Removing ButtonModule imports from converted components..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Cyan
        
        # Read file content
        $content = Get-Content $fullPath -Raw
        
        # Check if ButtonModule is present
        if ($content -match "ButtonModule") {
            # Remove import line
            $content = $content -replace "import \{ ButtonModule \} from 'primeng/button';\r?\n", ""
            
            # Remove from imports array
            $content = $content -replace ",\s*ButtonModule", ""
            $content = $content -replace "ButtonModule,\s*", ""
            $content = $content -replace "\[\s*ButtonModule\s*\]", "[]"
            
            # Write back to file
            Set-Content -Path $fullPath -Value $content -NoNewline
            
            Write-Host "  ✓ Removed ButtonModule" -ForegroundColor Green
        } else {
            Write-Host "  - ButtonModule not found (already removed or not present)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done! Please review the changes and test the application." -ForegroundColor Green
