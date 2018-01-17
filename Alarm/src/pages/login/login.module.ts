import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { LoginPage } from './login';

@NgModule({
  declarations: [
    LoginPage,
  ],
  imports: [
    IonicPageModule.forChild(LoginPage),
    StatusBar
  ],
})
export class LoginPageModule {}
