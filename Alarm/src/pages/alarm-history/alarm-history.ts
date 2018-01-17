import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AlarmService } from '../../providers/alarm-service';
import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';

declare var AMap: any;
/**
 * Generated class for the AlarmHistoryPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-alarm-history',
  templateUrl: 'alarm-history.html',
})

export class AlarmHistoryPage implements OnInit {

  private historyList = [];
  private geocoder;
  private page: number = 0;

  constructor(public navCtrl: NavController,
    private alarmService: AlarmService,
    public navParams: NavParams) {
      this.getAlarmHistory();
  }

  ionViewDidLoad() { }

  ngOnInit() {
  }

  findIndexById(id) {
    return this.historyList.findIndex(e => e.id === id)
  }

  getAlarmHistory(infiniteScroll?) {

    this.alarmService.getAlarmHistory(this.page)
    .then(res => {
      console.log(res);
      if (res.responseCode === '_200') {
        let dataContent = res.data.content;
        let geocoder = AMap.service('AMap.Geocoder', () => {//回调函数
          //实例化Geocoder
          geocoder = new AMap.Geocoder({
            // city: "010"//城市，默认：“全国”
          });
          //TODO: 使用geocoder 对象完成相关功能
          dataContent.forEach((item, index) => {
            item.site = '';
            // 先将数组push进去，然后在执行获取位置的操作，再根据index去更改
            this.historyList.push(item);
            geocoder.getAddress([item.alarmLongitude, item.alarmLatitude], (status, result) => {
              if (status === 'complete' && result.info === 'OK') {
                //获得了有效的地址信息:
                //即，result.regeocode.formattedAddress
                let data = result.regeocode.addressComponent;
                console.log(data.city + data.district);
                this.historyList[this.findIndexById(item.id)].site = `${data.city}${data.district}`
              } else {
                //获取地址失败
              }
            });
          })
          if(this.page === res.data.totalPages) {
            // 当前页码等于了总页数，禁用上拉刷新
            if(infiniteScroll){
              infiniteScroll.enable(false);
            }
          } else {
            this.page += 1;
          }

          // this.historyList = this.historyList.concat(dataContent);
          if(infiniteScroll) {
            infiniteScroll.complete();
          }
        })

      } else {
        alert(JSON.stringify(res))
      }
    })
    .catch(err => alert(JSON.stringify(err)))
  }

}
