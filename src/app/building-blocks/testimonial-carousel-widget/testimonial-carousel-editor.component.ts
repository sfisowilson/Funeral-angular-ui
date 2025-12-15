import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Testimonial } from './testimonial-carousel-widget.component';

@Component({
  selector: 'app-testimonial-carousel-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './testimonial-carousel-editor.component.html',
  styleUrls: ['./testimonial-carousel-editor.component.scss']
})
export class TestimonialCarouselEditorComponent implements OnInit {
  @Input() config: any = {};

  ngOnInit() {
    if (!this.config.settings) {
      this.config.settings = {
        title: 'What Our Clients Say',
        subtitle: 'Real experiences from families we\'ve served',
        autoPlay: true,
        autoPlayInterval: 5000,
        showRatings: true,
        showImages: true,
        layout: 'single'
      };
    }

    if (!this.config.testimonials || this.config.testimonials.length === 0) {
      this.config.testimonials = [
        {
          name: 'Sarah Mitchell',
          role: 'Owner',
          company: 'Peaceful Rest Funeral Services',
          content: 'We went from concept to live website in 8 minutes. What would have taken months with a developer was done before lunch. The member management system has saved us countless hours every week.',
          rating: 5,
          imageUrl: ''
        },
        {
          name: 'John Khumalo',
          role: 'Director',
          company: 'Heritage Funeral Home',
          content: 'No more juggling multiple systems. We were using spreadsheets, email, and three different software tools. Now everything is in one place. Claims processing that used to take days now takes hours.',
          rating: 5,
          imageUrl: ''
        },
        {
          name: 'Patricia Louw',
          role: 'Manager',
          company: 'Community Funeral Services',
          content: 'The ROI was immediate. We\'re saving R5,000/month on software subscriptions alone, plus our members love the online portal. We look more professional than competitors spending 10x what we do.',
          rating: 5,
          imageUrl: ''
        }
      ];
    }
  }

  addTestimonial() {
    const newTestimonial: Testimonial = {
      name: 'Customer Name',
      role: 'Position',
      company: 'Company Name',
      content: 'Testimonial content goes here...',
      rating: 5,
      imageUrl: ''
    };
    this.config.testimonials.push(newTestimonial);
  }

  removeTestimonial(index: number) {
    this.config.testimonials.splice(index, 1);
  }

  moveTestimonialUp(index: number) {
    if (index > 0) {
      const temp = this.config.testimonials[index];
      this.config.testimonials[index] = this.config.testimonials[index - 1];
      this.config.testimonials[index - 1] = temp;
    }
  }

  moveTestimonialDown(index: number) {
    if (index < this.config.testimonials.length - 1) {
      const temp = this.config.testimonials[index];
      this.config.testimonials[index] = this.config.testimonials[index + 1];
      this.config.testimonials[index + 1] = temp;
    }
  }
}
