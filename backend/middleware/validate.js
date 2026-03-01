/**
 * Validation middleware factory using Joi schemas.
 *
 * Usage:
 *   router.post('/assets', validate({ body: createAssetSchema }), handler)
 *
 * @param {{ body?, query?, params? }} schemas  Joi schemas for each part of the request
 */
function validate(schemas) {
    return (req, res, next) => {
        const errors = [];

        for (const [key, schema] of Object.entries(schemas)) {
            const { error, value } = schema.validate(req[key], {
                abortEarly: false,
                stripUnknown: true,
                allowUnknown: false,
            });
            if (error) {
                errors.push(...error.details.map(d => ({ field: d.path.join('.'), message: d.message })));
            } else {
                req[key] = value; // Replace with stripped/coerced value
            }
        }

        if (errors.length > 0) {
            return res.status(422).json({ error: 'Validation failed', details: errors });
        }

        next();
    };
}

module.exports = validate;
