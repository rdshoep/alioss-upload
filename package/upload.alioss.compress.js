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
import imageCompress from '../src/imageCompress';

class Uploader{
  constructor(opts){
    let uploadClient = new AliossFileUpload();
    this.fileUploader = new FileUpload(uploadClient, Object.assign({}, opts, {
      middlewares: [compressMiddleware]
    }));
  }

  upload(file, name, opt){
    return this.fileUploader.upload(file, name, opt);
  }
}

function compressMiddleware(uploadTask){
  let data = uploadTask.data
    , option = uploadTask.option;

  if (data instanceof File && option.imageCompress) {
    return imageCompress(data, Object.assign({
      output: 'buffer'
    }, option.imageCompress))
      .then(function (buffer) {
        option.type = 'buffer';
        
        uploadTask.data = buffer;
        uploadTask.option = option;
      }).catch(function (err) {
        console.warn('image compress error', err);
        //throw new Error(err);
        //if compress error, upload file by default mode
      });
  }
}

/* globals window */
window.Uploader = window.FileUpload = Uploader;