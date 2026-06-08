import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-bank-transfers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bank-transfers.component.html',
  styleUrls: ['./bank-transfers.component.css'],
})
export class BankTransfersComponent implements OnInit {
  payments: any[] = [];
  loading = false;
  confirming: number | null = null;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.paymentService.getPendingBankTransfers().subscribe({
      next: (res) => {
        this.payments = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  confirm(paymentId: number): void {
    if (!confirm('Confirm this bank transfer payment?')) return;
    this.confirming = paymentId;
    this.paymentService.confirmBankTransfer(paymentId).subscribe({
      next: () => {
        this.confirming = null;
        this.load();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed');
        this.confirming = null;
      },
    });
  }

  getRefLabel(refName: string): string {
    return refName === 'CLASS' ? 'Group Class' : 'Private Lesson';
  }
}
