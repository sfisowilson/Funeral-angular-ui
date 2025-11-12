import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { WidgetConfig } from '../widget-config';
import { PolicyDto, PolicyServiceProxy } from '../../core/services/service-proxies';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';

@Component({
    selector: 'app-policy-comparison-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './policy-comparison-widget.component.html',
    styleUrls: ['./policy-comparison-widget.component.scss'],
    providers: [PolicyServiceProxy, TenantSettingsService]
})
export class PolicyComparisonWidgetComponent implements OnInit {
    @Input() config!: WidgetConfig;
    allPolicies: PolicyDto[] = [];
    policiesToCompare: PolicyDto[] = [];
    currency: string = 'ZAR';

    constructor(
        private policyService: PolicyServiceProxy,
        private tenantSettingsService: TenantSettingsService
    ) {}

    ngOnInit(): void {
        this.loadPolicies();
        this.loadCurrency();
    }

    loadPolicies(): void {
        this.policyService.policy_GetAllPolicies(undefined, undefined, undefined, undefined, undefined).subscribe((policies) => {
            this.allPolicies = policies;
            this.filterPolicies();
        });
    }

    loadCurrency(): void {
        this.tenantSettingsService.loadSettings().then(() => {
            const settings = this.tenantSettingsService.getSettings();
            if (settings && settings.currency) {
                this.currency = settings.currency;
            }
        });
    }

    filterPolicies(): void {
        if (this.config.settings && this.config.settings.policyIds && this.allPolicies.length > 0) {
            this.policiesToCompare = this.allPolicies.filter((policy) => this.config.settings.policyIds.includes(policy.id));
        } else {
            this.policiesToCompare = [];
        }
    }
}
