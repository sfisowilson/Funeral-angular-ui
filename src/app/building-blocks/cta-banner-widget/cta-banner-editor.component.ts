import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CTABannerConfig, CTAButton } from './cta-banner-widget.component';

@Component({
  selector: 'app-cta-banner-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cta-banner-editor.component.html',
  styleUrl: './cta-banner-editor.component.scss'
})
export class CTABannerEditorComponent implements OnInit {
  @Input() config: CTABannerConfig = {
    headline: '',
    subheadline: '',
    buttons: [],
    settings: {
      backgroundType: 'gradient',
      backgroundColor: '#007bff',
      gradientStart: '#007bff',
      gradientEnd: '#0056b3',
      overlayOpacity: 0.5,
      textColor: 'light',
      alignment: 'center',
      paddingSize: 'large'
    }
  };
  @Output() configChange = new EventEmitter<CTABannerConfig>();

  ngOnInit() {
    if (!this.config.headline) {
      this.config.headline = 'Ready to Transform Your Business?';
    }
    if (!this.config.subheadline) {
      this.config.subheadline = 'Join hundreds of funeral service providers who have modernized their operations with our platform.';
    }
    if (!this.config.buttons || this.config.buttons.length === 0) {
      this.config.buttons = [
        {
          text: 'Start Free Trial',
          link: '#trial',
          isPrimary: true
        },
        {
          text: 'Schedule Demo',
          link: '#demo',
          isPrimary: false
        }
      ];
    }
    if (!this.config.settings) {
      this.config.settings = {
        backgroundType: 'gradient',
        backgroundColor: '#007bff',
        gradientStart: '#007bff',
        gradientEnd: '#0056b3',
        overlayOpacity: 0.5,
        textColor: 'light',
        alignment: 'center',
        paddingSize: 'large'
      };
    }
    this.emitChange();
  }

  emitChange() {
    this.configChange.emit(this.config);
  }

  addButton() {
    this.config.buttons.push({
      text: 'New Button',
      link: '#',
      isPrimary: false
    });
    this.emitChange();
  }

  removeButton(index: number) {
    this.config.buttons.splice(index, 1);
    this.emitChange();
  }

  moveButtonUp(index: number) {
    if (index > 0) {
      const temp = this.config.buttons[index];
      this.config.buttons[index] = this.config.buttons[index - 1];
      this.config.buttons[index - 1] = temp;
      this.emitChange();
    }
  }

  moveButtonDown(index: number) {
    if (index < this.config.buttons.length - 1) {
      const temp = this.config.buttons[index];
      this.config.buttons[index] = this.config.buttons[index + 1];
      this.config.buttons[index + 1] = temp;
      this.emitChange();
    }
  }
}
