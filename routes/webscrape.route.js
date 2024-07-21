const express = require("express");
const { 
    test,
    insertData,
    testNotify
} = require("../controllers/webscrape.controller");

const scrapeRouter = express.Router();

scrapeRouter.post("/", test);
scrapeRouter.post("/insert", insertData);
scrapeRouter.post("/testNotify", testNotify);

module.exports = scrapeRouter;

