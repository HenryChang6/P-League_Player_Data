const axios = require('axios'); // Used for making HTTP requests
const cheerio = require('cheerio'); // Used for parsing HTML and traversing the DOM
const puppeteer = require('puppeteer'); //有點像Selenium的東西
// const { forEach } = require('xregexp');
const fs = require('fs').promises; // Used for file operations (in this case, writing to a file)
const jwt = require('jwt-decode');
const { clear } = require('console');
//const re = require('xregexp'); // An extended version of JavaScript's RegExp for more features
const refresh_frequency = 30000;

let html = null;
//let sort_num = 0;
let pbp_data = [];
let data = {};
let current_record_num = 0;
// 從 473 開始 到 476
let match_id = 473;
let timerId;

async function fetchUUID(url) {
    let browser = await puppeteer.launch();
    let page = await browser.newPage();
    let requests = new Map();
    let request_url = null;
    await page.goto(url);
    // fetch all requests
    page.on('request', request => {
        requests.set(request.url(), request);
    });
    // Make sure this is a game stat page
    try {
        await page.waitForSelector('body > section.bg-deepblue.text-center.py-md-4.py-2.mx-0.page_title > h1',{timeout:3000});
    } catch(error) {
        console.error(`This game_id ${match_id} is not a valid game match !!!`);
        return;
    }
    // Wait for the show playbyplay btn and click it
    try {
        await page.waitForSelector('body > section.pt-md-0.pt-0.bg-black > div.row > div > ul > li:nth-child(3) > a',{timeout:4000});
    } catch(error) {
        console.error(`This game_id ${match_id} is not a valid game match !!!`);
        return;
    }
    await page.click('body > section.pt-md-0.pt-0.bg-black > div.row > div > ul > li:nth-child(3) > a');
    // Wait for the playbyplay data and fetch the url
    await page.waitForSelector('.table-responsive-lg table');
    for (const request of requests.values()) {
        if(request.url().includes('playbyplay.php')) {
            request_url = request.url();
            break;
        }
    }
    await browser.close();
    return request_url;
}

async function fetchData(url) {
    try {
        const response = await axios.get(url);
        const table_html_str = response.data['data'];
        const $ = cheerio.load(table_html_str);
        if($('tr').length === 0) {
            console.error('No play by play data yet!');
            return;
        }
        else{
            Parsing_Data($);
        }
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
    }
}

async function Parsing_Data($) {
    const data_units = $('table tr');
    // Check if there are new data
    console.log(`current_record_num: ${current_record_num}`);
    console.log(`data_units.length: ${data_units.length}`);
    if(data_units.length === current_record_num) {
        console.log('No new data yet!');
        return;
    }
    // If there's new data, update the current_record_num and parse the new data
    for(let i = current_record_num; i < data_units.length; i++) {
        console.log(`Parsing data (index: ${i})`);
        let unit = {}
        const period = data_units.eq(i).attr('class').split(' ')[0].replace(/-tr$/, '');
        // Check whether it is the last data
        // if(period === 'all') {
        //     clearInterval(timerId);
        //     data['playbyplay'] = pbp_data;
        //     const dataString = JSON.stringify(data, null, 2);
        //     await fs.writeFile(`test.json`,dataString);
        //     console.log(`game ${match_id} data fetching complete!!!`);
        //     return;
        // }
        // match id
        unit['match_id'] = match_id; // global variable
        // sort_num
        unit['sort_num'] = i;
        // check proceed or not
        const token = data_units.eq(i).find('.pbp_detail').attr('data-tryspot');
        if(data_units.eq(i).find('.pbp_detail').attr('data-tryspot') == undefined) {
            unit = [];
            return;
        }
        else{ // url
            try {
                const decoded = jwt.jwtDecode(token,{header:true});
                unit['url'] = decoded['url'];
            } catch (error) {
                console.error('Invalid or expired token:', error.message);
            }
        }
        // team
        unit['player_team'] = (data_units.eq(i).find('td').eq(0).attr('data-tryspot') == undefined ) ? 'home' : 'away';
        // period 
        unit['period'] = period;
        let tmp1 = data_units.eq(i).find('a').eq(0).find('b').eq(0);
        let tmp2 = data_units.eq(i).find('a').eq(0).find('b').eq(1);
        let tmp3 = data_units.eq(i).find('td').eq(1).find('span');
        let text1 = tmp1.text().split(' ');
        let text2 = tmp2.text();
        // count_down
        unit['count_down'] = tmp3.eq(0).text();
        // current_score
        // 沒有得分的會顯示 '-' 可能要分兩個stage做
        unit['current_score'] = tmp3.eq(1).text();
        // number
        unit['number'] = text1[0].replace(/\D/g, '');
        //player_name
        unit['player_name'] = text1[1];
        // stat_label
        unit['stat_label'] = text1[2];
        // delta_score
        unit['delta_score'] = text2.length == 1 ? '+0' : text2;
        //sort_num ++;
        console.log(`Data update notification (index: ${i})`);
        pbp_data.push(unit);
    }
    pbp_data.sort(function(a,b) {
        return b['sort_num'] - a['sort_num'];
    });
    // 二次處理current_score
    let current_score = null;
    pbp_data.forEach(d => {
        if(d['current_score'] == ' - ') {
            d['current_score'] = current_score === null ? '0 - 0' : current_score; 
        }
        else {
            current_score = d['current_score'];
        }
    });
    current_record_num = data_units.length - 1;
}

   

async function main() {
    //let url = await fetchUUID(`https://pleagueofficial.com/game/473`);
    //console.log(url);
    fetchData('https://pleagueofficial.com/api/playbyplay.php?uuid=da056c6d-4e15-11ee-ad2c-a5359e0e27f6');
    // if(url) {
    //     console.log('successfullly fetched the url!');
    //     timerId = setInterval(() => {
    //         fetchData(url);
    //     }, refresh_frequency);
    //     console.log(`start fetch data! (refresh_frequency: ${refresh_frequency} ms)`);
    // }
}

main();
