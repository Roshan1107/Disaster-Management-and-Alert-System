import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Disaster<span class="highlight">Guard</span></h2>
        </div>

        <div class="profile-summary">
          <div class="avatar">C</div>
          <div>
             <p class="name">Citizen User</p>
             <p class="role">Public Access</p>
          </div>
        </div>

        <nav class="nav-links">
          <a (click)="activeTab = 'dashboard'" [class.active]="activeTab === 'dashboard'">
            <span>🏠</span> Overview
          </a>
          <a (click)="activeTab = 'alerts'" [class.active]="activeTab === 'alerts'">
            <span>🔔</span> Active Alerts
          </a>
          <a (click)="activeTab = 'reports'" [class.active]="activeTab === 'reports'">
            <span>🚑</span> Request Help
          </a>
          <a (click)="activeTab = 'profile'" [class.active]="activeTab === 'profile'">
            <span>👤</span> My Profile
          </a>
        </nav>

        <button class="logout-btn" (click)="logout()">
          <span>🚪</span> Logout
        </button>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="main-content">
        <div class="top-bar">
          <h1>{{ getPageTitle() }}</h1>
          <div class="date">{{ currentDate | date:'fullDate' }}</div>
        </div>

        <div class="content-scroll">
          
          <!-- DASHBOARD TAB -->
          <div *ngIf="activeTab === 'dashboard'" class="fade-in">
             
             <!-- Search & Filter -->
             <div class="search-section">
                <input type="text" placeholder="Search location..." [(ngModel)]="searchQuery" (keyup.enter)="searchLocation()" class="search-input">
                <div class="filters">
                   <!-- Type Filter Dropdown -->
                   <div class="dropdown">
                      <button class="chip" (click)="toggleDropdown('type')">Type: {{ getFilterLabel('type') }} ⌄</button>
                      <div class="dropdown-content" *ngIf="activeDropdown === 'type'">
                         <a (click)="setFilter('type', '')">All</a>
                         <a (click)="setFilter('type', 'FLOOD')">Flood</a>
                         <a (click)="setFilter('type', 'EARTHQUAKE')">Earthquake</a>
                         <a (click)="setFilter('type', 'FIRE')">Fire</a>
                         <a (click)="setFilter('type', 'STORM')">Storm</a>
                      </div>
                   </div>

                   <!-- Severity Filter Dropdown -->
                   <div class="dropdown">
                      <button class="chip" (click)="toggleDropdown('severity')">Severity: {{ getFilterLabel('severity') }} ⌄</button>
                      <div class="dropdown-content" *ngIf="activeDropdown === 'severity'">
                         <a (click)="setFilter('severity', '')">All</a>
                         <a (click)="setFilter('severity', 'CRITICAL')">Critical</a>
                         <a (click)="setFilter('severity', 'HIGH')">High</a>
                         <a (click)="setFilter('severity', 'MEDIUM')">Medium</a>
                         <a (click)="setFilter('severity', 'LOW')">Low</a>
                      </div>
                   </div>

                   <span class="chip" [class.active]="isNearMeActive" (click)="toggleNearMe()">Near Me</span>
                   <button class="secondary-btn btn-sm" *ngIf="hasActiveFilters()" (click)="clearFilters()">Clear</button>
                </div>
             </div>

             <div class="card map-card">
              <h3>Live Incident Map</h3>
              <div class="map-container">
                 <iframe 
                  width="100%" 
                  height="300" 
                  frameborder="0" 
                  scrolling="no" 
                  marginheight="0" 
                  marginwidth="0" 
                  [src]="mapUrl">
                </iframe>
              </div>
              <p class="map-caption" *ngIf="mapLocationName">Showing: {{ mapLocationName }}</p>
             </div>

             <div class="card">
               <h3>Nearby Alerts</h3>
               <div *ngIf="alerts.length === 0" class="empty-state">No active alerts match your criteria. Stay safe.</div>
               
               <div *ngFor="let alert of alerts.slice(0, 3)" class="alert-item animate-up">
                 <div class="alert-icon">{{ getIcon(alert.disasterType) }}</div>
                 <div class="alert-info">
                   <h4>{{ alert.title || alert.disasterType }}</h4>
                   <p>{{ alert.region }}</p>
                 </div>
                 <div class="severity-badge" [ngClass]="alert.severity.toLowerCase()">{{ alert.severity }}</div>
               </div>
               
               <div class="mt-4" *ngIf="alerts.length > 3">
                 <button class="secondary-btn" (click)="activeTab = 'alerts'">View All Alerts</button>
               </div>
             </div>
          </div>

          <!-- ALERTS TAB -->
          <div *ngIf="activeTab === 'alerts'" class="fade-in">
            <div class="card">
              <div class="flex-header">
                <h3>All Active Alerts</h3>
                <button class="secondary-btn" (click)="loadAlerts()">Refresh</button>
              </div>

              <div *ngFor="let alert of alerts" class="alert-card-lg animate-up">
                <div class="alert-header">
                   <div class="icon-box">{{ getIcon(alert.disasterType) }}</div>
                   <div class="header-text">
                     <h3>{{ alert.title }}</h3>
                     <small>{{ alert.createdAt | date:'medium' }}</small>
                   </div>
                   <div class="severity-badge" [ngClass]="alert.severity.toLowerCase()">{{ alert.severity }}</div>
                </div>
                <p class="alert-body">{{ alert.description }}</p>
                <div class="alert-footer">
                  <span>📍 {{ alert.region }}</span>
                </div>
              </div>

              <div *ngIf="alerts.length === 0" class="empty-state">No alerts found.</div>
            </div>
          </div>

          <!-- REPORTS TAB -->
          <div *ngIf="activeTab === 'reports'" class="fade-in">
             <div class="card danger-zone">
               <h3>Emergency Assistance</h3>
               <p>If you are in immediate danger, request help now. Your location will be shared with responders.</p>
               
               <button class="danger-btn-lg" (click)="requestHelp()" [disabled]="isLoading">
                 <span class="sos-icon">🆘</span>
                 {{ isLoading ? 'CONNECTING...' : 'REQUEST IMMEDIATE HELP' }}
               </button>
             </div>
          </div>

          <!-- PROFILE TAB -->
          <div *ngIf="activeTab === 'profile'" class="fade-in">
             <div class="card profile-card">
               <div class="avatar-large">C</div>
               <h2>Citizen User</h2>
               <p>San Francisco, CA</p>
               <button class="primary-btn" (click)="shareLocation()">Update My Location</button>
             </div>
          </div>

          <div *ngIf="message" class="message" [ngClass]="{'error': isError, 'success': !isError}">{{ message }}</div>

        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; font-family: 'Inter', sans-serif; color: #1e293b; }
    .dashboard-container { display: flex; height: 100%; background-color: #f8fafc; }
    
    /* SIDEBAR */
    .sidebar { width: 270px; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); color: white; display: flex; flex-direction: column; padding: 24px 20px; box-shadow: 4px 0 24px rgba(0,0,0,0.15); z-index: 10; }
    .sidebar-header { margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid rgba(107,127,94,0.2); }
    .sidebar-header h2 { margin: 0; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; }
    .highlight { background: linear-gradient(135deg, #8fa382, #a3b18a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    
    .profile-summary { display: flex; align-items: center; gap: 14px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 24px; }
    .avatar { width: 44px; height: 44px; background: linear-gradient(135deg, #7d8c6e, #546747); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; color: white; box-shadow: 0 4px 12px rgba(84,103,71,0.3); }
    .avatar-large { width: 90px; height: 90px; background: linear-gradient(135deg, #7d8c6e, #546747); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 2.2rem; color: white; margin: 0 auto 20px; box-shadow: 0 8px 24px rgba(84,103,71,0.25); }
    
    .name { margin: 0; font-weight: 600; font-size: 0.9rem; color: #e2e8f0; }
    .role { margin: 2px 0 0; color: #64748b; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }

    .nav-links { display: flex; flex-direction: column; gap: 4px; flex: 1; margin-top: 4px; }
    .nav-links a { padding: 11px 14px; border-radius: 10px; cursor: pointer; transition: all 0.2s cubic-bezier(.4,0,.2,1); display: flex; align-items: center; gap: 12px; color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.9rem; position: relative; }
    .nav-links a:hover { background: rgba(107,127,94,0.1); color: #c5d3b8; }
    .nav-links a.active { background: rgba(107,127,94,0.15); color: white; }
    .nav-links a.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 20px; background: linear-gradient(180deg, #8fa382, #6b7f5e); border-radius: 0 4px 4px 0; }
    .nav-links a span { font-size: 1.05rem; }
    
    .logout-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 12px 14px; display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 500; width: 100%; text-align: left; margin-top: auto; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; transition: all 0.2s; border-radius: 8px; }
    .logout-btn:hover { color: #f87171; background: rgba(239,68,68,0.08); }

    /* MAIN CONTENT */
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .top-bar { background: white; padding: 18px 36px; border-bottom: none; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 0 #e2e8f0; position: relative; }
    .top-bar::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #7d8c6e, #a3b18a, transparent); }
    .top-bar h1 { font-size: 1.5rem; color: #0f172a; margin: 0; font-weight: 700; letter-spacing: -0.02em; }
    .date { color: #94a3b8; font-size: 0.85rem; font-weight: 500; }

    .content-scroll { padding: 28px 36px; overflow-y: auto; flex: 1; }
    
    .card { background: white; padding: 28px; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 24px; border: 1px solid #f1f5f9; border-left: 4px solid #6b7f5e; transition: box-shadow 0.3s, transform 0.2s; }
    .card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .card.map-card { border-left-color: #546747; }
    .map-container { position: relative; height: 300px; border-radius: 12px; overflow: hidden; background: #e2e8f0; margin-top: 16px; border: 1px solid #e2e8f0; }
    .map-caption { font-size: 0.8rem; color: #94a3b8; margin-top: 8px; text-align: right; font-weight: 500; }
    
    .card h3 { margin-top: 0; color: #0f172a; font-size: 1.2rem; margin-bottom: 16px; font-weight: 700; letter-spacing: -0.01em; }

    /* SEARCH & FILTERS */
    .search-section { display: flex; gap: 14px; margin-bottom: 24px; align-items: center; flex-wrap: wrap; padding: 16px 20px; background: #f8fafc; border-radius: 14px; border: 1px solid #f1f5f9; }

    .search-input { padding: 10px 16px; border: 1.5px solid #e2e8f0; border-radius: 24px; width: 250px; font-family: 'Inter', sans-serif; font-size: 0.9rem; color: #1e293b; background: white; transition: all 0.2s; }
    .search-input:focus { border-color: #6b7f5e; outline: none; box-shadow: 0 0 0 3px rgba(107,127,94,0.12); }
    .search-input::placeholder { color: #94a3b8; }
    
    .filters { display: flex; gap: 8px; align-items: center; }
    .chip { background: white; padding: 7px 16px; border-radius: 20px; font-size: 0.82rem; cursor: pointer; color: #334155; font-weight: 500; border: 1.5px solid #e2e8f0; transition: all 0.2s; font-family: 'Inter', sans-serif; }
    .chip:hover { border-color: #6b7f5e; color: #546747; background: #f0f4ec; }
    .chip.active { background: linear-gradient(135deg, #6b7f5e, #546747); color: white; border-color: transparent; box-shadow: 0 2px 8px rgba(84,103,71,0.25); }

    .dropdown { position: relative; display: inline-block; }
    .dropdown-content { display: block; position: absolute; background: white; min-width: 160px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); z-index: 100; border-radius: 12px; overflow: hidden; margin-top: 6px; border: 1px solid #f1f5f9; }
    .dropdown-content a { color: #334155; padding: 10px 16px; text-decoration: none; display: block; cursor: pointer; font-size: 0.85rem; transition: background 0.15s; font-weight: 500; }
    .dropdown-content a:hover { background: #f0f4ec; color: #546747; }

    /* ALERTS */
    .alert-item { display: flex; align-items: center; gap: 15px; padding: 14px 16px; border-bottom: 1px solid #f1f5f9; transition: all 0.2s; border-radius: 10px; margin-bottom: 4px; }
    .alert-item:hover { background: #f0f4ec; }
    .alert-icon { font-size: 1.5rem; min-width: 40px; text-align: center; }
    .alert-info h4 { margin: 0; font-size: 0.95rem; color: #0f172a; font-weight: 600; }
    .alert-info p { margin: 3px 0 0; font-size: 0.82rem; color: #64748b; }
    
    .severity-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-left: auto; letter-spacing: 0.03em; }
    .severity-badge.critical { background: #fee2e2; color: #991b1b; }
    .severity-badge.high { background: #ffedd5; color: #9a3412; }
    .severity-badge.moderate, .severity-badge.medium { background: #fef3c7; color: #92400e; }
    .severity-badge.low { background: #d1fae5; color: #065f46; }

    .alert-card-lg { border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; margin-bottom: 16px; background: #fafafa; transition: all 0.2s; border-left: 4px solid #6b7f5e; }
    .alert-card-lg:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.05); border-left-color: #546747; }
    .alert-header { display: flex; align-items: center; gap: 15px; margin-bottom: 14px; }
    .icon-box { font-size: 2rem; }
    .header-text h3 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    .header-text small { color: #94a3b8; font-size: 0.8rem; }
    .alert-body { color: #475569; line-height: 1.7; font-size: 0.9rem; }
    .alert-footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 0.85rem; color: #64748b; }

    .animate-up { animation: fadeInUp 0.4s ease-out; }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* BUTTONS */
    .secondary-btn { padding: 8px 18px; background: #f1f5f9; color: #334155; border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s; font-family: 'Inter', sans-serif; }
    .secondary-btn:hover { background: #e2e8f0; border-color: #cbd5e1; }
    .secondary-btn.btn-sm { font-size: 0.78rem; padding: 5px 12px; }
    
    .primary-btn { padding: 12px 24px; background: linear-gradient(135deg, #6b7f5e, #546747); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.2s; font-family: 'Inter', sans-serif; box-shadow: 0 2px 10px rgba(84,103,71,0.2); }
    .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(84,103,71,0.3); }

    .danger-zone { text-align: center; border-left-color: #ef4444; background: linear-gradient(180deg, #ffffff, #fef2f2); }
    .danger-zone h3 { color: #0f172a; }
    .danger-zone p { color: #64748b; line-height: 1.6; font-size: 0.9rem; max-width: 500px; margin: 0 auto; }
    .danger-btn-lg { width: 100%; padding: 20px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 12px; font-size: 1.15rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 24px; box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3); transition: all 0.25s; font-family: 'Inter', sans-serif; animation: sos-pulse 2s ease-in-out infinite; letter-spacing: 0.02em; }
    .danger-btn-lg:hover { background: linear-gradient(135deg, #dc2626, #b91c1c); transform: translateY(-3px); box-shadow: 0 8px 28px rgba(239, 68, 68, 0.4); }
    .danger-btn-lg:disabled { animation: none; opacity: 0.6; cursor: not-allowed; transform: none; }
    .sos-icon { font-size: 1.4rem; }

    @keyframes sos-pulse {
      0%, 100% { box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3); }
      50% { box-shadow: 0 6px 32px rgba(239, 68, 68, 0.5); }
    }
    
    .message { margin-top: 20px; padding: 14px 20px; border-radius: 10px; text-align: center; font-weight: 500; animation: fadeInUp 0.3s; font-size: 0.9rem; }
    .success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    
    .empty-state { padding: 32px; text-align: center; color: #94a3b8; font-style: normal; background: #f8fafc; border-radius: 12px; margin-top: 16px; border: 1.5px dashed #e2e8f0; font-size: 0.9rem; }
    
    .flex-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .mt-4 { margin-top: 20px; }
    .profile-card { text-align: center; }
    .profile-card h2 { color: #0f172a; margin: 10px 0 5px; font-size: 1.4rem; font-weight: 700; }
    .profile-card p { color: #64748b; margin: 0; font-size: 0.9rem; }

    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
  `]
})
export class CitizenDashboardComponent implements OnInit, OnDestroy {
  activeTab = 'dashboard';
  alerts: any[] = [];
  searchQuery = '';
  message = '';
  isError = false;
  isLoading = false;
  currentDate = new Date();

  // Filters
  activeDropdown: string | null = null;
  filters = {
    type: '',
    severity: '',
    region: ''
  };
  isNearMeActive = false;

  // Map
  mapUrl!: SafeResourceUrl;
  mapLocationName = '';

  private apiUrl = `${environment.apiUrl}/disasters`;
  private citizenApiUrl = `${environment.apiUrl}/citizen`;

  private wsSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private wsService: WebSocketService
  ) {
    this.updateMapUrl(-122.52, 37.70, -122.35, 37.83); // Default SF
  }

  ngOnInit() {
    this.loadAlerts();
    this.setupWebSocket();
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  setupWebSocket() {
    this.wsSubscription = this.wsService.getAlerts().subscribe(alert => {
      if (alert) {
        console.log('Real-time alert received:', alert);
        this.alerts.unshift(alert);
        this.message = `New Alert: ${alert.title}`;
        setTimeout(() => this.message = '', 5000);
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  getPageTitle(): string {
    switch (this.activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'alerts': return 'Safety Alerts';
      case 'reports': return 'Emergency Report';
      case 'profile': return 'My Profile';
      default: return 'Disaster Guard';
    }
  }

  getIcon(type: string): string {
    switch (type?.toUpperCase()) {
      case 'FLOOD': return '🌊';
      case 'EARTHQUAKE': return '⛰️';
      case 'FIRE': return '🔥';
      case 'STORM': return '⛈️';
      case 'CYCLONE': return '🌀';
      default: return '⚠️';
    }
  }

  private getHeaders() {
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    };
  }

  loadAlerts() {
    let queryParams = `?`;
    if (this.filters.type) queryParams += `type=${this.filters.type}&`;
    if (this.filters.severity) queryParams += `severity=${this.filters.severity}&`;
    if (this.filters.region) queryParams += `region=${encodeURIComponent(this.filters.region)}&`;

    this.http.get<any[]>(`${this.apiUrl}${queryParams}`, this.getHeaders())
      .pipe(catchError(err => {
        console.error(err);
        return of([]);
      }))
      .subscribe(data => {
        this.alerts = data;
        if (data.length > 0 && this.filters.region) {
          // We might want to look up coordinates for the region if we haven't already
        }
      });
  }

  toggleDropdown(name: string) {
    this.activeDropdown = this.activeDropdown === name ? null : name;
  }

  setFilter(key: 'type' | 'severity', value: string) {
    this.filters[key] = value;
    this.activeDropdown = null;
    this.loadAlerts();
  }

  getFilterLabel(key: 'type' | 'severity'): string {
    const val = this.filters[key];
    if (!val) return 'All';
    return val.charAt(0) + val.slice(1).toLowerCase();
  }

  hasActiveFilters(): boolean {
    return !!this.filters.type || !!this.filters.severity || !!this.filters.region || this.isNearMeActive;
  }

  clearFilters() {
    this.filters = { type: '', severity: '', region: '' };
    this.isNearMeActive = false;
    this.searchQuery = '';
    this.mapLocationName = '';
    this.loadAlerts();
  }

  toggleNearMe() {
    this.isNearMeActive = !this.isNearMeActive;
    if (this.isNearMeActive) {
      if (navigator.geolocation) {
        this.message = "Locating you...";
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            this.updateMapUrl(lon - 0.1, lat - 0.1, lon + 0.1, lat + 0.1);
            this.getRegionFromCoords(lat, lon);
            this.message = "";
          },
          (err) => {
            this.message = "Location access denied.";
            this.isNearMeActive = false;
          }
        );
      } else {
        this.message = "Geolocation not supported.";
        this.isNearMeActive = false;
      }
    } else {
      this.filters.region = '';
      this.loadAlerts();
    }
  }

  getRegionFromCoords(lat: number, lon: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    this.http.get<any>(url).subscribe(data => {
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.county;
        if (city) {
          this.filters.region = city;
          this.mapLocationName = city;
          this.loadAlerts();
          this.message = `Showing alerts near ${city}`;
          setTimeout(() => this.message = '', 3000);
        }
      }
    });
  }

  searchLocation() {
    if (!this.searchQuery) return;

    // Call Nominatim API for map update & region filter
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}`;

    this.http.get<any[]>(url).subscribe({
      next: (results) => {
        if (results && results.length > 0) {
          const result = results[0];
          const bb = result.boundingbox;
          this.updateMapUrl(bb[2], bb[0], bb[3], bb[1]);

          this.filters.region = this.searchQuery; // Use search query as region filter
          this.mapLocationName = result.display_name;
          this.loadAlerts();
        } else {
          this.message = 'Location not found';
        }
      }
    });
  }

  updateMapUrl(minLon: any, minLat: any, maxLon: any, maxLat: any) {
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  requestHelp() {
    this.isLoading = true;
    this.http.post(`${this.citizenApiUrl}/request-help`, {}, { ...this.getHeaders(), responseType: 'text' })
      .subscribe({
        next: (res) => {
          this.message = 'SOS Sent! Help is on the way.';
          this.isError = false;
          this.isLoading = false;
          setTimeout(() => this.message = '', 5000);
        },
        error: (err) => {
          this.message = 'SOS Failed!';
          this.isError = true;
          this.isLoading = false;
        }
      });
  }

  shareLocation() {
    this.activeTab = 'dashboard';
    this.toggleNearMe();
  }
}
