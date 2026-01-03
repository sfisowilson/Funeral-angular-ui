export interface CustomPage {
    id?: string;
    tenantId?: string;
    name: string;
    slug: string;
    title: string;
    description?: string;
    content: PageWidget[];
    isPublic: boolean;
    requiresAuth: boolean;
    showInNavbar: boolean;
    showInFooter: boolean;
    navbarOrder?: number;
    footerOrder?: number;
    isActive: boolean;
    metaTags?: PageMetaTags;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PageWidget {
    id: string;
    type: string;
    config: any;
    order: number;
}

export interface PageMetaTags {
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
}

export interface PageListItem {
    id: string;
    name: string;
    slug: string;
    isPublic: boolean;
    requiresAuth: boolean;
    isActive: boolean;
    showInNavbar: boolean;
    showInFooter: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePageRequest {
    name: string;
    slug: string;
    title: string;
    description?: string;
    isPublic: boolean;
    requiresAuth: boolean;
    showInNavbar: boolean;
    showInFooter: boolean;
}

export interface UpdatePageRequest extends CreatePageRequest {
    id: string;
    content: PageWidget[];
    isActive: boolean;
    navbarOrder?: number;
    footerOrder?: number;
    metaTags?: PageMetaTags;
}

export interface PageLimits {
    maxPages: number;
    currentPages: number;
    canCreateMore: boolean;
}
