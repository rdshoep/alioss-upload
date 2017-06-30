/*
 * @description
 *   Please write the UploadTask script's description
 * @author rdshoep(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(2017/6/29)
 */
import Promise from '../shims/promise';

class UploadTask {
  constructor(uploader, client, data, option) {
    this.uploader = uploader;
    this.client = client;
    this.data = data;
    this.option = option;
  }

  start() {
    let task = this
      , middlewares = this.uploader.options.middlewares || [];

    let promisify = middlewares
      .reduce((promisify, middleware) => promisify.then(() => middleware(task)), Promise.resolve(this))

    return promisify.then(() => task.upload());
  }

  upload() {
    let name = this.option.name;
    return this.client.upload(this.data, name, this.option);
  }
}

export default UploadTask;