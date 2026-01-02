import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer, CustomerStats } from '../../../core/services/customer.service';

@Component({
    selector: 'app-customer-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="customer-container">
      <h1>Customer Management</h1>
      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card"><div class="stat-value">{{ stats.totalCustomers }}</div><div class="stat-label">Total Customers</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats.activeCustomers }}</div><div class="stat-label">Active Customers</div></div>
        <div class="stat-card"><div class="stat-value">{{ stats.newCustomersThisMonth }}</div><div class="stat-label">New This Month</div></div>
      </div>
      <div class="filters-section">
        <input type="text" class="form-control" placeholder="Search customers..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
      </div>
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Total Spent</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let customer of filteredCustomers">
              <td><strong>{{ customer.firstName }} {{ customer.lastName }}</strong></td>
              <td>{{ customer.email }}</td>
              <td>{{ customer.totalOrders }}</td>
              <td>\${{ customer.totalSpent | number:'1.2-2' }}</td>
              <td><span class="badge" [ngClass]="customer.isActive ? 'bg-success' : 'bg-secondary'">{{ customer.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td><button class="btn btn-sm btn-primary" (click)="viewCustomer(customer)">View</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    `,
    styles: [`
    .customer-container { padding: 2rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { color: #666; margin-top: 0.5rem; }
    .filters-section { margin-bottom: 2rem; }
    `]
})
export class CustomerManagementComponent implements OnInit {
    customers: Customer[] = [];
    filteredCustomers: Customer[] = [];
    stats: CustomerStats | null = null;
    searchTerm = '';

    constructor(private customerService: CustomerService) {}

    ngOnInit(): void {
        this.loadCustomers();
        this.loadStats();
    }

    loadCustomers(): void {
        this.customerService.getCustomers().subscribe({
            next: (data) => { this.customers = data; this.applyFilters(); },
            error: (_error: any) => console.error('Error loading customers')
        });
    }

    loadStats(): void {
        this.customerService.getCustomerStats().subscribe({
            next: (data) => this.stats = data,
            error: (_error: any) => console.error('Error loading stats')
        });
    }

    applyFilters(): void {
        this.filteredCustomers = this.customers.filter(c => 
            !this.searchTerm || c.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
            c.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
            c.email.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    viewCustomer(customer: Customer): void {
        alert(`Customer: ${customer.firstName} ${customer.lastName}\nEmail: ${customer.email}\nTotal Orders: ${customer.totalOrders}\nTotal Spent: $${customer.totalSpent}`);
    }
}
