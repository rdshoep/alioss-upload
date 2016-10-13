/*
 * @description
 *   Please write the UploadObject script's description
 * @author Zhang(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(10/13/2016)
 */
module.exports = UploadObject;

const TYPE_FILE = 'file';
const TYPE_BUFFER = 'buffer';

function UploadObject(data, type) {
    this.type = type || TYPE_FILE;

    this.data = data;
}