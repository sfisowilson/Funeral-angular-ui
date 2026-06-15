import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { NotAuthenticatedGuard } from './app/auth/not-authenticated-guard';
import { tenantMatcher } from './app/core/tenant.matcher';
import { PermissionGuard } from './app/core/guards/permission-guard';
import { ProfileCompletionGuard } from './app/core/guards/profile-completion.guard';
import { pageAuthGuard } from './app/core/guards/page-auth.guard';
import { shopFeatureGuard } from './app/guards/shop-feature.guard';

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
            { path: 'dashboard', canActivate: [PermissionGuard], data: { breadcrumb: 'Dashboard', permissions: ['Permission.reporting.dashboard.view'] }, loadComponent: () => import('./app/pages/dashboard/dashboard').then((m) => m.Dashboard) },
            {
                path: 'member-onboarding',
                data: { breadcrumb: 'My Onboarding' },
                loadComponent: () =>
                    import('./app/pages/member-onboarding-readonly-view/member-onboarding-readonly-view.component').then(
                        (m) => m.MemberOnboardingReadonlyViewComponent
                    )
            },
            { path: 'pages', data: { breadcrumb: 'Pages' }, loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'custom-pages', canActivate: [PermissionGuard], data: { breadcrumb: 'Page Management', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/features/admin/page-management/page-management.component').then((m) => m.PageManagementComponent) },
            { path: 'custom-pages/edit/:id', canActivate: [PermissionGuard], data: { breadcrumb: 'Edit Page', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/features/admin/page-editor/page-editor.component').then((m) => m.PageEditorComponent) },
            { path: 'custom-pages/edit-v3/:pageId', canActivate: [PermissionGuard], data: { breadcrumb: 'Visual Page Builder', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/features/builder/builder.component').then((m) => m.BuilderComponent) },
            { path: 'nav-config', canActivate: [PermissionGuard], data: { breadcrumb: 'Navigation Menu Builder', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/features/admin/nav-config/nav-config-editor.component').then((m) => m.NavConfigEditorComponent) },
            { path: 'contract-signing/:memberId', data: { breadcrumb: 'Sign Contract', skipProfileCheck: true }, loadComponent: () => import('./app/pages/contract-signing/contract-signing.component').then((m) => m.ContractSigningComponent) },
            { path: 'payment-config', canActivate: [PermissionGuard], data: { breadcrumb: 'Payment Gateway Configuration', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/components/payment-gateway-config/payment-gateway-config.component').then((m) => m.PaymentGatewayConfigComponent) },
            { path: 'payment-settings', canActivate: [PermissionGuard], data: { breadcrumb: 'Payment Settings', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/components/tenant-payment-settings/tenant-payment-settings.component').then((m) => m.TenantPaymentSettingsComponent) },
            { path: 'debit-orders', canActivate: [PermissionGuard], data: { breadcrumb: 'Debit Order Management', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/components/debit-order-management/debit-order-management.component').then((m) => m.DebitOrderManagementComponent) },
            { path: 'invoices', canActivate: [PermissionGuard], data: { breadcrumb: 'Invoices', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/components/tenant-invoices/tenant-invoices.component').then((m) => m.TenantInvoicesComponent) },
            {
                path: 'grant-applications',
                canActivate: [PermissionGuard],
                data: { breadcrumb: 'Grant Applications', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] },
                loadComponent: () => import('./app/building-blocks/ngo-grant-applications-widget/ngo-grant-applications-admin.component').then((m) => m.NgoGrantApplicationsAdminComponent)
            },
            { path: 'forms', canActivate: [PermissionGuard], data: { breadcrumb: 'Form Management', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/pages/admin/forms/form-management.component').then((m) => m.FormManagementComponent) },
            {
                path: 'dynamic-entities',
                canActivate: [PermissionGuard],
                data: { breadcrumb: 'Dynamic Entities', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] },
                children: [
                    { path: '', redirectTo: 'types', pathMatch: 'full' },
                    { path: 'types', loadComponent: () => import('./app/pages/admin/dynamic-entities/dynamic-entity-type-management.component').then((m) => m.DynamicEntityTypeManagementComponent) },
                    { path: 'records/:typeKey', loadComponent: () => import('./app/pages/admin/dynamic-entities/dynamic-entity-record-management.component').then((m) => m.DynamicEntityRecordManagementComponent) },
                    { path: 'records', loadComponent: () => import('./app/pages/admin/dynamic-entities/dynamic-entity-record-management.component').then((m) => m.DynamicEntityRecordManagementComponent) },
                    { path: 'relations', loadComponent: () => import('./app/pages/admin/dynamic-entities/dynamic-entity-relation-management.component').then((m) => m.DynamicEntityRelationManagementComponent) }
                ]
            }
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
            { path: 'dashboard', canActivate: [PermissionGuard], data: { breadcrumb: 'Dashboard', permissions: ['Permission.reporting.dashboard.view'] }, loadComponent: () => import('./app/pages/dashboard/dashboard').then((m) => m.Dashboard) },
            {
                path: 'member-onboarding',
                data: { breadcrumb: 'My Onboarding' },
                loadComponent: () =>
                    import('./app/pages/member-onboarding-readonly-view/member-onboarding-readonly-view.component').then(
                        (m) => m.MemberOnboardingReadonlyViewComponent
                    )
            },
            { path: 'pages', data: { breadcrumb: 'Pages' }, loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'custom-pages', canActivate: [PermissionGuard], data: { breadcrumb: 'Page Management', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/features/admin/page-management/page-management.component').then((m) => m.PageManagementComponent) },
            { path: 'custom-pages/edit/:id', canActivate: [PermissionGuard], data: { breadcrumb: 'Edit Page', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/features/admin/page-editor/page-editor.component').then((m) => m.PageEditorComponent) },
            { path: 'custom-pages/edit-v3/:pageId', canActivate: [PermissionGuard], data: { breadcrumb: 'Visual Page Builder', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/features/builder/builder.component').then((m) => m.BuilderComponent) },
            { path: 'nav-config', canActivate: [PermissionGuard], data: { breadcrumb: 'Navigation Menu Builder', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/features/admin/nav-config/nav-config-editor.component').then((m) => m.NavConfigEditorComponent) },
            { path: 'contract-signing/:memberId', data: { breadcrumb: 'Sign Contract', skipProfileCheck: true }, loadComponent: () => import('./app/pages/contract-signing/contract-signing.component').then((m) => m.ContractSigningComponent) },
            { path: 'payment-settings', canActivate: [PermissionGuard], data: { breadcrumb: 'Payment Settings', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/components/tenant-payment-settings/tenant-payment-settings.component').then((m) => m.TenantPaymentSettingsComponent) },
            { path: 'invoices', canActivate: [PermissionGuard], data: { breadcrumb: 'My Invoices', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/components/tenant-invoices/tenant-invoices.component').then((m) => m.TenantInvoicesComponent) },
            {
                path: 'grant-applications',
                canActivate: [PermissionGuard],
                data: { breadcrumb: 'Grant Applications', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] },
                loadComponent: () => import('./app/building-blocks/ngo-grant-applications-widget/ngo-grant-applications-admin.component').then((m) => m.NgoGrantApplicationsAdminComponent)
            },
            { path: 'forms', canActivate: [PermissionGuard], data: { breadcrumb: 'Form Management', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] }, loadComponent: () => import('./app/pages/admin/forms/form-management.component').then((m) => m.FormManagementComponent) },
            {
                path: 'dynamic-entities',
                canActivate: [PermissionGuard],
                data: { breadcrumb: 'Dynamic Entities', roles: ['TenantAdmin', 'SuperAdmin', 'Admin'] },
                children: [
                    { path: '', redirectTo: 'types', pathMatch: 'full' },
                    { path: 'types', loadComponent: () => import('./app/pages/admin/dynamic-entities/dynamic-entity-type-management.component').then((m) => m.DynamicEntityTypeManagementComponent) },
                    { path: 'records/:typeKey', loadComponent: () => import('./app/pages/admin/dynamic-entities/dynamic-entity-record-management.component').then((m) => m.DynamicEntityRecordManagementComponent) },
                    { path: 'records', loadComponent: () => import('./app/pages/admin/dynamic-entities/dynamic-entity-record-management.component').then((m) => m.DynamicEntityRecordManagementComponent) },
                    { path: 'relations', loadComponent: () => import('./app/pages/admin/dynamic-entities/dynamic-entity-relation-management.component').then((m) => m.DynamicEntityRelationManagementComponent) }
                ]
            }
        ]
    },

    // Shop / e-commerce public routes (before dynamic /:slug catch-all)
    {
        path: 'product/:productId',
        loadComponent: () => import('./app/features/shop/product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
        canActivate: [shopFeatureGuard],
        data: { skipProfileCheck: true }
    },
    {
        path: 'cart',
        loadComponent: () => import('./app/features/shop/cart-page/cart-page.component').then((m) => m.CartPageComponent),
        canActivate: [shopFeatureGuard],
        data: { skipProfileCheck: true }
    },
    {
        path: 'checkout',
        loadComponent: () => import('./app/features/shop/checkout-page/checkout-page.component').then((m) => m.CheckoutPageComponent),
        canActivate: [shopFeatureGuard],
        data: { skipProfileCheck: true }
    },
    {
        path: 'customer/orders',
        loadComponent: () => import('./app/features/shop/order-history-page/order-history-page.component').then((m) => m.OrderHistoryPageComponent),
        canActivate: [shopFeatureGuard],
        data: { skipProfileCheck: true }
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
