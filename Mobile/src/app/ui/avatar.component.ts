import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { initialOf } from '../core/media';

/** Avatar tròn; không có ảnh → gradient #7c3aed→#6366f1 + chữ cái đầu. */
@Component({
  selector: 'vp-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (url && !broken) {
      <img [src]="url" [alt]="name" (error)="broken = true" />
    } @else {
      <span>{{ initial }}</span>
    }
  `,
  host: {
    '[style.width.px]': 'size',
    '[style.height.px]': 'size',
    '[style.border-radius]': 'radius',
    '[style.font-size.px]': 'size * 0.38',
  },
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
        background: var(--vp-grad-accent);
        color: #fff;
        font-weight: 800;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `,
  ],
})
export class AvatarComponent {
  @Input() name: string | null | undefined = '';
  @Input() url: string | null | undefined = '';
  @Input() size = 48;
  @Input() radius = '50%';
  broken = false;

  get initial(): string {
    return initialOf(this.name);
  }
}
