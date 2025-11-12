import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    constructor() {}

    setItem(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    getItem<T>(key: string): T | null {
        const item = localStorage.getItem(key);
        if (item) {
            try {
                return JSON.parse(item) as T;
            } catch (e) {
                console.error('Error parsing JSON from localStorage', e);
                return null;
            }
        }
        return null;
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }
}
