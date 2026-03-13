import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order, OrderStats, OrderStatus, PaymentStatus, FulfillmentStatus } from '../../../core/services/order.service';

@Component({
    selector: 'app-order-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="order-container">
            <h1>Order Management</h1>
            <div class="stats-grid" *ngIf="stats">
                <div class="stat-card">
                    <div class="stat-value">\${{ stats.totalRevenue | number: '1.2-2' }}</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.totalOrders }}</div>
                    <div class="stat-label">Total Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${{ stats.averageOrderValue | number: '1.2-2' }}</div>
                    <div class="stat-label">Avg Order Value</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.pendingOrders }}</div>
                    <div class="stat-label">Pending Orders</div>
                </div>
            </div>
            <div class="filters-section">
                <input type="text" class="form-control" placeholder="Search orders..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" />
                <select class="form-select" [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Order#</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Tracking</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let order of filteredOrders">
                            <td>
                                <strong>{{ order.orderNumber }}</strong>
                            </td>
                            <td>
                                {{ order.customerName }}<br /><small>{{ order.customerEmail }}</small>
                            </td>
                            <td>{{ order.createdAt | date: 'short' }}</td>
                            <td>\${{ order.total | number: '1.2-2' }}</td>
                            <td>
                                <span class="badge" [ngClass]="getStatusClass(order.status)">{{ order.status }}</span>
                            </td>
                            <td>
                                <span class="badge" [ngClass]="getPaymentClass(order.paymentStatus)">{{ order.paymentStatus }}</span>
                            </td>
                            <td>
                                <span *ngIf="order.trackingNumber" class="tracking-chip">
                                    <a *ngIf="order.trackingUrl" [href]="order.trackingUrl" target="_blank">{{ order.trackingNumber }}</a>
                                    <span *ngIf="!order.trackingUrl">{{ order.trackingNumber }}</span>
                                    <small *ngIf="order.shippingCarrier"> · {{ order.shippingCarrier }}</small>
                                </span>
                                <span *ngIf="!order.trackingNumber" class="text-muted">—</span>
                            </td>
                            <td class="actions-cell">
                                <select class="form-select form-select-sm" [(ngModel)]="order.status" (change)="updateStatus(order)">
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <button class="btn btn-sm btn-outline-secondary mt-1" (click)="openTracking(order)">
                                    {{ trackingOrder?.id === order.id ? '✕ Close' : '🚚 Tracking' }}
                                </button>
                            </td>
                        </tr>
                        <!-- Inline tracking panel -->
                        <tr *ngIf="trackingOrder" class="tracking-row">
                            <td colspan="8">
                                <div class="tracking-panel" *ngIf="trackingOrder">
                                    <h4>Set Shipment Tracking — {{ trackingOrder.orderNumber }}</h4>
                                    <div class="tracking-fields">
                                        <div class="field-group">
                                            <label>Tracking Number</label>
                                            <input type="text" [(ngModel)]="trackingForm.trackingNumber" placeholder="e.g. 1Z999AA10123456784" />
                                        </div>
                                        <div class="field-group">
                                            <label>Shipping Carrier</label>
                                            <input type="text" [(ngModel)]="trackingForm.shippingCarrier" placeholder="e.g. UPS, FedEx, DHL" />
                                        </div>
                                        <div class="field-group">
                                            <label>Tracking URL</label>
                                            <input type="url" [(ngModel)]="trackingForm.trackingUrl" placeholder="https://track.example.com/..." />
                                        </div>
                                        <div class="tracking-actions">
                                            <button class="btn btn-primary btn-sm" (click)="saveTracking()" [disabled]="savingTracking">
                                                {{ savingTracking ? 'Saving…' : 'Save Tracking' }}
                                            </button>
                                            <button class="btn btn-secondary btn-sm" (click)="trackingOrder = null">Cancel</button>
                                            <span class="save-msg" *ngIf="trackingSaveMsg">{{ trackingSaveMsg }}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    styles: [
        `
            .order-container {
                padding: 2rem;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            .stat-card {
                background: white;
                padding: 1.5rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .stat-value {
                font-size: 2rem;
                font-weight: bold;
            }
            .stat-label {
                color: #666;
                margin-top: 0.5rem;
            }
            .filters-section {
                display: flex;
                gap: 1rem;
                margin-bottom: 2rem;
            }
            .badge {
                padding: 0.25rem 0.75rem;
                border-radius: 4px;
            }
            .tracking-chip { font-size: 0.8rem; }
            .tracking-chip a { color: #007bff; text-decoration: none; }
            .actions-cell { white-space: nowrap; }
            .tracking-row td { padding: 0; border-top: none; }
            .tracking-panel {
                background: #f0f7ff;
                border: 1px solid #bee3f8;
                border-radius: 6px;
                padding: 1.25rem;
                margin: 4px 0 8px;
            }
            .tracking-panel h4 { margin: 0 0 1rem; font-size: 0.95rem; color: #2b6cb0; }
            .tracking-fields { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
            .field-group { display: flex; flex-direction: column; gap: 4px; min-width: 200px; flex: 1; }
            .field-group label { font-size: 0.78rem; color: #555; }
            .field-group input { border: 1px solid #bee3f8; border-radius: 4px; padding: 6px 10px; font-size: 0.85rem; }
            .tracking-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
            .save-msg { font-size: 0.8rem; color: #38a169; font-weight: 600; }
        `
    ]
})
export class OrderManagementComponent implements OnInit {
    orders: Order[] = [];
    filteredOrders: Order[] = [];
    stats: OrderStats | null = null;
    searchTerm = '';
    filterStatus = '';

    trackingOrder: Order | null = null;
    trackingForm = { trackingNumber: '', shippingCarrier: '', trackingUrl: '' };
    savingTracking = false;
    trackingSaveMsg = '';

    constructor(private orderService: OrderService) {}

    ngOnInit(): void {
        this.loadOrders();
        this.loadStats();
    }

    loadOrders(): void {
        this.orderService.getOrders().subscribe({
            next: (data) => {
                this.orders = data;
                this.applyFilters();
            },
            error: (_error: any) => console.error('Error loading orders')
        });
    }

    loadStats(): void {
        this.orderService.getOrderStats().subscribe({
            next: (data) => (this.stats = data),
            error: (_error: any) => console.error('Error loading stats')
        });
    }

    applyFilters(): void {
        this.filteredOrders = this.orders.filter((order) => {
            const matchesSearch = !this.searchTerm || order.orderNumber.includes(this.searchTerm) || order.customerName.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesStatus = !this.filterStatus || order.status === this.filterStatus;
            return matchesSearch && matchesStatus;
        });
    }

    updateStatus(order: Order): void {
        this.orderService.updateOrderStatus(order.id, order.status).subscribe({
            next: () => this.loadStats(),
            error: (_error: any) => console.error('Error updating status')
        });
    }

    openTracking(order: Order): void {
        if (this.trackingOrder?.id === order.id) {
            this.trackingOrder = null;
            return;
        }
        this.trackingOrder = order;
        this.trackingForm = {
            trackingNumber: order.trackingNumber ?? '',
            shippingCarrier: order.shippingCarrier ?? '',
            trackingUrl: order.trackingUrl ?? ''
        };
        this.trackingSaveMsg = '';
    }

    saveTracking(): void {
        if (!this.trackingOrder) return;
        this.savingTracking = true;
        this.trackingSaveMsg = '';
        this.orderService.updateTracking(
            this.trackingOrder.id,
            this.trackingForm.trackingNumber || undefined,
            this.trackingForm.shippingCarrier || undefined,
            this.trackingForm.trackingUrl || undefined
        ).subscribe({
            next: () => {
                this.savingTracking = false;
                this.trackingSaveMsg = '✓ Saved';
                // Update local order copy
                const o = this.orders.find(x => x.id === this.trackingOrder!.id);
                if (o) {
                    o.trackingNumber = this.trackingForm.trackingNumber || undefined;
                    o.shippingCarrier = this.trackingForm.shippingCarrier || undefined;
                    o.trackingUrl = this.trackingForm.trackingUrl || undefined;
                }
                setTimeout(() => { this.trackingOrder = null; this.trackingSaveMsg = ''; }, 2000);
            },
            error: (_e: any) => {
                this.savingTracking = false;
                this.trackingSaveMsg = '✗ Failed to save';
            }
        });
    }

    viewOrder(order: Order): void {
        alert(`Order Details: ${order.orderNumber}\nTotal: $${order.total}\nItems: ${order.items.length}`);
    }

    getStatusClass(status: OrderStatus): string {
        const classes: { [key: string]: string } = {
            pending: 'bg-warning',
            processing: 'bg-info',
            completed: 'bg-success',
            cancelled: 'bg-danger',
            refunded: 'bg-secondary'
        };
        return classes[status] || 'bg-secondary';
    }

    getPaymentClass(status: PaymentStatus): string {
        return status === 'paid' ? 'bg-success' : status === 'failed' ? 'bg-danger' : 'bg-warning';
    }
}
