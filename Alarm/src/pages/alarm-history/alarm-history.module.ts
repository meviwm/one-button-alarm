import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AlarmHistoryPage } from './alarm-history';

@NgModule({
  declarations: [
    AlarmHistoryPage,
  ],
  imports: [
    IonicPageModule.forChild(AlarmHistoryPage),
  ],
})
export class AlarmHistoryPageModule {}
