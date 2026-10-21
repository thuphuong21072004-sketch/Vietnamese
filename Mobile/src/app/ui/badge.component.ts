import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BadgeTone, toneForClass, toneOf } from './status';

/** Badge trạng thái: tự chọn màu theo nhãn (hoặc truyền tone). */
@Component({
  selector: 'vp-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="vp-badge" [class]="'vp-badge vp-badge--' + resolved">{{ label }}<ng-content /></span>`,
  styles: [':host{display:inline-flex}'],
})
export class BadgeComponent {
  @Input() label: string | null | undefined = '';
  @Input() tone?: BadgeTone;
  /** true → bảng màu vòng đời lớp (Completed = xanh lá). */
  @Input() classLifecycle = false;

  get resolved(): BadgeTone {
    return this.tone ?? (this.classLifecycle ? toneForClass(this.label) : toneOf(this.label));
  }
}
