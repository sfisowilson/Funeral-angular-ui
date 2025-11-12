import { Component, OnInit } from '@angular/core';
import { UserProfileServiceProxy, UserProfileDto, UpdateUserProfileDto, AuthServiceProxy, LoginRequest } from '../../core/services/service-proxies';
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
    providers: [UserProfileServiceProxy, MessageService, AuthServiceProxy]
})
export class UserProfileComponent implements OnInit {
    userProfile: UserProfileDto = new UserProfileDto();
    updateUserProfileDto: UpdateUserProfileDto = new UpdateUserProfileDto();

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
        private userProfileService: UserProfileServiceProxy,
        private messageService: MessageService,
        public authService: AuthService,
        private authServiceProxy: AuthServiceProxy
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
            firstName: '',
            lastName: '',
            emailAddress: '',
            phoneNumber: '',
            address: ''
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
        this.userProfileService.userProfile_UpdateCurrentUserProfile(this.updateUserProfileDto).subscribe({
            next: () => {
                this.loadUserProfile(); // Refresh the profile data
                this.isLoading = false;
            },
            error: (error) => {
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

        console.log('Form has been reset to original values');
    }

    // DEBUG LOGIN METHOD - TEMPORARY FOR TESTING
    debugLogin(): void {
        this.debugLoginInProgress = true;
        this.debugLoginMessage = '';
        this.debugLoginSuccess = false;


        // Create proper LoginRequest object
        const loginRequest = new LoginRequest({
            email: this.debugLoginForm.email,
            password: this.debugLoginForm.password
        });

        this.authServiceProxy.auth_Login(loginRequest).subscribe({
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
            error: (error) => {
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
