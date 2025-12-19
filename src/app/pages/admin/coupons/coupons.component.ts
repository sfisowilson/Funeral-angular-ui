import { Component, signal , NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponServiceProxy, CreateCouponDto, UpdateCouponDto } from '../../../core/services/service-proxies';

interface Alert {
    type: string;
    message: string;
}

interface CouponDto {
    id: string;
    code: string;
    name: string;
    description?: string;
    discountType: string;
    discountValue: number;
    durationInMonths: number;
    maxRedemptions?: number;
    currentRedemptions: number;
    validFrom: string;
    validUntil?: string;
    isActive: boolean;
    minimumPurchaseAmount?: number;
    isFirstTimeOnly: boolean;
    campaignName?: string;
    createdAt: string;
}

@Component({
    selector: 'app-coupons',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule
    ],
    providers: [CouponServiceProxy],
    schemas: [NO_ERRORS_SCHEMA], templateUrl: './coupons.component.html',
    styleUrls: ['./coupons.component.scss']
})
export class CouponsComponent {
    Math = Math;
    alerts: Alert[] = [];
    couponDialog: boolean = false;
    coupons = signal<CouponDto[]>([]);
    coupon: any = {};
    selectedCoupons!: CouponDto[] | null;
    submitted: boolean = false;
    loading: boolean = false;
    
    showConfirmModal = false;
    confirmMessage = '';
    confirmAction: (() => void) | null = null;

    cols = [
        { field: 'code', header: 'Code' },
        { field: 'name', header: 'Name' },
        { field: 'discountType', header: 'Type' },
        { field: 'discountValue', header: 'Discount' },
        { field: 'currentRedemptions', header: 'Used' },
        { field: 'validFrom', header: 'Valid From' },
        { field: 'validUntil', header: 'Valid Until' },
        { field: 'isActive', header: 'Active' }
    ];

    discountTypes = [
        { label: 'Percentage', value: '0' },
        { label: 'Fixed Amount', value: '1' }
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
    }

    loadCoupons() {
        this.loading = true;
        this.couponService.coupon_GetAll(1, 100, undefined).subscribe(
            (response: any) => {
                this.coupons.set(response.coupons || []);
                this.loading = false;
            },
            (error) => {
                this.showAlert('Failed to load coupons', 'danger');
                this.loading = false;
            }
        );
    }

    openNew() {
        this.coupon = {
            discountType: '0',
            durationInMonths: 1,
            isActive: true,
            isFirstTimeOnly: false,
            validFrom: new Date()
        };
        this.submitted = false;
        this.couponDialog = true;
    }

    editCoupon(coupon: CouponDto) {
        this.coupon = { ...coupon };
        this.couponDialog = true;
    }

    deleteCoupon(coupon: CouponDto) {
        this.showConfirm(
            `Are you sure you want to deactivate coupon '${coupon.code}'?`,
            () => {
                this.couponService.coupon_Delete(coupon.id).subscribe(
                    () => {
                        this.loadCoupons();
                        this.showAlert('Coupon deactivated', 'success');
                    },
                    (error) => {
                        this.showAlert('Failed to deactivate coupon', 'danger');
                    }
                );
            }
        );
    }

    hideDialog() {
        this.couponDialog = false;
        this.submitted = false;
    }

    saveCoupon() {
        this.submitted = true;

        if (!this.coupon.code || !this.coupon.name) {
            this.showAlert('Code and name are required', 'danger');
            return;
        }

        if (this.coupon.id) {
            // Update existing coupon
            const updateDto = new UpdateCouponDto();
            updateDto.name = this.coupon.name;
            updateDto.description = this.coupon.description;
            updateDto.validUntil = this.coupon.validUntil;
            updateDto.maxRedemptions = this.coupon.maxRedemptions;
            updateDto.isActive = this.coupon.isActive;
            updateDto.internalNotes = this.coupon.internalNotes;

            this.couponService.coupon_Update(this.coupon.id, updateDto).subscribe(
                () => {
                    this.loadCoupons();
                    this.showAlert('Coupon updated', 'success');
                    this.hideDialog();
                },
                (error) => {
                    this.showAlert('Failed to update coupon', 'danger');
                }
            );
        } else {
            // Create new coupon
            const createDto = new CreateCouponDto();
            createDto.code = this.coupon.code;
            createDto.name = this.coupon.name;
            createDto.description = this.coupon.description;
            createDto.discountType = parseInt(this.coupon.discountType);
            createDto.discountValue = this.coupon.discountValue;
            createDto.durationInMonths = this.coupon.durationInMonths;
            createDto.maxRedemptions = this.coupon.maxRedemptions;
            createDto.validFrom = this.coupon.validFrom;
            createDto.validUntil = this.coupon.validUntil;
            createDto.minimumPurchaseAmount = this.coupon.minimumPurchaseAmount;
            createDto.isFirstTimeOnly = this.coupon.isFirstTimeOnly;
            createDto.internalNotes = this.coupon.internalNotes;
            createDto.campaignName = this.coupon.campaignName;
            createDto.applicablePlanIds = [];

            this.couponService.coupon_Create(createDto).subscribe(
                () => {
                    this.loadCoupons();
                    this.showAlert('Coupon created', 'success');
                    this.hideDialog();
                },
                (error) => {
                    this.showAlert('Failed to create coupon', 'danger');
                }
            );
        }
    }

    exportCSV() {
        // Export functionality can be implemented with a library like xlsx or csv-export
        this.showAlert('Export feature - implement with library if needed', 'info');
    }
}
