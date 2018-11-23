# bg_parser
Statistical plugin for blockgeek   
![](https://ci.appveyor.com/api/projects/status/ty3nh0rb43349epc?svg=true)
## How to start

1. Fork this repo to yours and clone it.
2. Login [AppVeyor](https://ci.appveyor.com) with your github.
3. Add a new project and select the `bg_parser` repo you forked.
4. Add member list (automation not supported now!).
5. Prepare a 163 mail (only supported 163 now), and get your [authorization code](https://jingyan.baidu.com/article/495ba841ecc72c38b30ede38.html). 
6. Select project `bg_parser` on your AppVeyor page, then select `Settings`, `Environment`, `add variable`. Add 3 environment variables as below:
    * `SRC_MAIL` : your 163 mail account (xxx@163.com)
    * `PASS` : the authorization code you get in step 5, and remember to encrypt it and make it private!!!
    * `DST_MAIL` : mail account to receive parse result
    * Remember to press the `save` button at the below!!!

![](https://upload-images.jianshu.io/upload_images/11336404-5510911a561cdbb0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

7. Commit your change and push to the repo, then AppVeyor will do the parsing automatically and mail you the result.
8. When you push a new commit or press the `RE-BUILD COMMIT` button, AppVeyor will do the parsing again for you.