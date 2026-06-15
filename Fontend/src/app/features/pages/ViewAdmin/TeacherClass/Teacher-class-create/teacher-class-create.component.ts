import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  TeacherClassDto,
  ClassSessionDto} from '../../../../models/teacher-class.model';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TeacherClassService} from '../../../../services/teacher-class.service';
import { BaseService } from '../../../../services/base.service';
import { VIETNAM_DESTINATIONS } from '../../../../models/vietnam-destinations';
import { TravelService } from '../../../../services/travel.service';
@Component({
  selector: 'app-teacher-class-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-class-create.component.html',
  styleUrls: ['./teacher-class-create.component.css'],
})
export class TeacherClassCreateComponent implements OnInit {
  ngOnInit(): void {
    this.loadMaxPrice();

    this.route.queryParams.subscribe((params: Record<string, string>) => {
      if (params['province']) {
        this.teacherClass.mainTopic = 'Travel';
        this.selectedProvince = params['province'];
        this.teacherClass.province = params['province'];
      }
      if (params['specificLocation']) {
        this.teacherClass.specificLocation = params['specificLocation'];
      }
      if (params['matchRequestId']) {
        this.travelMatchRequestId = params['matchRequestId'];
      }
      if (params['tripStartDate']) {
        this.tripStartDate = params['tripStartDate'];
      }
      if (params['tripId']) {
        this.tripId = params['tripId'];
      }
    });
  }
  loading = false;
  maxPrice = 0;

  weekDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  readonly destinationGroups = VIETNAM_DESTINATIONS;
  selectedProvince = '';
  private travelMatchRequestId: string | null = null;
  private tripStartDate: string | null = null;
  private tripId: string | null = null;

  get availableSpots(): string[] {
    return this.destinationGroups.find(g => g.province === this.selectedProvince)?.spots ?? [];
  }

  onProvinceChange(): void {
    this.teacherClass.province = this.selectedProvince;
    this.teacherClass.specificLocation = '';
  }
  mainTopics = [
    'Daily Communication',
    'Work',
    'Study',
    'Travel',
    'Exam Preparation',
    'Vietnamese Culture',
  ];

  subTopics: { [key: string]: string[] } = {
    'Daily Communication': [
      'Beginner Vietnamese',
      'Basic Communication',
      'Intermediate Communication',
      'Advanced Communication',
      'Living in Vietnam',
      'Daily Life in Vietnam',
      'Practical Vietnamese',
      'Vietnamese for Foreigners',
      'Social Communication',
      'Community Communication',
    ],

    Work: [
      'Office Vietnamese',
      'Business Vietnamese',
      'Vietnamese for IT Professionals',
      'Vietnamese for Engineers',
      'Vietnamese for Doctors',
      'Vietnamese for Nurses',
      'Vietnamese for Teachers',
      'Vietnamese for Office Workers',
      'Vietnamese for Hotel Staff',
      'Vietnamese for Restaurant Staff',
      'Vietnamese for Sales',
      'Vietnamese for Customer Service',
      'Professional Vietnamese',
      'Management Communication',
      'Startup Communication',
    ],

    Study: [
      'Vietnamese for Children',
      'Vietnamese for Teenagers',
      'Vietnamese for Students',
      'Vietnamese for International Students',
      'Academic Vietnamese',
      'University Vietnamese',
      'Research Vietnamese',
      'Reading Skills',
      'Listening Skills',
      'Speaking Skills',
      'Writing Skills',
      'Vietnamese Grammar',
      'Vietnamese Vocabulary',
      'Advanced Vietnamese',
      'University Preparation',
    ],

    Travel: [
      'Hanoi',
      'Ha Long Bay',
      'Sapa',
      'Ha Giang',
      'Ninh Binh',
      'Moc Chau',

      'Hue',
      'Da Nang',
      'Hoi An',
      'Phong Nha',
      'Quang Binh',

      'Nha Trang',
      'Da Lat',
      'Mui Ne',
      'Phan Thiet',

      'Ho Chi Minh City',
      'Can Tho',
      'Chau Doc',
      'An Giang',

      'Phu Quoc',
      'Con Dao',
    ],

    'Exam Preparation': [
      'A1 Preparation',
      'A2 Preparation',
      'B1 Preparation',
      'B2 Preparation',
      'C1 Preparation',
      'C2 Preparation',
      'Listening Practice',
      'Speaking Practice',
      'Reading Practice',
      'Writing Practice',
      'Comprehensive Review',
      'Test-taking Strategies',
    ],

    'Vietnamese Culture': [
      'Vietnamese Cuisine',
      'Vietnamese History',
      'Customs and Traditions',
      'Traditional Festivals',
      'Tet Holiday',
      'Communication Etiquette',
      'Vietnamese Family Culture',
      'Traditional Clothing',
      'Vietnamese Music',
      'Vietnamese Cinema',
      'Vietnamese Literature',
      'Vietnamese Lifestyle',
      'Northern Culture',
      'Central Culture',
      'Southern Culture',
    ],
  };

  teacherClass: TeacherClassDto = {
    classId: 0,

    teacherProfileId: 0,

    title: '',
    description: '',

    mainTopic: '',
    subTopic: '',

    price: 0,

    maxStudents: 10,

    currentStudents: 0,

    status: 1,

    totalSessions: 10,

    startDate: '',

    startTime: '19:00',

    endTime: '20:00',

    scheduleDays: [],

    sessions: [],
  };

  constructor(
    private teacherClassService: TeacherClassService,
    private baseService: BaseService,
    private router: Router,
    private route: ActivatedRoute,
    private travelService: TravelService,
  ) {}

  toggleDay(day: string, checked: boolean): void {
    if (checked) {
      const exists = this.teacherClass.scheduleDays.some(
        (x) => x.dayOfWeek === day,
      );

      if (!exists) {
        this.teacherClass.scheduleDays.push({
          id: 0,
          classId: 0,
          dayOfWeek: day,
        });
      }

      return;
    }

    this.teacherClass.scheduleDays = this.teacherClass.scheduleDays.filter(
      (x) => x.dayOfWeek !== day,
    );
  }

  private buildRequest(): TeacherClassDto {
    return {
      ...this.teacherClass,

      startTime:
        this.teacherClass.startTime.length === 5
          ? `${this.teacherClass.startTime}:00`
          : this.teacherClass.startTime,

      endTime:
        this.teacherClass.endTime.length === 5
          ? `${this.teacherClass.endTime}:00`
          : this.teacherClass.endTime,
    };
  }

  generateSchedule(): void {
    if (!this.teacherClass.startDate) {
      alert('Please select start date');

      return;
    }

    if (this.teacherClass.scheduleDays.length === 0) {
      alert('Please select at least one study day');

      return;
    }

    const request = this.buildRequest();

    console.log('REQUEST:', JSON.stringify(request, null, 2));

    this.loading = true;

    this.teacherClassService.generateSchedule(request).subscribe({
      next: (response: ClassSessionDto[]) => {
        console.log('SUCCESS:', response);

        this.teacherClass.sessions = response;
        this.loading = false;

        if (this.travelDeadlineError) {
          alert(this.travelDeadlineError);
        }
      },

      error: (err) => {
        this.loading = false;

        this.baseService.handleError(err, 'Generate schedule failed');
      },
    });
  }

  get travelDeadlineError(): string | null {
    if (!this.tripStartDate || this.teacherClass.sessions.length === 0) return null;
    const sorted = [...this.teacherClass.sessions].sort((a, b) =>
      a.studyDate.substring(0, 10).localeCompare(b.studyDate.substring(0, 10))
    );
    const lastDateStr = sorted[sorted.length - 1].studyDate.substring(0, 10);
    // Calculate deadline = tripStartDate - 3 days using UTC to avoid timezone issues
    const tripMs = Date.UTC(
      +this.tripStartDate.substring(0, 4),
      +this.tripStartDate.substring(5, 7) - 1,
      +this.tripStartDate.substring(8, 10)
    );
    const deadlineMs = tripMs - 3 * 86400000;
    const d = new Date(deadlineMs);
    const deadlineStr = d.getUTCFullYear() + '-'
      + String(d.getUTCMonth() + 1).padStart(2, '0') + '-'
      + String(d.getUTCDate()).padStart(2, '0');
    if (lastDateStr > deadlineStr) {
      const [y, m, day] = deadlineStr.split('-');
      return `Travel class: The last session must be at least 3 days before the departure date (before ${day}/${m}/${y}). Please adjust the class start date.`;
    }
    return null;
  }

  saveClass(): void {
    if (this.teacherClass.sessions.length === 0) {
      alert('Please generate schedule first');
      return;
    }

    if (this.travelDeadlineError) {
      return;
    }

    const request = this.buildRequest();

    this.loading = true;

    this.teacherClassService.createClass(request).subscribe({
      next: (response: any) => {
        this.loading = false;

        if (this.travelMatchRequestId) {
          this.travelService.linkClassToRequest(
            Number(this.travelMatchRequestId),
            response.classId
          ).subscribe();
        }

        if (this.tripId) {
          this.travelService.reserveTripInClass(
            Number(this.tripId),
            response.classId
          ).subscribe();
        }

        alert('Create class successfully');

        this.router.navigate(['/teacher/detail', response.classId]);
      },

      error: (err) => {
        this.loading = false;

        this.baseService.handleError(err, 'Create class failed');
      },
    });
  }
  loadMaxPrice(): void {
    if (
      !this.teacherClass.startTime ||
      !this.teacherClass.endTime ||
      this.teacherClass.maxStudents <= 0 ||
      this.teacherClass.totalSessions <= 0
    ) {
      return;
    }

    const request = this.buildRequest();

    this.teacherClassService.getMaxPrice(request).subscribe({
      next: (price) => {
        this.maxPrice = price;
      },

      error: (err) => {
        console.log(err);
      },
    });
  }
}