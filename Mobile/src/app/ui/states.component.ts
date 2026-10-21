import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Spinner 36px + dòng chữ. */
@Component({
  selector: 'vp-loading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="vp-loading"><span class="vp-spinner"></span>@if (text) {<span>{{ text }}</span>}</div>`,
})
export class LoadingComponent {
  @Input() text = 'Loading...';
}

/** Empty state viền đứt 2px #d1d5db, r18 (README §6.10). Nội dung CTA truyền qua ng-content. */
@Component({
  selector: 'vp-empty',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vp-empty">
      @if (title) {
        <p class="vp-empty__title">{{ title }}</p>
      }
      @if (text) {
        <p>{{ text }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = '';
  @Input() text = '';
}
