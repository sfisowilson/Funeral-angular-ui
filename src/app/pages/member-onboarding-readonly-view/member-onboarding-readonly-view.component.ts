import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError, first, switchMap } from 'rxjs/operators';

import { MemberContextService } from '../../core/services/member-context.service';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import {
    MemberApprovalDetailDto,
    MemberApprovalServiceProxy,
    MemberDto,
    MemberDynamicTableDto,
    OnboardingContractDto,
    OnboardingContractServiceProxy,
    OnboardingFieldConfigurationServiceProxy,
    MemberServiceProxy
} from '../../core/services/service-proxies';
import { OnboardingStepConfigurationClient } from '../../core/services/onboarding-step-configuration.client';
import { environment } from '../../../environments/environment';

interface MemberOnboardingDataDto {
    memberId: string;
    tenantId: string;
    fieldValues: { [key: string]: string };
    submittedAt?: string;
}

interface LegacyField {
    label: string;
    value: string;
}

@Component({
    selector: 'app-member-onboarding-readonly-view',
    standalone: true,
    imports: [CommonModule, CardModule, TabViewModule, ProgressSpinnerModule],
    providers: [MemberContextService, TenantSettingsService],
    templateUrl: './member-onboarding-readonly-view.component.html',
    styleUrl: './member-onboarding-readonly-view.component.scss'
})
export class MemberOnboardingReadonlyViewComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);

    member: MemberDto | null = null;
    memberNumberLabel = 'Member Number';

    loadingMember = false;
    loadingOnboarding = false;
    loadingPdf = false;
    errorMessage = '';

    legacyFields: LegacyField[] = [];
    dynamicTables: MemberDynamicTableDto[] = [];
    submittedAt?: string;
    isViewMode = false;

    pdfErrorMessage = '';
    pdfDisplayUrl: SafeResourceUrl | null = null;
    private pdfObjectUrl: string | null = null;
    pdfTitle = '';
    pdfSubtitle = '';
    hasSignedPdf = false;

    constructor(
        private memberContext: MemberContextService,
        private memberService: MemberServiceProxy,
        private fieldConfigService: OnboardingFieldConfigurationServiceProxy,
        private tenantSettingsService: TenantSettingsService,
        private memberApprovalService: MemberApprovalServiceProxy,
        private contractService: OnboardingContractServiceProxy,
        private onboardingStepClient: OnboardingStepConfigurationClient,
        private http: HttpClient,
        private sanitizer: DomSanitizer
    ) {}

    ngOnDestroy(): void {
        this.clearPdfObjectUrl();
    }

    ngOnInit(): void {
        this.loadMemberNumberLabel();
        this.resolveMemberAndLoadData();
    }

    private loadMemberNumberLabel(): void {
        try {
            this.memberNumberLabel = this.tenantSettingsService.getMemberNumberLabel();
        } catch (error) {
            console.error('Error getting member number label from tenant settings:', error);
            this.memberNumberLabel = 'Member Number';
        }
    }

    private resolveMemberAndLoadData(): void {
        this.loadingMember = true;
        this.errorMessage = '';

        this.route.queryParamMap
            .pipe(
                first(),
                switchMap((params) => {
                    this.isViewMode = params.get('view') === 'true';
                    const memberIdFromQuery = params.get('memberId');
                    if (memberIdFromQuery) {
                        return of(memberIdFromQuery);
                    }

                    // Fallback to current logged-in member ("My Onboarding" scenario)
                    return this.memberContext.getCurrentMember$().pipe(
                        first(),
                        switchMap((member) => {
                            if (!member || !member.id) {
                                this.errorMessage = 'No member found for onboarding summary.';
                                return of(null as string | null);
                            }
                            this.member = member;
                            return of(member.id as string);
                        })
                    );
                })
            )
            .subscribe({
                next: (memberId) => {
                    if (!memberId) {
                        this.loadingMember = false;
                        return;
                    }

                    const hasExplicitMemberId = !!this.route.snapshot.queryParamMap.get('memberId');

                    if (!hasExplicitMemberId) {
                        this.loadingMember = false;
                        this.loadOnboardingData(memberId, false);
                        return;
                    }

                    // Ensure we have full member details
                    this.memberService
                        .member_GetById(memberId)
                        .pipe(first())
                        .subscribe({
                            next: (resp) => {
                                this.member = (resp as any)?.result || null;
                                this.loadingMember = false;
                                this.loadOnboardingData(memberId, true);
                            },
                            error: (err) => {
                                console.error('Error loading member for onboarding view:', err);
                                this.errorMessage = 'Failed to load member information.';
                                this.loadingMember = false;
                            }
                        });
                },
                error: (err) => {
                    console.error('Error resolving member for onboarding view:', err);
                    this.errorMessage = 'Failed to resolve member for onboarding view.';
                    this.loadingMember = false;
                }
            });
    }

    private loadOnboardingData(memberId: string, useMemberIdLookup: boolean): void {
        this.loadingOnboarding = true;
        this.loadingPdf = true;
        this.errorMessage = '';
        this.pdfErrorMessage = '';
        this.legacyFields = [];
        this.dynamicTables = [];
        this.submittedAt = undefined;
        this.clearPdfObjectUrl();

        const fieldData$ = (useMemberIdLookup
            ? this.fieldConfigService.onboardingFieldConfiguration_GetMemberDataById(memberId)
            : this.fieldConfigService.onboardingFieldConfiguration_GetMemberData()
        ).pipe(
            first(),
            catchError((err) => {
                console.error('Error loading member onboarding data:', err);
                return of(null as any);
            })
        );

        const memberDetail$ = this.memberApprovalService.memberApproval_GetMemberDetail(memberId).pipe(
            first(),
            catchError((err) => {
                console.error('Error loading member dynamic onboarding detail:', err);
                return of(null as any);
            })
        );

        const contracts$ = this.contractService.contractsByMember(memberId).pipe(
            first(),
            catchError((err) => {
                console.error('Error loading member contracts:', err);
                return of(null as any);
            })
        );

        const enabledSteps$ = this.onboardingStepClient.getEnabledSteps().pipe(
            first(),
            catchError((err) => {
                console.error('Error loading onboarding step config:', err);
                return of([] as any[]);
            })
        );

        forkJoin({
            fieldData: fieldData$,
            memberDetail: memberDetail$,
            contracts: contracts$,
            enabledSteps: enabledSteps$
        }).subscribe({
            next: ({ fieldData, memberDetail, contracts, enabledSteps }) => {
                try {
                    const dto = (fieldData as any)?.result as MemberOnboardingDataDto | null;
                    const detail = (memberDetail as any)?.result as MemberApprovalDetailDto | null;
                    const contractList = ((contracts as any)?.result as OnboardingContractDto[]) || [];

                    this.buildLegacyFields(dto, detail);
                    this.buildDynamicTables(detail, enabledSteps || []);
                    this.resolvePdf(memberId, contractList);
                } catch (err) {
                    console.error('Error building onboarding readonly view:', err);
                    this.errorMessage = 'Failed to build onboarding summary.';
                    this.loadingPdf = false;
                } finally {
                    this.loadingOnboarding = false;
                }
            },
            error: (err) => {
                console.error('Error loading onboarding readonly payload:', err);
                this.errorMessage = 'Failed to load onboarding data.';
                this.loadingOnboarding = false;
                this.loadingPdf = false;
            }
        });
    }

    private buildLegacyFields(dto: MemberOnboardingDataDto | null, detail: MemberApprovalDetailDto | null): void {
        this.submittedAt = dto?.submittedAt ? this.dateTimeToIso(dto.submittedAt as any) : undefined;

        const byKey = new Map<string, LegacyField>();
        const fieldValues = dto?.fieldValues || {};

        Object.entries(fieldValues)
            .filter(([key]) => !!key)
            .forEach(([key, value]) => {
                byKey.set(this.normalizeKey(key), {
                    label: this.toDisplayLabel(key),
                    value: value || ''
                });
            });

        (detail?.customFields || []).forEach((field) => {
            const key = field.fieldKey || field.fieldLabel || '';
            if (!key) {
                return;
            }

            byKey.set(this.normalizeKey(key), {
                label: field.fieldLabel || this.toDisplayLabel(field.fieldKey || ''),
                value: field.fieldValue || ''
            });
        });

        this.legacyFields = Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    private buildDynamicTables(detail: MemberApprovalDetailDto | null, enabledSteps: Array<{ dynamicEntityTypeKey?: string | null }>): void {
        const onboardingDynamicKeys = enabledSteps
            .map((step) => (step.dynamicEntityTypeKey || '').trim())
            .filter((key) => !!key);

        const tables = detail?.dynamicTables || [];
        if (!onboardingDynamicKeys.length) {
            this.dynamicTables = tables;
            return;
        }

        this.dynamicTables = tables.filter((table) => this.matchesOnboardingEntity(table.entityName || '', onboardingDynamicKeys));
    }

    private resolvePdf(memberId: string, contracts: OnboardingContractDto[]): void {
        const sortedContracts = [...contracts].sort((a, b) => {
            const aMs = this.dateToMs(a.signedAt as any);
            const bMs = this.dateToMs(b.signedAt as any);
            return bMs - aMs;
        });

        const signedContract = sortedContracts.find((contract) => !!contract.signedPdfPath || !!contract.signedAt);

        if (signedContract?.id) {
            this.hasSignedPdf = true;
            this.pdfTitle = 'Completed & Signed PDF';
            this.pdfSubtitle = signedContract.signedAt
                ? `Signed on ${this.dateTimeToIso(signedContract.signedAt as any)}`
                : 'Signed contract available';
            this.fetchPdfBlob(`${environment.apiUrl}/api/OnboardingContract/contract-download/${signedContract.id}`);
            return;
        }

        const latestContract = sortedContracts[0];
        if (latestContract?.id) {
            this.hasSignedPdf = false;
            this.pdfTitle = 'Generated PDF Preview';
            this.pdfSubtitle = 'No signed contract found. Showing latest generated contract.';
            this.fetchPdfBlob(`${environment.apiUrl}/api/OnboardingContract/contract-download/${latestContract.id}`);
            return;
        }

        this.hasSignedPdf = false;
        this.pdfTitle = 'Generated PDF Preview';
        this.pdfSubtitle = 'No signed contract found. Showing generated onboarding PDF.';
        this.fetchPdfBlob(`${environment.apiUrl}/api/OnboardingPdf/OnboardingPdf_PreviewPdf?memberId=${memberId}`);
    }

    private fetchPdfBlob(url: string): void {
        this.loadingPdf = true;
        this.pdfErrorMessage = '';

        this.http.get(url, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                this.clearPdfObjectUrl();
                this.pdfObjectUrl = URL.createObjectURL(blob);
                this.pdfDisplayUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl);
                this.loadingPdf = false;
            },
            error: (error) => {
                console.error('Error loading onboarding PDF:', error);
                this.pdfErrorMessage = 'Failed to load onboarding PDF.';
                this.loadingPdf = false;
            }
        });
    }

    private clearPdfObjectUrl(): void {
        if (this.pdfObjectUrl) {
            URL.revokeObjectURL(this.pdfObjectUrl);
            this.pdfObjectUrl = null;
        }
        this.pdfDisplayUrl = null;
    }

    openPdfInNewTab(): void {
        if (!this.pdfObjectUrl) {
            return;
        }

        window.open(this.pdfObjectUrl, '_blank');
    }

    private normalizeKey(value: string): string {
        return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    private matchesOnboardingEntity(entityName: string, dynamicEntityKeys: string[]): boolean {
        const entityNormalized = this.normalizeKey(entityName);
        return dynamicEntityKeys.some((key) => {
            const keyNormalized = this.normalizeKey(key);
            return entityNormalized === keyNormalized || entityNormalized.includes(keyNormalized) || keyNormalized.includes(entityNormalized);
        });
    }

    private dateToMs(value: any): number {
        if (!value) {
            return 0;
        }

        if (typeof value.toMillis === 'function') {
            return value.toMillis();
        }

        const parsed = new Date(value).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private dateTimeToIso(value: any): string {
        if (!value) {
            return '';
        }

        if (typeof value.toISO === 'function') {
            return value.toISO() || '';
        }

        return String(value);
    }

    private toDisplayLabel(key: string): string {
        return key
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    get memberDisplayName(): string {
        if (!this.member) {
            return '';
        }
        // Prefer explicit name if available
        return (this.member as any).name || `${(this.member as any).firstNames || ''} ${(this.member as any).surname || ''}`.trim();
    }

    get memberNumber(): string {
        if (!this.member) {
            return '';
        }
        const m: any = this.member;
        return m.memberNumber || m.id || '';
    }
}
