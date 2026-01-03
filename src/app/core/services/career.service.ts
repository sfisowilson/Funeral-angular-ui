import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// NOTE: No generated proxy exists for Career API endpoints
// Backend may not have Career controller exposed in Swagger

export interface Career {
    id: string;
    jobTitle: string;
    department: string;
    location: string;
    employmentType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship';
    salaryRange?: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    benefitsHighlights: string[];
    applicationDeadline: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CareerStats {
    totalOpenings: number;
    departmentBreakdown: { [key: string]: number };
    employmentTypeBreakdown: { [key: string]: number };
}

@Injectable({
    providedIn: 'root'
})
export class CareerService {
    private baseUrl = '/api/careers';

    constructor(private http: HttpClient) {}

    // Get all careers
    getCareers(): Observable<Career[]> {
        return this.http.get<Career[]>(this.baseUrl);
    }

    // Get active careers for public display
    getActiveCareers(): Observable<Career[]> {
        return this.http.get<Career[]>(`${this.baseUrl}/active`);
    }

    // Get single career
    getCareer(id: string): Observable<Career> {
        return this.http.get<Career>(`${this.baseUrl}/${id}`);
    }

    // Create new career
    createCareer(career: Career): Observable<Career> {
        return this.http.post<Career>(this.baseUrl, career);
    }

    // Update career
    updateCareer(id: string, career: Career): Observable<Career> {
        return this.http.put<Career>(`${this.baseUrl}/${id}`, career);
    }

    // Delete career
    deleteCareer(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    // Toggle career active status
    toggleCareerStatus(id: string, isActive: boolean): Observable<Career> {
        return this.http.patch<Career>(`${this.baseUrl}/${id}/status`, { isActive });
    }

    // Get careers statistics
    getCareerStats(): Observable<CareerStats> {
        return this.http.get<CareerStats>(`${this.baseUrl}/stats`);
    }

    // Apply for a job
    applyForJob(careerId: string, applicationData: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/${careerId}/apply`, applicationData);
    }
}
