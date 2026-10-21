import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent, ICONS } from '../../../ui/icon.component';
import { T_ICONS } from '../teacher.utils';

/** Nav tile của module Travel (GV): My Schedules / Invites & Requests / Browse Student Trips — theo kiểu TravelTrips.dc.html. */
@Component({
  selector: 'vp-teacher-travel-tabs',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tiles" aria-label="Travel">
      @for (t of tiles; track t.key) {
        <a
          class="tile"
          [class.on]="active === t.key"
          [attr.aria-current]="active === t.key ? 'page' : null"
          [routerLink]="t.link"
          [replaceUrl]="!!active"
        >
          <vp-icon [d]="t.d" [size]="18" />
          <span>{{ t.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [
    `
      .tiles {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .tile {
        min-height: 64px;
        box-sizing: border-box;
        padding: 8px 6px;
        border-radius: var(--vp-r-m2);
        background: #fff;
        border: 1.5px solid var(--vp-emerald);
        color: var(--vp-emerald);
        font-size: 12px;
        font-weight: 700;
        line-height: 1.2;
        text-align: center;
        text-decoration: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
      .tile.on {
        background: var(--vp-emerald);
        color: #fff;
      }
    `,
  ],
})
export class TeacherTravelTabsComponent {
  /** Tile đang mở ('' ở Travel Home → không tile nào chọn). */
  @Input() active: '' | 'schedules' | 'requests' | 'open-trips' = '';

  readonly tiles = [
    { key: 'schedules', label: 'My Schedules', link: '/teacher/travel/schedules', d: ICONS.calendar },
    { key: 'requests', label: 'Invites & Requests', link: '/teacher/travel/requests', d: T_ICONS.mail },
    { key: 'open-trips', label: 'Browse Student Trips', link: '/teacher/travel/open-trips', d: ICONS.search },
  ];
}
