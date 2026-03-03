import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DisasterEvent } from './disaster-monitoring.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AdminDisasterService {
    private apiUrl = `${environment.apiUrl}/admin/disasters`;

    constructor(private http: HttpClient) { }

    getPendingAlerts(): Observable<DisasterEvent[]> {
        return this.http.get<DisasterEvent[]>(`${this.apiUrl}/pending`);
    }

    approveAlert(id: number): Observable<DisasterEvent> {
        return this.http.put<DisasterEvent>(`${this.apiUrl}/${id}/approve`, {});
    }

    rejectAlert(id: number, reason?: string): Observable<DisasterEvent> {
        const body = reason ? { reason } : {};
        return this.http.put<DisasterEvent>(`${this.apiUrl}/${id}/reject`, body);
    }
}
