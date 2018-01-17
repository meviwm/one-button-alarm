import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PersonalCenterPage } from './personal-center';

@NgModule({
  declarations: [
    PersonalCenterPage
  ],
  imports: [
    IonicPageModule.forChild(PersonalCenterPage),
  ],
})
export class PersonalCenterPageModule {}
