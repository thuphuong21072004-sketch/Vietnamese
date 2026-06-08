import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute } from '@angular/router';

import { VideoRoomService } from '../../../services/video-room.service';

@Component({
  selector: 'app-video-room',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './video-room.component.html',

  styleUrls: ['./video-room.component.css'],
})
export class VideoRoomComponent implements OnInit {
  bookingId = 0;

  room: any = null;

  loading = true;

  creating = false;

  constructor(
    private route: ActivatedRoute,

    private roomService: VideoRoomService,
  ) {}

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadRoom();
  }

  loadRoom() {
    this.loading = true;

    this.roomService.join('PrivateLesson', this.bookingId).subscribe({
      next: (res) => {
        this.room = res;

        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  createRoom() {
    this.creating = true;

    this.roomService.create('PrivateLesson', this.bookingId).subscribe({
      next: (res) => {
        this.room = res;

        this.creating = false;

        this.openRoomAfterCreation();
      },

      error: (err) => {
        console.error(err);

        this.creating = false;

        alert(err.error?.message || 'Failed to create room');
      },
    });
  }

  openRoomAfterCreation() {
    const url = this.getRoomUrl();

    if (!url) {
      alert('Room created, but link is unavailable. Please refresh this page.');
      return;
    }

    window.open(url, '_blank');
  }

  getRoomUrl(): string | null {
    if (this.room?.joinUrl) {
      return this.room.joinUrl;
    }

    if (!this.room?.roomCode) {
      return null;
    }

    if (this.room.roomCode.startsWith('http')) {
      return this.room.roomCode;
    }

    const token = this.room.token ? `?token=${encodeURIComponent(this.room.token)}` : '';
    return `https://meeting.example.com/${this.room.roomCode}${token}`;
  }

  joinRoom() {
    const url = this.getRoomUrl();
    if (!url) {
      alert('Room is not available yet. Please create it first.');
      return;
    }

    window.open(url, '_blank');
  }

  back() {
    history.back();
  }
}
