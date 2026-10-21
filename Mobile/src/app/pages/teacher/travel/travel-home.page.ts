import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { NavBarComponent } from '../../../ui/nav-bar.component';
import { IconComponent, ICONS } from '../../../ui/icon.component';
import { T_ICONS } from '../teacher.utils';
import { TeacherTravelTabsComponent } from './travel-tabs.component';

/** Travel Home (GV) — chưa có design, dựng theo ui-spec §3.3 (phong cách TravelTrips.dc.html, nền travel) */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, RouterLink, NavBarComponent, IconComponent, TeacherTravelTabsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'bg-travel' },
  template: `
    <ion-header class="vp-header">
      <vp-nav-bar title="Travel" defaultHref="/teacher/me" />
    </ion-header>
    <ion-content>
      <div class="vp-scroll vp-scroll--tight">
        <vp-teacher-travel-tabs />

        <section class="hero">
          <span class="hero__badge"><vp-icon [d]="icons.plane" [size]="14" /> Travel Companion</span>
          <h2 class="hero__title">Share the Beauty of Your Homeland</h2>
          <p class="hero__desc">
            You know your local culture inside out and want to share it with international travelers? Post your travel
            schedule, connect with students looking for a companion, and create unforgettable experiences together.
          </p>
          <a class="vp-btn vp-btn--white hero__cta" routerLink="/teacher/travel/schedules" [queryParams]="{ new: 1 }">
            <vp-icon [d]="icons.plus" [size]="18" [stroke]="2.4" />
            Add a New Travel Schedule
          </a>
        </section>

        @for (f of features; track f.title) {
          <article class="feature">
            <span class="feature__icon"><vp-icon [d]="f.d" [size]="20" /></span>
            <div class="vp-grow">
              <h3 class="feature__title">{{ f.title }}</h3>
              <p class="vp-meta">{{ f.text }}</p>
            </div>
          </article>
        }
      </div>
    </ion-content>
  `,
  styleUrls: ['./travel.css'],
  styles: [
    `
      .hero {
        border-radius: var(--vp-r-xl2);
        padding: 20px;
        color: #fff;
        background: var(--vp-grad-travel);
        box-shadow: 0 18px 48px rgba(5, 150, 105, 0.25);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .hero__badge {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
        font-size: 12px;
        font-weight: 700;
      }
      .hero__title {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.2;
      }
      .hero__desc {
        font-size: 14px;
        line-height: 1.55;
        opacity: 0.92;
      }
      .hero__cta {
        color: #047857;
        height: 48px;
        font-size: 15px;
      }
      .feature {
        background: #fff;
        border-radius: var(--vp-r-l2);
        padding: 14px;
        box-shadow: var(--vp-sh-card);
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      .feature__icon {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border-radius: var(--vp-r-s);
        background: var(--vp-emerald-soft);
        color: var(--vp-emerald);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .feature__title {
        margin: 0 0 2px;
        font-size: 15px;
        font-weight: 700;
      }
    `,
  ],
})
export class TeacherTravelHomePage {
  readonly icons = T_ICONS;
  readonly features = [
    { d: ICONS.calendar, title: 'Set Your Availability', text: "Let students know where you can accompany them and when you're available." },
    { d: T_ICONS.handshake, title: 'Connect with Students', text: 'Send invites to matching students or wait for them to reach out to you.' },
    { d: T_ICONS.chat, title: 'A Meaningful Journey', text: 'Guide them through local life while helping them practice Vietnamese in the real world.' },
  ];
}
