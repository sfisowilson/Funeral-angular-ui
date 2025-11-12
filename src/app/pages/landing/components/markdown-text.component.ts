import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from '@app/shared/pipes/safe-html.pipe';

@Component({
    selector: 'app-markdown-text',
    standalone: true,
    imports: [CommonModule, SafeHtmlPipe],
    template: `<div [innerHTML]="content.markdown | safeHtml"></div>`
})
export class MarkdownTextComponent {
    @Input() content: any;
}
