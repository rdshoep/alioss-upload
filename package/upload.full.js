/*
 * @description
 *   Please write the upload.full.js script's description
 * @author Zhang(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(12/5/2016)
 */
'use strict';

import FileUpload from '../src/fileUpload';
import imageCompress from '../src/imageCompress';
import * as utils from '../src/utils';

FileUpload.prototype._upload = function(data, name, option){
    let _this = this;
    let error = utils.resolveFunctoin(option.error);

    if (data instanceof File && option.imageCompress) {
        return imageCompress(data, Object.assign({
            output: 'buffer'
        }, option.imageCompress))
            .then(function (buffer) {
                option.type = 'buffer';
                console.log(buffer, data)
                return _this.client.upload(buffer, name, option);
            }).catch(function (err) {
                let msg = 'image compress error: ' + err;
                error(msg);
                throw new Error(msg);
            });
    } else {
        return _this.client.upload(data, name, option);
    }
};

window.FileUpload = FileUpload;