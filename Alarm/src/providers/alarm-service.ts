import { Http, Headers, URLSearchParams } from "@angular/http";
import { Injectable } from "@angular/core";

import { UrlProvider } from "./url-provider";
import { StorageService } from "./storage-service";
import 'rxjs/add/operator/toPromise';

/*
  Generated class for the AlarmServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/

export class AlarmEventEntity {
    alarmReporter: {
        id: string
      };
    latitude: string;
    longitude: string;
    alarmLatitude: string;
    alarmLongitude: string;
    alarmSite: string;
    alarmPhone: string;
    alarmPeople: string;
    alarmPeoplePhone: string;
}

@Injectable()
export class AlarmService {
    private eventId: string;
    constructor(private http: Http,
        private mainUrl: UrlProvider,
        private storageService: StorageService) {
    }

    create(alarmEventEntity: AlarmEventEntity): Promise<any> {
        let createUrl = this.mainUrl.getMainUrl() + "/v1/alarmEvent/school/create";
        // let urlSearchParams = new URLSearchParams();
        // urlSearchParams.append('officer.id', account);
        // urlSearchParams.append('latitude', latitude);
        // urlSearchParams.append('longitude', longitude);
        
        let body = alarmEventEntity;
        // let body = urlSearchParams.toString();
        console.log(body);
        let headers = new Headers({'Content-Type': 'application/json'});

        return this.http.post(createUrl, body, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(err => err.json())
    }

    cancel(): Promise<any> {
        
        return this.storageService.get("eventId")
            .then(res => this.eventId = res)
            .then(() => {
                let cancelUrl = this.mainUrl.getMainUrl() + "/v1/alarmEvent/cancel/" + this.eventId;
                // alert("cancelUrl" + cancelUrl)
                return this.http.get(cancelUrl, "").toPromise()
            })
            .then(res => res.json())
            .catch(err => err.json())
    }

    end() {
        
        return this.storageService.get("eventId")
            .then(res => this.eventId = res)
            .then(() => {
                let cancelUrl = this.mainUrl.getMainUrl() + "/v1/alarmEvent/done/" + this.eventId;
                // alert("cancelUrl" + cancelUrl)
                return this.http.get(cancelUrl, "").toPromise()
            })
            .then(res => res.json())
            .catch(err => err.json())
    }

    find(reportId): Promise<any> {
        
        let findUrl = `${this.mainUrl.getAlarmUrl()}/v1/alarmEvent/findNotProcessedAlarm/${reportId}`;
        return this.http.get(findUrl).toPromise()
            .then(res => res.json())
            .catch(err => err.json())
    }

    findById(eventId): Promise<any> {
        let findUrl = `${this.mainUrl.getAlarmUrl()}/v1/alarmEvent/find/${eventId}`;

        return this.http.get(findUrl).toPromise()
            .then(res => res.json())
            .catch(err => err.json())
    }

    getAlarmHistory(page: number): Promise<any> {
        
        return this.storageService.get("reporterId")
            .then(res => {
                let getHistoryUrl = `${this.mainUrl.getAlarmUrl()}/v1/alarmEvent/findByConditions?alarmReporterId=${res}&page=${page}`
                return this.http.get(getHistoryUrl).toPromise()
                    .then(res => res.json())
                    .catch(err => err.json())
                    
            })
    }
}