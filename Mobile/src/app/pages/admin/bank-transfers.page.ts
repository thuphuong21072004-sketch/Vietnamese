import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { PaymentService } from '@web/services/payment.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { BadgeComponent } from '../../ui/badge.component';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

/** Pending Bank Transfers (chưa có design — dựng theo ui-spec §3.4) */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonRefresher, IonRefresherContent, DatePipe, NavBarComponent, BadgeComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bank-transfers.page.html',
  styleUrls: ['./admin.css', './bank-transfers.page.css'],
  host: { class: 'bg-admin' },
})
export class BankTransfersPage implements OnInit {
  private paymentService = inject(PaymentService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  payments: any[] = [];
  loading = true;
  confirming: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.paymentService.getPendingBankTransfers().subscribe({
      next: (res) => {
        this.payments = res || [];
        this.loading = false;
        this.cdr.markForCheck();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
      error: (err) => {
        this.loading = false;
        this.fb.toast(errorMessage(err, 'Could not load bank transfers'), 'error');
        this.cdr.markForCheck();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
    });
  }

  refLabel(refName: string): string {
    return refName === 'CLASS' ? 'Group Class' : 'Private Lesson';
  }

  async confirm(paymentId: number): Promise<void> {
    if (this.confirming) return;
    const ok = await this.fb.confirm({
      header: 'Confirm Payment',
      message: 'Confirm this bank transfer payment?',
      okText: 'Confirm',
    });
    if (!ok) return;
    this.confirming = paymentId;
    this.cdr.markForCheck();
    this.paymentService.confirmBankTransfer(paymentId).subscribe({
      next: () => {
        this.confirming = null;
        this.fb.toast('Payment confirmed', 'success');
        this.load();
      },
      error: (err) => {
        this.confirming = null;
        this.fb.toast(errorMessage(err, 'Failed'), 'error');
        this.cdr.markForCheck();
      },
    });
  }
}
