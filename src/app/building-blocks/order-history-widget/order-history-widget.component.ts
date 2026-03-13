import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth-service';

interface MyOrder {
    id: string;
    orderNumber: string;
    orderDate: string;
    status: number;
    paymentStatus: number;
    fulfillmentStatus: number;
    totalAmount: number;
    trackingNumber?: string;
    shippingCarrier?: string;
    trackingUrl?: string;
    orderItems?: any[];
}

@Component({
    selector: 'app-order-history-widget',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="order-history-widget" [ngStyle]="getContainerStyles()">
            <div class="container">
                <h2 *ngIf="config.showTitle" [ngStyle]="getTitleStyles()">{{ config.title || 'My Orders' }}</h2>

                <!-- Not logged in -->
                <div class="not-logged-in" *ngIf="!isLoggedIn">
                    <p>Please <a routerLink="/auth/login">log in</a> to view your orders.</p>
                </div>

                <!-- Loading -->
                <div class="loading" *ngIf="isLoggedIn && loading">Loading your orders…</div>

                <!-- Empty -->
                <div class="empty" *ngIf="isLoggedIn && !loading && orders.length === 0">
                    <p>You haven't placed any orders yet.</p>
                </div>

                <!-- Order list -->
                <div class="orders-list" *ngIf="isLoggedIn && !loading && orders.length > 0">
                    <div class="order-card" *ngFor="let order of orders.slice(0, config.pageSize || 10)" [ngStyle]="getCardStyles()">
                        <div class="order-header">
                            <div>
                                <span class="order-number">{{ order.orderNumber }}</span>
                                <span class="order-date">{{ order.orderDate | date:'dd MMM yyyy' }}</span>
                            </div>
                            <div class="order-badges">
                                <span class="badge" [class]="'status-' + order.status">{{ getStatusLabel(order.status) }}</span>
                                <span class="badge pay" [class]="'pay-' + order.paymentStatus" *ngIf="config.showStatusBadges">{{ getPaymentLabel(order.paymentStatus) }}</span>
                            </div>
                        </div>

                        <div class="order-items-preview" *ngIf="order.orderItems && order.orderItems.length > 0">
                            <span *ngFor="let item of order.orderItems.slice(0, 3)" class="item-chip">
                                {{ item.productName }} × {{ item.quantity }}
                            </span>
                            <span class="item-chip more" *ngIf="order.orderItems.length > 3">+{{ order.orderItems.length - 3 }} more</span>
                        </div>

                        <div class="order-footer">
                            <div class="tracking-info" *ngIf="config.showTracking && order.trackingNumber">
                                <span class="track-label">Tracking:</span>
                                <a *ngIf="order.trackingUrl" [href]="order.trackingUrl" target="_blank" class="track-link">{{ order.trackingNumber }}</a>
                                <span *ngIf="!order.trackingUrl">{{ order.trackingNumber }}</span>
                                <span *ngIf="order.shippingCarrier" class="carrier"> via {{ order.shippingCarrier }}</span>
                            </div>
                            <span class="order-total">{{ config.currencySymbol || '$' }}{{ order.totalAmount | number:'1.2-2' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .order-history-widget { padding: 3rem 0; }
        .container { max-width: 860px; margin: 0 auto; padding: 0 1rem; }
        h2 { margin-bottom: 1.5rem; }
        .not-logged-in, .loading, .empty { text-align: center; padding: 2rem; color: #888; }
        .not-logged-in a { color: #007bff; }
        .orders-list { display: flex; flex-direction: column; gap: 1rem; }
        .order-card {
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 1.25rem;
        }
        .order-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
        .order-number { font-weight: 700; margin-right: 0.75rem; }
        .order-date { color: #999; font-size: 0.85rem; }
        .order-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .badge {
            padding: 0.2rem 0.6rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .status-0 { background: #fef3c7; color: #92400e; } /* Pending */
        .status-1 { background: #dbeafe; color: #1e40af; } /* Processing */
        .status-2 { background: #d1fae5; color: #065f46; } /* Completed */
        .status-3 { background: #fee2e2; color: #991b1b; } /* Cancelled */
        .status-4 { background: #e0e7ff; color: #3730a3; } /* Refunded */
        .pay-0 { background: #fef3c7; color: #92400e; }
        .pay-1 { background: #d1fae5; color: #065f46; }
        .pay-2 { background: #fee2e2; color: #991b1b; }
        .order-items-preview { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 0.75rem; }
        .item-chip { background: #f5f5f5; border-radius: 4px; padding: 0.2rem 0.5rem; font-size: 0.75rem; color: #555; }
        .item-chip.more { background: #e5e7eb; }
        .order-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
        .track-label { font-size: 0.8rem; color: #888; margin-right: 4px; }
        .track-link { color: #007bff; font-size: 0.85rem; }
        .carrier { font-size: 0.8rem; color: #aaa; }
        .order-total { font-weight: 700; font-size: 1rem; }
    `]
})
export class OrderHistoryWidgetComponent implements OnInit {
    @Input() config: any = {
        title: 'My Orders',
        showTitle: true,
        pageSize: 10,
        showTracking: true,
        showStatusBadges: true,
        currencySymbol: '$',
        backgroundColor: '#ffffff',
        titleColor: '#222222',
        cardBackground: '#ffffff'
    };

    orders: MyOrder[] = [];
    loading = false;
    isLoggedIn = false;

    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient, private authService: AuthService) {}

    ngOnInit(): void {
        this.isLoggedIn = this.authService.isAuthenticated();
        if (this.isLoggedIn) this.loadOrders();
    }

    loadOrders(): void {
        this.loading = true;
        this.http.get<MyOrder[]>(`${this.baseUrl}/api/Order/Order_GetMyOrders`).subscribe({
            next: (orders) => { this.orders = orders; this.loading = false; },
            error: () => { this.loading = false; }
        });
    }

    getStatusLabel(status: number): string {
        return ['Pending', 'Processing', 'Completed', 'Cancelled', 'Refunded'][status] || 'Unknown';
    }

    getPaymentLabel(status: number): string {
        return ['Pending', 'Paid', 'Failed', 'Refunded', 'Partial'][status] || 'Unknown';
    }

    getContainerStyles() { return { backgroundColor: this.config.backgroundColor }; }
    getTitleStyles() { return { color: this.config.titleColor }; }
    getCardStyles() { return { backgroundColor: this.config.cardBackground }; }
}
