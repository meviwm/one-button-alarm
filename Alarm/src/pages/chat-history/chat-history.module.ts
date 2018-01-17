import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChatHistoryPage } from './chat-history';

@NgModule({
  declarations: [
    ChatHistoryPage,
  ],
  imports: [
    IonicPageModule.forChild(ChatHistoryPage),
  ],
})
export class ChatHistoryPageModule {}
