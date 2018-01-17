import { NativeStorage } from "@ionic-native/native-storage"
import { Injectable } from "@angular/core";

/*
  Generated class for the StorageServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/

@Injectable()
export class StorageService {
    constructor(private nativeStorage: NativeStorage) {

    }

    set(key: string, value: string) {
        this.nativeStorage.setItem(key, value)
            .then(
                () => {},
                error => console.error("Error storing item", error)
            )
    }

    get(key: string): Promise<any> {
        return this.nativeStorage.getItem(key)
            .then(
                data => data,
                error => console.error(error)
            )
    }

    remove(key: string) {
        this.nativeStorage.remove(key);
    }

    clear() {
        return this.nativeStorage.clear()
            .then(res => res)
            .catch(error => alert(JSON.stringify(error)))
    }
}