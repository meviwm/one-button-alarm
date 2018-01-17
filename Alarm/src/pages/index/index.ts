import { Component, OnInit } from '@angular/core';
import { NavController, App } from 'ionic-angular';
import { ChatPage } from '../chat/chat';

import { AlarmService, AlarmEventEntity } from "../../providers/alarm-service";
import { StorageService } from "../../providers/storage-service";
import { ToastController } from 'ionic-angular/components/toast/toast-controller';

declare var LocationPlugin;

@Component({
  selector: 'page-index',
  templateUrl: 'index.html'
})
export class IndexPage implements OnInit {

  private reporterId: string;
  private lat: string;
  private long: string;
  private alarmLongitude: string;
  private alarmLatitude: string;
  private alarmSite: string;
  private alarmPhone: string;
  private alarmPeople: string;
  private alarmPeoplePhone: string;
  private alarmEventEntity: AlarmEventEntity = {
    alarmReporter: {
        id: ""
      },
    latitude: "30.21547",
    longitude: "102.0112",
    alarmLatitude: "",
    alarmLongitude: "",
    alarmSite: "",
    alarmPhone: "",
    alarmPeople: "",
    alarmPeoplePhone: "",
  };
  private wait: boolean = false;
  constructor(public navCtrl: NavController,
    private alarmService: AlarmService,
    private storageService: StorageService,
    private toastCtrl: ToastController,
    private appCtrl: App) {
      this.storageService.get("reporterId")
        .then(res => this.alarmEventEntity.alarmReporter.id = res)
      this.storageService.get("alarmLongitude")
        .then(res => this.alarmEventEntity.alarmLongitude = res)
      this.storageService.get("alarmLatitude")
        .then(res => this.alarmEventEntity.alarmLatitude = res)
      this.storageService.get("alarmSite")
        .then(res => this.alarmEventEntity.alarmSite = res)
      this.storageService.get("alarmPhone")
        .then(res => this.alarmEventEntity.alarmPhone = res)
      this.storageService.get("alarmPeople")
        .then(res => this.alarmEventEntity.alarmPeople = res)
      this.storageService.get("alarmPeoplePhone")
        .then(res => this.alarmEventEntity.alarmPeoplePhone = res)
  }

  createAlarm() {
    if (this.wait) {
      return false;
    }
    this.wait = true;
    // alert(this.lat + this.long);
    // this.toastCtrl.create({
    //   message: this.alarmEventEntity.latitude,
    //   duration: 2000,
    //   position: 'top'
    // }).present()
    this.alarmService.create(this.alarmEventEntity)
    // this.alarmService.create("1", "30.21547", "102.0112")
      .then(res => {
        console.log(res)
        if (res.responseCode === '_200' && res.data) {
          this.storageService.set("eventId", res.data.id);
          this.storageService.set("toUserImAccount", res.data.alarmReceiver.imAccount.account);
          this.appCtrl.getRootNav().setRoot(ChatPage)
        } else {
          this.toastCtrl.create({
            message: res.errorMsg,
            duration: 2000,
            position: 'middle'
          }).present();
          this.wait = false;
        }
      })
      .catch(err => {alert(JSON.stringify(err)); this.wait = false})
    // this.appCtrl.getRootNav().setRoot(ChatPage);
  }

  ngOnInit() {
    this.getLocation();
  }

  getLocation() {
    LocationPlugin.getLocation(data => {
      this.alarmEventEntity.latitude = String(data.latitude);
      this.alarmEventEntity.longitude = String(data.longitude);
    }, msg => {
      alert(JSON.stringify(msg));
    })
  }
}
