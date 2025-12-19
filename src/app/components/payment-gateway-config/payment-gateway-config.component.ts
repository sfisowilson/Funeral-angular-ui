import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Payment_configServiceProxy, PaymentGatewayConfigDto } from '../../core/services/service-proxies';

interface PaymentGatewayConfig {
  id?: string;
  provider: number;
  providerName?: string;
  merchantId?: string;
  siteCode?: string;
  isActive: boolean;
  isTestMode: boolean;
  webhookUrl?: string;
  returnUrl?: string;
  cancelUrl?: string;
  apiKey?: string;
  secretKey?: string;
  passPhrase?: string;
}

interface Provider {
  value: number;
  name: string;
  displayName: string;
}

@Component({
  selector: 'app-payment-gateway-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0"><i class="bi bi-credit-card me-2"></i>Payment Gateway Configuration</h2>
        <button (click)="showForm = true; resetForm()"
                class="btn btn-primary">
          <i class="bi bi-plus-circle me-1"></i> Add Gateway
        </button>
      </div>

      <!-- Alert Message -->
      <div *ngIf="message" [class]="messageClass" class="alert alert-dismissible fade show mb-4" role="alert">
        {{ message }}
        <button type="button" class="btn-close" (click)="message = ''" aria-label="Close"></button>
      </div>

      <!-- Gateway Configuration Form -->
      <div *ngIf="showForm" class="card shadow-sm mb-4">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">
            <i class="bi bi-{{ editingConfig ? 'pencil' : 'plus-circle' }} me-2"></i>
            {{ editingConfig ? 'Edit' : 'Add' }} Payment Gateway
          </h5>
        </div>
        <div class="card-body">
          <form [formGroup]="configForm" (ngSubmit)="saveConfig()">
            <div class="row g-3">
              <!-- Provider Selection -->
              <div class="col-md-6">
                <label for="provider" class="form-label fw-semibold">
                  <i class="bi bi-building me-1"></i>Payment Provider *
                </label>
                <select id="provider" formControlName="provider" 
                        [disabled]="!!editingConfig"
                        class="form-select">
                  <option value="">Select Provider</option>
                  <option *ngFor="let provider of providers" [value]="provider.value">
                    {{ provider.displayName }}
                  </option>
                </select>
              </div>

              <!-- Test Mode Toggle -->
              <div class="col-md-6 d-flex align-items-end">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="isTestMode" formControlName="isTestMode">
                  <label class="form-check-label" for="isTestMode">
                    <i class="bi bi-bug me-1"></i>Test Mode (Sandbox)
                  </label>
                </div>
              </div>

              <!-- Merchant ID -->
              <div class="col-md-6">
                <label for="merchantId" class="form-label fw-semibold">
                  <i class="bi bi-hash me-1"></i>Merchant ID
                </label>
                <input type="text" id="merchantId" formControlName="merchantId"
                       class="form-control"
                       placeholder="Enter merchant ID">
              </div>

              <!-- Site Code (for Ozow) -->
              <div class="col-md-6">
                <label for="siteCode" class="form-label fw-semibold">
                  <i class="bi bi-code-square me-1"></i>Site Code
                </label>
                <input type="text" id="siteCode" formControlName="siteCode"
                       class="form-control"
                       placeholder="Enter site code (Ozow only)">
                <div class="form-text">Required for Ozow integration</div>
              </div>

              <!-- API Key -->
              <div class="col-md-6">
                <label for="apiKey" class="form-label fw-semibold">
                  <i class="bi bi-key me-1"></i>API Key
                </label>
                <input type="password" id="apiKey" formControlName="apiKey"
                       class="form-control"
                       placeholder="Enter API key">
                <div class="form-text">Leave blank to keep existing</div>
              </div>

              <!-- Secret Key -->
              <div class="col-md-6">
                <label for="secretKey" class="form-label fw-semibold">
                  <i class="bi bi-shield-lock me-1"></i>Secret/Merchant Key
                </label>
                <input type="password" id="secretKey" formControlName="secretKey"
                       class="form-control"
                       placeholder="Enter secret key">
                <div class="form-text">Leave blank to keep existing</div>
              </div>

              <!-- Pass Phrase (for PayFast) -->
              <div class="col-12">
                <label for="passPhrase" class="form-label fw-semibold">
                  <i class="bi bi-lock me-1"></i>Pass Phrase (PayFast)
                </label>
                <input type="password" id="passPhrase" formControlName="passPhrase"
                       class="form-control"
                       placeholder="Enter pass phrase">
                <div class="form-text">Required for PayFast. Leave blank to keep existing.</div>
              </div>

              <!-- Webhook URL -->
              <div class="col-12">
                <label for="webhookUrl" class="form-label fw-semibold">
                  <i class="bi bi-arrow-left-right me-1"></i>Webhook URL <span class="badge bg-info">Optional</span>
                </label>
                <input type="url" id="webhookUrl" formControlName="webhookUrl"
                       class="form-control" readonly>
                <div class="form-text">
                  <i class="bi bi-info-circle me-1"></i>
                  <strong>This is YOUR backend URL</strong> where the payment gateway sends notifications.
                  Copy this URL and paste it in <strong>PayFast/Ozow's dashboard settings</strong>, not the other way around.
                </div>
              </div>

              <!-- Return URL -->
              <div class="col-md-6">
                <label for="returnUrl" class="form-label fw-semibold">
                  <i class="bi bi-check-circle me-1"></i>Return URL (Success)
                </label>
                <input type="url" id="returnUrl" formControlName="returnUrl"
                       class="form-control">
                <div class="form-text">User redirected here after successful payment</div>
              </div>

              <!-- Cancel URL -->
              <div class="col-md-6">
                <label for="cancelUrl" class="form-label fw-semibold">
                  <i class="bi bi-x-circle me-1"></i>Cancel URL (Failed)
                </label>
                <input type="url" id="cancelUrl" formControlName="cancelUrl"
                       class="form-control">
                <div class="form-text">User redirected here if payment is cancelled</div>
              </div>

              <!-- Active Toggle -->
              <div class="col-md-6 d-flex align-items-end">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="isActive" formControlName="isActive">
                  <label class="form-check-label" for="isActive">
                    <i class="bi bi-power me-1"></i>Active
                  </label>
                </div>
              </div>
            </div>

            <div class="d-flex gap-2 mt-4">
              <button type="submit" 
                      [disabled]="!configForm.valid || saving"
                      class="btn btn-primary">
                <i class="bi bi-{{ saving ? 'arrow-repeat spin' : 'save' }} me-1"></i>
                {{ saving ? 'Saving...' : (editingConfig ? 'Update' : 'Create') }}
              </button>
              <button type="button" 
                      (click)="cancelEdit()"
                      class="btn btn-secondary">
                <i class="bi bi-x-lg me-1"></i>Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Existing Configurations List -->
      <div class="card shadow-sm">
        <div class="card-header bg-light">
          <h5 class="mb-0"><i class="bi bi-list-ul me-2"></i>Configured Gateways</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th><i class="bi bi-building me-1"></i>Provider</th>
                  <th><i class="bi bi-hash me-1"></i>Merchant ID</th>
                  <th><i class="bi bi-gear me-1"></i>Mode</th>
                  <th><i class="bi bi-power me-1"></i>Status</th>
                  <th><i class="bi bi-tools me-1"></i>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let config of configs">
                  <td>
                    <strong>{{ getProviderName(config.provider) }}</strong>
                  </td>
                  <td>{{ config.merchantId || 'N/A' }}</td>
                  <td>
                    <span [class]="config.isTestMode ? 'badge bg-warning' : 'badge bg-success'">
                      <i class="bi bi-{{ config.isTestMode ? 'bug' : 'check-circle' }} me-1"></i>
                      {{ config.isTestMode ? 'Test' : 'Live' }}
                    </span>
                  </td>
                  <td>
                    <button (click)="toggleActive(config)" 
                            [class]="config.isActive ? 'badge bg-success border-0' : 'badge bg-secondary border-0'"
                            style="cursor: pointer;">
                      <i class="bi bi-{{ config.isActive ? 'check-circle-fill' : 'x-circle' }} me-1"></i>
                      {{ config.isActive ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm" role="group">
                      <button (click)="editConfig(config)" class="btn btn-outline-primary" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button (click)="deleteConfig(config)" class="btn btn-outline-danger" title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div *ngIf="configs.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox display-4 d-block mb-3"></i>
            <p>No payment gateways configured. Click "Add Gateway" to get started.</p>
          </div>
        </div>
      </div>

      <!-- Configuration Guide -->
      <div class="alert alert-info mt-4" role="alert">
        <h5 class="alert-heading">
          <i class="bi bi-info-circle-fill me-2"></i>Configuration Guide
        </h5>
        <hr>
        <div class="mb-3">
          <h6 class="fw-bold">Required Fields by Provider:</h6>
          <ul class="small mb-2">
            <li><strong>Ozow:</strong> Site Code, API Key, and Private Key</li>
            <li><strong>PayFast:</strong> Merchant ID, Merchant Key, and Pass Phrase</li>
            <li><strong>Yoco:</strong> Secret Key and Public Key</li>
          </ul>
        </div>
        <div class="mb-3">
          <h6 class="fw-bold">Understanding URLs:</h6>
          <ul class="small mb-2">
            <li><strong>Test Mode Toggle:</strong> Use sandbox credentials when enabled, production credentials when disabled</li>
            <li><strong>Webhook URL:</strong> YOUR backend endpoint that receives payment notifications from the gateway</li>
            <li><strong>Return URL:</strong> Where users are redirected after successful payment</li>
            <li><strong>Cancel URL:</strong> Where users are redirected if they cancel the payment</li>
          </ul>
        </div>
        <div>
          <h6 class="fw-bold">Setup Steps:</h6>
          <ol class="small mb-0">
            <li>Enable <strong>Test Mode</strong> and use sandbox credentials from PayFast/Ozow dashboard</li>
            <li>Copy the <strong>Webhook URL</strong> shown above</li>
            <li>Go to your PayFast/Ozow dashboard → Settings → Webhooks/Notifications</li>
            <li>Paste YOUR webhook URL into their system</li>
            <li>Test payments in sandbox mode</li>
            <li>When ready, disable Test Mode and update with production credentials</li>
          </ol>
        </div>
      </div>
    </div>
  `
})
export class PaymentGatewayConfigComponent implements OnInit {
  configs: PaymentGatewayConfig[] = [];
  providers: Provider[] = [];
  configForm: FormGroup;
  showForm = false;
  editingConfig: PaymentGatewayConfig | null = null;
  saving = false;
  message = '';
  messageClass = '';
  defaultUrls: { webhookUrl: string; returnUrl: string; cancelUrl: string } = {
    webhookUrl: '',
    returnUrl: '',
    cancelUrl: ''
  };

  constructor(
    private fb: FormBuilder,
    private paymentConfigService: Payment_configServiceProxy
  ) {
    // Get base URL for default placeholders
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
    
    this.configForm = this.fb.group({
      provider: ['', Validators.required],
      merchantId: [''],
      siteCode: [''],
      apiKey: [''],
      secretKey: [''],
      passPhrase: [''],
      webhookUrl: [baseUrl + '/api/payment-gateway/webhook'],
      returnUrl: [baseUrl + '/payment-success'],
      cancelUrl: [baseUrl + '/payment-cancelled'],
      isActive: [true],
      isTestMode: [true]
    });
    
    this.defaultUrls = {
      webhookUrl: baseUrl + '/api/payment-gateway/webhook',
      returnUrl: baseUrl + '/payment-success',
      cancelUrl: baseUrl + '/payment-cancelled'
    };
  }

  ngOnInit(): void {
    this.loadProviders();
    this.loadConfigs();
  }

  loadProviders(): void {
    this.paymentConfigService.providers().subscribe({
      next: (data: any) => this.providers = data,
      error: (_err: any) => console.error('Error loading providers', _err)
    });
  }

  loadConfigs(): void {
    this.paymentConfigService.gatewayList().subscribe({
      next: (data: any) => this.configs = data,
      error: (_err: any) => console.error('Error loading configs', _err)
    });
  }

  saveConfig(): void {
    if (!this.configForm.valid) return;

    this.saving = true;
    const formValue = this.configForm.value;
    
    // Get base URL for default URLs
    const baseUrl = window.location.origin;
    
    // Construct DTO properly
    const dto = new PaymentGatewayConfigDto();
    dto.provider = +formValue.provider; // Convert string to number
    dto.merchantId = formValue.merchantId || undefined;
    dto.siteCode = formValue.siteCode || undefined;
    dto.apiKey = formValue.apiKey || undefined;
    dto.secretKey = formValue.secretKey || undefined;
    dto.passPhrase = formValue.passPhrase || undefined;
    dto.webhookUrl = formValue.webhookUrl || `${baseUrl}/api/payment-gateway/webhook`;
    dto.returnUrl = formValue.returnUrl || `${baseUrl}/payment-success`;
    dto.cancelUrl = formValue.cancelUrl || `${baseUrl}/payment-cancelled`;
    dto.isActive = formValue.isActive ?? true;
    dto.isTestMode = formValue.isTestMode ?? true;

    const request = this.editingConfig
      ? this.paymentConfigService.gatewayUpdate(this.editingConfig.id!, dto)
      : this.paymentConfigService.gatewayCreate(dto);

    request.subscribe({
      next: () => {
        this.message = `Gateway ${this.editingConfig ? 'updated' : 'created'} successfully!`;
        this.messageClass = 'alert-success';
        this.showForm = false;
        this.loadConfigs();
        this.resetForm();
        this.saving = false;
      },
      error: (err) => {
        this.message = err.error?.message || 'Error saving configuration';
        this.messageClass = 'alert-danger';
        this.saving = false;
      }
    });
  }

  editConfig(config: PaymentGatewayConfig): void {
    this.editingConfig = config;
    this.configForm.patchValue({
      provider: config.provider,
      merchantId: config.merchantId,
      siteCode: config.siteCode,
      webhookUrl: config.webhookUrl,
      returnUrl: config.returnUrl,
      cancelUrl: config.cancelUrl,
      isActive: config.isActive,
      isTestMode: config.isTestMode
    });
    this.showForm = true;
  }

  deleteConfig(config: PaymentGatewayConfig): void {
    if (!confirm(`Are you sure you want to delete ${this.getProviderName(config.provider)} configuration?`)) {
      return;
    }

    this.paymentConfigService.gatewayDelete(config.id!).subscribe({
      next: () => {
        this.message = 'Configuration deleted successfully!';
        this.messageClass = 'alert-success';
        this.loadConfigs();
      },
      error: (_err: any) => {
        this.message = 'Error deleting configuration';
        this.messageClass = 'alert-danger';
      }
    });
  }

  toggleActive(config: PaymentGatewayConfig): void {
    this.paymentConfigService.gatewayToggle(config.id!).subscribe({
      next: (response: any) => {
        this.message = response.message;
        this.messageClass = 'alert-success';
        this.loadConfigs();
      },
      error: (_err: any) => {
        this.message = 'Error toggling configuration';
        this.messageClass = 'alert-danger';
      }
    });
  }

  cancelEdit(): void {
    this.showForm = false;
    this.editingConfig = null;
    this.resetForm();
  }

  resetForm(): void {
    this.configForm.reset({
      isActive: true,
      isTestMode: true
    });
    this.editingConfig = null;
  }

  getProviderName(provider: number): string {
    const p = this.providers.find(pr => pr.value === provider);
    return p ? p.displayName : 'Unknown';
  }
}
