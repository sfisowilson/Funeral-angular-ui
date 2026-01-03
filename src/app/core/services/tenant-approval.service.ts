import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TenantApprovalServiceProxy, TenantApprovalListDto, TenantApprovalDetailDto, ApproveTenantDto, RejectTenantDto, RequestTenantChangeDto, TenantApprovalStatus } from './service-proxies';

// Re-export for backward compatibility
export { TenantApprovalStatus, TenantApprovalListDto, TenantApprovalDetailDto, ApproveTenantDto, RejectTenantDto, RequestTenantChangeDto };

@Injectable({
    providedIn: 'root'
})
export class TenantApprovalService {
    constructor(private proxy: TenantApprovalServiceProxy) {}

    getPendingTenants(): Observable<TenantApprovalListDto[]> {
        return this.proxy.tenantApproval_GetPendingTenants();
    }

    getAllTenantRequests(): Observable<TenantApprovalListDto[]> {
        return this.proxy.tenantApproval_GetAllTenantRequests();
    }

    getTenantDetail(tenantId: string): Observable<TenantApprovalDetailDto> {
        return this.proxy.tenantApproval_GetTenantDetail(tenantId);
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
