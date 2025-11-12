// Example: How to programmatically add team members to the widget

import { WidgetConfig } from './building-blocks/widget-config';

// Example 1: Configure team widget with members
const teamWidgetConfig: WidgetConfig = {
    id: 'my-team-widget',
    type: 'team-editor',
    settings: {
        title: 'Our Development Team',
        teamMembers: [
            {
                id: '1',
                name: 'Sarah Wilson',
                email: 'sarah.wilson@company.com',
                role: 'Team Lead',
                department: 'Engineering',
                bio: 'Senior developer with 8+ years experience',
                status: 'active',
                dateAdded: new Date('2024-01-15')
            },
            {
                id: '2',
                name: 'Mike Chen',
                email: 'mike.chen@company.com',
                role: 'Developer',
                department: 'Engineering',
                bio: 'Full-stack developer specializing in Angular and .NET',
                status: 'active',
                dateAdded: new Date('2024-02-01')
            },
            {
                id: '3',
                name: 'Emma Rodriguez',
                email: 'emma.rodriguez@company.com',
                role: 'Designer',
                department: 'UX/UI',
                bio: 'Creative designer with focus on user experience',
                status: 'active',
                dateAdded: new Date('2024-02-10')
            }
        ]
    }
};

// Example 2: Add members dynamically in a component
export class MyDashboardComponent {
    teamConfig: WidgetConfig = {
        id: 'dashboard-team',
        type: 'team-editor',
        settings: {
            title: 'Team Members',
            teamMembers: []
        }
    };

    constructor() {
        this.loadTeamMembers();
    }

    // Method to add a new team member
    addTeamMember(memberData: any) {
        const newMember = {
            id: Date.now().toString(),
            name: memberData.name,
            email: memberData.email,
            role: memberData.role,
            department: memberData.department,
            bio: memberData.bio,
            status: 'active',
            dateAdded: new Date()
        };

        this.teamConfig.settings.teamMembers.push(newMember);
    }

    // Method to load team members from API
    async loadTeamMembers() {
        try {
            // Example API call to get users
            const users = await this.userService.getUsers();

            // Convert users to team members
            const teamMembers = users.map((user) => ({
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.roles?.[0] || 'Employee',
                department: user.department,
                status: 'active',
                dateAdded: new Date()
            }));

            this.teamConfig.settings.teamMembers = teamMembers;
        } catch (error) {
            console.error('Failed to load team members:', error);
        }
    }
}

// Example 3: JSON format for import
const teamDataForImport = {
    teamMembers: [
        {
            id: '1',
            name: 'Alex Thompson',
            email: 'alex@company.com',
            role: 'Manager',
            department: 'Operations',
            bio: 'Operations manager with strong leadership skills',
            status: 'active'
        },
        {
            id: '2',
            name: 'Lisa Garcia',
            email: 'lisa@company.com',
            role: 'Developer',
            department: 'Engineering',
            bio: 'Backend developer specializing in APIs',
            status: 'active'
        }
    ]
};
