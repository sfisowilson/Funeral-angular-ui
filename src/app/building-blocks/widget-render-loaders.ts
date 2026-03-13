import { Type } from '@angular/core';

/**
 * Lazy render-only widget loaders.
 *
 * Each entry is a dynamic import factory — esbuild splits every widget into its
 * own JS chunk.  Editor components are deliberately excluded: public page
 * visitors never need them, so they stay in the page-builder chunk only.
 *
 * Used exclusively by DynamicPageComponent.  The page-builder still uses
 * widget-registry.ts (which keeps eager imports for the editor context).
 */
export const WIDGET_RENDER_LOADERS: Readonly<Record<string, () => Promise<Type<any>>>> = {
    // ── Core ──────────────────────────────────────────────────────────────────
    'hero':             () => import('./hero-widget/hero-widget.component').then(m => m.HeroWidgetComponent),
    'features':         () => import('./features-widget/features-widget.component').then(m => m.FeaturesWidgetComponent),
    'cta':              () => import('./cta-widget/cta-widget.component').then(m => m.CtaWidgetComponent),
    'gallery':          () => import('./gallery-widget/gallery-widget.component').then(m => m.GalleryWidgetComponent),
    'contact-us':       () => import('./contact-us-widget/contact-us-widget.component').then(m => m.ContactUsWidgetComponent),
    'about-us':         () => import('./about-us-widget/about-us-widget.component').then(m => m.AboutUsWidgetComponent),
    'image-content':    () => import('./image-content-widget/image-content-widget.component').then(m => m.ImageContentWidgetComponent),
    'statistics':       () => import('./statistics-widget/statistics-widget.component').then(m => m.StatisticsWidgetComponent),
    'testimonials':     () => import('./testimonials-widget/testimonials-widget.component').then(m => m.TestimonialsWidgetComponent),
    'pricing-table':    () => import('./pricing-table-widget/pricing-table-widget.component').then(m => m.PricingTableWidgetComponent),
    'faq':              () => import('./faq-widget/faq-widget.component').then(m => m.FaqWidgetComponent),
    'quick-quote':      () => import('./quick-quote-widget/quick-quote-widget.component').then(m => m.QuickQuoteWidgetComponent),
    'news-updates':     () => import('./news-updates-widget/news-updates-widget.component').then(m => m.NewsUpdatesWidgetComponent),
    'services-overview':() => import('./services-overview-widget/services-overview-widget.component').then(m => m.ServicesOverviewWidgetComponent),
    'premium-calculator':() => import('./premium-calculator-widget/premium-calculator-widget.component').then(m => m.PremiumCalculatorWidgetComponent),
    'slider':           () => import('./slider-widget/slider-widget.component').then(m => m.SliderWidgetComponent),
    'whatsapp':         () => import('./whatsapp-widget/whatsapp-widget.component').then(m => m.WhatsappWidgetComponent),
    // ── Landing page — high priority ─────────────────────────────────────────
    'comparison-table': () => import('./comparison-table-widget/comparison-table-widget.component').then(m => m.ComparisonTableWidgetComponent),
    'process-steps':    () => import('./process-steps-widget/process-steps-widget.component').then(m => m.ProcessStepsWidgetComponent),
    'stats-counter':    () => import('./stats-counter-widget/stats-counter-widget.component').then(m => m.StatsCounterWidgetComponent),
    'benefits-checklist':() => import('./benefits-checklist-widget/benefits-checklist-widget.component').then(m => m.BenefitsChecklistWidgetComponent),
    'feature-grid':     () => import('./feature-grid-widget/feature-grid-widget.component').then(m => m.FeatureGridWidgetComponent),
    'policy-cover-premium-table': () => import('./policy-cover-premium-table-widget/policy-cover-premium-table-widget.component').then(m => m.PolicyCoverPremiumTableWidgetComponent),
    // ── Landing page — medium priority ────────────────────────────────────────
    'timeline-comparison': () => import('./timeline-comparison-widget/timeline-comparison-widget.component').then(m => m.TimelineComparisonWidgetComponent),
    'use-case-cards':   () => import('./use-case-cards-widget/use-case-cards-widget.component').then(m => m.UseCaseCardsWidgetComponent),
    'video-embed':      () => import('./video-embed-widget/video-embed-widget.component').then(m => m.VideoEmbedWidgetComponent),
    'logo-cloud':       () => import('./logo-cloud-widget/logo-cloud-widget.component').then(m => m.LogoCloudWidgetComponent),
    'tabbed-content':   () => import('./tabbed-content-widget/tabbed-content-widget.component').then(m => m.TabbedContentWidgetComponent),
    'enhanced-accordion':() => import('./enhanced-accordion-widget/enhanced-accordion-widget.component').then(m => m.EnhancedAccordionWidgetComponent),
    // ── Landing page — nice to have ───────────────────────────────────────────
    'testimonial-carousel': () => import('./testimonial-carousel-widget/testimonial-carousel-widget.component').then(m => m.TestimonialCarouselWidgetComponent),
    'pricing-cards':    () => import('./pricing-cards-widget/pricing-cards-widget.component').then(m => m.PricingCardsWidgetComponent),
    'cta-banner':       () => import('./cta-banner-widget/cta-banner-widget.component').then(m => m.CTABannerWidgetComponent),
    'contact-card':     () => import('./contact-card-widget/contact-card-widget.component').then(m => m.ContactCardWidgetComponent),
    // ── NGO ───────────────────────────────────────────────────────────────────
    'ngo-events':       () => import('./ngo-events-widget/ngo-events-widget.component').then(m => m.NgoEventsWidgetComponent),
    'ngo-blog':         () => import('./ngo-blog-widget/ngo-blog-widget.component').then(m => m.NgoBlogWidgetComponent),
    'ngo-donor-recognition': () => import('./ngo-donor-recognition-widget/ngo-donor-recognition-widget.component').then(m => m.NgoDonorRecognitionWidgetComponent),
    'ngo-impact-reports': () => import('./ngo-impact-reports-widget/ngo-impact-reports-widget.component').then(m => m.NgoImpactReportsWidgetComponent),
    'ngo-grant-applications': () => import('./ngo-grant-applications-widget/ngo-grant-applications-widget.component').then(m => m.NgoGrantApplicationsWidgetComponent),
    'ngo-donation':     () => import('./ngo-donation-widget/ngo-donation-widget.component').then(m => m.NgoDonationWidgetComponent),
    'careers':          () => import('./careers-widget/careers-widget.component').then(m => m.CareersWidgetComponent),
    // ── Ecommerce ─────────────────────────────────────────────────────────────
    'products':         () => import('./products-widget/products-widget.component').then(m => m.ProductsWidgetComponent),
    'featured-products':() => import('./featured-products-widget/featured-products-widget.component').then(m => m.FeaturedProductsWidgetComponent),
    'product-categories':() => import('./product-categories-widget/product-categories-widget.component').then(m => m.ProductCategoriesWidgetComponent),
    'product-filter':   () => import('./product-filter-widget/product-filter-widget.component').then(m => m.ProductFilterWidgetComponent),
    'product-card':     () => import('./product-card-widget/product-card-widget.component').then(m => m.ProductCardWidgetComponent),
    'cart-summary':     () => import('./cart-summary-widget/cart-summary-widget.component').then(m => m.CartSummaryWidgetComponent),
    'order-history':    () => import('./order-history-widget/order-history-widget.component').then(m => m.OrderHistoryWidgetComponent),
    // ── Booking / forms ───────────────────────────────────────────────────────
    'booking':          () => import('./booking-widget/booking-widget.component').then(m => m.BookingWidgetComponent),
    'form':             () => import('./form-widget/form-widget.component').then(m => m.FormWidgetComponent),
    'stepper-form':     () => import('./stepper-form-widget/stepper-form-widget.component').then(m => m.StepperFormWidgetComponent),
    'onboarding-stepper': () => import('./onboarding-stepper-widget/onboarding-stepper-widget.component').then(m => m.OnboardingStepperWidgetComponent),
    'dynamic-entity-list': () => import('./dynamic-entity-list-widget/dynamic-entity-list-widget.component').then(m => m.DynamicEntityListWidgetComponent),
    'onboarding-multi-submit-step': () => import('./onboarding-multi-submit-step/onboarding-multi-submit-step.component').then(m => m.OnboardingMultiSubmitStepComponent),
    'onboarding-global-calculator': () => import('./onboarding-global-calculator-widget/onboarding-global-calculator-widget.component').then(m => m.OnboardingGlobalCalculatorWidgetComponent),
    // ── Modern (2026) ─────────────────────────────────────────────────────────
    'bento-grid':       () => import('./bento-grid-widget/bento-grid-widget.component').then(m => m.BentoGridWidgetComponent),
    'parallax-section': () => import('./parallax-section-widget/parallax-section-widget.component').then(m => m.ParallaxSectionWidgetComponent),
    'glassmorphism-card':() => import('./glassmorphism-card-widget/glassmorphism-card-widget.component').then(m => m.GlassmorphismCardWidgetComponent),
    'split-screen':     () => import('./split-screen-widget/split-screen-widget.component').then(m => m.SplitScreenWidgetComponent),
    'marquee':          () => import('./marquee-widget/marquee-widget.component').then(m => m.MarqueeWidgetComponent),
};
