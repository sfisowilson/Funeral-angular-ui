import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantInvoiceService, TenantInvoice, InvoiceSummary } from '../../services/tenant-invoice.service';
import { PaymentGatewayService } from '../../services/payment-gateway.service';
import { PaymentGatewayProvider, InitiatePaymentRequest } from '../../core/services/service-proxies';

@Component({
  selector: 'app-tenant-invoices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-2xl font-bold mb-6">My Invoices</h2>
      
      <!-- Summary Cards -->
      <div *ngIf="summary" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white shadow rounded-lg p-4">
          <p class="text-gray-600 text-sm">Total Outstanding</p>
          <p class="text-2xl font-bold text-red-600">R {{ summary.totalOutstanding | number:'1.2-2' }}</p>
        </div>
        <div class="bg-white shadow rounded-lg p-4">
          <p class="text-gray-600 text-sm">Unpaid Invoices</p>
          <p class="text-2xl font-bold">{{ summary.unpaidCount }}</p>
        </div>
        <div class="bg-white shadow rounded-lg p-4">
          <p class="text-gray-600 text-sm">Overdue</p>
          <p class="text-2xl font-bold text-orange-600">{{ summary.overdueCount }}</p>
        </div>
        <div class="bg-white shadow rounded-lg p-4">
          <p class="text-gray-600 text-sm">Total Paid</p>
          <p class="text-2xl font-bold text-green-600">R {{ summary.totalPaid | number:'1.2-2' }}</p>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let invoice of invoices">
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ invoice.invoiceNumber }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ toDate(invoice.issueDate) | date:'short' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ toDate(invoice.dueDate) | date:'short' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">R {{ invoice.amountDue | number:'1.2-2' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="getStatusClass(invoice.status)" class="px-2 py-1 text-xs rounded-full">
                  {{ invoice.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button *ngIf="!invoice.isPaid" 
                        (click)="payInvoice(invoice)"
                        class="text-blue-600 hover:text-blue-800 mr-2">
                  Pay Now
                </button>
                <button (click)="viewInvoice(invoice.id)" class="text-gray-600 hover:text-gray-800">
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div *ngIf="invoices.length === 0" class="text-center py-8 text-gray-500">
          No invoices found
        </div>
      </div>
    </div>
  `
})
export class TenantInvoicesComponent implements OnInit {
  invoices: TenantInvoice[] = [];
  summary?: InvoiceSummary;

  constructor(
    private invoiceService: TenantInvoiceService,
    private paymentService: PaymentGatewayService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadSummary();
  }

  loadInvoices(): void {
    this.invoiceService.getMyInvoices().subscribe({
      next: (data) => this.invoices = data,
      error: (err) => console.error('Error loading invoices', err)
    });
  }

  loadSummary(): void {
    this.invoiceService.getInvoiceSummary().subscribe({
      next: (data) => this.summary = data,
      error: (err) => console.error('Error loading summary', err)
    });
  }

  payInvoice(invoice: TenantInvoice): void {
    const returnUrl = window.location.origin + '/invoices';
    
    const request = InitiatePaymentRequest.fromJS({
      invoiceId: invoice.id,
      amount: invoice.amountDue,
      provider: PaymentGatewayProvider._1, // Ozow
      returnUrl
    });

    this.paymentService.initiatePayment(request).subscribe({
      next: (result) => {
        if (result.success && result.paymentUrl) {
          this.paymentService.redirectToPayment(result.paymentUrl);
        }
      },
      error: (err) => console.error('Error initiating payment', err)
    });
  }

  viewInvoice(invoiceId: string): void {
    // Navigate to invoice detail
    console.log('View invoice:', invoiceId);
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    const classes: any = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Paid': 'bg-green-100 text-green-800',
      'Overdue': 'bg-red-100 text-red-800',
      'PartiallyPaid': 'bg-blue-100 text-blue-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  toDate(dateTime: any): Date | null {
    if (!dateTime) return null;
    if (dateTime.toJSDate) {
      return dateTime.toJSDate();
    }
    return dateTime;
  }
}
