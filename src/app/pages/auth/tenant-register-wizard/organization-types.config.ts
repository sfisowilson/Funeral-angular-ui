// Organization type configuration with specific questions and pricing modifiers
export interface OrganizationType {
    value: number;
    name: string;
    label: string;
    description: string;
    category: 'funeral' | 'nonprofit' | 'business';
    icon: string;
    questions: OrgTypeQuestion[];
    pricingModifier?: number; // Multiplier for base pricing
    features: string[];
}

export interface OrgTypeQuestion {
    id: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'textarea';
    required: boolean;
    placeholder?: string;
    options?: { value: any; label: string }[];
    helpText?: string;
    pricingImpact?: {
        field: string;
        ranges: { min: number; max: number; multiplier: number }[];
    };
}

export const ORGANIZATION_TYPES: OrganizationType[] = [
    // FUNERAL SERVICES
    {
        value: 0,
        name: 'FuneralParlour',
        label: 'Funeral Parlour',
        description: 'Traditional funeral home offering comprehensive funeral services',
        category: 'funeral',
        icon: 'bi-building',
        pricingModifier: 1.2,
        features: [
            'Complete member management',
            'Claims processing',
            'Service booking system',
            'Inventory management',
            'Staff scheduling',
            'Payment processing'
        ],
        questions: [
            {
                id: 'yearsInOperation',
                label: 'Years in Operation',
                type: 'number',
                required: true,
                placeholder: '5',
                helpText: 'How many years has your funeral parlour been operating?'
            },
            {
                id: 'numberOfLocations',
                label: 'Number of Locations',
                type: 'number',
                required: true,
                placeholder: '1',
                helpText: 'How many physical locations do you operate?',
                pricingImpact: {
                    field: 'numberOfLocations',
                    ranges: [
                        { min: 1, max: 1, multiplier: 1.0 },
                        { min: 2, max: 5, multiplier: 1.3 },
                        { min: 6, max: 999, multiplier: 1.5 }
                    ]
                }
            },
            {
                id: 'averageMonthlyFunerals',
                label: 'Average Monthly Funerals',
                type: 'select',
                required: true,
                options: [
                    { value: '1-10', label: '1-10 funerals' },
                    { value: '11-30', label: '11-30 funerals' },
                    { value: '31-60', label: '31-60 funerals' },
                    { value: '60+', label: 'More than 60 funerals' }
                ],
                helpText: 'Approximate number of funerals you conduct monthly',
                pricingImpact: {
                    field: 'averageMonthlyFunerals',
                    ranges: [
                        { min: 0, max: 10, multiplier: 1.0 },
                        { min: 11, max: 30, multiplier: 1.2 },
                        { min: 31, max: 60, multiplier: 1.4 },
                        { min: 61, max: 999, multiplier: 1.6 }
                    ]
                }
            },
            {
                id: 'servicesOffered',
                label: 'Services Offered',
                type: 'checkbox',
                required: true,
                options: [
                    { value: 'traditional', label: 'Traditional Burials' },
                    { value: 'cremation', label: 'Cremation Services' },
                    { value: 'repatriation', label: 'Repatriation' },
                    { value: 'memorial', label: 'Memorial Services' },
                    { value: 'pre-planning', label: 'Pre-Planning' }
                ]
            },
            {
                id: 'needsInventory',
                label: 'Do you need inventory management for caskets, urns, etc.?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            }
        ]
    },
    {
        value: 1,
        name: 'BurialSociety',
        label: 'Burial Society',
        description: 'Community-based burial society providing funeral cover to members',
        category: 'funeral',
        icon: 'bi-people-fill',
        pricingModifier: 1.0,
        features: [
            'Member registration portal',
            'Policy management',
            'Contribution tracking',
            'Claims processing',
            'SMS notifications',
            'Community portal'
        ],
        questions: [
            {
                id: 'currentMembers',
                label: 'Current Number of Members',
                type: 'number',
                required: true,
                placeholder: '100',
                helpText: 'How many active members do you currently have?',
                pricingImpact: {
                    field: 'currentMembers',
                    ranges: [
                        { min: 0, max: 100, multiplier: 1.0 },
                        { min: 101, max: 500, multiplier: 1.2 },
                        { min: 501, max: 1000, multiplier: 1.4 },
                        { min: 1001, max: 999999, multiplier: 1.6 }
                    ]
                }
            },
            {
                id: 'expectedGrowth',
                label: 'Expected Member Growth (next 12 months)',
                type: 'select',
                required: true,
                options: [
                    { value: '0-50', label: '0-50 new members' },
                    { value: '51-200', label: '51-200 new members' },
                    { value: '201-500', label: '201-500 new members' },
                    { value: '500+', label: 'More than 500 new members' }
                ]
            },
            {
                id: 'contributionFrequency',
                label: 'Contribution Frequency',
                type: 'select',
                required: true,
                options: [
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'annually', label: 'Annually' }
                ]
            },
            {
                id: 'needsSmsNotifications',
                label: 'Do you need automated SMS notifications?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ],
                helpText: 'SMS notifications for contributions, claims, meetings, etc.'
            },
            {
                id: 'managementStructure',
                label: 'Management Structure',
                type: 'select',
                required: true,
                options: [
                    { value: 'committee', label: 'Committee-led' },
                    { value: 'elected', label: 'Elected officials' },
                    { value: 'professional', label: 'Professional management' }
                ]
            }
        ]
    },
    {
        value: 2,
        name: 'MemorialServices',
        label: 'Memorial Services',
        description: 'Specialized memorial and tribute services',
        category: 'funeral',
        icon: 'bi-heart-fill',
        pricingModifier: 0.9,
        features: [
            'Online memorial creation',
            'Tribute management',
            'Virtual memorial services',
            'Photo & video galleries',
            'Condolence management',
            'Event coordination'
        ],
        questions: [
            {
                id: 'serviceTypes',
                label: 'Types of Memorial Services',
                type: 'checkbox',
                required: true,
                options: [
                    { value: 'traditional', label: 'Traditional Memorials' },
                    { value: 'virtual', label: 'Virtual/Online Services' },
                    { value: 'celebration', label: 'Celebration of Life' },
                    { value: 'scattering', label: 'Ash Scattering Ceremonies' }
                ]
            },
            {
                id: 'averageMonthlyServices',
                label: 'Average Monthly Memorial Services',
                type: 'number',
                required: true,
                placeholder: '10',
                pricingImpact: {
                    field: 'averageMonthlyServices',
                    ranges: [
                        { min: 0, max: 10, multiplier: 1.0 },
                        { min: 11, max: 30, multiplier: 1.2 },
                        { min: 31, max: 999, multiplier: 1.4 }
                    ]
                }
            },
            {
                id: 'needsVideoStreaming',
                label: 'Need live video streaming capability?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            }
        ]
    },
    {
        value: 3,
        name: 'CremationServices',
        label: 'Cremation Services',
        description: 'Dedicated cremation and ash management services',
        category: 'funeral',
        icon: 'bi-fire',
        pricingModifier: 1.1,
        features: [
            'Cremation scheduling',
            'Ash management',
            'Urn inventory',
            'Memorial products',
            'Compliance tracking',
            'Certificate management'
        ],
        questions: [
            {
                id: 'cremationsPerMonth',
                label: 'Average Monthly Cremations',
                type: 'number',
                required: true,
                placeholder: '20',
                pricingImpact: {
                    field: 'cremationsPerMonth',
                    ranges: [
                        { min: 0, max: 20, multiplier: 1.0 },
                        { min: 21, max: 50, multiplier: 1.3 },
                        { min: 51, max: 999, multiplier: 1.5 }
                    ]
                }
            },
            {
                id: 'offerMemorialProducts',
                label: 'Do you sell memorial products (urns, jewelry, etc.)?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            },
            {
                id: 'scatteringServices',
                label: 'Do you offer ash scattering services?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            }
        ]
    },

    // NON-PROFIT ORGANIZATIONS
    {
        value: 10,
        name: 'NGOCharity',
        label: 'NGO / Charity',
        description: 'Non-profit organization focused on charitable work',
        category: 'nonprofit',
        icon: 'bi-hand-thumbs-up-fill',
        pricingModifier: 0.7, // Discounted for non-profits
        features: [
            'Donor management',
            'Donation processing',
            'Grant tracking',
            'Impact reporting',
            'Volunteer coordination',
            'Event management',
            'Blog & news updates'
        ],
        questions: [
            {
                id: 'registeredNPO',
                label: 'NPO Registration Number',
                type: 'text',
                required: true,
                placeholder: 'NPO123456',
                helpText: 'Your official NPO registration number'
            },
            {
                id: 'focusAreas',
                label: 'Primary Focus Areas',
                type: 'checkbox',
                required: true,
                options: [
                    { value: 'education', label: 'Education' },
                    { value: 'health', label: 'Health & Wellness' },
                    { value: 'poverty', label: 'Poverty Alleviation' },
                    { value: 'environment', label: 'Environmental Conservation' },
                    { value: 'youth', label: 'Youth Development' },
                    { value: 'elderly', label: 'Elderly Care' }
                ]
            },
            {
                id: 'numberOfBeneficiaries',
                label: 'Approximate Number of Beneficiaries',
                type: 'select',
                required: true,
                options: [
                    { value: '0-100', label: '0-100 beneficiaries' },
                    { value: '101-500', label: '101-500 beneficiaries' },
                    { value: '501-1000', label: '501-1,000 beneficiaries' },
                    { value: '1000+', label: 'More than 1,000 beneficiaries' }
                ]
            },
            {
                id: 'needsDonationPortal',
                label: 'Need online donation portal?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            },
            {
                id: 'needsVolunteerManagement',
                label: 'Need volunteer management system?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            }
        ]
    },
    {
        value: 11,
        name: 'CommunityOrganization',
        label: 'Community Organization',
        description: 'Community-focused organization or association',
        category: 'nonprofit',
        icon: 'bi-houses-fill',
        pricingModifier: 0.8,
        features: [
            'Member directory',
            'Event calendar',
            'Community announcements',
            'Discussion forums',
            'Resource sharing',
            'Meeting scheduling'
        ],
        questions: [
            {
                id: 'organizationType',
                label: 'Type of Community Organization',
                type: 'select',
                required: true,
                options: [
                    { value: 'hoa', label: 'Homeowners Association' },
                    { value: 'civic', label: 'Civic Group' },
                    { value: 'sports', label: 'Sports Club' },
                    { value: 'cultural', label: 'Cultural Association' },
                    { value: 'other', label: 'Other' }
                ]
            },
            {
                id: 'memberCount',
                label: 'Number of Members',
                type: 'number',
                required: true,
                placeholder: '50',
                pricingImpact: {
                    field: 'memberCount',
                    ranges: [
                        { min: 0, max: 50, multiplier: 1.0 },
                        { min: 51, max: 200, multiplier: 1.2 },
                        { min: 201, max: 999999, multiplier: 1.4 }
                    ]
                }
            },
            {
                id: 'needsEventManagement',
                label: 'Need event management features?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            }
        ]
    },
    {
        value: 12,
        name: 'ReligiousOrganization',
        label: 'Religious Organization',
        description: 'Church, mosque, temple, or other religious institution',
        category: 'nonprofit',
        icon: 'bi-book-fill',
        pricingModifier: 0.75,
        features: [
            'Congregation management',
            'Event calendar',
            'Online giving',
            'Sermon archives',
            'Small group management',
            'Prayer requests',
            'Volunteer scheduling'
        ],
        questions: [
            {
                id: 'congregationSize',
                label: 'Congregation Size',
                type: 'select',
                required: true,
                options: [
                    { value: '0-100', label: '0-100 members' },
                    { value: '101-300', label: '101-300 members' },
                    { value: '301-1000', label: '301-1,000 members' },
                    { value: '1000+', label: 'More than 1,000 members' }
                ],
                pricingImpact: {
                    field: 'congregationSize',
                    ranges: [
                        { min: 0, max: 100, multiplier: 1.0 },
                        { min: 101, max: 300, multiplier: 1.2 },
                        { min: 301, max: 1000, multiplier: 1.4 },
                        { min: 1001, max: 999999, multiplier: 1.6 }
                    ]
                }
            },
            {
                id: 'needsOnlineGiving',
                label: 'Need online giving/tithes management?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            },
            {
                id: 'needsVideoStreaming',
                label: 'Need video streaming for services?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            }
        ]
    },

    // BUSINESS SERVICES
    {
        value: 20,
        name: 'Ecommerce',
        label: 'E-commerce Store',
        description: 'Online retail store',
        category: 'business',
        icon: 'bi-cart-fill',
        pricingModifier: 1.3,
        features: [
            'Product catalog',
            'Shopping cart',
            'Payment processing',
            'Order management',
            'Inventory tracking',
            'Customer accounts',
            'Shipping integration'
        ],
        questions: [
            {
                id: 'productCount',
                label: 'Expected Number of Products',
                type: 'select',
                required: true,
                options: [
                    { value: '0-50', label: '0-50 products' },
                    { value: '51-200', label: '51-200 products' },
                    { value: '201-1000', label: '201-1,000 products' },
                    { value: '1000+', label: 'More than 1,000 products' }
                ],
                pricingImpact: {
                    field: 'productCount',
                    ranges: [
                        { min: 0, max: 50, multiplier: 1.0 },
                        { min: 51, max: 200, multiplier: 1.3 },
                        { min: 201, max: 1000, multiplier: 1.5 },
                        { min: 1001, max: 999999, multiplier: 1.8 }
                    ]
                }
            },
            {
                id: 'expectedMonthlyOrders',
                label: 'Expected Monthly Orders',
                type: 'select',
                required: true,
                options: [
                    { value: '0-50', label: '0-50 orders' },
                    { value: '51-200', label: '51-200 orders' },
                    { value: '201-500', label: '201-500 orders' },
                    { value: '500+', label: 'More than 500 orders' }
                ]
            },
            {
                id: 'needsShippingIntegration',
                label: 'Need shipping/courier integration?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            },
            {
                id: 'productTypes',
                label: 'Types of Products',
                type: 'checkbox',
                required: true,
                options: [
                    { value: 'physical', label: 'Physical Products' },
                    { value: 'digital', label: 'Digital Products' },
                    { value: 'services', label: 'Services' },
                    { value: 'subscriptions', label: 'Subscriptions' }
                ]
            }
        ]
    },
    {
        value: 21,
        name: 'ProfessionalServices',
        label: 'Professional Services',
        description: 'Consulting, legal, accounting, or other professional services',
        category: 'business',
        icon: 'bi-briefcase-fill',
        pricingModifier: 1.1,
        features: [
            'Appointment booking',
            'Client management',
            'Service catalog',
            'Invoicing',
            'Document management',
            'Time tracking',
            'Client portal'
        ],
        questions: [
            {
                id: 'serviceType',
                label: 'Type of Professional Service',
                type: 'select',
                required: true,
                options: [
                    { value: 'consulting', label: 'Consulting' },
                    { value: 'legal', label: 'Legal Services' },
                    { value: 'accounting', label: 'Accounting/Finance' },
                    { value: 'healthcare', label: 'Healthcare' },
                    { value: 'it', label: 'IT Services' },
                    { value: 'other', label: 'Other' }
                ]
            },
            {
                id: 'teamSize',
                label: 'Team Size',
                type: 'number',
                required: true,
                placeholder: '5',
                pricingImpact: {
                    field: 'teamSize',
                    ranges: [
                        { min: 1, max: 5, multiplier: 1.0 },
                        { min: 6, max: 20, multiplier: 1.3 },
                        { min: 21, max: 999, multiplier: 1.5 }
                    ]
                }
            },
            {
                id: 'needsBookingSystem',
                label: 'Need online booking system?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            }
        ]
    },
    {
        value: 22,
        name: 'HealthcareProvider',
        label: 'Healthcare Provider',
        description: 'Medical practice, clinic, or healthcare facility',
        category: 'business',
        icon: 'bi-hospital-fill',
        pricingModifier: 1.4,
        features: [
            'Patient management',
            'Appointment scheduling',
            'Medical records',
            'Prescription management',
            'Billing & invoicing',
            'Insurance claims',
            'Telemedicine'
        ],
        questions: [
            {
                id: 'facilityType',
                label: 'Type of Healthcare Facility',
                type: 'select',
                required: true,
                options: [
                    { value: 'clinic', label: 'Clinic' },
                    { value: 'hospital', label: 'Hospital' },
                    { value: 'dental', label: 'Dental Practice' },
                    { value: 'pharmacy', label: 'Pharmacy' },
                    { value: 'therapy', label: 'Therapy Practice' }
                ]
            },
            {
                id: 'numberOfPractitioners',
                label: 'Number of Practitioners',
                type: 'number',
                required: true,
                placeholder: '3',
                pricingImpact: {
                    field: 'numberOfPractitioners',
                    ranges: [
                        { min: 1, max: 5, multiplier: 1.0 },
                        { min: 6, max: 15, multiplier: 1.3 },
                        { min: 16, max: 999, multiplier: 1.6 }
                    ]
                }
            },
            {
                id: 'averageDailyPatients',
                label: 'Average Daily Patients',
                type: 'select',
                required: true,
                options: [
                    { value: '0-20', label: '0-20 patients' },
                    { value: '21-50', label: '21-50 patients' },
                    { value: '51-100', label: '51-100 patients' },
                    { value: '100+', label: 'More than 100 patients' }
                ]
            },
            {
                id: 'needsTelemedicine',
                label: 'Need telemedicine/virtual consultations?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            }
        ]
    },
    {
        value: 23,
        name: 'RealEstate',
        label: 'Real Estate',
        description: 'Real estate agency or property management',
        category: 'business',
        icon: 'bi-house-door-fill',
        pricingModifier: 1.2,
        features: [
            'Property listings',
            'Lead management',
            'Virtual tours',
            'Document management',
            'Client portal',
            'CRM integration',
            'Appointment scheduling'
        ],
        questions: [
            {
                id: 'businessType',
                label: 'Type of Real Estate Business',
                type: 'select',
                required: true,
                options: [
                    { value: 'agency', label: 'Real Estate Agency' },
                    { value: 'property-mgmt', label: 'Property Management' },
                    { value: 'developer', label: 'Property Developer' },
                    { value: 'commercial', label: 'Commercial Real Estate' }
                ]
            },
            {
                id: 'numberOfAgents',
                label: 'Number of Agents',
                type: 'number',
                required: true,
                placeholder: '5',
                pricingImpact: {
                    field: 'numberOfAgents',
                    ranges: [
                        { min: 1, max: 5, multiplier: 1.0 },
                        { min: 6, max: 20, multiplier: 1.3 },
                        { min: 21, max: 999, multiplier: 1.5 }
                    ]
                }
            },
            {
                id: 'activeListings',
                label: 'Expected Active Listings',
                type: 'select',
                required: true,
                options: [
                    { value: '0-20', label: '0-20 properties' },
                    { value: '21-50', label: '21-50 properties' },
                    { value: '51-100', label: '51-100 properties' },
                    { value: '100+', label: 'More than 100 properties' }
                ]
            },
            {
                id: 'needsVirtualTours',
                label: 'Need virtual tour capability?',
                type: 'radio',
                required: true,
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ]
            }
        ]
    }
];
