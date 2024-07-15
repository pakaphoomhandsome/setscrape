const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const moment = require('moment-timezone');

const { sendMsgController } = require('./sendlinemsg.controller');

async function scrapeData() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
  
    try {
        // Navigate to the page
        await page.goto('https://www.settrade.com/th/equities/market-data/overview', { waitUntil: 'networkidle0' });
  
        // Wait for the select element to load
        await page.waitForSelector('.multiselect__select');
  
        // Click on the select element to open the dropdown
        await page.click('.multiselect__select');
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000))); // Wait for the dropdown options to appear
  
        // Click on the "ทั้งหมด" option
        await page.evaluate(() => {
            const elements = document.querySelectorAll('.multiselect__option');
            elements.forEach(element => {
                if (element.textContent.includes('ทั้งหมด')) {
                    element.click();
                }
            });
        });
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000))); // Wait for the content to load after selecting "ทั้งหมด"
  
        // Wait for the table to load
        await page.waitForSelector('.table-responsive');

        // Get the page content
        const content = await page.content();
  
        // Use Cheerio to parse the HTML content
        const $ = cheerio.load(content);

        // Extract the date
        const date = $('.market-date-nofix-display').text().trim().replace('ข้อมูลล่าสุด', '').trim().split('\n')[0];

        // Extract data from the table
        const data = [];
        $('.table-responsive table tbody tr').each((index, element) => {
            const columns = $(element).find('td');
            const row = {
                symbol: $(columns[0]).text().trim(),
                open: $(columns[1]).text().trim(),
                high: $(columns[2]).text().trim(),
                low: $(columns[3]).text().trim(),
                last: $(columns[4]).text().trim(),
                change: $(columns[5]).text().trim(),
                percentChange: $(columns[6]).text().trim(),
                bid: $(columns[7]).text().trim(),
                offer: $(columns[8]).text().trim(),
                volume: $(columns[9]).text().trim(),
                value: $(columns[10]).text().trim()
            };
            data.push(row);
        });

        console.log(`Total rows scraped: ${data.length}`);

        const formattedDate = moment(date, 'DD MMM YYYY HH:mm:ss', 'th').startOf('day').toDate();
        const convertedDate = new Date(formattedDate);
        convertedDate.setDate(convertedDate.getDate() + 1);

        const dataToSend = {
            date: convertedDate,
            data: data
        }
        
        return dataToSend;
  
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
}

const test = async (req, res) => {
    try {
        const scrappedData = await scrapeData();
        res.status(200).json({ isError: false, scrappedData });
    } catch (err) {
        res.status(500).json({ isError: true, msg: 'Internal Server Error 500' });
        console.log(err);
    }
}

const runWebScrape = async () => {
    try {
        const scrappedData = await scrapeData();
        
        const existingDate = await prisma.stock.findFirst({
            where: {
                date: scrappedData.date
            }
        });

        function checkChange(value) {
            const changeValue = parseFloat(value);
          
            if (isNaN(changeValue)) {
              return true;
            }
          
            return changeValue >= 0;
        }

        if (!existingDate) {
            await prisma.stock.create({
                data: {
                    date: scrappedData.date,
                    data: scrappedData.data
                }
            });

            for (const thisData of scrappedData.data) {
    
                const thisDataCount = await prisma.count.findFirst({
                    where: {
                        symbol: thisData.symbol
                    }
                });
    
                if (checkChange(thisData.change)) {
                    // ค่าบวก
                    if (thisDataCount) {
                        await prisma.count.delete({
                            where: {
                                id: thisDataCount.id
                            }
                        });
                    }
                } else {
                    // ค่าลบ
                    if (thisDataCount) {
                        if (Number(thisDataCount.count) + 1 >= 3 && thisData.symbol && thisData.symbol !== '') {
                            await sendMsgController(`ขณะนี้หุ้น ${thisData.symbol} ได้ติดต่อกันครบ ${Number(thisDataCount.count) + 1} ครั้งแล้ว กรุณาตรวจสอบ`);
                        }
    
                        await prisma.count.update({
                            where: {
                                id: thisDataCount.id
                            },
                            data: {
                                count: {
                                    increment: 1
                                }
                            }
                        });
                    } else {
                        await prisma.count.create({
                            data: {
                                symbol: thisData.symbol,
                                count: 1
                            }
                        });
                    }
                }
            }

            console.log('Data Inserted!');
            await sendMsgController('ทำการเช็คข้อมูลใหม่เรียบร้อย: เพิ่มข้อมูลลงฐานข้อมูลแล้ว');
        } else {
            console.log('No Data Inserted!');
            await sendMsgController('ทำการเช็คข้อมูลใหม่เรียบร้อย: ไม่มีข้อมูลใหม่');
        }

    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    scrapeData,
    test,
    runWebScrape
};
