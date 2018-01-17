import { Injectable } from "@angular/core";
import { FileTransfer, FileUploadOptions, FileTransferObject } from "@ionic-native/file-transfer";
import { File } from "@ionic-native/file";

import { UrlProvider } from "./url-provider";

/*
  Generated class for the FileServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/

@Injectable()
export class FileService {

    constructor(private transfer: FileTransfer,
        private mainUrl: UrlProvider,
        private file: File) { }

    upload(filePath: string, subsystem: string, fileName: string): Promise<any> {
      console.log('--------------')
      console.log(filePath)
      console.log(subsystem)
      console.log(fileName)
        let apiEndpoint = this.mainUrl.getUploadUrl(subsystem);
      console.log(apiEndpoint)
        let options: FileUploadOptions = {
            fileKey: "file",
            fileName: fileName
        }

        const fileTransfer: FileTransferObject = this.transfer.create();

        return fileTransfer.upload(filePath, apiEndpoint, options)
            .then(res => res)
            .catch(err => alert(JSON.stringify(err)))
    }

    download(url: string): Promise<any> {
      console.log('000000000000000====================');
      console.log(url);
        const fileTransfer: FileTransferObject = this.transfer.create();
      console.log(fileTransfer);
      console.log('11111111111111111');

      console.log(this.file.tempDirectory);


        let fileNmae = url.split("/").pop();
        if(fileNmae.split('.')[1]!='m4a'){
          fileNmae = fileNmae.split('.')[0]+'.m4a'
        }
        console.log(fileNmae);
        return fileTransfer.download(this.mainUrl.getDownloadUrl(url), this.file.tempDirectory + `${fileNmae}`)
            .then(
                (entry) => entry.toURL(),
              (error)=>error
                // (error) => {/* handle error*/}
            );
    }

}
