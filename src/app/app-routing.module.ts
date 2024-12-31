import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrackerComponent } from './tracker/tracker.component';
import { VisualizationComponent } from './visualization/visualization.component';
import { LoginComponent } from './login/login.component';
import { SplitComponent } from './split/split.component';
import { GroupDetailsComponent } from './group-details/group-details.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {path: 'split', component: SplitComponent },
  { path: 'home', component: TrackerComponent },
  { path: 'add', component: TrackerComponent },
  { path: 'analytics', component: VisualizationComponent },
  { path: 'login', component: LoginComponent },
  { path: 'groups/:name', component: GroupDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
