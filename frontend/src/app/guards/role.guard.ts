import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const expectedRole = route.data['role'];

    const userRole = authService.getRole();

    if (authService.isLoggedIn() && userRole === expectedRole) {
        return true;
    }

    // Redirect to appropriate dashboard or login if role mismatch
    if (authService.isLoggedIn()) {
        switch (userRole) {
            case 'ADMIN': return router.createUrlTree(['/admin']);
            case 'RESPONDER': return router.createUrlTree(['/responder']);
            case 'CITIZEN': return router.createUrlTree(['/citizen']);
        }
    }

    return router.createUrlTree(['/login']);
};
