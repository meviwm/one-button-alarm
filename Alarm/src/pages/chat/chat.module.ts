import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChatPage } from './chat';

import {RelativeTime} from "../../pipes/relative-time";
import { PipesModule } from "../../pipes/pipes.module";
import { ComponentsModule } from "../../components/components.module";


@NgModule({
  declarations: [
    ChatPage,
    RelativeTime
  ],
  exports: [
    ChatPage
  ],
  imports: [
    // ComponentsModule,
    PipesModule,
    IonicPageModule.forChild(ChatPage),
  ],
  providers:[
  ]
})
export class ChatPageModule {}
