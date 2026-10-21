import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { VideoService } from '@web/services/video.service';
import { Video } from '@web/models/video.model';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { BadgeComponent } from '../../ui/badge.component';
import { BadgeTone } from '../../ui/status';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

const STATUS_LABEL: Record<number, string> = { 0: 'Pending', 1: 'Approved', 2: 'Temporarily Locked' };
const STATUS_TONE: Record<number, BadgeTone> = { 0: 'warning', 1: 'success', 2: 'danger' };

/** Video Management (chưa có design — dựng theo ui-spec §3.4) */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, FormsModule, NavBarComponent, BadgeComponent, IconComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './videos.page.html',
  styleUrls: ['./admin.css', './videos.page.css'],
  host: { class: 'bg-admin' },
})
export class AdminVideosPage implements OnInit {
  @ViewChild(IonContent) content?: IonContent;

  private videoService = inject(VideoService);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = ICONS;
  readonly statusChips: { value: number | null; label: string }[] = [
    { value: null, label: 'All' },
    { value: 0, label: 'Pending' },
    { value: 1, label: 'Approved' },
    { value: 2, label: 'Temporarily Locked' },
  ];

  videos: Video[] = [];
  selected: Video | null = null;
  playerUrl: SafeResourceUrl | null = null;

  loading = true;
  page = 1;
  readonly pageSize = 10;
  total = 0;
  status: number | null = null;

  youtubeId = '';
  searchYoutubeId = '';
  searchMode = false;
  importing = false;

  ngOnInit(): void {
    this.loadVideos();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  statusLabel(s: number): string {
    return STATUS_LABEL[s] ?? 'Unknown';
  }

  statusTone(s: number): BadgeTone {
    return STATUS_TONE[s] ?? 'neutral';
  }

  thumb(v: Video): string {
    return v.thumbnail || `https://img.youtube.com/vi/${v.youtubeId}/0.jpg`;
  }

  loadVideos(resetPage = false): void {
    if (resetPage) this.page = 1;
    this.searchMode = false;
    this.loading = true;
    this.cdr.markForCheck();
    this.videoService.listVideo(this.status ?? undefined, this.page, this.pageSize).subscribe({
      next: (res: any) => {
        this.videos = res?.data || (Array.isArray(res) ? res : []);
        this.total = res?.total || 0;
        // giữ video đang xem nếu còn trong trang, không thì chọn video đầu
        const keep = this.selected && this.videos.find((v) => v.id === this.selected!.id);
        if (keep) this.setSelected(keep);
        else if (this.videos.length) this.setSelected(this.videos[0]);
        else this.setSelected(null);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.fb.toast(errorMessage(err, 'Video list loading error'), 'error');
        this.cdr.markForCheck();
      },
    });
  }

  setStatus(s: number | null): void {
    if (s === this.status && !this.searchMode) return;
    this.status = s;
    this.loadVideos(true);
  }

  private setSelected(v: Video | null): void {
    this.selected = v;
    this.playerUrl = v
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtubeId)}`)
      : null;
  }

  /** Chạm card → phát video ở player đầu trang. */
  select(v: Video): void {
    this.setSelected(v);
    this.cdr.markForCheck();
    this.content?.scrollToTop(300);
  }

  importVideo(): void {
    const id = this.youtubeId.trim();
    if (!id) {
      this.fb.toast('Enter YouTube ID to import', 'error');
      return;
    }
    this.importing = true;
    this.videoService.insertVideo(id).subscribe({
      next: () => {
        this.importing = false;
        this.youtubeId = '';
        this.fb.toast('Imported video successfully', 'success');
        this.loadVideos();
      },
      error: (err) => {
        this.importing = false;
        this.fb.toast(errorMessage(err, 'Video import failed'), 'error');
        this.cdr.markForCheck();
      },
    });
  }

  searchVideoById(): void {
    const id = this.searchYoutubeId.trim();
    if (!id) {
      this.fb.toast('Enter YouTube ID to search', 'error');
      return;
    }
    this.videoService.getVideoById(id).subscribe({
      next: (video) => {
        if (!video) {
          this.fb.toast('Video not found', 'error');
          return;
        }
        this.searchMode = true;
        this.videos = [video];
        this.select(video);
      },
      error: (err) => this.fb.toast(errorMessage(err, 'Video not found'), 'error'),
    });
  }

  backToList(): void {
    this.searchYoutubeId = '';
    this.loadVideos(true);
  }

  updateStatus(v: Video, value: number | string): void {
    const s = Number(value);
    const prev = v.status;
    v.status = s;
    this.videoService.updateVideo(v.id, s).subscribe({
      next: () => {
        this.fb.toast('Status update successful', 'success');
        if (this.searchMode) this.cdr.markForCheck();
        else this.loadVideos();
      },
      error: (err) => {
        v.status = prev;
        this.fb.toast(errorMessage(err, 'Status update error'), 'error');
        this.cdr.markForCheck();
      },
    });
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadVideos();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadVideos();
    }
  }
}
