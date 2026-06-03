import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { PaymentService } from '../../../services/payment.service';

import { BookingService } from '../../../services/booking.service';
import { loadStripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-payment',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './payment.component.html',

  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit {
  bookingId = 0;

  booking: any = null;

  payment: any = null;
  currencies: Record<string, number> = {};

  selectedCurrency = 'USD';

  showCurrencyModal = false;

  loading = false;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    public paymentService: PaymentService,

    public bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadBooking();

    this.loadPayment();
  }

  /*
   * load booking detail
   */
  loadBooking() {
    this.bookingService
      .getDetail(this.bookingId)

      .subscribe({
        next: (res) => {
          this.booking = res;
        },

        error: (err) => {
          console.error(err);

          this.booking = null;

          alert(err.error?.message || 'Failed to load booking');
        },
      });
  }

  /*
   * load payment
   */
  loadPayment() {
    this.paymentService
      .getByBooking(this.bookingId)

      .subscribe({
        next: (res) => {
          this.payment = res;

          /*
           * payment success
           */
          if (res && res.status === 1) {
            this.goClassroom();
          }
        },

        error: () => {
          this.payment = null;
        },
      });
  }

  /*
   * calculate payment amount
   */
  getAmount(): number {
    if (!this.booking) {
      return 0;
    }

    const pricePerHour = Number(
      this.booking?.instructor?.teacherProfile?.approvedPricePerHour || 0,
    );

    const start = new Date(this.booking.startTime);

    const end = new Date(this.booking.endTime);

    const durationHours = Math.max(
      0.5,
      (end.getTime() - start.getTime()) / (1000 * 60 * 60),
    );

    return (
      Math.round((pricePerHour * durationHours + Number.EPSILON) * 100) / 100
    );
  }
  getPricePerHour(): number {
    return Number(
      this.booking?.instructor?.teacherProfile?.approvedPricePerHour || 0,
    );
  }
  /*
   * booking duration
   */
  getDuration(): string {
    if (!this.booking) {
      return '-';
    }

    const start = new Date(this.booking.startTime);

    const end = new Date(this.booking.endTime);

    const totalMinutes = Math.max(
      30,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60)),
    );

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    if (hours <= 0) {
      return `${minutes}m`;
    }

    if (minutes <= 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  }

  /*
   * currency format
   */
  formatCurrency(value: number): string {
    return value.toLocaleString('en-US', {
      style: 'currency',

      currency: 'USD',
    });
  }

  /*
   * pay with VNPay
   */
  pay() {
    if (!this.booking) {
      alert('Booking not found');
      return;
    }

    const amount = this.getAmount();

    if (amount <= 0) {
      alert('Invalid payment amount');
      return;
    }

    if (this.payment && this.payment.status === 1) {
      this.goClassroom();
      return;
    }

    this.paymentService.getCurrencies(amount).subscribe({
      next: (res) => {
        this.currencies = res;

        this.selectedCurrency = 'USD';

        this.showCurrencyModal = true;
      },

      error: (err) => {
        console.error(err);

        alert(err.error?.message || 'Failed to load currencies');
      },
    });
  }

  /*
   * helper payment status
   */
  getStatusText(status: number): string {
    return this.paymentService.getStatusText(status);
  }

  /*
   * helper payment css class
   */
  getStatusClass(status: number): string {
    return this.paymentService.getStatusClass(status);
  }

  /*
   * back
   */
  back() {
    history.back();
  }

  /*
   * go booking detail
   */
  goBooking() {
    this.router.navigate(['/booking', this.bookingId]);
  }

  /*
   * go classroom
   */
  goClassroom() {
    this.router.navigate(['/video-room', this.bookingId]);
  }
  confirmPayment() {
    this.loading = true;

    if (
      this.payment &&
      (this.payment.status === 0 || this.payment.status === 2)
    ) {
      this.paymentService
        .createStripeUrl(this.payment.paymentId, this.selectedCurrency)
        .subscribe({
          next: (stripeRes) => {
            window.location.href = stripeRes.paymentUrl;
          },

          error: (err) => {
            console.error(err);

            alert(err.error);

            this.loading = false;
          },
        });

      return;
    }

    const body = {
      bookingId: this.bookingId,
      amount: this.getAmount(),
      paymentMethod: 0,
    };

    this.paymentService.create(body).subscribe({
      next: (res) => {
        this.payment = res;

        this.paymentService
          .createStripeUrl(res.paymentId, this.selectedCurrency)
          .subscribe({
            next: (stripeRes) => {
              window.location.href = stripeRes.paymentUrl;
            },

            error: (err) => {
              console.error(err);

              this.loading = false;
            },
          });
      },

      error: (err) => {
        console.error(err);

        this.loading = false;
      },
    });
  }
  closeCurrencyModal() {
    this.showCurrencyModal = false;
  }
  currencyOptions = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'KRW', name: 'South Korean Won' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'HKD', name: 'Hong Kong Dollar' },
    { code: 'TWD', name: 'Taiwan Dollar' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'PHP', name: 'Philippine Peso' },
    { code: 'IDR', name: 'Indonesian Rupiah' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'VND', name: 'Vietnamese Dong' },
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'QAR', name: 'Qatari Riyal' },
    { code: 'KWD', name: 'Kuwaiti Dinar' },
    { code: 'BHD', name: 'Bahraini Dinar' },
    { code: 'OMR', name: 'Omani Rial' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'NOK', name: 'Norwegian Krone' },
    { code: 'DKK', name: 'Danish Krone' },
    { code: 'PLN', name: 'Polish Zloty' },
    { code: 'CZK', name: 'Czech Koruna' },
    { code: 'HUF', name: 'Hungarian Forint' },
    { code: 'RON', name: 'Romanian Leu' },
    { code: 'BGN', name: 'Bulgarian Lev' },
    { code: 'HRK', name: 'Croatian Kuna' },
    { code: 'TRY', name: 'Turkish Lira' },
    { code: 'MXN', name: 'Mexican Peso' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'ARS', name: 'Argentine Peso' },
    { code: 'CLP', name: 'Chilean Peso' },
    { code: 'COP', name: 'Colombian Peso' },
    { code: 'PEN', name: 'Peruvian Sol' },
    { code: 'UYU', name: 'Uruguayan Peso' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'ILS', name: 'Israeli Shekel' },
  ];
  searchCurrency = '';
  get filteredCurrencies() {
    if (!this.searchCurrency) {
      return this.currencyOptions;
    }

    const keyword = this.searchCurrency.toLowerCase();

    return this.currencyOptions.filter(
      (x) =>
        x.code.toLowerCase().includes(keyword) ||
        x.name.toLowerCase().includes(keyword),
    );
  }
}
