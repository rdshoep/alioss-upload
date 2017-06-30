# Plupload
plupload 支持多种上传模式，同样也需要多种资源文件的支持
[alioss官方支持说明](https://help.aliyun.com/document_detail/31925.html)

## 配置
### `new Uploader(options)`
`resource` 资源文件的根目录，默认为`/plupload/`。配置影响`flash_swf_url`和`silverlight_xap_url`

```js
flash_swf_url = resource + 'Moxie.swf'
silverlight_xap_url = resource + 'Moxie.xap'
```

### crossdomain.xml
需要在页面对应的域名下配置此文件，用于`flash`模式下跨域访问的配置文件

简单无限制配置，生产环境请根据实际情况配置。[相关介绍](http://blog.csdn.net/summerhust/article/details/7721627)

```xml
<?xml version="1.0"?>
<cross-domain-policy>
    <site-control permitted-cross-domain-policies="master-only"/>
    <allow-access-from domain="*"/>
</cross-domain-policy>
```