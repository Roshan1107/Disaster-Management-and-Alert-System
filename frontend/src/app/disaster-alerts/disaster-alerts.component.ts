import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DisasterMonitoringService, DisasterEvent } from '../services/disaster-monitoring.service';

@Component({
  selector: 'app-disaster-alerts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
           <div class="d-flex justify-content-between align-items-center mb-4">
              <h2 class="fw-bold mb-0">Priority Alerts</h2>
              <a routerLink="/dashboard" class="btn btn-outline-light btn-sm rounded-pill px-4">Back to Dashboard</a>
           </div>

          <div *ngIf="loading" class="d-flex justify-content-center my-5">
             <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
             </div>
          </div>

          <div *ngIf="error" class="alert alert-danger mb-4 shadow-sm border-0 d-flex align-items-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
             <div>{{ error }}</div>
          </div>
          
          <div *ngFor="let alert of alerts" class="card border-0 mb-4 animate-up">
            <div class="card-body p-4">
               <div class="d-flex align-items-start">
                   <div [class]="getSeverityIconClass(alert.severity)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-megaphone-fill" viewBox="0 0 16 16">
                         <path d="M13 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0v-11zm-1 .724c-2.067.95-4.539 1.481-7 1.636V9.896c2.461-.155 4.933-.686 7-1.636V3.224z"/>
                         <path d="M6.653 9.686c-1.747-.373-3.411-.97-4.89-1.747L.5 6.467A.5.5 0 0 0 0 6.967V13.3a.5.5 0 0 0 .582.492c1.487-.202 3.033-.429 4.622-.647l.088 1.839a.5.5 0 0 0 .573.475c1.411-.082 2.822-.164 4.148-.225l.135 1.868a.5.5 0 0 0 .573.454c1.196-.067 2.39-.115 3.52-.162a.5.5 0 0 0 .42-.486l-.68-9.406a.5.5 0 0 0-.42-.516l-6.417-1.391z"/>
                      </svg>
                   </div>
                   <div>
                       <h5 class="card-title fw-bold mb-1" [class.text-danger]="alert.severity === 'CRITICAL'">{{ alert.title }}</h5>
                       <p class="text-muted small mb-2">{{ alert.region }} • {{ formatDate(alert.createdAt) }}</p>
                       <p class="card-text lead fs-6">{{ alert.message }}</p>
                       <button class="btn btn-sm mt-2" [class]="alert.severity === 'CRITICAL' ? 'btn-danger' : 'btn-warning'">Acknowledge</button>
                   </div>
               </div>
            </div>
          </div>

          <div *ngIf="alerts.length === 0 && !loading" class="text-center text-muted my-5">
              <p>No active alerts to display.</p>
          </div>
          
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-up {
        animation: fadeInUp 0.5s ease-out;
    }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DisasterAlertsComponent implements OnInit {
  alerts: DisasterEvent[] = [];
  loading = false;
  error = '';

  constructor(private disasterService: DisasterMonitoringService) { }

  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.loading = true;
    this.disasterService.getAlerts().subscribe({
      next: (data) => {
        this.alerts = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load data. Please ensure backend is running.';
        this.loading = false;
      }
    });
  }

  getSeverityIconClass(severity: string): string {
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      return 'bg-danger bg-opacity-10 text-danger rounded p-3 me-3';
    }
    return 'bg-warning bg-opacity-10 text-warning rounded p-3 me-3';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
