"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.PublicUser = exports.Request = exports.Room = exports.User = exports.Message = exports.Circle = exports.Arc = void 0;
var _1 = require(".");
var Request = /** @class */ (function () {
    function Request(type, sid, request) {
        this.type = type;
        this.request = request;
        this.request.sid = sid;
        this.rid = Math.floor(Math.random() * 1000000) + Number(Date.now());
    }
    return Request;
}());
exports.Request = Request;
var Room = /** @class */ (function () {
    function Room() {
    }
    Room.prototype.getMessages = function (arc) {
        var ref = _1.db.ref("messages/" + arc ? "/arcs/" : "/circles/" + this.id);
        var messages = [];
        ref.once('value', function (snapshot) {
            snapshot = snapshot.val();
            for (var msg in snapshot) {
                messages.push(msg);
            }
            return messages;
        });
    };
    return Room;
}());
exports.Room = Room;
var User = /** @class */ (function () {
    function User() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (args[0] instanceof User) {
            // Handle the case where the first argument is an instance of User
            var user = args[0];
            this.displayName = user.displayName;
            this.email = user.email;
            this.uid = user.uid;
            this.photoURL = user.photoURL;
            this.arcs = user.arcs;
            this.circles = user.circles;
            this.flags = user.flags;
            this.requests = user.requests;
        }
        else if (args.length == 3) {
            this.displayName = args[0];
            this.email = args[1];
            this.photoURL = args[2];
        }
        else if (args.length == 7) { // not really meant for use, just in case needed
            this.displayName = args[0];
            this.email = args[1];
            this.photoURL = args[2];
            this.arcs = args[3];
            this.circles = args[4];
            this.flags = args[5];
            this.requests = args[6];
        }
        else if (args.length = 1) {
            this.uid = args[0];
            this.refreshUser();
        }
    }
    // entirely replaces local user object with user object from database
    User.prototype.refreshUser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ref, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.uid == null || this.uid == '') {
                            console.error("uid is null");
                            return [2 /*return*/, false];
                        }
                        ref = _1.db.ref("/users/" + this.uid);
                        return [4 /*yield*/, ref.once('value')];
                    case 1:
                        data = _a.sent();
                        data = data.val();
                        this.displayName = data.displayName;
                        this.email = data.email;
                        this.photoURL = data.photoURL;
                        this.arcs = data.arcs;
                        this.circles = data.circles;
                        this.flags = data.flags;
                        this.requests = this.requests;
                        return [2 /*return*/];
                }
            });
        });
    };
    // entirely replaces the user object on database with local user
    User.prototype.updateUser = function () {
        var ref = _1.db.ref("/users/" + this.uid);
        ref.set(this);
    };
    // THIS OBJECT SHOULD VERY MUCH BE SANITIZED..
    User.prototype.addRequest = function (sid, type, request) {
        var r = new Request(type, sid, request);
        this.requests.push(r);
        this.updateUser();
        return true;
    };
    return User;
}());
exports.User = User;
var Circle = /** @class */ (function (_super) {
    __extends(Circle, _super);
    // takes either 1 or 2 args; if 1 arg, circle assumes arg is ID number and gets circle from db; if 2
    // args, constructor makes new circle with first arg being name and second arg being uid
    function Circle() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _this = _super.call(this) || this;
        if (args.length == 2) {
            _this.name = args[0];
            _this.id = Math.floor(Math.random() * 1000000) + Number(Date.now());
            var u = new User(args[1]);
            _this.members = [u];
            _this.admin = [u];
            _this.valid = true;
            _this.updateCircle();
        }
        if (args.length == 1) {
            _this.id = args[0];
            _this.refreshCircle();
        }
        return _this;
    }
    Circle.prototype.addUserToCircle = function (uid, sid) {
        if (!this.admin.some(function (member) { return member.uid == uid; })) {
            return null;
        }
        var u = new User(sid);
        this.members.push(u);
        this.updateCircle();
        u.circles.push({ id: this.id, name: this.name, type: "circle" });
        u.updateUser();
    };
    Circle.prototype.removeUserFromCircle = function (uid, sid) {
        var _this = this;
        if (!this.admin.some(function (member) { return member.uid === uid; })) {
            return null;
        }
        this.members = this.members.filter(function (member) { return member.uid !== sid; });
        var u = new User(sid);
        u.circles = u.circles.filter(function (circle) { return circle.id !== _this.id; });
        u.updateUser();
        this.updateCircle();
    };
    Circle.prototype.updateCircle = function () {
        var ref = _1.db.ref("/circles/" + this.id);
        ref.set(this);
    };
    Circle.prototype.refreshCircle = function () {
        var _this = this;
        if (this.id == null || this.id == 0) {
            console.error("id is null");
            return false;
        }
        var ref = _1.db.ref("/circles/" + this.id);
        ref.once('value', function (data) {
            data = data.val();
            _this.name = data.name;
            _this.members = data.members;
            _this.admin = data.admin;
            _this.valid = data.valid;
        });
    };
    return Circle;
}(Room));
exports.Circle = Circle;
var PublicUser = /** @class */ (function () {
    function PublicUser(u) {
        this.displayName = u.displayName;
        this.email = u.email;
        this.uid = u.uid;
        this.photoURL = u.photoURL;
    }
    return PublicUser;
}());
exports.PublicUser = PublicUser;
var Arc = /** @class */ (function (_super) {
    __extends(Arc, _super);
    function Arc() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _this = _super.call(this) || this;
        if (args.length == 2) {
            _this.id = Math.floor(Math.random() * 1000000) + Number(Date.now());
            var u1 = new User(args[0]);
            _this.members = [u1];
            _this.valid = true;
            var u2 = new User(args[1]);
            if (!u2.addRequest(u1.uid, "new Arc", {}))
                _this.valid = false;
        }
        if (args.length == 1) {
            _this.id = args[0];
            _this.refreshArc();
            var r = _1.db.ref("/arcs/" + _this.id);
            r.set(_this);
        }
        return _this;
    }
    Arc.prototype.refreshArc = function () {
        var _this = this;
        var ref = _1.db.ref("/circles/" + this.id);
        ref.once('value', function (data) {
            data = data.val();
            _this.members = data.members;
            _this.valid = data.valid;
        });
    };
    Arc.prototype.deleteArc = function (uid) {
        var _this = this;
        if (!this.members.some(function (member) { return member.uid === uid; })) {
            return null;
        }
        this.members = this.members.filter(function (member) { return member.uid !== uid; });
        var sid = this.members[0];
        var u = new User(sid);
        u.arcs = u.arcs.filter(function (arc) { return arc.id !== _this.id; });
        u.updateUser();
        var r = _1.db.ref("/arcs/" + this.id);
        r.set(null);
    };
    return Arc;
}(Room));
exports.Arc = Arc;
var Message = /** @class */ (function () {
    function Message(content, author, arc, rid) {
        this.id = Math.floor(Math.random() * 1000000) + Number(Date.now());
        this.author = author;
        this.date = String(new Date());
        this.arc = arc;
        this.rid = rid;
        this.updateMessage(content, author.uid); // will update message in server
    }
    Message.prototype.updateMessage = function (content, uid) {
        if (this.author.uid != uid)
            return null;
        this.content = content;
        var ref = _1.db.ref(this.arc ? "/arcs/" : "/circles/" + this.rid + "/messages/" + this.id);
        ref.set(this);
    };
    Message.prototype.deleteMessage = function (uid) {
        if (this.author.uid != uid)
            return null;
        var ref = _1.db.ref(this.arc ? "/arcs/" : "/circles/" + this.rid + "/messages/" + this.id);
        ref.set(null);
    };
    return Message;
}());
exports.Message = Message;
