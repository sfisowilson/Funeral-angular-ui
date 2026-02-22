import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth-service';
import { MemberServiceProxy, MemberProfileCompletionServiceProxy, MemberDto } from './service-proxies';
import { Observable, of, ReplaySubject } from 'rxjs';
import { catchError, first, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MemberContextService {
    private memberSubject: ReplaySubject<MemberDto | null> | null = null;
    private resolvedForUserId: string | null = null;

    constructor(
        private authService: AuthService,
        private memberService: MemberServiceProxy,
        private profileCompletionService: MemberProfileCompletionServiceProxy
    ) {}

    /**
     * Returns a cached snapshot of the current logged-in member (or null).
     * Only hits the API once per browser session and fails open on errors.
     */
    getCurrentMember$(): Observable<MemberDto | null> {
        if (!this.authService.isAuthenticated() || !this.authService.hasRole('Member')) {
            this.memberSubject = null;
            this.resolvedForUserId = null;
            return of(null);
        }

        const currentUserId = this.authService.getUserId();

        // If a different user is now authenticated in the same SPA session,
        // discard cached member context and resolve again.
        if (this.memberSubject && this.resolvedForUserId && currentUserId && this.resolvedForUserId !== currentUserId) {
            this.memberSubject = null;
        }

        if (!this.memberSubject) {
            this.memberSubject = new ReplaySubject<MemberDto | null>(1);
            this.resolveCurrentMember();
        }

        return this.memberSubject.asObservable().pipe(first());
    }

    private resolveCurrentMember(): void {
        if (!this.memberSubject) {
            this.memberSubject = new ReplaySubject<MemberDto | null>(1);
        }

        const userId = this.authService.getUserId();
        this.resolvedForUserId = userId;

        if (userId) {
            this.memberService
                .member_GetById(userId)
                .pipe(
                    first(),
                    catchError((err) => {
                        console.error('MemberContextService: Failed to load member by userId', err);
                        return of(null as MemberDto | null);
                    })
                )
                .subscribe((resp) => {
                    const member = resp && (resp as any).result ? ((resp as any).result as MemberDto) : (null as MemberDto | null);
                    this.memberSubject!.next(member);
                });
            return;
        }

        this.profileCompletionService
            .profileCompletion_GetMyStatus()
            .pipe(
                first(),
                switchMap((statusResponse) => {
                    const memberId = statusResponse?.result?.profileCompletion?.memberId as string | undefined;
                    if (!memberId || memberId === '00000000-0000-0000-0000-000000000000') {
                        return of(null as MemberDto | null);
                    }
                    return this.memberService.member_GetById(memberId).pipe(
                        first(),
                        catchError((err) => {
                            console.error('MemberContextService: Failed to load member by profileCompletion memberId', err);
                            return of(null as MemberDto | null);
                        })
                    );
                }),
                catchError((err) => {
                    console.error('MemberContextService: Failed to resolve profile completion status', err);
                    return of(null as MemberDto | null);
                })
            )
            .subscribe((resp) => {
                const member = resp && (resp as any).result ? ((resp as any).result as MemberDto) : (null as MemberDto | null);
                this.memberSubject!.next(member);
            });
    }
}
