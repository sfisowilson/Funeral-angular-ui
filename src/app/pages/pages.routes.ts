import { Routes } from '@angular/router';
import { AssetsComponent } from './assets/assets.component';
import { ClaimsComponent } from './claims/claims.component';
import { DependentsComponent } from './dependents/dependents.component';
import { FuneralEventsComponent } from './funeral-events/funeral-events.component';
import { PersonnelComponent } from './personnel/personnel.component';
import { SubscriptionPlansComponent } from './subscription-plans/subscription-plans.component';
import { TimesheetsComponent } from './timesheets/timesheets.component';
import { PoliciesComponent } from './policies/policies.component';
import { PolicyAttributesComponent } from './policy-attributes/policy-attributes.component';
import { TenantsComponent } from './tenants/tenants.component';
import { UsersComponent } from './users/users.component';
import { RolesComponent } from './roles/roles.component';
import { TenantSettingsComponent } from './tenant-settings/tenant-settings.component';
import { MemberManagementComponent } from './member-management/member-management.component';
import { PolicyComponent } from './policy/policy.component';
import { AssetManagementComponent } from './asset-management/asset-management.component';

import { OnboardingSettingsComponent } from './onboarding-settings/onboarding-settings.component';
import { DashboardSettingsComponent } from './dashboard-settings/dashboard-settings.component';
import { PageBuilderComponent } from '../building-blocks/page-builder/page-builder.component';
import { PdfFieldMappingComponent } from './pdf-field-mapping/pdf-field-mapping.component';
import { MemberApprovalComponent } from './member-approval/member-approval.component';
import { TenantApprovalComponent } from './tenant-approval/tenant-approval.component';
import { CouponListComponent } from './admin/coupons/coupon-list.component';

export default [
    { path: 'assets', component: AssetsComponent },
    { path: 'asset-management', component: AssetManagementComponent },
    { path: 'tenant-settings', component: TenantSettingsComponent },
    { path: 'member-management', component: MemberManagementComponent },
    { path: 'tenants', component: TenantsComponent },
    { path: 'users', component: UsersComponent },
    { path: 'subscription-plans', component: SubscriptionPlansComponent },
    { path: 'policies', component: PoliciesComponent },
    { path: 'policy/:id', component: PolicyComponent },
    { path: 'policy-attributes', component: PolicyAttributesComponent },
    { path: 'claims', component: ClaimsComponent },
    { path: 'dependents', component: DependentsComponent },
    { path: 'funeral-events', component: FuneralEventsComponent },
    { path: 'personnel', component: PersonnelComponent },
    { path: 'timesheets', component: TimesheetsComponent },
    { path: 'roles', component: RolesComponent },

    { path: 'onboarding-settings', component: OnboardingSettingsComponent },
    { path: 'dashboard-settings', component: DashboardSettingsComponent },
    { path: 'pdf-field-mapping', component: PdfFieldMappingComponent },
    { path: 'member-approval', component: MemberApprovalComponent },
    { path: 'tenant-approval', component: TenantApprovalComponent },
    { path: 'coupons', component: CouponListComponent },
    { 
        path: 'page-builder', 
        component: PageBuilderComponent,
        data: { roles: ['TenantAdmin', 'SuperAdmin'] }
    },

    // Legacy Widget Editor - replaced by Visual Page Builder
    // { path: 'landing', loadChildren: () => import('./landing/landing-page.module').then((m) => m.LandingPageModule) },
    
    { path: 'user-profile', loadComponent: () => import('./user-profile/user-profile.component').then((m) => m.UserProfileComponent) },
    { path: 'team-test', loadComponent: () => import('./team-test/team-test.component').then((m) => m.TeamTestComponent) },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
