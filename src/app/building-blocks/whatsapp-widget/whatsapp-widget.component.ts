import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetConfig } from '../widget-config';

@Component({
  selector: 'app-whatsapp-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-widget.component.html',
  styleUrl: './whatsapp-widget.component.css'
})
export class WhatsappWidgetComponent implements OnInit {
  @Input() config!: WidgetConfig;

  get settings(): any {
    if (!this.config.settings) {
      this.config.settings = {};
    }
    return this.config.settings;
  }

  isExpanded = false;
  isMobile = false;

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  openWhatsApp(): void {
    const phoneNumber = this.settings.phoneNumber?.replace(/\D/g, '');
    const message = encodeURIComponent(this.settings.defaultMessage || 'Hi, I would like to get in touch.');
    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
  }

  getContainerStyles(): any {
    return {
      'position': 'fixed',
      'bottom': this.settings.bottomPosition + 'px',
      [this.settings.position]: this.settings.sidePosition + 'px',
      'z-index': this.settings.zIndex || 1000,
      'pointer-events': 'auto'
    };
  }

  getButtonStyles(): any {
    return {
      'background-color': this.settings.buttonColor,
      'width': this.settings.buttonSize + 'px',
      'height': this.settings.buttonSize + 'px',
      'border-radius': this.settings.borderRadius + '%'
    };
  }

  getExpandedBoxStyles(): any {
    return {
      'background-color': this.settings.expandedBackgroundColor,
      'color': this.settings.expandedTextColor
    };
  }

  getHeaderStyles(): any {
    return {
      'background-color': this.settings.headerBackgroundColor,
      'color': this.settings.headerTextColor
    };
  }

  getActionButtonStyles(): any {
    return {
      'background-color': this.settings.buttonColor,
      'color': 'var(--primary-contrast-color, #ffffff)'
    };
  }
}
