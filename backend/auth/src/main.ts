import express from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import pg from "pg";
import argon2 from "argon2";
import { v4 } from "uuid"


const db = new pg.Client({
    "host": "db",
    "password": "very-strong-password",
    "user": "postgres",
    "database": "postgres"
});
(async () => {
    await db.connect();
    await db.query("CREATE TABLE IF NOT EXISTS users (id UUID not null, login varchar(255) not null unique, password_hash varchar(255) not null, roles varchar(255), primary key (id))");
})();

const privateKey = fs.readFileSync("keys/private.key");

const app = express();

type TokensPair = {
    accessToken: string;
    refreshToken: string;
}

type TokenPayload = {
    id: string;
    roles: string[];
};

const verifyWithDefaultOptions = async (token: string): Promise<boolean> => {
    return new Promise((res) => {
        try {
            jwt.verify(token, privateKey)
            res(true)
        } catch {
            res(false)
        }
    });
}
const generateTokensForUser = async (payload: TokenPayload): Promise<TokensPair> => {
    return {
        accessToken: jwt.sign(payload, privateKey, { expiresIn: "10m", issuer: "me" }),
        refreshToken: jwt.sign({ id: payload.id, type: "prefresh" }, privateKey, { expiresIn: "2d", issuer: "me" }),
    }
}

app.post("/register", express.json(), async (req, res) => {
    try {
        const user = {
            id: v4(),
            login: req.body.login,
            passwordHash: await argon2.hash(req.body.password, { hashLength: 50 }),
        };
    
        try {
            await db.query(`INSERT INTO users (id, login, password_hash, roles) values ('${user.id}', '${user.login}', '${user.passwordHash}', 'user')`)
        } catch {
            res.status(400).send()
            return
        }
    
        res.send(await generateTokensForUser({ id: user.id, roles: ["user"] }));
    } catch {
        res.status(500).send()
    }
});

app.post("/login", express.json(), async (req, res) => {
    try {
        const user = {
            login: req.body.login,
            password: req.body.password,
        };
        
        const userInDb = await db.query(`SELECT id, roles, password_hash FROM users WHERE login = '${user.login}'`)

        if (userInDb.rowCount != 1) {
            res.status(401).send()
            return
        }

        const isValid = await argon2.verify(userInDb.rows[0].password_hash, user.password);

        if (!isValid) {
            res.status(401).send()
            return
        }
    
        res.send(await generateTokensForUser({ id: userInDb.rows[0].id, roles: userInDb.rows[0].roles.split(",") }));
    } catch {
        res.status(500).send()
    }
});

app.post("/refresh", express.json(), async (req, res) => {
    const isValid = await verifyWithDefaultOptions(req.body.refreshToken)
    if (!isValid) {
        res.status(401).send()
        return
    }

    const payload = jwt.decode(req.body.refreshToken) as TokenPayload

    const userInDb = await db.query(`SELECT id, roles FROM users WHERE id = '${payload.id}'`)

    if (userInDb.rowCount != 1) {
        res.status(401).send()
        return
    }

    res.send(await generateTokensForUser({ id: userInDb.rows[0].id, roles: userInDb.rows[0].roles.split(',') }));
});

app.get("/parse", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "")
    if (!token) {
        res.status(401).send();
        return;
    }

    const isValid = await verifyWithDefaultOptions(token)
    if (!isValid) {
        res.status(401).send()
        return
    }

    const payload = jwt.decode(token) as TokenPayload
    console.log(payload);

    res.setHeader('X-User-Id', payload.id);
    res.setHeader('X-User-Roles', payload.roles);

    res.send();
});

app.listen(3000, () => console.log('started'));