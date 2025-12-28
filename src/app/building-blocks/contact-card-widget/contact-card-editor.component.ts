import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactCardConfig, ContactMethod } from './contact-card-widget.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-contact-card-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-card-editor.component.html',
  styleUrl: './contact-card-editor.component.scss'
})
export class ContactCardEditorComponent implements OnInit {
    @Output() update = new EventEmitter<ContactCardConfig>();
    @Input() config: any = {
    title: '',
    subtitle: '',
    contactMethods: [],
      settings: {
        showMap: false,
        mapEmbedUrl: '',
        layout: 'single',
        backgroundColor: 'var(--surface-ground, #f8f9fa)',
        iconColor: 'var(--primary-color, #007bff)'
      }
  };
  @Output() configChange = new EventEmitter<ContactCardConfig>();

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (!this.config.title) {
      this.config.title = 'Get In Touch';
    }
    if (!this.config.subtitle) {
      this.config.subtitle = 'We\'re here to help. Reach out to us through any of these channels.';
    }
    if (!this.config.contactMethods || this.config.contactMethods.length === 0) {
      this.config.contactMethods = [
        {
          type: 'phone',
          icon: 'bi-telephone-fill',
          label: 'Phone',
          value: '+27 11 123 4567',
          link: ''
        },
        {
          type: 'email',
          icon: 'bi-envelope-fill',
          label: 'Email',
          value: 'support@funeral.com',
          link: ''
        },
        {
          type: 'whatsapp',
          icon: 'bi-whatsapp',
          label: 'WhatsApp',
          value: '+27 82 123 4567',
          link: ''
        },
        {
          type: 'address',
          icon: 'bi-geo-alt-fill',
          label: 'Address',
          value: '123 Main Street, Johannesburg, 2001',
          link: ''
        },
        {
          type: 'hours',
          icon: 'bi-clock-fill',
          label: 'Business Hours',
          value: 'Monday - Friday: 8:00 AM - 5:00 PM',
          link: ''
        }
      ];
    }
    if (!this.config.settings) {
      this.config.settings = {
        showMap: false,
        mapEmbedUrl: '',
        layout: 'single',
        backgroundColor: 'var(--surface-ground, #f8f9fa)',
        iconColor: 'var(--primary-color, #007bff)'
      };
    }
    this.emitChange();
  }

  emitChange() {
    this.configChange.emit(this.config);
  }

  addContactMethod() {
    this.config.contactMethods.push({
      type: 'custom',
      icon: 'bi-info-circle-fill',
      label: 'New Contact',
      value: 'Contact information',
      link: ''
    });
    this.emitChange();
  }

  removeContactMethod(index: number) {
    this.config.contactMethods.splice(index, 1);
    this.emitChange();
  }

  moveContactMethodUp(index: number) {
    if (index > 0) {
      const temp = this.config.contactMethods[index];
      this.config.contactMethods[index] = this.config.contactMethods[index - 1];
      this.config.contactMethods[index - 1] = temp;
      this.emitChange();
    }
  }

  moveContactMethodDown(index: number) {
    if (index < this.config.contactMethods.length - 1) {
      const temp = this.config.contactMethods[index];
      this.config.contactMethods[index] = this.config.contactMethods[index + 1];
      this.config.contactMethods[index + 1] = temp;
      this.emitChange();
    }
  }

  onTypeChange(method: ContactMethod) {
    // Update icon based on type
    const iconMap: { [key: string]: string } = {
      phone: 'bi-telephone-fill',
      email: 'bi-envelope-fill',
      address: 'bi-geo-alt-fill',
      whatsapp: 'bi-whatsapp',
      hours: 'bi-clock-fill',
      custom: 'bi-info-circle-fill'
    };
    method.icon = iconMap[method.type] || 'bi-info-circle-fill';
    this.emitChange();
  }

  getSafeMapUrl(): SafeResourceUrl | null {
    if (this.config.settings.mapEmbedUrl) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(this.config.settings.mapEmbedUrl);
    }
    return null;
  }

  
  onSave() {
    this.update.emit(this.config.settings);
  }
}
