import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { NotAuthenticatedGuard } from './app/auth/not-authenticated-guard';
import { tenantMatcher } from './app/core/tenant.matcher';
import { PermissionGuard } from './app/core/guards/permission-guard';
import { ProfileCompletionGuard } from './app/core/guards/profile-completion.guard';

export const appRoutes: Routes = [
    // Landing page routes
    {
        path: '',
        children: [
            { path: '', loadChildren: () => import('./app/pages/landing-renderer/landing-page-renderer.module').then((m) => m.LandingPageRendererModule) },
            {
                path: 'auth',
                loadChildren: () => import('./app/pages/auth/auth.routes').then((m) => m.authRoutes),
                canActivate: [NotAuthenticatedGuard]
            }
        ]
    },

    // Member onboarding route (standalone, accessible without profile completion for new members)
    {
        path: 'member-onboarding',
        loadComponent: () => import('./app/pages/member-onboarding/member-onboarding.component').then((m) => m.MemberOnboardingComponent),
        data: { skipProfileCheck: true }
    },

    // Host-specific routes
    {
        path: 'admin',
        canMatch: [tenantMatcher(['host'])],
        component: AppLayout,
        canActivate: [PermissionGuard],
        data: { tenantType: 'host' },
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', data: { breadcrumb: 'Dashboard' }, loadComponent: () => import('./app/pages/dashboard/dashboard').then((m) => m.Dashboard) },
            { path: 'pages', data: { breadcrumb: 'Pages' }, loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'member-onboarding', data: { breadcrumb: 'Member Onboarding', skipProfileCheck: true }, loadComponent: () => import('./app/pages/member-onboarding/member-onboarding.component').then((m) => m.MemberOnboardingComponent) },
            { path: 'payment-config', data: { breadcrumb: 'Payment Gateway Configuration' }, loadComponent: () => import('./app/components/payment-gateway-config/payment-gateway-config.component').then((m) => m.PaymentGatewayConfigComponent) },
            { path: 'payment-settings', data: { breadcrumb: 'Payment Settings' }, loadComponent: () => import('./app/components/tenant-payment-settings/tenant-payment-settings.component').then((m) => m.TenantPaymentSettingsComponent) },
            { path: 'debit-orders', data: { breadcrumb: 'Debit Order Management' }, loadComponent: () => import('./app/components/debit-order-management/debit-order-management.component').then((m) => m.DebitOrderManagementComponent) },
            { path: 'invoices', data: { breadcrumb: 'Invoices' }, loadComponent: () => import('./app/components/tenant-invoices/tenant-invoices.component').then((m) => m.TenantInvoicesComponent) }
        ]
    },

    // Tenant-specific routes
    {
        path: 'admin',
        canMatch: [tenantMatcher(['tenant'])],
        component: AppLayout,
        canActivate: [PermissionGuard, ProfileCompletionGuard],
        data: { tenantType: 'tenant' },
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', data: { breadcrumb: 'Dashboard' }, loadComponent: () => import('./app/pages/dashboard/dashboard').then((m) => m.Dashboard) },
            { path: 'pages', data: { breadcrumb: 'Pages' }, loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'member-onboarding', data: { breadcrumb: 'My Onboarding', skipProfileCheck: true }, loadComponent: () => import('./app/pages/member-onboarding/member-onboarding.component').then((m) => m.MemberOnboardingComponent) },
            { path: 'payment-settings', data: { breadcrumb: 'Payment Settings' }, loadComponent: () => import('./app/components/tenant-payment-settings/tenant-payment-settings.component').then((m) => m.TenantPaymentSettingsComponent) },
            { path: 'invoices', data: { breadcrumb: 'My Invoices' }, loadComponent: () => import('./app/components/tenant-invoices/tenant-invoices.component').then((m) => m.TenantInvoicesComponent) }
        ]
    },

    // General routes
    { path: 'notfound', loadComponent: () => import('./app/pages/notfound/notfound').then((m) => m.Notfound) },
    { path: '**', redirectTo: '/notfound' }
];
('');
