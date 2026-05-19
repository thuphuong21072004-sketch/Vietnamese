import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

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

    private router: Router,

    private roomService: VideoRoomService,
  ) {}

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadRoom();
  }

  loadRoom() {
    this.loading = true;

    this.roomService.getByBookingId(this.bookingId).subscribe({
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

    this.roomService.create(this.bookingId).subscribe({
      next: (res) => {
        this.room = res;

        this.creating = false;

        alert('Room created successfully');
      },

      error: (err) => {
        console.error(err);

        this.creating = false;

        alert(err.error?.message || 'Failed to create room');
      },
    });
  }

  joinRoom() {
    if (!this.room?.roomCode) {
      return;
    }

    window.open(this.room.roomCode, '_blank');
  }

  back() {
    history.back();
  }
}
