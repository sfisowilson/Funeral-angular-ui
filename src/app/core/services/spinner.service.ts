import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SpinnerService {
    private isLoadingSubject = new BehaviorSubject<boolean>(false);
    isLoading$ = this.isLoadingSubject.asObservable();

    constructor() {}

    show(): void {
        this.isLoadingSubject.next(true);
    }

    hide(): void {
        this.isLoadingSubject.next(false);
    }
}
