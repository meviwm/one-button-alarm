import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, App, AlertController, ToastController, LoadingController } from 'ionic-angular';
import { StorageService } from '../../providers/storage-service';
import { LoginPage } from '../login/login';
// import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { FileService } from '../../providers/file-service';
import { ModifyInfoService, Officer } from '../../providers/modify-info';
import { UrlProvider } from '../../providers/url-provider';

/**
 * Generated class for the PersonalCenterPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-personal-center',
  templateUrl: 'personal-center.html',
})
export class PersonalCenterPage {

  private historyList = [];
  private GENDER = {
    '0': '保密',
    '1': '男',
    '2': '女'
  }
  private alarmPeople = "";
  private showImgUrl = "";
  private b_edit = false;
  private officer: Officer = {
    officerHead: '',
    officerName: '',
    gender: 1,
    age: 1,
    id: ""
  }
  private officerCopy: Officer = {
    officerHead: '',
    officerName: '',
    gender: 1,
    age: 1,
    id: ""
  }
  constructor(public navCtrl: NavController,
    private storageService: StorageService,
    private appCtrl: App,
    private camera: Camera,
    private fileService: FileService,
    private modifyInfoService: ModifyInfoService,
    private mainUrl: UrlProvider,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    public navParams: NavParams) {
      this.showImgUrl = `${this.mainUrl.getMainUrl()}/v1/files/showAudio/`;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PersonalCenterPage');
  }

  ionViewDidEnter() {
    this.storageService.get("alarmPeople")
      .then(res => {this.officer.officerName = res; this.officerCopy.officerName = res})
    this.storageService.get("alarmPeopleId")
      .then(res => {this.officer.id = res; this.officerCopy.id = res})
    this.storageService.get("alarmPeopleHead")
      .then(res => {this.officer.officerHead = res; this.officerCopy.officerHead = res})
    this.storageService.get("alarmPeopleAge")
      .then(res => {this.officer.age = res; this.officerCopy.age = res})
    this.storageService.get("alarmPeopleGender")
      .then(res => {this.officer.gender = res; this.officerCopy.gender = res})
  }

  //退出登录
  loginOut() {
    this.alertCtrl.create({
      title: '警告',
      message: '您确定要退出登录?',
      buttons: [
        {
          text: '取消',
          role: 'cancel',
          handler: () => {
            console.log("Cancel")
          }
        },
        {
          text: '确认',
          handler: () => {
            this.storageService.clear()
              .then(() => {
                this.appCtrl.getRootNav().setRoot(LoginPage);
              })
          }
        }
      ]
    }).present();
  }

  //拍照并上传
  getPicatu() {
    if(!this.b_edit) {
      return false;
    }
        // this.modifyInfoService.modify(this.officer);
    let options: CameraOptions = {
      quality: 60,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.CAMERA
    }
    let loading = this.loadingCtrl.create({
      spinner: 'hide',
      content: '正在上传...'
    })

    this.camera.getPicture(options)
      .then(res => {
        loading.present();
        return this.fileService.upload(res, "images", "img.jpg")
      })
      .then(res => {
        // alert(JSON.stringify(res));
        let data = JSON.parse(res.response.substr(1, res.response.length - 2));
        let relativePath = data.relativePath;
        // alert(JSON.stringify(res));
        // this.toastCtrl.create({
        //   message: "success ::"+relativePath,
        //   duration: 2000,
        //   position: 'top'
        // }).present();
        this.officerCopy.officerHead = relativePath;
        loading.dismiss()
      })
      // .catch(err => alert(JSON.stringify(err)))
  }

  // 修改用户名
  editName() {
    if(!this.b_edit) {
      return false;
    }
    this.alertCtrl.create({
      title: '用户名',
      inputs: [
        {
          name: 'name',
          placeholder: String(this.officerCopy.officerName)
        }
      ],
      buttons: [
        {
          text: '取消',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: '确定',
          handler: data => {
            this.officerCopy.officerName = data.name;

            console.log(this.officerCopy)
          }
        }
      ]
    }).present()
  }
  // 修改性别
  editGender() {
    if(!this.b_edit) {
      return false;
    }
    this.alertCtrl.create({
      title: '性别',
      inputs: [
        {
          type: 'radio',
          label: '男',
          value: '1',
          // checked: true
        },
        {
          type: 'radio',
          label: '女',
          value: '2',
          // checked: true
        },
        {
          type: 'radio',
          label: '保密',
          value: '0',
          // checked: true
        },
      ],
      buttons: [
        {
          text: '取消',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: '确定',
          handler: data => {
            this.officerCopy.gender = data;

            console.log(this.officerCopy)
          }
        }
      ]
    }).present()
  }
  // 修改年龄
  editAge() {
    if(!this.b_edit) {
      return false;
    }
    this.alertCtrl.create({
      title: '年龄',
      inputs: [
        {
          name: 'age',
          placeholder: String(this.officerCopy.age)
        }
      ],
      buttons: [
        {
          text: '取消',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: '确定',
          handler: data => {
            this.officerCopy.age = data.age;
            // console.log(this.officerCopy)
          }
        }
      ]
    }).present()
  }

  //保存资料。提交上传
  save() {
    this.canEdit()

    this.modifyInfoService.modify(this.officerCopy)
    .then(res => {
      if(res.responseCode === '_200') {
        this.storageService.set('alarmPeopleHead', res.data.officerHead);
        this.storageService.set('alarmPeople', res.data.officerName);
        this.storageService.set('alarmPeopleAge', res.data.age);
        this.storageService.set('alarmPeopleGender', res.data.gender);
        this.officer = JSON.parse(JSON.stringify(this.officerCopy));
        this.toastCtrl.create({
          message: '修改成功',
          duration: 2000,
          position: 'top'
        }).present()
      } else {
        this.toastCtrl.create({
          message: res.errorMsg,
          duration: 2000,
          position: 'middle'
        }).present()
      }
    })
  }

  //是否能编辑资料
  canEdit() {
    this.b_edit = !this.b_edit;
  }
}
