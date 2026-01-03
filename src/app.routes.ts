import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { NotAuthenticatedGuard } from './app/auth/not-authenticated-guard';
import { tenantMatcher } from './app/core/tenant.matcher';
import { PermissionGuard } from './app/core/guards/permission-guard';
import { ProfileCompletionGuard } from './app/core/guards/profile-completion.guard';
import { pageAuthGuard } from './app/core/guards/page-auth.guard';

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

    // Contract signing route (standalone)
    {
        path: 'contract-signing/:memberId',
        loadComponent: () => import('./app/pages/contract-signing/contract-signing.component').then((m) => m.ContractSigningComponent),
        data: { skipProfileCheck: true }
    },

    // Payment result pages (standalone, publicly accessible)
    {
        path: 'payment-success',
        loadComponent: () => import('./app/pages/payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent),
        data: { skipProfileCheck: true }
    },
    {
        path: 'payment-cancelled',
        loadComponent: () => import('./app/pages/payment-cancelled/payment-cancelled.component').then((m) => m.PaymentCancelledComponent),
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
            { 
                path: 'custom-pages', 
                data: { breadcrumb: 'Page Management' }, 
                loadComponent: () => import('./app/features/admin/page-management/page-management.component').then((m) => m.PageManagementComponent) 
            },
            { 
                path: 'custom-pages/edit/:id', 
                data: { breadcrumb: 'Edit Page' }, 
                loadComponent: () => import('./app/features/admin/page-editor/page-editor.component').then((m) => m.PageEditorComponent) 
            },
            { path: 'member-onboarding', data: { breadcrumb: 'Member Onboarding', skipProfileCheck: true }, loadComponent: () => import('./app/pages/member-onboarding/member-onboarding.component').then((m) => m.MemberOnboardingComponent) },
            { path: 'contract-signing/:memberId', data: { breadcrumb: 'Sign Contract', skipProfileCheck: true }, loadComponent: () => import('./app/pages/contract-signing/contract-signing.component').then((m) => m.ContractSigningComponent) },
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
            { 
                path: 'custom-pages', 
                data: { breadcrumb: 'Page Management' }, 
                loadComponent: () => import('./app/features/admin/page-management/page-management.component').then((m) => m.PageManagementComponent) 
            },
            { 
                path: 'custom-pages/edit/:id', 
                data: { breadcrumb: 'Edit Page' }, 
                loadComponent: () => import('./app/features/admin/page-editor/page-editor.component').then((m) => m.PageEditorComponent) 
            },
            { path: 'member-onboarding', data: { breadcrumb: 'My Onboarding', skipProfileCheck: true }, loadComponent: () => import('./app/pages/member-onboarding/member-onboarding.component').then((m) => m.MemberOnboardingComponent) },
            { path: 'contract-signing/:memberId', data: { breadcrumb: 'Sign Contract', skipProfileCheck: true }, loadComponent: () => import('./app/pages/contract-signing/contract-signing.component').then((m) => m.ContractSigningComponent) },
            { path: 'payment-settings', data: { breadcrumb: 'Payment Settings' }, loadComponent: () => import('./app/components/tenant-payment-settings/tenant-payment-settings.component').then((m) => m.TenantPaymentSettingsComponent) },
            { path: 'invoices', data: { breadcrumb: 'My Invoices' }, loadComponent: () => import('./app/components/tenant-invoices/tenant-invoices.component').then((m) => m.TenantInvoicesComponent) }
        ]
    },

    // Dynamic custom pages (must be near the end, before catch-all)
    {
        path: ':slug',
        loadComponent: () => import('./app/features/dynamic-page/dynamic-page.component').then((m) => m.DynamicPageComponent),
        canActivate: [pageAuthGuard],
        data: { skipProfileCheck: true }
    },

    // General routes
    { path: 'notfound', loadComponent: () => import('./app/pages/notfound/notfound').then((m) => m.Notfound) },
    { path: '**', redirectTo: '/notfound' }
];

