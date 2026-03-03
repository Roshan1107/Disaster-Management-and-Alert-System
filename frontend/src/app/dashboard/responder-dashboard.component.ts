import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { WebSocketService } from '../services/websocket.service';
import { ResponderService } from '../services/responder.service';

@Component({
  selector: 'app-responder-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Responder<span class="highlight">Guard</span></h2>
        </div>

        <div class="profile-summary">
          <div class="avatar">R</div>
          <div>
             <p class="name">Responder Unit</p>
             <p class="role">On Duty</p>
          </div>
        </div>

        <nav class="nav-links">
          <a (click)="activeTab = 'dashboard'" [class.active]="activeTab === 'dashboard'">
            <span>📊</span> Dashboard
          </a>
          <a (click)="activeTab = 'forward'; loadForwardAlerts()" [class.active]="activeTab === 'forward'">
            <span>📨</span> Alerts to Forward
            <span *ngIf="forwardAlerts.length > 0" class="nav-badge">{{ forwardAlerts.length }}</span>
          </a>
          <a (click)="activeTab = 'alerts'; loadAlerts()" [class.active]="activeTab === 'alerts'">
            <span>🔔</span> Active Alerts
          </a>
          <a (click)="activeTab = 'missions'" [class.active]="activeTab === 'missions'">
            <span>🛡️</span> My Missions
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
             <div class="card map-card">
              <h3>Mission Area Map</h3>
              <div class="map-container">
                 <iframe 
                  width="100%" 
                  height="350" 
                  frameborder="0" 
                  scrolling="no" 
                  marginheight="0" 
                  marginwidth="0" 
                  [src]="mapUrl">
                </iframe>
              </div>
             </div>

             <!-- Active Alerts Overview -->
             <div class="card alert-overview-card">
               <div class="flex-header">
                 <h3>🔔 Active Disaster Alerts</h3>
                 <button class="secondary-btn" (click)="loadAlerts()">Refresh</button>
               </div>
               <div *ngIf="alerts.length === 0" class="empty-state">No active alerts at the moment.</div>
               
               <div *ngFor="let alert of alerts.slice(0, 3)" class="alert-item animate-up">
                 <div class="alert-icon">{{ getIcon(alert.disasterType) }}</div>
                 <div class="alert-info">
                   <h4>{{ alert.title || alert.disasterType }}</h4>
                   <p>📍 {{ alert.region }}</p>
                 </div>
                 <div class="severity-badge" [ngClass]="alert.severity?.toLowerCase()">{{ alert.severity }}</div>
                 <button class="sm-btn primary" (click)="respondToAlert(alert)">Respond</button>
               </div>
               <div class="mt-4" *ngIf="alerts.length > 3">
                 <button class="secondary-btn" (click)="activeTab = 'alerts'">View All Alerts</button>
               </div>
             </div>

             <!-- Recent Assignments -->
             <div class="card">
               <h3>Recent Assignments</h3>
               <div *ngIf="tasks.length === 0" class="empty-state">No active missions. Stand by.</div>
               
               <table class="data-table" *ngIf="tasks.length > 0">
                 <thead>
                   <tr>
                     <th>Description</th>
                     <th>Status</th>
                     <th>Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr *ngFor="let task of tasks.slice(0, 3)">
                     <td>{{ task.description }}</td>
                     <td><span class="status-badge" [ngClass]="task.status?.toLowerCase()">{{ task.status }}</span></td>
                     <td>
                        <button *ngIf="task.status === 'PENDING'" (click)="updateStatus(task.id, 'IN_PROGRESS')" class="sm-btn primary">Start</button>
                        <button *ngIf="task.status === 'IN_PROGRESS'" (click)="updateStatus(task.id, 'COMPLETED')" class="sm-btn success">Done</button>
                        <span *ngIf="task.status === 'COMPLETED'" class="done-label">✅ Completed</span>
                        <span *ngIf="task.status === 'FAILED'" class="fail-label">❌ Failed</span>
                     </td>
                   </tr>
                 </tbody>
               </table>
               <div class="mt-4" *ngIf="tasks.length > 3">
                 <button class="secondary-btn" (click)="activeTab = 'missions'">View All Missions</button>
               </div>
             </div>
          </div>

          <!-- ALERTS TO FORWARD TAB -->
          <div *ngIf="activeTab === 'forward'" class="fade-in">
            <div class="card" style="border-left-color: #e67e22;">
              <div class="flex-header">
                <h3>📨 Alerts Awaiting Citizen Broadcast</h3>
                <button class="secondary-btn" (click)="loadForwardAlerts()">Refresh</button>
              </div>
              <p style="color: #64748b; font-size:0.88rem; margin-bottom:18px;">These alerts have been verified by admin or auto-escalated. Review and forward them to citizens.</p>

              <div *ngFor="let alert of forwardAlerts" class="alert-card-lg animate-up" style="border-left-color: #e67e22;">
                <div class="alert-header">
                   <div class="icon-box">{{ getIcon(alert.disasterType) }}</div>
                   <div class="header-text">
                     <h3>{{ alert.title }}</h3>
                     <small>{{ alert.createdAt | date:'medium' }}</small>
                   </div>
                   <div class="severity-badge" [ngClass]="alert.severity?.toLowerCase()">{{ alert.severity }}</div>
                </div>
                <p class="alert-body">{{ alert.description }}</p>
                <div class="alert-footer">
                  <span>📍 {{ alert.region }}</span>
                  <span class="status-badge" [ngClass]="alert.status === 'AUTO_ESCALATED' ? 'auto-escalated' : 'sent-to-responder'">
                    {{ alert.status === 'AUTO_ESCALATED' ? '⏰ Auto-Escalated' : '✅ Admin Approved' }}
                  </span>
                  <button class="sm-btn success action-respond" (click)="forwardToCitizen(alert)">📢 Forward to Citizens</button>
                </div>
              </div>

              <div *ngIf="forwardAlerts.length === 0" class="empty-state">No alerts awaiting forwarding. All clear! ✅</div>
            </div>
          </div>

          <!-- ALERTS TAB -->
          <div *ngIf="activeTab === 'alerts'" class="fade-in">
            <div class="card">
              <div class="flex-header">
                <h3>All Active Disaster Alerts</h3>
                <button class="secondary-btn" (click)="loadAlerts()">Refresh</button>
              </div>

              <div *ngFor="let alert of alerts" class="alert-card-lg animate-up">
                <div class="alert-header">
                   <div class="icon-box">{{ getIcon(alert.disasterType) }}</div>
                   <div class="header-text">
                     <h3>{{ alert.title }}</h3>
                     <small>{{ alert.createdAt | date:'medium' }}</small>
                   </div>
                   <div class="severity-badge" [ngClass]="alert.severity?.toLowerCase()">{{ alert.severity }}</div>
                </div>
                <p class="alert-body">{{ alert.description }}</p>
                <div class="alert-footer">
                  <span>📍 {{ alert.region }}</span>
                  <button class="sm-btn primary action-respond" (click)="respondToAlert(alert)">🚨 Respond to This</button>
                </div>
              </div>

              <div *ngIf="alerts.length === 0" class="empty-state">No active alerts found.</div>
            </div>
          </div>

          <!-- MISSIONS TAB -->
          <div *ngIf="activeTab === 'missions'" class="fade-in">
            <div class="card">
              <div class="flex-header">
                <h3>My Assignments</h3>
                <button class="secondary-btn" (click)="loadTasks()">Refresh</button>
              </div>

              <div *ngFor="let task of tasks" class="task-item">
                <div class="task-info">
                   <h4>{{ task.description }}</h4>
                   <p class="meta">Created: {{ task.createdAt | date:'shortTime' }}</p>
                   <p class="meta" *ngIf="task.locationName">📍 {{ task.locationName }}</p>
                </div>
                <div class="task-actions">
                   <div class="status-badge" [ngClass]="task.status?.toLowerCase()" style="margin-right: 15px;">{{ task.status }}</div>
                   <button *ngIf="task.status === 'PENDING'" (click)="updateStatus(task.id, 'IN_PROGRESS')" class="sm-btn primary">Start Mission</button>
                   <button *ngIf="task.status === 'IN_PROGRESS'" (click)="updateStatus(task.id, 'COMPLETED')" class="sm-btn success">Complete</button>
                   <button *ngIf="task.status === 'IN_PROGRESS'" (click)="updateStatus(task.id, 'FAILED')" class="sm-btn danger">Report Fail</button>
                </div>
              </div>

              <div *ngIf="tasks.length === 0" class="empty-state">No assigned missions.</div>
            </div>
          </div>

          <!-- PROFILE TAB -->
          <div *ngIf="activeTab === 'profile'" class="fade-in">
             <div class="card profile-card">
               <div class="avatar-large">R</div>
               <h2>Responder Unit</h2>
               <p>Emergency Response Team</p>
               <hr>
               <div class="stats-row">
                 <div class="stat-box">
                   <h3>{{ tasks.length }}</h3>
                   <p>Total Missions</p>
                 </div>
                 <div class="stat-box">
                   <h3>{{ alerts.length }}</h3>
                   <p>Active Alerts</p>
                 </div>
                 <div class="stat-box">
                   <h3>Online</h3>
                   <p>Status</p>
                 </div>
               </div>
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
    .sidebar-header { margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid rgba(123,79,90,0.2); }
    .sidebar-header h2 { margin: 0; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; }
    .highlight { background: linear-gradient(135deg, #c4a0a8, #d4b5bc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    
    .profile-summary { display: flex; align-items: center; gap: 14px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 24px; }
    .avatar { width: 44px; height: 44px; background: linear-gradient(135deg, #8e6370, #5b3a42); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; color: white; box-shadow: 0 4px 12px rgba(91,58,66,0.3); }
    .avatar-large { width: 90px; height: 90px; background: linear-gradient(135deg, #8e6370, #5b3a42); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 2.2rem; color: white; margin: 0 auto 20px; box-shadow: 0 8px 24px rgba(91,58,66,0.25); }
    
    .name { margin: 0; font-weight: 600; font-size: 0.9rem; color: #e2e8f0; }
    .role { margin: 2px 0 0; color: #64748b; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }

    .nav-links { display: flex; flex-direction: column; gap: 4px; flex: 1; margin-top: 4px; }
    .nav-links a { padding: 11px 14px; border-radius: 10px; cursor: pointer; transition: all 0.2s cubic-bezier(.4,0,.2,1); display: flex; align-items: center; gap: 12px; color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.9rem; position: relative; }
    .nav-links a:hover { background: rgba(123,79,90,0.1); color: #d4b5bc; }
    .nav-links a.active { background: rgba(123,79,90,0.15); color: white; }
    .nav-links a.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 20px; background: linear-gradient(180deg, #c4a0a8, #7b4f5a); border-radius: 0 4px 4px 0; }
    .nav-links a span { font-size: 1.05rem; }
    
    .logout-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 12px 14px; display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 500; width: 100%; text-align: left; margin-top: auto; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; transition: all 0.2s; border-radius: 8px; }
    .logout-btn:hover { color: #f87171; background: rgba(239,68,68,0.08); }

    /* MAIN CONTENT */
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .top-bar { background: white; padding: 18px 36px; border-bottom: none; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 0 #e2e8f0; position: relative; }
    .top-bar::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #8e6370, #c4a0a8, transparent); }
    .top-bar h1 { font-size: 1.5rem; color: #0f172a; margin: 0; font-weight: 700; letter-spacing: -0.02em; }
    .date { color: #94a3b8; font-size: 0.85rem; font-weight: 500; }

    .content-scroll { padding: 28px 36px; overflow-y: auto; flex: 1; }
    
    .card { background: white; padding: 28px; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 24px; border: 1px solid #f1f5f9; border-left: 4px solid #7b4f5a; transition: box-shadow 0.3s, transform 0.2s; }
    .card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .card.map-card { border-left-color: #5b3a42; }
    .card.alert-overview-card { border-left-color: #d4ac0d; }
    .map-container { position: relative; height: 350px; border-radius: 12px; overflow: hidden; background: #e2e8f0; margin-top: 16px; border: 1px solid #e2e8f0; }
    
    .card h3 { margin-top: 0; color: #0f172a; font-size: 1.2rem; margin-bottom: 16px; font-weight: 700; letter-spacing: -0.01em; }

    /* ALERTS */
    .alert-item { display: flex; align-items: center; gap: 15px; padding: 14px 16px; border-bottom: 1px solid #f1f5f9; transition: all 0.2s; border-radius: 10px; margin-bottom: 4px; }
    .alert-item:hover { background: #f8f0f2; }
    .alert-icon { font-size: 1.5rem; min-width: 40px; text-align: center; }
    .alert-info { flex: 1; }
    .alert-info h4 { margin: 0; font-size: 0.95rem; color: #0f172a; font-weight: 600; }
    .alert-info p { margin: 3px 0 0; font-size: 0.82rem; color: #64748b; }
    
    .severity-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
    .severity-badge.critical { background: #fee2e2; color: #991b1b; }
    .severity-badge.high { background: #ffedd5; color: #9a3412; }
    .severity-badge.moderate, .severity-badge.medium { background: #fef3c7; color: #92400e; }
    .severity-badge.low { background: #d1fae5; color: #065f46; }

    .alert-card-lg { border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; margin-bottom: 16px; background: #fafafa; transition: all 0.2s; border-left: 4px solid #7b4f5a; }
    .alert-card-lg:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.05); border-left-color: #5b3a42; }
    .alert-header { display: flex; align-items: center; gap: 15px; margin-bottom: 14px; }
    .icon-box { font-size: 2rem; }
    .header-text { flex: 1; }
    .header-text h3 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    .header-text small { color: #94a3b8; font-size: 0.8rem; }
    .alert-body { color: #475569; line-height: 1.7; font-size: 0.9rem; }
    .alert-footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 0.85rem; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
    .action-respond { margin-left: auto; }

    .animate-up { animation: fadeInUp 0.4s ease-out; }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* TABLES & LISTS */
    .data-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .data-table th, .data-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 0.9rem; }
    .data-table th { background-color: #f8fafc; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.06em; }
    .data-table tbody tr:nth-child(even) { background-color: #fafbfc; }
    .data-table tbody tr:hover { background-color: #f8f0f2; }

    .status-badge { padding: 5px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.in_progress { background: #f3e8eb; color: #5b3a42; }
    .status-badge.completed { background: #d1fae5; color: #065f46; }
    .status-badge.failed { background: #fee2e2; color: #991b1b; }
    
    .task-item { padding: 20px; border: 1.5px solid #e2e8f0; border-radius: 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; transition: all 0.25s cubic-bezier(.4,0,.2,1); background: white; }
    .task-item:hover { border-color: #7b4f5a; box-shadow: 0 4px 16px rgba(123,79,90,0.08); transform: translateY(-2px); }
    .task-info h4 { margin: 0 0 5px 0; font-size: 1.05rem; color: #0f172a; font-weight: 600; }
    .meta { margin: 0; color: #64748b; font-size: 0.82rem; }
    
    .task-actions { display: flex; align-items: center; gap: 10px; }
    
    /* BUTTONS */
    .sm-btn { padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.82rem; transition: all 0.2s; font-family: 'Inter', sans-serif; }
    .sm-btn.primary { background: linear-gradient(135deg, #7b4f5a, #5b3a42); color: white; box-shadow: 0 2px 8px rgba(91,58,66,0.2); }
    .sm-btn.success { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 2px 8px rgba(16,185,129,0.2); }
    .sm-btn.danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; box-shadow: 0 2px 8px rgba(239,68,68,0.2); }
    .sm-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
    
    .secondary-btn { padding: 8px 18px; background: #f1f5f9; color: #334155; border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s; font-family: 'Inter', sans-serif; }
    .secondary-btn:hover { background: #e2e8f0; border-color: #cbd5e1; }

    .done-label { color: #065f46; font-weight: 600; font-size: 0.82rem; background: #d1fae5; padding: 4px 10px; border-radius: 6px; }
    .fail-label { color: #991b1b; font-weight: 600; font-size: 0.82rem; background: #fee2e2; padding: 4px 10px; border-radius: 6px; }

    .message { margin-top: 20px; padding: 14px 20px; border-radius: 10px; text-align: center; font-weight: 500; animation: fadeInUp 0.3s; font-size: 0.9rem; }
    .success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    
    .empty-state { padding: 32px; text-align: center; color: #94a3b8; font-style: normal; background: #f8fafc; border-radius: 12px; margin-top: 16px; border: 1.5px dashed #e2e8f0; font-size: 0.9rem; }

    .profile-card { text-align: center; }
    .profile-card h2 { color: #0f172a; margin: 10px 0 5px; font-size: 1.4rem; font-weight: 700; }
    .profile-card p { color: #64748b; margin: 0; font-size: 0.9rem; }
    .profile-card hr { border: none; border-top: 1px solid #f1f5f9; margin: 24px 0; }
    
    .stats-row { display: flex; justify-content: center; gap: 24px; margin-top: 20px; }
    .stat-box { text-align: center; background: #f8f0f2; padding: 20px 28px; border-radius: 14px; border: 1px solid #e8d5da; min-width: 100px; }
    .stat-box h3 { margin: 0; font-size: 1.5rem; color: #7b4f5a; font-weight: 800; }
    .stat-box p { margin: 4px 0 0; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    
    .flex-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .mt-4 { margin-top: 20px; }

    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .nav-badge { background: #e67e22; color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; margin-left: auto; font-weight: 700; }
    .status-badge.auto-escalated { background: #fff3cd; color: #856404; }
    .status-badge.sent-to-responder { background: #d1fae5; color: #065f46; }
  `]
})
export class ResponderDashboardComponent implements OnInit, OnDestroy {
  activeTab = 'dashboard';
  tasks: any[] = [];
  alerts: any[] = [];
  forwardAlerts: any[] = [];
  message = '';
  isError = false;
  currentDate = new Date();
  private apiUrl = `${environment.apiUrl}/responder`;
  private alertsApiUrl = `${environment.apiUrl}/disasters`;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private wsService: WebSocketService,
    private responderService: ResponderService
  ) {
    this.loadTasks();
    this.loadAlerts();
    this.loadForwardAlerts();
  }

  ngOnDestroy() {
    if (this.wsSubscription) this.wsSubscription.unsubscribe();
  }

  logout() {
    this.authService.logout();
  }

  getPageTitle(): string {
    switch (this.activeTab) {
      case 'dashboard': return 'Mission Control';
      case 'forward': return 'Alerts to Forward';
      case 'alerts': return 'Active Disaster Alerts';
      case 'missions': return 'My Missions';
      case 'profile': return 'My Profile';
      default: return 'Responder Dashboard';
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

  loadTasks() {
    this.http.get<any[]>(`${this.apiUrl}/tasks`, this.getHeaders())
      .pipe(catchError(err => {
        console.error(err);
        this.isError = true;
        this.message = 'Failed to load tasks.';
        return of([]);
      }))
      .subscribe(data => {
        this.tasks = data;
        this.isError = false;
      });
  }

  loadAlerts() {
    this.http.get<any[]>(`${this.alertsApiUrl}`, this.getHeaders())
      .pipe(catchError(err => {
        console.error('Failed to load alerts:', err);
        return of([]);
      }))
      .subscribe(data => {
        this.alerts = data;
      });
  }

  loadForwardAlerts() {
    this.responderService.getResponderAlerts()
      .pipe(catchError(err => {
        console.error('Failed to load forwarding alerts:', err);
        return of([]);
      }))
      .subscribe(data => {
        this.forwardAlerts = data;
      });
  }

  forwardToCitizen(alert: any) {
    this.responderService.forwardToCitizen(alert.id).subscribe({
      next: () => {
        this.message = `Alert "${alert.title}" forwarded to citizens ✓`;
        this.isError = false;
        this.loadForwardAlerts();
        this.loadAlerts();
        setTimeout(() => this.message = '', 4000);
      },
      error: (err) => {
        this.message = 'Failed to forward alert.';
        this.isError = true;
        console.error('Error forwarding alert:', err);
      }
    });
  }

  updateStatus(taskId: number, status: string) {
    this.http.patch(`${this.apiUrl}/tasks/${taskId}/status?status=${status}`, {}, this.getHeaders())
      .subscribe({
        next: (res) => {
          this.message = `Task updated to ${status}`;
          this.isError = false;
          this.loadTasks();
          setTimeout(() => this.message = '', 3000);
        },
        error: (err) => {
          this.message = 'Update failed.';
          this.isError = true;
        }
      });
  }

  respondToAlert(alert: any) {
    this.message = `Responding to: ${alert.title || alert.disasterType} at ${alert.region}`;
    this.isError = false;

    // Center map on alert location if available
    if (alert.latitude && alert.longitude) {
      this.centerMapOnTask(alert);
    }

    setTimeout(() => this.message = '', 4000);
  }

  // WebSocket & Map Logic
  private wsSubscription: any;
  mapUrl: any;

  ngOnInit() {
    this.initMapWithCurrentLocation();
  }

  private initMapWithCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const delta = 0.08;
          this.updateMapUrl(lon - delta, lat - delta, lon + delta, lat + delta);
        },
        () => {
          // Fallback to default coordinates if geolocation denied/unavailable
          this.updateMapUrl(-122.52, 37.70, -122.35, 37.83);
        }
      );
    } else {
      this.updateMapUrl(-122.52, 37.70, -122.35, 37.83);
    }
  }

  updateMapUrl(minLon: any, minLat: any, maxLon: any, maxLat: any) {
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  centerMapOnTask(task: any) {
    if (task.latitude && task.longitude) {
      const delta = 0.05;
      this.updateMapUrl(task.longitude - delta, task.latitude - delta, task.longitude + delta, task.latitude + delta);
    }
  }
}
