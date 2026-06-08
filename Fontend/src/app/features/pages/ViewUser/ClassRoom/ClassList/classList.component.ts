import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';

import { TeacherClassDto } from '../../../../models/teacher-class.model';

import { ClassFilterDto } from '../../../../models/class-filter.model';

import { TeacherClassService } from '../../../../services/teacher-class.service';
import { ClassEnrollmentDto } from '../../../../models/class-enrollment.model';

import { ClassEnrollmentService } from '../../../../services/class-enrollment.service';
import { ReviewService } from '../../../../services/review.service';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './classList.component.html',
  styleUrls: ['./classList.component.css'],
})
export class ClassListComponent implements OnInit {
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
    country: '',

    minRating: 0,

    mainTopic: '',

    subTopic: '',

    minPrice: 0,

    maxPrice: 100,

    startDate: undefined,

    endDate: undefined,

    startTime: undefined,

    endTime: undefined,

    daysOfWeek: [],
  };

  reviewStatusMap: Record<number, boolean> = {};

  constructor(
    private teacherClassService: TeacherClassService,
    private classEnrollmentService: ClassEnrollmentService,
    private reviewService: ReviewService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCountries();

    this.loadMyEnrollments();

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
    const request: ClassFilterDto = {
      ...this.filter,

      startTime: this.filter.startTime
        ? `${this.filter.startTime}:00`
        : undefined,

      endTime: this.filter.endTime ? `${this.filter.endTime}:00` : undefined,
    };

    this.loading = true;

    this.teacherClassService.searchClasses(request).subscribe({
      next: (response: TeacherClassDto[]) => {
        this.classes = response;

        this.loading = false;
      },

      error: (err) => {
        console.error(err);

        this.loading = false;
      },
    });
  }

  clearFilter(): void {
    this.filter = {
      country: '',
      minRating: 0,

      mainTopic: '',

      subTopic: '',

      minPrice: 0,

      maxPrice: 100,

      startDate: undefined,

      endDate: undefined,

      startTime: undefined,

      endTime: undefined,

      daysOfWeek: [],
    };

    this.searchClasses();
  }

  viewClass(classId: number): void {
    this.router.navigate(['/user/classdetail', classId]);
  }

  enroll(classId: number): void {
    this.classEnrollmentService.enroll(classId).subscribe({
      next: (res: any) => {
        this.router.navigate(['/payment', res.enrollmentId], {
          queryParams: {
            type: 'CLASS',
          },
        });
      },

      error: (err: any) => {
        alert(err.error.message);
      },
    });
  }
  countries: string[] = [];

  loadCountries(): void {
    this.teacherClassService.getCountries().subscribe((res) => {
      this.countries = res.map((x) => x.name.common).sort();

      const vietnamIndex = this.countries.indexOf('Vietnam');

      if (vietnamIndex >= 0) {
        this.countries.splice(vietnamIndex, 1);

        this.countries.unshift('Vietnam');
      }
    });
  }
  enrolledClasses: ClassEnrollmentDto[] = [];
  loadMyEnrollments(): void {
    this.classEnrollmentService.getMyClasses().subscribe({
      next: (res) => {
        this.enrolledClasses = res;
        this.checkReviewedClasses();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  checkReviewedClasses(): void {
    const initialMap: Record<number, boolean> = {};
    this.enrolledClasses
      .filter((e) => e.status === 3)
      .forEach((e) => { initialMap[e.classId] = false; });
    this.reviewStatusMap = initialMap;

    this.enrolledClasses
      .filter((e) => e.status === 3)
      .forEach((e) => {
        this.reviewService.getByRef('CLASS', e.classId).subscribe({
          next: (review: any) => {
            this.reviewStatusMap = {
              ...this.reviewStatusMap,
              [e.classId]: !!review,
            };
          },
          error: () => {
            // keep false
          },
        });
      });
  }

  canReview(classId: number): boolean {
    return (
      this.getStatus(classId) === 3 &&
      this.reviewStatusMap[classId] === false
    );
  }

  hasReviewed(classId: number): boolean {
    return (
      this.getStatus(classId) === 3 &&
      this.reviewStatusMap[classId] === true
    );
  }

  writeReview(classId: number): void {
    const enrollment = this.getEnrollment(classId);
    if (!enrollment) return;
    this.router.navigate(['/review', classId], {
      queryParams: { type: 'CLASS', enrollmentId: enrollment.enrollmentId },
    });
  }
 
  getEnrollmentId(classId: number): number | undefined {
    return this.enrolledClasses.find((x) => x.classId === classId)
      ?.enrollmentId;
  }
  cancel(enrollmentId: number): void {
    this.classEnrollmentService.cancel(enrollmentId).subscribe({
      next: () => {
        this.loadMyEnrollments();

        this.searchClasses();
      },
      error: (err) => {
        alert(err.error.message);
      },
    });
  }
  getEnrollment(classId: number): ClassEnrollmentDto | undefined {
    return this.enrolledClasses.find((x) => x.classId === classId);
  }
  getStatus(classId: number): number | null {
    const enrollment = this.getEnrollment(classId);

    return enrollment ? enrollment.status : null;
  }
}
