import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  TeacherClassDto,
  ClassSessionDto
} from '../../../../models/teacher-class.model';

import {
  TeacherClassService
} from '../../../../services/teacher-class.service';
import { BaseService } from '../../../../services/base.service';
@Component({
  selector: 'app-teacher-class-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-class-create.component.html',
  styleUrls: ['./teacher-class-create.component.css'],
})
export class TeacherClassCreateComponent {
  ngOnInit(): void {
    this.loadMaxPrice();
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
      },

      error: (err) => {
        this.loading = false;

        this.baseService.handleError(err, 'Generate schedule failed');
      },
    });
  }

  saveClass(): void {
    if (this.teacherClass.sessions.length === 0) {
      alert('Please generate schedule first');
      return;
    }

    const request = this.buildRequest();

    this.loading = true;

    this.teacherClassService.createClass(request).subscribe({
      next: (response) => {
        console.log('CREATE SUCCESS:', response);

        this.loading = false;

        alert('Create class successfully');
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