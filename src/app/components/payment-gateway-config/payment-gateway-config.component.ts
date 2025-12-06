import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Payment_configServiceProxy, GatewayServiceProxy, PaymentGatewayConfigDto } from '../../core/services/service-proxies';

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
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Payment Gateway Configuration</h2>
        <button (click)="showForm = true; resetForm()"
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <span class="mr-2">+</span> Add Gateway
        </button>
      </div>

      <!-- Alert Message -->
      <div *ngIf="message" [class]="messageClass" class="mb-6 p-4 rounded-lg">
        {{ message }}
      </div>

      <!-- Gateway Configuration Form -->
      <div *ngIf="showForm" class="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">
          {{ editingConfig ? 'Edit' : 'Add' }} Payment Gateway
        </h3>
        
        <form [formGroup]="configForm" (ngSubmit)="saveConfig()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Provider Selection -->
            <div>
              <label class="block text-sm font-medium mb-2">Payment Provider *</label>
              <select formControlName="provider" 
                      [disabled]="!!editingConfig"
                      class="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100">
                <option value="">Select Provider</option>
                <option *ngFor="let provider of providers" [value]="provider.value">
                  {{ provider.displayName }}
                </option>
              </select>
            </div>

            <!-- Test Mode Toggle -->
            <div class="flex items-center">
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" formControlName="isTestMode" class="mr-2">
                <span class="text-sm font-medium">Test Mode (Sandbox)</span>
              </label>
            </div>

            <!-- Merchant ID -->
            <div>
              <label class="block text-sm font-medium mb-2">Merchant ID</label>
              <input type="text" formControlName="merchantId"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="Enter merchant ID">
            </div>

            <!-- Site Code (for Ozow) -->
            <div>
              <label class="block text-sm font-medium mb-2">Site Code</label>
              <input type="text" formControlName="siteCode"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="Enter site code (Ozow only)">
            </div>

            <!-- API Key -->
            <div>
              <label class="block text-sm font-medium mb-2">API Key</label>
              <input type="password" formControlName="apiKey"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="Enter API key">
              <p class="text-xs text-gray-500 mt-1">Leave blank to keep existing</p>
            </div>

            <!-- Secret Key -->
            <div>
              <label class="block text-sm font-medium mb-2">Secret/Merchant Key</label>
              <input type="password" formControlName="secretKey"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="Enter secret key">
              <p class="text-xs text-gray-500 mt-1">Leave blank to keep existing</p>
            </div>

            <!-- Pass Phrase (for PayFast) -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-2">Pass Phrase (PayFast)</label>
              <input type="password" formControlName="passPhrase"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="Enter pass phrase">
              <p class="text-xs text-gray-500 mt-1">Required for PayFast. Leave blank to keep existing.</p>
            </div>

            <!-- Webhook URL -->
            <div>
              <label class="block text-sm font-medium mb-2">Webhook URL</label>
              <input type="url" formControlName="webhookUrl"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="https://yourdomain.com/api/payment-gateway/webhook">
            </div>

            <!-- Return URL -->
            <div>
              <label class="block text-sm font-medium mb-2">Return URL</label>
              <input type="url" formControlName="returnUrl"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="https://yourdomain.com/payment-success">
            </div>

            <!-- Cancel URL -->
            <div>
              <label class="block text-sm font-medium mb-2">Cancel URL</label>
              <input type="url" formControlName="cancelUrl"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="https://yourdomain.com/payment-cancelled">
            </div>

            <!-- Active Toggle -->
            <div class="flex items-center">
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" formControlName="isActive" class="mr-2">
                <span class="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>

          <div class="mt-6 flex gap-4">
            <button type="submit" 
                    [disabled]="!configForm.valid || saving"
                    class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ saving ? 'Saving...' : (editingConfig ? 'Update' : 'Create') }}
            </button>
            <button type="button" 
                    (click)="cancelEdit()"
                    class="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Existing Configurations List -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let config of configs">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium">{{ getProviderName(config.provider) }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ config.merchantId || 'N/A' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="config.isTestMode ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'" 
                      class="px-2 py-1 text-xs rounded-full">
                  {{ config.isTestMode ? 'Test' : 'Live' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button (click)="toggleActive(config)" 
                        [class]="config.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                        class="px-3 py-1 text-xs rounded-full hover:opacity-80">
                  {{ config.isActive ? 'Active' : 'Inactive' }}
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button (click)="editConfig(config)" class="text-blue-600 hover:text-blue-800 mr-3">
                  Edit
                </button>
                <button (click)="deleteConfig(config)" class="text-red-600 hover:text-red-800">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div *ngIf="configs.length === 0" class="text-center py-8 text-gray-500">
          No payment gateways configured. Click "Add Gateway" to get started.
        </div>
      </div>

      <!-- Configuration Guide -->
      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-semibold text-blue-900 mb-2">Configuration Guide</h3>
        <ul class="text-sm text-blue-800 space-y-1">
          <li>• <strong>Ozow:</strong> Requires Site Code, API Key, and Private Key</li>
          <li>• <strong>PayFast:</strong> Requires Merchant ID, Merchant Key, and Pass Phrase</li>
          <li>• <strong>Yoco:</strong> Requires Secret Key and Public Key</li>
          <li>• Configure webhook URLs in your payment provider dashboard</li>
          <li>• Always test in sandbox mode before going live</li>
        </ul>
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

  constructor(
    private fb: FormBuilder,
    private paymentConfigService: Payment_configServiceProxy,
    private gatewayService: GatewayServiceProxy
  ) {
    this.configForm = this.fb.group({
      provider: ['', Validators.required],
      merchantId: [''],
      siteCode: [''],
      apiKey: [''],
      secretKey: [''],
      passPhrase: [''],
      webhookUrl: [''],
      returnUrl: [''],
      cancelUrl: [''],
      isActive: [true],
      isTestMode: [true]
    });
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
    this.paymentConfigService.gatewayGetList().subscribe({
      next: (data: any) => this.configs = data,
      error: (_err: any) => console.error('Error loading configs', _err)
    });
  }

  saveConfig(): void {
    if (!this.configForm.valid) return;

    this.saving = true;
    const formData = this.configForm.value as PaymentGatewayConfigDto;

    const request = this.editingConfig
      ? this.paymentConfigService.gatewayPut(this.editingConfig.id!, formData)
      : this.paymentConfigService.gatewayPost(formData);

    request.subscribe({
      next: () => {
        this.message = `Gateway ${this.editingConfig ? 'updated' : 'created'} successfully!`;
        this.messageClass = 'bg-green-100 text-green-800 border border-green-300';
        this.showForm = false;
        this.loadConfigs();
        this.resetForm();
        this.saving = false;
      },
      error: (err) => {
        this.message = err.error?.message || 'Error saving configuration';
        this.messageClass = 'bg-red-100 text-red-800 border border-red-300';
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
        this.messageClass = 'bg-green-100 text-green-800 border border-green-300';
        this.loadConfigs();
      },
      error: (err) => {
        this.message = 'Error deleting configuration';
        this.messageClass = 'bg-red-100 text-red-800 border border-red-300';
      }
    });
  }

  toggleActive(config: PaymentGatewayConfig): void {
    this.gatewayService.toggle(config.id!).subscribe({
      next: (response: any) => {
        this.message = response.message;
        this.messageClass = 'bg-green-100 text-green-800 border border-green-300';
        this.loadConfigs();
      },
      error: (_err: any) => {
        this.message = 'Error toggling configuration';
        this.messageClass = 'bg-red-100 text-red-800 border border-red-300';
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
