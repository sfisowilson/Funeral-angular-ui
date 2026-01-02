import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LandingPageTemplate {
    id: string;
    name: string;
    category: string;
    description: string;
    thumbnail: string;
    tenantTypes: string[];
    features: string[];
    components: string[];
    isPremium: boolean;
    previewUrl?: string;
}

export interface GeneratedPage {
    id: string;
    title: string;
    templateId: string;
    components: PageComponent[];
    createdAt: string;
}

export interface PageComponent {
    id: string;
    type: string;
    position: number;
    properties: Record<string, any>;
    content: Record<string, any>;
}

@Injectable({
    providedIn: 'root'
})
export class LandingPageTemplateService {
    private baseUrl = '/api/LandingPage';

    constructor(private http: HttpClient) {}

    getTemplates(): Observable<LandingPageTemplate[]> {
        return this.http.get<LandingPageTemplate[]>(`${this.baseUrl}/templates`);
    }

    getTemplateById(id: string): Observable<LandingPageTemplate> {
        return this.http.get<LandingPageTemplate>(`${this.baseUrl}/templates/${id}`);
    }

    generateLandingPage(templateId: string, pageData: any): Observable<GeneratedPage> {
        return this.http.post<GeneratedPage>(`${this.baseUrl}/generate`, {
            templateId,
            pageData
        });
    }

    saveGeneratedPage(page: GeneratedPage): Observable<GeneratedPage> {
        return this.http.post<GeneratedPage>(`${this.baseUrl}/save`, page);
    }

    // Static template data (can be moved to backend later)
    getStaticTemplates(): LandingPageTemplate[] {
        return [
            // Hair Salon Templates
            {
                id: 'hair-salon-modern',
                name: 'Modern Hair Salon',
                category: 'Hair Salon',
                description: 'Elegant and modern design for hair salons with booking features',
                thumbnail: '/assets/templates/hair-salon-modern.jpg',
                tenantTypes: ['Basic', 'Standard', 'Premium'],
                features: ['Service Booking', 'Price List', 'Gallery', 'Team Profiles', 'Contact Form'],
                components: ['Hero Section', 'Services', 'About Us', 'Gallery', 'Testimonials', 'Contact'],
                isPremium: false
            },
            {
                id: 'hair-salon-luxury',
                name: 'Luxury Hair Studio',
                category: 'Hair Salon',
                description: 'Premium design for high-end hair studios with advanced features',
                thumbnail: '/assets/templates/hair-salon-luxury.jpg',
                tenantTypes: ['Standard', 'Premium'],
                features: ['Online Booking', 'Gift Cards', 'Membership', 'Portfolio', 'Reviews'],
                components: ['Hero Section', 'Services', 'Team', 'Gallery', 'Pricing', 'Testimonials', 'Contact'],
                isPremium: true
            },

            // Construction Templates
            {
                id: 'construction-pro',
                name: 'Construction Pro',
                category: 'Construction',
                description: 'Professional construction website with project showcase',
                thumbnail: '/assets/templates/construction-pro.jpg',
                tenantTypes: ['Basic', 'Standard', 'Premium'],
                features: ['Project Gallery', 'Services', 'Team', 'Contact', 'About'],
                components: ['Hero Section', 'Services', 'Projects', 'About Us', 'Team', 'Contact'],
                isPremium: false
            },
            {
                id: 'construction-enterprise',
                name: 'Enterprise Construction',
                category: 'Construction',
                description: 'Advanced construction website with project management features',
                thumbnail: '/assets/templates/construction-enterprise.jpg',
                tenantTypes: ['Premium'],
                features: ['Project Portfolio', 'Client Portal', 'Team Management', 'Blog', 'Careers'],
                components: ['Hero Section', 'Services', 'Projects', 'About', 'Team', 'Blog', 'Careers', 'Contact'],
                isPremium: true
            },

            // NGO Templates
            {
                id: 'nonprofit-community',
                name: 'Community NGO',
                category: 'NGO',
                description: 'Warm and inviting design for community organizations',
                thumbnail: '/assets/templates/ngo-community.jpg',
                tenantTypes: ['Basic', 'Standard', 'Premium'],
                features: ['Mission Statement', 'Programs', 'Donations', 'Volunteer', 'Events'],
                components: ['Hero Section', 'About', 'Programs', 'Events', 'Donate', 'Volunteer', 'Contact'],
                isPremium: false
            },
            {
                id: 'nonprofit-foundation',
                name: 'Foundation Pro',
                category: 'NGO',
                description: 'Professional foundation website with donation management',
                thumbnail: '/assets/templates/ngo-foundation.jpg',
                tenantTypes: ['Standard', 'Premium'],
                features: ['Grant Applications', 'Impact Reports', 'Donor Recognition', 'Events', 'Blog'],
                components: ['Hero Section', 'About', 'Programs', 'Impact', 'Donate', 'Events', 'Blog', 'Contact'],
                isPremium: true
            },

            // Tailor Shop Templates
            {
                id: 'tailor-boutique',
                name: 'Boutique Tailor',
                category: 'Tailor',
                description: 'Elegant design for custom tailoring services',
                thumbnail: '/assets/templates/tailor-boutique.jpg',
                tenantTypes: ['Basic', 'Standard', 'Premium'],
                features: ['Services', 'Gallery', 'Pricing', 'Booking', 'Contact'],
                components: ['Hero Section', 'Services', 'Gallery', 'Pricing', 'About', 'Contact'],
                isPremium: false
            },
            {
                id: 'tailor-fashion',
                name: 'Fashion House',
                category: 'Tailor',
                description: 'High-end fashion house with advanced portfolio features',
                thumbnail: '/assets/templates/tailor-fashion.jpg',
                tenantTypes: ['Standard', 'Premium'],
                features: ['Collection Gallery', 'Custom Orders', 'Fashion Blog', 'Lookbook', 'Appointments'],
                components: ['Hero Section', 'Collections', 'Lookbook', 'Services', 'About', 'Blog', 'Contact'],
                isPremium: true
            },

            // Art Shop Templates
            {
                id: 'art-gallery',
                name: 'Art Gallery',
                category: 'Art Shop',
                description: 'Beautiful gallery for artists and art shops',
                thumbnail: '/assets/templates/art-gallery.jpg',
                tenantTypes: ['Basic', 'Standard', 'Premium'],
                features: ['Gallery', 'Artist Bio', 'Shop', 'Exhibitions', 'Contact'],
                components: ['Hero Section', 'Gallery', 'About Artist', 'Shop', 'Exhibitions', 'Contact'],
                isPremium: false
            },
            {
                id: 'art-marketplace',
                name: 'Art Marketplace',
                category: 'Art Shop',
                description: 'Full-featured art marketplace with e-commerce',
                thumbnail: '/assets/templates/art-marketplace.jpg',
                tenantTypes: ['Premium'],
                features: ['Artist Profiles', 'Online Store', 'Auctions', 'Events', 'Blog'],
                components: ['Hero Section', 'Featured Artists', 'Marketplace', 'Events', 'Blog', 'Contact'],
                isPremium: true
            },

            // Funeral Home Templates
            {
                id: 'funeral-traditional',
                name: 'Traditional Funeral Home',
                category: 'Funeral',
                description: 'Classic and respectful design for traditional funeral homes',
                thumbnail: '/assets/templates/funeral-traditional.jpg',
                tenantTypes: ['Basic', 'Standard', 'Premium'],
                features: ['About Us', 'Services', 'Obituaries', 'Contact', 'Location'],
                components: ['Hero Section', 'About', 'Services', 'Obituaries', 'Contact'],
                isPremium: false
            },
            {
                id: 'funeral-modern',
                name: 'Modern Memorial Services',
                category: 'Funeral',
                description: 'Contemporary design for modern funeral and memorial services',
                thumbnail: '/assets/templates/funeral-modern.jpg',
                tenantTypes: ['Standard', 'Premium'],
                features: ['Services', 'Pre-Planning', 'Grief Support', 'Resources', 'Contact'],
                components: ['Hero Section', 'Services', 'Pre-Planning', 'Resources', 'Contact'],
                isPremium: true
            },
            {
                id: 'funeral-cremation',
                name: 'Cremation Services Center',
                category: 'Funeral',
                description: 'Specialized design for cremation service providers',
                thumbnail: '/assets/templates/funeral-cremation.jpg',
                tenantTypes: ['Basic', 'Standard', 'Premium'],
                features: ['Cremation Services', 'Memorial Options', 'Pricing', 'FAQ', 'Contact'],
                components: ['Hero Section', 'Services', 'Memorial Options', 'Pricing', 'FAQ', 'Contact'],
                isPremium: false
            },

            // Professional Profile Templates
            {
                id: 'professional-basic',
                name: 'Professional Profile',
                category: 'Professional',
                description: 'Clean and professional personal website',
                thumbnail: '/assets/templates/professional-basic.jpg',
                tenantTypes: ['Basic', 'Standard', 'Premium'],
                features: ['About', 'Services', 'Portfolio', 'Resume', 'Contact'],
                components: ['Hero Section', 'About', 'Services', 'Portfolio', 'Resume', 'Contact'],
                isPremium: false
            },
            {
                id: 'professional-consultant',
                name: 'Consultant Pro',
                category: 'Professional',
                description: 'Advanced consultant website with client portal',
                thumbnail: '/assets/templates/professional-consultant.jpg',
                tenantTypes: ['Standard', 'Premium'],
                features: ['Consulting Services', 'Case Studies', 'Client Portal', 'Blog', 'Speaking'],
                components: ['Hero Section', 'Services', 'Case Studies', 'About', 'Blog', 'Speaking', 'Contact'],
                isPremium: true
            },

            // Ecommerce Templates
            {
                id: 'ecommerce-basic',
                name: 'Basic Online Store',
                category: 'Ecommerce',
                description: 'Simple and effective online store for small businesses',
                thumbnail: '/assets/templates/ecommerce-basic.jpg',
                tenantTypes: ['Ecommerce'],
                features: ['Product Catalog', 'Shopping Cart', 'Checkout', 'Contact', 'About'],
                components: ['Hero Section', 'Featured Products', 'Categories', 'About', 'Contact'],
                isPremium: false
            },
            {
                id: 'ecommerce-fashion',
                name: 'Fashion Store',
                category: 'Ecommerce',
                description: 'Elegant ecommerce site for fashion and apparel brands',
                thumbnail: '/assets/templates/ecommerce-fashion.jpg',
                tenantTypes: ['Ecommerce'],
                features: ['Collections', 'Lookbook', 'Product Filters', 'Wishlist', 'Reviews'],
                components: ['Hero Section', 'Featured Products', 'Collections', 'Testimonials', 'Newsletter'],
                isPremium: true
            },
            {
                id: 'ecommerce-electronics',
                name: 'Electronics Store',
                category: 'Ecommerce',
                description: 'Modern electronics and gadgets store with advanced features',
                thumbnail: '/assets/templates/ecommerce-electronics.jpg',
                tenantTypes: ['Ecommerce'],
                features: ['Product Comparison', 'Specifications', 'Reviews', 'Deals', 'Support'],
                components: ['Hero Section', 'Featured Products', 'Categories', 'Deals Banner', 'Support'],
                isPremium: true
            },
            {
                id: 'ecommerce-marketplace',
                name: 'Multi-Vendor Marketplace',
                category: 'Ecommerce',
                description: 'Complete marketplace solution for multi-vendor platforms',
                thumbnail: '/assets/templates/ecommerce-marketplace.jpg',
                tenantTypes: ['Ecommerce'],
                features: ['Vendor Management', 'Multi-Category', 'Advanced Search', 'Ratings', 'Messaging'],
                components: ['Hero Section', 'Categories', 'Featured Vendors', 'Products Grid', 'How It Works'],
                isPremium: true
            }
        ];
    }

    // Generate page components based on template
    generatePageComponents(templateId: string): PageComponent[] {
        const templates: Record<string, PageComponent[]> = {
            'hair-salon-modern': [
                {
                    id: 'hero-1',
                    type: 'hero',
                    position: 0,
                    properties: {
                        title: 'Welcome to Our Salon',
                        subtitle: 'Professional Hair Services',
                        backgroundImage: '/assets/default-hero.jpg',
                        ctaText: 'Book Appointment',
                        ctaLink: '#booking'
                    },
                    content: {}
                },
                {
                    id: 'services-1',
                    type: 'services',
                    position: 1,
                    properties: {
                        title: 'Our Services',
                        showPrices: true,
                        layout: 'grid'
                    },
                    content: {
                        services: [
                            { name: 'Haircut', price: '$30', description: 'Professional haircut and styling' },
                            { name: 'Hair Coloring', price: '$60', description: 'Full hair coloring service' },
                            { name: 'Hair Treatment', price: '$45', description: 'Deep conditioning treatment' }
                        ]
                    }
                },
                {
                    id: 'about-1',
                    type: 'about',
                    position: 2,
                    properties: {
                        title: 'About Us',
                        showTeam: true,
                        layout: 'split'
                    },
                    content: {
                        description: 'We are a professional hair salon dedicated to providing exceptional service...',
                        teamMembers: [
                            { name: 'Jane Smith', role: 'Senior Stylist', image: '/assets/team1.jpg' },
                            { name: 'John Doe', role: 'Color Specialist', image: '/assets/team2.jpg' }
                        ]
                    }
                },
                {
                    id: 'gallery-1',
                    type: 'gallery',
                    position: 3,
                    properties: {
                        title: 'Our Work',
                        layout: 'masonry'
                    },
                    content: {
                        images: [
                            '/assets/gallery1.jpg',
                            '/assets/gallery2.jpg',
                            '/assets/gallery3.jpg'
                        ]
                    }
                },
                {
                    id: 'testimonials-1',
                    type: 'testimonials',
                    position: 4,
                    properties: {
                        title: 'Client Testimonials',
                        layout: 'carousel'
                    },
                    content: {
                        testimonials: [
                            { name: 'Sarah J.', text: 'Amazing service and great results!', rating: 5 },
                            { name: 'Mike R.', text: 'Best salon in town!', rating: 5 }
                        ]
                    }
                },
                {
                    id: 'contact-1',
                    type: 'contact',
                    position: 5,
                    properties: {
                        title: 'Contact Us',
                        showMap: true,
                        showHours: true
                    },
                    content: {
                        phone: '(555) 123-4567',
                        email: 'info@salon.com',
                        address: '123 Main St, City, State 12345',
                        hours: 'Mon-Fri: 9AM-7PM, Sat: 9AM-5PM'
                    }
                }
            ],
            'funeral-traditional': [
                {
                    id: 'hero-1',
                    type: 'hero',
                    position: 0,
                    properties: {
                        title: 'Compassionate Funeral Services',
                        subtitle: 'Serving Families with Dignity and Respect',
                        backgroundImage: '/assets/funeral-hero.jpg',
                        ctaText: 'Contact Us',
                        ctaLink: '#contact'
                    },
                    content: {}
                },
                {
                    id: 'about-1',
                    type: 'about',
                    position: 1,
                    properties: {
                        title: 'About Our Funeral Home',
                        showTeam: true,
                        layout: 'split'
                    },
                    content: {
                        description: 'For over 50 years, we have been providing compassionate funeral services to families in their time of need...',
                        teamMembers: [
                            { name: 'John Smith', role: 'Funeral Director', image: '/assets/funeral-director1.jpg' },
                            { name: 'Mary Johnson', role: 'Service Director', image: '/assets/funeral-director2.jpg' }
                        ]
                    }
                },
                {
                    id: 'services-1',
                    type: 'services',
                    position: 2,
                    properties: {
                        title: 'Our Funeral Services',
                        showPrices: false,
                        layout: 'grid'
                    },
                    content: {
                        services: [
                            { name: 'Traditional Funeral Services', description: 'Complete funeral services with viewing and ceremony' },
                            { name: 'Memorial Services', description: 'Memorial services without viewing' },
                            { name: 'Graveside Services', description: 'Services at the burial site' },
                            { name: 'Cremation Services', description: 'Dignified cremation options' }
                        ]
                    }
                },
                {
                    id: 'obituaries-1',
                    type: 'obituaries',
                    position: 3,
                    properties: {
                        title: 'Recent Obituaries',
                        layout: 'list'
                    },
                    content: {
                        obituaries: [
                            { name: 'Jane Doe', date: '2024-01-15', description: 'Loving mother and grandmother' },
                            { name: 'John Smith', date: '2024-01-12', description: 'Beloved husband and father' }
                        ]
                    }
                },
                {
                    id: 'contact-1',
                    type: 'contact',
                    position: 4,
                    properties: {
                        title: 'Contact Us',
                        showMap: true,
                        showHours: true
                    },
                    content: {
                        phone: '(555) 123-4567',
                        email: 'info@funeralhome.com',
                        address: '123 Memorial Ave, City, State 12345',
                        hours: '24/7 Emergency Service Available'
                    }
                }
            ],
            'funeral-modern': [
                {
                    id: 'hero-1',
                    type: 'hero',
                    position: 0,
                    properties: {
                        title: 'Modern Memorial Services',
                        subtitle: 'Celebrating Lives with Meaningful Tributes',
                        backgroundImage: '/assets/modern-funeral-hero.jpg',
                        ctaText: 'Learn More',
                        ctaLink: '#services'
                    },
                    content: {}
                },
                {
                    id: 'services-1',
                    type: 'services',
                    position: 1,
                    properties: {
                        title: 'Our Services',
                        showPrices: false,
                        layout: 'grid'
                    },
                    content: {
                        services: [
                            { name: 'Pre-Planning', description: 'Plan ahead to ease the burden on your family' },
                            { name: 'Memorial Services', description: 'Personalized memorial celebrations' },
                            { name: 'Grief Support', description: 'Ongoing support for bereaved families' },
                            { name: 'Digital Memorials', description: 'Online memorial websites and tributes' }
                        ]
                    }
                },
                {
                    id: 'preplanning-1',
                    type: 'preplanning',
                    position: 2,
                    properties: {
                        title: 'Plan Ahead',
                        showBenefits: true,
                        layout: 'split'
                    },
                    content: {
                        benefits: [
                            'Lock in current prices',
                            'Personalize your service',
                            'Reduce family burden',
                            'Payment options available'
                        ]
                    }
                },
                {
                    id: 'resources-1',
                    type: 'resources',
                    position: 3,
                    properties: {
                        title: 'Grief Resources',
                        layout: 'grid'
                    },
                    content: {
                        resources: [
                            { title: 'Grief Support Groups', description: 'Weekly support meetings' },
                            { title: 'Aftercare Services', description: 'Ongoing support programs' },
                            { title: 'Helpful Articles', description: 'Resources for coping with loss' }
                        ]
                    }
                },
                {
                    id: 'contact-1',
                    type: 'contact',
                    position: 4,
                    properties: {
                        title: 'Get in Touch',
                        showMap: true,
                        showHours: true
                    },
                    content: {
                        phone: '(555) 987-6543',
                        email: 'care@modernmemorial.com',
                        address: '456 Peace Street, City, State 12345',
                        hours: 'Mon-Fri: 9AM-6PM, Sat: 10AM-2PM'
                    }
                }
            ],
            'funeral-cremation': [
                {
                    id: 'hero-1',
                    type: 'hero',
                    position: 0,
                    properties: {
                        title: 'Dignified Cremation Services',
                        subtitle: 'Respectful Cremation Options for Every Family',
                        backgroundImage: '/assets/cremation-hero.jpg',
                        ctaText: 'Explore Options',
                        ctaLink: '#services'
                    },
                    content: {}
                },
                {
                    id: 'services-1',
                    type: 'services',
                    position: 1,
                    properties: {
                        title: 'Cremation Services',
                        showPrices: true,
                        layout: 'grid'
                    },
                    content: {
                        services: [
                            { name: 'Direct Cremation', price: '$895', description: 'Simple cremation without services' },
                            { name: 'Cremation with Memorial', price: '$1,495', description: 'Cremation with memorial service' },
                            { name: 'Traditional Cremation', price: '$2,295', description: 'Cremation with viewing and service' }
                        ]
                    }
                },
                {
                    id: 'memorial-1',
                    type: 'memorial',
                    position: 2,
                    properties: {
                        title: 'Memorial Options',
                        layout: 'grid'
                    },
                    content: {
                        options: [
                            { name: 'Memorial Jewelry', description: 'Keep your loved one close' },
                            { name: 'Urns & Keepsakes', description: 'Beautiful memorial containers' },
                            { name: 'Scattering Services', description: 'Meaningful scattering ceremonies' },
                            { name: 'Digital Memorials', description: 'Online tributes and memories' }
                        ]
                    }
                },
                {
                    id: 'pricing-1',
                    type: 'pricing',
                    position: 3,
                    properties: {
                        title: 'Transparent Pricing',
                        showGuarantee: true,
                        layout: 'comparison'
                    },
                    content: {
                        packages: [
                            {
                                name: 'Simple',
                                price: '$895',
                                features: ['Direct Cremation', 'Basic Container', 'Death Certificate']
                            },
                            {
                                name: 'Complete',
                                price: '$2,295',
                                features: ['Cremation', 'Memorial Service', 'Premium Urn', 'Death Certificates']
                            }
                        ]
                    }
                },
                {
                    id: 'faq-1',
                    type: 'faq',
                    position: 4,
                    properties: {
                        title: 'Frequently Asked Questions',
                        layout: 'accordion'
                    },
                    content: {
                        questions: [
                            { q: 'What is included in direct cremation?', a: 'Direct cremation includes the cremation process, basic container, and transportation.' },
                            { q: 'Can we have a memorial service?', a: 'Yes, we offer various memorial service options to honor your loved one.' },
                            { q: 'How long does the process take?', a: 'Typically 3-5 business days, depending on circumstances.' }
                        ]
                    }
                },
                {
                    id: 'contact-1',
                    type: 'contact',
                    position: 5,
                    properties: {
                        title: 'Contact Our Cremation Specialists',
                        showMap: true,
                        showHours: true
                    },
                    content: {
                        phone: '(555) 555-1234',
                        email: 'info@cremationservices.com',
                        address: '789 Memorial Lane, City, State 12345',
                        hours: '24/7 Emergency Service Available'
                    }
                }
            ],
            'ecommerce-basic': [
                {
                    id: 'hero-1',
                    type: 'hero',
                    position: 0,
                    properties: {
                        title: 'Shop Our Collection',
                        subtitle: 'Quality Products at Great Prices',
                        backgroundImage: '/assets/ecommerce-hero.jpg',
                        ctaText: 'Shop Now',
                        ctaLink: '#products'
                    },
                    content: {}
                },
                {
                    id: 'featured-products-1',
                    type: 'featured-products',
                    position: 1,
                    properties: {
                        title: 'Featured Products',
                        showTitle: true,
                        productsToShow: 3
                    },
                    content: {}
                },
                {
                    id: 'categories-1',
                    type: 'product-categories',
                    position: 2,
                    properties: {
                        title: 'Shop by Category',
                        columns: 4
                    },
                    content: {}
                },
                {
                    id: 'products-1',
                    type: 'products',
                    position: 3,
                    properties: {
                        title: 'All Products',
                        productsToShow: 8,
                        columns: 4,
                        showFilters: true
                    },
                    content: {}
                },
                {
                    id: 'contact-1',
                    type: 'contact',
                    position: 4,
                    properties: {
                        title: 'Contact Us',
                        showMap: true,
                        showHours: true
                    },
                    content: {
                        phone: '(555) 123-4567',
                        email: 'info@shop.com',
                        address: '123 Commerce St, City, State 12345',
                        hours: 'Mon-Sat: 9AM-8PM, Sun: 10AM-6PM'
                    }
                }
            ],
            'ecommerce-fashion': [
                {
                    id: 'hero-1',
                    type: 'hero',
                    position: 0,
                    properties: {
                        title: 'New Season Collection',
                        subtitle: 'Discover the Latest Trends',
                        backgroundImage: '/assets/fashion-hero.jpg',
                        ctaText: 'Explore Collection',
                        ctaLink: '#collection'
                    },
                    content: {}
                },
                {
                    id: 'featured-1',
                    type: 'featured-products',
                    position: 1,
                    properties: {
                        title: 'Must-Have Pieces',
                        productsToShow: 4
                    },
                    content: {}
                },
                {
                    id: 'categories-1',
                    type: 'product-categories',
                    position: 2,
                    properties: {
                        title: 'Shop by Style',
                        columns: 3
                    },
                    content: {}
                },
                {
                    id: 'testimonials-1',
                    type: 'testimonials',
                    position: 3,
                    properties: {
                        title: 'What Our Customers Say',
                        layout: 'carousel'
                    },
                    content: {
                        testimonials: [
                            { name: 'Emma S.', text: 'Love the quality and style!', rating: 5 },
                            { name: 'Michael R.', text: 'Fast shipping, great prices!', rating: 5 }
                        ]
                    }
                }
            ]
        };

        return templates[templateId] || [];
    }
}
