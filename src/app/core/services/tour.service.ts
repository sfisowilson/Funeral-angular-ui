import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding?: number;
  showSkip?: boolean;
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
}

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private currentTour: Tour | null = null;
  private currentStepIndex = 0;
  private tourActive$ = new BehaviorSubject<boolean>(false);
  private overlay: HTMLElement | null = null;
  private spotlight: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;

  // Track which tours user has seen
  private completedTours = new Set<string>();

  constructor() {
    this.loadCompletedTours();
  }

  isTourActive() {
    return this.tourActive$.asObservable();
  }

  hasCompletedTour(tourId: string): boolean {
    return this.completedTours.has(tourId);
  }

  startTour(tour: Tour, force = false) {
    if (!force && this.hasCompletedTour(tour.id)) {
      return; // Don't show tours user has already seen
    }

    this.currentTour = tour;
    this.currentStepIndex = 0;
    this.tourActive$.next(true);
    this.createOverlay();
    this.showStep(0);
  }

  nextStep() {
    if (!this.currentTour) return;

    this.currentStepIndex++;
    if (this.currentStepIndex >= this.currentTour.steps.length) {
      this.endTour(true);
    } else {
      this.showStep(this.currentStepIndex);
    }
  }

  previousStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.showStep(this.currentStepIndex);
    }
  }

  skipTour() {
    this.endTour(false);
  }

  private showStep(index: number) {
    if (!this.currentTour) return;

    const step = this.currentTour.steps[index];
    const element = document.querySelector(step.target) as HTMLElement;

    if (!element) {
      console.warn(`Tour target not found: ${step.target}`);
      this.nextStep();
      return;
    }

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Update spotlight
    this.updateSpotlight(element, step.highlightPadding || 8);

    // Show tooltip
    this.showTooltip(element, step, index);
  }

  private createOverlay() {
    // Create dark overlay
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9998;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(this.overlay);

    // Create spotlight (clear area)
    this.spotlight = document.createElement('div');
    this.spotlight.style.cssText = `
      position: absolute;
      background: white;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
      border-radius: 8px;
      z-index: 9999;
      pointer-events: none;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(this.spotlight);

    // Create tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = `
      position: absolute;
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      z-index: 10000;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(this.tooltip);
  }

  private updateSpotlight(element: HTMLElement, padding: number) {
    if (!this.spotlight) return;

    const rect = element.getBoundingClientRect();
    this.spotlight.style.top = `${rect.top - padding}px`;
    this.spotlight.style.left = `${rect.left - padding}px`;
    this.spotlight.style.width = `${rect.width + padding * 2}px`;
    this.spotlight.style.height = `${rect.height + padding * 2}px`;
  }

  private showTooltip(element: HTMLElement, step: TourStep, index: number) {
    if (!this.tooltip || !this.currentTour) return;

    const totalSteps = this.currentTour.steps.length;
    const isFirst = index === 0;
    const isLast = index === totalSteps - 1;

    this.tooltip.innerHTML = `
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h4 style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
            ${step.title}
          </h4>
          ${step.showSkip !== false ? `
            <button onclick="window.tourService?.skipTour()" 
                    style="background: none; border: none; color: #6c757d; cursor: pointer; font-size: 14px; padding: 4px 8px;">
              Skip tour
            </button>
          ` : ''}
        </div>
        <p style="margin: 0; color: #495057; line-height: 1.6; font-size: 15px;">
          ${step.content}
        </p>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e9ecef;">
        <div style="color: #6c757d; font-size: 14px;">
          Step ${index + 1} of ${totalSteps}
        </div>
        <div style="display: flex; gap: 8px;">
          ${!isFirst ? `
            <button onclick="window.tourService?.previousStep()" 
                    style="padding: 8px 16px; border: 1px solid #dee2e6; background: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; color: #495057;">
              Back
            </button>
          ` : ''}
          <button onclick="window.tourService?.nextStep()" 
                  style="padding: 8px 20px; border: none; background: #0d6efd; color: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
            ${isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    `;

    // Position tooltip
    this.positionTooltip(element, step.position || 'bottom');

    // Make service available globally for button clicks
    (window as any).tourService = this;
  }

  private positionTooltip(element: HTMLElement, position: string) {
    if (!this.tooltip) return;

    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const padding = 16;

    switch (position) {
      case 'top':
        this.tooltip.style.top = `${rect.top - tooltipRect.height - padding}px`;
        this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
        break;
      case 'bottom':
        this.tooltip.style.top = `${rect.bottom + padding}px`;
        this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
        break;
      case 'left':
        this.tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
        this.tooltip.style.left = `${rect.left - tooltipRect.width - padding}px`;
        break;
      case 'right':
        this.tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
        this.tooltip.style.left = `${rect.right + padding}px`;
        break;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const currentLeft = parseInt(this.tooltip.style.left);
    const currentTop = parseInt(this.tooltip.style.top);

    if (currentLeft < 10) this.tooltip.style.left = '10px';
    if (currentLeft + tooltipRect.width > viewportWidth - 10) {
      this.tooltip.style.left = `${viewportWidth - tooltipRect.width - 10}px`;
    }
    if (currentTop < 10) this.tooltip.style.top = '10px';
    if (currentTop + tooltipRect.height > viewportHeight - 10) {
      this.tooltip.style.top = `${viewportHeight - tooltipRect.height - 10}px`;
    }
  }

  private endTour(completed: boolean) {
    if (this.currentTour && completed) {
      this.completedTours.add(this.currentTour.id);
      this.saveCompletedTours();
    }

    // Remove elements
    this.overlay?.remove();
    this.spotlight?.remove();
    this.tooltip?.remove();
    
    this.overlay = null;
    this.spotlight = null;
    this.tooltip = null;
    this.currentTour = null;
    this.currentStepIndex = 0;
    this.tourActive$.next(false);

    // Clean up global reference
    delete (window as any).tourService;
  }

  private loadCompletedTours() {
    const stored = localStorage.getItem('completed_tours');
    if (stored) {
      this.completedTours = new Set(JSON.parse(stored));
    }
  }

  private saveCompletedTours() {
    localStorage.setItem('completed_tours', JSON.stringify(Array.from(this.completedTours)));
  }

  resetTour(tourId: string) {
    this.completedTours.delete(tourId);
    this.saveCompletedTours();
  }

  resetAllTours() {
    this.completedTours.clear();
    this.saveCompletedTours();
  }
}
