import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        Site by
        <a href="https://sfiso.mizo.co.za" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Sfiso Wilson</a>
    </div>`
})
export class AppFooter {}
