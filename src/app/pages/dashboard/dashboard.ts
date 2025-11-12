import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { DASHBOARD_WIDGETS, DashboardWidget } from './dashboard-widgets.registry';
import { AuthService } from '../../auth/auth-service';
import { DashboardWidgetServiceProxy, DashboardWidgetSettingDto } from '../../core/services/service-proxies';

// Import all widget components for standalone mode
import { StatsSummaryWidgetComponent } from './widgets/stats-summary-widget/stats-summary-widget.component';
import { RevenueChartWidgetComponent } from './widgets/revenue-chart-widget/revenue-chart-widget.component';
import { MemberGrowthWidgetComponent } from './widgets/member-growth-widget/member-growth-widget.component';
import { RecentClaimsWidgetComponent } from './widgets/recent-claims-widget/recent-claims-widget.component';
import { MyOnboardingWidgetComponent } from './widgets/my-onboarding-widget/my-onboarding-widget.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        NgComponentOutlet
    ],
    providers: [DashboardWidgetServiceProxy],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
    visibleWidgets = signal<DashboardWidget[]>([]);
    loading = signal(true);

    // Reference widget components for Angular compiler
    private readonly widgetComponents = [
        StatsSummaryWidgetComponent,
        RevenueChartWidgetComponent,
        MemberGrowthWidgetComponent,
        RecentClaimsWidgetComponent,
        MyOnboardingWidgetComponent
    ];

    constructor(
        private authService: AuthService,
        private dashboardWidgetService: DashboardWidgetServiceProxy
    ) {}

    ngOnInit() {
        this.loadVisibleWidgets();
    }

    loadVisibleWidgets() {
        if (!this.authService.isAuthenticated()) {
            this.loading.set(false);
            return;
        }

        const userRoles = this.authService.getRoles();
        
        // Fetch visible widgets from API based on user roles
        this.dashboardWidgetService.dashboardWidget_GetVisibleByRoles(userRoles).subscribe({
            next: (settings: DashboardWidgetSettingDto[]) => {
                // Map widget settings to actual components
                const widgets = settings
                    .map((setting: DashboardWidgetSettingDto) => {
                        const widget = DASHBOARD_WIDGETS.find(w => w.key === setting.widgetKey);
                        return widget;
                    })
                    .filter((w: DashboardWidget | undefined) => w !== undefined) as DashboardWidget[];

                this.visibleWidgets.set(widgets);
                this.loading.set(false);
            },
            error: (error: any) => {
                console.error('Error loading dashboard widgets:', error);
                // Fallback: show all widgets
                this.visibleWidgets.set(DASHBOARD_WIDGETS);
                this.loading.set(false);
            }
        });
    }
}

