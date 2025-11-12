import { Type } from '@angular/core';
import { StatsSummaryWidgetComponent } from './widgets/stats-summary-widget/stats-summary-widget.component';
import { RevenueChartWidgetComponent } from './widgets/revenue-chart-widget/revenue-chart-widget.component';
import { MemberGrowthWidgetComponent } from './widgets/member-growth-widget/member-growth-widget.component';
import { RecentClaimsWidgetComponent } from './widgets/recent-claims-widget/recent-claims-widget.component';
import { MyOnboardingWidgetComponent } from './widgets/my-onboarding-widget/my-onboarding-widget.component';

export interface DashboardWidget {
    key: string;
    name: string;
    component: Type<any>;
    gridClass?: string;
}

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
    {
        key: 'stats-summary',
        name: 'Stats Summary',
        component: StatsSummaryWidgetComponent,
        gridClass: 'full-width'
    },
    {
        key: 'revenue-chart',
        name: 'Revenue Chart',
        component: RevenueChartWidgetComponent,
        gridClass: 'half-width'
    },
    {
        key: 'member-growth',
        name: 'Member Growth',
        component: MemberGrowthWidgetComponent,
        gridClass: 'half-width'
    },
    {
        key: 'recent-claims',
        name: 'Recent Claims',
        component: RecentClaimsWidgetComponent,
        gridClass: 'full-width'
    },
    {
        key: 'my-onboarding',
        name: 'My Onboarding',
        component: MyOnboardingWidgetComponent,
        gridClass: 'half-width'
    }
];
