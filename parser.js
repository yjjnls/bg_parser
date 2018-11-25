const puppeteer = require('puppeteer');
var fs = require('fs');
var xlsx = require('node-xlsx');
var nodemailer = require('nodemailer');

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

async function scroll(page, total = false) {
    if (total) {
        while (true) {
            let previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            try {
                await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
                await page.waitFor(500);
            } catch (err) {
                break;
            }
        }
    }
    else {
        for (var i = 0; i < 5; ++i) {
            let previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitFor(500);
        }
    }
}

function writeResult(member, data) {
    let list = [['id', member.id], ['hpb address', member.hpb], ['topic', 'url', 'time', 'category', 'type']];
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
        name: member.id,
        data: list
    });
}
async function parse(member) {
    console.log('===>parsing ' + member.id);
    let id = member.id.toLowerCase();
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
    writeResult(member, topic.concat(answer));
    console.log(`===>parsing ${member.id} done!`);

}

// var data = fs.readFileSync('./member.txt', 'utf8').split('\n');

var transport = nodemailer.createTransport({
    service: 'smtp.163.com',
    host: "smtp.163.com",
    secureConnection: true,
    port: 465,
    auth: {
        user: process.env['SRC_MAIL'],
        pass: process.env['PASS']
    }
});

var mailOptions = {
    from: process.env['SRC_MAIL'],
    to: process.env['DST_MAIL'],
    subject: "Block geek parse result [" + Date() + "]",
    text: "Hello",
    html: "<b>Hello</b>",
    attachments: [{
        file: "output.xlsx",
        path: "output.xlsx"
    }]
};
let member_info = [];
async function parse_member(page, arr) {
    let member_list = [];
    for (var i = 0; i < arr.length; ++i) {
        let val = arr[i];
        if (val.indexOf("data-user-card") > 0) {
            let res = val.match('<a href="/u/(.*)" data-user-card="(.*)">(.*)</a>');
            if (res) {
                if (res[1] == res[3])
                    member_list.push(res[1]);
            }
        }
    }
    for (var i = 0; i < member_list.length; ++i) {
        let member_id = member_list[i];
        member_info[i] = { 'id': member_id, 'hpb': '' };
        await page.goto('http://blockgeek.org/u/' + member_id);

        let content = await page.$eval('#main-outlet > div:nth-child(2)', el => el.innerHTML);
        content = content.split('\n');
        for (var j = 0; j < content.length; ++j) {
            if (content[j].indexOf('<span class="user-field-value">') > 0) {
                let emberid = content[j].match('<span class="user-field-value">(.*)</span>');
                if (emberid) {
                    member_info[i].hpb = emberid[1];
                    break;
                }
            }
        }
        console.log('id: ' + member_info[i].id + '\nhpb: ' + member_info[i].hpb + '\n');


    }
    console.log(member_info)
    console.log(member_info.length)
}
async function search_member() {

    // const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({ headless: false, slowMo: 250 });
    const page = await browser.newPage();
    await page.goto(`http://blockgeek.org/u`);
    // await page.waitFor(1000);
    await scroll(page, true);
    let content = await page.$eval('#ember854 > table > tbody', el => el.innerHTML);
    let arr = content.split('\n');
    parse_member(page, arr);

}
(async () => {
    await search_member();
    // for (var i = 0; i < data.length; ++i) {
    //     await parse(data[i]);
    // }
    for (var i = 0; i < member_info.length; ++i) {
        await parse(member_info[i]);
    }
    var buffer = xlsx.build(output);
    fs.writeFileSync('output.xlsx', buffer, { 'flag': 'w' });
    transport.sendMail(mailOptions, (err, res) => {
        if (err) console.log(err);
        else console.log(res);
    });
})();
