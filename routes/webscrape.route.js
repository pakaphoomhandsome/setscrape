const express = require("express");
const { 
    test,
    insertData
} = require("../controllers/webscrape.controller");

const scrapeRouter = express.Router();

scrapeRouter.post("/", test);
scrapeRouter.post("/insert", insertData);

module.exports = scrapeRouter;

