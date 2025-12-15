import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum TenantApprovalStatus {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    ChangeRequested = 3
}

export interface TenantApprovalListDto {
    id: string;
    name: string;
    domain: string;
    email: string;
    phone1?: string;
    registrationNumber?: string;
    address?: string;
    approvalStatus: TenantApprovalStatus;
    createdAt: Date;
    rejectionReason?: string;
    changeRequestReason?: string;
}

export interface TenantApprovalDetailDto {
    id: string;
    name: string;
    domain: string;
    email: string;
    address?: string;
    phone1?: string;
    phone2?: string;
    registrationNumber?: string;
    type?: string;
    approvalStatus: TenantApprovalStatus;
    rejectionReason?: string;
    changeRequestReason?: string;
    createdAt: Date;
    reviewedAt?: Date;
    reviewedByName?: string;
}

export interface ApproveTenantDto {
    tenantId: string;
}

export interface RejectTenantDto {
    tenantId: string;
    rejectionReason: string;
}

export interface RequestTenantChangeDto {
    tenantId: string;
    changeRequestReason: string;
}

@Injectable({
    providedIn: 'root'
})
export class TenantApprovalService {
    private readonly apiUrl = `${environment.apiUrl}/api/TenantApproval`;

    constructor(private http: HttpClient) {}

    getPendingTenants(): Observable<TenantApprovalListDto[]> {
        return this.http.get<TenantApprovalListDto[]>(`${this.apiUrl}/TenantApproval_GetPendingTenants`);
    }

    getAllTenantRequests(): Observable<TenantApprovalListDto[]> {
        return this.http.get<TenantApprovalListDto[]>(`${this.apiUrl}/TenantApproval_GetAllTenantRequests`);
    }

    getTenantDetail(tenantId: string): Observable<TenantApprovalDetailDto> {
        return this.http.get<TenantApprovalDetailDto>(`${this.apiUrl}/TenantApproval_GetTenantDetail/${tenantId}`);
    }

    approveTenant(dto: ApproveTenantDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/TenantApproval_ApproveTenant`, dto);
    }

    rejectTenant(dto: RejectTenantDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/TenantApproval_RejectTenant`, dto);
    }

    requestChange(dto: RequestTenantChangeDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/TenantApproval_RequestChange`, dto);
    }
}
