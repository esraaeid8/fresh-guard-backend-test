const express = require("express");
const router = express.Router();
const qualityController = require("../controllers/qualityController");

router.get("/defects", qualityController.listDefects);
router.get("/needs-review", qualityController.listNeedsReview);
router.get("/alerts", qualityController.listAlerts);
router.get("/alerts/new", qualityController.newAlerts);
router.patch("/alerts/:id/read", qualityController.readAlert);
router.get("/stats/defects-by-type", qualityController.defectsByType);
router.get("/inspections/:id", qualityController.getInspection);

module.exports = router;