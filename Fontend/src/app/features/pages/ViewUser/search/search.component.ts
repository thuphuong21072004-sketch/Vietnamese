import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoService } from '../../../services/video.service';
import { SearchResult } from '../../../models/search-result.model';

declare var YT: any;

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit {
  keyword = '';
  searchkeyword = '';
  hasSearched = false;
  noResult = false;

  results: SearchResult[] = [];
  index = 0;

  videoId = '';
  currentTime = 0;

  subtitle = '';

  isPlaying = true;

  player: any;

  dictionaryData: any = null;

  constructor(private videoService: VideoService) {}

  ngOnInit() {}

  onSearchClick() {
    this.startSearch();
  }

  startSearch() {
    if (!this.keyword.trim()) return;

    this.hasSearched = true;
    this.noResult = false;
    this.videoId = '';
    this.results = [];
    this.dictionaryData = null;
    this.searchkeyword = this.keyword;

    this.videoService.searchVideo(this.keyword).subscribe({
      next: (res) => {
        if (!res || res.length === 0) {
          this.noResult = true;
          return;
        }
        this.results = res;
        this.index = 0;
        const video = res[0];
        this.videoId = video.youtubeId;
        this.subtitle = video.subtitle;
        this.currentTime = Math.floor(video.startTime);
        this.loadVideo();
      },
      error: (err) => console.error('Error finding video:', err),
    });

    this.videoService.getDefinition(this.keyword).subscribe({
      next: (data: any) => {
        
        if (data && (data.meanings.length > 0 || data.translation)) {
          this.dictionaryData = data;
        } else {
          this.dictionaryData = null;
        }
      },
      error: (err) => {
        console.error('Dictionary not found:', err);
        this.dictionaryData = null;
      },
    });
  }

  loadVideo() {
    setTimeout(() => {
      if (this.player) {
        this.player.destroy();
      }

      this.player = new YT.Player('ytplayer', {
        videoId: this.videoId,

        playerVars: {
          start: this.currentTime,
          autoplay: 1,
          mute: 0,
          rel: 0,
        },
      });
    }, 100);
  }

  previousVideo() {
    if (this.index <= 0) return;

    this.index--;

    const video = this.results[this.index];

    this.videoId = video.youtubeId;
    this.subtitle = video.subtitle;
    this.currentTime = Math.floor(video.startTime);

    this.loadVideo();
  }

  nextVideo() {
    if (this.index >= this.results.length - 1) return;

    this.index++;

    const video = this.results[this.index];

    this.videoId = video.youtubeId;
    this.subtitle = video.subtitle;
    this.currentTime = Math.floor(video.startTime);

    this.loadVideo();
  }

  back5() {
    if (!this.player) return;

    const t = this.player.getCurrentTime();

    this.player.seekTo(Math.max(0, t - 5), true);
  }

  forward5() {
    if (!this.player) return;

    const t = this.player.getCurrentTime();

    this.player.seekTo(t + 5, true);
  }

  replay() {
    if (!this.player) return;

    this.player.seekTo(this.currentTime, true);
  }

  pause() {
    if (!this.player) return;

    if (this.player.getPlayerState() === 1) {
      this.player.pauseVideo();
      this.isPlaying = false;
    } else {
      this.player.playVideo();
      this.isPlaying = true;
    }
  }
  playAudio(url: string) {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch((err) => console.error('Audio playback failed:', err));
    }
  }
}
