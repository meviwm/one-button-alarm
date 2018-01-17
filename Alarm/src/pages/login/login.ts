import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Content, App } from 'ionic-angular';
import { IndexPage } from '../index/index';

import { StorageService } from "../../providers/storage-service";
import { LoginService } from "../../providers/login-service";
import { AlarmService } from '../../providers/alarm-service';
import { ChatPage } from '../chat/chat';

/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  private phoneNumber: string;
  private code: string;
  private getCodeDisable: boolean = false;
  private waitText: string = "获取验证码";

  @ViewChild(Content) content: Content;
  constructor(public navCtrl: NavController,
    private appCtrl: App,
    private storageService: StorageService,
    private loginService: LoginService,
    private alarmService: AlarmService,
    public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  onFocus() {
    setTimeout(() => this.content.scrollToBottom(), 400)
  }

  login() {
    this.loginService.login(this.phoneNumber, this.code)
      .then(res => {
        if(res.responseCode === "_200") {
          // alert(JSON.stringify(res));
          this.storageService.set('id', res.data.id);
          // 报警人的ID
          this.storageService.set('reporterId', res.data.alarmReporter.id);
          //userImAccount => userIa 用户的 IM账号
          this.storageService.set('userImAccount', res.data.alarmReporter.imaccount.account);
          //userImId => userIi
          this.storageService.set('userImId', res.data.alarmReporter.imaccount.id);
          // 学校的经度
          this.storageService.set('alarmLongitude', res.data.school.longitude);
          // 学校的纬度
          this.storageService.set('alarmLatitude', res.data.school.latitude);
          // 学校的名字（报警点）
          this.storageService.set('alarmSite', res.data.school.schoolName);
          // 学校的电话（报警点电话）
          this.storageService.set('alarmPhone', res.data.school.schoolPhone);
          // 报警人的名字
          this.storageService.set('alarmPeople', res.data.officerName);
          // 报警人的ID
          this.storageService.set('alarmPeopleId', res.data.id);
          // 报警人的头像
          this.storageService.set('alarmPeopleHead', res.data.officerHead);
          // 报警人的电话
          this.storageService.set('alarmPeoplePhone', res.data.officerPhone);
          // 报警人的年龄
          this.storageService.set('alarmPeopleAge', res.data.age);
          // 报警人的性别
          this.storageService.set('alarmPeopleGender', res.data.gender);

          this.alarmService.find(res.data.alarmReporter.id)
            .then(res => {
              if (res.responseCode === '_200' && res.data.length) {
                this.appCtrl.getRootNav().setRoot(ChatPage);
                //查找到之后 把事件id和接受者的账号存起来
                this.storageService.set("eventId", res.data[0].id);
                this.storageService.set("toUserImAccount", res.data[0].alarmReceiver.imAccount.account);
              } else {
                this.appCtrl.getRootNav().setRoot(IndexPage);
              }
            })
        } else {
          alert(res.errorMsg);
        }
      })
      .catch(err => alert(JSON.stringify(err)))
  }

  getCode() {
    if(this.phoneNumber!=undefined&&this.phoneNumber!='') {
      if(/^1[3|4|5|8][0-9]\d{4,8}$/.test(this.phoneNumber)) {
        this.getCodeDisable = true;
        let waitTime = 60;
        let setIntervalIndex = setInterval(() => {
          this.waitText = `${--waitTime} s`;
        }, 1000)

        setTimeout(() => {
          clearInterval(setIntervalIndex);
          this.waitText = "获取验证码";
          this.getCodeDisable = false;
        }, 59999)
        this.loginService.getCode(this.phoneNumber)
          .then(res => {
            if (res.responseCode === '_200') {
              //成功
            } else {
              clearInterval(setIntervalIndex);
              this.waitText = "获取验证码";
              this.getCodeDisable = false;
              alert(res.errorMsg)
            }
          })
          .catch(err => {
            clearInterval(setIntervalIndex);
            this.waitText = "获取验证码";
            this.getCodeDisable = false;
              alert(JSON.stringify(err))
            }
          )
      }else{
        alert("请输入正确的手机号码！")
      }
    }else{
      alert("请输入你的手机号码！")
    }
  }

}
