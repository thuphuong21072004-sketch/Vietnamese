import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegmentOption {
  value: string;
  label: string;
}

/** Segmented control: nền trắng viền hairline, mục chọn gradient #7c3aed→#6366f1. */
@Component({
  selector: 'vp-segmented',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="tablist">
      @for (o of options; track o.value) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="o.value === value"
          [class.on]="o.value === value"
          (click)="select(o.value)"
        >
          {{ o.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .seg {
        display: flex;
        padding: 4px;
        background: #fff;
        border: 1px solid var(--vp-hairline);
        border-radius: var(--vp-r-m2);
      }
      button {
        flex: 1;
        height: 40px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: var(--vp-text-body);
        font: 700 14px var(--vp-font);
        cursor: pointer;
      }
      button.on {
        background: var(--vp-grad-accent);
        color: #fff;
      }
    `,
  ],
})
export class SegmentedComponent {
  @Input() options: SegmentOption[] = [];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  select(v: string): void {
    if (v !== this.value) this.valueChange.emit(v);
  }
}
