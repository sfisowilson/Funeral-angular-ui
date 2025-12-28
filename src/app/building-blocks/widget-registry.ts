import { Type } from '@angular/core';
import { HeroWidgetComponent } from './hero-widget/hero-widget.component';
import { HeroEditorComponent } from './hero-widget/hero-editor.component';
import { FeaturesWidgetComponent } from './features-widget/features-widget.component';
import { FeaturesEditorComponent } from './features-widget/features-editor.component';
import { CtaWidgetComponent } from './cta-widget/cta-widget.component';
import { CtaEditorComponent } from './cta-widget/cta-editor.component';
import { GalleryWidgetComponent } from './gallery-widget/gallery-widget.component';
import { GalleryEditorComponent } from './gallery-widget/gallery-editor.component';
import { PolicyComparisonWidgetComponent } from './policy-comparison-widget/policy-comparison-widget.component';
import { PolicyComparisonEditorComponent } from './policy-comparison-widget/policy-comparison-editor.component';
import { ContactUsWidgetComponent } from './contact-us-widget/contact-us-widget.component';
import { ContactUsEditorComponent } from './contact-us-widget/contact-us-editor.component';
import { TeamEditorWidgetComponent } from './team-editor-widget/team-editor-widget.component';
import { TeamEditorComponent } from './team-editor-widget/team-editor.component';
import { AboutUsWidgetComponent } from './about-us-widget/about-us-widget.component';
import { AboutUsEditorComponent } from './about-us-widget/about-us-editor.component';
// New widgets
import { StatisticsWidgetComponent } from './statistics-widget/statistics-widget.component';
import { StatisticsEditorComponent } from './statistics-widget/statistics-editor.component';
import { TestimonialsWidgetComponent } from './testimonials-widget/testimonials-widget.component';
import { TestimonialsEditorComponent } from './testimonials-widget/testimonials-editor.component';
import { PricingTableWidgetComponent } from './pricing-table-widget/pricing-table-widget.component';
import { PricingTableEditorComponent } from './pricing-table-widget/pricing-table-editor.component';
import { FaqWidgetComponent } from './faq-widget/faq-widget.component';
import { FaqEditorComponent } from './faq-widget/faq-editor.component';
import { QuickQuoteWidgetComponent } from './quick-quote-widget/quick-quote-widget.component';
import { QuickQuoteEditorComponent } from './quick-quote-widget/quick-quote-editor.component';
import { NewsUpdatesWidgetComponent } from './news-updates-widget/news-updates-widget.component';
import { NewsUpdatesEditorComponent } from './news-updates-widget/news-updates-editor.component';
import { ServicesOverviewWidgetComponent } from './services-overview-widget/services-overview-widget.component';
import { ServicesOverviewEditorComponent } from './services-overview-widget/services-overview-editor.component';
import { PremiumCalculatorWidgetComponent } from './premium-calculator-widget/premium-calculator-widget.component';
import { PremiumCalculatorEditorComponent } from './premium-calculator-widget/premium-calculator-editor.component';
import { ImageContentWidgetComponent } from './image-content-widget/image-content-widget.component';
import { ImageContentEditorComponent } from './image-content-widget/image-content-editor.component';
import { SliderWidgetComponent } from './slider-widget/slider-widget.component';
import { SliderEditorComponent } from './slider-widget/slider-editor.component';
import { WhatsappWidgetComponent } from './whatsapp-widget/whatsapp-widget.component';
import { WhatsappEditorComponent } from './whatsapp-widget/whatsapp-editor.component';
// Landing page widgets - High Priority
import { ComparisonTableWidgetComponent } from './comparison-table-widget/comparison-table-widget.component';
import { ComparisonTableEditorComponent } from './comparison-table-widget/comparison-table-editor.component';
import { ProcessStepsWidgetComponent } from './process-steps-widget/process-steps-widget.component';
import { ProcessStepsEditorComponent } from './process-steps-widget/process-steps-editor.component';
import { StatsCounterWidgetComponent } from './stats-counter-widget/stats-counter-widget.component';
import { StatsCounterEditorComponent } from './stats-counter-widget/stats-counter-editor.component';
import { BenefitsChecklistWidgetComponent } from './benefits-checklist-widget/benefits-checklist-widget.component';
import { BenefitsChecklistEditorComponent } from './benefits-checklist-widget/benefits-checklist-editor.component';
import { FeatureGridWidgetComponent } from './feature-grid-widget/feature-grid-widget.component';
import { FeatureGridEditorComponent } from './feature-grid-widget/feature-grid-editor.component';
// Landing page widgets - Medium Priority
import { TimelineComparisonWidgetComponent } from './timeline-comparison-widget/timeline-comparison-widget.component';
import { TimelineComparisonEditorComponent } from './timeline-comparison-widget/timeline-comparison-editor.component';
import { UseCaseCardsWidgetComponent } from './use-case-cards-widget/use-case-cards-widget.component';
import { UseCaseCardsEditorComponent } from './use-case-cards-widget/use-case-cards-editor.component';
import { VideoEmbedWidgetComponent } from './video-embed-widget/video-embed-widget.component';
import { VideoEmbedEditorComponent } from './video-embed-widget/video-embed-editor.component';
import { LogoCloudWidgetComponent } from './logo-cloud-widget/logo-cloud-widget.component';
import { LogoCloudEditorComponent } from './logo-cloud-widget/logo-cloud-editor.component';
import { TabbedContentWidgetComponent } from './tabbed-content-widget/tabbed-content-widget.component';
import { TabbedContentEditorComponent } from './tabbed-content-widget/tabbed-content-editor.component';
import { EnhancedAccordionWidgetComponent } from './enhanced-accordion-widget/enhanced-accordion-widget.component';
import { EnhancedAccordionEditorComponent } from './enhanced-accordion-widget/enhanced-accordion-editor.component';
// Landing page widgets - Nice to Have
import { TestimonialCarouselWidgetComponent } from './testimonial-carousel-widget/testimonial-carousel-widget.component';
import { TestimonialCarouselEditorComponent } from './testimonial-carousel-widget/testimonial-carousel-editor.component';
import { PricingCardsWidgetComponent } from './pricing-cards-widget/pricing-cards-widget.component';
import { PricingCardsEditorComponent } from './pricing-cards-widget/pricing-cards-editor.component';
import { CTABannerWidgetComponent } from './cta-banner-widget/cta-banner-widget.component';
import { CTABannerEditorComponent } from './cta-banner-widget/cta-banner-editor.component';
import { ContactCardWidgetComponent } from './contact-card-widget/contact-card-widget.component';
import { ContactCardEditorComponent } from './contact-card-widget/contact-card-editor.component';
import { PolicyCoverPremiumTableWidgetComponent } from './policy-cover-premium-table-widget/policy-cover-premium-table-widget.component';
import { PolicyCoverPremiumTableEditorComponent } from './policy-cover-premium-table-widget/policy-cover-premium-table-editor.component';

export interface WidgetType {
    name: string;
    component: Type<any>;
    editorComponent: Type<any>;
    defaultConfig: any;
    icon: string;
    floating?: boolean;
}

export const WIDGET_TYPES: WidgetType[] = [
    {
        name: 'policy-cover-premium-table',
        component: PolicyCoverPremiumTableWidgetComponent,
        editorComponent: PolicyCoverPremiumTableEditorComponent,
        defaultConfig: {
            title: 'Policy Cover Premiums',
            subtitle: '',
        },
        icon: 'table'
    },
    {
        name: 'whatsapp',
        component: WhatsappWidgetComponent,
        editorComponent: WhatsappEditorComponent,
        defaultConfig: {
            phoneNumber: '',
            agentName: 'Support Team',
            agentPhoto: '',
            welcomeMessage: 'Hi there! How can we help you today?',
            defaultMessage: 'Hi, I would like to get in touch.',
            buttonText: 'Start Chat',
            position: 'right',
            sidePosition: 20,
            bottomPosition: 20,
            buttonColor: 'var(--success-color, #25d366)',
            buttonSize: 60,
            borderRadius: 50,
            headerBackgroundColor: 'var(--primary-dark, #075e54)',
            headerTextColor: 'var(--primary-contrast-color, #ffffff)',
            expandedBackgroundColor: 'var(--surface-card, #f0f0f0)',
            expandedTextColor: 'var(--text-dark, #333333)',
            showOnlineStatus: true,
            zIndex: 1000
        },
        icon: 'chat-dots',
        floating: true
    },
    {
        name: 'slider',
        component: SliderWidgetComponent,
        editorComponent: SliderEditorComponent,
        defaultConfig: {
            height: 500,
            backgroundColor: 'transparent',
            borderRadius: 0,
            padding: 0,
            autoplay: true,
            autoplaySpeed: 5000,
            showArrows: true,
            showButton: false,
            showDots: true,
            arrowBackgroundColor: 'var(--arrow-bg, rgba(0, 0, 0, 0.5))',
            arrowColor: 'var(--primary-contrast-color, #ffffff)',
            dotSize: 12,
            dotColor: 'var(--dot-color, rgba(255, 255, 255, 0.5))',
            dotActiveColor: 'var(--primary-contrast-color, #ffffff)',
            dotsBackgroundColor: 'var(--dots-bg, rgba(0, 0, 0, 0.3))',
            titleSize: 48,
            titleColor: 'var(--primary-contrast-color, #ffffff)',
            subtitleSize: 20,
            subtitleColor: 'var(--primary-contrast-color, #ffffff)',
            overlayOpacity: 0.4,
            buttonColor: 'var(--primary-color, #007bff)',
            buttonTextColor: 'var(--primary-contrast-color, #ffffff)',
            buttonTextSize: 16,
            slides: [
                {
                    imageUrl: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=1200',
                    title: 'Welcome to Our Services',
                    subtitle: 'Professional funeral planning with compassion and care',
                    buttonText: 'Learn More',
                    buttonLink: '#services'
                },
                {
                    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200',
                    title: 'Comprehensive Coverage',
                    subtitle: 'Protecting what matters most to you and your family',
                    buttonText: 'Get Started',
                    buttonLink: '#plans'
                },
                {
                    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200',
                    title: 'Here for You',
                    subtitle: 'Supporting families through every step of the journey',
                    buttonText: 'Contact Us',
                    buttonLink: '#contact'
                }
            ]
        },
        icon: 'images'
    },
    {
        name: 'hero',
        component: HeroWidgetComponent,
        editorComponent: HeroEditorComponent,
        defaultConfig: {
            title: 'Welcome to Our Site',
            titleSize: 36,
            subtitle: 'This is a customizable hero section',
            subtitleSize: 18,
            backgroundColor: 'var(--surface-ground, #f8f9fa)',
            textColor: 'var(--text-color, #212529)',
            padding: 40,
            showButton: true,
            buttonText: 'Learn More',
            buttonLink: '#',
            buttonColor: 'var(--primary-color, #007bff)',
            buttonTextColor: 'var(--primary-contrast-color, #ffffff)',
            buttonTextSize: 16,
            buttonPadding: 10
        },
        icon: 'star'
    },
    {
        name: 'statistics',
        component: StatisticsWidgetComponent,
        editorComponent: StatisticsEditorComponent,
        defaultConfig: {
            title: 'Our Impact',
            titleSize: 36,
            titleColor: 'var(--text-color, #000000)',
            backgroundColor: 'var(--surface-ground, #f8f9fa)',
            cardBackgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            iconSize: 48,
            iconColor: 'var(--primary-color, #007bff)',
            numberColor: 'var(--primary-color, #007bff)',
            labelColor: 'var(--text-color, #000000)',
            labelSize: 16,
            descriptionColor: 'var(--muted-color, #6c757d)',
            statistics: [
                { icon: 'pi pi-users', value: '10,000+', label: 'Active Members', description: 'Growing monthly' },
                { icon: 'pi pi-check-circle', value: '5,000+', label: 'Claims Processed', description: 'Successfully paid out' },
                { icon: 'pi pi-shield', value: '15+', label: 'Years Experience', description: 'Serving communities' },
                { icon: 'pi pi-heart', value: '99%', label: 'Satisfaction Rate', description: 'Customer feedback' }
            ]
        },
        icon: 'chart-bar'
    },
    {
        name: 'testimonials',
        component: TestimonialsWidgetComponent,
        editorComponent: TestimonialsEditorComponent,
        defaultConfig: {
            title: 'What Our Customers Say',
            titleSize: 36,
            titleColor: 'var(--text-color, #000000)',
            backgroundColor: 'var(--surface-ground, #f8f9fa)',
            cardBackgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            numVisible: 1,
            autoplayInterval: 5000,
            textColor: 'var(--text-dark, #333333)',
            textSize: 16,
            nameColor: 'var(--text-color, #000000)',
            nameSize: 18,
            positionColor: 'var(--muted-color, #6c757d)',
            starColor: 'var(--warning-color, #ffc107)',
            testimonials: [
                {
                    name: 'Sarah Johnson',
                    position: 'Satisfied Customer',
                    text: 'The claims process was smooth and efficient. The team was compassionate and professional during our difficult time.',
                    rating: 5,
                    photo: ''
                },
                {
                    name: 'Michael Brown',
                    position: 'Policy Holder',
                    text: 'Excellent service and affordable premiums. I feel secure knowing my family is protected.',
                    rating: 5,
                    photo: ''
                }
            ]
        },
        icon: 'comments'
    },
    {
        name: 'pricing-table',
        component: PricingTableWidgetComponent,
        editorComponent: PricingTableEditorComponent,
        defaultConfig: {
            title: 'Choose Your Plan',
            subtitle: 'Select the coverage that best fits your needs',
            titleSize: 36,
            subtitleSize: 18,
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-ground, #f8f9fa)',
            cardBackgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            currency: 'R',
            defaultButtonText: 'Choose Plan',
            priceColor: 'var(--primary-color, #007bff)',
            periodColor: 'var(--muted-color, #6c757d)',
            featureTextColor: 'var(--text-dark, #333333)',
            checkmarkColor: 'var(--success-color, #28a745)',
            buttonColor: 'var(--primary-color, #007bff)',
            buttonTextColor: 'var(--primary-contrast-color, #ffffff)',
            featuredButtonColor: 'var(--success-color, #28a745)',
            featuredButtonTextColor: 'var(--primary-contrast-color, #ffffff)',
            featuredBadgeText: 'Most Popular',
            pricingPlans: [
                {
                    name: 'Basic Cover',
                    price: 150,
                    period: 'month',
                    description: 'Essential funeral coverage',
                    features: ['R50,000 Coverage', 'Basic Services', '24/7 Support'],
                    buttonText: 'Get Started',
                    buttonLink: '',
                    featured: false
                },
                {
                    name: 'Premium Cover',
                    price: 300,
                    period: 'month',
                    description: 'Comprehensive funeral coverage',
                    features: ['R100,000 Coverage', 'Full Services', 'Family Support', 'Premium Benefits'],
                    buttonText: 'Most Popular',
                    buttonLink: '',
                    featured: true
                }
            ]
        },
        icon: 'table'
    },
    {
        name: 'faq',
        component: FaqWidgetComponent,
        editorComponent: FaqEditorComponent,
        defaultConfig: {
            title: 'Frequently Asked Questions',
            subtitle: 'Find answers to common questions about our services',
            titleSize: 36,
            subtitleSize: 18,
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            answerColor: 'var(--text-dark, #333333)',
            answerSize: 14,
            allowMultiple: true,
            faqs: [
                {
                    question: 'How do I submit a claim?',
                    answer: 'You can submit a claim by calling our 24/7 hotline or visiting our website. Our team will guide you through the process step by step.'
                },
                {
                    question: 'What documents do I need for a claim?',
                    answer: 'You will need the death certificate, ID documents, and your policy details. Our claims team will provide a complete checklist when you contact us.'
                },
                {
                    question: 'How long does claim processing take?',
                    answer: 'Most claims are processed within 48-72 hours once all required documents are submitted and verified.'
                }
            ]
        },
        icon: 'question-circle'
    },
    {
        name: 'quick-quote',
        component: QuickQuoteWidgetComponent,
        editorComponent: QuickQuoteEditorComponent,
        defaultConfig: {
            title: 'Get Your Quote Today',
            subtitle: 'Fill out the form below and get a personalized quote within 24 hours',
            titleSize: 36,
            subtitleSize: 18,
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-ground, #f8f9fa)',
            formBackgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            labelColor: 'var(--text-dark, #333333)',
            buttonText: 'Get My Quote',
            buttonColor: 'var(--primary-color, #007bff)',
            buttonTextColor: 'var(--primary-contrast-color, #ffffff)',
            successMessage: 'Thank you! We will contact you within 24 hours with your personalized quote.'
        },
        icon: 'calculator'
    },
    {
        name: 'news-updates',
        component: NewsUpdatesWidgetComponent,
        editorComponent: NewsUpdatesEditorComponent,
        defaultConfig: {
            title: 'Latest News & Updates',
            subtitle: 'Stay informed with our latest news and company updates',
            titleSize: 36,
            subtitleSize: 18,
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-ground, #f8f9fa)',
            cardBackgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            articleTitleSize: 18,
            excerptSize: 14,
            titleTextColor: 'var(--text-color, #000000)',
            excerptColor: 'var(--muted-color, #6c757d)',
            dateColor: 'var(--muted-color, #999999)',
            authorColor: 'var(--muted-color, #666666)',
            categoryBackgroundColor: 'var(--primary-color, #007bff)',
            categoryTextColor: 'var(--primary-contrast-color, #ffffff)',
            buttonColor: 'var(--primary-color, #007bff)',
            buttonTextColor: 'var(--primary-contrast-color, #ffffff)',
            readMoreText: 'Read More',
            showViewAllButton: true,
            viewAllButtonText: 'View All News',
            viewAllButtonColor: 'var(--success-color, #28a745)',
            viewAllButtonTextColor: 'var(--primary-contrast-color, #ffffff)',
            allNewsUrl: '',
            articles: [
                {
                    title: 'New Policy Options Available',
                    excerpt: 'We are excited to announce new flexible policy options designed to meet diverse customer needs.',
                    author: 'Admin Team',
                    category: 'Product Update',
                    publishDate: new Date(),
                    imageUrl: '',
                    url: ''
                },
                {
                    title: 'Community Support Initiative',
                    excerpt: 'Our company is launching a new community support program to help families in need.',
                    author: 'Community Relations',
                    category: 'Community',
                    publishDate: new Date(Date.now() - 86400000), // Yesterday
                    imageUrl: '',
                    url: ''
                }
            ]
        },
        icon: 'newspaper'
    },
    {
        name: 'services-overview',
        component: ServicesOverviewWidgetComponent,
        editorComponent: ServicesOverviewEditorComponent,
        defaultConfig: {
            title: 'Our Services',
            subtitle: 'Comprehensive funeral services tailored to your needs',
            titleSize: 36,
            subtitleSize: 18,
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-ground, #f8f9fa)',
            cardBackgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            iconSize: 48,
            iconColor: 'var(--primary-color, #007bff)',
            serviceTitleSize: 20,
            serviceTitleColor: 'var(--text-color, #000000)',
            descriptionSize: 14,
            descriptionColor: 'var(--muted-color, #6c757d)',
            featureTextSize: 13,
            featureTextColor: 'var(--text-dark, #333333)',
            checkmarkColor: 'var(--success-color, #28a745)',
            priceColor: 'var(--primary-color, #007bff)',
            periodColor: 'var(--muted-color, #6c757d)',
            originalPriceColor: 'var(--muted-color, #999999)',
            buttonColor: 'var(--primary-color, #007bff)',
            buttonTextColor: 'var(--primary-contrast-color, #ffffff)',
            featuredButtonColor: 'var(--success-color, #28a745)',
            featuredButtonTextColor: 'var(--primary-contrast-color, #ffffff)',
            currency: 'R',
            featuredBadgeText: 'Popular',
            showViewAllButton: true,
            viewAllButtonText: 'View All Services',
            viewAllButtonColor: 'var(--success-color, #28a745)',
            viewAllButtonTextColor: 'var(--primary-contrast-color, #ffffff)',
            allServicesUrl: '',
            services: [
                {
                    title: 'Funeral Cover',
                    description: 'Comprehensive funeral insurance to protect your family in difficult times.',
                    icon: 'pi pi-shield',
                    imageUrl: '',
                    features: ['Up to R100,000 coverage', '24/7 Claims support', 'Nationwide service'],
                    buttonText: 'Get Quote',
                    buttonLink: '',
                    featured: true,
                    pricing: {
                        price: 150,
                        period: 'month',
                        originalPrice: null
                    }
                },
                {
                    title: 'Burial Services',
                    description: 'Professional burial services with dignity and respect for your loved ones.',
                    icon: 'pi pi-heart',
                    imageUrl: '',
                    features: ['Professional service', 'Ceremonial arrangements', 'Family support'],
                    buttonText: 'Learn More',
                    buttonLink: '',
                    featured: false,
                    pricing: null
                },
                {
                    title: 'Memorial Services',
                    description: 'Beautiful memorial services to celebrate the life of your loved one.',
                    icon: 'pi pi-star',
                    imageUrl: '',
                    features: ['Custom ceremonies', 'Memorial products', 'Grief counseling'],
                    buttonText: 'Contact Us',
                    buttonLink: '',
                    featured: false,
                    pricing: null
                }
            ]
        },
        icon: 'briefcase'
    },
    {
        name: 'premium-calculator',
        component: PremiumCalculatorWidgetComponent,
        editorComponent: PremiumCalculatorEditorComponent,
        defaultConfig: {
            title: 'Calculate Your Premium',
            subtitle: 'Get an instant quote for your funeral cover',
            titleSize: 36,
            subtitleSize: 18,
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-ground, #f8f9fa)',
            cardBackgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            labelColor: 'var(--text-dark, #333333)',
            calculateButtonText: 'Calculate Premium',
            buttonColor: 'var(--primary-color, #007bff)',
            buttonTextColor: 'var(--primary-contrast-color, #ffffff)',
            signupButtonText: 'Sign Up Now',
            signupButtonColor: 'var(--success-color, #28a745)',
            signupButtonTextColor: 'var(--primary-contrast-color, #ffffff)',
            signupUrl: '/register',
            currency: 'R',
            resultLabel: 'Your Estimated Monthly Premium',
            resultPeriod: 'per month',
            resultBackgroundColor: 'var(--surface-card, #e8f5e9)',
            resultBorderColor: 'var(--success-color, #4caf50)',
            resultLabelColor: 'var(--text-dark, #333333)',
            resultAmountColor: 'var(--success-color, #2e7d32)',
            resultPeriodColor: 'var(--muted-color, #666666)'
        },
        icon: 'calculator'
    },
    {
        name: 'features',
        component: FeaturesWidgetComponent,
        editorComponent: FeaturesEditorComponent,
        defaultConfig: {
            title: 'Our Features',
            titleColor: 'var(--text-color, #000000)',
            backgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            iconSize: 48,
            iconColor: 'var(--primary-color, #007bff)',
            featureTitleColor: 'var(--text-color, #000000)',
            featureTextColor: 'var(--muted-color, #6c757d)',
            features: [
                { icon: 'pi pi-check', title: 'Feature One', text: 'Lorem ipsum dolor sit amet.' },
                { icon: 'pi pi-check', title: 'Feature Two', text: 'Lorem ipsum dolor sit amet.' },
                { icon: 'pi pi-check', title: 'Feature Three', text: 'Lorem ipsum dolor sit amet.' }
            ]
        },
        icon: 'list'
    },
    {
        name: 'cta',
        component: CtaWidgetComponent,
        editorComponent: CtaEditorComponent,
        defaultConfig: {
            title: 'Call to Action',
            text: 'This is a call to action section.',
            textColor: 'var(--primary-contrast-color, #ffffff)',
            backgroundColor: 'var(--primary-color, #007bff)',
            padding: 40,
            buttonText: 'Get Started',
            buttonLink: '#',
            buttonColor: 'var(--primary-contrast-color, #ffffff)',
            buttonTextColor: 'var(--primary-color, #007bff)'
        },
        icon: 'bolt'
    },
    {
        name: 'gallery',
        component: GalleryWidgetComponent,
        editorComponent: GalleryEditorComponent,
        defaultConfig: {
            title: 'Our Gallery',
            padding: 20,
            images: [
                { src: 'https://via.placeholder.com/300', alt: 'Placeholder Image' },
                { src: 'https://via.placeholder.com/300', alt: 'Placeholder Image' },
                { src: 'https://via.placeholder.com/300', alt: 'Placeholder Image' }
            ]
        },
        icon: 'images'
    },
    {
        name: 'policy-comparison',
        component: PolicyComparisonWidgetComponent,
        editorComponent: PolicyComparisonEditorComponent,
        defaultConfig: {
            title: 'Compare Policies',
            policyIds: [] // This will store the IDs of policies to compare
        },
        icon: 'balance-scale' // Assuming a suitable icon from PrimeIcons
    },
    {
        name: 'contact-us',
        component: ContactUsWidgetComponent,
        editorComponent: ContactUsEditorComponent,
        defaultConfig: {
            title: 'Contact Us',
            branches: [],
            socialMediaHandles: []
        },
        icon: 'phone' // Assuming a suitable icon from PrimeIcons
    },
    {
        name: 'team-editor',
        component: TeamEditorWidgetComponent,
        editorComponent: TeamEditorComponent,
        defaultConfig: {
            title: 'Our Team',
            teamMembers: []
        },
        icon: 'users' // Assuming a suitable icon from PrimeIcons
    },
    {
        name: 'about-us',
        component: AboutUsWidgetComponent,
        editorComponent: AboutUsEditorComponent,
        defaultConfig: {
            title: 'About Us',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            imageUrl: null
        },
        icon: 'info-circle' // Assuming a suitable icon from PrimeIcons
    },
    {
        name: 'image-content',
        component: ImageContentWidgetComponent,
        editorComponent: ImageContentEditorComponent,
        defaultConfig: {
            imagePosition: 'left',
            imageUrl: '',
            imageBorderRadius: 8,
            enableImageShadow: true,
            title: 'Section Title',
            titleColor: 'var(--text-color, #000000)',
            titleSize: 32,
            subtitle: '',
            subtitleColor: 'var(--text-dark, #333333)',
            subtitleSize: 20,
            text: 'Add your content here. This section combines an image with compelling content, title, subtitle, and a call-to-action button.',
            textColor: 'var(--muted-color, #666666)',
            textSize: 16,
            lineHeight: '1.6',
            showButton: true,
            buttonText: 'Learn More',
            buttonLink: '#',
            buttonColor: 'var(--primary-color, #007bff)',
            buttonTextColor: 'var(--primary-contrast-color, #ffffff)',
            buttonTextSize: 16,
            buttonPadding: '12px 24px',
            backgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            titleMarginBottom: 16,
            subtitleMarginBottom: 12,
            textMarginBottom: 24,
            imageFillMode: 'none',
            imageHeight: 300,
            imageWidth: null
        },
        icon: 'image'
    },
    {
        name: 'comparison-table',
        component: ComparisonTableWidgetComponent,
        editorComponent: ComparisonTableEditorComponent,
        defaultConfig: {
            title: 'Cost Comparison',
            subtitle: 'Traditional Website Development vs Our Platform',
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-card, #ffffff)',
            padding: 40,
            borderRadius: 8,
            showBorders: true,
            columnHeaderBg: 'var(--surface-ground, #f8f9fa)',
            rowHoverEffect: true,
            columns: [
                {
                    title: 'Traditional Route',
                    subtitle: 'What you pay separately',
                    isHighlighted: false,
                    highlightColor: 'var(--danger-bg, #f8d7da)',
                    items: [
                        { label: 'Domain Purchase', value: 'R150-R500/year' },
                        { label: 'Web Hosting', value: 'R80-R500/month' },
                        { label: 'Website Development', value: 'R5,000-R50,000' },
                        { label: 'Maintenance', value: 'R500-R2,000/month' },
                        { label: 'Management Software', value: 'R1,500-R5,000/month' }
                    ],
                    total: 'R15,000-R80,000+'
                },
                {
                    title: 'Our Platform',
                    subtitle: 'Everything included',
                    isHighlighted: true,
                    highlightColor: 'var(--success-bg, #d4edda)',
                    items: [
                        { label: 'Custom Subdomain', value: 'Included ✓' },
                        { label: 'Enterprise Hosting', value: 'Included ✓' },
                        { label: 'Professional Website', value: 'Included ✓' },
                        { label: 'Updates & Support', value: 'Included ✓' },
                        { label: 'Business Tools', value: 'Included ✓' }
                    ],
                    total: 'R[Your Price]/month'
                }
            ]
        },
        icon: 'table'
    },
    {
        name: 'process-steps',
        component: ProcessStepsWidgetComponent,
        editorComponent: ProcessStepsEditorComponent,
        defaultConfig: {
            title: 'How to Get Started',
            subtitle: 'Your funeral service platform in 5 simple steps',
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-card, #ffffff)',
            stepBackgroundColor: 'var(--surface-ground, #f8f9fa)',
            stepNumberColor: 'var(--primary-color, #0d6efd)',
            iconColor: 'var(--primary-color, #0d6efd)',
            connectorColor: 'var(--surface-border, #dee2e6)',
            padding: 40,
            layout: 'horizontal',
            showConnectors: true,
            showCTA: false,
            ctaText: 'Get Started Now',
            ctaUrl: '/auth/register',
            ctaStyle: 'primary',
            steps: [
                {
                    number: 1,
                    icon: 'bi bi-person-plus-fill',
                    title: 'Sign Up',
                    description: 'Create your account and choose your subdomain in under 2 minutes'
                },
                {
                    number: 2,
                    icon: 'bi bi-palette-fill',
                    title: 'Customize',
                    description: 'Add your logo, colors, and branding with our drag-and-drop builder'
                },
                {
                    number: 3,
                    icon: 'bi bi-sliders',
                    title: 'Configure',
                    description: 'Set up your policies, services, and pricing structure'
                },
                {
                    number: 4,
                    icon: 'bi bi-rocket-takeoff-fill',
                    title: 'Publish',
                    description: 'Go live with one click - your professional website is ready'
                },
                {
                    number: 5,
                    icon: 'bi bi-graph-up-arrow',
                    title: 'Grow',
                    description: 'Register members and manage your business efficiently'
                }
            ]
        },
        icon: 'list-ol'
    },
    {
        name: 'stats-counter',
        component: StatsCounterWidgetComponent,
        editorComponent: StatsCounterEditorComponent,
        defaultConfig: {
            title: 'Our Platform by the Numbers',
            subtitle: 'Trusted by funeral service providers nationwide',
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-ground, #f8f9fa)',
            statBackgroundColor: 'var(--surface-card, #ffffff)',
            valueColor: 'var(--primary-color, #0d6efd)',
            labelColor: 'var(--text-dark, #495057)',
            iconColor: 'var(--primary-color, #0d6efd)',
            padding: 60,
            columns: 4,
            animateOnScroll: true,
            stats: [
                {
                    icon: 'bi bi-clock-fill',
                    value: '10',
                    label: 'Minutes to Setup',
                    prefix: '',
                    suffix: ' min'
                },
                {
                    icon: 'bi bi-check-circle-fill',
                    value: '99.9',
                    label: 'Uptime Guarantee',
                    prefix: '',
                    suffix: '%'
                },
                {
                    icon: 'bi bi-currency-dollar',
                    value: '15,000',
                    label: 'Average Savings',
                    prefix: 'R',
                    suffix: '+'
                },
                {
                    icon: 'bi bi-people-fill',
                    value: '500',
                    label: 'Active Users',
                    prefix: '',
                    suffix: '+'
                }
            ]
        },
        icon: 'bar-chart'
    },
    {
        name: 'benefits-checklist',
        component: BenefitsChecklistWidgetComponent,
        editorComponent: BenefitsChecklistEditorComponent,
        defaultConfig: {
            title: 'Everything You Need, All in One Place',
            subtitle: 'No separate systems, no hidden costs, no technical headaches',
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-card, #ffffff)',
            iconColor: 'var(--success-color, #198754)',
            textColor: 'var(--text-color, #212529)',
            padding: 40,
            columns: 2,
            useCategories: false,
            allowExpand: true,
            benefits: [
                { icon: 'bi bi-check-circle-fill', text: 'Professional website with custom subdomain' },
                { icon: 'bi bi-check-circle-fill', text: 'Complete member management system' },
                { icon: 'bi bi-check-circle-fill', text: 'Claims processing workflow' },
                { icon: 'bi bi-check-circle-fill', text: 'Document management and storage' },
                { icon: 'bi bi-check-circle-fill', text: 'Payment tracking and reporting' },
                { icon: 'bi bi-check-circle-fill', text: 'SSL security included' },
                { icon: 'bi bi-check-circle-fill', text: 'Daily automatic backups' },
                { icon: 'bi bi-check-circle-fill', text: '24/7 customer support' }
            ],
            categories: []
        },
        icon: 'check-square'
    },
    {
        name: 'feature-grid',
        component: FeatureGridWidgetComponent,
        editorComponent: FeatureGridEditorComponent,
        defaultConfig: {
            title: 'Powerful Features for Modern Funeral Services',
            subtitle: 'Everything you need to run your business professionally',
            titleColor: 'var(--text-color, #000000)',
            subtitleColor: 'var(--muted-color, #6c757d)',
            backgroundColor: 'var(--surface-card, #ffffff)',
            cardBackgroundColor: 'var(--surface-ground, #f8f9fa)',
            iconColor: 'var(--primary-color, #0d6efd)',
            iconBackgroundColor: 'var(--surface-card, #e7f1ff)',
            titleTextColor: 'var(--text-color, #212529)',
            descriptionTextColor: 'var(--muted-color, #6c757d)',
            padding: 60,
            columns: 3,
            hoverEffect: true,
            iconSize: 'large',
            features: [
                {
                    icon: 'bi bi-globe',
                    title: 'Professional Website',
                    description: 'Beautiful, mobile-responsive website with your custom subdomain'
                },
                {
                    icon: 'bi bi-people',
                    title: 'Member Management',
                    description: 'Complete system for registering and managing members'
                },
                {
                    icon: 'bi bi-file-text',
                    title: 'Claims Processing',
                    description: 'Streamlined workflow from submission to approval'
                },
                {
                    icon: 'bi bi-shield-check',
                    title: 'Secure & Compliant',
                    description: 'Bank-level security with automatic backups'
                },
                {
                    icon: 'bi bi-speedometer2',
                    title: 'Real-time Analytics',
                    description: 'Comprehensive dashboards and business insights'
                },
                {
                    icon: 'bi bi-headset',
                    title: '24/7 Support',
                    description: 'Always available to help you succeed'
                }
            ]
        },
        icon: 'grid-3x3'
    },
    // Medium-Priority Landing Page Widgets
    {
        name: 'timeline-comparison',
        component: TimelineComparisonWidgetComponent,
        editorComponent: TimelineComparisonEditorComponent,
        defaultConfig: {
            settings: {
                title: 'Time to Market Comparison',
                subtitle: 'See how fast you can get your business online',
                showSteps: true,
                highlightRecommended: true
            },
            options: [
                {
                    title: 'Traditional Website Development',
                    subtitle: 'The conventional approach',
                    duration: '2-4',
                    durationUnit: 'months',
                    steps: [
                        { label: 'Domain registration & DNS setup', duration: '2-3 days' },
                        { label: 'Design discussions & mockups', duration: '1-2 weeks' },
                        { label: 'Development & revisions', duration: '4-12 weeks' },
                        { label: 'Content creation & population', duration: '1-2 weeks' },
                        { label: 'Testing & launch', duration: '1 week' }
                    ],
                    totalLabel: 'Total Time: 2-4 months',
                    isRecommended: false
                },
                {
                    title: 'Our Platform',
                    subtitle: 'Modern, efficient approach',
                    duration: '10',
                    durationUnit: 'minutes',
                    steps: [
                        { label: 'Sign up & choose subdomain', duration: '2 minutes' },
                        { label: 'Select professional template', duration: '1 minute' },
                        { label: 'Customize with drag-and-drop', duration: '5-10 minutes' },
                        { label: 'Publish your site', duration: '1 click' }
                    ],
                    totalLabel: 'Total Time: Under 10 minutes',
                    isRecommended: true,
                    highlightColor: 'var(--success-color, #28a745)'
                }
            ]
        },
        icon: 'clock-history'
    },
    {
        name: 'use-case-cards',
        component: UseCaseCardsWidgetComponent,
        editorComponent: UseCaseCardsEditorComponent,
        defaultConfig: {
            settings: {
                title: 'Ideal For',
                subtitle: 'Who benefits most from our platform',
                columns: 3,
                showFeatures: true,
                showCta: true
            },
            cards: [
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
            ]
        },
        icon: 'award'
    },
    {
        name: 'video-embed',
        component: VideoEmbedWidgetComponent,
        editorComponent: VideoEmbedEditorComponent,
        defaultConfig: {
            settings: {
                title: 'Watch Our Demo',
                subtitle: 'See the platform in action',
                videoUrl: '',
                provider: 'youtube',
                aspectRatio: '16:9',
                autoplay: false,
                controls: true,
                loop: false,
                muted: false,
                caption: ''
            }
        },
        icon: 'camera-video'
    },
    {
        name: 'logo-cloud',
        component: LogoCloudWidgetComponent,
        editorComponent: LogoCloudEditorComponent,
        defaultConfig: {
            settings: {
                title: 'Trusted By Leading Funeral Homes',
                subtitle: 'Join hundreds of funeral service providers who trust our platform',
                layout: 'grid',
                columns: 4,
                grayscale: true,
                hoverColor: true,
                logoSize: 'medium'
            },
            logos: [
                {
                    name: 'Partner 1',
                    imageUrl: 'https://via.placeholder.com/150x60?text=Partner+1',
                    link: '',
                    altText: 'Partner 1 Logo'
                },
                {
                    name: 'Partner 2',
                    imageUrl: 'https://via.placeholder.com/150x60?text=Partner+2',
                    link: '',
                    altText: 'Partner 2 Logo'
                },
                {
                    name: 'Partner 3',
                    imageUrl: 'https://via.placeholder.com/150x60?text=Partner+3',
                    link: '',
                    altText: 'Partner 3 Logo'
                },
                {
                    name: 'Partner 4',
                    imageUrl: 'https://via.placeholder.com/150x60?text=Partner+4',
                    link: '',
                    altText: 'Partner 4 Logo'
                }
            ]
        },
        icon: 'images'
    },
    {
        name: 'tabbed-content',
        component: TabbedContentWidgetComponent,
        editorComponent: TabbedContentEditorComponent,
        defaultConfig: {
            settings: {
                title: 'Our Platform Features',
                subtitle: 'Everything you need in one place',
                tabStyle: 'pills',
                orientation: 'horizontal',
                showIcons: true
            },
            tabs: [
                {
                    id: 'tab-1',
                    title: 'Website Builder',
                    icon: 'globe',
                    content: '<h3>Professional Website Builder</h3><p>Create stunning websites with our drag-and-drop builder. No coding required.</p><ul><li>Drag-and-drop interface</li><li>Mobile-responsive designs</li><li>Customizable templates</li></ul>'
                },
                {
                    id: 'tab-2',
                    title: 'Member Management',
                    icon: 'people',
                    content: '<h3>Complete Member Management</h3><p>Manage all your members, policies, and claims in one centralized system.</p><ul><li>Member registration portal</li><li>Policy management</li><li>Claims processing</li></ul>'
                },
                {
                    id: 'tab-3',
                    title: 'Analytics',
                    icon: 'bar-chart',
                    content: '<h3>Business Analytics</h3><p>Get insights into your business performance with real-time analytics and reporting.</p><ul><li>Real-time dashboards</li><li>Custom reports</li><li>Performance metrics</li></ul>'
                }
            ]
        },
        icon: 'menu-button-wide'
    },
    {
        name: 'enhanced-accordion',
        component: EnhancedAccordionWidgetComponent,
        editorComponent: EnhancedAccordionEditorComponent,
        defaultConfig: {
            settings: {
                title: 'Frequently Asked Questions',
                subtitle: 'Find answers to common questions',
                allowMultiple: true,
                showIcons: true,
                enableSearch: true,
                expandAllButton: true
            },
            items: [
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
            ]
        },
        icon: 'question-circle'
    },
    // Landing page widgets - Nice to Have
    {
        name: 'testimonial-carousel',
        component: TestimonialCarouselWidgetComponent,
        editorComponent: TestimonialCarouselEditorComponent,
        defaultConfig: {
            title: 'What Our Clients Say',
            subtitle: 'Join hundreds of satisfied customers who trust us',
            settings: {
                autoPlay: true,
                autoPlayInterval: 5000,
                showRatings: true,
                showImages: true,
                layout: 'single'
            },
            testimonials: [
                {
                    name: 'Sarah Mitchell',
                    role: 'Director',
                    company: 'Peaceful Rest Funeral Services',
                    content: 'We had our website up and running in just 8 minutes. The platform is incredibly intuitive, and our members love the self-service portal.',
                    rating: 5,
                    imageUrl: 'https://via.placeholder.com/100x100?text=SM'
                },
                {
                    name: 'John Khumalo',
                    role: 'Owner',
                    company: 'Heritage Funeral Home',
                    content: 'The unified platform brought all our tools together. We\'ve reduced administrative time by 60% and can focus more on serving families.',
                    rating: 5,
                    imageUrl: 'https://via.placeholder.com/100x100?text=JK'
                },
                {
                    name: 'Patricia Louw',
                    role: 'Manager',
                    company: 'Community Burial Society',
                    content: 'We\'ve saved over R5,000 per month by consolidating our tools. The ROI was clear within the first month!',
                    rating: 5,
                    imageUrl: 'https://via.placeholder.com/100x100?text=PL'
                }
            ]
        },
        icon: 'chat-quote'
    },
    {
        name: 'pricing-cards',
        component: PricingCardsWidgetComponent,
        editorComponent: PricingCardsEditorComponent,
        defaultConfig: {
            title: 'Choose Your Plan',
            subtitle: 'Select the perfect plan for your funeral service business',
            settings: {
                showBillingToggle: false,
                billingLabel: 'Monthly / Annual',
                columns: 3
            },
            tiers: [
                {
                    name: 'Starter',
                    description: 'Perfect for small funeral homes',
                    price: 'R2,999',
                    pricePeriod: '/ month',
                    features: [
                        { text: 'Up to 50 member profiles', included: true },
                        { text: 'Basic website builder', included: true },
                        { text: 'Payment processing', included: true },
                        { text: 'Email support', included: true },
                        { text: 'Custom domain', included: false },
                        { text: 'Advanced analytics', included: false },
                        { text: 'Priority support', included: false }
                    ],
                    ctaText: 'Start Free Trial',
                    ctaLink: '#',
                    isPopular: false
                },
                {
                    name: 'Professional',
                    description: 'Most popular choice',
                    price: 'R5,999',
                    pricePeriod: '/ month',
                    originalPrice: 'R7,999',
                    features: [
                        { text: 'Up to 500 member profiles', included: true },
                        { text: 'Advanced website builder', included: true },
                        { text: 'Payment processing', included: true },
                        { text: 'Priority email & phone support', included: true },
                        { text: 'Custom domain', included: true },
                        { text: 'Advanced analytics', included: true },
                        { text: 'WhatsApp integration', included: true },
                        { text: 'Multi-user access', included: false }
                    ],
                    ctaText: 'Start Free Trial',
                    ctaLink: '#',
                    isPopular: true
                },
                {
                    name: 'Enterprise',
                    description: 'For established businesses',
                    price: 'R12,999',
                    pricePeriod: '/ month',
                    features: [
                        { text: 'Unlimited member profiles', included: true },
                        { text: 'Enterprise website builder', included: true },
                        { text: 'Payment processing', included: true },
                        { text: 'Dedicated account manager', included: true },
                        { text: 'Custom domain & branding', included: true },
                        { text: 'Advanced analytics & reporting', included: true },
                        { text: 'WhatsApp & SMS integration', included: true },
                        { text: 'Multi-user access with roles', included: true },
                        { text: 'Custom integrations', included: true },
                        { text: 'SLA guarantee', included: true }
                    ],
                    ctaText: 'Contact Sales',
                    ctaLink: '#',
                    isPopular: false
                }
            ]
        },
        icon: 'cash-coin'
    },
    {
        name: 'cta-banner',
        component: CTABannerWidgetComponent,
        editorComponent: CTABannerEditorComponent,
        defaultConfig: {
            headline: 'Ready to Transform Your Business?',
            subheadline: 'Join hundreds of funeral service providers who have modernized their operations with our platform.',
            buttons: [
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
            ],
            settings: {
                backgroundType: 'gradient',
                backgroundColor: 'var(--primary-color, #007bff)',
                gradientStart: 'var(--primary-color, #007bff)',
                gradientEnd: 'var(--primary-dark, #0056b3)',
                backgroundImage: '',
                overlayOpacity: 0.5,
                textColor: 'light',
                alignment: 'center',
                paddingSize: 'large'
            }
        },
        icon: 'megaphone'
    },
    {
        name: 'contact-card',
        component: ContactCardWidgetComponent,
        editorComponent: ContactCardEditorComponent,
        defaultConfig: {
            title: 'Get In Touch',
            subtitle: 'We\'re here to help. Reach out to us through any of these channels.',
            settings: {
                showMap: false,
                mapEmbedUrl: '',
                layout: 'single',
                backgroundColor: 'var(--surface-ground, #f8f9fa)',
                iconColor: 'var(--primary-color, #007bff)'
            },
            contactMethods: [
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
            ]
        },
        icon: 'telephone'
    }
];
