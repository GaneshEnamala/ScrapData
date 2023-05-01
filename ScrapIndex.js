const puppeteer = require('puppeteer');
const delay = require('delay');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

(async () => {
  const fields = [
    { id: 'url', title: 'URL' },
    { id: 'title', title: 'Title' },
    { id: 'description', title: 'Description' }
  ];
  const csvWriter = createCsvWriter({
    path: 'scrapdata.csv',
    header: fields
  });
  const scrapdata = []
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://americanveteranjobs.com/jobs/?location=united%20states',
    {
      timeout: 150000,
      waitUntil: "networkidle2"

    }
  );

  await Promise.race([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 240000 }),
    new Promise(resolve => setTimeout(resolve, 10000))
  ]);
  for (let i = 0; i < 1000; i++) {
    await page.waitForSelector('[class="ml-1"]');
    const button = await page.$('[class="ml-1"]');
    await delay(10000)
    await button.click();
  }




  const getJobsUrl = await page.evaluate(() => Array.from(document.querySelectorAll('[href*="/job/"]')).map(data => data.href))

  console.log("getJobsUrl : ", getJobsUrl);

  for (const url of getJobsUrl) {
    await page.goto(url);
    await delay(3000)

    const titleDesc = await page.evaluate(() => {
      const title = document.querySelector('[class="py-4 text-3xl font-bold text-white"]').innerText
      const description = document.querySelector('[class="prose"]').innerText
      return {
        title,
        description
      };
    })
    titleDesc['url'] = url;
    scrapdata.push(titleDesc);
    // console.log("titleDesc : ",titleDesc);

  }

  csvWriter.writeRecords(scrapdata)
    .then(() => {
      console.log('CSV file written successfully');
    });

  await browser.close();
})();
