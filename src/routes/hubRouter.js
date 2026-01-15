const express = require("express");
const { createHub } = require("../controllers/hubController");

const router = express.Router();

router.post("/add", createHub);

module.exports = router;
