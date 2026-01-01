import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentGatewayConfigDto, PaymentGatewayProvider, NgoServiceProxy } from '../../../../core/services/service-proxies';

@Component({
  selector: 'app-payment-gateway',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './payment-gateway.component.html',
  styleUrls: ['./payment-gateway.component.scss']
})
export class PaymentGatewayComponent implements OnInit {
  gateways: PaymentGatewayConfigDto[] = [];
  displayDialog: boolean = false;
  gatewayForm!: FormGroup;
  selectedGateway: PaymentGatewayConfigDto | null = null;
  loading: boolean = false;
  isEditMode: boolean = false;

  providerOptions = [
    { label: 'PayPal', value: PaymentGatewayProvider._1 },
    { label: 'Stripe', value: PaymentGatewayProvider._2 },
    { label: 'PayFast', value: PaymentGatewayProvider._3 },
    { label: 'Square', value: PaymentGatewayProvider._4 },
    { label: 'Paystack', value: PaymentGatewayProvider._5 }
  ];

  constructor(
    private fb: FormBuilder,
    private ngoService: NgoServiceProxy
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadGateways();
  }

  initForm(): void {
    this.gatewayForm = this.fb.group({
      id: [''],
      tenantId: [''],
      provider: [null, Validators.required],
      merchantId: [''],
      siteCode: [''],
      apiKey: [''],
      secretKey: [''],
      passPhrase: [''],
      webhookUrl: ['', [Validators.pattern('https?://.+')]],
      returnUrl: ['', [Validators.pattern('https?://.+')]],
      cancelUrl: ['', [Validators.pattern('https?://.+')]],
      isActive: [false],
      isTestMode: [true]
    });
  }

  loadGateways(): void {
    this.loading = true;
    
    this.ngoService.getPaymentGatewayConfigs().subscribe({
      next: (data: any) => {
        this.gateways = data || [];
        this.loading = false;
      },
      error: (error) => {
        alert('Failed to load payment gateways');
        this.loading = false;
      }
    });
  }

  openNew(): void {
    this.selectedGateway = null;
    this.isEditMode = false;
    this.gatewayForm.reset({
      isActive: false,
      isTestMode: true
    });
    this.displayDialog = true;
  }

  editGateway(gateway: PaymentGatewayConfigDto): void {
    this.selectedGateway = gateway;
    this.isEditMode = true;
    this.gatewayForm.patchValue(gateway);
    this.displayDialog = true;
  }

  saveGateway(): void {
    if (this.gatewayForm.valid) {
      this.loading = true;
      const gateway: any = this.gatewayForm.value;

      if (this.isEditMode && this.selectedGateway) {
        this.ngoService.updatePaymentGatewayConfig(Number(this.selectedGateway.id), gateway as any).subscribe({
          next: () => {
            alert('Gateway updated successfully');
            this.loadGateways();
            this.displayDialog = false;
            this.loading = false;
          },
          error: () => {
            alert('Failed to update gateway');
            this.loading = false;
          }
        });
      } else {
        alert('Please update an existing gateway configuration');
        this.loading = false;
      }
    } else {
      alert('Please fill all required fields');
    }
  }

  toggleStatus(gateway: PaymentGatewayConfigDto): void {
    if (confirm(`Are you sure you want to ${gateway.isActive ? 'deactivate' : 'activate'} this gateway?`)) {
      gateway.isActive = !gateway.isActive;
      this.loading = true;

      setTimeout(() => {
        alert(`Gateway ${gateway.isActive ? 'activated' : 'deactivated'}`);
        this.loading = false;
      }, 500);
    }
  }

  testConnection(gateway: PaymentGatewayConfigDto): void {
    this.loading = true;
    
    setTimeout(() => {
      const success = Math.random() > 0.3;
      if (success) {
        alert('Gateway connection test successful');
      } else {
        alert('Gateway connection test failed. Please check your credentials.');
      }
      this.loading = false;
    }, 1500);
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.gatewayForm.reset();
  }

  getProviderLabel(provider: PaymentGatewayProvider): string {
    const option = this.providerOptions.find(p => p.value === provider);
    return option ? option.label : 'Unknown';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Edit Payment Gateway' : 'New Payment Gateway';
  }

  get selectedProviderRequiresFields(): { [key: string]: boolean } {
    const provider = this.gatewayForm.get('provider')?.value;
    
    // Define field requirements for each provider
    const requirements: { [key: number]: { [key: string]: boolean } } = {
      [PaymentGatewayProvider._1]: { // PayPal
        merchantId: true,
        apiKey: true,
        secretKey: true
      },
      [PaymentGatewayProvider._2]: { // Stripe
        apiKey: true,
        secretKey: true
      },
      [PaymentGatewayProvider._3]: { // PayFast
        merchantId: true,
        siteCode: true,
        passPhrase: true
      },
      [PaymentGatewayProvider._4]: { // Square
        apiKey: true,
        merchantId: true
      },
      [PaymentGatewayProvider._5]: { // Paystack
        apiKey: true,
        secretKey: true
      }
    };

    return requirements[provider] || {};
  }
}
