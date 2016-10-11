# alioss-upload
upload plugin for alioss

## Flow

1. Client init setting (token/server link)
2. Upload
  * verify, auto init upload client
  * multi handle jobs (compress[piexif], rotate, ...)
  * began upload ==> upload finish ==> callback  (multi implment upload client)