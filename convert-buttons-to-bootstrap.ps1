# PowerShell script to convert remaining p-button elements to Bootstrap buttons
# This script converts PrimeNG p-button components to Bootstrap button elements

$files = @(
    "src\app\pages\subscription-plans\subscription-plans.component.html",
    "src\app\pages\roles\roles.component.html",
    "src\app\pages\policy-attributes\policy-attributes.component.html",
    "src\app\pages\policy\policy.component.html",
    "src\app\pages\policies\policies.component.html",
    "src\app\pages\personnel\personnel.component.html",
    "src\app\pages\claims\claims.component.html",
    "src\app\pages\beneficiaries\beneficiaries.component.html",
    "src\app\pages\dependents\dependents.component.html",
    "src\app\pages\assets\assets.component.html",
    "src\app\pages\asset-management\asset-management.component.html",
    "src\app\pages\funeral-events\funeral-events.component.html",
    "src\app\pages\member-management\member-management.component.html",
    "src\app\pages\dashboard-settings\dashboard-settings.component.html",
    "src\app\pages\onboarding-settings\terms-management\terms-management.component.html",
    "src\app\pages\onboarding-settings\required-documents\required-documents.component.html",
    "src\app\pages\onboarding-settings\onboarding-settings.component.html",
    "src\app\pages\member-onboarding\steps\documents-step.component.html",
    "src\app\pages\member-onboarding\steps\dependents-step.component.html",
    "src\app\pages\member-onboarding\steps\beneficiaries-step.component.html",
    "src\app\pages\auth\login.component.html",
    "src\app\pages\auth\register.component.html",
    "src\app\pages\auth\forgot-password.component.html",
    "src\app\pages\auth\reset-password.component.html",
    "src\app\pages\auth\policy-selection-modal\policy-selection-modal.component.html",
    "src\app\pages\auth\change-password-dialog\change-password-dialog.component.html",
    "src\app\pages\landing\landing-page.component.html",
    "src\app\pages\landing\components\hero-banner.component.html",
    "src\app\building-blocks\**\*.component.html"
)

Write-Host "This script will help identify files that need manual conversion." -ForegroundColor Yellow
Write-Host "Please review the following files for p-button elements:" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        if ($content -match "p-button") {
            Write-Host "Found p-button in: $file" -ForegroundColor Cyan
        }
    }
}

Write-Host ""
Write-Host "Manual conversion guidelines:" -ForegroundColor Green
Write-Host "1. Replace <p-button> tags with <button type='button'>" -ForegroundColor White
Write-Host "2. Convert PrimeNG classes to Bootstrap:" -ForegroundColor White
Write-Host "   - p-button-primary -> btn btn-primary" -ForegroundColor White
Write-Host "   - p-button-secondary -> btn btn-secondary" -ForegroundColor White
Write-Host "   - p-button-success -> btn btn-success" -ForegroundColor White
Write-Host "   - p-button-danger -> btn btn-danger" -ForegroundColor White
Write-Host "   - [outlined]='true' -> btn-outline-*" -ForegroundColor White
Write-Host "   - [rounded]='true' -> rounded-circle (for icon buttons)" -ForegroundColor White
Write-Host "3. Convert (onClick) to (click)" -ForegroundColor White
Write-Host "4. Move icon attribute to <i> tag inside button" -ForegroundColor White
Write-Host "5. For loading states, use Bootstrap spinner-border" -ForegroundColor White
