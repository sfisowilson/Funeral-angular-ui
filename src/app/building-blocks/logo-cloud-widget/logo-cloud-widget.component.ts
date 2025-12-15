import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LogoItem {
  name: string;
  imageUrl: string;
  link?: string;
  altText?: string;
}

export interface LogoCloudSettings {
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'centered';
  columns?: number;
  grayscale?: boolean;
  hoverColor?: boolean;
  logoSize?: 'small' | 'medium' | 'large';
}

@Component({
  selector: 'app-logo-cloud-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo-cloud-widget.component.html',
  styleUrls: ['./logo-cloud-widget.component.scss']
})
export class LogoCloudWidgetComponent {
  @Input() config: any = {};

  get title(): string {
    return this.config.settings?.title || '';
  }

  get subtitle(): string {
    return this.config.settings?.subtitle || '';
  }

  get logos(): LogoItem[] {
    return this.config.logos || [];
  }

  get settings(): LogoCloudSettings {
    return this.config.settings || {};
  }

  get layout(): string {
    return this.settings.layout || 'grid';
  }

  get columns(): number {
    return this.settings.columns || 4;
  }

  get grayscale(): boolean {
    return this.settings.grayscale !== false;
  }

  get hoverColor(): boolean {
    return this.settings.hoverColor !== false;
  }

  get logoSize(): string {
    return this.settings.logoSize || 'medium';
  }

  get columnClass(): string {
    const colMap: { [key: number]: string } = {
      3: 'col-md-4',
      4: 'col-md-3',
      5: 'col-lg-2 col-md-4',
      6: 'col-lg-2 col-md-3'
    };
    return colMap[this.columns] || 'col-md-3';
  }
}
