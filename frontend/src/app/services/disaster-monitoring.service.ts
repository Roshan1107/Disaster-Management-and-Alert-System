import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

export interface DisasterEvent {
  id: number;
  title: string;
  description: string;
  message?: string;
  region?: string;
  locationName?: string;
  disasterType: string;
  severity: string;
  status: string;
  source?: string;
  externalId?: string;
  latitude?: number;
  longitude?: number;
  eventTime?: string;
  createdAt: string;
  updatedAt?: string;
  pendingSince?: string;
  verifiedAt?: string;
  verifiedBy?: any;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DisasterMonitoringService {
  private apiUrl = 'http://localhost:8080/api/disasters';

  constructor(private http: HttpClient) { }

  getAlerts(filters?: {
    type?: string;
    severity?: string;
    region?: string;
    location?: string;
  }): Observable<DisasterEvent[]> {
    let params = new HttpParams();

    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.severity) {
      params = params.set('severity', filters.severity);
    }
    if (filters?.region) {
      params = params.set('region', filters.region);
    }
    if (filters?.location) {
      params = params.set('location', filters.location);
    }

    return this.http.get<DisasterEvent[]>(this.apiUrl, { params });
  }

  getAlertsWithPolling(intervalMs: number = 30000, filters?: any): Observable<DisasterEvent[]> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getAlerts(filters))
    );
  }

  getAlertById(id: number): Observable<DisasterEvent> {
    return this.http.get<DisasterEvent>(`${this.apiUrl}/${id}`);
  }
}
