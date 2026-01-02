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
        <div class="stat-card"><div class="stat-value">\${{ stats.totalRevenue | number:'1.2-2' }}</div><div class="stat-label">Total Revenue</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats.totalOrders }}</div><div class="stat-label">Total Orders</div></div>
        <div class="stat-card"><div class="stat-value">\${{ stats.averageOrderValue | number:'1.2-2' }}</div><div class="stat-label">Avg Order Value</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats.pendingOrders }}</div><div class="stat-label">Pending Orders</div></div>
      </div>
      <div class="filters-section">
        <input type="text" class="form-control" placeholder="Search orders..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
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
          <thead><tr><th>Order#</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let order of filteredOrders">
              <td><strong>{{ order.orderNumber }}</strong></td>
              <td>{{ order.customerName }}<br><small>{{ order.customerEmail }}</small></td>
              <td>{{ order.createdAt | date:'short' }}</td>
              <td>\${{ order.total | number:'1.2-2' }}</td>
              <td><span class="badge" [ngClass]="getStatusClass(order.status)">{{ order.status }}</span></td>
              <td><span class="badge" [ngClass]="getPaymentClass(order.paymentStatus)">{{ order.paymentStatus }}</span></td>
              <td>
                <button class="btn btn-sm btn-primary" (click)="viewOrder(order)">View</button>
                <select class="form-select form-select-sm d-inline-block w-auto ms-2" [(ngModel)]="order.status" (change)="updateStatus(order)">
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    `,
    styles: [`
    .order-container { padding: 2rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { color: #666; margin-top: 0.5rem; }
    .filters-section { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 4px; }
    `]
})
export class OrderManagementComponent implements OnInit {
    orders: Order[] = [];
    filteredOrders: Order[] = [];
    stats: OrderStats | null = null;
    searchTerm = '';
    filterStatus = '';

    constructor(private orderService: OrderService) {}

    ngOnInit(): void {
        this.loadOrders();
        this.loadStats();
    }

    loadOrders(): void {
        this.orderService.getOrders().subscribe({
            next: (data) => { this.orders = data; this.applyFilters(); },
            error: (_error: any) => console.error('Error loading orders')
        });
    }

    loadStats(): void {
        this.orderService.getOrderStats().subscribe({
            next: (data) => this.stats = data,
            error: (_error: any) => console.error('Error loading stats')
        });
    }

    applyFilters(): void {
        this.filteredOrders = this.orders.filter(order => {
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

    viewOrder(order: Order): void {
        alert(`Order Details: ${order.orderNumber}\nTotal: $${order.total}\nItems: ${order.items.length}`);
    }

    getStatusClass(status: OrderStatus): string {
        const classes: { [key: string]: string } = {
            'pending': 'bg-warning', 'processing': 'bg-info', 'completed': 'bg-success', 'cancelled': 'bg-danger', 'refunded': 'bg-secondary'
        };
        return classes[status] || 'bg-secondary';
    }

    getPaymentClass(status: PaymentStatus): string {
        return status === 'paid' ? 'bg-success' : status === 'failed' ? 'bg-danger' : 'bg-warning';
    }
}
