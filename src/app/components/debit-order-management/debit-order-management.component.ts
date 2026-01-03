import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DebitOrderService, DebitOrderBatch } from '../../services/debit-order.service';

@Component({
  selector: 'app-debit-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-2xl font-bold mb-6">Debit Order Management</h2>
      
      <!-- Create Batch Section -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">Create New Batch</h3>
        <div class="flex gap-4 items-end">
          <div>
            <label class="block text-sm font-medium mb-2">Processing Date</label>
            <input type="date" [(ngModel)]="processingDate" 
                   class="border rounded-lg px-3 py-2">
          </div>
          <button (click)="createBatch()" 
                  [disabled]="creating"
                  class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ creating ? 'Creating...' : 'Create Batch' }}
          </button>
        </div>
      </div>

      <!-- Batches List -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch #</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processing Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let batch of batches">
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ batch.batchNumber }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ toDate(batch.processingDate) | date:'short' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                {{ batch.totalTransactions }} 
                <span class="text-gray-500">({{ batch.successfulTransactions }} / {{ batch.failedTransactions }})</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">R {{ batch.totalAmount | number:'1.2-2' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="getStatusClass(batch.status)" class="px-2 py-1 text-xs rounded-full">
                  {{ batch.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button *ngIf="batch.status === 'Draft'" 
                        (click)="generateFile(batch.id)"
                        class="text-blue-600 hover:text-blue-800 mr-2">
                  Generate File
                </button>
                <button (click)="viewBatch(batch.id)" class="text-gray-600 hover:text-gray-800">
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Upload Response Section -->
      <div class="bg-white shadow rounded-lg p-6 mt-6">
        <h3 class="text-lg font-semibold mb-4">Process Bank Response</h3>
        <div class="flex gap-4 items-center">
          <input type="file" #fileInput (change)="onFileSelected($event)" 
                 accept=".txt,.csv"
                 class="border rounded-lg px-3 py-2">
          <button (click)="uploadResponse()" 
                  [disabled]="!selectedFile || uploading"
                  class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {{ uploading ? 'Uploading...' : 'Upload Response' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class DebitOrderManagementComponent implements OnInit {
  batches: DebitOrderBatch[] = [];
  processingDate: string = '';
  creating = false;
  uploading = false;
  selectedFile?: File;

  constructor(private debitOrderService: DebitOrderService) {}

  ngOnInit(): void {
    this.loadBatches();
    this.processingDate = new Date().toISOString().split('T')[0];
  }

  loadBatches(): void {
    this.debitOrderService.getBatches().subscribe({
      next: (data) => this.batches = data,
      error: (err) => console.error('Error loading batches', err)
    });
  }

  createBatch(): void {
    this.creating = true;
    this.debitOrderService.createBatch({ processingDate: this.processingDate }).subscribe({
      next: (batch) => {
        this.batches.unshift(batch);
        this.creating = false;
        alert('Batch created successfully!');
      },
      error: (err) => {
        console.error('Error creating batch', err);
        this.creating = false;
      }
    });
  }

  generateFile(batchId: string): void {
    this.debitOrderService.generateNAEDOFile(batchId).subscribe({
      next: (blob) => {
        this.debitOrderService.downloadFile(blob, `NAEDO_${batchId}.txt`);
        this.loadBatches();
      },
      error: (err) => console.error('Error generating file', err)
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  uploadResponse(): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.debitOrderService.processResponse(this.selectedFile).subscribe({
      next: (result) => {
        alert(result.message);
        this.uploading = false;
        this.selectedFile = undefined;
        this.loadBatches();
      },
      error: (err) => {
        console.error('Error uploading response', err);
        this.uploading = false;
      }
    });
  }

  viewBatch(batchId: string): void {
    console.log('View batch:', batchId);
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    const classes: any = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Submitted': 'bg-blue-100 text-blue-800',
      'Processing': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'PartiallyCompleted': 'bg-orange-100 text-orange-800',
      'Failed': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  toDate(dateTime: any): Date | null {
    if (!dateTime) return null;
    if (dateTime.toJSDate) {
      return dateTime.toJSDate();
    }
    return dateTime;
  }
}
