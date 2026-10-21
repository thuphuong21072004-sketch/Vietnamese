import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent } from './icon.component';
import { injectSafeBack } from '../core/navigation';
import { BACK_ICON_ANDROID, BACK_ICON_IOS, isAndroidMode } from '../core/platform-ui';

/**
 * Thanh điều hướng màn con (README §3): iOS cao 44, tiêu đề 17 căn giữa, icon ‹;
 * Android cao 64, tiêu đề 20 căn trái, icon ←. Đặt trong <ion-header class="vp-header">.
 */
@Component({
  selector: 'vp-nav-bar',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="safe"></div>
    <div class="bar" [class.dark]="dark" [class.compact]="compact">
      @if (back) {
        <button type="button" class="back" [attr.aria-label]="'Back'" (click)="goBack()">
          <vp-icon [d]="backIcon" [size]="24" />
        </button>
      } @else {
        <span class="spacer"></span>
      }
      <h1 class="title">{{ title }}</h1>
      <div class="end"><ng-content /></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background: transparent;
      }
      .safe {
        height: var(--vp-safe-top);
      }
      .bar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 6px;
        height: var(--vp-nav-h);
      }
      :host-context(html.md) .bar.compact {
        height: 56px;
      }
      .back {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--vp-primary-dark);
        background: none;
        border: 0;
        padding: 0;
        flex-shrink: 0;
        cursor: pointer;
      }
      .dark .back {
        color: #c4b5fd;
      }
      .spacer {
        width: 10px;
        flex-shrink: 0;
      }
      .title {
        margin: 0;
        flex: 1;
        min-width: 0;
        text-align: var(--vp-nav-align);
        font-size: var(--vp-nav-title);
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dark .title {
        color: #fff;
      }
      .end {
        min-width: 44px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 4px;
      }
    `,
  ],
})
export class NavBarComponent {
  @Input() title = '';
  @Input() back = true;
  @Input() dark = false;
  /** Android cao 56 thay vì 64 (màn Register). */
  @Input() compact = false;
  /** Màn quay về khi không có lịch sử (mở thẳng bằng URL). */
  @Input() defaultHref = '/';

  private safeBack = injectSafeBack();

  get backIcon(): string {
    return isAndroidMode() ? BACK_ICON_ANDROID : BACK_ICON_IOS;
  }

  goBack(): void {
    this.safeBack(this.defaultHref);
  }
}
