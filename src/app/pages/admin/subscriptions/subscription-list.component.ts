import { Component, OnInit, signal , NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TenantSubscriptionServiceProxy,
  SubscriptionPlanServiceProxy,
  TenantSubscription,
  SubscriptionPlan
} from '../../../core/services/service-proxies';

interface StatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [
    TenantSubscriptionServiceProxy,
    SubscriptionPlanServiceProxy
  ],
  schemas: [NO_ERRORS_SCHEMA], templateUrl: './subscription-list.component.html',
  styleUrl: './subscription-list.component.scss'
})
export class SubscriptionListComponent implements OnInit {
  subscriptions = signal<any[]>([]);
  plans = signal<any[]>([]);
  loading = signal<boolean>(false);
  
  showChangePlanDialog = false;
  selectedSubscription: any | null = null;
  newPlanId: number | null = null;
  changingPlan = false;

  searchText = '';
  statusFilter = '';
  planFilter: number | null = null;

  statusOptions: StatusOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'Active' },
    { label: 'Trialing', value: 'Trialing' },
    { label: 'Suspended', value: 'Suspended' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Expired', value: 'Expired' }
  ];

  constructor(
    private subscriptionService: TenantSubscriptionServiceProxy,
    private planService: SubscriptionPlanServiceProxy,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadSubscriptions();
    this.loadPlans();
  }

  async loadSubscriptions() {
    try {
      this.loading.set(true);
      const subs = await this.subscriptionService.tenantSubscription_GetAll(
        undefined,
        undefined,
        this.statusFilter as any,
        this.searchText || undefined
      ).toPromise();
      this.subscriptions.set(subs || []);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load subscriptions'
      });
    } finally {
      this.loading.set(false);
    }
  }

  async loadPlans() {
    try {
      const plans = await this.planService.subscriptionPlan_GetAll().toPromise();
      this.plans.set(plans || []);
    } catch (error) {
      console.error('Failed to load plans', error);
    }
  }

  applyFilters() {
    this.loadSubscriptions();
  }

  clearFilters() {
    this.searchText = '';
    this.statusFilter = '';
    this.planFilter = null;
    this.loadSubscriptions();
  }

  suspendSubscription(subscription: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to suspend the subscription for this tenant?`,
      header: 'Confirm Suspension',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.subscriptionService.tenantSubscription_Suspend(subscription.id, {} as any).toPromise();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Subscription suspended successfully'
          });
          await this.loadSubscriptions();
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to suspend subscription'
          });
        }
      }
    });
  }

  reactivateSubscription(subscription: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to reactivate this subscription?`,
      header: 'Confirm Reactivation',
      icon: 'pi pi-question-circle',
      accept: async () => {
        try {
          await this.subscriptionService.tenantSubscription_Reactivate(subscription.id).toPromise();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Subscription reactivated successfully'
          });
          await this.loadSubscriptions();
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to reactivate subscription'
          });
        }
      }
    });
  }

  openChangePlanDialog(subscription: any) {
    this.selectedSubscription = subscription;
    this.newPlanId = subscription.subscriptionPlanId;
    this.showChangePlanDialog = true;
  }

  async changePlan() {
    if (!this.selectedSubscription || !this.newPlanId) return;

    try {
      this.changingPlan = true;
      
      await this.subscriptionService.tenantSubscription_ChangePlan(
        this.selectedSubscription.id,
        this.newPlanId as any
      ).toPromise();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Plan changed successfully'
      });
      
      this.showChangePlanDialog = false;
      await this.loadSubscriptions();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error?.message || 'Failed to change plan'
      });
    } finally {
      this.changingPlan = false;
    }
  }

  async processRenewals() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to process all pending renewals? This will charge tenants whose subscriptions are due for renewal.',
      header: 'Confirm Process Renewals',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.subscriptionService.tenantSubscription_ProcessRenewals().toPromise();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Renewals processed successfully'
          });
          await this.loadSubscriptions();
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to process renewals'
          });
        }
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const statusMap: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      'Active': 'success',
      'Trialing': 'info',
      'Suspended': 'warning',
      'Cancelled': 'danger',
      'Expired': 'danger'
    };
    return statusMap[status] || 'info';
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

  getDaysRemaining(endDate: Date | string | undefined): number {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
}
