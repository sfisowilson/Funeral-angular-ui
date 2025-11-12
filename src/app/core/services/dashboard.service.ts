import { Injectable, signal } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ClaimServiceProxy, MemberServiceProxy, PolicyServiceProxy, ClaimDto, MemberDto, PolicyDto } from './service-proxies';

export interface DashboardStats {
    totalMembers: number;
    totalPolicies: number;
    totalClaims: number;
    totalClaimAmount: number;
    pendingClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    monthlyRevenue: number;
    recentClaims: ClaimDto[];
    recentMembers: MemberDto[];
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    constructor(
        private claimService: ClaimServiceProxy,
        private memberService: MemberServiceProxy,
        private policyService: PolicyServiceProxy
    ) {}

    getDashboardData(): Observable<DashboardStats> {
        return forkJoin({
            claims: this.claimService.claim_GetAllClaims(undefined, undefined, undefined, undefined, undefined),
            members: this.memberService.member_GetAllMembers(undefined, undefined, undefined, undefined, undefined),
            policies: this.policyService.policy_GetAllPolicies(undefined, undefined, undefined, undefined, undefined)
        }).pipe(
            map(({ claims, members, policies }) => {
                const pendingClaims = claims.filter((c) => c.status === 'Pending').length;
                const approvedClaims = claims.filter((c) => c.status === 'Approved' || c.status === 'Paid').length;
                const rejectedClaims = claims.filter((c) => c.status === 'Rejected').length;
                const totalClaimAmount = claims.reduce((sum, claim) => sum + (claim.claimAmount || 0), 0);

                // Get recent items (last 5)
                const recentClaims = [...claims]
                    .sort((a, b) => {
                        const dateA = a.claimDate ? new Date(a.claimDate.toString()).getTime() : 0;
                        const dateB = b.claimDate ? new Date(b.claimDate.toString()).getTime() : 0;
                        return dateB - dateA;
                    })
                    .slice(0, 5);

                const recentMembers = [...members]
                    .sort((a, b) => {
                        // Since createdAt might not exist, use id as a proxy for recent (higher id = more recent)
                        const idA = typeof a.id === 'number' ? a.id : 0;
                        const idB = typeof b.id === 'number' ? b.id : 0;
                        return idB - idA;
                    })
                    .slice(0, 5);

                // Calculate monthly revenue (this is simplified - in reality you'd have proper financial data)
                const monthlyRevenue = policies.reduce((sum, policy) => sum + (policy.payoutAmount || 0), 0) * 0.1; // Assume 10% monthly premium

                return {
                    totalMembers: members.length,
                    totalPolicies: policies.length,
                    totalClaims: claims.length,
                    totalClaimAmount,
                    pendingClaims,
                    approvedClaims,
                    rejectedClaims,
                    monthlyRevenue,
                    recentClaims,
                    recentMembers
                } as DashboardStats;
            })
        );
    }
}
