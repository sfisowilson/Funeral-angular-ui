import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-news-updates-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <div class="news-updates-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <h2 class="text-center mb-8" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ title }}
                </h2>
                <p *ngIf="subtitle" class="text-center mb-12" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                    {{ subtitle }}
                </p>

                <div *ngIf="articles.length === 0" class="text-center p-8">
                    <p class="text-muted">No articles available. Configure your widget to display news articles.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <article *ngFor="let article of articles" class="news-card bg-white rounded-lg shadow-lg overflow-hidden" [style.background-color]="config.cardBackgroundColor">
                        <div *ngIf="article.imageUrl" class="article-image">
                            <img [src]="article.imageUrl" [alt]="article.title" class="w-full h-48 object-cover" />
                        </div>

                        <div class="article-content p-6">
                            <div class="article-meta mb-3">
                                <span class="text-sm" [style.color]="config.dateColor">
                                    {{ formatDate(article.publishDate) }}
                                </span>
                                <span *ngIf="article.category" class="ml-3 px-2 py-1 text-xs rounded-full" [style.background-color]="config.categoryBackgroundColor" [style.color]="config.categoryTextColor">
                                    {{ article.category }}
                                </span>
                            </div>

                            <h3 class="article-title font-bold mb-3" [style.color]="config.titleTextColor" [style.font-size.px]="config.articleTitleSize">
                                {{ article.title }}
                            </h3>

                            <p class="article-excerpt mb-4" [style.color]="config.excerptColor" [style.font-size.px]="config.excerptSize">
                                {{ article.excerpt }}
                            </p>

                            <div class="article-footer flex justify-between items-center">
                                <span *ngIf="article.author" class="text-sm" [style.color]="config.authorColor"> By {{ article.author }} </span>

                                <button pButton [label]="config.readMoreText || 'Read More'" size="small" [style.background-color]="config.buttonColor" [style.color]="config.buttonTextColor" (click)="openArticle(article)"></button>
                            </div>
                        </div>
                    </article>
                </div>

                <div *ngIf="config.showViewAllButton" class="text-center mt-12">
                    <button pButton [label]="config.viewAllButtonText || 'View All News'" [style.background-color]="config.viewAllButtonColor" [style.color]="config.viewAllButtonTextColor" (click)="viewAllNews()"></button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .news-card {
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
            }
            .news-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            }
            .article-image {
                overflow: hidden;
            }
            .article-image img {
                transition: transform 0.3s ease;
            }
            .news-card:hover .article-image img {
                transform: scale(1.05);
            }
        `
    ]
})
export class NewsUpdatesWidgetComponent implements OnInit {
    @Input() config: any = {};

    constructor() {
        console.log('NewsUpdatesWidgetComponent initialized');
    }

    ngOnInit() {
        console.log('News widget config:', this.config);
        console.log('Articles:', this.articles);
    }

    get articles(): any[] {
        const articles = this.config.articles || [];
        console.log('Getting articles:', articles);
        
        // If no articles provided, show default ones
        if (articles.length === 0) {
            console.log('No articles found, showing defaults');
            return [
                {
                    title: 'Welcome to Our News Section',
                    excerpt: 'This is a default news article. Configure your widget to display your latest news and updates.',
                    author: 'Admin',
                    category: 'Welcome',
                    publishDate: new Date().toISOString(),
                    imageUrl: '',
                    url: ''
                },
                {
                    title: 'Getting Started',
                    excerpt: 'Learn how to configure and customize your news widget to display your content effectively.',
                    author: 'Support Team',
                    category: 'Tutorial',
                    publishDate: new Date(Date.now() - 86400000).toISOString(),
                    imageUrl: '',
                    url: ''
                }
            ];
        }
        
        return articles;
    }

    get title(): string {
        return this.config.title || 'Latest News & Updates';
    }

    get subtitle(): string {
        return this.config.subtitle || '';
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid Date';
        }
    }

    openArticle(article: any): void {
        if (article && article.url) {
            window.open(article.url, '_blank');
        }
    }

    viewAllNews(): void {
        if (this.config && this.config.allNewsUrl) {
            window.open(this.config.allNewsUrl, '_blank');
        }
    }
}
