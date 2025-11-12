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

export interface WidgetType {
    name: string;
    component: Type<any>;
    editorComponent: Type<any>;
    defaultConfig: any;
    icon: string;
}

export const WIDGET_TYPES: WidgetType[] = [
    {
        name: 'hero',
        component: HeroWidgetComponent,
        editorComponent: HeroEditorComponent,
        defaultConfig: {
            title: 'Welcome to Our Site',
            titleSize: 36,
            subtitle: 'This is a customizable hero section',
            subtitleSize: 18,
            backgroundColor: '#f8f9fa',
            textColor: '#212529',
            padding: 40,
            buttonText: 'Learn More',
            buttonLink: '#',
            buttonColor: '#007bff',
            buttonTextColor: '#ffffff',
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
            titleColor: '#000000',
            backgroundColor: '#f8f9fa',
            cardBackgroundColor: '#ffffff',
            padding: 40,
            iconSize: 48,
            iconColor: '#007bff',
            numberColor: '#007bff',
            labelColor: '#000000',
            labelSize: 16,
            descriptionColor: '#6c757d',
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
            titleColor: '#000000',
            backgroundColor: '#f8f9fa',
            cardBackgroundColor: '#ffffff',
            padding: 40,
            numVisible: 1,
            autoplayInterval: 5000,
            textColor: '#333333',
            textSize: 16,
            nameColor: '#000000',
            nameSize: 18,
            positionColor: '#6c757d',
            starColor: '#ffc107',
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
            titleColor: '#000000',
            subtitleColor: '#6c757d',
            backgroundColor: '#f8f9fa',
            cardBackgroundColor: '#ffffff',
            padding: 40,
            currency: 'R',
            defaultButtonText: 'Choose Plan',
            priceColor: '#007bff',
            periodColor: '#6c757d',
            featureTextColor: '#333333',
            checkmarkColor: '#28a745',
            buttonColor: '#007bff',
            buttonTextColor: '#ffffff',
            featuredButtonColor: '#28a745',
            featuredButtonTextColor: '#ffffff',
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
            titleColor: '#000000',
            subtitleColor: '#6c757d',
            backgroundColor: '#ffffff',
            padding: 40,
            answerColor: '#333333',
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
            titleColor: '#000000',
            subtitleColor: '#6c757d',
            backgroundColor: '#f8f9fa',
            formBackgroundColor: '#ffffff',
            padding: 40,
            labelColor: '#333333',
            buttonText: 'Get My Quote',
            buttonColor: '#007bff',
            buttonTextColor: '#ffffff',
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
            titleColor: '#000000',
            subtitleColor: '#6c757d',
            backgroundColor: '#f8f9fa',
            cardBackgroundColor: '#ffffff',
            padding: 40,
            articleTitleSize: 18,
            excerptSize: 14,
            titleTextColor: '#000000',
            excerptColor: '#6c757d',
            dateColor: '#999999',
            authorColor: '#666666',
            categoryBackgroundColor: '#007bff',
            categoryTextColor: '#ffffff',
            buttonColor: '#007bff',
            buttonTextColor: '#ffffff',
            readMoreText: 'Read More',
            showViewAllButton: true,
            viewAllButtonText: 'View All News',
            viewAllButtonColor: '#28a745',
            viewAllButtonTextColor: '#ffffff',
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
            titleColor: '#000000',
            subtitleColor: '#6c757d',
            backgroundColor: '#f8f9fa',
            cardBackgroundColor: '#ffffff',
            padding: 40,
            iconSize: 48,
            iconColor: '#007bff',
            serviceTitleSize: 20,
            serviceTitleColor: '#000000',
            descriptionSize: 14,
            descriptionColor: '#6c757d',
            featureTextSize: 13,
            featureTextColor: '#333333',
            checkmarkColor: '#28a745',
            priceColor: '#007bff',
            periodColor: '#6c757d',
            originalPriceColor: '#999999',
            buttonColor: '#007bff',
            buttonTextColor: '#ffffff',
            featuredButtonColor: '#28a745',
            featuredButtonTextColor: '#ffffff',
            currency: 'R',
            featuredBadgeText: 'Popular',
            showViewAllButton: true,
            viewAllButtonText: 'View All Services',
            viewAllButtonColor: '#28a745',
            viewAllButtonTextColor: '#ffffff',
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
            titleColor: '#000000',
            subtitleColor: '#6c757d',
            backgroundColor: '#f8f9fa',
            cardBackgroundColor: '#ffffff',
            padding: 40,
            labelColor: '#333333',
            calculateButtonText: 'Calculate Premium',
            buttonColor: '#007bff',
            buttonTextColor: '#ffffff',
            signupButtonText: 'Sign Up Now',
            signupButtonColor: '#28a745',
            signupButtonTextColor: '#ffffff',
            signupUrl: '/register',
            currency: 'R',
            resultLabel: 'Your Estimated Monthly Premium',
            resultPeriod: 'per month',
            resultBackgroundColor: '#e8f5e9',
            resultBorderColor: '#4caf50',
            resultLabelColor: '#333333',
            resultAmountColor: '#2e7d32',
            resultPeriodColor: '#666666'
        },
        icon: 'calculator'
    },
    {
        name: 'features',
        component: FeaturesWidgetComponent,
        editorComponent: FeaturesEditorComponent,
        defaultConfig: {
            title: 'Our Features',
            titleColor: '#000000',
            backgroundColor: '#ffffff',
            padding: 40,
            iconSize: 48,
            iconColor: '#007bff',
            featureTitleColor: '#000000',
            featureTextColor: '#6c757d',
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
            textColor: '#ffffff',
            backgroundColor: '#007bff',
            padding: 40,
            buttonText: 'Get Started',
            buttonLink: '#',
            buttonColor: '#ffffff',
            buttonTextColor: '#007bff'
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
            titleColor: '#000000',
            titleSize: 32,
            subtitle: '',
            subtitleColor: '#333333',
            subtitleSize: 20,
            text: 'Add your content here. This section combines an image with compelling content, title, subtitle, and a call-to-action button.',
            textColor: '#666666',
            textSize: 16,
            lineHeight: '1.6',
            showButton: true,
            buttonText: 'Learn More',
            buttonLink: '#',
            buttonColor: '#007bff',
            buttonTextColor: '#ffffff',
            buttonTextSize: 16,
            buttonPadding: '12px 24px',
            backgroundColor: '#ffffff',
            padding: 40,
            titleMarginBottom: 16,
            subtitleMarginBottom: 12,
            textMarginBottom: 24,
            imageFillMode: 'none',
            imageHeight: 300,
            imageWidth: null
        },
        icon: 'image'
    }
];
