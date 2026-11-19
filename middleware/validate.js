
const DEFAULT_ALLOWED_PRODUCTS = new Set([
    "apple",
    "banana",
    "grape",
    "orange",
    "peach",
    "pepper",
    "tomato"
]);

function getAllowedProducts() {
    const configuredProducts = process.env.ALLOWED_PRODUCTS;

    return configuredProducts
        ? new Set(
            configuredProducts
                .split(",")
                .map(product => product.trim().toLowerCase())
                .filter(Boolean)
        )
        : DEFAULT_ALLOWED_PRODUCTS;
}

function getInspectionValidationError(data) {
    const {
        product,
        status,
        confidence,
        needs_review,
        size_category,
        model_version,
        image_url,
        batch_id,
        created_at,
        line_id
    } = data || {};

    if (
        typeof product !== "string" ||
        !product.trim() ||
        typeof status !== "string" ||
        !status.trim() ||
        confidence === undefined ||
        confidence === null
    ) {
        return "Missing or invalid required fields";
    }

    if (!["good", "defective"].includes(status)) {
        return "status must be good or defective";
    }

    if (!getAllowedProducts().has(product.trim().toLowerCase())) {
        return "Unknown product type";
    }

    if (
        typeof confidence !== "number" ||
        !Number.isFinite(confidence) ||
        confidence < 0 ||
        confidence > 1
    ) {
        return "Confidence must be a number between 0 and 1";
    }

    if (
        needs_review !== undefined &&
        typeof needs_review !== "boolean"
    ) {
        return "needs_review must be true or false";
    }

    if (
        size_category !== undefined &&
        typeof size_category !== "string"
    ) {
        return "size_category must be a string";
    }

    if (
        model_version !== undefined &&
        typeof model_version !== "string"
    ) {
        return "model_version must be a string";
    }

    if (
        image_url !== undefined &&
        typeof image_url !== "string"
    ) {
        return "image_url must be a string";
    }

    if (
        batch_id !== undefined &&
        batch_id !== null &&
        batch_id !== "" &&
        (!Number.isInteger(batch_id) || batch_id <= 0)
    ) {
        return "batch_id must be a positive integer";
    }

    if (
        line_id !== undefined &&
        line_id !== null &&
        (!Number.isInteger(line_id) || line_id <= 0)
    ) {
        return "line_id must be a positive integer";
    }

    if (
        created_at !== undefined &&
        (
            typeof created_at !== "string" ||
            !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(created_at) ||
            !Number.isFinite(Date.parse(created_at))
        )
    ) {
        return "created_at must be a valid ISO 8601 timestamp";
    }

    return null;
}

function validateInspection(req, res, next) {
    const message = getInspectionValidationError(req.body);

    if (message) {
        return res.status(400).json({ message });
    }

    next();
}

function validateBatch(req, res, next) {
    const inspections = req.body && req.body.inspections;

    if (!Array.isArray(inspections) || inspections.length === 0) {
        return res.status(400).json({
            message: "inspections must be a non-empty array"
        });
    }

    for (const [index, item] of inspections.entries()) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            return res.status(400).json({
                message: `Inspection ${index + 1}: Invalid inspection data`
            });
        }

        const message = getInspectionValidationError(item);

        if (message) {
            return res.status(400).json({
                message: `Inspection ${index + 1}: ${
                    message === "Missing or invalid required fields"
                        ? "Invalid inspection data"
                        : message
                }`
            });
        }
    }

    next();
}

module.exports = {
    validateInspection,
    validateBatch,
    getInspectionValidationError
};
