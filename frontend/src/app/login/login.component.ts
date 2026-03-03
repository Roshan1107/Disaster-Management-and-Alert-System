import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <!-- Left Hero Panel -->
      <div class="hero-panel">
        <div class="hero-content">
          <!-- Inline SVG Illustration -->
          <div class="hero-illustration">
            <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
              <!-- Background glow -->
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#42a5f5" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#42a5f5" stop-opacity="0"/>
                </radialGradient>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#1565c0"/>
                  <stop offset="100%" stop-color="#0d47a1"/>
                </linearGradient>
                <linearGradient id="alertGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ff8f00"/>
                  <stop offset="100%" stop-color="#e65100"/>
                </linearGradient>
              </defs>
              <ellipse cx="200" cy="260" rx="160" ry="20" fill="rgba(66,165,245,0.08)"/>
              <!-- City Skyline -->
              <g opacity="0.5">
                <rect x="60" y="180" width="22" height="80" rx="2" fill="#1a3a5c"/>
                <rect x="88" y="160" width="18" height="100" rx="2" fill="#1a3a5c"/>
                <rect x="112" y="195" width="25" height="65" rx="2" fill="#1a3a5c"/>
                <rect x="143" y="140" width="20" height="120" rx="2" fill="#1a3a5c"/>
                <rect x="168" y="170" width="30" height="90" rx="2" fill="#1a3a5c"/>
                <rect x="205" y="150" width="22" height="110" rx="2" fill="#1a3a5c"/>
                <rect x="233" y="185" width="18" height="75" rx="2" fill="#1a3a5c"/>
                <rect x="257" y="165" width="28" height="95" rx="2" fill="#1a3a5c"/>
                <rect x="291" y="190" width="20" height="70" rx="2" fill="#1a3a5c"/>
                <rect x="317" y="175" width="24" height="85" rx="2" fill="#1a3a5c"/>
              </g>
              <!-- Windows on buildings -->
              <g opacity="0.6">
                <rect x="65" y="190" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="72" y="190" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="65" y="200" width="4" height="4" rx="1" fill="#ff8f00"/>
                <rect x="72" y="210" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="93" y="170" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="93" y="180" width="4" height="4" rx="1" fill="#ff8f00"/>
                <rect x="99" y="190" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="148" y="150" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="155" y="160" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="148" y="170" width="4" height="4" rx="1" fill="#ff8f00"/>
                <rect x="210" y="160" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="218" y="170" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="210" y="180" width="4" height="4" rx="1" fill="#ff8f00"/>
                <rect x="262" y="175" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="270" y="185" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="322" y="185" width="4" height="4" rx="1" fill="#42a5f5"/>
                <rect x="330" y="195" width="4" height="4" rx="1" fill="#ff8f00"/>
              </g>
              <!-- Protective Shield Dome -->
              <ellipse cx="200" cy="260" rx="160" ry="20" fill="url(#glow)"/>
              <path d="M200 40 L320 120 L320 200 Q320 260 200 280 Q80 260 80 200 L80 120 Z" 
                    fill="url(#shieldGrad)" opacity="0.15" stroke="#42a5f5" stroke-width="1.5" stroke-opacity="0.4"/>
              <!-- Shield icon center -->
              <path d="M200 70 L260 110 L260 165 Q260 210 200 230 Q140 210 140 165 L140 110 Z" 
                    fill="url(#shieldGrad)" opacity="0.9" stroke="#42a5f5" stroke-width="2"/>
              <!-- Checkmark inside shield -->
              <polyline points="175,155 192,172 225,135" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Radar / scan rings -->
              <circle cx="200" cy="160" r="90" fill="none" stroke="#42a5f5" stroke-width="0.5" opacity="0.3" stroke-dasharray="4 4">
                <animateTransform attributeName="transform" type="rotate" from="0 200 160" to="360 200 160" dur="20s" repeatCount="indefinite"/>
              </circle>
              <circle cx="200" cy="160" r="120" fill="none" stroke="#42a5f5" stroke-width="0.5" opacity="0.2" stroke-dasharray="6 6">
                <animateTransform attributeName="transform" type="rotate" from="360 200 160" to="0 200 160" dur="30s" repeatCount="indefinite"/>
              </circle>
              <!-- Alert indicators -->
              <g>
                <circle cx="105" cy="105" r="8" fill="url(#alertGrad)" opacity="0.9">
                  <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="105" cy="105" r="12" fill="none" stroke="#ff8f00" stroke-width="1" opacity="0.5">
                  <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
                </circle>
              </g>
              <g>
                <circle cx="310" cy="95" r="6" fill="#e53935" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="310" cy="95" r="10" fill="none" stroke="#e53935" stroke-width="1" opacity="0.4">
                  <animate attributeName="r" values="10;16;10" dur="2.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite"/>
                </circle>
              </g>
              <g>
                <circle cx="80" cy="210" r="5" fill="#2e7d32" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3s" repeatCount="indefinite"/>
                </circle>
              </g>
            </svg>
          </div>
          <h1 class="hero-title">Disaster Management<br/><span>&amp; Alert System</span></h1>
          <p class="hero-tagline">Real-time monitoring, rapid response coordination,<br/>and community safety — all in one platform.</p>
          <div class="hero-features">
            <div class="feature-item">
              <div class="feature-icon">🛡️</div>
              <span>Real-time Alerts</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📡</div>
              <span>Live Monitoring</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🚨</div>
              <span>Rapid Response</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Login Panel -->
      <div class="login-panel">
        <div class="login-container">
          <div class="login-header">
            <div class="logo-badge">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <defs>
                  <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1565c0"/>
                    <stop offset="100%" stop-color="#0d47a1"/>
                  </linearGradient>
                </defs>
                <rect width="40" height="40" rx="10" fill="url(#logoBg)"/>
                <path d="M20 8 L30 14 L30 24 Q30 32 20 35 Q10 32 10 24 L10 14 Z" fill="none" stroke="#fff" stroke-width="1.5"/>
                <polyline points="15,22 18,25 25,17" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h2>Welcome Back</h2>
            <p class="subtitle">Sign in to access your dashboard</p>
          </div>
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email Address</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <input type="email" id="email" [(ngModel)]="email" name="email" required placeholder="name&#64;company.com">
              </div>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                </svg>
                <input type="password" id="password" [(ngModel)]="password" name="password" required placeholder="••••••••">
              </div>
            </div>
            <button type="submit" class="btn-signin">
              <span>Sign In</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </form>
          <div class="register-link">
            <p>Don't have an account? <a routerLink="/register">Create one now</a></p>
          </div>
          <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
          <p *ngIf="successMessage" class="success">{{ successMessage }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .login-page {
      display: flex;
      min-height: 100vh;
      font-family: 'Poppins', 'Segoe UI', sans-serif;
    }

    /* ── Left Hero Panel ── */
    .hero-panel {
      flex: 1;
      background: linear-gradient(160deg, #0a1628 0%, #0d1b2a 40%, #112240 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      position: relative;
      overflow: hidden;
    }
    .hero-panel::before {
      content: '';
      position: absolute;
      top: -30%;
      left: -10%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(21,101,192,0.15) 0%, transparent 70%);
      border-radius: 50%;
    }
    .hero-panel::after {
      content: '';
      position: absolute;
      bottom: -20%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(255,111,0,0.08) 0%, transparent 70%);
      border-radius: 50%;
    }

    .hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 380px;
    }

    .hero-illustration {
      margin-bottom: 18px;
    }
    .hero-illustration svg {
      width: 100%;
      max-width: 240px;
      height: auto;
      filter: drop-shadow(0 4px 20px rgba(66,165,245,0.15));
    }

    .hero-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }
    .hero-title span {
      background: linear-gradient(90deg, #42a5f5, #ff8f00);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-tagline {
      font-size: 0.85rem;
      color: #90a4ae;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .hero-features {
      display: flex;
      gap: 18px;
      justify-content: center;
    }
    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .feature-icon {
      width: 40px;
      height: 40px;
      background: rgba(21, 101, 192, 0.15);
      border: 1px solid rgba(66, 165, 245, 0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      transition: transform 0.3s, background 0.3s;
    }
    .feature-icon:hover {
      transform: translateY(-3px);
      background: rgba(21, 101, 192, 0.25);
    }
    .feature-item span {
      font-size: 0.75rem;
      color: #90a4ae;
      font-weight: 500;
    }

    /* ── Right Login Panel ── */
    .login-panel {
      flex: 0.9;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 32px 28px;
    }

    .login-container {
      width: 100%;
      max-width: 360px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo-badge {
      display: inline-flex;
      margin-bottom: 20px;
    }

    h2 {
      color: #1a237e;
      margin-bottom: 6px;
      font-size: 1.45rem;
      font-weight: 700;
    }
    .subtitle {
      color: #78909c;
      font-size: 0.85rem;
      margin: 0;
    }

    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      color: #37474f;
      font-weight: 500;
      font-size: 0.84rem;
    }

    .input-wrapper {
      position: relative;
    }
    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: #90a4ae;
      pointer-events: none;
    }
    input {
      width: 100%;
      padding: 11px 14px 11px 40px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      outline: none;
      box-sizing: border-box;
      background: #fafafa;
      color: #263238;
    }
    input:focus {
      border-color: #1565c0;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(21, 101, 192, 0.08);
    }
    input::placeholder {
      color: #b0bec5;
    }

    .btn-signin {
      width: 100%;
      padding: 11px 20px;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      letter-spacing: 0.3px;
    }
    .btn-signin:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(21, 101, 192, 0.35);
    }
    .btn-signin:active {
      transform: translateY(0);
    }
    .btn-signin svg {
      transition: transform 0.3s;
    }
    .btn-signin:hover svg {
      transform: translateX(4px);
    }

    .register-link {
      text-align: center;
      margin-top: 20px;
      font-size: 0.85rem;
      color: #78909c;
    }
    .register-link a {
      color: #1565c0;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }
    .register-link a:hover {
      color: #0d47a1;
      text-decoration: underline;
    }

    .error {
      color: #c62828;
      margin-top: 18px;
      text-align: center;
      background: #ffebee;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.88rem;
      border: 1px solid #ef9a9a;
    }
    .success {
      color: #2e7d32;
      margin-top: 18px;
      text-align: center;
      background: #e8f5e9;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.88rem;
      border: 1px solid #a5d6a7;
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .login-page {
        flex-direction: column;
      }
      .hero-panel {
        padding: 40px 24px 32px;
      }
      .hero-illustration svg {
        max-width: 280px;
      }
      .hero-title {
        font-size: 1.5rem;
      }
      .hero-tagline {
        font-size: 0.85rem;
        margin-bottom: 24px;
      }
      .hero-features {
        gap: 16px;
      }
      .login-panel {
        padding: 40px 24px;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['registered']) {
        this.successMessage = 'Registration successful! Please login.';
      }
    });
  }

  onSubmit() {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res.role === 'ADMIN') this.router.navigate(['/admin']);
        else if (res.role === 'RESPONDER') this.router.navigate(['/responder']);
        else if (res.role === 'CITIZEN') this.router.navigate(['/citizen']);
      },
      error: (err) => {
        console.error('Login error details:', err);
        if (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) {
          this.errorMessage = 'Backend server is unreachable. Please make sure the server is running.';
        } else if (err.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else if (err.status === 429) {
          this.errorMessage = 'Too many attempts. Please try again after a minute.';
        } else if (err.status === 500) {
          this.errorMessage = 'Server error. Please check the backend logs.';
        } else if (err.error && (err.error.message || err.error.error)) {
          this.errorMessage = err.error.message || err.error.error;
        } else {
          this.errorMessage = 'Backend server is unreachable. Please make sure the server is running.';
        }
      }
    });
  }
}
