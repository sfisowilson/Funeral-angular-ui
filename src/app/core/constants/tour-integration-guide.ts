/**
 * HOW TO ADD INTERACTIVE TOURS TO YOUR COMPONENTS
 * 
 * This guide shows you how to integrate the tour system into any page.
 */

// ============================================
// 1. ADD THE HELP BUTTON TO YOUR LAYOUT
// ============================================

// In your app.component.html or main layout, add:
// <app-help-button></app-help-button>

// Import in app.component.ts:
// import { HelpButtonComponent } from './shared/components/help-button/help-button.component';
//
// @Component({
//   // ... other config
//   imports: [HelpButtonComponent, /* other imports */],
// })


// ============================================
// 2. AUTO-START TOUR ON FIRST VISIT
// ============================================

// In any component (e.g., custom-pages-list.component.ts):
//
// import { Component, OnInit, AfterViewInit } from '@angular/core';
// import { TourService } from '@app/core/services/tour.service';
// import { CUSTOM_PAGES_LIST_TOUR } from '@app/core/constants/tours';
//
// export class CustomPagesListComponent implements OnInit, AfterViewInit {
//   
//   constructor(private tourService: TourService) {}
//
//   ngAfterViewInit() {
//     // Wait for DOM to be ready, then start tour if user hasn't seen it
//     setTimeout(() => {
//       if (!this.tourService.hasCompletedTour('custom-pages-list')) {
//         this.tourService.startTour(CUSTOM_PAGES_LIST_TOUR);
//       }
//     }, 500);
//   }
//
//   // Or add a button to manually start the tour
//   startPagesTour() {
//     this.tourService.startTour(CUSTOM_PAGES_LIST_TOUR, true); // force = true
//   }
// }


// ============================================
// 3. ADD TOUR TRIGGER BUTTON TO YOUR UI
// ============================================

// In your component template:
// <div class="page-header d-flex justify-content-between align-items-center">
//   <h2>Custom Pages</h2>
//   
//   <button class="btn btn-sm btn-outline-primary" (click)="startPagesTour()">
//     <i class="bi bi-play-circle me-2"></i>
//     Take a Tour
//   </button>
// </div>


// ============================================
// 4. ADD PROPER IDs/CLASSES TO TOUR TARGETS
// ============================================

// Make sure elements referenced in tours.ts have the correct selectors:
//
// <button id="create-page-button" class="btn btn-primary">
//   Create Page
// </button>
//
// <button id="add-widget-button" class="btn btn-primary">
//   <i class="bi bi-plus-lg"></i> Add Widget
// </button>
//
// <div id="page-settings-button" class="settings-btn">
//   Settings
// </div>


// ============================================
// 5. CREATE A CUSTOM TOUR FOR YOUR PAGE
// ============================================

// In tours.ts, add your own tour:
//
// export const MY_CUSTOM_TOUR: Tour = {
//   id: 'my-custom-feature',
//   name: 'My Feature Tour',
//   steps: [
//     {
//       target: '#my-element',
//       title: 'Welcome to My Feature',
//       content: 'This is what this feature does...',
//       position: 'bottom',
//       highlightPadding: 12
//     },
//     {
//       target: '.another-element',
//       title: 'Next Step',
//       content: 'Here you can do...',
//       position: 'right'
//     }
//   ]
// };


// ============================================
// 6. CONDITIONAL TOURS BASED ON USER STATE
// ============================================

// Show different tours based on conditions:
//
// ngAfterViewInit() {
//   setTimeout(() => {
//     if (this.pages.length === 0) {
//       // User has no pages, show getting started tour
//       this.tourService.startTour(FIRST_TIME_USER_TOUR);
//     } else if (!this.tourService.hasCompletedTour('advanced-features')) {
//       // User has pages but hasn't seen advanced tour
//       this.tourService.startTour(ADVANCED_FEATURES_TOUR);
//     }
//   }, 500);
// }


// ============================================
// 7. MULTI-PAGE TOURS (ADVANCED)
// ============================================

// For tours that span multiple pages:
//
// // Page 1:
// completeTourStepAndNavigate() {
//   this.tourService.skipTour(); // End current tour
//   this.router.navigate(['/next-page']);
//   
//   // In next page component, check for tour continuation:
//   const continueTour = localStorage.getItem('continue_tour');
//   if (continueTour === 'setup-wizard') {
//     this.tourService.startTour(SETUP_WIZARD_PART_2);
//   }
// }


// ============================================
// 8. EXAMPLE: EMPTY STATE WITH TOUR
// ============================================

// In your template when user has no data:
// <div *ngIf="pages.length === 0" class="empty-state text-center py-5">
//   <i class="bi bi-file-earmark-plus display-1 text-muted"></i>
//   <h3 class="mt-4">No Pages Yet</h3>
//   <p class="text-muted mb-4">Create your first page to get started</p>
//   
//   <div class="d-flex gap-3 justify-content-center">
//     <button class="btn btn-primary" (click)="createPage()">
//       <i class="bi bi-plus"></i> Create Page
//     </button>
//     <button class="btn btn-outline-secondary" (click)="startTour()">
//       <i class="bi bi-play-circle"></i> Show Me How
//     </button>
//   </div>
// </div>


// ============================================
// 9. RESET TOURS FOR TESTING
// ============================================

// During development, reset tours from console:
// Open browser console and run:
// localStorage.removeItem('completed_tours');

// Or use the "Reset All Tours" button in the help widget


// ============================================
// 10. TOUR BEST PRACTICES
// ============================================

/**
 * DO:
 * - Keep tours short (3-7 steps max)
 * - Focus on one feature per tour
 * - Use clear, conversational language
 * - Show tours on first visit only
 * - Add "Skip" option on all steps except last
 * - Test on different screen sizes
 * - Add proper delays (500ms) before starting tours
 * 
 * DON'T:
 * - Make tours mandatory
 * - Show the same tour repeatedly
 * - Use technical jargon
 * - Create tours longer than 2 minutes
 * - Forget to add IDs to target elements
 * - Start tours before DOM is ready
 */

// ============================================
// COMPONENT EXAMPLE: Page Builder
// ============================================
//
// @Component({
//   selector: 'app-page-builder',
//   templateUrl: './page-builder.component.html',
//   styleUrls: ['./page-builder.component.scss']
// })
// export class PageBuilderComponent implements AfterViewInit {
//   
//   constructor(private tourService: TourService) {}
//
//   ngAfterViewInit() {
//     // Auto-start tour for first-time users
//     setTimeout(() => {
//       if (!this.tourService.hasCompletedTour('page-builder')) {
//         this.tourService.startTour(PAGE_BUILDER_TOUR);
//       }
//     }, 800); // Longer delay for complex pages
//   }
//
//   // Add to your toolbar
//   showTour() {
//     this.tourService.startTour(PAGE_BUILDER_TOUR, true);
//   }
// }

// Template:
/**
<div class="page-builder-container">
  <div class="toolbar">
    <button id="add-widget-button" class="btn btn-primary">
      <i class="bi bi-plus"></i> Add Widget
    </button>
    <button id="page-settings-button" class="btn btn-outline-secondary">
      <i class="bi bi-gear"></i> Settings
    </button>
    <button id="preview-button" class="btn btn-outline-info">
      <i class="bi bi-eye"></i> Preview
    </button>
    <button id="save-button" class="btn btn-success">
      <i class="bi bi-check"></i> Save
    </button>
    
    <!-- Tour trigger -->
    <button class="btn btn-sm btn-link ms-auto" (click)="showTour()">
      <i class="bi bi-question-circle"></i> Help
    </button>
  </div>

  <div class="widget-canvas">
    <div class="widget-item" *ngFor="let widget of widgets">
      <!-- widget content -->
    </div>
  </div>
</div>
*/
