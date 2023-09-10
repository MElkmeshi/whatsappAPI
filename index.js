"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var baileys_1 = __importStar(require("@whiskeysockets/baileys"));
var fs_1 = require("fs");
var pino_1 = __importDefault(require("pino"));
var qr_image_1 = __importDefault(require("qr-image"));
var express_1 = __importDefault(require("express"));
var rimraf_1 = require("rimraf");
var path_1 = require("path");
var express_fileupload_1 = __importDefault(require("express-fileupload"));
var PORT = process.env.PORT || 3000;
var baileyGenerateImage = function (base64, name) {
    if (name === void 0) { name = "qr.png"; }
    return __awaiter(void 0, void 0, void 0, function () {
        var PATH_QR, qr_svg, writeFilePromise;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    PATH_QR = "".concat(process.cwd(), "/").concat(name);
                    qr_svg = qr_image_1.default.image(base64, { type: "png", margin: 4 });
                    writeFilePromise = function () {
                        return new Promise(function (resolve, reject) {
                            var file = qr_svg.pipe((0, fs_1.createWriteStream)(PATH_QR));
                            file.on("finish", function () { return resolve(true); });
                            file.on("error", reject);
                        });
                    };
                    return [4 /*yield*/, writeFilePromise()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
var BaileysProvider = /** @class */ (function () {
    function BaileysProvider(name) {
        var _this = this;
        this.initBailey = function () { return __awaiter(_this, void 0, void 0, function () {
            var NAME_DIR_SESSION, _a, state, saveCreds, sock_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        NAME_DIR_SESSION = "".concat(this.name, "_sessions");
                        return [4 /*yield*/, (0, baileys_1.useMultiFileAuthState)(NAME_DIR_SESSION)];
                    case 1:
                        _a = _b.sent(), state = _a.state, saveCreds = _a.saveCreds;
                        this.saveCredsGlobal = saveCreds;
                        try {
                            sock_1 = (0, baileys_1.default)({
                                printQRInTerminal: false,
                                auth: state,
                                browser: baileys_1.Browsers.macOS("Desktop"),
                                syncFullHistory: false,
                                logger: (0, pino_1.default)({ level: "fatal" }),
                            });
                            sock_1.ev.on("connection.update", function (update) { return __awaiter(_this, void 0, void 0, function () {
                                var connection, lastDisconnect, qr, statusCode, PATH_BASE;
                                var _a, _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            connection = update.connection, lastDisconnect = update.lastDisconnect, qr = update.qr;
                                            statusCode = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode;
                                            if (connection === "close") {
                                                if (statusCode !== baileys_1.DisconnectReason.loggedOut) {
                                                    this.initBailey();
                                                }
                                                if (statusCode === baileys_1.DisconnectReason.loggedOut) {
                                                    PATH_BASE = (0, path_1.join)(process.cwd(), NAME_DIR_SESSION);
                                                    (0, rimraf_1.rimraf)(PATH_BASE);
                                                    this.initBailey();
                                                }
                                            }
                                            if (connection === "open") {
                                                console.log("ready");
                                                this.initBusEvents(sock_1);
                                            }
                                            if (!qr) return [3 /*break*/, 2];
                                            return [4 /*yield*/, baileyGenerateImage(qr, "".concat(this.name, ".qr.png"))];
                                        case 1:
                                            _c.sent();
                                            _c.label = 2;
                                        case 2: return [2 /*return*/];
                                    }
                                });
                            }); });
                            sock_1.ev.on("creds.update", function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, saveCreds()];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                        }
                        catch (e) {
                            console.log(e);
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        this.initBusEvents = function (_sock) {
            _this.mysock = _sock;
        };
        this.name = name;
        this.mysock = undefined;
        this.saveCredsGlobal = undefined;
        this.initBailey().then();
    }
    return BaileysProvider;
}());
var bailey = new BaileysProvider("melkmeshi");
var app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_fileupload_1.default)());
app.get("/", function (req, res) {
    var _a;
    if (bailey.mysock) {
        (_a = bailey.mysock) === null || _a === void 0 ? void 0 : _a.sendMessage("218910441322@s.whatsapp.net", { text: "hi" });
        res.send({ message: "sent" });
    }
    else {
        console.log("Sock is not avalible");
        res.send({ message: "Sock is not avalible" });
    }
});
app.get("/allgroups", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!bailey.mysock) return [3 /*break*/, 2];
                return [4 /*yield*/, ((_a = bailey.mysock) === null || _a === void 0 ? void 0 : _a.groupFetchAllParticipating())];
            case 1:
                data = _b.sent();
                res.send({ data: data });
                return [3 /*break*/, 3];
            case 2:
                console.log("Sock is not avalible");
                res.send({ message: "Sock is not avalible" });
                _b.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/getgroubid/:name", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, id, _i, _a, _b, key, value;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!bailey.mysock) return [3 /*break*/, 2];
                return [4 /*yield*/, ((_c = bailey.mysock) === null || _c === void 0 ? void 0 : _c.groupFetchAllParticipating())];
            case 1:
                data = _d.sent();
                id = "";
                for (_i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
                    _b = _a[_i], key = _b[0], value = _b[1];
                    if (value.subject.trim().toLowerCase() ==
                        req.params.name.trim().toLowerCase()) {
                        console.log(key);
                        id = key;
                    }
                }
                res.send({ id: id });
                return [3 /*break*/, 3];
            case 2:
                res.send({ message: "Sock is not avalible" });
                _d.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/getgroubs", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, groups, _i, _a, _b, key, value;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!bailey.mysock) return [3 /*break*/, 2];
                return [4 /*yield*/, ((_c = bailey.mysock) === null || _c === void 0 ? void 0 : _c.groupFetchAllParticipating())];
            case 1:
                data = _d.sent();
                groups = [];
                for (_i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
                    _b = _a[_i], key = _b[0], value = _b[1];
                    groups.push({ name: value.subject, id: key });
                }
                res.send(groups);
                return [3 /*break*/, 3];
            case 2:
                res.send({ message: "Sock is not avalible" });
                _d.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var phoneNumber, message, on, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!bailey.mysock) {
                    console.log("WhatsApp connection not established.");
                    return [2 /*return*/, res
                            .status(310)
                            .json({ message: "WhatsApp connection not established." })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                phoneNumber = req.body.phoneNumber || "218910441322";
                message = req.body.message || "hi";
                phoneNumber = phoneNumber
                    .replaceAll("+", "")
                    .replaceAll("-", "")
                    .replaceAll(" ", "")
                    .replaceAll("(", "")
                    .replaceAll(")", "");
                if (phoneNumber[3] === "0") {
                    phoneNumber = phoneNumber.slice(0, 3) + phoneNumber.slice(4);
                }
                return [4 /*yield*/, bailey.mysock.onWhatsApp(phoneNumber)];
            case 2:
                on = _a.sent();
                if (!(on.length > 0)) return [3 /*break*/, 4];
                console.log("Sending message to: ", phoneNumber);
                return [4 /*yield*/, bailey.mysock.sendMessage("".concat(phoneNumber, "@s.whatsapp.net"), {
                        text: message,
                    })];
            case 3:
                _a.sent();
                res.status(200).json({ message: "Message sent." });
                return [3 /*break*/, 5];
            case 4:
                console.log("User not found: ", phoneNumber);
                res.status(404).json({ message: "User not found." });
                _a.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                err_1 = _a.sent();
                console.log("Error: ", err_1);
                res
                    .status(500)
                    .json({ message: "Internel server error.", error: String(err_1) });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
app.post("/group", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var groupID, message, err_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                console.log(req.body);
                groupID = req.body.groupid;
                message = req.body.message || "hi";
                if (!groupID) {
                    res.status(400).json({ message: "Group id is required." });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, ((_a = bailey.mysock) === null || _a === void 0 ? void 0 : _a.sendMessage("".concat(groupID, "@g.us"), {
                        text: message,
                    }))];
            case 1:
                _b.sent();
                res.status(200).json({ message: "Message sent." });
                return [3 /*break*/, 3];
            case 2:
                err_2 = _b.sent();
                console.log("Error: ", err_2);
                res
                    .status(500)
                    .json({ message: "Internel server error.", error: String(err_2) });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/sendattchment", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.sendFile(__dirname + "/sendattchment.html");
        return [2 /*return*/];
    });
}); });
app.post("/sendvideo", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var video, phoneNumber, caption;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                video = req.files.video;
                phoneNumber = req.body.phoneNumber + "@s.whatsapp.net";
                caption = req.body.caption;
                return [4 /*yield*/, ((_a = bailey.mysock) === null || _a === void 0 ? void 0 : _a.sendMessage("".concat(phoneNumber), {
                        video: video.data,
                        caption: caption,
                        gifPlayback: false,
                    }))];
            case 1:
                _b.sent();
                res.send("ok");
                return [2 /*return*/];
        }
    });
}); });
app.post("/sendimage", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var image, phoneNumber, caption;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                image = req.files.image;
                phoneNumber = req.body.phoneNumber + "@s.whatsapp.net";
                caption = req.body.caption;
                return [4 /*yield*/, ((_a = bailey.mysock) === null || _a === void 0 ? void 0 : _a.sendMessage("".concat(phoneNumber), {
                        image: image.data,
                        caption: caption !== null && caption !== void 0 ? caption : "",
                    }))];
            case 1:
                _b.sent();
                res.send("ok");
                return [2 /*return*/];
        }
    });
}); });
app.post("/sendfile", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var file, phoneNumber;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                file = req.files.file;
                phoneNumber = req.body.phoneNumber + "@s.whatsapp.net";
                return [4 /*yield*/, ((_a = bailey.mysock) === null || _a === void 0 ? void 0 : _a.sendMessage("".concat(phoneNumber), {
                        document: file.data,
                        mimetype: file.mimetype,
                        fileName: file.name,
                    }))];
            case 1:
                _b.sent();
                res.send("ok");
                return [2 /*return*/];
        }
    });
}); });
app.listen(PORT, function () {
    console.log("Example app live in http://localhost:".concat(PORT));
});
