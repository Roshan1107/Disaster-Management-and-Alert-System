import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-transparent border-bottom border-secondary">
      <div class="container">
        <a class="navbar-brand" href="#">
          <span class="text-primary fw-bold">Disaster</span><span class="text-white">Guard</span>
        </a>
        <button class="btn btn-outline-light btn-sm rounded-pill px-4" (click)="logout()">Logout</button>
      </div>
    </nav>

    <div class="container mt-5">
      <div class="row mb-5">
        <div class="col-md-10 mx-auto">
          <div class="card border-0 shadow-lg overflow-hidden">
             <div class="card-body p-5">
                <div class="row align-items-center">
                   <div class="col-md-8">
                      <h1 class="display-5 fw-bold mb-3">Welcome Back, <span class="text-gradient">Citizen</span></h1>
                      <p class="lead text-muted mb-4">Stay safe and informed with real-time disaster alerts.</p>
                      
                      <div class="d-flex gap-3">
                         <a routerLink="/alerts" class="btn btn-primary btn-lg rounded-pill px-5">View Alerts</a>
                         <button class="btn btn-outline-light btn-lg rounded-pill px-5">Report Incident</button>
                      </div>
                   </div>
                   <div class="col-md-4 text-center d-none d-md-block">
                      <!-- Placeholder for illustration -->
                      <div class="rounded-circle bg-primary bg-opacity-10 p-5 d-inline-block">
                        <span class="display-1">🛡️</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
         <div class="col-md-6 col-lg-4 mx-auto">
            <div class="card h-100 border-0">
               <div class="card-body text-center p-4">
                  <div class="mb-3 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
                      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                    </svg>
                  </div>
                  <h5 class="card-title">User Profile</h5>
                  <p class="card-text text-muted">Role: <strong>{{ userRole }}</strong></p>
                  <button class="btn btn-sm btn-outline-light mt-2">Manage Profile</button>
               </div>
            </div>
         </div>
         
         <div class="col-md-6 col-lg-4 mx-auto">
             <div class="card h-100 border-0">
                <div class="card-body text-center p-4">
                   <div class="mb-3 text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="bi bi-bell-fill" viewBox="0 0 16 16">
                         <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
                      </svg>
                   </div>
                   <h5 class="card-title">Active Alerts</h5>
                   <p class="card-text text-muted">Check for recent emergency notifications.</p>
                   <a routerLink="/alerts" class="btn btn-sm btn-outline-light mt-2">Go to Alerts</a>
                </div>
             </div>
         </div>
      </div>
    </div>
  `,
  styles: [`
    .text-gradient {
        background: linear-gradient(to right, #818cf8, #f472b6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
  `]
})
export class DashboardComponent implements OnInit {
  userRole: string | null = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.userRole = this.authService.getRole();
  }

  logout() {
    this.authService.logout();
  }
}
