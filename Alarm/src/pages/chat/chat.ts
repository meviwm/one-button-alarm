import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavParams, Content, TextInput, Events, AlertController, ToastController, App ,ActionSheetController} from 'ionic-angular';
import {ChatMessage, UserInfo} from "../../providers/chat-service";
import {MediaCapture, MediaFile, CaptureError, CaptureVideoOptions} from '@ionic-native/media-capture';
import {VideoEditor} from '@ionic-native/video-editor';
import {Media, MediaObject, MEDIA_STATUS} from "@ionic-native/media";
import {Camera, CameraOptions} from '@ionic-native/camera';

import {AlarmService} from "../../providers/alarm-service";
import {IndexPage} from '../index/index';
import {StorageService} from '../../providers/storage-service';
import {FileService} from '../../providers/file-service';
import {UrlProvider} from '../../providers/url-provider';
import {FileOpener} from '@ionic-native/file-opener';
import {LoadingController} from 'ionic-angular/components/loading/loading-controller';

declare var AudioRecorderAPI;
/**
 * Generated class for the ChatPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html'
})
export class ChatPage {
  @ViewChild(Content) content: Content;
  // 输入框
  @ViewChild('chat_input') messageInput: TextInput;
  // 消息列表
  msgList: ChatMessage[] = [];
  // 自己的信息
  user: UserInfo = {
    imAccount: "",
    avatar: 'assets/imgs/personal-center.png'
  };
  // 对方的信息
  toUser: UserInfo = {
    imAccount: "",
    avatar: 'assets/imgs/js.jpg'
  };
  // 输入框的值
  editorMsg = '';
  // 是否显示emoji的选择
  showEmojiPicker = false;
  // 是否能取消警报，控制显示遮罩层（结束和取消报警的）
  private canCancelAlarm = false;

  // 用来缓存本地文件路径，打开文件时，是先下载，所以不想多次点开多次下载
  // 但是下一次重新进来的时候就没有了吧。
  private files = {};
  // 是否能录音
  private canRecorder: boolean;
  // 图片前面那一截，（http://........../showImage）
  private imgUrl;
  // webSocket
  private ws: WebSocket;
  private nowMs = 100;
  //最大重连时间间隔 /s
  private reconnectMaxTimeS = 1;
  // webSocket地址
  private addr;
  // 消息的messageId
  private msgId: string;
  // 报警事件Id
  private eventId: string;
  // 获取到的消息类型
  private CHAT_TYPE = {
    "CHAT_TEXT": 3,
    "CHAT_VOICE": 4,
    "CHAT_MPG4": 7,
    "CHAT_IMAGE": 8,
    "CHAT_FILE": 10
  }
  // 录音消息的四个图片
  private voiceImgUrl = {
    leftPlaying: 'assets/imgs/yy.gif',
    leftStoped: 'assets/imgs/yy.png',
    rightPlaying: 'assets/imgs/yy2.gif',
    rightStoped: 'assets/imgs/yy2.png',
  }
  // private userImAccount: string;
  // private toUserImAccount: string;

  constructor(public navParams: NavParams,
              private appCtrl: App,
              private mediaCapture: MediaCapture,
              private videoEditor: VideoEditor,
              private media: Media,
              private camera: Camera,
              private alarmService: AlarmService,
              private fileService: FileService,
              private fileOpener: FileOpener,
              private mainUrl: UrlProvider,
              private storageService: StorageService,
              private toastCtrl: ToastController,
              private loadingCtrl: LoadingController,
              private alertCtrl: AlertController,
              public actionSheetCtrl: ActionSheetController) {
  }

  ionViewWillLeave() {
    // unsubscribe
  }

  // ionic生命周期 视图加载完成
  ionViewDidEnter() {
    //get message list
    this.imgUrl = `${this.mainUrl.getMainUrl()}/v1/files/showImage/`;
    // webStock 地址
    this.addr = `${this.mainUrl.getWsUrl()}`;


    // 从storage里面查找eventId
    this.storageService.get("eventId")
      .then(res => {
        this.eventId = res;
        // 查找到之后 通过id查询详情。（主要是聊天记录的恢复）
        this.alarmService.findById(res)
          .then(res => {
            if (res.responseCode === '_200' && res.data.alarmChatRecords.length > 0) {
              let msgArray = res.data.alarmChatRecords;
              msgArray.forEach((item, index) => {
                // 构造一个ChatMessage的类型， 然后push到聊天记录数组里面
                let message: ChatMessage = {
                  messageId: item.id,
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
      })
    // 从storage里面去取用户的im账号，存起来
    this.storageService.get("userImAccount")
      .then(res => this.user.imAccount = res)
    // 从storage里面去取对方的im账号，存起来
    this.storageService.get("toUserImAccount")
      .then(res => this.toUser.imAccount = res)

    this.connect();
    // 定时关闭websocket
    setInterval(() => {
      this.ws.close();
    }, 60000)
  }

  onFocus() {
    // input onFocus事件
    this.showEmojiPicker = false;
    // 关闭emoji选择
    this.content.resize();
    // 滚动到底部
    this.scrollToBottom();
  }

  switchEmojiPicker() {
    // 切换是否选择emoji的状态
    this.showEmojiPicker = !this.showEmojiPicker;
    if (!this.showEmojiPicker) {
      this.messageInput.setFocus();
    }
    this.content.resize();
    this.scrollToBottom();
  }

  // only support send arraybuffer or string

  /**
   * @name sendMsg
   * 发送消息
   */
  sendMsg(mgs: string, type: number = 3, traget: string = this.toUser.imAccount, send: string = this.user.imAccount, msgId: string = this.msgId) {
    // if (!this.editorMsg.trim()) return;

    // Mock message
    mgs = mgs || this.editorMsg;
    // pushNewMsg用到的数据
    let newMsg: ChatMessage = {
      messageId: Date.now().toString(),
      userImAccount: this.user.imAccount,
      userName: this.user.name,
      userAvatar: this.user.avatar,
      toUserImAccount: this.toUser.imAccount,
      time: Date.now(),
      message: mgs,
      status: 'success',
      type: type,
      src: ""
    };

    this.editorMsg = '';
    // 发送消息之后，该输入就输入，该选择emoji就选择emoji
    if (!this.showEmojiPicker) {
      this.messageInput.setFocus();
    }

    let MSG = {
      "mgs": {
        content: mgs,
        alarmId: this.eventId
      },
      "messageType": type,
      "targetAccount": traget,
      "sendAccount": send,
      "messageId": msgId
    };
    if (type == 3 && mgs === '')
      return false;

    // console.log(MSG);
    if (this.ws && this.ws.send && this.ws.readyState === this.ws.OPEN) {
      try {
        if (type === 3) {
          // 文本消息encode编码
          MSG.mgs.content = this.encodeUnicode(MSG.mgs.content)
        }
        this.ws.send(JSON.stringify(MSG));
        if (type == 3) {
          this.pushNewMsg(newMsg);
        }
      } catch (e) {

      }
    }
  }

  //编码成Unicode字符串
  encodeUnicode(str) {
    // var res = [];
    // for (var i = 0; i < str.length; i++) {
    //     res[i] = ("00" + str.charCodeAt(i).toString(16)).slice(-4);
    // }
    // return "\\u" + res.join("\\u");
    return encodeURI(str);
  }

  //解码 Unicode => 中文或者emoji
  decodeUnicode(str) {
    // str = str.replace(/\\/g, "%");
    // str = decodeURI(str)
    return decodeURI(str);
  }

  /**
   * @name pushNewMsg
   * @param msg
   * 往消息列表里面推
   */
  pushNewMsg(msg: ChatMessage) {
    const userImAccount = this.user.imAccount,
      toUserImAccount = this.toUser.imAccount;
    // if(msg.type === 3) {
    //     msg.message = this.decodeUnicode(msg.message);
    // }
    msg.src = 'Stoped';
    switch (msg.type) {
      // case 4: msg.message = this.mainUrl.getDownloadUrl(msg.message);
      // 往消息列表推送消息之前，文本消息解码
      case 3:
        msg.message = decodeURI(msg.message);
    }
    // Verify user relationships
    // 修改当前消息的头像
    if (msg.userImAccount === userImAccount && msg.toUserImAccount === toUserImAccount) {
      msg.userAvatar = this.user.avatar;
      this.msgList.push(msg);
    } else if (msg.toUserImAccount === userImAccount && msg.userImAccount === toUserImAccount) {
      msg.userAvatar = this.toUser.avatar;
      this.msgList.push(msg);
    }
    this.scrollToBottom();
  }

  //通过ID查找对呀的msg的index
  getMsgIndexById(id: string) {
    return this.msgList.findIndex(e => e.messageId === id)
  }

  //滑动到底部
  scrollToBottom() {
    setTimeout(() => {
      if (this.content.scrollToBottom) {
        this.content.scrollToBottom();
      }
    }, 400)
  }

  // 开始录音
  audio() {
    let that = this;
    AudioRecorderAPI.record(msg => {
      that.canRecorder = false;
      // complete
      // alert('ok: ' + msg);
      this.alertCtrl.create({
        title: '录音中。。。',
        message: '点击结束录音',
        buttons: [
          {
            text: '结束',
            role: 'cancel',
            handler: () => {
              this.stopAudio();
            }
          }
        ]
      }).present();
    }, function (msg) {
      // failed
      alert('ko: ' + msg);
    }, 30); // record 30 seconds
  }

  // 停止录音
  stopAudio() {
    let that = this;
    const id = Date.now().toString();
    AudioRecorderAPI.stop(msg => {
      that.canRecorder = true;
      let newMsg: ChatMessage = {
        messageId: id,
        userImAccount: this.user.imAccount,
        userName: this.user.name,
        userAvatar: this.user.avatar,
        toUserImAccount: this.toUser.imAccount,
        time: Date.now(),
        message: '[语音]',
        status: 'pending',
        type: 4,
        src: ""
      };
      // 停止录音时就往消息列表里面推一条消息，状态为pending
      this.pushNewMsg(newMsg);
      // success
      // alert("ok" + msg);
      // 上传录音 并且发送webStock消息
      this.fileService.upload("file://" + msg, "audio", "audio.m4a")
        .then(res => {
          // alert(JSON.stringify(res));
          let data = JSON.parse(res.response.substr(1, res.response.length - 2));
          let relativePath = data.relativePath;
          this.sendMsg(relativePath, 4);
          let index = this.getMsgIndexById(id);
          console.log(index);
          // 上传成功之后把这一条消息的状态更改为success
          this.msgList[index].status = "success";
          // message改为获取到的路径,播放时要用
          this.msgList[index].message = relativePath;
        })
    }, function (msg) {
      // failed
      alert('ko: ' + msg);
    });
  }

  // 照相
  // 逻辑和上面的录音是一样的。
  photo() {
    let options: CameraOptions = {
      quality: 60,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.CAMERA
    }
    const id = Date.now().toString();

    this.camera.getPicture(options)
      .then(res => {
        // alert(res);
        let newMsg: ChatMessage = {
          messageId: id,
          userImAccount: this.user.imAccount,
          userName: this.user.name,
          userAvatar: this.user.avatar,
          toUserImAccount: this.toUser.imAccount,
          time: Date.now(),
          message: '[正在上传]',
          status: 'pending',
          type: 8,
          src: ""
        };
        this.pushNewMsg(newMsg);
        this.fileService.upload(res, "images", "img.jpg")
          .then(res => {
            // alert(JSON.stringify(res));
            let data = JSON.parse(res.response.substr(1, res.response.length - 2));
            let relativePath = data.relativePath;
            this.sendMsg(relativePath, 8);
            let index = this.getMsgIndexById(id);
            // console.log(index);
            this.msgList[index].status = "success";
            this.msgList[index].message = relativePath;
          })
          .catch(err => alert(JSON.stringify(err)))
      })
    // .catch(err => alert(JSON.stringify(err)))
  }

  // 视频
  // 逻辑和上面的上传录音差不多
  video() {
    let options: CaptureVideoOptions = {
      // limit: 1,
      duration: 9,
      // quality: 1
    };
    const id = Date.now().toString();
    this.mediaCapture.captureVideo(options)
      .then((data: MediaFile[]) => {
          let newMsg: ChatMessage = {
            messageId: id,
            userImAccount: this.user.imAccount,
            userName: this.user.name,
            userAvatar: this.user.avatar,
            toUserImAccount: this.toUser.imAccount,
            time: Date.now(),
            message: '[视频]',
            status: 'pending',
            type: 7,
            src: ""
          };
          this.pushNewMsg(newMsg);
          // 压缩视频
          this.videoEditor.transcodeVideo({
            fileUri: data[0].fullPath,
            outputFileName: 'output.mp4',
            outputFileType: this.videoEditor.OutputFileType.MPEG4,
            saveToLibrary: true,
            optimizeForNetworkUse: this.videoEditor.OptimizeForNetworkUse.YES,
            maintainAspectRatio: true,
            width: 960,
            height: 960,
            videoBitrate: 1000000, // 1 megabit
            audioChannels: 2,
            audioSampleRate: 44100,
            audioBitrate: 128000, // 128 kilobits
            progress: function (info) {
              console.log('进度：' + info);
            }
          })
            .then((fileUri: string) => {
              this.fileService.upload(fileUri, "video", "video.mp4")
                .then(res => {
                  // alert("上传视频回调：\n"+JSON.stringify(res))
                  let data = JSON.parse(res.response.substr(1, res.response.length - 2));
                  let relativePath = data.relativePath;
                  this.sendMsg(relativePath, 7)
                  let index = this.getMsgIndexById(id);
                  console.log(index);
                  this.msgList[index].status = "success";
                  this.msgList[index].message = relativePath;
                })
                .catch((error: any) => alert('视频上传错误' + JSON.stringify(error)));
            })
            .catch((error: any) => alert('视频压缩错误，请重新拍摄上传！错误信息：' + JSON.stringify(error)));
        },
        // (data: MediaFile[]) => alert(data[0].fullPath),
        // (err: CaptureError) => alert(JSON.stringify(err))
      )
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
      console.log('=========++++++++++++===========')
      console.log(file);
      file.onStatusUpdate.subscribe(status => {
        if (status == MEDIA_STATUS.STOPPED) {
          // alert(status);
          // setTimeout(() => this.msgList[index].src = 'Stoped', 1)
          // 播放完成之后图片的路径改为Stoped（左右之分在html那边区分）
          this.msgList[index].src = 'Stoped';
          // 之所以要setFocus()，因为上面改变了数据，视图没有更新
          // 获取焦点的一系列操作会引发视图的重绘和回流（下下策）
          this.messageInput.setFocus();
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
          console.log("<<<<<<<<<<<<>>>>>>>>>>")
          console.log(res);
          console.log(res.replace(/^file:\/\//, ''));
          let file: MediaObject = this.media.create(res.replace(/^file:\/\//, ''));
          loading.dismiss();
          console.log('mememe:====' + JSON.stringify(file));

          file.onStatusUpdate.subscribe(status => {
            console.log('34903290823908598')
            if (status == MEDIA_STATUS.STOPPED) {
              console.log('000000999999888888')
              // alert(status);
              // setTimeout(() => this.msgList[index].src = 'Stoped', 1)
              // 播放完成之后图片的路径改为Stoped（左右之分在html那边区分）
              this.msgList[index].src = 'Stoped';
              this.messageInput.setFocus();
              // this.cdRef.markForCheck();
            }
          });

          console.log('9808098990809---=====')
          file.onSuccess.subscribe(() => console.log('Action is successful'));

          file.onError.subscribe(error => console.log('Error!', JSON.stringify(error)));


          file.play();


        })
    }

    // }
  }

  // 改变能不能取消报警的状态
  // this.canCancelAlarm = false;
  notCanCancelAlarm() {
    //this.canCancelAlarm = !this.canCancelAlarm;
    let actionSheet = this.actionSheetCtrl.create({
      title:'一键报警',
      cssClass:'one_button_alarm',
      buttons:[
        {
          text:'取消报警',
          role:'destructive',
          handler:()=>{
            console.log('取消报警');
            this.cancelAlarm();
          }
        },
        {
          text:'结束报警',
          handler:()=>{
            console.log('结束报警');
            this.endAlarm();
          }
        },
        {
          text:'取消',
          role:'cancel',
          handler:()=>{
            console.log('取消');
          }
        }
      ]
    });
    actionSheet.present();

  }

  // 打开文件，先下载（或者拿缓存），再调用FileOpener
  openFile(relativePath: string, messageId: string) {
    let loading = this.loadingCtrl.create({
      content: '正在下载...',
      spinner: 'Dots',
      // duration: 1000
    })
    if (this.files[messageId]) {
      this.openFileByPath(this.files[messageId], relativePath)
    } else {
      loading.present();
      this.fileService.download(relativePath)
        .then(res => {
          this.files[messageId] = res;
          this.openFileByPath(res, res);
          loading.dismiss();
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

  // 取消报警
  cancelAlarm() {
  // cancelAlarm(el) {
    // el.stopPropagation();
    console.log("Cancel Alarm");
    let alertC = this.alertCtrl.create({
      title: '警告',
      message: '您确定要取消此次报警?',
      buttons: [
        {
          text: '取消',
          role: 'cancel',
          handler: () => {
            console.log("Cancel")
          }
        },
        {
          text: '确定',
          handler: () => {
            this.alarmService.cancel()
              .then(res => {
                if (res.responseCode === '_200') {
                  // this.toastCtrl.create({
                  //     message: '已取消此此次警报',
                  //     duration: 2000,
                  //     position: 'top'
                  // }).present();
                  this.appCtrl.getRootNav().setRoot(IndexPage);
                  // this.storageService.remove("eventId");
                } else {
                  this.toastCtrl.create({
                    message: res.errorMsg,
                    duration: 2000,
                    position: 'top'
                  }).present();
                  // alert()
                }
              })
              .catch(err => alert(JSON.stringify(err)))
          }
        }
      ]
    });
    alertC.present();
  }

  // 结束报警
  endAlarm() {
  // endAlarm(el) {
  //   el.stopPropagation();
    console.log("End Alarm");
    let alertC = this.alertCtrl.create({
      title: '警告',
      message: '您确定要结束此次报警?',
      buttons: [
        {
          text: '取消',
          role: 'cancel',
          handler: () => {
            console.log("Cancel")
          }
        },
        {
          text: '确定',
          handler: () => {
            this.alarmService.end()
              .then(res => {
                if (res.responseCode === '_200') {
                  // this.toastCtrl.create({
                  //     message: '已取结束此次警报',
                  //     duration: 2000,
                  //     position: 'top'
                  // }).present();
                  this.appCtrl.getRootNav().setRoot(IndexPage);
                  // this.storageService.remove("eventId");
                } else {
                  this.toastCtrl.create({
                    message: res.errorMsg,
                    duration: 2000,
                    position: 'top'
                  }).present();
                }
              })
              .catch(err => alert(JSON.stringify(err)))
          }
        }
      ]
    });
    alertC.present();
  }

  //webstock接收到消息
  wsmessage(buffer: string) {
    let msg = JSON.parse(buffer);
    console.log(msg);
    this.msgId = msg.messageId;
    if (msg.messageType === 3 || msg.messageType === 4 || msg.messageType === 8 || msg.messageType === 10) {
      // alert(msg.messageType);
      if (msg.messageType === 3) {
        // 接收到文本消息的时候解码
        msg.mgs.content = this.decodeUnicode(msg.mgs.content);
      }
      this.pushNewMsg({
        messageId: msg.messageId,
        userImAccount: msg.sendAccount,
        userName: this.toUser.name,
        userAvatar: this.toUser.imAccount,
        toUserImAccount: msg.targetAccount,
        time: new Date().getDate(),
        message: msg.mgs.content,
        status: "success",
        type: msg.messageType,
        src: msg.mgs
      })
    }
    if (msg.returnType === "MSGTYPE_SUCCESS") {
      this.editorMsg = "";
    }
    if (msg.messageType === 2) {
      if (msg.mgs.alarmStatus === 2) {
        // alert("警报已解除");
        this.toastCtrl.create({
          message: '警报已解除',
          duration: 2000,
          position: 'middle'
        }).present();
        setTimeout(() => {
          this.appCtrl.getRootNav().setRoot(IndexPage);
          this.storageService.remove("eventId");
        }, 1000)
      } else if (msg.mgs.alarmStatus === 3) {
        // alert("警报已取消");
        this.toastCtrl.create({
          message: '警报已取消',
          duration: 2000,
          position: 'middle'
        }).present();
        setTimeout(() => {
          this.appCtrl.getRootNav().setRoot(IndexPage);
          this.storageService.remove("eventId");
        }, 1000)
      }
    }
  }

  wsopen() {
    // console.log(this.user);
    // if (this.user.imAccount){
    //     // this.sendMsg("", 1, this.user.imAccount);
    // }
    this.sendMsg("LOGIN", 1, this.user.imAccount);
    // alert("重连")
  }

  wsclose() {
    // this.connect()
  }

  wserror() {
  }

  ngOnInit() {

  }


  private connect() {
    this.ws = new WebSocket(this.addr);
    this.ws.binaryType = "arraybuffer";

    this.ws.onmessage = (event) => {
      this.wsmessage(event.data);
    };

    this.ws.onopen = () => {
      // console.log("[umdwebsocket] connect Success");
      this.nowMs = 100;
      this.wsopen();
    };

    this.ws.onclose = () => {
      // console.log("[umdwebsocket] reconnect", this.addr, "in", this.nowMs, "ms");
      this.wsclose();

      // setTimeout(() => {
      this.connect();
      // }, this.nowMs);
      this.nowMs = this.nowMs + 100;

      if (this.nowMs > this.reconnectMaxTimeS * 1000) {
        this.nowMs = this.reconnectMaxTimeS * 1000;
      }
    };

    this.ws.onerror = () => {
      // console.log("[umdwebsocket] connect Error");
      this.wserror();

      // setTimeout(() => {
      this.connect();
      // }, this.nowMs);
      this.nowMs = this.nowMs + 100;

      if (this.nowMs > this.reconnectMaxTimeS * 1000) {
        this.nowMs = this.reconnectMaxTimeS * 1000;
      }
    };
  }

}
