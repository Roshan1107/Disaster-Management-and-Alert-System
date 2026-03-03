import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-wrapper">
      <div class="register-container">
        <h2>Create Account</h2>
        <p class="subtitle">Join the Disaster Management System</p>
        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input type="text" id="fullName" [(ngModel)]="fullName" name="fullName" required placeholder="John Doe">
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" [(ngModel)]="email" name="email" required placeholder="name@company.com">
          </div>
          <div class="form-group">
            <label for="phoneNumber">Phone Number</label>
            <input type="tel" id="phoneNumber" [(ngModel)]="phoneNumber" name="phoneNumber" required placeholder="+1234567890">
          </div>
          <div class="form-group">
            <label for="region">Region</label>
            <input type="text" id="region" [(ngModel)]="region" name="region" required placeholder="City/State">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" [(ngModel)]="password" name="password" required placeholder="••••••••" minlength="6">
          </div>
           <div class="form-group">
            <label for="role">Select Role</label>
            <div class="select-wrapper">
              <select id="role" [(ngModel)]="role" name="role" required>
                <option value="CITIZEN">Citizen</option>
                <option value="RESPONDER">Responder</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" [disabled]="!registerForm.form.valid || isLoading">
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>
        <div class="login-link">
          <p>Already have an account? <a routerLink="/login">Sign in instead</a></p>
        </div>
        <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0d1b2a 0%, #1b3a5c 50%, #0d47a1 100%);
      font-family: 'Poppins', 'Segoe UI', sans-serif;
      padding: 20px;
    }
    .register-container {
      background: rgba(255, 255, 255, 0.97);
      padding: 40px;
      border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 500px;
      transition: transform 0.3s ease;
    }
    .register-container:hover {
      transform: translateY(-4px);
    }
    h2 {
      color: #1a237e;
      margin-bottom: 10px;
      font-size: 1.8rem;
      text-align: center;
      font-weight: 700;
    }
    .subtitle {
      color: #78909c;
      text-align: center;
      margin-bottom: 30px;
      font-size: 0.95rem;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      color: #37474f;
      font-weight: 500;
      font-size: 0.9rem;
    }
    input, select {
      width: 100%;
      padding: 11px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.3s;
      outline: none;
      box-sizing: border-box;
      background-color: #fafafa;
      color: #263238;
    }
    input:focus, select:focus {
      border-color: #1565c0;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.1);
    }
    .select-wrapper {
      position: relative;
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #1565c0, #0d47a1);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1.05rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 20px;
    }
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(21, 101, 192, 0.35);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .login-link {
      text-align: center;
      margin-top: 25px;
      font-size: 0.9rem;
      color: #78909c;
    }
    .login-link a {
      color: #1565c0;
      text-decoration: none;
      font-weight: 600;
    }
    .login-link a:hover {
      color: #0d47a1;
      text-decoration: underline;
    }
    .error {
      color: #c62828;
      margin-top: 15px;
      text-align: center;
      background: #ffebee;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.88rem;
      border: 1px solid #ef9a9a;
    }
  `]
})
export class RegisterComponent {
  fullName = '';
  email = '';
  phoneNumber = '';
  region = '';
  password = '';
  role = 'CITIZEN';

  errorMessage = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    this.errorMessage = '';
    this.isLoading = true;

    const payload = {
      fullName: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      region: this.region,
      password: this.password,
      role: this.role
    };

    console.log('Submitting registration:', payload);

    this.authService.register(payload).subscribe({
      next: (res) => {
        console.log('Registration successful', res);
        this.isLoading = false;
        this.router.navigate(['/login'], { queryParams: { registered: true } });
      },
      error: (err) => {
        console.error('Registration error details:', err);
        this.isLoading = false;

        if (err.status === 409) {
          this.errorMessage = 'Registration failed: This email is already registered.';
        } else if (err.status === 400 && err.error && err.error.errors) {
          // Handle field-level validation errors
          const fieldErrors = Object.values(err.error.errors).join(', ');
          this.errorMessage = `Registration failed: ${fieldErrors}`;
        } else if (err.status === 429) {
          this.errorMessage = 'Too many attempts. Please try again after a minute.';
        } else if (err.status === 0) {
          this.errorMessage = 'Registration failed: Backend server is unreachable. Please check if it is running.';
        } else if (err.error && err.error.message) {
          this.errorMessage = `Registration failed: ${err.error.message}`;
        } else if (err.error && err.error.error) {
          this.errorMessage = `Registration failed: ${err.error.error}`;
        } else {
          this.errorMessage = 'Registration failed due to a server error. Please try again later.';
        }
      }
    });
  }
}
