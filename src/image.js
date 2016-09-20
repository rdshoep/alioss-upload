/*
 * @description
 *   使用HTML5在前端压缩图片
 *   解决思路借鉴https://github.com/brunobar79/J-I-C/
 * @author Zhang(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(8/16/2016)
 */
import Promise from 'promise'
import * as util from './utils';
import piexif from 'piexifjs';

let cvs, tmpCvs;

//单位瓦片大小
//用于将图片划分为多个万片，避免占用内存过多
const MAX_IMAGE_TILE_SIZE = 1000000;
const DEFAULT_COMPRESS_PIXELS_SIZE = 2000000;

function autoCanvas(canvas) {
    if (!canvas) {
        canvas = document.createElement('canvas');
    }
    return canvas;
}

/**
 * Receives an Image Object (can be JPG OR PNG) and returns a new Image Object compressed
 * @param {Image} imgObj The source Image Object
 * @param {Integer} quality The output quality of Image Object
 * @param {String} output format. Possible values are jpg and png
 * @return {Image} result_image_obj The compressed Image Object
 */
function compress(imgObj, quality, outputFormat) {
    if (!imgObj) return;

    if (typeof imgObj == 'string') {
        imgObj = document.getElementById(imgObj);
    }

    var sourceImageData = imgObj.src;
    var exifObj;
    try{
        exifObj = piexif.load(sourceImageData);
    }catch (err){
        console.log('load exif from image', err);
    }

    var mime_type = "image/jpeg";
    if (typeof outputFormat !== "undefined" && (outputFormat == "png" || outputFormat == 'image/png')) {
        mime_type = "image/png";
    }

    cvs = autoCanvas(cvs);
    let cxt = cvs.getContext("2d");
    var width = imgObj.naturalWidth;
    var height = imgObj.naturalHeight;
    var ratio = 1;
    if ((ratio = width * height / DEFAULT_COMPRESS_PIXELS_SIZE) > 1) {
        ratio = Math.sqrt(ratio);
        width /= ratio;
        height /= ratio;
    }

    //如果是jpg，则添加铺底色
    if (mime_type == 'image/jpeg') {
        cvs.fillStyle = "#fff";
    }

    cvs.width = width;
    cvs.height = height;
    cxt.fillRect(0, 0, width, height);
    //如果图片像素大于单位万片最大值则使用瓦片绘制
    // var count;
    // if ((count = width * height / MAX_IMAGE_TILE_SIZE) > 1) {
    //     tmpCvs = autoCanvas(tmpCvs);
    //     let tmpCtx = tmpCvs.getContext("2d");
    //
    //     count = ~~(Math.sqrt(count) + 1); //计算要分成多少块瓦片
    //     //计算每块瓦片的宽和高
    //     var nw = ~~(width / count);
    //     var nh = ~~(height / count);
    //     tmpCvs.width = nw;
    //     tmpCvs.height = nh;
    //     for (var i = 0; i < count; i++) {
    //         for (var j = 0; j < count; j++) {
    //             tmpCtx.drawImage(imgObj, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);
    //             cxt.drawImage(tmpCvs, i * nw, j * nh, nw, nh);
    //         }
    //     }
    // } else {
    //     cxt.drawImage(imgObj, 0, 0, width, height);
    // }
    cxt.drawImage(imgObj, 0, 0, width, height);
    var data =  cvs.toDataURL(mime_type, quality / 100);

    //进行最小压缩
    // var ndata = cvs.toDataURL('image/jpeg', 0.1);
    if (tmpCvs) {
        tmpCvs.width = tmpCvs.height = 0;
    }
    cvs.width = cvs.height = 0;

    //如果存在exif信息,则将exif信息插入到图片中
    try{
        if(exifObj && data){
            return piexif.insert(piexif.dump(exifObj), data);
        }
    }catch (err){
        console.log('insert exif to image', err);
    }

    return data;
}

/**
 * 移除base64字符串中的无效字符
 * @param base64String
 * @param sourceType
 * @returns {void|XML|string|*}
 */
function removeUselessChars(base64String, sourceType) {
    var type = "image/jpeg";

    if (sourceType && typeof sourceType == 'string' && sourceType.endsWith('png')) {
        type = 'image/png';
    }

    return base64String.replace('data:' + type + ';base64,', '');
}

/**
 * 将base64字符串转换为byte字节数组
 * @param base64String
 * @returns {Array}
 */
function convertBase64ToBytes(base64String) {
    return Array.prototype.map.call(base64String, function (c) {
        return c.charCodeAt(0) & 0xff;
    });
}

/**
 * 将字节转换为相对应的buffer
 * @param bytes
 * @returns {ArrayBuffer}
 */
function convertBytesToBuffer(bytes) {
    return new Uint8Array(bytes).buffer
}

/**
 * 将文件对象转换成ImageElement
 * @param file 图片文件
 * @param cb 回调
 */
function convertFileToImage(file, cb) {
    if (file && file instanceof File) {
        cb = cb || new Function;
        var reader = new FileReader();

        reader.onload = function () {
            var result = this.result;
            var img = new Image();
            img.src = result;
            if (img.complete) {
                cb(null, img)
            } else {
                img.onload = function () {
                    cb(null, img)
                };
            }
        };
        reader.readAsDataURL(file);
    }
}

/**
 * 上传图片
 * @param source
 * @param quality
 * @param format
 * @returns {*}
 */
function compressForUpload(source, quality, format, cb) {
    return new Promise(function (resolve, reject) {
        if (cb && typeof cb == 'function') {
            resolve = util.concatResolve(cb, resolve);
            reject = util.concatReject(cb, reject);
        }

        if (source) {
            if (source instanceof File) {
                convertFileToImage(source, function (err, img) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(convertImageToBuffer(img, quality, format));
                    }
                })
            } else {
                resolve(convertImageToBuffer(source, quality, format));
            }
        } else {
            reject('unsupport source type! must be (Image Element (Id) / File)');
        }
    });
}

/**
 * 压缩文件、并解析为阿里云上传所需要的buffer数据
 * 1.压缩图片
 * 2.删除类别标记代码
 * 3.解码base64后转换为byte数组、然后转换为buffer对象
 * @param sourceImageObj
 * @param quality
 * @param format
 * @returns {ArrayBuffer}
 */
function convertImageToBuffer(sourceImageObj, quality, format) {
    let data = compress(sourceImageObj, quality, format);

    return convertDataToBuffer(data);
}

/**
 * 转换成base64数据为buffer数据
 * @param data
 * @returns {ArrayBuffer}
 */
function convertDataToBuffer(data) {
    return convertBytesToBuffer(convertBase64ToBytes(atob(removeUselessChars(data))));
}

export default {
    compress,
    compressForUpload
}
