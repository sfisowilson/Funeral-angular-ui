import { Component, OnInit, signal , NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  TenantSubscriptionServiceProxy,
  PaymentServiceProxy,
  InvoiceServiceProxy,
  TenantSubscription,
  Payment,
  Invoice
} from '../../../core/services/service-proxies';

@Component({
  selector: 'app-my-subscription',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [
    TenantSubscriptionServiceProxy,
    PaymentServiceProxy,
    InvoiceServiceProxy
  ],
  schemas: [NO_ERRORS_SCHEMA], templateUrl: './my-subscription.component.html',
  styleUrl: './my-subscription.component.scss'
})
export class MySubscriptionComponent implements OnInit {
  loading = signal<boolean>(true);
  subscription = signal<any | null>(null);
  payments = signal<any[]>([]);
  invoices = signal<any[]>([]);
  
  showCouponDialog = false;
  couponCode = '';
  applyingCoupon = false;
  
  showCancelDialog = false;
  cancelReason = '';
  cancelling = false;

  // Alert system
  alerts: Alert[] = [];
  Math = Math;

  // Confirmation dialog
  showConfirmCancelDialog = false;
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private subscriptionService: TenantSubscriptionServiceProxy,
    private paymentService: PaymentServiceProxy,
    private invoiceService: InvoiceServiceProxy,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSubscriptionData();
  }

  async loadSubscriptionData() {
    try {
      this.loading.set(true);
      await Promise.all([
        this.loadSubscription(),
        this.loadPayments(),
        this.loadInvoices()
      ]);
    } catch (error) {
      this.showAlert('Failed to load subscription data', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async loadSubscription() {
    try {
      const sub = await this.subscriptionService.tenantSubscription_GetActive().toPromise();
      this.subscription.set(sub);
    } catch (error) {
      // No active subscription - could be normal for new tenants
      this.subscription.set(null);
    }
  }

  async loadPayments() {
    try {
      const payments = await this.paymentService.payment_GetHistory(undefined, undefined).toPromise();
      this.payments.set(payments || []);
    } catch (error) {
      this.payments.set([]);
    }
  }

  async loadInvoices() {
    try {
      const invoices = await this.invoiceService.invoice_GetMy(undefined, undefined).toPromise();
      this.invoices.set(invoices || []);
    } catch (error) {
      this.invoices.set([]);
    }
  }

  getStatusSeverity(status: any): string {
    const statusStr = status?.toString() || '';
    const statusMap: Record<string, string> = {
      'Active': 'success',
      'Trialing': 'info',
      'Suspended': 'warning',
      'Cancelled': 'danger',
      'Expired': 'danger',
      'Success': 'success',
      'Completed': 'success',
      'Paid': 'success',
      'Pending': 'warning',
      'Failed': 'danger',
      'Refunded': 'info',
      'Overdue': 'danger',
      'Voided': 'danger'
    };
    return statusMap[statusStr] || 'secondary';
  }

  getDaysRemaining(): number {
    const sub = this.subscription();
    if (!sub || !sub.currentPeriodEnd) return 0;
    const today = new Date();
    const endDate = new Date(sub.currentPeriodEnd);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  openCouponDialog() {
    this.showCouponDialog = true;
    this.couponCode = '';
  }

  async applyCoupon() {
    const sub = this.subscription();
    if (!sub || !this.couponCode.trim()) return;

    try {
      this.applyingCoupon = true;
      
      await this.subscriptionService.tenantSubscription_ApplyCoupon(sub.id, this.couponCode.trim() as any).toPromise();
      
      this.showAlert('Coupon applied successfully!', 'success');
      
      this.showCouponDialog = false;
      await this.loadSubscription();
    } catch (error: any) {
      this.showAlert(error.error?.message || 'Failed to apply coupon', 'danger');
    } finally {
      this.applyingCoupon = false;
    }
  }

  openCancelDialog() {
    this.showCancelDialog = true;
    this.cancelReason = '';
  }

  async cancelSubscription() {
    const sub = this.subscription();
    if (!sub) return;

    this.showConfirmCancelDialog = true;
    this.confirmMessage = 'Are you sure you want to cancel your subscription? This action cannot be undone.';
    this.confirmAction = async () => {
      try {
        this.cancelling = true;
        await this.subscriptionService.tenantSubscription_Cancel(sub.id).toPromise();
        
        this.showAlert('Your subscription has been cancelled', 'success');
        
        this.showCancelDialog = false;
        await this.loadSubscription();
      } catch (error: any) {
        this.showAlert(error.error?.message || 'Failed to cancel subscription', 'danger');
      } finally {
        this.cancelling = false;
        this.showConfirmCancelDialog = false;
      }
    };
  }

  async downloadInvoice(invoiceId: number) {
    try {
      const blob = await this.invoiceService.invoice_Download(invoiceId.toString()).toPromise();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
        link.download = `invoice-${invoiceId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      this.showAlert('Failed to download invoice', 'danger');
    }
  }

  upgradeSubscription() {
    this.router.navigate(['/subscription/plans']);
  }

  formatCurrency(amount: number): string {
    return `R ${amount.toFixed(2)}`;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    const alert: Alert = { message, type, id: Date.now() };
    this.alerts.push(alert);
    setTimeout(() => this.dismissAlert(alert), 5000);
  }

  dismissAlert(alert: Alert): void {
    this.alerts = this.alerts.filter(a => a.id !== alert.id);
  }

  confirmCancelAction(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }

  cancelConfirmAction(): void {
    this.showConfirmCancelDialog = false;
    this.confirmAction = null;
  }
}

interface Alert {
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  id: number;
}
