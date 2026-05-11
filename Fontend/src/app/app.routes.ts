import { Routes } from '@angular/router';
import { SearchComponent } from './features/pages/ViewUser/search/search.component';
import { LoginComponent } from './features/pages/login/login.component';
import { HomeComponent } from './features/pages/home/home.component';
import { RegisterComponent } from './features/pages/ViewUser/register/register.component';
import { ProfileComponent } from './features/pages/profile/profile.component';
import { AdminUserComponent } from './features/pages/ViewAdmin/ManageUsers/admin-user.component';
import { AdminVideoComponent } from './features/pages/ViewAdmin/ManageVideos/admin-video.component';
import { LevelComponent } from './features/pages/ViewAdmin/Learning/adminLevel/level.component';
import { CourseComponent } from './features/pages/ViewAdmin/Learning/adminCourse/course.component';
import { UnitComponent } from './features/pages/ViewAdmin/Learning/adminUnit/unit.component';
import { UnitDetailComponent} from './features/pages/ViewAdmin/Learning/adminUnitDetail/unit-detail.component';
import { QuizComponent } from './features/pages/ViewAdmin/Learning/quiz/test.component';
import { PlacementComponent } from './features/pages/ViewAdmin/ManageTests/placement.component';

import { MyProgressComponent } from './features/pages/ViewUser/Learning/unit/unit.component';
import { QuizLearnComponent } from './features/pages/ViewUser/Learning/quiz/quiz.component';
import { PlacementUserComponent } from './features/pages/ViewUser/practice/placement.component'
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },

  { path: 'admin/users', component: AdminUserComponent },
  { path: 'admin/videos', component: AdminVideoComponent },
  { path: 'admin/levels', component: LevelComponent },
  { path: 'admin/courses', component: CourseComponent },
  { path: 'admin/units', component: UnitComponent },
  { path: 'admin/unitDetail', component: UnitDetailComponent },
  { path: 'admin/tests', component: QuizComponent },
  { path: 'admin/placements', component: PlacementComponent },

  { path: 'user/units', component: MyProgressComponent },
  { path: 'user/search', component: SearchComponent },
  { path: 'user/register', component: RegisterComponent },
  { path: 'user/quiz', component: QuizLearnComponent },
  { path: 'user/tests', component:PlacementUserComponent},
];
