import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HighlightDirective } from './directive/highlight.directive';
import { MonthFilterPipe } from './month-filter.pipe';
import { InputRestrictDirective } from './directive/input-restrict.directive';
import { TrackerComponent } from './tracker/tracker.component';
import { HeaderComponent } from './header/header.component';
import { VisualizationComponent } from './visualization/visualization.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { SavingModalComponent } from './saving-modal/saving-modal.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './login/login.component';
import { SplitComponent } from './split/split.component';
import { BotComponent } from './bot/bot.component';
import { GroupDetailsComponent } from './group-details/group-details.component';
import { SettingsComponent } from './settings/settings.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent, HighlightDirective, MonthFilterPipe, InputRestrictDirective, TrackerComponent, HeaderComponent, VisualizationComponent, SavingModalComponent, LoginComponent, SplitComponent, BotComponent, GroupDetailsComponent, SettingsComponent],
  imports: [HttpClientModule, NgbModule,NgSelectModule,BrowserAnimationsModule,MatToolbarModule,MatIconModule, MatDialogModule,BrowserModule, AppRoutingModule, ReactiveFormsModule, FormsModule, NoopAnimationsModule, ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: environment.production,
  // Register the ServiceWorker as soon as the application is stable
  // or after 30 seconds (whichever comes first).
  registrationStrategy: 'registerWhenStable:30000'
})],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
