const puppeteer = require('puppeteer');
var fs = require('fs');
var xlsx = require('node-xlsx');

let output = []
function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}
async function parse_topic(page, arr) {
    topic = [];
    index = -1;
    for (var i = 0; i < arr.length; ++i) {
        let val = arr[i];
        if (val.indexOf("link-top-line") > 0) {
            index++;
            res = val.match('href="(.*)" class="title raw-link raw-topic-link">(.*)</a>');
            if (res) {
                topic[index] = { 'url': 'http://blockgeek.org' + res[1], 'name': res[2] };
            }
            await page.goto(topic[index].url);
            // await page.waitFor(1000);
            let content = await page.$eval('#post_1 > div > div.topic-body.clearfix > div.regular.contents > div', el => el.innerText);
            if (content.length >= 500) {
                topic[index].type = 'article';
            } else {
                topic[index].type = 'question';
            }
        }
        if (val.indexOf("category-name") > 0) {
            res = val.match('class="category-name">(.*)</span></span></a></td>');
            if (res) {
                topic[index].category = res[1];
            }
        }
        if (val.indexOf("最早帖子") > 0) {
            res = val.match('最早帖子: (.*)');
            if (res) {
                topic[index].time = res[1];
            }
        }

    }
    return topic;
}

function parse_reply(arr) {
    topic = [];
    index = -1;
    // console.log(arr);
    arr.forEach(val => {
        if (val.indexOf('relative-date date') > 0) {
            index++;
            res = val.match('class="relative-date date" title="(.*)" data-time=');
            if (res) {
                topic[index] = { 'time': res[1], 'type': 'answer' };
            }
        }
        if (val.indexOf("category-name") > 0) {
            res = val.match('class="category-name">(.*)</span></span></a></div>');
            if (res) {
                topic[index].category = res[1];
            }
        }
        if (val.indexOf('href="/t/topic') > 0) {
            res = val.match('href="(.*)">(.*)</a>');
            if (res) {
                topic[index].url = 'http://blockgeek.org' + res[1];
                topic[index].name = res[2];
            }
        }
    });
    return topic;
}

async function scroll(page, scrollDelay = 1000) {
    for (var i = 0; i < 5; ++i) {
        previousHeight = await page.evaluate('document.body.scrollHeight');
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await page.waitFor(500);
    }
}
function writeResult(name, data) {
    let list = [['topic', 'url', 'time', 'category', 'type']];
    data.forEach(val => {
        let arr = [];
        arr.push(val.name);
        arr.push(val.url);
        arr.push(val.time);
        arr.push(val.category);
        arr.push(val.type);
        list.push(arr);
    });
    // var buffer = xlsx.build([
    //     {
    //         name: name,
    //         data: list
    //     }
    // ]);
    // fs.writeFileSync('test.xlsx', buffer, { 'flag': 'w' });
    output.push({
        name: name,
        data: list
    });
}
async function parse(username) {
    console.log('===>parsing ' + username);
    id = username.toLowerCase();
    const browser = await puppeteer.launch();
    // const browser = await puppeteer.launch({ headless: false, slowMo: 250 });
    const page = await browser.newPage();
    await page.goto(`http://blockgeek.org/u/${id}/activity/topics`);
    // await page.waitFor(1000);
    await scroll(page);
    let content = await page.$eval('#main-outlet > div:nth-child(2)', el => el.innerHTML);
    let arr = content.split('\n');

    let topic = await parse_topic(page, arr);

    await page.goto(`http://blockgeek.org/u/${id}/activity/replies`);
    await page.waitFor(1000);
    await scroll(page);
    content = await page.$eval('#main-outlet > div:nth-child(2)', el => el.innerHTML);
    arr = content.split('\n');
    let answer = parse_reply(arr);
    // console.log(answer);
    console.log(topic.concat(answer));
    await browser.close();
    writeResult(username, topic.concat(answer));
    console.log(`===>parsing ${username} done!`);

}

var data = fs.readFileSync('./member.txt', 'utf8').split('\n');
var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
var nodemailer = require('nodemailer')

var transport = nodemailer.createTransport({
    service: 'smtp.163.com',
    host: "smtp.163.com",
    secureConnection: true,
    port: 465,
    auth: {
        user: config.src,
        pass: process.env['PASS']
    }
});

var mailOptions = {
    from: config.src,
    to: config.dst,
    subject: "Block geek parse result " + Date(),
    text: "Hello",
    html: "<b>Hello</b>",
    attachments: [{
        file: "output.xlsx",
        path: "output.xlsx"
    }]
};

console.log("-~-~-~-~-~-~-~-~-~")
console.log(process.env['PASS'])
console.log("-~-~-~-~-~-~-~-~-~")


(async () => {
    for (var i = 0; i < data.length; ++i) {
        await parse(data[i]);
    }
    var buffer = xlsx.build(output);
    fs.writeFileSync('output.xlsx', buffer, { 'flag': 'w' });
    transport.sendMail(mailOptions, (err, res) => {
        if (err) console.log(err);
        else console.log(res);
    });
})();
