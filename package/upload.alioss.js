/*
 * @description
 *   Please write the upload script's description
 * @author Zhang(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(12/5/2016)
 */
'use strict';

import FileUpload from '../src/FileUpload';
import AliossFileUpload from '../src/AliossFileUpload';

class Uploader{
  constructor(opts){
    let uploadClient = new AliossFileUpload();
    this.fileUploader = new FileUpload(uploadClient, opts);
  }

  upload(file, name, opt){
    return this.fileUploader.upload(file, name, opt);
  }
}

/* globals window */
window.Uploader = window.FileUpload = Uploader;