import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Admin<span class="highlight">Guard</span></h2>
        </div>

        <div class="profile-summary">
          <div class="avatar">A</div>
          <div>
             <p class="name">Administrator</p>
             <p class="role">Full Access</p>
          </div>
        </div>

        <nav class="nav-links">
          <a (click)="activeTab = 'dashboard'" [class.active]="activeTab === 'dashboard'">
            <span>📊</span> Dashboard
          </a>
          <a (click)="activeTab = 'tasks'" [class.active]="activeTab === 'tasks'">
            <span>📝</span> Assign Rescue Task
          </a>
          <a (click)="activeTab = 'responders'" [class.active]="activeTab === 'responders'">
            <span>👥</span> Manage Responders
          </a>
          <a (click)="activeTab = 'alerts'" [class.active]="activeTab === 'alerts'">
            <span>📢</span> Create Disaster Alert
          </a>
        </nav>

        <button class="logout-btn" (click)="logout()">
          <span>🚪</span> Logout
        </button>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="main-content">
        <!-- Top Bar -->
        <div class="top-bar">
          <h1>{{ getPageTitle() }}</h1>
          <div class="date">{{ currentDate | date:'fullDate' }}</div>
        </div>

        <div class="content-scroll">
          
          <!-- DASHBOARD OVERVIEW (Map & Stats) -->
          <div *ngIf="activeTab === 'dashboard'" class="fade-in">
            <!-- Map Section -->
            <div class="card map-card">
              <h3>Live Disaster Map</h3>
              <div class="map-container">
                 <iframe 
                  width="100%" 
                  height="250" 
                  frameborder="0" 
                  scrolling="no" 
                  marginheight="0" 
                  marginwidth="0" 
                  [src]="mapUrl">
                </iframe>
              </div>
            </div>

            <!-- Stats Row -->
            <div class="stats-row">
              <div class="stat-card">
                <h3>{{ responders.length }}</h3>
                <p>Active Responders</p>
              </div>
              <div class="stat-card">
                <h3>{{ tasks.length }}</h3>
                <p>Ongoing Tasks</p>
              </div>
              <div class="stat-card alert-stat">
                <h3>{{ recentAlerts.length }}</h3>
                <p>Active Alerts</p>
              </div>
              <div class="stat-card critical-stat">
                <h3>{{ criticalCount }}</h3>
                <p>Critical Alerts</p>
              </div>
            </div>

            <!-- Recent Alerts List -->
            <div class="card" *ngIf="recentAlerts.length > 0">
              <div class="flex-header">
                <h3>Recent Alerts</h3>
                <button class="secondary-btn" (click)="loadRecentAlerts()">Refresh</button>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Region</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let a of recentAlerts.slice(0, 8)" class="fade-row">
                    <td>{{ a.title }}</td>
                    <td>{{ getIcon(a.disasterType) }} {{ a.disasterType }}</td>
                    <td>
                      <span class="severity-badge" [ngClass]="a.severity?.toLowerCase()">{{ a.severity }}</span>
                    </td>
                    <td>{{ a.region || '—' }}</td>
                    <td>
                      <span class="status-badge" [ngClass]="a.status?.toLowerCase()">{{ a.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ASSIGN TASK TAB -->
          <div *ngIf="activeTab === 'tasks'" class="fade-in">
             <div class="card">
               <h3>Assign New Rescue Task</h3>
               <p class="description">Create and assign rescue tasks to available responders in the field.</p>
               
               <div class="form-group">
                 <label>Task Description</label>
                 <input type="text" [(ngModel)]="newTask.description" placeholder="e.g. Flood rescue in Sector 4">
               </div>
               
               <div class="form-grid">
                 <div class="form-group">
                   <label>Responder ID</label>
                   <input type="number" [(ngModel)]="newTask.responderId" placeholder="ID">
                 </div>
                 <div class="form-group">
                   <label>Location</label>
                   <input type="text" [(ngModel)]="newTask.location" placeholder="Coordinates/Address">
                 </div>
               </div>

               <button class="primary-btn" (click)="createTask()" [disabled]="isLoading">
                 {{ isLoading ? 'Assigning...' : 'Create Task' }}
               </button>
             </div>

             <div class="mt-4">
               <h3>Active Tasks</h3>
               <table class="data-table">
                 <thead>
                   <tr>
                     <th>ID</th>
                     <th>Description</th>
                     <th>Responder</th>
                     <th>Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr *ngFor="let t of tasks">
                     <td>#{{ t.id }}</td>
                     <td>{{ t.description }}</td>
                     <td>{{ t.responderId }}</td>
                     <td>
                       <span class="status-badge" [ngClass]="t.status.toLowerCase()">{{ t.status }}</span>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
          </div>

          <!-- MANAGE RESPONDERS TAB -->
          <div *ngIf="activeTab === 'responders'" class="fade-in">
            <div class="card">
              <div class="flex-header">
                <h3>Responders Field Unit</h3>
                <button class="secondary-btn" (click)="loadResponders()">Refresh List</button>
              </div>
              
              <table class="data-table">
                 <thead>
                   <tr>
                     <th>ID</th>
                     <th>Email</th>
                     <th>Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr *ngFor="let r of responders">
                     <td>#{{ r.id }}</td>
                     <td>{{ r.email }}</td>
                     <td><span class="active-dot"></span> Online</td>
                   </tr>
                 </tbody>
               </table>
            </div>
          </div>

          <!-- CREATE ALERT TAB -->
          <div *ngIf="activeTab === 'alerts'" class="fade-in">

             <!-- CRITICAL WARNING BANNER -->
             <div class="critical-banner" *ngIf="newAlert.severity === 'CRITICAL'">
               <div class="banner-icon">⚠️</div>
               <div class="banner-text">
                 <strong>CRITICAL ALERT — Instant Broadcast</strong>
                 <p>This alert will be sent <u>immediately</u> to all citizens via real-time notifications. There is no review step for critical alerts.</p>
               </div>
             </div>

             <div class="card" [class.critical-card]="newAlert.severity === 'CRITICAL'">
               <h3>Broadcast Disaster Alert</h3>
               <p class="description">Send emergency alerts to all citizens in the affected region.</p>

               <!-- Search Location Section -->
               <div class="form-group search-section">
                 <label>Search Location</label>
                 <div class="search-input-group">
                   <input type="text" [(ngModel)]="searchQuery" placeholder="Search city or area..." (keyup.enter)="performSearch()">
                   <button class="secondary-btn" (click)="performSearch()" [disabled]="isSearching">
                     {{ isSearching ? 'Searching...' : 'Search' }}
                   </button>
                 </div>
                 
                 <!-- Map Preview for Search -->
                 <div class="map-container small-map" *ngIf="searchQuery && !isSearching">
                    <iframe 
                      width="100%" 
                      height="200" 
                      frameborder="0" 
                      scrolling="no" 
                      marginheight="0" 
                      marginwidth="0" 
                      [src]="mapUrl">
                    </iframe>
                    <p class="map-caption">Location Preview: {{ newAlert.locationName }}</p>
                 </div>
               </div>

               <div class="form-group">
                 <label>Alert Title</label>
                 <input type="text" [(ngModel)]="newAlert.title" placeholder="e.g. Flash Flood Warning">
               </div>

               <div class="form-grid">
                  <div class="form-group">
                    <label>Type</label>
                    <select [(ngModel)]="newAlert.disasterType">
                       <option value="FLOOD">Flood</option>
                       <option value="EARTHQUAKE">Earthquake</option>
                       <option value="FIRE">Fire</option>
                       <option value="STORM">Storm</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Severity</label>
                    <select [(ngModel)]="newAlert.severity" (change)="onSeverityChange()">
                       <option value="LOW">Low</option>
                       <option value="MEDIUM">Medium</option>
                       <option value="HIGH">High</option>
                       <option value="CRITICAL">🔴 Critical (Auto-Broadcast)</option>
                    </select>
                  </div>
               </div>

               <div class="form-grid">
                  <div class="form-group">
                    <label>Region (Auto-filled)</label>
                    <input type="text" [(ngModel)]="newAlert.region" placeholder="Region">
                  </div>
                  <div class="form-group">
                    <label>Specific Location</label>
                    <input type="text" [(ngModel)]="newAlert.locationName" placeholder="Specific Point/Address">
                  </div>
               </div>

               <div class="form-group">
                 <label>Description</label>
                 <textarea [(ngModel)]="newAlert.description" rows="4" placeholder="Detailed instructions..."></textarea>
               </div>

               <button 
                 [class]="newAlert.severity === 'CRITICAL' ? 'critical-broadcast-btn' : 'danger-btn'" 
                 (click)="onBroadcastClick()" 
                 [disabled]="isLoading">
                 {{ isLoading ? 'Broadcasting...' : (newAlert.severity === 'CRITICAL' ? '🚨 BROADCAST CRITICAL ALERT' : 'Broadcast Alert') }}
               </button>
             </div>
          </div>

          <!-- CONFIRM DIALOG -->
          <div class="modal-overlay" *ngIf="showConfirmDialog" (click)="showConfirmDialog = false">
            <div class="modal-box" (click)="$event.stopPropagation()">
              <div class="modal-icon">🚨</div>
              <h3>Confirm Critical Broadcast</h3>
              <p>You are about to broadcast a <strong>CRITICAL</strong> alert that will be sent <u>immediately</u> to <strong>all citizens</strong> via push notifications and real-time alerts.</p>
              <div class="modal-detail">
                <strong>{{ newAlert.title }}</strong>
                <span>{{ newAlert.region }}</span>
              </div>
              <div class="modal-actions">
                <button class="secondary-btn" (click)="showConfirmDialog = false">Cancel</button>
                <button class="critical-confirm-btn" (click)="confirmBroadcast()">Yes, Broadcast Now</button>
              </div>
            </div>
          </div>

          <div *ngIf="message" class="message" [ngClass]="{'error': isError, 'success': !isError}">
            {{ message }}
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; font-family: 'Inter', sans-serif; color: #1e293b; }
    .dashboard-container { display: flex; height: 100%; background-color: #f8fafc; }
    
    /* SIDEBAR */
    .sidebar { width: 270px; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); color: white; display: flex; flex-direction: column; padding: 24px 20px; box-shadow: 4px 0 24px rgba(0,0,0,0.15); z-index: 10; }
    .sidebar-header { margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid rgba(93,109,126,0.2); }
    .sidebar-header h2 { margin: 0; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; }
    .highlight { background: linear-gradient(135deg, #85929e, #aeb6bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    
    .profile-summary { display: flex; align-items: center; gap: 14px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 24px; }
    .avatar { width: 44px; height: 44px; background: linear-gradient(135deg, #5d6d7e, #2c3e50); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; color: white; box-shadow: 0 4px 12px rgba(44,62,80,0.3); }
    .name { margin: 0; font-weight: 600; font-size: 0.9rem; color: #e2e8f0; }
    .role { margin: 2px 0 0; color: #64748b; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }

    .nav-links { display: flex; flex-direction: column; gap: 4px; flex: 1; margin-top: 4px; }
    .nav-links a { padding: 11px 14px; border-radius: 10px; cursor: pointer; transition: all 0.2s cubic-bezier(.4,0,.2,1); display: flex; align-items: center; gap: 12px; color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.9rem; position: relative; }
    .nav-links a:hover { background: rgba(93,109,126,0.1); color: #d5d8dc; }
    .nav-links a.active { background: rgba(93,109,126,0.15); color: white; }
    .nav-links a.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 20px; background: linear-gradient(180deg, #85929e, #5d6d7e); border-radius: 0 4px 4px 0; }
    .nav-links a span { font-size: 1.05rem; }
    
    .logout-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 12px 14px; display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 500; width: 100%; text-align: left; margin-top: auto; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; transition: all 0.2s; border-radius: 8px; }
    .logout-btn:hover { color: #f87171; background: rgba(239,68,68,0.08); }

    /* MAIN CONTENT */
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .top-bar { background: white; padding: 18px 36px; border-bottom: none; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 0 #e2e8f0; position: relative; }
    .top-bar::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #5d6d7e, #85929e, transparent); }
    .top-bar h1 { font-size: 1.5rem; color: #0f172a; margin: 0; font-weight: 700; letter-spacing: -0.02em; }
    .date { color: #94a3b8; font-size: 0.85rem; font-weight: 500; }

    .content-scroll { padding: 28px 36px; overflow-y: auto; flex: 1; }
    
    /* CARDS & LAYOUT */
    .card { background: white; padding: 28px; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 24px; border-left: 4px solid #5d6d7e; transition: box-shadow 0.3s, transform 0.2s; border: 1px solid #f1f5f9; border-left: 4px solid #5d6d7e;}
    .card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .card.map-card { border-left-color: #10b981; }
    .card.critical-card { border-left-color: #ef4444; box-shadow: 0 1px 3px rgba(239,68,68,0.06), 0 4px 16px rgba(239,68,68,0.04); }
    
    .map-container { position: relative; height: 250px; border-radius: 12px; overflow: hidden; background: #e2e8f0; margin-top: 16px; border: 1px solid #e2e8f0; }
    .map-container.small-map { height: 200px; margin-top: 10px; margin-bottom: 10px; }
    .map-caption { font-size: 0.8rem; color: #94a3b8; margin-top: 8px; text-align: right; font-weight: 500; }
    
    .card h3 { margin-top: 0; color: #0f172a; font-size: 1.2rem; margin-bottom: 8px; font-weight: 700; letter-spacing: -0.01em; }
    .description { color: #64748b; margin-bottom: 24px; line-height: 1.6; font-size: 0.9rem; }

    /* STATS */
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 24px 18px; border-radius: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02); border-bottom: 3px solid #5d6d7e; transition: transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s; border: 1px solid #f1f5f9; border-bottom: 3px solid #5d6d7e; position: relative; overflow: hidden; }
    .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #5d6d7e, #85929e); opacity: 0; transition: opacity 0.3s; }
    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(44,62,80,0.1); }
    .stat-card:hover::before { opacity: 1; }
    .stat-card.alert-stat { border-bottom-color: #d4ac0d; }
    .stat-card.alert-stat::before { background: linear-gradient(90deg, #d4ac0d, #f0c040); }
    .stat-card.critical-stat { border-bottom-color: #c0392b; }
    .stat-card.critical-stat::before { background: linear-gradient(90deg, #c0392b, #e74c3c); }
    .stat-card h3 { font-size: 2.4rem; margin: 0; color: #0f172a; font-weight: 800; letter-spacing: -0.02em; }
    .stat-card p { margin: 8px 0 0; color: #94a3b8; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1.5px; font-weight: 600; }

    /* CRITICAL BANNER */
    .critical-banner { display: flex; align-items: flex-start; gap: 16px; padding: 20px 24px; background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 2px solid #ef4444; border-radius: 14px; margin-bottom: 20px; animation: pulse-border 2s ease-in-out infinite; }
    .banner-icon { font-size: 2rem; line-height: 1; }
    .banner-text strong { color: #dc2626; font-size: 1rem; font-weight: 700; }
    .banner-text p { margin: 5px 0 0; color: #991b1b; font-size: 0.85rem; line-height: 1.6; }

    @keyframes pulse-border {
      0%, 100% { border-color: #ef4444; box-shadow: 0 0 0 0 rgba(239,68,68,0); }
      50% { border-color: #f87171; box-shadow: 0 0 20px 2px rgba(239,68,68,0.12); }
    }

    /* FORMS */
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #334155; font-size: 0.85rem; letter-spacing: 0.02em; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 0.9rem; transition: border 0.2s, box-shadow 0.2s; box-sizing: border-box; color: #1e293b; background: #f8fafc; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #5d6d7e; outline: none; box-shadow: 0 0 0 3px rgba(93,109,126,0.12); background: white; }
    .form-group input::placeholder, .form-group textarea::placeholder { color: #94a3b8; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    /* SEARCH SECTION */
    .search-section { background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1.5px dashed #cbd5e1; }
    .search-input-group { display: flex; gap: 10px; }
    .search-input-group input { flex: 1; }

    /* BUTTONS */
    .primary-btn { padding: 13px 28px; background: linear-gradient(135deg, #34495e, #2c3e50); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.25s; font-size: 0.95rem; width: 100%; box-shadow: 0 4px 14px rgba(44,62,80,0.25); font-family: 'Inter', sans-serif; }
    .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(44,62,80,0.35); }
    .primary-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .danger-btn { padding: 13px 28px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; width: 100%; transition: all 0.2s; font-family: 'Inter', sans-serif; }
    .danger-btn:hover { background: linear-gradient(135deg, #dc2626, #b91c1c); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(239,68,68,0.3); }

    .critical-broadcast-btn { 
      padding: 15px 28px; 
      background: linear-gradient(135deg, #dc2626, #991b1b); 
      color: white; border: none; border-radius: 10px; cursor: pointer; 
      font-weight: 700; width: 100%; font-size: 1.05rem; font-family: 'Inter', sans-serif;
      letter-spacing: 0.5px;
      animation: pulse-btn 1.5s ease-in-out infinite;
      box-shadow: 0 4px 20px rgba(220, 38, 38, 0.35);
      transition: transform 0.2s;
    }
    .critical-broadcast-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(220, 38, 38, 0.45); }
    .critical-broadcast-btn:disabled { animation: none; opacity: 0.6; cursor: not-allowed; transform: none; }

    @keyframes pulse-btn {
      0%, 100% { box-shadow: 0 4px 20px rgba(220, 38, 38, 0.35); }
      50% { box-shadow: 0 4px 32px rgba(220, 38, 38, 0.55); }
    }

    .secondary-btn { padding: 8px 18px; background: #f1f5f9; color: #334155; border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; white-space: nowrap; transition: all 0.2s; font-family: 'Inter', sans-serif; }
    .secondary-btn:hover { background: #e2e8f0; border-color: #cbd5e1; }

    /* TABLE */
    .data-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .data-table th, .data-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 0.9rem; }
    .data-table th { background-color: #f8fafc; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.06em; }
    .data-table tr { transition: background 0.15s; }
    .data-table tbody tr:nth-child(even) { background-color: #fafbfc; }
    .data-table tbody tr:hover { background-color: #f1f5f9; }
    
    .status-badge { padding: 5px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.in_progress { background: #dbeafe; color: #1e40af; }
    .status-badge.completed { background: #d1fae5; color: #065f46; }
    .status-badge.verified { background: #d1fae5; color: #065f46; }
    .status-badge.active { background: #dbeafe; color: #1e40af; }
    .status-badge.rejected { background: #fee2e2; color: #991b1b; }

    .severity-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
    .severity-badge.critical { background: #fee2e2; color: #991b1b; }
    .severity-badge.high { background: #ffedd5; color: #9a3412; }
    .severity-badge.medium { background: #fef3c7; color: #92400e; }
    .severity-badge.low { background: #d1fae5; color: #065f46; }

    .active-dot { height: 8px; width: 8px; background: #10b981; border-radius: 50%; display: inline-block; margin-right: 6px; box-shadow: 0 0 0 2px rgba(16,185,129,0.2); animation: blink 2s infinite; }
    @keyframes blink {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
      50% { opacity: 0.5; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }
    }

    /* MODAL */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(6px); animation: fadeIn 0.2s; }
    .modal-box { background: white; padding: 36px; border-radius: 20px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.2); animation: slideUp 0.3s cubic-bezier(.4,0,.2,1); }
    .modal-icon { font-size: 3rem; margin-bottom: 12px; }
    .modal-box h3 { margin: 0 0 14px; color: #dc2626; font-size: 1.25rem; font-weight: 700; }
    .modal-box p { color: #475569; line-height: 1.6; margin-bottom: 20px; font-size: 0.9rem; }
    .modal-detail { background: #f8fafc; padding: 14px 18px; border-radius: 10px; margin-bottom: 24px; border-left: 4px solid #ef4444; text-align: left; }
    .modal-detail strong { display: block; color: #0f172a; font-weight: 600; }
    .modal-detail span { font-size: 0.85rem; color: #64748b; }
    .modal-actions { display: flex; gap: 12px; justify-content: center; }
    .critical-confirm-btn { padding: 11px 28px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; font-family: 'Inter', sans-serif; }
    .critical-confirm-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(239,68,68,0.3); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

    .message { margin-top: 20px; padding: 14px 20px; border-radius: 10px; text-align: center; font-weight: 500; animation: slideUp 0.3s; font-size: 0.9rem; }
    .success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    
    .mt-4 { margin-top: 1.5rem; }
    .flex-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

    /* ANIMATIONS */
    .fade-in { animation: fadeIn 0.35s ease-out; }
    .fade-row { animation: fadeIn 0.25s ease-out; }
  `]
})
export class AdminDashboardComponent {
  activeTab = 'dashboard';
  currentDate = new Date();

  // Data
  responders: any[] = [];
  tasks: any[] = [];
  recentAlerts: any[] = [];
  criticalCount = 0;

  // Forms
  newTask = {
    description: '',
    responderId: null,
    location: '',
    status: 'PENDING'
  };

  newAlert = {
    title: '',
    disasterType: 'FLOOD',
    severity: 'MEDIUM',
    region: '',
    locationName: '',
    description: ''
  };

  // Search Logic
  searchQuery = '';
  isSearching = false;

  // Map Logic
  mapUrl!: SafeResourceUrl;

  // Confirm Dialog
  showConfirmDialog = false;

  message = '';
  isError = false;
  isLoading = false;

  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    this.initMapWithCurrentLocation();
    this.loadData();
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

  logout() {
    this.authService.logout();
  }

  getPageTitle(): string {
    switch (this.activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'tasks': return 'Assign Rescue Task';
      case 'responders': return 'Manage Responders';
      case 'alerts': return 'Create Disaster Alert';
      default: return 'Admin Dashboard';
    }
  }

  getIcon(type: string): string {
    switch (type?.toUpperCase()) {
      case 'FLOOD': return '🌊';
      case 'EARTHQUAKE': return '⛰️';
      case 'FIRE': return '🔥';
      case 'STORM': return '⛈️';
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

  loadData() {
    this.loadTasks();
    this.loadResponders();
    this.loadRecentAlerts();
  }

  loadTasks() {
    this.http.get<any[]>(`${this.apiUrl}/tasks`, this.getHeaders())
      .pipe(catchError(e => of([])))
      .subscribe(data => this.tasks = data || []);
  }

  loadResponders() {
    this.http.get<any[]>(`${this.apiUrl}/responders`, this.getHeaders())
      .pipe(catchError(e => of([])))
      .subscribe(data => this.responders = data || []);
  }

  loadRecentAlerts() {
    this.http.get<any[]>(`${this.apiUrl}/alerts`, this.getHeaders())
      .pipe(catchError(e => of([])))
      .subscribe(data => {
        this.recentAlerts = (data || []).sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.criticalCount = this.recentAlerts.filter((a: any) => a.severity === 'CRITICAL').length;
      });
  }

  createTask() {
    if (!this.newTask.description || !this.newTask.responderId) {
      this.showMessage('Please fill required fields', true);
      return;
    }

    this.isLoading = true;
    this.http.post(`${this.apiUrl}/tasks?responderId=${this.newTask.responderId}`, this.newTask, this.getHeaders())
      .subscribe({
        next: () => {
          this.showMessage('Task Assigned Successfully', false);
          this.loadTasks();
          this.newTask = { description: '', responderId: null, location: '', status: 'PENDING' };
          this.isLoading = false;
        },
        error: () => {
          this.showMessage('Failed to assign task', true);
          this.isLoading = false;
        }
      });
  }

  performSearch() {
    if (!this.searchQuery) return;
    this.isSearching = true;
    this.message = '';

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}`;

    this.http.get<any[]>(url).subscribe({
      next: (results) => {
        if (results && results.length > 0) {
          const result = results[0];
          const bb = result.boundingbox;
          this.newAlert.region = result.display_name.split(',')[0];
          this.newAlert.locationName = result.display_name;
          this.updateMapUrl(bb[2], bb[0], bb[3], bb[1]);
          this.showMessage(`Found: ${result.display_name}`, false);
        } else {
          this.showMessage('Location not found', true);
        }
        this.isSearching = false;
      },
      error: () => {
        this.showMessage('Error searching location', true);
        this.isSearching = false;
      }
    });
  }

  updateMapUrl(minLon: any, minLat: any, maxLon: any, maxLat: any) {
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  onSeverityChange() {
    // Visual feedback only — the banner shows/hides reactively via *ngIf
  }

  onBroadcastClick() {
    if (!this.newAlert.title) {
      this.showMessage('Title required', true);
      return;
    }

    if (this.newAlert.severity === 'CRITICAL') {
      this.showConfirmDialog = true;
    } else {
      this.createAlert();
    }
  }

  confirmBroadcast() {
    this.showConfirmDialog = false;
    this.createAlert();
  }

  createAlert() {
    this.isLoading = true;
    this.http.post(`${this.apiUrl}/alerts`, this.newAlert, this.getHeaders())
      .subscribe({
        next: () => {
          const isCritical = this.newAlert.severity === 'CRITICAL';
          this.showMessage(
            isCritical
              ? '🚨 CRITICAL Alert Broadcast to All Citizens!'
              : 'Alert Broadcasted Successfully',
            false
          );
          this.newAlert = { title: '', disasterType: 'FLOOD', severity: 'MEDIUM', region: '', locationName: '', description: '' };
          this.searchQuery = '';
          this.isLoading = false;
          this.loadRecentAlerts(); // Refresh the recent alerts list
        },
        error: (err) => {
          console.error(err);
          this.showMessage('Failed to broadcast alert', true);
          this.isLoading = false;
        }
      });
  }

  private showMessage(msg: string, isErr: boolean) {
    this.message = msg;
    this.isError = isErr;
    setTimeout(() => this.message = '', 4000);
  }
}
