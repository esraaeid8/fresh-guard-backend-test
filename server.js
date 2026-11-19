
require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("path");
const supervisorRoutes = require("./routes/supervisor");
const qualityRoutes = require("./routes/quality");

const app = express();
const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || "uploads");

// قراءة بيانات JSON
app.use(express.json());

// عرض الصور المرفوعة
app.use("/uploads", express.static(uploadDirectory));

// الصفحة الرئيسية
app.get("/", (req, res) => {
    res.send("FreshGuard API is running!");
});

// ربط مسارات المشرف ومدير الجودة للموبايل
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/quality", qualityRoutes);

// التعامل مع الأخطاء
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "Image is too large. Maximum size is 5MB."
            });
        }

        return res.status(400).json({
            message: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            message: err.message
        });
    }

    next();
});

// تصدير التطبيق للاختبارات
module.exports = app;

// تشغيل السيرفر عند تشغيل هذا الملف مباشرة
if (require.main === module) {
    const port = Number(process.env.PORT || 3000);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535");
    }

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}
