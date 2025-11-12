import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { WidgetConfig } from '../widget-config';

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
}
