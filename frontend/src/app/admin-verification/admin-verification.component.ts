import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDisasterService } from '../services/admin-disaster.service';
import { DisasterEvent } from '../services/disaster-monitoring.service';

@Component({
    selector: 'app-admin-verification',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-verification.component.html',
    styleUrls: ['./admin-verification.component.css']
})
export class AdminVerificationComponent implements OnInit, OnDestroy {
    pendingAlerts: DisasterEvent[] = [];
    loading = false;
    error: string | null = null;
    successMessage: string | null = null;

    // Reject modal state
    showRejectModal = false;
    rejectingAlertId: number | null = null;
    rejectReason = '';

    // Countdown timers
    private timerInterval: any;
    readonly ESCALATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

    constructor(private adminService: AdminDisasterService) { }

    ngOnInit(): void {
        this.loadPendingAlerts();
        // Refresh every 30 seconds
        this.timerInterval = setInterval(() => {
            this.loadPendingAlerts();
        }, 30000);
    }

    ngOnDestroy(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    loadPendingAlerts(): void {
        this.loading = this.pendingAlerts.length === 0; // only show spinner on first load
        this.error = null;

        this.adminService.getPendingAlerts().subscribe({
            next: (data) => {
                this.pendingAlerts = data;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load pending alerts. Please try again.';
                this.loading = false;
                console.error('Error loading pending alerts:', err);
            }
        });
    }

    approveAlert(id: number): void {
        this.adminService.approveAlert(id).subscribe({
            next: () => {
                this.showSuccess('Alert approved and sent to responders ✓');
                this.loadPendingAlerts();
            },
            error: (err) => {
                this.error = 'Failed to approve alert. Please try again.';
                console.error('Error approving alert:', err);
            }
        });
    }

    openRejectModal(id: number): void {
        this.rejectingAlertId = id;
        this.rejectReason = '';
        this.showRejectModal = true;
    }

    closeRejectModal(): void {
        this.showRejectModal = false;
        this.rejectingAlertId = null;
        this.rejectReason = '';
    }

    submitReject(): void {
        if (this.rejectingAlertId === null) return;

        this.adminService.rejectAlert(this.rejectingAlertId, this.rejectReason).subscribe({
            next: () => {
                this.showSuccess('Alert rejected successfully');
                this.closeRejectModal();
                this.loadPendingAlerts();
            },
            error: (err) => {
                this.error = 'Failed to reject alert. Please try again.';
                console.error('Error rejecting alert:', err);
            }
        });
    }

    confirmReject(id: number): void {
        this.openRejectModal(id);
    }

    showSuccess(message: string): void {
        this.successMessage = message;
        setTimeout(() => { this.successMessage = null; }, 4000);
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleString();
    }

    getSeverityClass(severity: string): string {
        switch (severity) {
            case 'CRITICAL': return 'badge-critical';
            case 'HIGH': return 'badge-high';
            case 'MEDIUM': return 'badge-medium';
            case 'LOW': return 'badge-low';
            default: return 'badge-default';
        }
    }

    /**
     * Get remaining time before auto-escalation (in milliseconds).
     * Returns 0 if already expired.
     */
    getRemainingMs(alert: DisasterEvent): number {
        if (!alert.pendingSince) return this.ESCALATION_TIMEOUT_MS;
        const pendingSince = new Date(alert.pendingSince).getTime();
        const deadline = pendingSince + this.ESCALATION_TIMEOUT_MS;
        const remaining = deadline - Date.now();
        return Math.max(0, remaining);
    }

    /**
     * Format remaining time as "M:SS"
     */
    getCountdownText(alert: DisasterEvent): string {
        const remaining = this.getRemainingMs(alert);
        if (remaining <= 0) return 'Auto-escalating...';
        const totalSeconds = Math.ceil(remaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Check if alert is about to expire (< 1 minute remaining)
     */
    isUrgent(alert: DisasterEvent): boolean {
        return this.getRemainingMs(alert) < 60000 && this.getRemainingMs(alert) > 0;
    }

    /**
     * Check if alert has already expired
     */
    isExpired(alert: DisasterEvent): boolean {
        return this.getRemainingMs(alert) <= 0;
    }
}
