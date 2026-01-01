import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgoRoutingModule } from './ngo-routing.module';

// Import all NGO components
import { GrantApplicationsComponent } from './grant-applications/grant-applications.component';
import { ImpactReportsComponent } from './impact-reports/impact-reports.component';
import { DonorRecognitionComponent } from './donor-recognition/donor-recognition.component';
import { NgoEventsComponent } from './ngo-events/ngo-events.component';
import { BlogComponent } from './blog/blog.component';
import { PaymentGatewayComponent } from './payment-gateway/payment-gateway.component';

@NgModule({
  imports: [
    CommonModule,
    NgoRoutingModule,
    // Import all standalone components
    GrantApplicationsComponent,
    ImpactReportsComponent,
    DonorRecognitionComponent,
    NgoEventsComponent,
    BlogComponent,
    PaymentGatewayComponent
  ]
})
export class NgoModule { }
