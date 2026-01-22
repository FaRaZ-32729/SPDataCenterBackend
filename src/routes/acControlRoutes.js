const express = require("express");
const setAcControl = require("../controllers/acControlController");
const router = express.Router();

router.post("/control", setAcControl);

module.exports = router;
