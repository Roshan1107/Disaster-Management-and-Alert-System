import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface AuthResponse {
    token: string;
    role: string;
    userId: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // use environment value so the URL can be changed without touching source code
    // during development we run `ng serve --proxy-config proxy.conf.json` to forward
    // `/api` requests to localhost:8080 and avoid CORS errors.
    private apiUrl = `${environment.apiUrl}/auth`;
    private tokenKey = 'auth_token';
    private roleKey = 'auth_role';

    constructor(private http: HttpClient, private router: Router) { }

    register(user: any): Observable<AuthResponse> {
        this.clearSession(); // Clear stale tokens before registering
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, user).pipe(
            tap(response => this.saveSession(response))
        );
    }

    login(credentials: any): Observable<AuthResponse> {
        this.clearSession(); // Clear stale tokens before logging in
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => this.saveSession(response))
        );
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.roleKey);
        this.router.navigate(['/login']);
    }

    private saveSession(response: AuthResponse): void {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.roleKey, response.role);
    }

    private clearSession(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.roleKey);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    getRole(): string | null {
        return localStorage.getItem(this.roleKey);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}
