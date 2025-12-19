# Script to clean up imports arrays and remove MessageService/ConfirmationService from components

$files = Get-ChildItem -Path "src" -Filter "*.component.ts" -Recurse

Write-Host "Processing $($files.Count) component files"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Remove PrimeNG modules from imports arrays
    $primengModules = @(
        'ButtonModule', 'CardModule', 'InputTextModule', 'InputTextarea', 'InputMaskModule',
        'PasswordModule', 'CheckboxModule', 'DropdownModule', 'CalendarModule', 'FileUploadModule',
        'TableModule', 'DialogModule', 'ToastModule', 'MessageModule', 'TooltipModule',
        'MessagesModule', 'ConfirmDialogModule', 'ToolbarModule', 'TagModule', 'ProgressSpinnerModule',
        'AccordionModule', 'StepperModule', 'SelectButtonModule', 'RippleModule', 'StyleClassModule',
        'MenuModule', 'CarouselModule', 'ColorPickerModule', 'FieldsetModule', 'RadioButtonModule',
        'SliderModule', 'EditorModule', 'InputNumberModule', 'MultiSelectModule', 'OverlayPanelModule'
    )
    
    foreach ($module in $primengModules) {
        if ($content -match $module) {
            # Remove from imports array (with comma before or after)
            $content = $content -replace ",?\s*$module\s*,?", ""
            $modified = $true
        }
    }
    
    # Clean up MessageService and ConfirmationService from providers
    $content = $content -replace ",?\s*MessageService\s*,?", ""
    $content = $content -replace ",?\s*ConfirmationService\s*,?", ""
    
    # Clean up empty lines in arrays
    $content = $content -replace "\[\s*,", "["
    $content = $content -replace ",\s*,", ","
    $content = $content -replace ",\s*\]", "]"
    $content = $content -replace "\[\s+\]", "[]"
    
    # Clean up providers array if it becomes empty
    $content = $content -replace "providers:\s*\[\s*\],?\s*\n", ""
    
    if ($modified) {
        Write-Host "  Fixed: $($file.Name)"
        Set-Content -Path $file.FullName -Value $content -NoNewline
    }
}

Write-Host "Done!"
