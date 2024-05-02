"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const pg_1 = __importDefault(require("pg"));
const argon2_1 = __importDefault(require("argon2"));
const uuid_1 = require("uuid");
const db = new pg_1.default.Client({
    "host": "db",
    "password": "very-strong-password",
    "user": "postgres",
    "database": "postgres"
});
(async () => {
    await db.connect();
    await db.query("CREATE TABLE IF NOT EXISTS users (id UUID not null, login varchar(255) not null unique, password_hash varchar(255) not null, roles varchar(255), primary key (id))");
})();
const privateKey = fs_1.default.readFileSync("keys/private.key");
const app = (0, express_1.default)();
const verifyWithDefaultOptions = async (token) => {
    return new Promise((res) => {
        try {
            jsonwebtoken_1.default.verify(token, privateKey);
            res(true);
        }
        catch {
            res(false);
        }
    });
};
const generateTokensForUser = async (payload) => {
    return {
        accessToken: jsonwebtoken_1.default.sign(payload, privateKey, { expiresIn: "10m", issuer: "me" }),
        refreshToken: jsonwebtoken_1.default.sign({ id: payload.id, type: "prefresh" }, privateKey, { expiresIn: "2d", issuer: "me" }),
    };
};
app.post("/register", express_1.default.json(), async (req, res) => {
    try {
        const user = {
            id: (0, uuid_1.v4)(),
            login: req.body.login,
            passwordHash: await argon2_1.default.hash(req.body.password, { hashLength: 50 }),
        };
        try {
            await db.query(`INSERT INTO users (id, login, password_hash, roles) values ('${user.id}', '${user.login}', '${user.passwordHash}', 'user')`);
        }
        catch {
            res.status(400).send();
            return;
        }
        res.send(await generateTokensForUser({ id: user.id, roles: ["user"] }));
    }
    catch {
        res.status(500).send();
    }
});
app.post("/login", express_1.default.json(), async (req, res) => {
    try {
        const user = {
            login: req.body.login,
            password: req.body.password,
        };
        const userInDb = await db.query(`SELECT id, roles, password_hash FROM users WHERE login = '${user.login}'`);
        if (userInDb.rowCount != 1) {
            res.status(404).send();
            return;
        }
        const isValid = await argon2_1.default.verify(userInDb.rows[0].password_hash, user.password);
        if (!isValid) {
            res.status(401).send();
            return;
        }
        res.send(await generateTokensForUser({ id: userInDb.rows[0].id, roles: userInDb.rows[0].roles.split(",") }));
    }
    catch {
        res.status(500).send();
    }
});
app.post("/refresh", express_1.default.json(), async (req, res) => {
    const isValid = await verifyWithDefaultOptions(req.body.refreshToken);
    if (!isValid) {
        res.status(401).send();
        return;
    }
    const payload = jsonwebtoken_1.default.decode(req.body.refreshToken);
    const userInDb = await db.query(`SELECT id, roles FROM users WHERE id = '${payload.id}'`);
    if (userInDb.rowCount != 1) {
        res.status(401).send();
        return;
    }
    res.send(await generateTokensForUser({ id: userInDb.rows[0].id, roles: userInDb.rows[0].roles.split(',') }));
});
app.get("/parse", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        res.status(401).send();
        return;
    }
    const isValid = await verifyWithDefaultOptions(token);
    if (!isValid) {
        res.status(401).send();
        return;
    }
    const payload = jsonwebtoken_1.default.decode(token);
    res.setHeader('X-User-Id', payload.id);
    res.setHeader('X-User-Roles', payload.roles);
    res.send();
});
app.listen(3000, () => console.log('started'));
