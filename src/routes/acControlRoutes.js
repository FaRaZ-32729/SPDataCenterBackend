const express = require("express");
const { setAcAuto, setAcManual } = require("../controllers/acControlController");
const router = express.Router();

router.post("/auto-control", setAcAuto);
router.post("/manual-control", setAcManual);

module.exports = router;
