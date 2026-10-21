import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Stat card (viền trái 4px tùy chọn). size 'sm' → số 22px, 'lg' → 30px. */
@Component({
  selector: 'vp-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="label">{{ label }}</p>
    <p class="value" [style.color]="valueColor" [class.lg]="size === 'lg'">{{ value }}</p>
    @if (sub) {
      <p class="sub">{{ sub }}</p>
    }
  `,
  host: { '[style.border-left]': "accent ? '4px solid ' + accent : null" },
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 4px;
        background: #fff;
        border-radius: var(--vp-r-l);
        padding: 14px 12px;
        box-shadow: var(--vp-sh-card);
        min-width: 0;
      }
      .label {
        font-size: 12px;
        font-weight: 600;
        color: var(--vp-muted-2);
      }
      .value {
        font-size: 22px;
        font-weight: 800;
        color: var(--vp-text);
        letter-spacing: -0.02em;
      }
      .value.lg {
        font-size: 30px;
      }
      .sub {
        font-size: 12px;
        color: var(--vp-muted);
      }
    `,
  ],
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number | null = '';
  @Input() sub = '';
  @Input() accent = '';
  @Input() valueColor = '';
  @Input() size: 'sm' | 'lg' = 'sm';
}
