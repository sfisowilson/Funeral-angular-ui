import { Routes } from '@angular/router';
import { DependentsComponent } from './dependents/dependents.component';
import { PersonnelComponent } from './personnel/personnel.component';
import { SubscriptionPlansComponent } from './subscription-plans/subscription-plans.component';
import { TimesheetsComponent } from './timesheets/timesheets.component';
import { TenantsComponent } from './tenants/tenants.component';
import { UsersComponent } from './users/users.component';
import { RolesComponent } from './roles/roles.component';
import { TenantSettingsComponent } from './tenant-settings/tenant-settings.component';
import { MemberManagementComponent } from './member-management/member-management.component';
import { TenantTypePermissionsComponent } from './admin/tenant-type-permissions/tenant-type-permissions.component';
import { LandingPageGeneratorComponent } from './admin/landing-page-generator/landing-page-generator.component';
import { BookingManagementComponent } from './admin/booking-management/booking-management.component';

import { DashboardSettingsComponent } from './dashboard-settings/dashboard-settings.component';
import { PageBuilderComponent } from '../building-blocks/page-builder/page-builder.component';
import { PdfFieldMappingComponent } from './pdf-field-mapping/pdf-field-mapping.component';
import { MemberApprovalComponent } from './member-approval/member-approval.component';
import { TenantApprovalComponent } from './tenant-approval/tenant-approval.component';
import { CouponListComponent } from './admin/coupons/coupon-list.component';
import { CareersComponent } from './admin/careers/careers.component';
import { ProductManagementComponent } from './admin/product-management/product-management.component';
import { OrderManagementComponent } from './admin/order-management/order-management.component';
import { CustomerManagementComponent } from './admin/customer-management/customer-management.component';
import { EcommerceSettingsComponent } from './admin/ecommerce-settings/ecommerce-settings.component';
import { PlanConfigurationComponent } from '../features/admin/plan-configuration/plan-configuration.component';
import { RegistrationFieldsComponent } from './admin/registration-fields/registration-fields.component';
import { OnboardingStepListConfigComponent } from './admin/onboarding-step-config/onboarding-step-list-config.component';
import { FieldDefinitionBuilderComponent } from '../admin/onboarding-fields/field-definition-builder/field-definition-builder.component';
import { EmailTemplatesComponent } from './email-templates/email-templates.component';
import { EmailSettingsComponent } from './email-settings/email-settings.component';
import { WhatsAppSettingsComponent } from './whatsapp-settings/whatsapp-settings.component';
import { PermissionGuard } from '../core/guards/permission-guard';

const ADMIN_ROLES = ['TenantAdmin', 'SuperAdmin', 'Admin'];

export default [
    { path: 'tenant-settings', component: TenantSettingsComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'member-management', component: MemberManagementComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'tenants', component: TenantsComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'users', component: UsersComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'subscription-plans', component: SubscriptionPlansComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'plan-configuration', component: PlanConfigurationComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'dependents', component: DependentsComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'personnel', component: PersonnelComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'timesheets', component: TimesheetsComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'roles', component: RolesComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'tenant-type-permissions', component: TenantTypePermissionsComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'landing-page-generator', component: LandingPageGeneratorComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'booking-management', component: BookingManagementComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'dashboard-settings', component: DashboardSettingsComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'pdf-field-mapping', component: PdfFieldMappingComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    {
        path: 'registration-fields',
        component: RegistrationFieldsComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES }
    },
    {
        path: 'onboarding-step-config',
        component: OnboardingStepListConfigComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES }
    },
    {
        path: 'field-definitions',
        component: FieldDefinitionBuilderComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES }
    },
    {
        path: 'email-templates',
        component: EmailTemplatesComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES }
    },
    {
        path: 'email-settings',
        component: EmailSettingsComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES }
    },
    {
        path: 'whatsapp-settings',
        component: WhatsAppSettingsComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES }
    },
    { path: 'member-approval', component: MemberApprovalComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'tenant-approval', component: TenantApprovalComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    { path: 'coupons', component: CouponListComponent, canActivate: [PermissionGuard], data: { roles: ADMIN_ROLES } },
    {
        path: 'careers',
        component: CareersComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES, requiredTenantType: 'Premium' }
    },
    // Ecommerce Management (Premium)
    {
        path: 'products',
        component: ProductManagementComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES, requiredTenantType: 'Premium' }
    },
    {
        path: 'orders',
        component: OrderManagementComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES, requiredTenantType: 'Premium' }
    },
    {
        path: 'customers',
        component: CustomerManagementComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES, requiredTenantType: 'Premium' }
    },
    {
        path: 'ecommerce-settings',
        component: EcommerceSettingsComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES, requiredTenantType: 'Premium' }
    },
    {
        path: 'page-builder',
        component: PageBuilderComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES }
    },

    // NGO Premium Features
    {
        path: 'ngo',
        loadChildren: () => import('./admin/ngo/ngo.module').then((m) => m.NgoModule),
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES, requiredTenantType: 'Premium' }
    },

    // Legacy Widget Editor - replaced by Visual Page Builder
    // { path: 'landing', loadChildren: () => import('./landing/landing-page.module').then((m) => m.LandingPageModule) },

    { path: 'user-profile', loadComponent: () => import('./user-profile/user-profile.component').then((m) => m.UserProfileComponent) },
    { path: 'team-test', loadComponent: () => import('./team-test/team-test.component').then((m) => m.TeamTestComponent) },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
