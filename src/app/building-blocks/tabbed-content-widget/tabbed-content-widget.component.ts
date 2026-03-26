import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { hexToRgba } from '../widget-color.utils';

export interface TabItem {
    id: string;
    title: string;
    icon?: string;
    content: string;
}

export interface TabbedContentSettings {
    title?: string;
    subtitle?: string;
    tabStyle?: 'pills' | 'underline' | 'buttons';
    orientation?: 'horizontal' | 'vertical';
    showIcons?: boolean;
}

@Component({
    selector: 'app-tabbed-content-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './tabbed-content-widget.component.html',
    styleUrls: ['./tabbed-content-widget.component.scss']
})
export class TabbedContentWidgetComponent {
    @Input() config: any = {};

    activeTabId: string = '';

    ngOnInit() {
        if (this.tabs.length > 0 && !this.activeTabId) {
            this.activeTabId = this.tabs[0].id;
        }
    }

    get title(): string {
        return this.config.settings?.title || '';
    }

    get subtitle(): string {
        return this.config.settings?.subtitle || '';
    }

    get backgroundColor(): string { return hexToRgba(this.config.settings?.backgroundColor || '#ffffff', this.config.settings?.backgroundOpacity ?? 1); }
    get titleColor(): string { return this.config.settings?.titleColor || '#1a1a1a'; }
    get subtitleColor(): string { return this.config.settings?.subtitleColor || '#6c757d'; }
    get tabActiveBackgroundColor(): string { return hexToRgba(this.config.settings?.tabActiveBackgroundColor || '#0d6efd', this.config.settings?.tabActiveBackgroundOpacity ?? 1); }
    get tabActiveTextColor(): string { return this.config.settings?.tabActiveTextColor || '#ffffff'; }
    get tabInactiveBackgroundColor(): string { return hexToRgba(this.config.settings?.tabInactiveBackgroundColor || 'transparent', this.config.settings?.tabInactiveBackgroundOpacity ?? 1); }
    get tabInactiveTextColor(): string { return this.config.settings?.tabInactiveTextColor || '#495057'; }
    get contentBackgroundColor(): string { return hexToRgba(this.config.settings?.contentBackgroundColor || '#ffffff', this.config.settings?.contentBackgroundOpacity ?? 1); }
    get contentTextColor(): string { return this.config.settings?.contentTextColor || '#212529'; }

    get tabs(): TabItem[] {
        return this.config.tabs || [];
    }

    get settings(): TabbedContentSettings {
        return this.config.settings || {};
    }

    get tabStyle(): string {
        return this.settings.tabStyle || 'pills';
    }

    get orientation(): string {
        return this.settings.orientation || 'horizontal';
    }

    get showIcons(): boolean {
        return this.settings.showIcons !== false;
    }

    get activeTab(): TabItem | undefined {
        return this.tabs.find((tab) => tab.id === this.activeTabId);
    }

    setActiveTab(tabId: string) {
        this.activeTabId = tabId;
    }

    isActive(tabId: string): boolean {
        return this.activeTabId === tabId;
    }
}
