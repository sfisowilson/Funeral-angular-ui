import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GrantApplicationsComponent } from './grant-applications/grant-applications.component';
import { ImpactReportsComponent } from './impact-reports/impact-reports.component';
import { DonorRecognitionComponent } from './donor-recognition/donor-recognition.component';
import { NgoEventsComponent } from './ngo-events/ngo-events.component';
import { BlogComponent } from './blog/blog.component';
import { PaymentGatewayComponent } from './payment-gateway/payment-gateway.component';
import { PermissionGuard } from '../../../core/guards/permission-guard';

const ADMIN_ROLES = ['TenantAdmin', 'SuperAdmin'];

const routes: Routes = [
    {
        path: 'grant-applications',
        component: GrantApplicationsComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES },
        title: 'Grant Applications'
    },
    {
        path: 'impact-reports',
        component: ImpactReportsComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES },
        title: 'Impact Reports'
    },
    {
        path: 'donor-recognition',
        component: DonorRecognitionComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES },
        title: 'Donor Recognition'
    },
    {
        path: 'events',
        component: NgoEventsComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES },
        title: 'NGO Events'
    },
    {
        path: 'blog',
        component: BlogComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES },
        title: 'Blog Management'
    },
    {
        path: 'payment-gateway',
        component: PaymentGatewayComponent,
        canActivate: [PermissionGuard],
        data: { roles: ADMIN_ROLES },
        title: 'Payment Gateway Configuration'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class NgoRoutingModule {}
