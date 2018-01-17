import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HttpModule } from "@angular/http";

import { MyApp } from './app.component';
import { IndexPage } from '../pages/index/index';
import { LoginPage } from "../pages/login/login";
import { ChatPage } from '../pages/chat/chat';
import { LoginService } from '../providers/login-service';
import { UrlProvider } from '../providers/url-provider';
import { EmojiProvider } from '../providers/emoji';
import { EmojiPickerComponent } from "../components/emoji-picker/emoji-picker";
import { ComponentsModule } from "../components/components.module";
import { RelativeTime } from "../pipes/relative-time";
import { BackButtonService } from "../providers/backbutton-service";

import { NativeStorage } from "@ionic-native/native-storage";
import { FileOpener } from '@ionic-native/file-opener';
import { FileTransfer } from "@ionic-native/file-transfer";
import { File } from "@ionic-native/file";
import { MediaCapture } from '@ionic-native/media-capture';
import { VideoEditor } from '@ionic-native/video-editor';
import { Media } from "@ionic-native/media";
import { Camera } from '@ionic-native/camera';
import { AlarmService } from '../providers/alarm-service';
import { StorageService } from '../providers/storage-service';
import { FileService } from '../providers/file-service';
import { ModifyInfoService } from '../providers/modify-info';
import { Keyboard } from "@ionic-native/keyboard";

@NgModule({
  declarations: [
    MyApp,
    IndexPage,
    LoginPage,
    ChatPage,
    EmojiPickerComponent,
    RelativeTime
  ],
  imports: [
    BrowserModule,
    HttpModule,
    // ComponentsModule,
    IonicModule.forRoot(MyApp,{
      backButtonText:'返回'
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    IndexPage,
    LoginPage,
    ChatPage
  ],
  providers: [
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    LoginService,
    UrlProvider,
    BackButtonService,
    EmojiProvider,
    MediaCapture,
    VideoEditor,
    Media,
    Camera,
    AlarmService,
    StorageService,
    FileService,
    ModifyInfoService,
    NativeStorage,
    File,
    FileTransfer,
    FileOpener,
    Keyboard
  ]
})
export class AppModule {}
