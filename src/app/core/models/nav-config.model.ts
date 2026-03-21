export type NavItemType = 'link' | 'dropdown' | 'mega';

export interface NavMegaColumn {
    id: string;
    header?: string;
    items: NavItem[];
}

export interface NavItem {
    id: string;
    label: string;
    type: NavItemType;
    /** External URL — used for type='link' with an absolute href */
    url?: string;
    /** Internal custom-page slug — rendered as a routerLink */
    slug?: string;
    openInNewTab?: boolean;
    order: number;
    /** Child links for type='dropdown' */
    children?: NavItem[];
    /** Columns for type='mega' */
    megaColumns?: NavMegaColumn[];
}

export interface NavConfigDto {
    items: NavItem[];
}
