import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { VideoService } from '@web/services/video.service';
import { SearchResult } from '@web/models/search-result.model';
import { FeedbackService } from '../../core/feedback.service';
import { AuthService } from '../../core/auth.service';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { LoadingComponent, EmptyStateComponent } from '../../ui/states.component';

const YT_API_SRC = 'https://www.youtube.com/iframe_api';
let ytApiPromise: Promise<any> | null = null;

/** Nạp YouTube IFrame API khi cần (index.html của Mobile không có sẵn script này). */
function loadYouTubeApi(): Promise<any> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve, reject) => {
      const prev = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev();
        resolve(w.YT);
      };
      if (!document.querySelector(`script[src="${YT_API_SRC}"]`)) {
        const s = document.createElement('script');
        s.src = YT_API_SRC;
        s.async = true;
        s.onerror = () => {
          ytApiPromise = null;
          reject(new Error('YouTube API failed to load'));
        };
        document.head.appendChild(s);
      }
    });
  }
  return ytApiPromise;
}

interface Control {
  key: 'prev' | 'back' | 'replay' | 'play' | 'fwd' | 'next';
  label: string;
}

/** 10 Vocabulary Search — design-mobile/screens/VocabSearch.dc.html */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, FormsModule, NavBarComponent, IconComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vocab-search.page.html',
  styleUrls: ['./vocab-search.page.css'],
})
export class VocabSearchPage implements OnDestroy {
  private videoService = inject(VideoService);
  /** Khách (chưa đăng nhập, mở từ /search) quay về trang giới thiệu. */
  readonly backHref = inject(AuthService).isLoggedIn ? '/learn' : '/welcome';
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  @ViewChild('playerHost', { static: true }) playerHost!: ElementRef<HTMLDivElement>;

  readonly examples = ['xin chào', 'gia đình', 'ngôi nhà'];
  readonly controls: Control[] = [
    { key: 'prev', label: 'Previous video' },
    { key: 'back', label: 'Back 5 seconds' },
    { key: 'replay', label: 'Replay word' },
    { key: 'play', label: 'Play or pause' },
    { key: 'fwd', label: 'Forward 5 seconds' },
    { key: 'next', label: 'Next video' },
  ];
  private readonly controlIcons: Record<string, string> = {
    prev: 'M19 20 9 12l10-8zM5 19V5',
    back: 'M11 19l-7-7 7-7M18 19l-7-7 7-7',
    replay: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
    pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
    play: ICONS.play,
    fwd: 'M13 5l7 7-7 7M6 5l7 7-7 7',
    next: 'M5 4l10 8-10 8zM19 5v14',
  };

  keyword = '';
  searchKeyword = '';
  hasSearched = false;
  searching = false;
  noResult = false;

  results: SearchResult[] = [];
  index = 0;
  videoId = '';
  currentTime = 0;
  subtitle = '';
  isPlaying = true;

  dictionaryData: any = null;

  private player: any = null;

  search(word?: string): void {
    if (word !== undefined) this.keyword = word;
    const kw = this.keyword.trim();
    if (!kw) return;

    this.hasSearched = true;
    this.searching = true;
    this.noResult = false;
    this.videoId = '';
    this.results = [];
    this.dictionaryData = null;
    this.searchKeyword = kw;
    this.destroyPlayer();
    (document.activeElement as HTMLElement | null)?.blur?.();

    this.videoService.searchVideo(kw).subscribe({
      next: (res) => {
        this.searching = false;
        if (!res || res.length === 0) {
          this.noResult = true;
          this.cdr.markForCheck();
          return;
        }
        this.results = res;
        this.index = 0;
        this.showVideo();
      },
      error: () => {
        this.searching = false;
        this.noResult = true;
        this.fb.toast('Error finding video.', 'error');
        this.cdr.markForCheck();
      },
    });

    this.videoService.getDefinition(kw).subscribe({
      next: (data: any) => {
        this.dictionaryData = data && (data.meanings?.length > 0 || data.translation) ? data : null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.dictionaryData = null;
        this.cdr.markForCheck();
      },
    });
    this.cdr.markForCheck();
  }

  private showVideo(): void {
    const video = this.results[this.index];
    this.videoId = video.youtubeId;
    this.subtitle = video.subtitle ?? '';
    this.currentTime = Math.floor(video.startTime);
    this.isPlaying = true;
    this.cdr.markForCheck();
    this.loadVideo();
  }

  private async loadVideo(): Promise<void> {
    let YT: any;
    try {
      YT = await loadYouTubeApi();
    } catch {
      this.fb.toast('Cannot load the YouTube player.', 'error');
      return;
    }
    this.destroyPlayer();
    // YT.Player thay thế phần tử bằng iframe → tạo phần tử con riêng, không đụng node của Angular
    const host = this.playerHost.nativeElement;
    host.innerHTML = '';
    const mount = document.createElement('div');
    host.appendChild(mount);
    this.player = new YT.Player(mount, {
      videoId: this.videoId,
      width: '100%',
      height: '100%',
      playerVars: { start: this.currentTime, autoplay: 1, mute: 0, rel: 0, playsinline: 1 },
      events: {
        onStateChange: (e: any) => {
          this.zone.run(() => {
            if (e.data === 1) this.isPlaying = true;
            else if (e.data === 2 || e.data === 0) this.isPlaying = false;
            this.cdr.markForCheck();
          });
        },
      },
    });
  }

  private destroyPlayer(): void {
    try {
      this.player?.destroy?.();
    } catch {
      // bỏ qua
    }
    this.player = null;
    if (this.playerHost) this.playerHost.nativeElement.innerHTML = '';
  }

  // ---- Điều khiển ----
  control(key: Control['key']): void {
    switch (key) {
      case 'prev':
        if (this.index > 0) {
          this.index--;
          this.showVideo();
        }
        break;
      case 'next':
        if (this.index < this.results.length - 1) {
          this.index++;
          this.showVideo();
        }
        break;
      case 'back':
        if (this.player?.getCurrentTime) this.player.seekTo(Math.max(0, this.player.getCurrentTime() - 5), true);
        break;
      case 'fwd':
        if (this.player?.getCurrentTime) this.player.seekTo(this.player.getCurrentTime() + 5, true);
        break;
      case 'replay':
        this.player?.seekTo?.(this.currentTime, true);
        break;
      case 'play':
        if (!this.player?.getPlayerState) return;
        if (this.player.getPlayerState() === 1) {
          this.player.pauseVideo();
          this.isPlaying = false;
        } else {
          this.player.playVideo();
          this.isPlaying = true;
        }
        break;
    }
  }

  iconFor(key: Control['key']): string {
    if (key === 'play') return this.isPlaying ? this.controlIcons['pause'] : this.controlIcons['play'];
    return this.controlIcons[key];
  }

  isDisabled(key: Control['key']): boolean {
    if (key === 'prev') return this.index <= 0;
    if (key === 'next') return this.index >= this.results.length - 1;
    return false;
  }

  /** Phụ đề: tách để tô màu từ khóa. */
  get subtitleParts(): { t: string; hit: boolean }[] {
    const sub = this.subtitle;
    const kw = this.searchKeyword;
    if (!sub) return [];
    if (!kw) return [{ t: sub, hit: false }];
    const parts: { t: string; hit: boolean }[] = [];
    const lower = sub.toLowerCase();
    const k = kw.toLowerCase();
    let i = 0;
    while (i < sub.length) {
      const at = lower.indexOf(k, i);
      if (at < 0) {
        parts.push({ t: sub.slice(i), hit: false });
        break;
      }
      if (at > i) parts.push({ t: sub.slice(i, at), hit: false });
      parts.push({ t: sub.slice(at, at + k.length), hit: true });
      i = at + k.length;
    }
    return parts;
  }

  similar(sense: any): string {
    return Array.isArray(sense?.[1]) ? sense[1].join(', ') : '';
  }

  ionViewWillLeave(): void {
    try {
      this.player?.pauseVideo?.();
      this.isPlaying = false;
    } catch {
      // bỏ qua
    }
  }

  ngOnDestroy(): void {
    this.destroyPlayer();
  }
}
