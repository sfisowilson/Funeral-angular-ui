import { Component, OnInit, signal , NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import {
  CouponServiceProxy,
  Coupon,
  CouponStatsDto
} from '../../../core/services/service-proxies';

interface Alert {
    type: string;
    message: string;
}

interface DiscountTypeOption {
  label: string;
  value: string;
}

interface DurationOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule
  ],
  providers: [CouponServiceProxy],
  schemas: [NO_ERRORS_SCHEMA], templateUrl: './coupon-list.component.html',
  styleUrl: './coupon-list.component.scss'
})
export class CouponListComponent implements OnInit {
  Math = Math;
  alerts: Alert[] = [];
  showConfirmModal = false;
  confirmMessage = '';
  confirmAction: (() => void) | null = null;
  coupons = signal<any[]>([]);
  stats = signal<CouponStatsDto | null>(null);
  loading = signal<boolean>(false);
  
  showDialog = false;
  dialogTitle = '';
  isEditMode = false;
  saving = false;
  
  // Form fields
  couponForm: any = {
    id: 0,
    code: '',
    name: '',
    discountType: '',
    discountValue: 0,
    duration: '',
    maxRedemptions: null,
    validFrom: null,
    validTo: null,
    isActive: true,
    minimumAmount: null,
    firstTimeOnly: false,
    allowedPlans: []
  };

  discountTypes: DiscountTypeOption[] = [
    { label: 'Percentage', value: '0' },
    { label: 'Fixed Amount', value: '1' }
  ];

  durations: DurationOption[] = [
    { label: '1 Month', value: '1' },
    { label: '3 Months', value: '3' },
    { label: '6 Months', value: '6' },
    { label: '12 Months', value: '12' },
    { label: '24 Months', value: '24' }
  ];

  constructor(
    private couponService: CouponServiceProxy
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
    this.loadCoupons();
    this.loadStats();
  }

  loadCoupons() {
    this.loading.set(true);
    this.couponService.coupon_GetAll(undefined, undefined, undefined).subscribe({
      next: (response: any) => {
        console.log('Raw response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', response ? Object.keys(response) : 'null');
        // Try both casing variants
        const couponsData = response?.coupons || response?.Coupons || [];
        console.log('Coupons data:', couponsData);
        this.coupons.set(couponsData);
        this.loading.set(false);
      },
      error: (error) => {
        this.showAlert('Failed to load coupons', 'danger');
        console.error('Load coupons error:', error);
        this.loading.set(false);
      }
    });
  }

  loadStats() {
    this.couponService.coupon_GetStats().subscribe({
      next: (stats) => {
        this.stats.set(stats || null);
      },
      error: (error) => {
        console.error('Failed to load stats', error);
      }
    });
  }

  openNewDialog() {
    this.dialogTitle = 'Create New Coupon';
    this.isEditMode = false;
    this.resetForm();
    this.showDialog = true;
  }

  openEditDialog(coupon: any) {
    this.dialogTitle = 'Edit Coupon';
    this.isEditMode = true;
    this.couponForm = {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      duration: coupon.duration || 'Once',
      maxRedemptions: coupon.maxRedemptions,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom.toString()) : null,
      validTo: coupon.validTo ? new Date(coupon.validTo.toString()) : null,
      isActive: coupon.isActive,
      minimumAmount: coupon.minimumAmount || null,
      firstTimeOnly: coupon.isFirstTimeOnly || false,
      allowedPlans: []
    };
    this.showDialog = true;
  }

  resetForm() {
    this.couponForm = {
      id: 0,
      code: '',
      name: '',
      discountType: 'Percentage',
      discountValue: 0,
      duration: 'Once',
      maxRedemptions: null,
      validFrom: null,
      validTo: null,
      isActive: true,
      minimumAmount: null,
      firstTimeOnly: false,
      allowedPlans: []
    };
  }

  async saveCoupon() {
    console.log('saveCoupon called', this.couponForm);
    
    if (!this.validateForm()) {
      console.log('Form validation failed');
      return;
    }

    try {
      this.saving = true;
      console.log('Saving coupon...', this.isEditMode ? 'UPDATE' : 'CREATE');

      if (this.isEditMode) {
        const updateDto = {
          name: this.couponForm.name,
          description: this.couponForm.description,
          validUntil: this.couponForm.validTo,
          maxRedemptions: this.couponForm.maxRedemptions,
          isActive: this.couponForm.isActive,
          internalNotes: this.couponForm.internalNotes
        };
        await this.couponService.coupon_Update(this.couponForm.id, updateDto as any).toPromise();
        this.showAlert('Coupon updated successfully', 'success');
      } else {
        const createDto = {
          code: this.couponForm.code,
          name: this.couponForm.name,
          description: this.couponForm.description,
          discountType: parseInt(this.couponForm.discountType),
          discountValue: parseFloat(this.couponForm.discountValue),
          durationInMonths: parseInt(this.couponForm.duration),
          maxRedemptions: this.couponForm.maxRedemptions ? parseInt(this.couponForm.maxRedemptions) : null,
          validFrom: this.couponForm.validFrom ? new Date(this.couponForm.validFrom) : new Date(),
          validUntil: this.couponForm.validTo ? new Date(this.couponForm.validTo) : null,
          applicablePlanIds: this.couponForm.allowedPlans || [],
          minimumPurchaseAmount: this.couponForm.minimumAmount ? parseFloat(this.couponForm.minimumAmount) : null,
          isFirstTimeOnly: this.couponForm.firstTimeOnly || false,
          internalNotes: this.couponForm.internalNotes,
          campaignName: this.couponForm.campaignName
        };
        console.log('Create DTO:', createDto);
        await this.couponService.coupon_Create(createDto as any).toPromise();
        this.showAlert('Coupon created successfully', 'success');
      }

      this.showDialog = false;
      await this.loadCoupons();
      await this.loadStats();
    } catch (error: any) {
      this.showAlert(error.error?.message || 'Failed to save coupon', 'danger');
    } finally {
      this.saving = false;
    }
  }

  validateForm(): boolean {
    if (!this.couponForm.code?.trim() && !this.isEditMode) {
      this.showAlert('Coupon code is required', 'warning');
      return false;
    }

    if (!this.couponForm.name?.trim()) {
      this.showAlert('Coupon name is required', 'warning');
      return false;
    }

    if (!this.couponForm.discountType) {
      this.showAlert('Discount type is required', 'warning');
      return false;
    }

    if (!this.couponForm.discountValue || this.couponForm.discountValue <= 0) {
      this.showAlert('Discount value must be greater than 0', 'warning');
      return false;
    }

    if (this.couponForm.discountType === '0' && this.couponForm.discountValue > 100) {
      this.showAlert('Percentage discount cannot exceed 100%', 'warning');
      return false;
    }

    if (!this.couponForm.duration && !this.isEditMode) {
      this.showAlert('Duration is required', 'warning');
      return false;
    }

    return true;
  }

  deleteCoupon(coupon: any) {
    this.showConfirm(
      `Are you sure you want to delete the coupon "${coupon.name}"?`,
      async () => {
        try {
          await this.couponService.coupon_Delete(coupon.id).toPromise();
          this.showAlert('Coupon deleted successfully', 'success');
          await this.loadCoupons();
          await this.loadStats();
        } catch (error: any) {
          this.showAlert(error.error?.message || 'Failed to delete coupon', 'danger');
        }
      }
    );
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
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

  getDiscountDisplay(coupon: any): string {
    if (coupon.discountType === 'Percentage') {
      return `${coupon.discountValue}%`;
    }
    return this.formatCurrency(coupon.discountValue);
  }
}
