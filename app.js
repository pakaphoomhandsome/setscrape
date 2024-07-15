// const https = require('https');  // Require the 'http' module
const http = require('http');  // Require the 'http' module

require('dotenv').config()

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());

var cors = require('cors');
app.use(cors({
  origin: ["*", "http://localhost:3000"]
}));

const cron = require("node-cron");

// const privateKey = fs.readFileSync('C:/xampp/apache/ssl/private.key', 'utf8');
// const certificate = fs.readFileSync('C:/xampp/apache/ssl/certificate.crt', 'utf8');
// const ca = fs.readFileSync('C:/xampp/apache/ssl/ca_bundle.crt', 'utf8'); // หรือจะใช้ CA bundle ของคุณ

// const credentials = { key: privateKey, cert: certificate, ca: ca };

// const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);

httpServer.listen(process.env.PORT, function () {
  console.log('CORS-enabled web server listening on port', process.env.PORT);
}); 


app.get('/', async (req, res) => {
  try {
    res.send('API SYSTEM');
  } catch (err) {
    console.log('Internal Error 500', err);
    res.status(500).send('Internal Server Error');
  }
});

const { sendMsgController } = require('./controllers/sendlinemsg.controller');

app.get('/welcome', async (req, res) => {
    try {
        await sendMsgController('ยินดีต้อนรับเข้าสู่แอพพลิเคชั่น เศรษฐีภควัต ฉันจะรายงานคุณทุก 1 ทุ่มเมื่อมีการเปลี่ยนแปลงหุ้น แอพนี้สร้างโดย ภคภูมิสุดหล่อ');
        res.status(200).send({ isError: false });
    } catch (err) {
      console.log('Internal Error 500', err);
      res.status(500).send('Internal Server Error');
    }
});

const { runWebScrape } = require('./controllers/webscrape.controller');

cron.schedule('*/30 * * * * *', async () => {
    // await runWebScrape();
    console.log('Running a task every day at 1 AM');
});
const scrapeRouter = require("./routes/webscrape.route");


app.use("/scrape", scrapeRouter);

