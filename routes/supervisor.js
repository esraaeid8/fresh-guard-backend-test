const express = require("express");
const router = express.Router();
const supervisorController = require("../controllers/supervisorController");

router.get("/inspections", supervisorController.getInspections);
router.get("/current-batch", supervisorController.getCurrentBatch);
router.get("/alerts", supervisorController.getAlerts);

module.exports = router;