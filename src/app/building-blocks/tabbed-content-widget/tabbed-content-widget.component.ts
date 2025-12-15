import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    return this.tabs.find(tab => tab.id === this.activeTabId);
  }

  setActiveTab(tabId: string) {
    this.activeTabId = tabId;
  }

  isActive(tabId: string): boolean {
    return this.activeTabId === tabId;
  }
}
