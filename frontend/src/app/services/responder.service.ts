import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DisasterEvent } from './disaster-monitoring.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ResponderService {
    private apiUrl = `${environment.apiUrl}/responder`;

    constructor(private http: HttpClient) { }

    /** Get alerts awaiting responder review (SENT_TO_RESPONDER or AUTO_ESCALATED) */
    getResponderAlerts(): Observable<DisasterEvent[]> {
        return this.http.get<DisasterEvent[]>(`${this.apiUrl}/alerts`);
    }

    /** Forward an alert to citizens (sets status to ACTIVE) */
    forwardToCitizen(id: number): Observable<DisasterEvent> {
        return this.http.put<DisasterEvent>(`${this.apiUrl}/alerts/${id}/forward`, {});
    }
}
