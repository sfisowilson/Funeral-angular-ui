import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { WidgetConfig } from '../widget-config';
import { hexToRgba } from '../widget-color.utils';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
}

@Component({
    selector: 'app-team-editor-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './team-editor-widget.component.html',
    styleUrls: ['./team-editor-widget.component.scss']
})
export class TeamEditorWidgetComponent implements OnInit {
    @Input() config!: WidgetConfig;

    ngOnInit(): void {
        console.log('🏢 Team Editor Widget initialized');
        console.log('Widget config:', this.config);
        console.log('Team members:', this.teamMembers);
    }

    get teamMembers(): TeamMember[] {
        const members = this.config?.settings?.teamMembers || [];
        console.log('Getting team members:', members);
        return members;
    }

    get backgroundColor(): string { return hexToRgba(this.config?.settings?.backgroundColor || '#ffffff', this.config?.settings?.backgroundOpacity ?? 1); }
    get titleColor(): string { return this.config?.settings?.titleColor || '#1a1a1a'; }
    get cardBackgroundColor(): string { return hexToRgba(this.config?.settings?.cardBackgroundColor || '#f8f9fa', this.config?.settings?.cardBackgroundOpacity ?? 1); }
    get nameColor(): string { return this.config?.settings?.nameColor || '#1a1a1a'; }
    get roleColor(): string { return this.config?.settings?.roleColor || '#6c757d'; }
    get emailColor(): string { return this.config?.settings?.emailColor || '#0d6efd'; }
    get subtitleColor(): string { return this.config?.settings?.subtitleColor || '#6c757d'; }
}
