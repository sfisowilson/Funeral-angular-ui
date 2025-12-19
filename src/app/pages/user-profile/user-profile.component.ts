import { Component, OnInit } from '@angular/core';
import { UserProfileServiceProxy, UserProfileDto, UpdateUserProfileDto } from '../../core/services/service-proxies';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth-service';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrl: './user-profile.component.css',
    standalone: true,
    imports: [FormsModule, CommonModule],
    providers: [UserProfileServiceProxy]
})
export class UserProfileComponent implements OnInit {
    userProfile: UserProfileDto = new UserProfileDto();
    updateUserProfileDto: UpdateUserProfileDto = new UpdateUserProfileDto();
    isLoading = false;
    successMessage = '';
    errorMessage = '';

    constructor(
        private userProfileService: UserProfileServiceProxy,
        public authService: AuthService
    ) {}

    ngOnInit(): void {
        if (!this.authService.isAuthenticated()) {
            return;
        }

        this.loadUserProfile();
    }

    loadUserProfile(): void {
        this.isLoading = true;
        this.errorMessage = '';

        if (!this.authService.isAuthenticated()) {
            this.isLoading = false;
            return;
        }

        this.userProfileService.userProfile_GetCurrentUserProfile().subscribe({
            next: (profile) => {
                this.userProfile = profile;
                this.updateUserProfileDto.firstName = profile.firstName;
                this.updateUserProfileDto.lastName = profile.lastName;
                this.updateUserProfileDto.phoneNumber = profile.phoneNumber;
                this.updateUserProfileDto.address = profile.address;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading profile:', error);
                this.errorMessage = 'Failed to load profile. Please try again.';
                this.isLoading = false;
            }
        });
    }

    updateProfile(): void {
        if (!this.isFormValid()) {
            this.errorMessage = 'Please fill in all required fields.';
            return;
        }

        this.isLoading = true;
        this.successMessage = '';
        this.errorMessage = '';

        this.userProfileService.userProfile_UpdateCurrentUserProfile(this.updateUserProfileDto).subscribe({
            next: () => {
                this.successMessage = 'Profile updated successfully!';
                this.loadUserProfile();
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (error) => {
                console.error('Error updating profile:', error);
                this.errorMessage = 'Failed to update profile. Please try again.';
                this.isLoading = false;
            }
        });
    }

    isFormValid(): boolean {
        return !!(this.updateUserProfileDto.firstName && this.updateUserProfileDto.lastName);
    }

    resetForm(): void {
        this.updateUserProfileDto.firstName = this.userProfile.firstName;
        this.updateUserProfileDto.lastName = this.userProfile.lastName;
        this.updateUserProfileDto.phoneNumber = this.userProfile.phoneNumber;
        this.updateUserProfileDto.address = this.userProfile.address;
        this.successMessage = '';
        this.errorMessage = '';
    }
}
