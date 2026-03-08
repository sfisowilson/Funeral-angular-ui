import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { unwrap } from '../core/services/response-unwrapper';
import { BatchServiceProxy, Debit_orderServiceProxy, DebitOrderBatchDto, DebitOrderTransactionDto, FileParameter } from '../core/services/service-proxies';

// Re-export DTOs for backward compatibility
export { DebitOrderBatchDto as DebitOrderBatch, DebitOrderTransactionDto as DebitOrderTransaction } from '../core/services/service-proxies';

export interface CreateBatchRequest {
    processingDate: string;
}

@Injectable({
    providedIn: 'root'
})
export class DebitOrderService {
    private apiUrl = `${environment.apiUrl}/debit-order`;
    private http: HttpClient;

    constructor(
        private proxy: Debit_orderServiceProxy,
        private batchProxy: BatchServiceProxy,
        http: HttpClient
    ) {
        this.http = http;
    }

    createBatch(request: CreateBatchRequest): Observable<DebitOrderBatchDto> {
        return this.batchProxy.create(request as any).pipe(unwrap<DebitOrderBatchDto>());
    }

    getBatches(page: number = 1, pageSize: number = 20): Observable<DebitOrderBatchDto[]> {
        return this.proxy.batchList(page, pageSize).pipe(unwrap<DebitOrderBatchDto[]>());
    }

    getBatchById(batchId: string): Observable<DebitOrderBatchDto> {
        return this.proxy.batchById(batchId).pipe(unwrap<DebitOrderBatchDto>());
    }

    getBatchTransactions(batchId: string): Observable<DebitOrderTransactionDto[]> {
        return this.proxy.batchTransactions(batchId).pipe(unwrap<DebitOrderTransactionDto[]>());
    }

    // NOTE: generateNAEDOFile() returns File, not available in proxy - using direct HTTP call
    generateNAEDOFile(batchId: string): Observable<Blob> {
        return this.http.post(
            `${this.apiUrl}/batch/${batchId}/generate-file`,
            {},
            {
                responseType: 'blob'
            }
        );
    }

    processResponse(file: File): Observable<{ message: string }> {
        const fileParameter: FileParameter = {
            data: file,
            fileName: file.name
        };
        return this.batchProxy.processResponse(fileParameter).pipe(unwrap<{ message: string }>());
    }

    downloadFile(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}
