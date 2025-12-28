import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';

interface Branch {
    name: string;
    address: string;
    phone: string;
    email: string;
}

interface SocialMedia {
    platform: string;
    url: string;
}

@Component({
    selector: 'app-contact-us-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, TableModule, DialogModule, ConfirmDialogModule, ToastModule, CheckboxModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './contact-us-editor.component.html',
    styleUrls: ['./contact-us-editor.component.scss']
})
export class ContactUsEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();
    settings: any;

    branches: Branch[] = [];
    socialMediaHandles: SocialMedia[] = [];

    displayBranchDialog: boolean = false;
    branch: Branch = { name: '', address: '', phone: '', email: '' };
    branchIndex: number = -1;

    displaySocialMediaDialog: boolean = false;
    socialMedia: SocialMedia = { platform: '', url: '' };
    socialMediaIndex: number = -1;

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.settings = JSON.parse(JSON.stringify(this.config.settings || {}));

        if (!this.settings.title) {
            this.settings.title = 'Get In Touch';
        }
        if (!this.settings.subtitle) {
            this.settings.subtitle = '';
        }
        if (this.settings.showContactForm === undefined) {
            this.settings.showContactForm = false;
        }
        
        this.branches = this.settings.branches ? [...this.settings.branches] : [];
        this.socialMediaHandles = this.settings.socialMediaHandles ? [...this.settings.socialMediaHandles] : [];
    }

    saveSettings(): void {
        this.settings.branches = this.branches;
        this.settings.socialMediaHandles = this.socialMediaHandles;
        this.config.settings = this.settings;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Contact Us settings updated' });
        this.update.emit(this.settings);
    }

    // Branch methods
    openNewBranch() {
        this.branch = { name: '', address: '', phone: '', email: '' };
        this.branchIndex = -1;
        this.displayBranchDialog = true;
    }

    editBranch(branch: Branch, index: number) {
        this.branch = { ...branch };
        this.branchIndex = index;
        this.displayBranchDialog = true;
    }

    saveBranch() {
        if (this.branchIndex === -1) {
            this.branches.push(this.branch);
        } else {
            this.branches[this.branchIndex] = this.branch;
        }
        this.displayBranchDialog = false;
    }

    deleteBranch(index: number) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this branch?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.branches.splice(index, 1);
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Branch Deleted' });
            }
        });
    }

    // Social Media methods
    openNewSocialMedia() {
        this.socialMedia = { platform: '', url: '' };
        this.socialMediaIndex = -1;
        this.displaySocialMediaDialog = true;
    }

    editSocialMedia(socialMedia: SocialMedia, index: number) {
        this.socialMedia = { ...socialMedia };
        this.socialMediaIndex = index;
        this.displaySocialMediaDialog = true;
    }

    saveSocialMedia() {
        if (this.socialMediaIndex === -1) {
            this.socialMediaHandles.push(this.socialMedia);
        } else {
            this.socialMediaHandles[this.socialMediaIndex] = this.socialMedia;
        }
        this.displaySocialMediaDialog = false;
    }

    deleteSocialMedia(index: number) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this social media handle?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.socialMediaHandles.splice(index, 1);
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Social Media Handle Deleted' });
            }
        });
    }
}
