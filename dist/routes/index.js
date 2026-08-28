"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const publicRoutes_1 = __importDefault(require("./publicRoutes"));
const clientRoutes_1 = __importDefault(require("./clientRoutes"));
const vendorRoutes_1 = __importDefault(require("./vendorRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const router = (0, express_1.Router)();
// ─── PUBLIC ROUTES ────────────────────────────
router.use('/', publicRoutes_1.default);
// ─── CLIENT ROUTES ────────────────────────────
router.use('/client', clientRoutes_1.default);
// ─── VENDOR ROUTES ────────────────────────────
router.use('/vendor', vendorRoutes_1.default);
// ─── AUTH ROUTES ──────────────────────────────
router.use('/auth', authRoutes_1.default);
exports.default = router;
