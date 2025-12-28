import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UseCaseCard } from './use-case-cards-widget.component';

@Component({
  selector: 'app-use-case-cards-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './use-case-cards-editor.component.html',
  styleUrls: ['./use-case-cards-editor.component.scss']
})
export class UseCaseCardsEditorComponent implements OnInit {
  @Input() config: any = {};
  @Output() update = new EventEmitter<any>();


  ngOnInit() {
    if (!this.config.settings) {
      this.config.settings = {
        title: 'Ideal For',
        subtitle: 'Who benefits most from our platform',
        columns: 3,
        showFeatures: true,
        showCta: true
      };
    }

    if (!this.config.cards || this.config.cards.length === 0) {
      this.config.cards = [
        {
          icon: 'building',
          title: 'Established Funeral Homes',
          description: 'Modernize your online presence and streamline operations without massive IT investment.',
          features: [
            'Professional website in minutes',
            'Complete member management',
            'Claims processing automation',
            'No technical expertise required'
          ],
          ctaText: 'Learn More',
          ctaLink: '#'
        },
        {
          icon: 'rocket',
          title: 'New Funeral Service Businesses',
          description: 'Get online quickly with a professional website and complete business management system.',
          features: [
            'Quick market entry',
            'Affordable startup costs',
            'All-in-one platform',
            'Scalable as you grow'
          ],
          ctaText: 'Get Started',
          ctaLink: '#'
        },
        {
          icon: 'laptop',
          title: 'Funeral Parlours Going Digital',
          description: 'Transition from paper-based processes to efficient digital workflows seamlessly.',
          features: [
            'Easy data migration',
            'Digital document management',
            'Online member portal',
            'Automated workflows'
          ],
          ctaText: 'Modernize Now',
          ctaLink: '#'
        }
      ];
    }
  }

  onSave() {
    this.update.emit(this.config.settings);
  }

  addCard() {
    const newCard: UseCaseCard = {
      icon: 'star',
      title: 'New Use Case',
      description: 'Describe who this is ideal for',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      ctaText: 'Learn More',
      ctaLink: '#'
    };
    this.config.cards.push(newCard);
  }

  removeCard(index: number) {
    this.config.cards.splice(index, 1);
  }

  addFeature(card: UseCaseCard) {
    if (!card.features) {
      card.features = [];
    }
    card.features.push('New feature');
  }

  removeFeature(card: UseCaseCard, featureIndex: number) {
    card.features.splice(featureIndex, 1);
  }

  moveCardUp(index: number) {
    if (index > 0) {
      const temp = this.config.cards[index];
      this.config.cards[index] = this.config.cards[index - 1];
      this.config.cards[index - 1] = temp;
    }
  }

  moveCardDown(index: number) {
    if (index < this.config.cards.length - 1) {
      const temp = this.config.cards[index];
      this.config.cards[index] = this.config.cards[index + 1];
      this.config.cards[index + 1] = temp;
    }
  }
}
