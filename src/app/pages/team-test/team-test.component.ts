import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamEditorWidgetComponent } from '../../building-blocks/team-editor-widget/team-editor-widget.component';
import { TeamEditorComponent } from '../../building-blocks/team-editor-widget/team-editor.component';
import { WidgetConfig } from '../../building-blocks/widget-config';

@Component({
    selector: 'app-team-test',
    standalone: true,
    imports: [CommonModule, TeamEditorWidgetComponent, TeamEditorComponent],
    templateUrl: './team-test.component.html',
    styleUrl: './team-test.component.scss'
})
export class TeamTestComponent {
    displayConfig: WidgetConfig = {
        id: 'display-team-widget',
        type: 'team-editor',
        settings: {
            title: 'Development Team',
            teamMembers: [
                {
                    id: '1',
                    name: 'Alice Johnson',
                    email: 'alice@company.com',
                    role: 'Frontend Developer'
                },
                {
                    id: '2',
                    name: 'Bob Smith',
                    email: 'bob@company.com',
                    role: 'Backend Developer'
                },
                {
                    id: '3',
                    name: 'Carol Davis',
                    email: 'carol@company.com',
                    role: 'UI/UX Designer'
                }
            ]
        }
    };

    editorConfig: WidgetConfig = {
        id: 'editor-team-widget',
        type: 'team-editor',
        settings: {
            title: 'Editable Team',
            teamMembers: [
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: 'Project Manager'
                }
            ]
        }
    };

    emptyConfig: WidgetConfig = {
        id: 'empty-team-widget',
        type: 'team-editor',
        settings: {
            title: 'Empty Team Widget',
            teamMembers: []
        }
    };
}
