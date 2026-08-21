"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCatalogOwnership = void 0;
const database_1 = require("../config/database");
const checkCatalogOwnership = async (req, res, next) => {
    try {
        const catalogId = parseInt(req.params.id);
        const vendorId = req.vendor.vendorId;
        const [rows] = await database_1.pool.execute('SELECT vendor_id FROM catalog WHERE catalog_id = ?', [catalogId]);
        const catalog = rows[0];
        if (!catalog) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }
        if (catalog.vendor_id !== vendorId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to modify this item'
            });
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking ownership',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.checkCatalogOwnership = checkCatalogOwnership;
