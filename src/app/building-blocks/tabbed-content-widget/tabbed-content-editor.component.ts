import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabItem } from './tabbed-content-widget.component';

@Component({
  selector: 'app-tabbed-content-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tabbed-content-editor.component.html',
  styleUrls: ['./tabbed-content-editor.component.scss']
})
export class TabbedContentEditorComponent implements OnInit {
  @Input() config: any = {};
  @Output() update = new EventEmitter<any>();

  activeEditTabIndex: number = 0;

  ngOnInit() {
    if (!this.config.settings) {
      this.config.settings = {
        title: 'Our Platform Features',
        subtitle: 'Everything you need in one place',
        tabStyle: 'pills',
        orientation: 'horizontal',
        showIcons: true
      };
    }

    if (!this.config.tabs || this.config.tabs.length === 0) {
      this.config.tabs = [
        {
          id: 'tab-1',
          title: 'Website Builder',
          icon: 'globe',
          content: '<h3>Professional Website Builder</h3><p>Create stunning websites with our drag-and-drop builder. No coding required.</p><ul><li>Drag-and-drop interface</li><li>Mobile-responsive designs</li><li>Customizable templates</li></ul>'
        },
        {
          id: 'tab-2',
          title: 'Member Management',
          icon: 'people',
          content: '<h3>Complete Member Management</h3><p>Manage all your members, policies, and claims in one centralized system.</p><ul><li>Member registration portal</li><li>Policy management</li><li>Claims processing</li></ul>'
        },
        {
          id: 'tab-3',
          title: 'Analytics',
          icon: 'bar-chart',
          content: '<h3>Business Analytics</h3><p>Get insights into your business performance with real-time analytics and reporting.</p><ul><li>Real-time dashboards</li><li>Custom reports</li><li>Performance metrics</li></ul>'
        }
      ];
    }
  }

  addTab() {
    const newTab: TabItem = {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
      icon: 'star',
      content: '<p>Tab content goes here</p>'
    };
    this.config.tabs.push(newTab);
    this.activeEditTabIndex = this.config.tabs.length - 1;
  }

  removeTab(index: number) {
    this.config.tabs.splice(index, 1);
    if (this.activeEditTabIndex >= this.config.tabs.length) {
      this.activeEditTabIndex = Math.max(0, this.config.tabs.length - 1);
    }
  }

  moveTabUp(index: number) {
    if (index > 0) {
      const temp = this.config.tabs[index];
      this.config.tabs[index] = this.config.tabs[index - 1];
      this.config.tabs[index - 1] = temp;
      if (this.activeEditTabIndex === index) {
        this.activeEditTabIndex = index - 1;
      } else if (this.activeEditTabIndex === index - 1) {
        this.activeEditTabIndex = index;
      }
    }
  }

  moveTabDown(index: number) {
    if (index < this.config.tabs.length - 1) {
      const temp = this.config.tabs[index];
      this.config.tabs[index] = this.config.tabs[index + 1];
      this.config.tabs[index + 1] = temp;
      if (this.activeEditTabIndex === index) {
        this.activeEditTabIndex = index + 1;
      } else if (this.activeEditTabIndex === index + 1) {
        this.activeEditTabIndex = index;
      }
    }
  }

  setActiveEditTab(index: number) {
    this.activeEditTabIndex = index;
  }

  onSave() {
    this.update.emit(this.config.settings);
  }
}
