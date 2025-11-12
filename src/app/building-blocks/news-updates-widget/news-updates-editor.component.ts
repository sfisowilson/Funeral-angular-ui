import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';

@Component({
    selector: 'app-news-updates-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ColorPickerModule, InputNumberModule, ButtonModule, FieldsetModule, CheckboxModule, CalendarModule],
    template: `
        <div class="news-updates-editor p-4">
            <p-fieldset legend="General Settings">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="title">Title</label>
                        <input pInputText id="title" [(ngModel)]="settings.title" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="subtitle">Subtitle</label>
                        <input pInputText id="subtitle" [(ngModel)]="settings.subtitle" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="readMoreText">Read More Button Text</label>
                        <input pInputText id="readMoreText" [(ngModel)]="settings.readMoreText" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="viewAllButtonText">View All Button Text</label>
                        <input pInputText id="viewAllButtonText" [(ngModel)]="settings.viewAllButtonText" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="allNewsUrl">All News URL</label>
                        <input pInputText id="allNewsUrl" [(ngModel)]="settings.allNewsUrl" placeholder="https://..." class="w-full" />
                    </div>
                    <div class="field flex items-center">
                        <p-checkbox [(ngModel)]="settings.showViewAllButton" inputId="showViewAllButton" [binary]="true"></p-checkbox>
                        <label for="showViewAllButton" class="ml-2">Show View All Button</label>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Styling" class="mt-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="field">
                        <label for="backgroundColor">Background Color</label>
                        <p-colorPicker [(ngModel)]="settings.backgroundColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="titleColor">Title Color</label>
                        <p-colorPicker [(ngModel)]="settings.titleColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="cardBackgroundColor">Card Background</label>
                        <p-colorPicker [(ngModel)]="settings.cardBackgroundColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="titleTextColor">Article Title Color</label>
                        <p-colorPicker [(ngModel)]="settings.titleTextColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="excerptColor">Excerpt Color</label>
                        <p-colorPicker [(ngModel)]="settings.excerptColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="buttonColor">Button Color</label>
                        <p-colorPicker [(ngModel)]="settings.buttonColor" class="w-full"></p-colorPicker>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Articles" class="mt-4">
                <div *ngFor="let article of settings.articles; let i = index" class="article-item border p-4 mb-4 rounded">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="field">
                            <label>Title</label>
                            <input pInputText [(ngModel)]="article.title" placeholder="Article Title" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Category</label>
                            <input pInputText [(ngModel)]="article.category" placeholder="News, Updates, etc." class="w-full" />
                        </div>
                        <div class="field">
                            <label>Author</label>
                            <input pInputText [(ngModel)]="article.author" placeholder="Author Name" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Publish Date</label>
                            <p-calendar [(ngModel)]="article.publishDate" dateFormat="yy-mm-dd" class="w-full"></p-calendar>
                        </div>
                        <div class="field">
                            <label>Image URL</label>
                            <input pInputText [(ngModel)]="article.imageUrl" placeholder="https://..." class="w-full" />
                        </div>
                        <div class="field">
                            <label>Article URL</label>
                            <input pInputText [(ngModel)]="article.url" placeholder="https://..." class="w-full" />
                        </div>
                        <div class="field col-span-full">
                            <label>Excerpt</label>
                            <textarea [(ngModel)]="article.excerpt" placeholder="Brief description of the article..." class="w-full p-3 border border-gray-300 rounded-md" rows="2"></textarea>
                        </div>
                    </div>
                    <button pButton type="button" label="Remove Article" class="p-button-danger p-button-sm mt-2" (click)="removeArticle(i)"></button>
                </div>
                <button pButton type="button" label="Add Article" class="p-button-success" (click)="addArticle()"></button>
            </p-fieldset>

            <div class="mt-4">
                <button pButton type="button" label="Update Widget" (click)="updateWidget()"></button>
            </div>
        </div>
    `
})
export class NewsUpdatesEditorComponent implements OnChanges {
    @Input() config: any = {};
    @Output() update = new EventEmitter<any>();

    settings: any = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config) {
            this.settings = { ...this.config.settings };
        }
    }

    addArticle(): void {
        if (!this.settings.articles) {
            this.settings.articles = [];
        }
        this.settings.articles.push({
            title: 'New Article',
            excerpt: 'Article excerpt...',
            author: '',
            category: 'News',
            publishDate: new Date(),
            imageUrl: '',
            url: ''
        });
    }

    removeArticle(index: number): void {
        this.settings.articles.splice(index, 1);
    }

    updateWidget(): void {
        this.update.emit(this.settings);
    }
}
