import { Http, Headers, URLSearchParams } from "@angular/http";
import { Injectable } from "@angular/core";

import { UrlProvider } from "./url-provider"
import 'rxjs/add/operator/toPromise';

/*
  Generated class for the LoginProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/

@Injectable()
export class LoginService {
  constructor(private http: Http,
    private mainUrl: UrlProvider) {

  }

  login(phoneNumber: string, code: string): Promise<any> {
    let createUrl = this.mainUrl.getAlarmUrl() + "/v1/schoolOfficer/login";
    let urlSearchParams = new URLSearchParams;
    urlSearchParams.append('phone', phoneNumber);
    urlSearchParams.append('verificationCode', code);
    let body = urlSearchParams.toString();
    let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
    return this.http.post(createUrl, body, { headers: headers })
      .toPromise()
      .then(res => res.json())
      .catch(err => err.json())
  }

  getCode(phoneNumber: string): Promise<any> {
    let getCodeUrl = this.mainUrl.getAlarmUrl() + "/v1/schoolOfficer/getValidCode";
    let urlSearchParams = new URLSearchParams;
    urlSearchParams.append('phoneNumber', phoneNumber);
    let body = urlSearchParams.toString();
    let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
    // return this.http.post(getCodeUrl, `phoneNumber=${phoneNumber}`, { headers: headers })
    return this.http.post(getCodeUrl, body, { headers: headers })
      .toPromise()
      .then(res => res.json())
      .catch(err => err.json())
  }
}