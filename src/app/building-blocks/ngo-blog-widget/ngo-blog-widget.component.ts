import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { NgoServiceProxy } from '../../core/services/service-proxies';

@Component({
    selector: 'app-ngo-blog-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule],
    template: `
        <div class="ngo-blog-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <h2 class="text-center mb-2" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ config.title || 'Latest Blog Posts' }}
                </h2>
                <p *ngIf="config.subtitle" class="text-center mb-8" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                    {{ config.subtitle }}
                </p>

                <div *ngIf="loading" class="text-center p-8">
                    <p class="text-muted">Loading blog posts...</p>
                </div>

                <div *ngIf="!loading && posts.length === 0" class="text-center p-8">
                    <p class="text-muted">No blog posts available.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <article *ngFor="let post of posts" class="blog-card rounded-lg overflow-hidden shadow-lg" [style.background-color]="config.cardBackgroundColor">
                        <div *ngIf="post.featuredImage" class="blog-image relative">
                            <img [src]="post.featuredImage" [alt]="post.title" class="w-full h-48 object-cover" />
                            <span class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold" 
                                [style.background-color]="getStatusColor(post.status)" 
                                [style.color]="config.statusTextColor">
                                {{ post.status }}
                            </span>
                        </div>

                        <div class="blog-content p-6">
                            <div class="blog-meta mb-3">
                                <span class="text-xs inline-block px-3 py-1 rounded-full mr-2" 
                                    [style.background-color]="config.categoryBackgroundColor" 
                                    [style.color]="config.categoryTextColor">
                                    {{ post.category }}
                                </span>
                                <span class="text-xs" [style.color]="config.dateColor">
                                    {{ formatDate(post.publishDate) }}
                                </span>
                            </div>

                            <h3 class="font-bold mb-2" [style.color]="config.titleTextColor" [style.font-size.px]="config.postTitleSize">
                                {{ post.title }}
                            </h3>

                            <p class="mb-4" [style.color]="config.excerptColor" [style.font-size.px]="config.excerptSize">
                                {{ post.excerpt || post.content?.substring(0, 100) }}{{ (post.excerpt?.length || post.content?.length) > 100 ? '...' : '' }}
                            </p>

                            <div class="blog-footer flex justify-between items-center">
                                <span class="text-xs" [style.color]="config.authorColor">
                                    By {{ post.author }}
                                </span>
                                <button pButton 
                                    [label]="config.readMoreText || 'Read More'" 
                                    size="small" 
                                    [style.background-color]="config.buttonColor" 
                                    [style.color]="config.buttonTextColor"
                                    (click)="readPost(post)"></button>
                            </div>
                        </div>
                    </article>
                </div>

                <div *ngIf="config.showViewAllButton && !loading" class="text-center mt-12">
                    <button pButton 
                        [label]="config.viewAllButtonText || 'View All Posts'" 
                        [style.background-color]="config.viewAllButtonColor" 
                        [style.color]="config.viewAllButtonTextColor"
                        (click)="viewAllPosts()"></button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .blog-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .blog-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }
        .blog-image {
            overflow: hidden;
        }
        .blog-image img {
            transition: transform 0.3s ease;
        }
        .blog-card:hover .blog-image img {
            transform: scale(1.05);
        }
    `]
})
export class NgoBlogWidgetComponent implements OnInit {
    @Input() config: any = {
        title: 'Latest Blog Posts',
        subtitle: '',
        backgroundColor: '#f9fafb',
        padding: 40,
        titleColor: '#111827',
        titleSize: 32,
        subtitleColor: '#6b7280',
        subtitleSize: 16,
        cardBackgroundColor: '#ffffff',
        titleTextColor: '#111827',
        postTitleSize: 18,
        dateColor: '#6b7280',
        excerptColor: '#4b5563',
        excerptSize: 14,
        authorColor: '#9ca3af',
        categoryBackgroundColor: '#dbeafe',
        categoryTextColor: '#1e40af',
        statusTextColor: '#ffffff',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
        readMoreText: 'Read More',
        viewAllButtonColor: '#3b82f6',
        viewAllButtonTextColor: '#ffffff',
        viewAllButtonText: 'View All Posts',
        showViewAllButton: true,
        blogUrl: '/ngo/blog'
    };

    posts: any[] = [];
    loading = true;

    constructor(private ngoService: NgoServiceProxy) {}

    ngOnInit(): void {
        this.loadPosts();
    }

    loadPosts(): void {
        this.loading = true;
        this.ngoService.getNgoBlogPosts().subscribe({
            next: (data: any) => {
                this.posts = (data || []).filter((p: any) => p.status === 'Published').slice(0, 3);
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load blog posts:', error);
                this.loading = false;
            }
        });
    }

    formatDate(date: any): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    getStatusColor(status: string): string {
        switch (status?.toLowerCase()) {
            case 'published': return '#10b981';
            case 'draft': return '#f59e0b';
            case 'archived': return '#6b7280';
            default: return '#6b7280';
        }
    }

    readPost(post: any): void {
        window.location.href = `${this.config.blogUrl}/${post.id}`;
    }

    viewAllPosts(): void {
        window.location.href = this.config.blogUrl;
    }
}
