"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.badRequest = badRequest;
exports.notFound = notFound;
exports.conflict = conflict;
function errorHandler(err, req, res, next) {
    console.error("[ERROR]", err);
    const status = err.status || 500;
    res.status(status).json({
        message: err.message || "Internal server error",
        ...(err.errors ? { errors: err.errors } : {}),
    });
}
function badRequest(message, errors) {
    const err = new Error(message);
    err.status = 400;
    if (errors)
        err.errors = errors;
    return err;
}
function notFound(message) {
    const err = new Error(message);
    err.status = 404;
    return err;
}
function conflict(message) {
    const err = new Error(message);
    err.status = 409;
    return err;
}
