import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccordionItem } from './enhanced-accordion-widget.component';

@Component({
  selector: 'app-enhanced-accordion-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enhanced-accordion-editor.component.html',
  styleUrls: ['./enhanced-accordion-editor.component.scss']
})
export class EnhancedAccordionEditorComponent implements OnInit {
  @Output() update = new EventEmitter<any>();

  @Input() config: any = {};

  ngOnInit() {
    if (!this.config.settings) {
      this.config.settings = {
        title: 'Frequently Asked Questions',
        subtitle: 'Find answers to common questions',
        allowMultiple: true,
        showIcons: true,
        enableSearch: true,
        expandAllButton: true
      };
    }

    if (!this.config.items || this.config.items.length === 0) {
      this.config.items = [
        {
          id: 'faq-1',
          icon: 'question-circle',
          question: 'How quickly can I get my website online?',
          answer: '<p>Your professional website can be live in under 10 minutes! Simply sign up, choose your subdomain, customize your template, and publish. No technical knowledge required.</p>',
          expanded: false
        },
        {
          id: 'faq-2',
          icon: 'credit-card',
          question: 'What payment methods do you accept?',
          answer: '<p>We accept all major credit cards, debit cards, and bank transfers. Payment is processed securely through our encrypted payment gateway.</p>',
          expanded: false
        },
        {
          id: 'faq-3',
          icon: 'shield-check',
          question: 'Is my data secure?',
          answer: '<p>Yes! We use enterprise-grade security including:</p><ul><li>SSL encryption for all data</li><li>Daily automated backups</li><li>Role-based access control</li><li>Complete data isolation</li></ul>',
          expanded: false
        }
      ];
    }
  }

  addItem() {
    const newItem: AccordionItem = {
      id: `faq-${Date.now()}`,
      icon: 'question-circle',
      question: 'New question',
      answer: '<p>Answer goes here</p>',
      expanded: false
    };
    this.config.items.push(newItem);
  }

  removeItem(index: number) {
    this.config.items.splice(index, 1);
  }

  moveItemUp(index: number) {
    if (index > 0) {
      const temp = this.config.items[index];
      this.config.items[index] = this.config.items[index - 1];
      this.config.items[index - 1] = temp;
    }
  }

  moveItemDown(index: number) {
    if (index < this.config.items.length - 1) {
      const temp = this.config.items[index];
      this.config.items[index] = this.config.items[index + 1];
      this.config.items[index + 1] = temp;
    }
  }

  onSave() {
    this.update.emit(this.config.settings);
  }
}
