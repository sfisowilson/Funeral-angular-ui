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
            document.getElementsByTagName('head')[0].appendChild(style);
        }

        let cssVariables = '';
        if (settings.primaryColor) {
            cssVariables += `--primary-color: ${settings.primaryColor};\n`;
        }
        if (settings.secondaryColor) {
            cssVariables += `--secondary-color: ${settings.secondaryColor};\n`;
        }
        if (settings.accentColor) {
            cssVariables += `--accent-color: ${settings.accentColor};\n`;
        }
        if (settings.textColor) {
            cssVariables += `--text-color: ${settings.textColor};\n`;
        }
        if (settings.backgroundColor) {
            cssVariables += `--background-color: ${settings.backgroundColor};\n`;
        }
        if (settings.borderColor) {
            cssVariables += `--border-color: ${settings.borderColor};\n`;
        }
        if (settings.buttonPrimaryHoverBackground) {
            cssVariables += `--button-primary-hover-background: ${settings.buttonPrimaryHoverBackground};\n`;
        }
        if (settings.primaryActiveColor) {
            cssVariables += `--primary-active-color: ${settings.primaryActiveColor};\n`;
        }
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
        if (settings.textMutedColor) {
            cssVariables += `--text-color-secondary: ${settings.textMutedColor};
`;
        }
        if (settings.contentBorderColor) {
            cssVariables += `--surface-border: ${settings.contentBorderColor};
`;
        }
        if (settings.contentBackground) {
            cssVariables += `--surface-card: ${settings.contentBackground};
`;
        }
        if (settings.contentHoverBackground) {
            cssVariables += `--surface-hover: ${settings.contentHoverBackground};
`;
        }
        if (settings.overlayPopoverBackground) {
            cssVariables += `--surface-overlay: ${settings.overlayPopoverBackground};
`;
        }
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

        style.innerHTML = `:root {\n${cssVariables}}`;
    }

    private applyCss(cssContent: any) {
        const head = document.getElementsByTagName('head')[0];
        let style = document.createElement('style');
        style.id = 'tenant-custom-css';
        style.type = 'text/css';
        head.appendChild(style);

        if (typeof cssContent === 'object' && cssContent instanceof Blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    style.innerHTML = event.target.result;
                }
            };
            reader.readAsText(cssContent);
        } else if (typeof cssContent === 'string') {
            style.innerHTML = cssContent;
        }
    }
}
