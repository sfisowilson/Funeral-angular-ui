# Comprehensive PrimeNG to Bootstrap 5 HTML Conversion Script

$files = Get-ChildItem -Path "src" -Filter "*.html" -Recurse | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match "<p-|pInputText|pButton|pInputTextarea"
}

Write-Host "Found $($files.Count) HTML files to convert"

foreach ($file in $files) {
    Write-Host "Converting: $($file.FullName -replace [regex]::Escape((Get-Location).Path), '')"
    
    $content = Get-Content $file.FullName -Raw
    
    # ========== FORMS ==========
    # pInputText -> form-control
    $content = $content -replace '<input([^>]*?)pInputText([^>]*?)>', '<input$1class="form-control"$2>'
    $content = $content -replace 'pInputText\s+', ''
    
    # pInputTextarea -> form-control
    $content = $content -replace '<textarea([^>]*?)pInputTextarea([^>]*?)>', '<textarea$1class="form-control"$2>'
    $content = $content -replace 'pInputTextarea\s+', ''
    
    # pButton -> btn
    $content = $content -replace 'pButton\s+', ''
    $content = $content -replace 'p-button-([a-z]+)', 'btn-$1'
    
    # ========== BUTTONS ==========
    # <p-button label="Text" (onClick)="action()"> -> <button class="btn btn-primary" (click)="action()">Text</button>
    $content = $content -replace '<p-button\s+label="([^"]+)"\s+\(onClick\)="([^"]+)"\s*/>', '<button class="btn btn-primary" (click)="$2">$1</button>'
    $content = $content -replace '<p-button\s+label="([^"]+)"\s+icon="([^"]+)"\s+\(onClick\)="([^"]+)"\s*/>', '<button class="btn btn-primary" (click)="$3"><i class="bi $2"></i> $1</button>'
    
    # ========== DIALOGS/MODALS ==========
    # <p-dialog [(visible)]="show" header="Title"> -> Bootstrap modal
    $content = $content -replace '<p-dialog\s+\[\(visible\)\]="([^"]+)"\s+(?:\[style\]="[^"]*"\s+)?(?:header|title)="([^"]+)"(?:\s+\[modal\]="true")?(?:\s+\[resizable\]="[^"]*")?(?:\s+\[draggable\]="[^"]*")?>', @'
<div class="modal fade" [class.show]="$1" [style.display]="$1 ? ''block'' : ''none''" *ngIf="$1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">$2</h5>
                <button type="button" class="btn-close" (click)="$1 = false"></button>
            </div>
            <div class="modal-body">
'@
    
    # Close p-dialog tags
    $content = $content -replace '</p-dialog>', @'
            </div>
        </div>
    </div>
</div>
<div class="modal-backdrop fade" [class.show]="$1" *ngIf="$1"></div>
'@
    
    # p-footer -> modal-footer
    $content = $content -replace '<(?:ng-template\s+)?p-footer>', '<div class="modal-footer">'
    $content = $content -replace '</p-footer(?:\s*/)?>', '</div>'
    
    # ========== TABLES ==========
    # <p-table [value]="data"> -> <table class="table">
    $content = $content -replace '<p-table[^>]*>', '<div class="table-responsive"><table class="table table-hover table-striped">'
    $content = $content -replace '</p-table>', '</table></div>'
    
    # p-sortIcon -> Bootstrap icon
    $content = $content -replace '<p-sortIcon\s+field="([^"]+)"\s*/>', '<i class="bi bi-arrow-down-up"></i>'
    
    # p-tableHeaderCheckbox -> form-check-input
    $content = $content -replace '<p-tableHeaderCheckbox\s*/>', '<input type="checkbox" class="form-check-input">'
    $content = $content -replace '<p-tableCheckbox\s+\[value\]="[^"]+"\s*/>', '<input type="checkbox" class="form-check-input">'
    
    # ========== DROPDOWNS ==========
    # <p-dropdown> -> <select class="form-select">
    $content = $content -replace '<p-dropdown\s+\[\(ngModel\)\]="([^"]+)"\s+\[options\]="([^"]+)"\s+optionLabel="([^"]+)"\s+optionValue="([^"]+)"(?:\s+placeholder="([^"]*)")?(?:[^>]*)>', @'
<select class="form-select" [(ngModel)]="$1">
    <option [ngValue]="undefined">$5</option>
    <option *ngFor="let item of $2" [ngValue]="item.$4">{{ item.$3 }}</option>
</select>
'@
    
    # ========== CARDS ==========
    # <p-card> -> <div class="card">
    $content = $content -replace '<p-card(?:\s+header="([^"]+)")?>', '<div class="card"><div class="card-header" *ngIf="''$1''">$1</div><div class="card-body">'
    $content = $content -replace '</p-card>', '</div></div>'
    
    # ========== TAGS/BADGES ==========
    # <p-tag [value]="text" severity="success"> -> <span class="badge bg-success">
    $content = $content -replace '<p-tag\s+\[value\]="([^"]+)"\s+\[severity\]="([^"]+)"(?:\s*/)?>', '<span class="badge" [ngClass]="''bg-'' + $2">{{ $1 }}</span>'
    $content = $content -replace '<p-tag\s+\[value\]="([^"]+)"(?:\s*/)?>', '<span class="badge bg-secondary">{{ $1 }}</span>'
    
    # ========== TOAST/MESSAGES ==========
    # <p-toast> -> Remove (using custom alert system)
    $content = $content -replace '<p-toast(?:\s*/)?>', '<!-- Toast replaced with custom alert system -->'
    $content = $content -replace '<p-messages(?:\s*/)?>', '<!-- Messages replaced with custom alert system -->'
    
    # ========== TOOLBAR ==========
    # <p-toolbar> -> <div class="d-flex">
    $content = $content -replace '<p-toolbar[^>]*>', '<div class="d-flex justify-content-between align-items-center mb-3">'
    $content = $content -replace '</p-toolbar>', '</div>'
    
    # ng-template pTemplate="start|end" -> direct content
    $content = $content -replace '<ng-template\s+#start>', '<div>'
    $content = $content -replace '<ng-template\s+#end>', '<div>'
    $content = $content -replace '<ng-template\s+pTemplate="(?:start|left)">', '<div>'
    $content = $content -replace '<ng-template\s+pTemplate="(?:end|right)">', '<div>'
    
    # ========== ACCORDIONS ==========
    # <p-accordion> -> <div class="accordion">
    $content = $content -replace '<p-accordion(?:[^>]*)>', '<div class="accordion" id="accordion">'
    $content = $content -replace '</p-accordion>', '</div>'
    $content = $content -replace '<p-accordionTab\s+header="([^"]+)">', @'
<div class="accordion-item">
    <h2 class="accordion-header">
        <button class="accordion-button" type="button" data-bs-toggle="collapse">$1</button>
    </h2>
    <div class="accordion-collapse collapse">
        <div class="accordion-body">
'@
    $content = $content -replace '</p-accordionTab>', '</div></div></div>'
    
    # ========== CHECKBOXES ==========
    # <p-checkbox> -> <input type="checkbox" class="form-check-input">
    $content = $content -replace '<p-checkbox\s+\[\(ngModel\)\]="([^"]+)"(?:\s+\[binary\]="[^"]*")?(?:\s+label="([^"]*)")?(?:\s*/)?>', '<div class="form-check"><input type="checkbox" class="form-check-input" [(ngModel)]="$1"><label class="form-check-label">$2</label></div>'
    
    # ========== FILE UPLOAD ==========
    # <p-fileUpload> -> <input type="file">
    $content = $content -replace '<p-fileUpload(?:[^>]*)>', '<input type="file" class="form-control">'
    
    # ========== CALENDAR/DATE ==========
    # <p-calendar> -> <input type="date">
    $content = $content -replace '<p-calendar\s+\[\(ngModel\)\]="([^"]+)"(?:[^>]*)>', '<input type="date" class="form-control" [(ngModel)]="$1">'
    
    # ========== INPUT NUMBER ==========
    # <p-inputNumber> -> <input type="number">
    $content = $content -replace '<p-inputNumber\s+\[\(ngModel\)\]="([^"]+)"(?:[^>]*)>', '<input type="number" class="form-control" [(ngModel)]="$1">'
    
    # ========== PROGRESS ==========
    # <p-progressBar> -> <div class="progress">
    $content = $content -replace '<p-progressBar\s+\[value\]="([^"]+)"(?:\s*/)?>', '<div class="progress"><div class="progress-bar" [style.width.%]="$1"></div></div>'
    $content = $content -replace '<p-progressSpinner(?:\s*/)?>', '<div class="spinner-border" role="status"></div>'
    
    # ========== CONFIRM DIALOG ==========
    # <p-confirmDialog> -> Remove (using custom confirmation)
    $content = $content -replace '<p-confirmDialog(?:\s*/)?>', '<!-- ConfirmDialog replaced with custom confirmation system -->'
    $content = $content -replace '<p-confirmDialog(?:[^>]*)>', '<!-- ConfirmDialog replaced with custom confirmation system -->'
    
    # ========== STEPS ==========
    # <p-steps> -> Bootstrap nav-tabs
    $content = $content -replace '<p-steps\s+\[model\]="([^"]+)"(?:[^>]*)>', '<ul class="nav nav-tabs mb-3"><li class="nav-item" *ngFor="let step of $1; let i = index"><a class="nav-link" [class.active]="i === activeStep">{{ step.label }}</a></li></ul>'
    
    # ========== MENU ==========
    # <p-menu> -> Remove (layout specific)
    $content = $content -replace '<p-menu(?:\s*/)?>', '<!-- Menu component needs manual conversion -->'
    
    # ========== TOOLTIPS ==========
    $content = $content -replace 'pTooltip="([^"]+)"', 'title="$1" data-bs-toggle="tooltip"'
    
    # ========== ICONS ==========
    # pi pi-* -> bi bi-*
    $content = $content -replace 'pi pi-check', 'bi bi-check-lg'
    $content = $content -replace 'pi pi-times', 'bi bi-x-lg'
    $content = $content -replace 'pi pi-trash', 'bi bi-trash'
    $content = $content -replace 'pi pi-pencil', 'bi bi-pencil'
    $content = $content -replace 'pi pi-plus', 'bi bi-plus-lg'
    $content = $content -replace 'pi pi-search', 'bi bi-search'
    $content = $content -replace 'pi pi-upload', 'bi bi-upload'
    $content = $content -replace 'pi pi-download', 'bi bi-download'
    $content = $content -replace 'pi pi-calendar', 'bi bi-calendar'
    $content = $content -replace 'pi pi-user', 'bi bi-person'
    $content = $content -replace 'pi pi-cog', 'bi bi-gear'
    $content = $content -replace 'pi pi-bars', 'bi bi-list'
    
    # ========== SEVERITY MAPPINGS ==========
    $content = $content -replace 'severity="success"', 'class="text-success"'
    $content = $content -replace 'severity="info"', 'class="text-info"'
    $content = $content -replace 'severity="warn"', 'class="text-warning"'
    $content = $content -replace 'severity="error"', 'class="text-danger"'
    $content = $content -replace 'severity="danger"', 'class="text-danger"'
    
    # ========== RIPPLE & STYLE CLASS ==========
    $content = $content -replace '\s+pRipple', ''
    $content = $content -replace '\s+pStyleClass="[^"]*"', ''
    
    # ========== CLEAN UP ==========
    # Remove empty attributes
    $content = $content -replace '\s+class=""', ''
    $content = $content -replace 'class="form-control"\s+class="', 'class="form-control '
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "`n✅ Converted $($files.Count) HTML files from PrimeNG to Bootstrap 5"
Write-Host "`nNote: Some complex components may need manual review."
