import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { VideoRoomService } from '@web/services/video-room.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent } from '../../ui/icon.component';
import { LoadingComponent } from '../../ui/states.component';
import { roomUrlOf } from './tutoring.utils';

/** Video Room (chưa có design — dựng theo ui-spec §3 "Video Room", cùng phong cách BookingDetail). */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, DatePipe, NavBarComponent, IconComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './video-room.page.html',
  styleUrls: ['./tutoring.shared.css', './video-room.page.css'],
})
export class VideoRoomPage implements OnInit {
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FeedbackService);
  private roomService = inject(VideoRoomService);

  readonly videoIcon = 'M23 7l-7 5 7 5zM1 5h15v14H1z';

  bookingId = 0;
  room: any = null;
  loading = true;
  creating = false;

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRoom();
  }

  private async loadRoom(): Promise<void> {
    this.loading = true;
    try {
      this.room = await firstValueFrom(this.roomService.join('PrivateLesson', this.bookingId));
    } catch {
      this.room = null; // chưa có phòng → hiện nút tạo
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  get roomUrl(): string | null {
    return roomUrlOf(this.room);
  }

  async createRoom(): Promise<void> {
    if (this.creating) return;
    this.creating = true;
    this.cdr.markForCheck();
    try {
      this.room = await firstValueFrom(this.roomService.create('PrivateLesson', this.bookingId));
      const url = this.roomUrl;
      if (url) window.open(url, '_blank');
      else this.fb.toast('Room created, but link is unavailable. Please refresh this page.');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to create room'), 'error');
    } finally {
      this.creating = false;
      this.cdr.markForCheck();
    }
  }

  joinRoom(): void {
    const url = this.roomUrl;
    if (!url) {
      this.fb.toast('Room is not available yet. Please create it first.');
      return;
    }
    window.open(url, '_blank');
  }

  openLink(): void {
    if (this.room?.joinUrl) window.open(this.room.joinUrl, '_blank');
  }
}
