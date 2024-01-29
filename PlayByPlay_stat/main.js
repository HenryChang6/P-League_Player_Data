const axios = require('axios'); // Used for making HTTP requests
//const cheerio = require('cheerio'); // Used for parsing HTML and traversing the DOM
//const puppeteer = require('puppeteer'); //有點像Selenium的東西
//const fs = require('fs').promises; // Used for file operations (in this case, writing to a file)
//const re = require('xregexp'); // An extended version of JavaScript's RegExp for more features

let html = NaN

async function fetchData(url) {
    try {
        let response = await axios.get(url);
        html = response.data["data"];
    } catch (error) {
        console.error('Error making the request:', error);
    }
}

function ParsingData(html) {
    console.log(html);
} 

fetchData('https://pleagueofficial.com/api/playbyplay.php?uuid=d9107d2f-4e15-11ee-b746-6d2e73331f46')
    .then(html => {
        if(html) ParsingData(html);
        else console.log('html is empty !!!')
    })
    .catch(error => {
        console.error('An error occurred', error);
    });

// async function clickAndRetrieveData() {
//     // Launch the headless browser
//     const browser = await puppeteer.launch();
//     // Open a new page
//     const page = await browser.newPage();
//     // Navigate to the page that contains the element you want to click
//     await page.goto('https://pleagueofficial.com/game/471');
//     // Wait for the element to be loaded into the DOM (use the appropriate selector)
//     await page.waitForSelector('body > section.pt-md-0.pt-0.bg-black > div.row > div > ul > li:nth-child(3) > a');
  
//     await page.evaluate(() => {
//         reloadPlayByPlay(); // Call the function directly if it's globally available
//         console.log("function called");
//       });

    // // Click the element to trigger the request
    // await page.click('your-element-selector');
  
    // // Wait for the response of the request that is triggered by the click
    // // Replace 'url-to-listen-for' with the URL pattern you expect to be called
    // const response = await page.waitForResponse(response => 
    //   response.url().includes('url-to-listen-for') && response.status() === 200
    // );
  
    // // Get the response body as JSON (or text, etc. depending on the content type)
    // const data = await response.json();
  
    // // Process the data
    // console.log(data);
  
    // Close the browser
//     await browser.close();
//   }
  
//   clickAndRetrieveData();