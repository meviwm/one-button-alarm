import { Http, Headers, URLSearchParams } from "@angular/http";
import { Injectable } from '@angular/core';
import { UrlProvider } from "./url-provider";

/*
  Generated class for the ModifyInfoProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
export class Officer {
  /**
   * 学校安全员名称（真实姓名）
   */
  id: String;
  /**
   * 学校安全员名称（真实姓名）
   */
  officerName: String;
  /**
   * 头像
   */
  officerHead: string;
  /*
  * 性别.0保密，1男 2女 
  */
  gender: number;
  /**
   *  年龄 
   */
  age: number;
  /**
   * 安全员主要联系电话
   */
  // officerPhone: string;
}

@Injectable()
export class ModifyInfoService {

  constructor(private http: Http,
    private mainUrl: UrlProvider) {
    console.log('Hello ModifyInfoProvider Provider');
  }

  modify(obj: Officer):Promise<any> {
    let url = `${this.mainUrl.getAlarmUrl()}/v1/schoolOfficer`;
    let body = obj
    return this.http.patch(url, body).toPromise()
      .then(res => res.json())
      .catch(err => err.json())
  }

}
