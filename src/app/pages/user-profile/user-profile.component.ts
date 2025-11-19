import { Component, OnInit } from '@angular/core';
import { UserProfileService } from '../../core/services/generated/user-profile/user-profile.service';
import { AuthService as AuthApiService } from '../../core/services/generated/auth/auth.service';
import { UserProfileDto, UpdateUserProfileDto, LoginRequest } from '../../core/models';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../auth/auth-service';
import { TeamEditorWidgetComponent } from '../../building-blocks/team-editor-widget/team-editor-widget.component';
import { WidgetConfig } from '../../building-blocks/widget-config';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrl: './user-profile.component.css',
    standalone: true,
    imports: [FormsModule, CommonModule, InputTextModule, InputTextarea, TeamEditorWidgetComponent],
    providers: [MessageService]
})
export class UserProfileComponent implements OnInit {
    userProfile: UserProfileDto = {} as UserProfileDto;
    updateUserProfileDto: UpdateUserProfileDto = {} as UpdateUserProfileDto;

    isLoading = false;

    // Debug login form properties
    debugLoginForm = {
        email: 'hostadmin@funeral.com',
        password: 'HostAdmin@123'
    };
    debugLoginInProgress = false;
    debugLoginMessage = '';
    debugLoginSuccess = false;

    // Team component test properties
    showTeamTest = false;
    teamTestMessage = '';
    testTeamConfig: WidgetConfig = {
        id: 'test-team-widget',
        type: 'team-editor',
        settings: {
            title: 'Test Team Widget',
            teamMembers: [
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: 'Developer'
                },
                {
                    id: '2',
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    role: 'Designer'
                }
            ]
        }
    };

    constructor(
        private userProfileService: UserProfileService,
        private messageService: MessageService,
        public authService: AuthService,
        private authApiService: AuthApiService
    ) {}

    ngOnInit(): void {
        if (!this.authService.isAuthenticated()) {
            return;
        }

        // Check if user has required permissions - TEMPORARILY COMMENTED OUT FOR DEBUGGING
        // if (!this.authService.hasPermission('Permission.UserProfile.View')) {
        //   console.error('User does not have Permission.UserProfile.View permission');
        //   console.error('Available permissions:', this.authService.getPermissions());
        //   return;
        // }

        // Initialize with default values to ensure something shows
        this.userProfile = {
            id: '',
            email: '',
            firstName: '',
            lastName: '',
            phoneNumber: '',
            tenantId: '',
            roles: []
        } as UserProfileDto;

        this.updateUserProfileDto = {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            address: ''
        } as UpdateUserProfileDto;

        this.loadUserProfile();
    }

    loadUserProfile(): void {
        this.isLoading = true;

        if (!this.authService.isAuthenticated()) {
            this.isLoading = false;
            return;
        }

        this.userProfileService.getApiUserProfileUserProfileGetCurrent().subscribe({
            next: (profile) => {
                this.userProfile = profile;
                this.updateUserProfileDto.firstName = profile.firstName;
                this.updateUserProfileDto.lastName = profile.lastName;
                this.updateUserProfileDto.phoneNumber = profile.phoneNumber;
                this.isLoading = false;
            },
            error: (error: any) => {
                console.error('Error details:', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    response: error.response,
                    headers: error.headers,
                    url: error.url
                });
                this.isLoading = false;
            }
        });
    }

    updateProfile(): void {
        if (!this.isFormValid()) {
            console.warn('Form is not valid');
            return;
        }

        this.isLoading = true;
        this.userProfileService.putApiUserProfileUserProfileUpdateCurrentUserProfile(this.updateUserProfileDto).subscribe({
            next: () => {
                this.loadUserProfile(); // Refresh the profile data
                this.isLoading = false;
            },
            error: (error: any) => {
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
    }

    // DEBUG LOGIN METHOD - TEMPORARY FOR TESTING
    debugLogin(): void {
        this.debugLoginInProgress = true;
        this.debugLoginMessage = '';
        this.debugLoginSuccess = false;


        // Create proper LoginRequest object
        const loginRequest: LoginRequest = {
            email: this.debugLoginForm.email,
            password: this.debugLoginForm.password
        };

        this.authApiService.postApiAuthAuthLogin(loginRequest as LoginRequest).subscribe({
            next: (token) => {

                if (!token || !token.token) {
                    this.debugLoginMessage = '❌ Login failed: No token received';
                    this.debugLoginSuccess = false;
                    this.debugLoginInProgress = false;
                    return;
                }

                // Set token in auth service
                this.authService.setToken(token.token).subscribe((success) => {
                    if (success) {

                        this.debugLoginMessage = '✅ Login successful! Attempting to load profile...';
                        this.debugLoginSuccess = true;

                        // Try to load the profile immediately
                        setTimeout(() => {
                            this.loadUserProfile();
                        }, 1000);
                    } else {
                        this.debugLoginMessage = '❌ Failed to set authentication token';
                        this.debugLoginSuccess = false;
                    }
                    this.debugLoginInProgress = false;
                });
            },
            error: (error: any) => {
                console.error('❌ Debug login failed:', error);
                this.debugLoginMessage = `❌ Login failed: ${error.message || 'Unknown error'}`;
                this.debugLoginSuccess = false;
                this.debugLoginInProgress = false;
            }
        });
    }

    // TEAM COMPONENT TEST METHOD
    testTeamComponent(): void {
        this.showTeamTest = !this.showTeamTest;

        if (this.showTeamTest) {
            this.teamTestMessage = '✅ Team component is now visible. Check console for any errors.';
        } else {
            this.teamTestMessage = '❌ Team component hidden.';
        }
    }
}
