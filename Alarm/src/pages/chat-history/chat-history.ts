import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { ChatMessage, UserInfo } from "../../providers/chat-service";
import { AlarmService } from '../../providers/alarm-service';
import { StorageService } from '../../providers/storage-service';
import { UrlProvider } from '../../providers/url-provider';
import { Media, MediaObject, MEDIA_STATUS } from "@ionic-native/media";
import { FileService } from '../../providers/file-service';
import { FileOpener } from '@ionic-native/file-opener';

/**
 * Generated class for the ChatHistoryPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-chat-history',
  templateUrl: 'chat-history.html',
})
export class ChatHistoryPage {
  // 聊天历史记录是否为0条
  private hasMsgList = false;
  private eventId: string;
  private user: UserInfo = {
    imAccount: '',
    avatar: 'assets/imgs/personal-center.png'
  }
  private toUser: UserInfo = {
    imAccount: '',
    avatar: 'assets/imgs/js.jpg'
  }
  private CHAT_TYPE = {
    "CHAT_TEXT": 3,
    "CHAT_VOICE": 4,
    "CHAT_MPG4": 7,
    "CHAT_IMAGE": 8,
    "CHAT_FILE": 10
  }
  private imgUrl: string;
  msgList: ChatMessage[] = [];
  // 用来缓存本地文件路径，打开文件时，是先下载，所以不想多次点开多次下载
  // 但是下一次重新进来的时候就没有了吧。
  private files = {};
  // 录音消息的四个图片
  private voiceImgUrl = {
    leftPlaying: 'assets/imgs/yy.gif',
    leftStoped: 'assets/imgs/yy.png',
    rightPlaying: 'assets/imgs/yy2.gif',
    rightStoped: 'assets/imgs/yy2.png',
  }
  constructor(public navCtrl: NavController,
    private alarmService: AlarmService,
    private storageService: StorageService,
    private fileService: FileService,
    private media: Media,
    private fileOpener: FileOpener,
    private loadingCtrl: LoadingController,
    private mainUrl: UrlProvider,
    public navParams: NavParams) {
    this.imgUrl = `${this.mainUrl.getMainUrl()}/v1/files/showImage/`;
    this.eventId = navParams.get("eventId");
    // this.toUser = {
    //   imAccount: navParams.get("toUserImAccount")
    // }
    // this.user = {
    //   imAccount: navParams.get("userImAccount")
    // }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ChatHistoryPage');
  }

  ionViewDidEnter() {
    this.storageService.get("userImAccount")
      .then(res => this.user.imAccount = res)
    //get message list
    this.getMsg()
  }

  //获取聊天记录
  getMsg() {
    let loading = this.loadingCtrl.create({
      spinner: 'Dots',
      content: '正在加载...',
      duration: 1000
    })
    loading.present();
    this.alarmService.findById(this.eventId)
      .then(res => {
        loading.dismiss();
        if (res.data.alarmChatRecords.length === 0) {
          this.hasMsgList = true;
        }
        if (res.responseCode === '_200' && res.data.alarmChatRecords.length > 0) {
          this.toUser.imAccount = res.data.alarmReceiver.imAccount.account;
          this.user.imAccount = res.data.alarmReporter.imaccount.account;
          let msgArray = res.data.alarmChatRecords;
          msgArray.forEach((item, index) => {
            let message: ChatMessage = {
              messageId: item.id,//Date.now().toString(),
              userImAccount: item.sender.account,
              userName: item.sender.account,
              userAvatar: "this.user.avatar",
              toUserImAccount: item.receiver.account,
              time: item.createDate,
              message: item.content,
              status: 'success',
              type: this.CHAT_TYPE[item.alarmChatType],
              src: ""
            }
            // console.log(message);
            this.pushNewMsg(message);
          })
        }
      })
      .catch(err => alert(JSON.stringify(err)))
  }

  pushNewMsg(msg: ChatMessage) {
    const userImAccount = this.user.imAccount,
      toUserImAccount = this.toUser.imAccount;
    switch (msg.type) {
      // case 4: msg.message = this.mainUrl.getDownloadUrl(msg.message);
      case 3: msg.message = decodeURI(msg.message);
    }
    msg.src = 'Stoped';
    // if (msg.type === 3) {
    //   msg.message = decodeURI(msg.message);
    // }
    // Verify user relationships
    if (msg.userImAccount === userImAccount && msg.toUserImAccount === toUserImAccount) {
      msg.userAvatar = this.user.avatar;
      this.msgList.push(msg);
    } else if (msg.toUserImAccount === userImAccount && msg.userImAccount === toUserImAccount) {
      msg.userAvatar = this.toUser.avatar;
      this.msgList.push(msg);
    }
  }

  //通过ID查找对呀的msg的index
  getMsgIndexById(id: string) {
    return this.msgList.findIndex(e => e.messageId === id)
  }

  playAudio(path: string, id: string) {
    //网络上的 path
    // if (path[0] === '/') {
    //     this.fileService.download(path)
    //         .then(res => {
    //             let index = this.getMsgIndexById(id);
    //             this.msgList[index].message = res;
    //             const file: MediaObject = this.media.create(res);
    //             file.play();
    //         })
    // } else {
    let loading = this.loadingCtrl.create({
      content: '正在下载...',
      spinner: 'Dots',
      // duration: 1000
    })
    // 播放录音
    // 如果files里面存的有的话就直接取
    if (this.files[id]) {
      const index = this.getMsgIndexById(id);
      // 开始播放时路径改为playing（左右之分在html那边区分）
      this.msgList[index].src = 'Playing';
      // this.openFileByPath(, relativePath)
      const file: MediaObject = this.media.create(this.files[id]);
      file.onStatusUpdate.subscribe(status => {
        if (status == MEDIA_STATUS.STOPPED) {
          // alert(status);
          // setTimeout(() => this.msgList[index].src = 'Stoped', 1)
          // 播放完成之后图片的路径改为Stoped（左右之分在html那边区分）
          this.msgList[index].src = 'Stoped';
          // 之所以要setFocus()，因为上面改变了数据，视图没有更新
          // 获取焦点的一系列操作会引发视图的重绘和回流（下下策）
          // this.messageInput.setFocus();
          // this.cdRef.markForCheck();
        }
      });
      file.play();
      // 没有的话，就下载并存起来
    } else {
      loading.present()
      this.fileService.download(path)
        .then(res => {
          let index = this.getMsgIndexById(id);
          // 开始播放时路径改为playing（左右之分在html那边区分）
          this.msgList[index].src = 'Playing';
          this.msgList[index].message = res;
          this.files[id] = res;
          let file: MediaObject = this.media.create(res.replace(/^file:\/\//, ''));
          loading.dismiss();
          file.onStatusUpdate.subscribe(status => {
            if (status == MEDIA_STATUS.STOPPED) {
              // alert(status);
              // setTimeout(() => this.msgList[index].src = 'Stoped', 1)
              // 播放完成之后图片的路径改为Stoped（左右之分在html那边区分）
              this.msgList[index].src = 'Stoped';
              // this.messageInput.setFocus();
              // this.cdRef.markForCheck();
            }
          });
          file.play();
        })
    }

    // }
  }

  // 打开文件，先下载（或者拿缓存），再调用FileOpener
  openFile(relativePath: string, messageId: string) {
    let loading = this.loadingCtrl.create({
      content: '正在下载...',
      spinner: 'Dots',
      duration: 1000
    })
    if (this.files[messageId]) {
      this.openFileByPath(this.files[messageId], relativePath)
    } else {
      loading.present();
      this.fileService.download(relativePath)
        .then(res => {
          this.files[messageId] = res;
          setTimeout(() => loading.dismiss(), 500)
          this.openFileByPath(res, res)
        })
        .catch(err => {
          loading.dismiss();
          alert('下载错误' + JSON.stringify(err))
        })
    }
  }

  // 调用FileOpener
  openFileByPath(nativeURL: string, fileName: string) {
    this.fileOpener.open(nativeURL, this.getFileMimeType(this.getFileType(fileName)))
      .then(() => {
        console.log('打开成功');
      })
      .catch(() => {
        console.log('打开失败');
      });
  }


  getFileType(fileName: string): string {
    return fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length).toLowerCase();
  }

  getFileMimeType(fileType: string): string {
    let mimeType: string = '';

    switch (fileType) {
      case 'txt':
        mimeType = 'text/plain';
        break;
      case 'docx':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'doc':
        mimeType = 'application/msword';
        break;
      case 'pptx':
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      case 'ppt':
        mimeType = 'application/vnd.ms-powerpoint';
        break;
      case 'xlsx':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'xls':
        mimeType = 'application/vnd.ms-excel';
        break;
      case 'zip':
        mimeType = 'application/x-zip-compressed';
        break;
      case 'rar':
        mimeType = 'application/octet-stream';
        break;
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'jpg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      default:
        mimeType = 'application/' + fileType;
        break;
    }
    return mimeType;
  }
}
