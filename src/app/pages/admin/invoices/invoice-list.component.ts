import { Component, OnInit, signal , NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  InvoiceServiceProxy,
  Invoice
} from '../../../core/services/service-proxies';

interface Alert {
  type: string;
  message: string;
}

interface StatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [InvoiceServiceProxy],
  schemas: [NO_ERRORS_SCHEMA], templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss'
})
export class InvoiceListComponent implements OnInit {
  Math = Math;
  alerts: Alert[] = [];
  showConfirmModal = false;
  confirmMessage = '';
  confirmAction: (() => void) | null = null;
  invoices = signal<any[]>([]);
  stats = signal<any | null>(null);
  loading = signal<boolean>(false);
  
  showVoidDialog = false;
  selectedInvoice: any | null = null;
  voidReason: string = '';
  voiding = false;

  searchText = '';
  statusFilter = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  statusOptions: StatusOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Overdue', value: 'Overdue' },
    { label: 'Voided', value: 'Voided' }
  ];

  constructor(
    private invoiceService: InvoiceServiceProxy
  ) {}

  showAlert(message: string, type: string = 'info'): void {
    this.alerts.push({ type, message });
    setTimeout(() => this.dismissAlert(this.alerts[0]), 5000);
  }

  dismissAlert(alert: Alert): void {
    const index = this.alerts.indexOf(alert);
    if (index > -1) {
      this.alerts.splice(index, 1);
    }
  }

  showConfirm(message: string, action: () => void): void {
    this.confirmMessage = message;
    this.confirmAction = action;
    this.showConfirmModal = true;
  }

  executeConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.showConfirmModal = false;
    this.confirmAction = null;
  }

  cancelConfirm(): void {
    this.showConfirmModal = false;
    this.confirmAction = null;
  }

  ngOnInit() {
    this.loadInvoices();
    this.loadStats();
  }

  async loadInvoices() {
    try {
      this.loading.set(true);
      const invoices = await this.invoiceService.invoice_GetAll(
        undefined,
        undefined,
        this.statusFilter || undefined,
        this.searchText || undefined
      ).toPromise();
      this.invoices.set(invoices || []);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load invoices'
      });
    } finally {
      this.loading.set(false);
    }
  }

  async loadStats() {
    try {
      const stats = await this.invoiceService.invoice_GetStats().toPromise();
      this.stats.set(stats);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  }

  applyFilters() {
    this.loadInvoices();
  }

  clearFilters() {
    this.searchText = '';
    this.statusFilter = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.loadInvoices();
  }

  async downloadInvoice(invoice: any) {
    try {
      const blob = await this.invoiceService.invoice_Download(invoice.id.toString()).toPromise();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
        link.download = `invoice-${invoice.invoiceNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download invoice'
      });
    }
  }

  async generatePdf(invoice: any) {
    try {
      await this.invoiceService.invoice_GeneratePdf(invoice.id).toPromise();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'PDF generated successfully'
      });
      await this.loadInvoices();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error?.message || 'Failed to generate PDF'
      });
    }
  }

  async resendInvoice(invoice: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to resend invoice ${invoice.invoiceNumber} to the tenant?`,
      header: 'Confirm Resend',
      icon: 'pi pi-question-circle',
      accept: async () => {
        try {
          await this.invoiceService.invoice_Resend(invoice.id).toPromise();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Invoice resent successfully'
          });
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to resend invoice'
          });
        }
      }
    });
  }

  openVoidDialog(invoice: any) {
    this.selectedInvoice = invoice;
    this.voidReason = '';
    this.showVoidDialog = true;
  }

  async voidInvoice() {
    if (!this.selectedInvoice) return;

    if (!this.voidReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please provide a reason for voiding this invoice'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to void invoice ${this.selectedInvoice.invoiceNumber}? This action cannot be undone.`,
      header: 'Confirm Void',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          this.voiding = true;
          
          await this.invoiceService.invoice_Void(this.selectedInvoice!.id, {
            reason: this.voidReason
          } as any).toPromise();
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Invoice voided successfully'
          });
          
          this.showVoidDialog = false;
          await this.loadInvoices();
          await this.loadStats();
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to void invoice'
          });
        } finally {
          this.voiding = false;
        }
      }
    });
  }

  getStatusSeverity(status: any): 'success' | 'info' | 'warning' | 'danger' {
    const statusStr = status?.toString() || '';
    const statusMap: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      'Draft': 'info',
      'Pending': 'warning',
      'Paid': 'success',
      'Overdue': 'danger',
      'Voided': 'danger'
    };
    return statusMap[statusStr] || 'info';
  }

  canVoid(invoice: any): boolean {
    return invoice.status !== 'Voided' && invoice.status !== 'Paid';
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
}
