import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LoginPage } from "../pages/login/login";

import { IndexPage } from '../pages/index/index';
import { ChatPage } from '../pages/chat/chat';

import { BackButtonService } from "../providers/backbutton-service";
import { StorageService } from "../providers/storage-service";
import { AlarmService } from "../providers/alarm-service";
import { Keyboard } from "@ionic-native/keyboard";

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = LoginPage;

  constructor(platform: Platform,
    private backButtonService: BackButtonService,
    private storageService: StorageService,
    private alarmService: AlarmService,
    private keyboard: Keyboard,
    splashScreen: SplashScreen) {
    platform.ready().then(() => {
      splashScreen.hide();
      // this.keyboard.disableScroll(false);
      this.backButtonService.registerLoginBackButtonAction(null);

      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      // 从Storage里面去找有没有存的报警人ID，有的话就跳转到index页面
      // 并且继续查找 有没有报警，有点话存储事件ID，跳转到聊天页面
      this.storageService.get("reporterId")
        .then(res => {
          if (res) {
            this.rootPage = IndexPage;
            return this.alarmService.find(res)
          } else {
            return false;
          }
        })
        .then(res => {
          if (res.responseCode === '_200' && res.data.length) {
            this.rootPage = ChatPage;
            this.storageService.set("eventId", res.data[0].id);
          }
        })
        .catch(err => alert(JSON.stringify(err)))
    });
  }
}

