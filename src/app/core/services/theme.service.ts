import { Injectable, Inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TenantSettingServiceProxy, TenantSettingDto, API_BASE_URL, FileUploadServiceProxy } from './service-proxies';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantSettingsService } from './tenant-settings.service';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    constructor(
        private sanitizer: DomSanitizer,
        private tenantSettingServiceProxy: TenantSettingServiceProxy,
        private http: HttpClient,
        @Inject(API_BASE_URL) private baseUrl: string,
        private fileUploadServiceProxy: FileUploadServiceProxy,
        private tenantSettingsService: TenantSettingsService
    ) {}

    loadTenantCss() {
        this.tenantSettingsService
            .loadSettings()
            .then((settings: TenantSettingDto) => {
                if (settings.settings) {
                    try {
                        const parsedSettings = JSON.parse(settings.settings);
                        this.applyThemeColors(parsedSettings);

                        const customCssId = parsedSettings.customCssId;
                        if (customCssId) {
                            this.tenantSettingsService.downloadFile(customCssId, 'css').subscribe({
                                next: (cssContent: any) => {
                                    if (cssContent) {
                                        this.applyCss(cssContent);
                                    } else {
                                        console.error('CSS content is null/undefined. Cannot load custom CSS.');
                                    }
                                },
                                error: (error) => {
                                    console.error('Error loading custom CSS:', error);
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing tenant settings JSON:', e);
                    }
                }
            })
            .catch((error) => {
                console.error('Error loading tenant settings:', error);
            });
    }

    private applyThemeColors(settings: any) {
        let style = document.getElementById('tenant-theme-colors') as HTMLStyleElement;
        if (!style) {
            style = document.createElement('style');
            style.id = 'tenant-theme-colors';
            style.type = 'text/css';
            // Insert before any custom CSS to ensure custom CSS has higher priority
            const customCssElement = document.getElementById('tenant-custom-css');
            if (customCssElement) {
                document.getElementsByTagName('head')[0].insertBefore(style, customCssElement);
            } else {
                document.getElementsByTagName('head')[0].appendChild(style);
            }
        }

        let cssVariables = '';
        
        // Theme colors with fallback defaults
        const primaryColor = settings.primaryColor || '#667eea';
        const secondaryColor = settings.secondaryColor || '#f8e0c0';
        const accentColor = settings.accentColor || '#764ba2';
        const textColor = settings.textColor || '#333333';
        const backgroundColor = settings.backgroundColor || '#ffffff';
        const borderColor = settings.borderColor || '#e5e7eb';
        
        cssVariables += `--primary-color: ${primaryColor};\n`;
        cssVariables += `--secondary-color: ${secondaryColor};\n`;
        cssVariables += `--accent-color: ${accentColor};\n`;
        cssVariables += `--text-color: ${textColor};\n`;
        cssVariables += `--background-color: ${backgroundColor};\n`;
        cssVariables += `--border-color: ${borderColor};\n`;
        const primaryActiveColor = settings.primaryActiveColor || '#4355b8';
        cssVariables += `--primary-active-color: ${primaryActiveColor};\n`;
        
        // Button-specific variables
        if (settings.buttonPrimaryBackground) {
            cssVariables += `--button-primary-background: ${settings.buttonPrimaryBackground};\n`;
            // Auto-calculate border if not set (matches background)
            cssVariables += `--button-primary-border: ${settings.buttonPrimaryBorder || settings.buttonPrimaryBackground};\n`;
        }
        if (settings.buttonPrimaryColor) {
            cssVariables += `--button-primary-color: ${settings.buttonPrimaryColor};\n`;
        }
        if (settings.buttonPrimaryHoverBackground || settings.buttonPrimaryBackground) {
            // Use explicit hover or darken the primary background by 10%
            const hoverColor = settings.buttonPrimaryHoverBackground || this.darkenColor(settings.buttonPrimaryBackground, 10);
            cssVariables += `--button-primary-hover-background: ${hoverColor};\n`;
        }
        if (settings.buttonSecondaryBackground) {
            cssVariables += `--button-secondary-background: ${settings.buttonSecondaryBackground};\n`;
            // Auto-calculate border if not set (matches background)
            cssVariables += `--button-secondary-border: ${settings.buttonSecondaryBorder || settings.buttonSecondaryBackground};\n`;
        }
        if (settings.buttonSecondaryColor) {
            cssVariables += `--button-secondary-color: ${settings.buttonSecondaryColor};\n`;
        }
        if (settings.buttonSecondaryHoverBackground || settings.buttonSecondaryBackground) {
            // Use explicit hover or darken the secondary background by 10%
            const hoverColor = settings.buttonSecondaryHoverBackground || this.darkenColor(settings.buttonSecondaryBackground, 10);
            cssVariables += `--button-secondary-hover-background: ${hoverColor};\n`;
        }
        if (settings.buttonDangerBackground) {
            cssVariables += `--button-danger-background: ${settings.buttonDangerBackground};\n`;
            // Auto-calculate border if not set (matches background)
            cssVariables += `--button-danger-border: ${settings.buttonDangerBorder || settings.buttonDangerBackground};\n`;
        }
        if (settings.buttonDangerColor) {
            cssVariables += `--button-danger-color: ${settings.buttonDangerColor};\n`;
        }
        if (settings.buttonDangerHoverBackground || settings.buttonDangerBackground) {
            // Use explicit hover or darken the danger background by 10%
            const hoverColor = settings.buttonDangerHoverBackground || this.darkenColor(settings.buttonDangerBackground, 10);
            cssVariables += `--button-danger-hover-background: ${hoverColor};\n`;
        }
        if (settings.buttonWarningBackground) {
            cssVariables += `--button-warning-background: ${settings.buttonWarningBackground};\n`;
            // Auto-calculate border if not set (matches background)
            cssVariables += `--button-warning-border: ${settings.buttonWarningBorder || settings.buttonWarningBackground};\n`;
        }
        if (settings.buttonWarningColor) {
            cssVariables += `--button-warning-color: ${settings.buttonWarningColor};\n`;
        }
        if (settings.buttonWarningHoverBackground || settings.buttonWarningBackground) {
            // Use explicit hover or darken the warning background by 10%
            const hoverColor = settings.buttonWarningHoverBackground || this.darkenColor(settings.buttonWarningBackground, 10);
            cssVariables += `--button-warning-hover-background: ${hoverColor};\n`;
        }
        if (settings.buttonBorderRadius) {
            cssVariables += `--button-border-radius: ${settings.buttonBorderRadius};\n`;
        }
        if (settings.buttonPadding) {
            cssVariables += `--button-padding: ${settings.buttonPadding};\n`;
        }
        if (settings.buttonFontSize) {
            cssVariables += `--button-font-size: ${settings.buttonFontSize};\n`;
        }
        if (settings.buttonFontWeight) {
            cssVariables += `--button-font-weight: ${settings.buttonFontWeight};\n`;
        }
        
        // Typography
        if (settings.fontFamily) {
            cssVariables += `--font-family: ${settings.fontFamily};\n`;
        }
        if (settings.fontSize) {
            cssVariables += `--font-size: ${settings.fontSize};\n`;
        }
        if (settings.fontWeight) {
            cssVariables += `--font-weight: ${settings.fontWeight};\n`;
        }
        if (settings.lineHeight) {
            cssVariables += `--line-height: ${settings.lineHeight};
`;
        }
        if (settings.primaryContrastColor) {
            cssVariables += `--primary-contrast-color: ${settings.primaryContrastColor};
`;
        }
        // Auto-derive surface colors from theme colors for better user experience
        // Surface and layout colors (use the already-defined variables with fallbacks)
        cssVariables += `--text-color-secondary: #6b7280;
`;
        cssVariables += `--surface-border: ${borderColor};
`;
        cssVariables += `--surface-card: ${backgroundColor};
`;
        cssVariables += `--bs-card-bg: ${backgroundColor};
`; // Bootstrap compatibility
        cssVariables += `--surface-hover: ${this.lightenColor(backgroundColor, 3)};
`;
        cssVariables += `--surface-overlay: ${backgroundColor};
`;
        cssVariables += `--surface-ground: ${this.lightenColor(backgroundColor, 2)};
`;
        if (settings.transitionDuration) {
            cssVariables += `--transition-duration: ${settings.transitionDuration};
`;
        }
        if (settings.maskBackground) {
            cssVariables += `--maskbg: ${settings.maskBackground};
`;
        }
        if (settings.contentBorderRadius) {
            cssVariables += `--content-border-radius: ${settings.contentBorderRadius};
`;
        }
        if (settings.layoutSectionTransitionDuration) {
            cssVariables += `--layout-section-transition-duration: ${settings.layoutSectionTransitionDuration};
`;
        }
        if (settings.elementTransitionDuration) {
            cssVariables += `--element-transition-duration: ${settings.elementTransitionDuration};
`;
        }
        if (settings.focusRingWidth) {
            cssVariables += `--focus-ring-width: ${settings.focusRingWidth};
`;
        }
        if (settings.focusRingStyle) {
            cssVariables += `--focus-ring-style: ${settings.focusRingStyle};
`;
        }
        if (settings.focusRingColor) {
            cssVariables += `--focus-ring-color: ${settings.focusRingColor};
`;
        }
        if (settings.focusRingOffset) {
            cssVariables += `--focus-ring-offset: ${settings.focusRingOffset};
`;
        }
        if (settings.focusRingShadow) {
            cssVariables += `--focus-ring-shadow: ${settings.focusRingShadow};
`;
        }
        if (settings.surface950) {
            cssVariables += `--surface-ground: ${settings.surface950};
`;
        }
        if (settings.surface800) {
            cssVariables += `--code-background: ${settings.surface800};
`;

        // Common semantic colors
        if (settings.successColor) {
            cssVariables += `--success-color: ${settings.successColor};\n`;
        }
        if (settings.errorColor) {
            cssVariables += `--error-color: ${settings.errorColor};\n`;
        }
        if (settings.warningColor) {
            cssVariables += `--warning-color: ${settings.warningColor};\n`;
        }
        if (settings.infoColor) {
            cssVariables += `--info-color: ${settings.infoColor};\n`;
        }
        if (settings.mutedColor) {
            cssVariables += `--muted-color: ${settings.mutedColor};\n`;
        }
        if (settings.textDarkColor) {
            cssVariables += `--text-dark: ${settings.textDarkColor};\n`;
        }
        if (settings.whiteColor) {
            cssVariables += `--white: ${settings.whiteColor};\n`;
        }
        if (settings.blackColor) {
            cssVariables += `--black: ${settings.blackColor};\n`;
        }
        if (settings.spinnerBorderColor) {
            cssVariables += `--spinner-border: ${settings.spinnerBorderColor};\n`;
        }
        if (settings.spinnerTopColor) {
            cssVariables += `--spinner-top: ${settings.spinnerTopColor};\n`;
        }
        }
        if (settings.surface100) {
            cssVariables += `--code-color: ${settings.surface100};
`;
        }
        if (settings.surface900) {
            cssVariables += `--code-background: ${settings.surface900};
`;
        }
        if (settings.surface200) {
            cssVariables += `--code-color: ${settings.surface200};
`;
        }

        // Auth page specific variables (map existing tenant settings to auth-specific CSS vars)
        // Background gradient for auth pages
        if (settings.primaryColor) {
            cssVariables += `--auth-bg-start: ${settings.primaryColor};\n`;
        }
        if (settings.accentColor) {
            cssVariables += `--auth-bg-end: ${settings.accentColor};\n`;
        } else if (settings.secondaryColor) {
            cssVariables += `--auth-bg-end: ${settings.secondaryColor};\n`;
        }

        // Auth wrapper (card) background and text
        if (settings.contentBackground) {
            cssVariables += `--auth-wrapper-bg: ${settings.contentBackground};\n`;
        }
        if (settings.textColor) {
            cssVariables += `--auth-text-color: ${settings.textColor};\n`;
        }

        // Auth button styles
        if (settings.buttonPrimaryBackground) {
            cssVariables += `--auth-button-start: ${settings.buttonPrimaryBackground};\n`;
        } else if (settings.primaryColor) {
            cssVariables += `--auth-button-start: ${settings.primaryColor};\n`;
        }
        if (settings.primaryActiveColor) {
            cssVariables += `--auth-button-end: ${settings.primaryActiveColor};\n`;
        } else if (settings.accentColor) {
            cssVariables += `--auth-button-end: ${settings.accentColor};\n`;
        }

        // Input and placeholder colors
        if (settings.contentBorderColor) {
            cssVariables += `--auth-input-border: ${settings.contentBorderColor};\n`;
        }
        if (settings.textMutedColor) {
            cssVariables += `--auth-placeholder-color: ${settings.textMutedColor};\n`;
        }

        style.innerHTML = `:root {\n${cssVariables}}`;
    }

    private applyCss(cssContent: any) {
        // Remove existing custom CSS if present to avoid duplicates
        const existingStyle = document.getElementById('tenant-custom-css');
        if (existingStyle) {
            existingStyle.remove();
        }

        const head = document.getElementsByTagName('head')[0];
        let style = document.createElement('style');
        style.id = 'tenant-custom-css';
        style.type = 'text/css';
        
        // Add high priority by appending at the end of head (loaded last = highest priority)
        // Also ensure it overrides everything with higher specificity
        head.appendChild(style);

        const applyStyleContent = (content: string) => {
            // Wrap all rules in :root to increase specificity if needed
            // This ensures custom CSS can override even !important rules from other sources
            style.innerHTML = content;
            
            // Log for debugging
            console.log('Custom CSS applied successfully. Length:', content.length);
        };

        if (typeof cssContent === 'object' && cssContent instanceof Blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    applyStyleContent(event.target.result);
                }
            };
            reader.readAsText(cssContent);
        } else if (typeof cssContent === 'string') {
            applyStyleContent(cssContent);
        }
    }

    private darkenColor(color: string, percent: number): string {
        // Parse hex color
        if (!color || !color.startsWith('#')) return color;
        
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16)
            .slice(1)
            .toUpperCase();
    }

    private lightenColor(color: string, percent: number): string {
        // Parse hex color
        if (!color || !color.startsWith('#')) return color;
        
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16)
            .slice(1)
            .toUpperCase();
    }
}
