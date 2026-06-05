import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { TeacherClassDto } from '../../../../models/teacher-class.model';

import { ClassFilterDto } from '../../../../models/class-filter.model';

import { TeacherClassService } from '../../../../services/teacher-class.service';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router'
@Component({
  selector: 'app-class-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './class-list.component.html',
  styleUrls: ['./class-list.component.css'],
})
export class TeacherClassListComponent implements OnInit {
  loading = false;

  classes: TeacherClassDto[] = [];

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

  subTopics: {
    [key: string]: string[];
  } = {
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

  filter: ClassFilterDto = {
    mainTopic: '',

    subTopic: '',

    startDate: undefined,

    endDate: undefined,

    startTime: undefined,

    endTime: undefined,

    daysOfWeek: [],
  };

  constructor(private teacherClassService: TeacherClassService,
              private router: Router,
  ) {}

  ngOnInit(): void {
    this.searchClasses();
  }

  toggleDay(day: string, checked: boolean): void {
    if (checked) {
      if (!this.filter.daysOfWeek?.includes(day)) {
        this.filter.daysOfWeek?.push(day);
      }

      return;
    }

    this.filter.daysOfWeek = this.filter.daysOfWeek?.filter((x) => x !== day);
  }

  searchClasses(): void {
    const request = {
      ...this.filter,

      startTime: this.filter.startTime
        ? `${this.filter.startTime}:00`
        : undefined,

      endTime: this.filter.endTime ? `${this.filter.endTime}:00` : undefined,
    };

    this.loading = true;

    this.teacherClassService.searchMyClasses(request).subscribe({
      next: (response: TeacherClassDto[]) => {
        this.classes = response;

        this.loading = false;
      },

      error: (err) => {
        console.log('ERROR', err);

        console.log('BODY', err.error);

        console.log('REQUEST', request);

        this.loading = false;
      },
    });
  }

  clearFilter(): void {
    this.filter = {
      mainTopic: '',

      subTopic: '',

      minPrice: undefined,

      maxPrice: undefined,

      startDate: undefined,

      endDate: undefined,

      startTime: undefined,

      endTime: undefined,

      daysOfWeek: [],
    };

    this.searchClasses();
  }

  viewClass(classId: number): void {
  this.router.navigate([
    '/teacher/detail',
    classId
  ]);
}
}
