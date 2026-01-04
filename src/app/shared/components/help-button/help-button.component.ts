import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TourService } from '../../core/services/tour.service';
import { getTourById } from '../../core/constants/tours';
import { Router } from '@angular/router';

@Component({
  selector: 'app-help-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="help-widget">
      <!-- Help Button -->
      <button 
        class="help-trigger"
        [class.open]="helpOpen"
        (click)="toggleHelp()"
        title="Need help?"
        >
        <i class="bi" [class.bi-question-lg]="!helpOpen" [class.bi-x-lg]="helpOpen"></i>
      </button>

      <!-- Help Panel -->
      <div class="help-panel" *ngIf="helpOpen" @slideIn>
        <div class="help-header">
          <h5><i class="bi bi-question-circle me-2"></i>Need Help?</h5>
        </div>

        <div class="help-content">
          <!-- Search -->
          <div class="search-box mb-3">
            <i class="bi bi-search"></i>
            <input 
              type="search" 
              class="form-control form-control-sm" 
              placeholder="Search for help..."
              [(ngModel)]="searchQuery"
            >
          </div>

          <!-- Quick Actions -->
          <div class="help-section">
            <h6><i class="bi bi-lightning-fill me-2"></i>Quick Start</h6>
            <a (click)="startTour('first-time-user')" class="help-link">
              <i class="bi bi-play-circle"></i>
              <span>Take the Tour</span>
            </a>
            <a (click)="startTour('page-builder')" class="help-link">
              <i class="bi bi-palette"></i>
              <span>Page Builder Tutorial</span>
            </a>
            <a (click)="goToPages()" class="help-link">
              <i class="bi bi-file-earmark-plus"></i>
              <span>Create Your First Page</span>
            </a>
          </div>

          <!-- Popular Articles -->
          <div class="help-section">
            <h6><i class="bi bi-book me-2"></i>Popular Guides</h6>
            <a href="/help/getting-started" target="_blank" class="help-link">
              <i class="bi bi-arrow-right-circle"></i>
              <span>Getting Started Guide</span>
            </a>
            <a href="/help/widgets" target="_blank" class="help-link">
              <i class="bi bi-puzzle"></i>
              <span>Understanding Widgets</span>
            </a>
            <a href="/help/publishing" target="_blank" class="help-link">
              <i class="bi bi-globe"></i>
              <span>Publishing Your Site</span>
            </a>
            <a href="/help/customization" target="_blank" class="help-link">
              <i class="bi bi-brush"></i>
              <span>Customizing Your Brand</span>
            </a>
          </div>

          <!-- Contact Support -->
          <div class="help-section">
            <h6><i class="bi bi-headset me-2"></i>Contact Support</h6>
            <a (click)="openChat()" class="help-link">
              <i class="bi bi-chat-dots"></i>
              <span>Live Chat</span>
              <span class="badge bg-success ms-auto">Online</span>
            </a>
            <a href="mailto:support@mizo.co.za" class="help-link">
              <i class="bi bi-envelope"></i>
              <span>Email Support</span>
            </a>
            <a href="tel:+27111234567" class="help-link">
              <i class="bi bi-telephone"></i>
              <span>Call Us</span>
            </a>
          </div>

          <!-- Reset Tours -->
          <div class="help-section border-top pt-3">
            <button class="btn btn-sm btn-outline-secondary w-100" (click)="resetTours()">
              <i class="bi bi-arrow-clockwise me-2"></i>Reset All Tours
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .help-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
    }

    .help-trigger {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(13, 110, 253, 0.4);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .help-trigger:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(13, 110, 253, 0.5);
    }

    .help-trigger.open {
      background: #dc3545;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
    }

    .help-panel {
      position: absolute;
      bottom: 72px;
      right: 0;
      width: 360px;
      max-height: 600px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .help-header {
      padding: 20px;
      background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
      color: white;
    }

    .help-header h5 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
    }

    .help-content {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }

    .search-box {
      position: relative;
    }

    .search-box i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
      font-size: 14px;
    }

    .search-box input {
      padding-left: 36px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .help-section {
      margin-bottom: 20px;
    }

    .help-section:last-child {
      margin-bottom: 0;
    }

    .help-section h6 {
      font-size: 13px;
      font-weight: 600;
      color: #495057;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }

    .help-link {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      border-radius: 8px;
      color: #495057;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .help-link:hover {
      background: #f8f9fa;
      color: #0d6efd;
    }

    .help-link i {
      margin-right: 12px;
      font-size: 16px;
      color: #6c757d;
      transition: color 0.2s;
    }

    .help-link:hover i {
      color: #0d6efd;
    }

    .help-link span:first-of-type {
      flex: 1;
    }

    .badge {
      font-size: 10px;
      padding: 4px 8px;
    }

    @media (max-width: 480px) {
      .help-panel {
        width: calc(100vw - 48px);
        max-height: 500px;
      }
    }
  `]
})
export class HelpButtonComponent {
  helpOpen = false;
  searchQuery = '';

  constructor(
    private tourService: TourService,
    private router: Router
  ) {}

  toggleHelp() {
    this.helpOpen = !this.helpOpen;
  }

  startTour(tourId: string) {
    const tour = getTourById(tourId);
    if (tour) {
      this.helpOpen = false;
      setTimeout(() => {
        this.tourService.startTour(tour, true);
      }, 300);
    }
  }

  goToPages() {
    this.helpOpen = false;
    this.router.navigate(['/pages']);
  }

  openChat() {
    // Implement your chat widget integration here
    console.log('Opening chat...');
    this.helpOpen = false;
  }

  resetTours() {
    this.tourService.resetAllTours();
    alert('All tours have been reset. You can now take them again!');
    this.helpOpen = false;
  }
}
