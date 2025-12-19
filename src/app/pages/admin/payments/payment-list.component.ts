import { Component, OnInit, signal , NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PaymentServiceProxy,
  Payment
} from '../../../core/services/service-proxies';

interface StatusOption {
  label: string;
  value: string;
}

interface GatewayOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [PaymentServiceProxy],
  schemas: [NO_ERRORS_SCHEMA], templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss'
})
export class PaymentListComponent implements OnInit {
  payments = signal<any[]>([]);
  stats = signal<any | null>(null);
  loading = signal<boolean>(false);
  
  showRefundDialog = false;
  selectedPayment: any | null = null;
  refundAmount: number = 0;
  refundReason: string = '';
  refunding = false;

  statusFilter = '';
  gatewayFilter = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  statusOptions: StatusOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Success', value: 'Success' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Failed', value: 'Failed' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Refunded', value: 'Refunded' }
  ];

  gatewayOptions: GatewayOption[] = [
    { label: 'All Gateways', value: '' },
    { label: 'PayFast', value: 'PayFast' },
    { label: 'Stripe', value: 'Stripe' },
    { label: 'PayPal', value: 'PayPal' }
  ];

  constructor(
    private paymentService: PaymentServiceProxy,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadPayments();
    this.loadStats();
  }

  async loadPayments() {
    try {
      this.loading.set(true);
      const payments = await this.paymentService.payment_GetAll(
        undefined,
        undefined,
        this.statusFilter || undefined,
        this.gatewayFilter || undefined
      ).toPromise();
      this.payments.set(payments || []);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load payments'
      });
    } finally {
      this.loading.set(false);
    }
  }

  async loadStats() {
    try {
      const stats = await this.paymentService.payment_GetStats().toPromise();
      this.stats.set(stats);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  }

  applyFilters() {
    this.loadPayments();
  }

  clearFilters() {
    this.statusFilter = '';
    this.gatewayFilter = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.loadPayments();
  }

  openRefundDialog(payment: any) {
    this.selectedPayment = payment;
    this.refundAmount = payment.amount;
    this.refundReason = '';
    this.showRefundDialog = true;
  }

  async processRefund() {
    if (!this.selectedPayment) return;

    if (!this.refundReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please provide a reason for the refund'
      });
      return;
    }

    if (this.refundAmount <= 0 || this.refundAmount > this.selectedPayment.amount) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Invalid refund amount'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to refund ${this.formatCurrency(this.refundAmount)} for this payment?`,
      header: 'Confirm Refund',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          this.refunding = true;
          
          await this.paymentService.payment_Refund(this.selectedPayment!.id, {
            amount: this.refundAmount,
            reason: this.refundReason
          } as any).toPromise();
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Payment refunded successfully'
          });
          
          this.showRefundDialog = false;
          await this.loadPayments();
          await this.loadStats();
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to process refund'
          });
        } finally {
          this.refunding = false;
        }
      }
    });
  }

  getStatusSeverity(status: any): 'success' | 'info' | 'warning' | 'danger' {
    const statusStr = status?.toString() || '';
    const statusMap: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      'Pending': 'warning',
      'Success': 'success',
      'Completed': 'success',
      'Failed': 'danger',
      'Cancelled': 'danger',
      'Refunded': 'info'
    };
    return statusMap[statusStr] || 'info';
  }

  canRefund(payment: any): boolean {
    return payment.status === 'Success' || payment.status === 'Completed';
  }

  formatCurrency(amount: number): string {
    return `R ${amount.toFixed(2)}`;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
