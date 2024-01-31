// const axios = require('axios'); // Used for making HTTP requests
const cheerio = require('cheerio'); // Used for parsing HTML and traversing the DOM
const puppeteer = require('puppeteer'); //有點像Selenium的東西
// const { forEach } = require('xregexp');
const fs = require('fs').promises; // Used for file operations (in this case, writing to a file)
const jwt = require('jwt-decode');
//const re = require('xregexp'); // An extended version of JavaScript's RegExp for more features

let html = null;
let sort_num = 0;
let pbp_data = [];
let data = {};
// 417 是本季第一場比賽 472 是本季最後一場比賽
let match_id = 417;


async function fetchData(url) {
    /*
     stimulate a click action to reach play by play section
    */
    let browser = await puppeteer.launch();
    let page = await browser.newPage();
    await page.goto(url);
    // Make sure this is a game stat page
    try {
        await page.waitForSelector('body > section.bg-deepblue.text-center.py-md-4.py-2.mx-0.page_title > h1',{timeout:3000});
    } catch(error) {
        console.error(`This game_id ${match_id} is not a valid game match !!!`);
        return;
    }
    // The PlayByPlay Btn
    await page.waitForSelector('body > section.pt-md-0.pt-0.bg-black > div.row > div > ul > li:nth-child(3) > a');
    await page.click('body > section.pt-md-0.pt-0.bg-black > div.row > div > ul > li:nth-child(3) > a');
    // test if there are playbyplay data (some earlier game didn't support this function)
    try {
        await page.waitForSelector('.table-responsive-lg table tr',{timeout:3000});
    } catch(error) {
        console.error(`game ${match_id}: don't have pbp data ==` + '\n', error.message);
        return;
    }
    // await page.waitForSelector('.pbplay');
    html = await page.content();
    await browser.close();
    return html;
}


function ParsingData(html) {
    const $ = cheerio.load(html);
    const data_units = $('.table-responsive-lg tr');
    data_units.each(function() {
        let unit = {}
        // match id
        unit['match_id'] = match_id; // global variable
        // sort_num
        unit['sort_num'] = sort_num;
        // check proceed or not
        const token = $(this).find('.pbp_detail').attr('data-tryspot');
        if($(this).find('.pbp_detail').attr('data-tryspot') == undefined) {
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
        unit['player_team'] = ($(this).find('td').eq(0).attr('data-tryspot') == undefined ) ? 'home' : 'away';
        // period 
        const period = $(this).attr('class').split(' ')[0].replace(/-tr$/, '');
        unit['period'] = period;
    
        let tmp1 = $(this).find('a').eq(0).find('b').eq(0);
        let tmp2 = $(this).find('a').eq(0).find('b').eq(1);
        let tmp3 = $(this).find('td').eq(1).find('span');
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
        sort_num ++;
        pbp_data.push(unit);
    });
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
} 



async function main() {
    // while(match_id <= 472) {
    //     html = await fetchData(`https://pleagueofficial.com/game/${match_id}`);
    //     if(html) {
    //         ParsingData(html);
    //         data['playbyplay'] = pbp_data;
    //         const dataString = JSON.stringify(data, null, 2);
    //         fs.promises.writeFile(`data/game${match_id}_pbp.json`,dataString);
    //         console.log(`game ${match_id} data saved!!!`);
    //     }
    //     match_id ++;
    // }

    html = await fetchData(`https://pleagueofficial.com/game/${match_id}`);
    if(html) {
        ParsingData(html);
        data['playbyplay'] = pbp_data;
        const dataString = JSON.stringify(data, null, 2);
        await fs.writeFile(`data/game${match_id}_pbp.json`,dataString);

        console.log(`game ${match_id} data saved!!!`);
    }

    // html = await fetchData('https://pleagueofficial.com/game/461');
    // if(html) {
    //     ParsingData(html);
    //     data['playbyplay'] = pbp_data;
    //     const dataString = JSON.stringify(data, null, 2);
    //     fs.writeFile('test.json',dataString);
    // }
}

main();
