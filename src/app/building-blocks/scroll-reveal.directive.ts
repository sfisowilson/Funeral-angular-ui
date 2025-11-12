import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input() animationClass = 'animate-in';
  @Input() threshold = 0.1; // Percentage of element that needs to be visible
  @Input() rootMargin = '0px 0px -50px 0px'; // Trigger slightly before element enters viewport

  private observer?: IntersectionObserver;
  private hasAnimated = false;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Skip animations if user prefers reduced motion
      this.el.nativeElement.classList.add('no-animation');
      return;
    }

    // Set up IntersectionObserver
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.hasAnimated) {
            // Element is now visible, trigger animation
            this.el.nativeElement.classList.add(this.animationClass);
            this.hasAnimated = true;
            
            // Mark animation as complete after it finishes
            const duration = this.getAnimationDuration();
            setTimeout(() => {
              this.el.nativeElement.classList.add('animate-complete');
            }, duration);
            
            // Stop observing once animated (performance optimization)
            if (this.observer) {
              this.observer.unobserve(this.el.nativeElement);
            }
          }
        });
      },
      {
        threshold: this.threshold,
        rootMargin: this.rootMargin
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private getAnimationDuration(): number {
    const element = this.el.nativeElement;
    const duration = getComputedStyle(element).getPropertyValue('--animation-duration');
    
    if (duration) {
      // Parse duration (e.g., "600ms" or "0.6s")
      const value = parseFloat(duration);
      const unit = duration.includes('ms') ? 1 : 1000;
      return value * unit;
    }
    
    return 600; // Default duration
  }
}
