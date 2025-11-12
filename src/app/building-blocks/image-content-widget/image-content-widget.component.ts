import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WidgetConfig } from '../widget-config';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-image-content-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <div 
            class="image-content-widget"
            [style.background-color]="config.settings.backgroundColor"
            [style.padding.px]="config.settings.padding"
        >
            <!-- Flex layout based on image position -->
            <div [ngClass]="getContainerClasses()">
                <!-- Image Section -->
                <div class="image-section" [ngClass]="getImageSectionClasses()" [style]="{'--image-height': getImageHeight()}">
                    <img 
                        *ngIf="config.settings.imageUrl"
                        [src]="config.settings.imageUrl" 
                        [alt]="config.settings.title"
                        [ngClass]="getImageClasses()"
                        [style.border-radius.px]="config.settings.imageBorderRadius || 8"
                        [style.box-shadow]="config.settings.enableImageShadow ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'"
                    />
                    <div *ngIf="!config.settings.imageUrl" class="placeholder-image">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                        </svg>
                        <p>No image uploaded</p>
                    </div>
                </div>

                <!-- Content Section -->
                <div class="content-section">
                    <!-- Title -->
                    <h2 
                        class="content-title"
                        [style.color]="config.settings.titleColor"
                        [style.font-size.px]="config.settings.titleSize || 32"
                        [style.margin-bottom.px]="config.settings.titleMarginBottom || 16"
                    >
                        {{ config.settings.title }}
                    </h2>

                    <!-- Subtitle -->
                    <h3 
                        *ngIf="config.settings.subtitle"
                        class="content-subtitle"
                        [style.color]="config.settings.subtitleColor"
                        [style.font-size.px]="config.settings.subtitleSize || 20"
                        [style.margin-bottom.px]="config.settings.subtitleMarginBottom || 12"
                    >
                        {{ config.settings.subtitle }}
                    </h3>

                    <!-- Text Content -->
                    <p 
                        class="content-text"
                        [style.color]="config.settings.textColor"
                        [style.font-size.px]="config.settings.textSize || 16"
                        [style.line-height]="config.settings.lineHeight || '1.6'"
                        [style.margin-bottom.px]="config.settings.textMarginBottom || 24"
                    >
                        {{ config.settings.text }}
                    </p>

                    <!-- Action Button -->
                    <div class="button-container">
                        <a 
                            *ngIf="config.settings.showButton"
                            [href]="config.settings.buttonLink"
                            class="action-button"
                            [style.background-color]="config.settings.buttonColor"
                            [style.color]="config.settings.buttonTextColor"
                            [style.padding]="config.settings.buttonPadding || '12px 24px'"
                            [style.font-size.px]="config.settings.buttonTextSize || 16"
                        >
                            {{ config.settings.buttonText }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .image-content-widget {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Container layout variations */
            .layout-left,
            .layout-right {
                display: flex;
                gap: 2rem;
                align-items: center;
                
                @media (max-width: 768px) {
                    flex-direction: column;
                    gap: 1.5rem;
                }
            }

            .layout-right {
                flex-direction: row-reverse;
            }

            .layout-above,
            .layout-below {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .layout-below {
                flex-direction: column-reverse;
            }

            .image-section {
                flex: 0 0 40%;
                display: flex;
                justify-content: center;
                align-items: center;

                @media (max-width: 768px) {
                    flex: 1;
                    width: 100%;
                }

                &.fill-half {
                    flex: 0 0 50%;
                    
                    @media (max-width: 768px) {
                        flex: 1;
                    }
                }

                &.fill-full {
                    flex: 0 0 50%;
                    width: 50%;
                }
            }

            .image-display {
                width: 100%;
                height: auto;
                max-width: 450px;
                object-fit: cover;
                display: block;

                &.fill-half {
                    max-width: 100%;
                }

                &.fill-full {
                    width: 100%;
                    height: auto;
                }

                &.fill-full-with-height {
                    width: 100%;
                    height: var(--image-height, 300px);
                    object-fit: cover;
                }
            }

            .placeholder-image {
                width: 100%;
                max-width: 450px;
                aspect-ratio: 16 / 10;
                background-color: #f0f0f0;
                border: 2px dashed #999;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #999;

                svg {
                    width: 60px;
                    height: 60px;
                    margin-bottom: 1rem;
                }

                p {
                    font-size: 14px;
                    margin: 0;
                }
            }

            .content-section {
                flex: 1;
                display: flex;
                flex-direction: column;

                @media (max-width: 768px) {
                    flex: 1;
                    width: 100%;
                }
            }

            .content-title {
                font-weight: 700;
                line-height: 1.2;
                margin: 0;
            }

            .content-subtitle {
                font-weight: 600;
                line-height: 1.3;
                margin: 0;
            }

            .content-text {
                margin: 0;
                word-break: break-word;
            }

            .button-container {
                display: flex;
                gap: 1rem;
            }

            .action-button {
                display: inline-block;
                text-decoration: none;
                border-radius: 5px;
                font-weight: 600;
                transition: all 0.3s ease;
                cursor: pointer;
                border: none;
                text-align: center;
                white-space: nowrap;

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                &:active {
                    transform: translateY(0);
                }
            }

            /* Responsive adjustments */
            @media (max-width: 640px) {
                .image-section {
                    flex: 1;
                }

                .content-section {
                    flex: 1;
                }

                .image-display,
                .placeholder-image {
                    max-width: 100%;
                }
            }
        `
    ]
})
export class ImageContentWidgetComponent {
    @Input() config!: WidgetConfig;

    getContainerClasses(): string {
        const imagePosition = this.config.settings.imagePosition || 'left';
        return `layout-${imagePosition}`;
    }

    getImageMargin(): string {
        const imageFillMode = this.config.settings.imageFillMode || 'none';
        
        // No margins for fill modes
        if (imageFillMode !== 'none') {
            return '0';
        }

        const imagePosition = this.config.settings.imagePosition || 'left';
        const spacer = '20px';

        if (imagePosition === 'left') {
            return `0 ${spacer} 0 0`;
        } else if (imagePosition === 'right') {
            return `0 0 0 ${spacer}`;
        } else if (imagePosition === 'above') {
            return `0 0 ${spacer} 0`;
        } else if (imagePosition === 'below') {
            return `${spacer} 0 0 0`;
        }
        return '0';
    }

    getImageSectionClasses(): string {
        const imageFillMode = this.config.settings.imageFillMode || 'none';
        
        if (imageFillMode === 'half') {
            return 'fill-half';
        } else if (imageFillMode === 'full') {
            return 'fill-full';
        }
        return '';
    }

    getImageClasses(): string {
        const imageFillMode = this.config.settings.imageFillMode || 'none';
        
        if (imageFillMode === 'half') {
            return 'image-display fill-half';
        } else if (imageFillMode === 'full') {
            return 'image-display fill-full-with-height';
        }
        return 'image-display';
    }

    getImageHeight(): string {
        const imageFillMode = this.config.settings.imageFillMode || 'none';
        const imageHeight = this.config.settings.imageHeight || 300;
        
        if (imageFillMode !== 'none') {
            return `${imageHeight}px`;
        }
        return 'auto';
    }
}
