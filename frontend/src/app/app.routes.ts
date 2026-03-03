import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { ResponderDashboardComponent } from './dashboard/responder-dashboard.component';
import { CitizenDashboardComponent } from './dashboard/citizen-dashboard.component';
import { DisasterMonitoringComponent } from './disaster-monitoring/disaster-monitoring.component';
import { AdminVerificationComponent } from './admin-verification/admin-verification.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'admin',
        component: AdminDashboardComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'ADMIN' }
    },
    {
        path: 'responder',
        component: ResponderDashboardComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'RESPONDER' }
    },
    {
        path: 'citizen',
        component: CitizenDashboardComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'CITIZEN' }
    },
    {
        path: 'disaster-monitoring',
        component: DisasterMonitoringComponent,
        canActivate: [authGuard]
    },
    {
        path: 'admin/verification',
        component: AdminVerificationComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'ADMIN' }
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];
