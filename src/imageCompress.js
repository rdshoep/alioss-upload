/*
 * @description
 *   使用HTML5在前端压缩图片
 *   解决思路借鉴https://github.com/brunobar79/J-I-C/
 * @author Zhang(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(8/16/2016)
 */
import Promise from 'promise';
import piexif from 'piexifjs';
import compose from './compose'

//单位瓦片大小
//用于将图片划分为多个万片，避免占用内存过多
const MAX_IMAGE_TILE_SIZE = 1000000;
const DEFAULT_COMPRESS_PIXELS_SIZE = 300000; //500 * 600

function ImageObject(imgObj, option) {
    if (typeof imgObj == 'string') {
        imgObj = document.getElementById(imgObj);
    }

    //确保imgObj是ImageElement
    if (!imgObj) {
        throw new TypeError('ImageObject muse be ImageElement/Id/ImageFile');
    }

    option = option || {};

    this.element = imgObj;
    this.option = {
        output: 'base64'
    };

    this.option.quality = option.quality || 100;
    this.option.outputImageType = 'image/jpeg';
    let outputImageType = option.outputImageType;
    if (typeof outputImageType !== "undefined"
        && (outputImageType == "png" || outputImageType == 'image/png')) {
        this.option.outputImageType = "image/png";
    }
    this.option.exif = option.exif !== false;

    this.option.maxWidth = Number(option.maxWidth) || 0;
    this.option.maxHeight = Number(option.maxHeight) || 0;

    //如果maxSize为false，表示不需要限制最大像素
    this.option.maxSize = option.maxSize;
    //如果没有设置maxSize、maxWidth、maxHeight，则将maxSize设置为有效，使用默认的像素值
    if (this.option.maxSize === undefined
        && !(this.option.maxWidth > 0 || this.option.maxHeight > 0)) {
        this.option.maxSize = true;
    }

    if ('buffer' == option.output) {
        this.option.output = option.output
    }
}

/**
 * 将文件类型数据转换为ImageElement对象
 * @param imageObject
 * @param next next middleware
 * @returns {*}
 */
function autoLoadImageFile(imageObject, next) {
    let element = imageObject.element;

    if (element && element instanceof File) {
        //暂时关闭大文件压缩和上传
        let fileSize = element.size;
        console.log('fileSize', fileSize);
        if(fileSize > 5 * 1024 * 1024){
            return Promise.reject('文件超过大小限制(5M)，当前大小为' + Math.round(fileSize / 1024 / 1024) + 'M');
        }

        imageObject.file = element;
        return new Promise(function (resolve, reject) {
            readFileAsDataUrl(element, function (err, imageElement) {
                if (err) reject(err);

                imageObject.element = imageElement;
                imageObject.data = imageElement.src;
                resolve();
            });
        }).then(next);
    } else {
        return next();
    }
}

/**
 * 自动检查是否需要进行压缩操作,并进行相关的计算，将计算结果放置到imageObject.compress中
 * @param imageObject
 * @param next
 * @returns {*}
 */
function smartCompress(imageObject, next) {
    let option = imageObject.option;

    let maxSize = option.maxSize
        , maxHeight = option.maxHeight
        , maxWidth = option.maxWidth
        , outputImageType = option.outputImageType;

    let maxPixels = calculateImageCompressPixels(maxSize, maxWidth, maxHeight
        , DEFAULT_COMPRESS_PIXELS_SIZE, outputImageType);

    let imgObj = imageObject.element
        , width = imgObj.naturalWidth
        , height = imgObj.naturalHeight;

    //计算得到最符合需求的压缩比例
    let ratio = calculateCompressRatio(width, height, maxPixels, maxWidth, maxHeight);
    if (ratio > 1) {
        width /= ratio;
        height /= ratio;

        imageObject.compress = {
            width: width,
            height: height,
            imageType: option.outputImageType
        }
    }

    //修复在不需要压缩情况下，返回base64格式数据的BUG
    //为了保证输出需求output的一致性，将此处调整为继续向下执行，经过数据转换处理逻辑
    //TODO 需要考虑，如何在避免不需要压缩情况下的读取和转换数据的开销
    return next();
}

/**
 * 自动备份和恢复对应的图像exif数据
 * @param imageObject
 * @param next
 * @returns {*}
 */
function backupImageExif(imageObject, next) {
    let data = imageObject.data;
    let option = imageObject.option;

    if (option.exif && imageObject.compress) {
        let exifObj;
        try {
            exifObj = piexif.load(data);
        } catch (err) {
            console.error('load exif from image error', err, data)
            //return Promise.reject('load exif from image error' + err);
        }

        return next().then(function () {
            let data = imageObject.data;

            try {
                if (data && exifObj) {
                    exifObj.thumbnail = null;
                    imageObject.data = piexif.insert(piexif.dump(exifObj), data);
                }
            } catch (err) {
                console.error('insert exif to image error', err, data, exifObj)
                // return Promise.reject('insert exif to image error' + err);
            }
        });
    }

    return next();
}

/**
 * 进行图片压缩处理
 * @param imageObject
 * @param next
 * @returns {*}
 */
function imageCompress(imageObject, next) {
    let option = imageObject.option;
    let compress = imageObject.compress;

    //如果没有压缩配置，则返回相应的配置数据
    if (!compress) return;

    let imgObj = imageObject.element
        , width = compress.width
        , height = compress.height
        , imageType = compress.imageType;

    let cvs = document.createElement('canvas')
        , cxt = cvs.getContext("2d");

    cvs.width = width;
    cvs.height = height;

    //如果是jpg，则添加铺底色
    if (imageType == 'image/jpeg') {
        cvs.fillStyle = option.backgroundColor || '#fff';
    }

    let quality = option.quality;
    cxt.fillRect(0, 0, width, height);
    //如果图片像素大于单位万片最大值则使用瓦片绘制
    // let tmpCvs = document.createElement('canvas');
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
    imageObject.data = cvs.toDataURL(imageType, quality / 100);

    // if (tmpCvs) {
    //     tmpCvs.width = tmpCvs.height = 0;
    // }
    cvs.width = cvs.height = 0;
    return next();
}

/**
 * 根据对应的设置计算最大像素值
 * @param maxSize 最大图片大小
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param defaultMaxPixels 默认最大像素点数
 * @param imageType 图像输出类别
 * @returns {*|number}
 */
function calculateImageCompressPixels(maxSize, maxWidth, maxHeight, defaultMaxPixels, imageType) {
    let outputImageType = imageType || 'image/jpeg'
        , unitPixelSize = 3; //jpeg 一个像素占用3个字节，png一个像素占用4个字节
    if (outputImageType == 'image/png') {
        unitPixelSize = 4;
    }

    let maxPixels = defaultMaxPixels || DEFAULT_COMPRESS_PIXELS_SIZE;

    //如果maxSize为false，标识不需要限制大小
    if (maxSize === false) {
        maxPixels = 0;
    } else if (parseInt(maxSize) > 0) {//如果maxSize为数字，并且大于0，则根据大小计算相对应的像素值
        maxPixels = Math.floor(parseInt(maxSize) / unitPixelSize);
    }

    //如果最大宽度和高度不为0，则需要再根据最大宽和高计算相对应的像素值
    if (maxWidth > 0 && maxHeight > 0) {
        maxPixels = Math.min(maxPixels, maxWidth * maxHeight);
    }

    return maxPixels;
}

/**
 * 根据最大像素/最大宽度/最大高度计算都兼容压缩比率
 * @param width 图像宽度
 * @param height 图像高度
 * @param maxPixels 最大像素数
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @returns {number}
 */
function calculateCompressRatio(width, height, maxPixels, maxWidth, maxHeight) {
    let areaRatio = 1 //面积的缩放比率
        , widthRatio = 1 //宽度的缩放比率
        , heightRatio = 1; //高度的缩放比率

    //如果最大像素值存在
    if (maxPixels > 0 && (areaRatio = width * height / maxPixels) > 1) {
        areaRatio = Math.sqrt(areaRatio);
    }
    if (maxWidth > 0 && width > maxWidth) {
        widthRatio = width / maxWidth;
    }
    if (maxHeight > 0 && height > maxHeight) {
        heightRatio = height / maxHeight;
    }

    return Math.max(areaRatio, widthRatio, heightRatio);
}

/**
 * 根据预期输出结果转换数据
 *   处理后的数据默认为base64格式，如果需要转换为buffer，则需要进行相关处理
 * @param imageObject
 * @param next
 * @returns {*}
 */
function convertImageToBuffer(imageObject, next) {
    let opt = imageObject.option;

    if ('buffer' == opt.output) {
        return next().then(function () {
            let data = removeBase64FileTypeInfo(imageObject.data, opt.outputImageType)
            imageObject.data = convertBytesToBuffer(convertBase64ToBytes(atob(data)));
            return Promise.resolve();
        })
    }

    return next();
}

/**
 * 转换成base64数据为buffer数据
 * @param data image base64 data
 * @returns {ArrayBuffer}
 */
function convertDataToBuffer(data) {
    return convertBytesToBuffer(convertBase64ToBytes(atob(data)));
}

/**
 * 移除base64字符串中的无效字符
 * @param base64String
 * @param sourceType
 * @returns {void|XML|string|*}
 */
function removeBase64FileTypeInfo(base64String, sourceType) {
    // var type = "image/jpeg";
    //
    // if (sourceType && typeof sourceType == 'string' && sourceType.endsWith('png')) {
    //     type = 'image/png';
    // }

    // return base64String.replace('data:' + type + ';base64,', '');

    //如果没有激活压缩条件，源文件的类型无法感知（无法通过文件名自动判断），所以目前通过正则强制移除开头的标识
    return base64String.replace(/^data:[\w\\/]+;base64,/, '');
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
function readFileAsDataUrl(file, cb) {
    cb = cb || new Function;
    if (file && file instanceof File) {
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
    } else {
        cb('unexpect file type');
    }
}

function generator() {
    let mid = compose([autoLoadImageFile, smartCompress, convertImageToBuffer, backupImageExif, imageCompress]);

    /**
     * Receives an Image Object (can be JPG OR PNG) and returns a new Image Object compressed
     * @param {Image} imgObj The source Image Object
     * @param {Object} image compress config
     *                 maxSize {Boolean | Number}  default: true value: Number || (true? DEFAULT_COMPRESS_PIXELS_SIZE: 0)
     *                 maxWidth, maxHeight (0--∞)
     *                 quality(default: 100)
     *                 outputImageType(default: jpeg)
     *                 output(default: base64) support base64|buffer
     *                 exif(default: true)
     */
    return function compress(imgObj, option) {
        try {
            let imageContext = new ImageObject(imgObj, option);

            return mid(imageContext)
                .then(function () {
                    return Promise.resolve(imageContext.data);
                });;
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
}

export default generator();