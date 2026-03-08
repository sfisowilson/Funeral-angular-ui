import { Injectable } from '@angular/core';

/**
 * Color scheme for a theme
 */
export interface ThemeColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
}

/**
 * Typography settings for a theme
 */
export interface ThemeTypography {
  fontFamily: string;
  headingFont?: string;
  baseFontSize: string;
  headingWeight: string;
  bodyWeight: string;
}

/**
 * A single page in a theme
 */
export interface PageTemplate {
  name: string;
  slug: string;
  title: string;
  description: string;
  // Publication & navigation flags. Many legacy templates only set
  // showInNavigation/navigationOrder; navbar/footer flags are normalized
  // when applying a theme.
  isPublic?: boolean;
  showInNavigation?: boolean;
  navigationOrder?: number;
  showInNavbar?: boolean;
  showInFooter?: boolean;
  navbarOrder?: number;
  footerOrder?: number;
  widgets: any[]; // Array of widget configurations
}

/**
 * Complete theme template with multiple pages
 */
export interface CustomPageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'funeral' | 'ngo' | 'ecommerce' | 'services' | 'general';
  thumbnail?: string;
  isPremium: boolean;
  tenantTypes?: string[]; // Compatible tenant types (e.g., 'Funeral', 'NGO')
  colorScheme: ThemeColorScheme;
  typography: ThemeTypography;
  pages: PageTemplate[];
}

/**
 * Service for managing custom page templates (WordPress-style themes)
 */
@Injectable({
  providedIn: 'root'
})
export class CustomPageTemplateService {
  
  /**
   * Get all available page templates grouped by category
   */
  getAllTemplates(): CustomPageTemplate[] {
    return [
      ...this.getFuneralTemplates(),
      ...this.getNGOTemplates(),
      ...this.getEcommerceTemplates(),
      ...this.getServicesTemplates()
    ];
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): CustomPageTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Get a specific template by ID
   */
  getTemplateById(id: string): CustomPageTemplate | undefined {
    return this.getAllTemplates().find(t => t.id === id);
  }

  /**
   * Get templates compatible with a tenant type
   */
  getTemplatesForTenantType(tenantType: string): CustomPageTemplate[] {
    return this.getAllTemplates().filter(t => 
      !t.tenantTypes || t.tenantTypes.includes(tenantType)
    );
  }

  /**
   * Funeral Home Templates
   */
  private getFuneralTemplates(): CustomPageTemplate[] {
    return [
      // 1. Classic Elegance - Traditional funeral home with timeless design
      {
        id: 'funeral-classic-elegance',
        name: 'Classic Elegance',
        description: 'Traditional funeral home design with dignified aesthetics and warm tones',
        category: 'funeral',
        isPremium: false,
        tenantTypes: ['Funeral'],
        colorScheme: {
          primary: '#2c3e50',
          secondary: '#8b4513',
          accent: '#d4af37',
          background: '#f8f5f2',
          surface: '#ffffff',
          text: '#2c3e50',
          textSecondary: '#6c757d',
          border: '#e0d5c7',
          success: '#52796f',
          warning: '#c9a961',
          danger: '#8b4513'
        },
        typography: {
          fontFamily: 'Georgia, serif',
          headingFont: 'Playfair Display, serif',
          baseFontSize: '16px',
          headingWeight: '600',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Welcome',
            description: 'Classic funeral home homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'Honoring Lives with Dignity and Compassion',
                  subtitle: 'Serving families with care and respect for over 50 years',
                  backgroundImage: '/assets/funeral-classic-hero.jpg',
                  height: 'large',
                  overlayOpacity: 0.5,
                  textAlign: 'center',
                  showCTA: true,
                  ctaText: 'Our Services',
                  ctaLink: '/services',
                  ctaStyle: 'primary'
                }
              },
              {
                type: 'features',
                settings: {
                  title: 'Our Services',
                  subtitle: 'Comprehensive funeral and memorial services',
                  layout: 'grid',
                  columns: 3,
                  features: [
                    {
                      icon: 'bi bi-heart',
                      title: 'Traditional Funerals',
                      description: 'Full-service funeral arrangements with viewing and ceremony'
                    },
                    {
                      icon: 'bi bi-sun',
                      title: 'Cremation Services',
                      description: 'Dignified cremation with memorial options'
                    },
                    {
                      icon: 'bi bi-flower1',
                      title: 'Memorial Services',
                      description: 'Personalized celebrations of life'
                    }
                  ]
                }
              },
              {
                type: 'about',
                settings: {
                  title: 'About Our Funeral Home',
                  subtitle: 'A Legacy of Compassionate Care',
                  content: 'For over five decades, our family has been honored to serve families during their most difficult times. We understand the importance of creating meaningful tributes that celebrate life and provide comfort to those who grieve.',
                  imagePosition: 'left',
                  image: '/assets/funeral-about.jpg',
                  showButton: true,
                  buttonText: 'Learn More',
                  buttonLink: '/about'
                }
              },
              {
                type: 'testimonial-carousel',
                settings: {
                  title: 'What Families Say',
                  autoplay: true,
                  interval: 6000,
                  testimonials: [
                    {
                      text: 'The staff showed incredible compassion during our time of loss. Everything was handled with such care and professionalism.',
                      author: 'The Johnson Family',
                      rating: 5
                    },
                    {
                      text: 'They helped us create a beautiful memorial service that truly honored our father\'s life.',
                      author: 'Sarah M.',
                      rating: 5
                    }
                  ]
                }
              },
              {
                type: 'cta',
                settings: {
                  title: 'We\'re Here to Help',
                  subtitle: 'Available 24 hours a day, 7 days a week',
                  buttonText: 'Contact Us',
                  buttonLink: '/contact',
                  backgroundColor: '#2c3e50',
                  textColor: '#ffffff'
                }
              }
            ]
          },
          {
            name: 'Services',
            slug: 'services',
            title: 'Our Services',
            description: 'Funeral and memorial services we offer',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'page-header',
                settings: {
                  title: 'Our Services',
                  subtitle: 'Comprehensive funeral and memorial services tailored to your needs',
                  backgroundImage: '/assets/services-header.jpg'
                }
              },
              {
                type: 'feature-grid',
                settings: {
                  columns: 2,
                  gap: 32,
                  features: [
                    {
                      icon: 'bi bi-heart-fill',
                      title: 'Traditional Funeral Services',
                      description: 'Complete funeral services including viewing, visitation, ceremony, and burial arrangements.',
                      image: '/assets/traditional-funeral.jpg'
                    },
                    {
                      icon: 'bi bi-fire',
                      title: 'Cremation Services',
                      description: 'Cremation with various memorial options including urns, scattering, and memorial ceremonies.',
                      image: '/assets/cremation.jpg'
                    },
                    {
                      icon: 'bi bi-flower2',
                      title: 'Memorial Services',
                      description: 'Personalized memorial celebrations that honor your loved one\'s unique life story.',
                      image: '/assets/memorial.jpg'
                    },
                    {
                      icon: 'bi bi-calendar-check',
                      title: 'Pre-Planning',
                      description: 'Pre-arrange your funeral services to ease the burden on your family.',
                      image: '/assets/pre-planning.jpg'
                    }
                  ]
                }
              },
              {
                type: 'process-steps',
                settings: {
                  title: 'How We Help You',
                  subtitle: 'Our compassionate process',
                  steps: [
                    {
                      number: 1,
                      title: 'Initial Consultation',
                      description: 'We meet with you to understand your needs and wishes'
                    },
                    {
                      number: 2,
                      title: 'Planning & Arrangements',
                      description: 'We handle all details and coordinate with necessary parties'
                    },
                    {
                      number: 3,
                      title: 'Service & Support',
                      description: 'We ensure everything proceeds smoothly and provide ongoing support'
                    }
                  ]
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About Us',
            description: 'Our history and commitment',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'page-header',
                settings: {
                  title: 'About Us',
                  subtitle: 'A family tradition of compassionate care',
                  backgroundImage: '/assets/about-header.jpg'
                }
              },
              {
                type: 'about',
                settings: {
                  title: 'Our Story',
                  subtitle: 'Five Decades of Service',
                  content: 'Founded in 1973, our funeral home has been a pillar of support for families in our community. What began as a small family business has grown into a trusted institution, yet we have never lost sight of our core values: compassion, dignity, and personalized care. Every family we serve receives our full attention and dedication.',
                  imagePosition: 'right',
                  image: '/assets/our-story.jpg'
                }
              },
              {
                type: 'team',
                settings: {
                  title: 'Our Team',
                  subtitle: 'Dedicated professionals committed to serving you',
                  layout: 'grid',
                  columns: 3,
                  members: [
                    {
                      name: 'John Smith',
                      position: 'Funeral Director',
                      bio: 'Licensed funeral director with 25 years of experience',
                      image: '/assets/team-john.jpg'
                    },
                    {
                      name: 'Mary Johnson',
                      position: 'Family Services',
                      bio: 'Compassionate guide through difficult times',
                      image: '/assets/team-mary.jpg'
                    }
                  ]
                }
              },
              {
                type: 'stats-counter',
                settings: {
                  title: 'Our Legacy',
                  stats: [
                    { number: 50, label: 'Years of Service', suffix: '+' },
                    { number: 10000, label: 'Families Served', suffix: '+' },
                    { number: 15, label: 'Team Members', suffix: '' }
                  ]
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact Us',
            description: 'Get in touch with us',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'page-header',
                settings: {
                  title: 'Contact Us',
                  subtitle: 'Available 24/7 to serve you',
                  backgroundImage: '/assets/contact-header.jpg'
                }
              },
              {
                type: 'contact',
                settings: {
                  title: 'Get in Touch',
                  subtitle: 'We\'re here to help',
                  showForm: true,
                  showMap: true,
                  showContactInfo: true,
                  address: '123 Main Street, Your City, ST 12345',
                  phone: '(555) 123-4567',
                  email: 'info@funeralhome.com',
                  hours: 'Available 24 hours'
                }
              }
            ]
          }
        ]
      },

      // 2. Modern Memorial - Contemporary design with clean lines
      {
        id: 'funeral-modern-memorial',
        name: 'Modern Memorial',
        description: 'Contemporary funeral home design with clean aesthetics and modern layouts',
        category: 'funeral',
        isPremium: false,
        tenantTypes: ['Funeral'],
        colorScheme: {
          primary: '#1a1a2e',
          secondary: '#16213e',
          accent: '#0f4c75',
          background: '#f8f9fa',
          surface: '#ffffff',
          text: '#1a1a2e',
          textSecondary: '#6c757d',
          border: '#dee2e6',
          success: '#3282b8',
          warning: '#bbe1fa',
          danger: '#e94560'
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
          headingFont: 'Montserrat, sans-serif',
          baseFontSize: '16px',
          headingWeight: '700',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Modern funeral home homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'parallax-section',
                settings: {
                  title: 'Celebrating Life with Modern Grace',
                  subtitle: 'Contemporary funeral services that honor your loved ones',
                  backgroundType: 'image',
                  backgroundImage: '/assets/modern-hero.jpg',
                  parallaxSpeed: 0.5,
                  overlayOpacity: 0.6,
                  minHeight: 600,
                  contentAlign: 'center',
                  showCTA: true,
                  ctaText: 'Explore Our Services',
                  ctaLink: '/services'
                }
              },
              {
                type: 'bento-grid',
                settings: {
                  title: 'Our Services',
                  subtitle: 'Modern solutions for every need',
                  columns: 4,
                  gap: 16,
                  items: [
                    {
                      size: 'large',
                      title: 'Traditional Services',
                      description: 'Classic funeral arrangements',
                      backgroundColor: '#0f4c75',
                      textColor: '#ffffff'
                    },
                    {
                      size: 'medium',
                      title: 'Cremation',
                      description: 'Modern cremation options',
                      backgroundColor: '#3282b8',
                      textColor: '#ffffff'
                    },
                    {
                      size: 'medium',
                      title: 'Memorial',
                      description: 'Celebration of life',
                      backgroundColor: '#16213e',
                      textColor: '#ffffff'
                    },
                    {
                      size: 'small',
                      title: 'Pre-Planning',
                      description: 'Plan ahead',
                      backgroundColor: '#1a1a2e',
                      textColor: '#ffffff'
                    }
                  ]
                }
              },
              {
                type: 'split-screen',
                settings: {
                  splitRatio: 50,
                  leftContent: {
                    type: 'image',
                    image: '/assets/modern-facility.jpg',
                    sticky: true
                  },
                  rightContent: {
                    type: 'text',
                    title: 'State-of-the-Art Facilities',
                    subtitle: 'Modern comfort in a traditional setting',
                    content: 'Our newly renovated facilities blend contemporary design with warm, welcoming spaces. Every detail has been carefully considered to provide comfort and dignity for families during difficult times.'
                  }
                }
              },
              {
                type: 'glassmorphism-card',
                settings: {
                  title: 'Why Choose Us',
                  subtitle: 'Excellence in every detail',
                  columns: 3,
                  backgroundPattern: 'gradient',
                  gradientStart: '#0f4c75',
                  gradientEnd: '#1a1a2e',
                  cards: [
                    {
                      icon: 'bi bi-shield-check',
                      title: '24/7 Availability',
                      description: 'Always here when you need us'
                    },
                    {
                      icon: 'bi bi-award',
                      title: 'Licensed Professionals',
                      description: 'Experienced and certified staff'
                    },
                    {
                      icon: 'bi bi-heart',
                      title: 'Personalized Care',
                      description: 'Every service is unique'
                    }
                  ]
                }
              }
            ]
          },
          {
            name: 'Services',
            slug: 'services',
            title: 'Services',
            description: 'Our service offerings',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'Our Services',
                  subtitle: 'Comprehensive care for every need',
                  height: 'medium',
                  textAlign: 'center'
                }
              },
              {
                type: 'tabbed-content',
                settings: {
                  tabs: [
                    {
                      title: 'Traditional Funerals',
                      content: 'Full-service funeral arrangements including viewing, ceremony, and burial'
                    },
                    {
                      title: 'Cremation',
                      content: 'Cremation services with various memorial options'
                    },
                    {
                      title: 'Memorial Services',
                      content: 'Personalized celebrations of life'
                    },
                    {
                      title: 'Pre-Planning',
                      content: 'Pre-arrange your services to ease family burden'
                    }
                  ]
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About',
            description: 'Learn about us',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'About Us',
                  subtitle: 'Modern care with traditional values',
                  height: 'medium'
                }
              },
              {
                type: 'timeline',
                settings: {
                  title: 'Our Journey',
                  events: [
                    { year: '1973', title: 'Founded', description: 'Family business established' },
                    { year: '1995', title: 'Expanded', description: 'New facilities built' },
                    { year: '2020', title: 'Renovated', description: 'Modern facility renovation completed' }
                  ]
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Reach out to us',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'contact',
                settings: {
                  title: 'Contact Us',
                  subtitle: 'We\'re available 24/7',
                  showForm: true,
                  showMap: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      },

      // 3. Minimalist Zen - Ultra-clean, peaceful design
      {
        id: 'funeral-minimalist-zen',
        name: 'Minimalist Zen',
        description: 'Peaceful, minimalist design focused on simplicity and serenity',
        category: 'funeral',
        isPremium: true,
        tenantTypes: ['Funeral'],
        colorScheme: {
          primary: '#2d3436',
          secondary: '#636e72',
          accent: '#74b9ff',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#2d3436',
          textSecondary: '#636e72',
          border: '#dfe6e9',
          success: '#00b894',
          warning: '#fdcb6e',
          danger: '#d63031'
        },
        typography: {
          fontFamily: 'Lato, sans-serif',
          headingFont: 'Raleway, sans-serif',
          baseFontSize: '16px',
          headingWeight: '300',
          bodyWeight: '300'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Minimalist homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'Peace. Dignity. Remembrance.',
                  subtitle: '',
                  height: 'large',
                  textAlign: 'center',
                  backgroundImage: '/assets/zen-hero.jpg',
                  overlayOpacity: 0.3
                }
              },
              {
                type: 'features',
                settings: {
                  title: 'Services',
                  subtitle: '',
                  layout: 'minimal',
                  columns: 3,
                  features: [
                    { icon: 'bi bi-circle', title: 'Funerals', description: 'Traditional services with care' },
                    { icon: 'bi bi-circle', title: 'Cremation', description: 'Dignified cremation options' },
                    { icon: 'bi bi-circle', title: 'Memorials', description: 'Celebrating life' }
                  ]
                }
              },
              {
                type: 'content-image',
                settings: {
                  content: 'In times of loss, simplicity brings comfort. We provide thoughtful, dignified services that honor your loved ones without unnecessary complexity.',
                  image: '/assets/zen-about.jpg',
                  imagePosition: 'left',
                  backgroundColor: '#f8f9fa'
                }
              }
            ]
          },
          {
            name: 'Services',
            slug: 'services',
            title: 'Services',
            description: 'What we offer',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'Services',
                  height: 'small',
                  textAlign: 'center'
                }
              },
              {
                type: 'enhanced-accordion',
                settings: {
                  items: [
                    { title: 'Traditional Funerals', content: 'Complete funeral services' },
                    { title: 'Cremation', content: 'Cremation with memorial options' },
                    { title: 'Memorial Services', content: 'Personalized celebrations' }
                  ]
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Get in touch',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'contact',
                settings: {
                  title: 'Contact',
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      },

      // 4. Premium Prestige - Luxury funeral home with premium features
      {
        id: 'funeral-premium-prestige',
        name: 'Premium Prestige',
        description: 'Luxury funeral home design with premium features and elegant styling',
        category: 'funeral',
        isPremium: true,
        tenantTypes: ['Funeral'],
        colorScheme: {
          primary: '#1a1a1a',
          secondary: '#8b7355',
          accent: '#d4af37',
          background: '#faf8f5',
          surface: '#ffffff',
          text: '#1a1a1a',
          textSecondary: '#5a5a5a',
          border: '#e6d5c3',
          success: '#8b7355',
          warning: '#d4af37',
          danger: '#8b4513'
        },
        typography: {
          fontFamily: 'Cormorant Garamond, serif',
          headingFont: 'Cinzel, serif',
          baseFontSize: '17px',
          headingWeight: '600',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Premium homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'parallax-section',
                settings: {
                  title: 'Excellence in Memorial Services',
                  subtitle: 'Distinguished funeral care since 1950',
                  backgroundType: 'image',
                  backgroundImage: '/assets/premium-hero.jpg',
                  parallaxSpeed: 0.3,
                  overlayOpacity: 0.5,
                  minHeight: 700,
                  contentAlign: 'center',
                  titleColor: '#ffffff',
                  subtitleColor: '#d4af37'
                }
              },
              {
                type: 'marquee',
                settings: {
                  title: 'Trusted by Distinguished Families',
                  showTitle: true,
                  direction: 'left',
                  speed: 40,
                  items: [
                    { type: 'text', content: 'Excellence' },
                    { type: 'text', content: 'Dignity' },
                    { type: 'text', content: 'Compassion' },
                    { type: 'text', content: 'Tradition' },
                    { type: 'text', content: 'Service' }
                  ]
                }
              },
              {
                type: 'glassmorphism-card',
                settings: {
                  title: 'Our Distinguished Services',
                  subtitle: 'Bespoke funeral arrangements',
                  columns: 3,
                  glassBlur: 15,
                  backgroundPattern: 'gradient',
                  gradientStart: '#8b7355',
                  gradientEnd: '#1a1a1a',
                  cards: [
                    {
                      icon: 'bi bi-gem',
                      title: 'Premium Services',
                      description: 'Exclusive, personalized funeral arrangements'
                    },
                    {
                      icon: 'bi bi-building',
                      title: 'Luxury Facilities',
                      description: 'Elegant chapels and reception venues'
                    },
                    {
                      icon: 'bi bi-award-fill',
                      title: 'Concierge Care',
                      description: 'White-glove service for every detail'
                    }
                  ]
                }
              },
              {
                type: 'split-screen',
                settings: {
                  splitRatio: 50,
                  leftContent: {
                    type: 'slideshow',
                    images: [
                      '/assets/premium-chapel-1.jpg',
                      '/assets/premium-chapel-2.jpg',
                      '/assets/premium-reception.jpg'
                    ],
                    sticky: true
                  },
                  rightContent: {
                    type: 'steps',
                    items: [
                      {
                        title: 'Consultation',
                        description: 'Private meeting with our senior directors'
                      },
                      {
                        title: 'Personalization',
                        description: 'Bespoke arrangements tailored to your wishes'
                      },
                      {
                        title: 'Execution',
                        description: 'Flawless service delivery with attention to every detail'
                      }
                    ]
                  }
                }
              },
              {
                type: 'testimonial-carousel',
                settings: {
                  title: 'What Distinguished Families Say',
                  testimonials: [
                    {
                      text: 'The exceptional attention to detail and compassionate service exceeded our expectations.',
                      author: 'The Wellington Family',
                      rating: 5
                    }
                  ]
                }
              }
            ]
          },
          {
            name: 'Services',
            slug: 'services',
            title: 'Services',
            description: 'Premium services',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'page-header',
                settings: {
                  title: 'Our Exclusive Services',
                  subtitle: 'Bespoke funeral arrangements',
                  backgroundImage: '/assets/premium-services-header.jpg'
                }
              },
              {
                type: 'pricing-cards',
                settings: {
                  title: 'Service Packages',
                  packages: [
                    {
                      name: 'Classic',
                      price: '$5,000',
                      features: ['Traditional funeral', 'Viewing', 'Ceremony', 'Burial coordination']
                    },
                    {
                      name: 'Premium',
                      price: '$8,500',
                      features: ['All Classic features', 'Luxury chapel', 'Reception', 'Memorial book'],
                      featured: true
                    },
                    {
                      name: 'Prestige',
                      price: '$15,000',
                      features: ['All Premium features', 'Concierge service', 'Video tribute', 'Premium flowers']
                    }
                  ]
                }
              }
            ]
          },
          {
            name: 'Facilities',
            slug: 'facilities',
            title: 'Facilities',
            description: 'Our venues',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'gallery',
                settings: {
                  title: 'Our Distinguished Facilities',
                  layout: 'masonry',
                  images: [
                    { url: '/assets/premium-chapel.jpg', caption: 'Main Chapel' },
                    { url: '/assets/premium-reception.jpg', caption: 'Reception Hall' }
                  ]
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About',
            description: 'Our heritage',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'about',
                settings: {
                  title: 'A Legacy of Excellence',
                  content: 'For over 70 years, our family has provided distinguished funeral services to the community\'s most respected families.',
                  imagePosition: 'right'
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Reach us',
            showInNavigation: true,
            navigationOrder: 5,
            widgets: [
              {
                type: 'contact',
                settings: {
                  title: 'Contact Our Concierge',
                  subtitle: 'Available 24/7 for your needs',
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * NGO & Non-Profit Templates
   */
  private getNGOTemplates(): CustomPageTemplate[] {
    return [
      // 1. Community Heart - Warm, community-focused NGO
      {
        id: 'ngo-community-heart',
        name: 'Community Heart',
        description: 'Warm, community-focused design for grassroots organizations',
        category: 'ngo',
        isPremium: false,
        tenantTypes: ['NGO'],
        colorScheme: {
          primary: '#e94560',
          secondary: '#0f3460',
          accent: '#16213e',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#0f3460',
          textSecondary: '#6c757d',
          border: '#dee2e6',
          success: '#16c79a',
          warning: '#f6cd46',
          danger: '#e94560'
        },
        typography: {
          fontFamily: 'Open Sans, sans-serif',
          headingFont: 'Poppins, sans-serif',
          baseFontSize: '16px',
          headingWeight: '600',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Community NGO homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'Building Stronger Communities Together',
                  subtitle: 'Join us in making a lasting difference',
                  backgroundImage: '/assets/ngo-community-hero.jpg',
                  height: 'large',
                  overlayOpacity: 0.4,
                  showCTA: true,
                  ctaText: 'Get Involved',
                  ctaLink: '/volunteer',
                  ctaStyle: 'primary'
                }
              },
              {
                type: 'stats-counter',
                settings: {
                  title: 'Our Impact',
                  stats: [
                    { number: 5000, label: 'Lives Touched', suffix: '+' },
                    { number: 50, label: 'Active Volunteers', suffix: '' },
                    { number: 20, label: 'Community Programs', suffix: '+' }
                  ]
                }
              },
              {
                type: 'features',
                settings: {
                  title: 'What We Do',
                  subtitle: 'Programs that make a difference',
                  layout: 'grid',
                  columns: 3,
                  features: [
                    {
                      icon: 'bi bi-heart-fill',
                      title: 'Community Support',
                      description: 'Direct assistance to families in need'
                    },
                    {
                      icon: 'bi bi-book',
                      title: 'Education Programs',
                      description: 'After-school tutoring and mentorship'
                    },
                    {
                      icon: 'bi bi-house-heart',
                      title: 'Family Services',
                      description: 'Resources and counseling for families'
                    }
                  ]
                }
              },
              {
                type: 'ngo-donation',
                settings: {
                  title: 'Support Our Work',
                  subtitle: 'Every donation makes a difference',
                  showRecurringOption: true,
                  suggestedAmounts: [25, 50, 100, 250]
                }
              },
              {
                type: 'blog-preview',
                settings: {
                  title: 'Latest News',
                  postsToShow: 3
                }
              },
              {
                type: 'cta',
                settings: {
                  title: 'Volunteer With Us',
                  subtitle: 'Join our team of dedicated volunteers',
                  buttonText: 'Sign Up',
                  buttonLink: '/volunteer'
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About Us',
            description: 'Our mission and story',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'page-header',
                settings: {
                  title: 'About Us',
                  subtitle: 'Our mission to serve'
                }
              },
              {
                type: 'about',
                settings: {
                  title: 'Our Mission',
                  content: 'We believe that every community member deserves support, opportunity, and hope. Since 2010, we\'ve been working tirelessly to provide essential services to families in need.',
                  imagePosition: 'left',
                  showButton: false
                }
              },
              {
                type: 'team',
                settings: {
                  title: 'Our Team',
                  subtitle: 'Dedicated people making a difference',
                  layout: 'grid',
                  columns: 3
                }
              }
            ]
          },
          {
            name: 'Programs',
            slug: 'programs',
            title: 'Programs',
            description: 'Our programs and services',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'feature-grid',
                settings: {
                  title: 'Our Programs',
                  columns: 2,
                  features: [
                    { title: 'Youth Development', description: 'Mentorship and after-school programs' },
                    { title: 'Family Support', description: 'Resources and counseling services' },
                    { title: 'Community Events', description: 'Building connections through events' },
                    { title: 'Emergency Assistance', description: 'Crisis support and immediate aid' }
                  ]
                }
              }
            ]
          },
          {
            name: 'Get Involved',
            slug: 'volunteer',
            title: 'Get Involved',
            description: 'Volunteer and donate',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'ngo-volunteer-signup',
                settings: {
                  title: 'Become a Volunteer',
                  subtitle: 'Join our community of changemakers'
                }
              },
              {
                type: 'ngo-donation',
                settings: {
                  title: 'Make a Donation',
                  showRecurringOption: true
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Get in touch',
            showInNavigation: true,
            navigationOrder: 5,
            widgets: [
              {
                type: 'contact',
                settings: {
                  title: 'Contact Us',
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      },

      // 2. Impact Driven - Data and results-focused NGO
      {
        id: 'ngo-impact-driven',
        name: 'Impact Driven',
        description: 'Professional NGO design focused on impact metrics and transparency',
        category: 'ngo',
        isPremium: false,
        tenantTypes: ['NGO'],
        colorScheme: {
          primary: '#667eea',
          secondary: '#764ba2',
          accent: '#f093fb',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#2d3748',
          textSecondary: '#718096',
          border: '#e2e8f0',
          success: '#48bb78',
          warning: '#ecc94b',
          danger: '#f56565'
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
          headingFont: 'Space Grotesk, sans-serif',
          baseFontSize: '16px',
          headingWeight: '700',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Impact-focused homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'parallax-section',
                settings: {
                  title: 'Measurable Impact. Lasting Change.',
                  subtitle: 'Data-driven solutions for social good',
                  backgroundType: 'gradient',
                  gradientStart: '#667eea',
                  gradientEnd: '#764ba2',
                  parallaxSpeed: 0.4,
                  minHeight: 600,
                  contentAlign: 'center'
                }
              },
              {
                type: 'bento-grid',
                settings: {
                  title: 'Our Focus Areas',
                  columns: 4,
                  items: [
                    {
                      size: 'large',
                      title: 'Education',
                      description: '10,000 students supported',
                      backgroundColor: '#667eea'
                    },
                    {
                      size: 'medium',
                      title: 'Healthcare',
                      description: '5,000 patients treated',
                      backgroundColor: '#764ba2'
                    },
                    {
                      size: 'medium',
                      title: 'Economic Development',
                      description: '500 businesses started',
                      backgroundColor: '#f093fb'
                    }
                  ]
                }
              },
              {
                type: 'ngo-impact-report',
                settings: {
                  title: 'Impact Dashboard',
                  showCharts: true,
                  showMetrics: true
                }
              },
              {
                type: 'testimonial-carousel',
                settings: {
                  title: 'Success Stories',
                  testimonials: [
                    {
                      text: 'This organization changed my life by providing education scholarships.',
                      author: 'Maria, Scholarship Recipient'
                    }
                  ]
                }
              }
            ]
          },
          {
            name: 'Impact',
            slug: 'impact',
            title: 'Our Impact',
            description: 'Results and metrics',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'ngo-impact-report',
                settings: {
                  title: 'Detailed Impact Report',
                  showCharts: true,
                  showTimeline: true
                }
              }
            ]
          },
          {
            name: 'Programs',
            slug: 'programs',
            title: 'Programs',
            description: 'Our initiatives',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'feature-grid',
                settings: {
                  title: 'Our Programs',
                  columns: 3
                }
              }
            ]
          },
          {
            name: 'Donate',
            slug: 'donate',
            title: 'Donate',
            description: 'Support our work',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'ngo-donation',
                settings: {
                  title: 'Support Our Impact',
                  subtitle: 'Your donation creates measurable change',
                  showRecurringOption: true,
                  showImpactCalculator: true
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Get in touch',
            showInNavigation: true,
            navigationOrder: 5,
            widgets: [
              {
                type: 'contact',
                settings: {
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      },

      // 3. Foundation Pro - Professional foundation/charity
      {
        id: 'ngo-foundation-pro',
        name: 'Foundation Pro',
        description: 'Professional foundation design for established charities and grant-makers',
        category: 'ngo',
        isPremium: true,
        tenantTypes: ['NGO'],
        colorScheme: {
          primary: '#1e3a8a',
          secondary: '#3b82f6',
          accent: '#60a5fa',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#1e293b',
          textSecondary: '#64748b',
          border: '#e2e8f0',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444'
        },
        typography: {
          fontFamily: 'Source Sans Pro, sans-serif',
          headingFont: 'Merriweather, serif',
          baseFontSize: '16px',
          headingWeight: '700',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Foundation homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'Investing in Community Futures',
                  subtitle: 'Strategic grantmaking for lasting impact',
                  height: 'large',
                  backgroundImage: '/assets/foundation-hero.jpg'
                }
              },
              {
                type: 'stats-counter',
                settings: {
                  title: 'Our Reach',
                  stats: [
                    { number: 50000000, label: 'Grants Awarded', prefix: '$', suffix: '+' },
                    { number: 200, label: 'Organizations Supported', suffix: '+' },
                    { number: 30, label: 'Years of Service', suffix: '' }
                  ]
                }
              },
              {
                type: 'glassmorphism-card',
                settings: {
                  title: 'Funding Priorities',
                  columns: 3,
                  cards: [
                    { icon: 'bi bi-mortarboard', title: 'Education', description: 'K-12 and higher education grants' },
                    { icon: 'bi bi-heart-pulse', title: 'Health', description: 'Community health initiatives' },
                    { icon: 'bi bi-tree', title: 'Environment', description: 'Sustainability projects' }
                  ]
                }
              },
              {
                type: 'ngo-grant-applications',
                settings: {
                  title: 'Grant Application Process',
                  showTimeline: true
                }
              }
            ]
          },
          {
            name: 'Grant Programs',
            slug: 'grants',
            title: 'Grant Programs',
            description: 'Funding opportunities',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'ngo-grant-applications',
                settings: {
                  title: 'Available Grants',
                  showApplicationForm: true
                }
              }
            ]
          },
          {
            name: 'Grantees',
            slug: 'grantees',
            title: 'Our Grantees',
            description: 'Organizations we support',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'logo-cloud',
                settings: {
                  title: 'Organizations We Support'
                }
              },
              {
                type: 'use-case-cards',
                settings: {
                  title: 'Success Stories',
                  cases: [
                    { title: 'Education Program', description: 'Supporting 500 students' },
                    { title: 'Health Initiative', description: 'Community clinic expansion' }
                  ]
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About',
            description: 'Our foundation',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'about',
                settings: {
                  title: 'Our Foundation',
                  content: 'Established in 1990, our foundation has invested over $50 million in community development.'
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Reach us',
            showInNavigation: true,
            navigationOrder: 5,
            widgets: [
              {
                type: 'contact',
                settings: {
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      },

      // 4. Volunteer Focus - Volunteer-driven organization
      {
        id: 'ngo-volunteer-focus',
        name: 'Volunteer Focus',
        description: 'Energetic design for volunteer-driven organizations',
        category: 'ngo',
        isPremium: true,
        tenantTypes: ['NGO'],
        colorScheme: {
          primary: '#f97316',
          secondary: '#ea580c',
          accent: '#fb923c',
          background: '#ffffff',
          surface: '#fffbeb',
          text: '#1c1917',
          textSecondary: '#78716c',
          border: '#fde68a',
          success: '#22c55e',
          warning: '#fbbf24',
          danger: '#ef4444'
        },
        typography: {
          fontFamily: 'Nunito, sans-serif',
          headingFont: 'Fredoka, sans-serif',
          baseFontSize: '16px',
          headingWeight: '700',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Volunteer-focused homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'parallax-section',
                settings: {
                  title: 'Volunteers Making a Difference',
                  subtitle: 'Join our community of changemakers',
                  backgroundType: 'image',
                  backgroundImage: '/assets/volunteer-hero.jpg',
                  parallaxSpeed: 0.5,
                  showCTA: true,
                  ctaText: 'Volunteer Today',
                  ctaLink: '/volunteer'
                }
              },
              {
                type: 'marquee',
                settings: {
                  title: 'Our Volunteer Values',
                  items: [
                    { type: 'text', content: 'Community' },
                    { type: 'text', content: 'Service' },
                    { type: 'text', content: 'Impact' },
                    { type: 'text', content: 'Unity' }
                  ]
                }
              },
              {
                type: 'split-screen',
                settings: {
                  leftContent: {
                    type: 'video',
                    videoUrl: '/assets/volunteer-video.mp4',
                    sticky: true
                  },
                  rightContent: {
                    type: 'steps',
                    items: [
                      { title: 'Sign Up', description: 'Register as a volunteer' },
                      { title: 'Get Trained', description: 'Attend orientation' },
                      { title: 'Start Serving', description: 'Make an impact' }
                    ]
                  }
                }
              },
              {
                type: 'ngo-events',
                settings: {
                  title: 'Upcoming Volunteer Events',
                  showCalendar: true
                }
              }
            ]
          },
          {
            name: 'Volunteer',
            slug: 'volunteer',
            title: 'Volunteer',
            description: 'Join us',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'ngo-volunteer-signup',
                settings: {
                  title: 'Sign Up to Volunteer',
                  showOpportunities: true
                }
              }
            ]
          },
          {
            name: 'Events',
            slug: 'events',
            title: 'Events',
            description: 'Upcoming events',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'ngo-events',
                settings: {
                  title: 'All Events',
                  showCalendar: true,
                  showFilters: true
                }
              }
            ]
          },
          {
            name: 'Impact',
            slug: 'impact',
            title: 'Impact',
            description: 'Our results',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'stats-counter',
                settings: {
                  title: 'Volunteer Impact',
                  stats: [
                    { number: 500, label: 'Active Volunteers', suffix: '+' },
                    { number: 10000, label: 'Volunteer Hours', suffix: '+' },
                    { number: 50, label: 'Community Projects', suffix: '' }
                  ]
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Get in touch',
            showInNavigation: true,
            navigationOrder: 5,
            widgets: [
              {
                type: 'contact',
                settings: {
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Ecommerce Templates
   */
  private getEcommerceTemplates(): CustomPageTemplate[] {
    return [
      // 1. Modern Store - Contemporary ecommerce
      {
        id: 'ecommerce-modern-store',
        name: 'Modern Store',
        description: 'Contemporary ecommerce design with clean product showcases',
        category: 'ecommerce',
        isPremium: false,
        tenantTypes: [],
        colorScheme: {
          primary: '#000000',
          secondary: '#1a1a1a',
          accent: '#4a90e2',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#000000',
          textSecondary: '#6c757d',
          border: '#dee2e6',
          success: '#28a745',
          warning: '#ffc107',
          danger: '#dc3545'
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
          headingFont: 'Inter, sans-serif',
          baseFontSize: '16px',
          headingWeight: '700',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Modern store homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'New Collection',
                  subtitle: 'Spring/Summer 2024',
                  height: 'large',
                  backgroundImage: '/assets/store-hero.jpg',
                  showCTA: true,
                  ctaText: 'Shop Now',
                  ctaLink: '/products'
                }
              },
              {
                type: 'bento-grid',
                settings: {
                  title: 'Featured Categories',
                  columns: 4,
                  items: [
                    { size: 'large', title: 'New Arrivals', backgroundColor: '#4a90e2' },
                    { size: 'medium', title: 'Best Sellers', backgroundColor: '#1a1a1a' },
                    { size: 'medium', title: 'Sale', backgroundColor: '#dc3545' }
                  ]
                }
              },
              {
                type: 'ecommerce-featured-products',
                settings: {
                  title: 'Featured Products',
                  productsToShow: 8,
                  layout: 'grid',
                  columns: 4
                }
              },
              {
                type: 'marquee',
                settings: {
                  title: '',
                  showTitle: false,
                  direction: 'left',
                  items: [
                    { type: 'text', content: 'Free Shipping Over $50' },
                    { type: 'text', content: '30-Day Returns' },
                    { type: 'text', content: 'Secure Checkout' }
                  ]
                }
              }
            ]
          },
          {
            name: 'Shop',
            slug: 'products',
            title: 'Shop',
            description: 'All products',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'ecommerce-products',
                settings: {
                  title: 'All Products',
                  showFilters: true,
                  showSearch: true,
                  layout: 'grid',
                  columns: 4
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About',
            description: 'About our store',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'about',
                settings: {
                  title: 'About Us',
                  content: 'Quality products, modern design, exceptional service.'
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Get in touch',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'contact',
                settings: {
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      },

      // 2. Luxury Boutique - High-end ecommerce
      {
        id: 'ecommerce-luxury-boutique',
        name: 'Luxury Boutique',
        description: 'Elegant, high-end ecommerce design for premium brands',
        category: 'ecommerce',
        isPremium: true,
        tenantTypes: [],
        colorScheme: {
          primary: '#1a1a1a',
          secondary: '#8b7355',
          accent: '#d4af37',
          background: '#faf8f5',
          surface: '#ffffff',
          text: '#1a1a1a',
          textSecondary: '#5a5a5a',
          border: '#e6d5c3',
          success: '#8b7355',
          warning: '#d4af37',
          danger: '#8b4513'
        },
        typography: {
          fontFamily: 'Cormorant Garamond, serif',
          headingFont: 'Cinzel, serif',
          baseFontSize: '17px',
          headingWeight: '600',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Luxury boutique homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'parallax-section',
                settings: {
                  title: 'Exclusive Collection',
                  subtitle: 'Timeless Elegance',
                  backgroundType: 'image',
                  backgroundImage: '/assets/luxury-hero.jpg',
                  parallaxSpeed: 0.3,
                  minHeight: 700
                }
              },
              {
                type: 'glassmorphism-card',
                settings: {
                  title: 'Our Collections',
                  columns: 3,
                  glassBlur: 15,
                  cards: [
                    { icon: 'bi bi-gem', title: 'Fine Jewelry', description: 'Handcrafted pieces' },
                    { icon: 'bi bi-watch', title: 'Timepieces', description: 'Luxury watches' },
                    { icon: 'bi bi-bag', title: 'Accessories', description: 'Premium leather goods' }
                  ]
                }
              },
              {
                type: 'ecommerce-featured-products',
                settings: {
                  title: 'Featured Pieces',
                  productsToShow: 6,
                  layout: 'elegant',
                  columns: 3
                }
              }
            ]
          },
          {
            name: 'Collections',
            slug: 'collections',
            title: 'Collections',
            description: 'Product collections',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'ecommerce-product-categories',
                settings: {
                  title: 'Browse Collections',
                  layout: 'elegant'
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About',
            description: 'Our heritage',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'split-screen',
                settings: {
                  leftContent: {
                    type: 'image',
                    image: '/assets/luxury-about.jpg',
                    sticky: true
                  },
                  rightContent: {
                    type: 'text',
                    title: 'Our Heritage',
                    content: 'Since 1890, we have been crafting exceptional pieces for discerning clients worldwide.'
                  }
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Reach us',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'contact',
                settings: {
                  title: 'Contact Our Concierge',
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      },

      // 3. Minimal Market - Clean, minimalist store
      {
        id: 'ecommerce-minimal-market',
        name: 'Minimal Market',
        description: 'Ultra-clean, minimalist ecommerce design',
        category: 'ecommerce',
        isPremium: false,
        tenantTypes: [],
        colorScheme: {
          primary: '#2d3436',
          secondary: '#636e72',
          accent: '#00b894',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#2d3436',
          textSecondary: '#636e72',
          border: '#dfe6e9',
          success: '#00b894',
          warning: '#fdcb6e',
          danger: '#d63031'
        },
        typography: {
          fontFamily: 'Lato, sans-serif',
          headingFont: 'Raleway, sans-serif',
          baseFontSize: '16px',
          headingWeight: '300',
          bodyWeight: '300'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Minimalist store homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'Simple. Quality. Essential.',
                  subtitle: '',
                  height: 'medium',
                  backgroundColor: '#f8f9fa',
                  textAlign: 'center'
                }
              },
              {
                type: 'ecommerce-featured-products',
                settings: {
                  title: 'Shop',
                  productsToShow: 9,
                  layout: 'minimal',
                  columns: 3
                }
              }
            ]
          },
          {
            name: 'Products',
            slug: 'products',
            title: 'Products',
            description: 'All products',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'ecommerce-products',
                settings: {
                  layout: 'minimal',
                  columns: 3
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About',
            description: 'About us',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'about',
                settings: {
                  title: 'About',
                  content: 'Curated essentials for modern living.',
                  imagePosition: 'left'
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Contact',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'contact',
                settings: {
                  showForm: true,
                  showContactInfo: false
                }
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Professional Services Templates
   */
  private getServicesTemplates(): CustomPageTemplate[] {
    return [
      // 1. Consulting Pro - Professional consulting firm
      {
        id: 'services-consulting-pro',
        name: 'Consulting Pro',
        description: 'Professional design for consulting and advisory firms',
        category: 'services',
        isPremium: false,
        tenantTypes: [],
        colorScheme: {
          primary: '#0052cc',
          secondary: '#0747a6',
          accent: '#00b8d9',
          background: '#ffffff',
          surface: '#f4f5f7',
          text: '#172b4d',
          textSecondary: '#6b778c',
          border: '#dfe1e6',
          success: '#36b37e',
          warning: '#ffab00',
          danger: '#de350b'
        },
        typography: {
          fontFamily: 'Roboto, sans-serif',
          headingFont: 'Roboto Slab, serif',
          baseFontSize: '16px',
          headingWeight: '700',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Consulting firm homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'Strategic Consulting for Growth',
                  subtitle: 'Transform your business with expert guidance',
                  height: 'large',
                  backgroundImage: '/assets/consulting-hero.jpg',
                  showCTA: true,
                  ctaText: 'Schedule Consultation',
                  ctaLink: '/contact'
                }
              },
              {
                type: 'features',
                settings: {
                  title: 'Our Services',
                  subtitle: 'Comprehensive business solutions',
                  layout: 'grid',
                  columns: 3,
                  features: [
                    { icon: 'bi bi-graph-up', title: 'Strategy Consulting', description: 'Business strategy and planning' },
                    { icon: 'bi bi-people', title: 'Change Management', description: 'Organizational transformation' },
                    { icon: 'bi bi-bar-chart', title: 'Performance Optimization', description: 'Operational excellence' }
                  ]
                }
              },
              {
                type: 'stats-counter',
                settings: {
                  title: 'Our Track Record',
                  stats: [
                    { number: 500, label: 'Clients Served', suffix: '+' },
                    { number: 25, label: 'Years Experience', suffix: '' },
                    { number: 95, label: 'Client Satisfaction', suffix: '%' }
                  ]
                }
              },
              {
                type: 'use-case-cards',
                settings: {
                  title: 'Success Stories',
                  cases: [
                    { title: 'Tech Company Transformation', description: '300% revenue growth in 2 years' },
                    { title: 'Supply Chain Optimization', description: '40% cost reduction achieved' }
                  ]
                }
              },
              {
                type: 'cta',
                settings: {
                  title: 'Ready to Transform Your Business?',
                  subtitle: 'Schedule a free consultation',
                  buttonText: 'Get Started',
                  buttonLink: '/contact'
                }
              }
            ]
          },
          {
            name: 'Services',
            slug: 'services',
            title: 'Services',
            description: 'What we offer',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'feature-grid',
                settings: {
                  title: 'Consulting Services',
                  columns: 2,
                  features: [
                    { title: 'Strategy Consulting', description: 'Business strategy, planning, and execution' },
                    { title: 'Operations', description: 'Process optimization and efficiency' },
                    { title: 'Technology', description: 'Digital transformation and IT strategy' },
                    { title: 'Change Management', description: 'Organizational change and culture' }
                  ]
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About',
            description: 'Our firm',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'about',
                settings: {
                  title: 'About Our Firm',
                  content: 'Leading consulting firm with 25 years of experience helping businesses achieve their goals.'
                }
              },
              {
                type: 'team',
                settings: {
                  title: 'Our Consultants',
                  layout: 'grid',
                  columns: 3
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Get in touch',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'booking-calendar',
                settings: {
                  title: 'Schedule a Consultation',
                  showCalendar: true
                }
              },
              {
                type: 'contact',
                settings: {
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      },

      // 2. Medical Practice - Healthcare professionals
      {
        id: 'services-medical-practice',
        name: 'Medical Practice',
        description: 'Clean, professional design for medical and healthcare practices',
        category: 'services',
        isPremium: false,
        tenantTypes: [],
        colorScheme: {
          primary: '#005eb8',
          secondary: '#003087',
          accent: '#00a9ce',
          background: '#ffffff',
          surface: '#f0f4f5',
          text: '#212b32',
          textSecondary: '#425563',
          border: '#d8dde0',
          success: '#009639',
          warning: '#fa9200',
          danger: '#da291c'
        },
        typography: {
          fontFamily: 'Open Sans, sans-serif',
          headingFont: 'Lato, sans-serif',
          baseFontSize: '16px',
          headingWeight: '700',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Medical practice homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'Compassionate Care, Expert Treatment',
                  subtitle: 'Your health is our priority',
                  height: 'large',
                  backgroundImage: '/assets/medical-hero.jpg',
                  showCTA: true,
                  ctaText: 'Book Appointment',
                  ctaLink: '/appointments'
                }
              },
              {
                type: 'features',
                settings: {
                  title: 'Our Services',
                  columns: 3,
                  features: [
                    { icon: 'bi bi-heart-pulse', title: 'General Medicine', description: 'Comprehensive primary care' },
                    { icon: 'bi bi-clipboard2-pulse', title: 'Diagnostics', description: 'Advanced testing facilities' },
                    { icon: 'bi bi-prescription2', title: 'Specialized Care', description: 'Expert specialists' }
                  ]
                }
              },
              {
                type: 'split-screen',
                settings: {
                  leftContent: {
                    type: 'image',
                    image: '/assets/medical-facility.jpg',
                    sticky: true
                  },
                  rightContent: {
                    type: 'text',
                    title: 'State-of-the-Art Facilities',
                    content: 'Modern equipment and comfortable environment for your care.'
                  }
                }
              },
              {
                type: 'team',
                settings: {
                  title: 'Meet Our Doctors',
                  layout: 'grid',
                  columns: 3
                }
              }
            ]
          },
          {
            name: 'Services',
            slug: 'services',
            title: 'Services',
            description: 'Medical services',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'feature-grid',
                settings: {
                  title: 'Medical Services',
                  columns: 2
                }
              }
            ]
          },
          {
            name: 'Appointments',
            slug: 'appointments',
            title: 'Appointments',
            description: 'Book appointment',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'booking-calendar',
                settings: {
                  title: 'Book an Appointment',
                  showCalendar: true
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Contact us',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'contact',
                settings: {
                  showForm: true,
                  showContactInfo: true,
                  showMap: true
                }
              }
            ]
          }
        ]
      },

      // 3. Creative Agency - Design/marketing agency
      {
        id: 'services-creative-agency',
        name: 'Creative Agency',
        description: 'Bold, creative design for design studios and marketing agencies',
        category: 'services',
        isPremium: true,
        tenantTypes: [],
        colorScheme: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          accent: '#ffe66d',
          background: '#ffffff',
          surface: '#f7f7f7',
          text: '#2d3436',
          textSecondary: '#636e72',
          border: '#dfe6e9',
          success: '#4ecdc4',
          warning: '#ffe66d',
          danger: '#ff6b6b'
        },
        typography: {
          fontFamily: 'Work Sans, sans-serif',
          headingFont: 'Archivo Black, sans-serif',
          baseFontSize: '16px',
          headingWeight: '900',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Creative agency homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'parallax-section',
                settings: {
                  title: 'Creative Solutions That Pop',
                  subtitle: 'Design • Branding • Marketing',
                  backgroundType: 'gradient',
                  gradientStart: '#ff6b6b',
                  gradientEnd: '#4ecdc4',
                  parallaxSpeed: 0.6,
                  minHeight: 650
                }
              },
              {
                type: 'bento-grid',
                settings: {
                  title: 'What We Do',
                  columns: 4,
                  items: [
                    { size: 'large', title: 'Branding', backgroundColor: '#ff6b6b' },
                    { size: 'medium', title: 'Web Design', backgroundColor: '#4ecdc4' },
                    { size: 'medium', title: 'Marketing', backgroundColor: '#ffe66d' },
                    { size: 'small', title: 'Strategy', backgroundColor: '#2d3436' }
                  ]
                }
              },
              {
                type: 'gallery',
                settings: {
                  title: 'Our Work',
                  layout: 'masonry'
                }
              },
              {
                type: 'testimonial-carousel',
                settings: {
                  title: 'Client Love',
                  testimonials: [
                    { text: 'Amazing work! They transformed our brand.', author: 'Tech Startup CEO' }
                  ]
                }
              }
            ]
          },
          {
            name: 'Work',
            slug: 'work',
            title: 'Work',
            description: 'Our portfolio',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'gallery',
                settings: {
                  title: 'Portfolio',
                  layout: 'grid',
                  columns: 3
                }
              }
            ]
          },
          {
            name: 'Services',
            slug: 'services',
            title: 'Services',
            description: 'What we offer',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'glassmorphism-card',
                settings: {
                  title: 'Our Services',
                  columns: 3,
                  cards: [
                    { icon: 'bi bi-palette', title: 'Branding', description: 'Visual identity systems' },
                    { icon: 'bi bi-laptop', title: 'Web Design', description: 'Beautiful, functional websites' },
                    { icon: 'bi bi-megaphone', title: 'Marketing', description: 'Digital marketing campaigns' }
                  ]
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About',
            description: 'Our agency',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'about',
                settings: {
                  title: 'We\'re Creatives',
                  content: 'A team of designers, developers, and strategists creating bold work for bold brands.'
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Start a project',
            showInNavigation: true,
            navigationOrder: 5,
            widgets: [
              {
                type: 'contact',
                settings: {
                  title: 'Let\'s Create Something',
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      },

      // 4. Law Firm - Professional legal services
      {
        id: 'services-law-firm',
        name: 'Law Firm',
        description: 'Professional, authoritative design for legal practices',
        category: 'services',
        isPremium: true,
        tenantTypes: [],
        colorScheme: {
          primary: '#1c3a57',
          secondary: '#2c5282',
          accent: '#b89968',
          background: '#ffffff',
          surface: '#f7fafc',
          text: '#1a202c',
          textSecondary: '#4a5568',
          border: '#e2e8f0',
          success: '#38a169',
          warning: '#d69e2e',
          danger: '#c53030'
        },
        typography: {
          fontFamily: 'Libre Baskerville, serif',
          headingFont: 'Playfair Display, serif',
          baseFontSize: '16px',
          headingWeight: '700',
          bodyWeight: '400'
        },
        pages: [
          {
            name: 'Home',
            slug: 'home',
            title: 'Home',
            description: 'Law firm homepage',
            showInNavigation: true,
            navigationOrder: 1,
            widgets: [
              {
                type: 'hero',
                settings: {
                  title: 'Trusted Legal Counsel',
                  subtitle: 'Excellence in legal representation since 1985',
                  height: 'large',
                  backgroundImage: '/assets/law-hero.jpg',
                  showCTA: true,
                  ctaText: 'Schedule Consultation',
                  ctaLink: '/contact'
                }
              },
              {
                type: 'features',
                settings: {
                  title: 'Practice Areas',
                  columns: 3,
                  features: [
                    { icon: 'bi bi-briefcase', title: 'Corporate Law', description: 'Business legal services' },
                    { icon: 'bi bi-house', title: 'Real Estate', description: 'Property transactions' },
                    { icon: 'bi bi-shield-check', title: 'Litigation', description: 'Court representation' }
                  ]
                }
              },
              {
                type: 'stats-counter',
                settings: {
                  title: 'Our Record',
                  stats: [
                    { number: 35, label: 'Years Experience', suffix: '+' },
                    { number: 95, label: 'Success Rate', suffix: '%' },
                    { number: 1000, label: 'Cases Won', suffix: '+' }
                  ]
                }
              },
              {
                type: 'team',
                settings: {
                  title: 'Our Attorneys',
                  subtitle: 'Experienced legal professionals',
                  layout: 'grid',
                  columns: 3
                }
              },
              {
                type: 'testimonial-carousel',
                settings: {
                  title: 'Client Testimonials',
                  testimonials: [
                    { text: 'Professional, knowledgeable, and dedicated to our case.', author: 'Business Client' }
                  ]
                }
              }
            ]
          },
          {
            name: 'Practice Areas',
            slug: 'practice-areas',
            title: 'Practice Areas',
            description: 'Legal services',
            showInNavigation: true,
            navigationOrder: 2,
            widgets: [
              {
                type: 'feature-grid',
                settings: {
                  title: 'Areas of Practice',
                  columns: 2
                }
              }
            ]
          },
          {
            name: 'Attorneys',
            slug: 'attorneys',
            title: 'Attorneys',
            description: 'Our legal team',
            showInNavigation: true,
            navigationOrder: 3,
            widgets: [
              {
                type: 'team',
                settings: {
                  title: 'Meet Our Attorneys',
                  layout: 'grid',
                  columns: 3
                }
              }
            ]
          },
          {
            name: 'About',
            slug: 'about',
            title: 'About',
            description: 'Our firm',
            showInNavigation: true,
            navigationOrder: 4,
            widgets: [
              {
                type: 'about',
                settings: {
                  title: 'About Our Firm',
                  content: 'Providing exceptional legal representation for over 35 years.'
                }
              }
            ]
          },
          {
            name: 'Contact',
            slug: 'contact',
            title: 'Contact',
            description: 'Get legal help',
            showInNavigation: true,
            navigationOrder: 5,
            widgets: [
              {
                type: 'contact',
                settings: {
                  title: 'Schedule a Consultation',
                  subtitle: 'Confidential case review',
                  showForm: true,
                  showContactInfo: true
                }
              }
            ]
          }
        ]
      }
    ];
  }
}
