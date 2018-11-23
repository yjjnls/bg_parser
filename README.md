# bg_parser
Statistical plugin for blockgeek   
![](https://ci.appveyor.com/api/projects/status/ty3nh0rb43349epc?svg=true)
## How to start
1.  install [node.js](https://nodejs.org/dist/v10.13.0/node-v10.13.0-x64.msi)
2.  `git clone https://github.com/yjjnls/bg_parser.git`
3.  `cd bg_parser`
4.  `npm install`

5.  copy member list to `member.txt` and make dir `result` in the current directory
6.  `npm start`
7.  parsing result will stroe in dir `result`


1. Fork this repo to yours and clone it
2. Login [AppVeyor](https://ci.appveyor.com) with your github
3. Add a new project and select the `bg_parser` repo you forked
4. Add member list (automation not supported now!)
5. Replace the mail in config.json to yours. `"src"` must be a 163 mail, `"dst"` can be any mail. The parse result will mail to the `"dst"` account from `"src"` account.
6. 