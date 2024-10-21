"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initServer = initServer;
var socket_io_1 = require("socket.io");
var http_1 = require("http");
var _1 = require(".");
var classes_1 = require("./classes");
var express = require('express');
function getUIDfromToken(token) {
    return __awaiter(this, void 0, void 0, function () {
        var u, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, _1.auth.verifyIdToken(token)];
                case 1:
                    u = _a.sent();
                    return [2 /*return*/, u.uid];
                case 2:
                    error_1 = _a.sent();
                    console.error(error_1);
                    throw new Error("User ID could not be verified.");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function initServer() {
    var _this = this;
    console.log("initalizing SocketIO server");
    var io = newSocketServer();
    io.on('connection', function (socket) { return __awaiter(_this, void 0, void 0, function () {
        var uid, error_2, u;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("New connection");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    console.log("getting user UID");
                    console.log(socket.handshake.auth.token);
                    return [4 /*yield*/, getUIDfromToken(socket.handshake.auth.token)];
                case 2:
                    uid = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("There has been an error:", error_2);
                    socket.emit("error", error_2);
                    socket.disconnect();
                    return [2 /*return*/];
                case 4:
                    u = new classes_1.User(uid);
                    return [4 /*yield*/, u.refreshUser()];
                case 5:
                    _a.sent();
                    console.log("emitting user data event");
                    socket.emit('user data', JSON.stringify(u));
                    // room join listener; should probably add feature to add members from get
                    socket.on('new circle', function (token, name) { return __awaiter(_this, void 0, void 0, function () {
                        var uid, error_3, c;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, getUIDfromToken(token)];
                                case 1:
                                    uid = _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_3 = _a.sent();
                                    socket.emit("error", error_3);
                                    return [2 /*return*/];
                                case 3:
                                    c = new classes_1.Circle(name, uid);
                                    socket.emit("success", { type: "new circle", id: c.id });
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    // need to add new Arc system
                    socket.on('join room', function (token, id, arc) { return __awaiter(_this, void 0, void 0, function () {
                        var uid, t;
                        return __generator(this, function (_a) {
                            try {
                                uid = getUIDfromToken(token);
                            }
                            catch (error) {
                                socket.emit("error", error);
                                return [2 /*return*/];
                            }
                            t = arc ? new classes_1.Arc(id) : new classes_1.Circle(id);
                            if (t.members.some(function (member) { return member.uid === uid; })) {
                                socket.join(arc ? "arc_" + id : "circle_" + id);
                                socket.emit('success', { type: "join room", room: arc ? "arc_" + id : "circle_" + id });
                            }
                            else {
                                socket.emit('error', { message: 'User not found in the room' });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    socket.on('new message', function (token, rid, arc, content) { return __awaiter(_this, void 0, void 0, function () {
                        var uid, room, u, msg;
                        return __generator(this, function (_a) {
                            try {
                                uid = getUIDfromToken(token);
                            }
                            catch (error) {
                                socket.emit("error", error);
                                return [2 /*return*/];
                            }
                            room = arc ? new classes_1.Arc(rid) : new classes_1.Circle(rid);
                            if (!room.members.some(function (member) { return member.uid === uid; })) {
                                socket.emit("error", { message: "User not a member of room" });
                                return [2 /*return*/];
                            }
                            u = new classes_1.PublicUser(new classes_1.User(uid));
                            msg = new classes_1.Message(content, u, arc, rid);
                            socket.to(arc ? "arc_" : "circle_" + rid).emit("new message", msg);
                            return [2 /*return*/];
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    }); });
}
function newSocketServer() {
    // add cors config here
    var server = (0, http_1.createServer)(express());
    server.listen(3000, function () {
        console.log("listening on port 3000");
    });
    return new socket_io_1.Server(server, {
        cors: {
            origin: "http://localhost:3001",
            methods: ["GET", "POST"]
        }
    });
}
