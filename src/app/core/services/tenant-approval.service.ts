import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TenantApprovalServiceProxy, TenantApprovalListDto, TenantApprovalDetailDto, ApproveTenantDto, RejectTenantDto, RequestTenantChangeDto, TenantApprovalStatus } from './service-proxies';

// Re-export for backward compatibility
export { TenantApprovalStatus, TenantApprovalListDto, TenantApprovalDetailDto, ApproveTenantDto, RejectTenantDto, RequestTenantChangeDto };

@Injectable({
    providedIn: 'root'
})
export class TenantApprovalService {
    constructor(private proxy: TenantApprovalServiceProxy) {}

    getPendingTenants(): Observable<TenantApprovalListDto[]> {
        return this.proxy.tenantApproval_GetPendingTenants().pipe(
            map((response: any) => response.data || response)
        );
    }

    getAllTenantRequests(): Observable<TenantApprovalListDto[]> {
        return this.proxy.tenantApproval_GetAllTenantRequests().pipe(
            map((response: any) => response.data || response)
        );
    }

    getTenantDetail(tenantId: string): Observable<TenantApprovalDetailDto> {
        return this.proxy.tenantApproval_GetTenantDetail(tenantId).pipe(
            map((response: any) => response.data || response)
        );
    }

    approveTenant(dto: ApproveTenantDto): Observable<any> {
        return this.proxy.tenantApproval_ApproveTenant(dto);
    }

    rejectTenant(dto: RejectTenantDto): Observable<any> {
        return this.proxy.tenantApproval_RejectTenant(dto);
    }

    requestChange(dto: RequestTenantChangeDto): Observable<any> {
        return this.proxy.tenantApproval_RequestChange(dto);
    }
}
