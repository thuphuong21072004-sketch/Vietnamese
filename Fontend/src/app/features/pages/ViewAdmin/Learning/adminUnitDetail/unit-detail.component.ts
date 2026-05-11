import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LearningService } from '../../../../services/learning.service';
import { UnitDTO } from '../../../../models/unit.model';

import { QuizComponent } from '../quiz/test.component';

@Component({
  selector: 'app-unit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QuizComponent],
  templateUrl: './unit-detail.component.html',
  styleUrls: ['./unit-detail.component.css'],
})
export class UnitDetailComponent implements OnInit {
  unitId: number = 0;
  courseId: number = 0;
  videoFullUrl: string = '';
  tempVideoUrl: string = '';
  isDragging = false;
  showQuiz = false;

  unit: UnitDTO = {
    unitId: 0,
    courseId: 0,
    unitName: '',
    videoUrl: '',
    duration: 0,
    objective: '',
    createdBy: '',
    createdDate: new Date(),
    description: '',
    orderIndex: 0,
    isActive: true,
    isDelete: false,
  };

  constructor(
    private route: ActivatedRoute,
    private learningService: LearningService,
  ) {}

  ngOnInit(): void {
    this.unitId = Number(this.route.snapshot.queryParamMap.get('unitId') || 0);
    this.courseId = Number(
      this.route.snapshot.queryParamMap.get('courseId') || 0,
    );
    this.unit.courseId = this.courseId;

    if (this.unitId > 0) {
      this.learningService.getUnitById(this.unitId).subscribe((res) => {
        this.unit = res;
        if (res.videoUrl && res.videoUrl.trim() !== '') {
          this.videoFullUrl = `http://localhost:5108/videos/${res.videoUrl}`;
        }
        this.tempVideoUrl = res.videoUrl;
      });
    }
  }

  save() {
    this.unit.courseId = this.courseId;

    this.learningService.saveUnit(this.unit).subscribe({
      next: () => {
        alert('Unit saved successfully');

        this.learningService.getUnits(this.courseId).subscribe((list) => {
          if (!list || list.length === 0) return;

          const latest = list[list.length - 1];

          this.unitId = latest.unitId;
          this.unit.unitId = latest.unitId;

          this.showQuiz = false;
          setTimeout(() => {
            this.showQuiz = true;
          });
        });
      },
      error: (err) => console.log(err),
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) this.uploadFile(file);
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    this.videoFullUrl = URL.createObjectURL(file);
    this.learningService.uploadMedia(formData).subscribe((res: any) => {
      this.tempVideoUrl = res.fileName;
      this.unit.videoUrl = res.fileName;
      this.videoFullUrl = `http://localhost:5108/videos/${res.fileName}`;
    });
  }

  onVideoLoaded(event: any) {
    this.unit.duration = Math.floor(event.target.duration);
  }
}
