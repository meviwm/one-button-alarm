import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/*
  Generated class for the MainUrlProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UrlProvider {

  private domain = "http://47.96.170.67";
  private wsUrl = "ws://47.96.170.67:1194";
  // private domain = "http://192.168.0.102";
  // private wsUrl = "ws://192.168.0.102:1194";
  // private domain = "http://114.55.54.96";
  // private wsUrl = "ws://114.55.54.96:1194";

  //平台 图片 
  getMainUrl() {
    return this.domain + ":5550";
  }

  //微信
  getAlarmUrl() {
    return this.domain + ":5660";
    // return this.domain + ":5551";
  }

  getUploadUrl(subsystem: string): string {
    return `${this.domain}:5550/v1/files/${subsystem}/fileUploads`;
  }

  getDownloadUrl(url: string): string {
    return `${this.domain}:5550/v1/files/showAudio/${url}`;
  }

  getWsUrl(): string {
    return `${this.wsUrl}`;
  }

}
