import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GrantApplicationsComponent } from './grant-applications/grant-applications.component';
import { ImpactReportsComponent } from './impact-reports/impact-reports.component';
import { DonorRecognitionComponent } from './donor-recognition/donor-recognition.component';
import { NgoEventsComponent } from './ngo-events/ngo-events.component';
import { BlogComponent } from './blog/blog.component';
import { PaymentGatewayComponent } from './payment-gateway/payment-gateway.component';

const routes: Routes = [
  {
    path: 'grant-applications',
    component: GrantApplicationsComponent,
    title: 'Grant Applications'
  },
  {
    path: 'impact-reports',
    component: ImpactReportsComponent,
    title: 'Impact Reports'
  },
  {
    path: 'donor-recognition',
    component: DonorRecognitionComponent,
    title: 'Donor Recognition'
  },
  {
    path: 'events',
    component: NgoEventsComponent,
    title: 'NGO Events'
  },
  {
    path: 'blog',
    component: BlogComponent,
    title: 'Blog Management'
  },
  {
    path: 'payment-gateway',
    component: PaymentGatewayComponent,
    title: 'Payment Gateway Configuration'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NgoRoutingModule { }
