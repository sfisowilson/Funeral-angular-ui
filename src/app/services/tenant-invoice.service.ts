import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { unwrap } from '../core/services/response-unwrapper';
import { Tenant_invoiceServiceProxy, InvoiceDto } from '../core/services/service-proxies';

// Re-export DTOs for backward compatibility
export { InvoiceDto as TenantInvoice } from '../core/services/service-proxies';

export interface InvoiceSummary {
    totalInvoices: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    unpaidCount: number;
    overdueCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class TenantInvoiceService {
    constructor(private proxy: Tenant_invoiceServiceProxy) {}

    getMyInvoices(status?: string, page: number = 1, pageSize: number = 20): Observable<InvoiceDto[]> {
        return this.proxy.invoiceList(status, page, pageSize).pipe(unwrap<InvoiceDto[]>());
    }

    getInvoiceById(invoiceId: string): Observable<InvoiceDto> {
        return this.proxy.invoiceById(invoiceId).pipe(unwrap<InvoiceDto>());
    }

    getUnpaidInvoices(): Observable<InvoiceDto[]> {
        return this.proxy.invoiceUnpaid().pipe(unwrap<InvoiceDto[]>());
    }

    getInvoiceSummary(): Observable<InvoiceSummary> {
        return this.proxy.invoiceSummary().pipe(unwrap<InvoiceSummary>());
    }

    getAllTenantInvoices(tenantId?: string, status?: string, page: number = 1, pageSize: number = 20): Observable<any[]> {
        return this.proxy.invoiceAll(tenantId, status, page, pageSize).pipe(unwrap<any[]>());
    }
}
