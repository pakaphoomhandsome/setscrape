const express = require("express");
const { 
    test,
} = require("../controllers/webscrape.controller");

const scrapeRouter = express.Router();

scrapeRouter.post("/", test);

module.exports = scrapeRouter;

