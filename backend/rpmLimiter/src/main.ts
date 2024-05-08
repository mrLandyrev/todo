import express from "express";
import redis from "redis";
import pg from "pg";

const redisClient = await redis.createClient({
    url: "redis://default:redispw@redis:6379"
}).connect();


const dbClient = new pg.Client({
    "host": "db",
    "password": "very-strong-password",
    "user": "postgres",
    "database": "postgres"
});
await dbClient.connect()
await dbClient.query(`
    CREATE TABLE IF NOT EXISTS limitations
    (
        user_id UUID not null,
        method VARCHAR(255) not null,
        url VARCHAR(255) not null,
        max_requests INT not null,
        constraint unique_records unique (user_id, method, url)
    )
`)

type UserData = {
    hasRole: (role: string) => boolean;
    id: string;
    encode: (content: string) => string;
    decode: (content: string) => string;
}

const parseRequestUserData = (req: express.Request): UserData => ({
    hasRole: (role: string) => (req.headers['x-user-roles'] as string).split(", ").some(x => x === role),
    id: req.headers["x-user-id"] as string,
    encode: (content: string) => {
        const keyContent = req.headers['x-key-content'] as string;
        return content.split("").map((x, i) => (x + keyContent[i % keyContent.length])).join("");
    },
    decode: (content: string) => {
        return content.split("").map((x, i) => i % 2 ? "" : x).join("");
    },
})

const app = express();

app.get("/internal", async (req, res) => {
    const id = req.headers["x-user-id"] as string
    const prefix = new URL("http://localhost" + req.headers["x-forwarded-uri"] as string).pathname;
    const method = req.headers["x-forwarded-method"] as string
    const key = `${id}-${method}-${prefix}`
    console.log(key);
    //default max requests
    let max_requests = 10;
    const limitation = await dbClient.query(`
        SELECT max_requests
        FROM limitations
        WHERE 1=1
        AND user_id = ${pg.escapeLiteral(id)}
        AND method = ${pg.escapeLiteral(method)}
        AND url = ${pg.escapeLiteral(prefix)}
    `)
    if (limitation.rowCount === 1) {
        max_requests = limitation.rows[0].max_requests;
    }
    await redisClient.set(key, 0, { NX: true, EX: 60 })
    await redisClient.incr(key)
    const rpm = await redisClient.get(key);
    if (!!rpm && +rpm > max_requests) {
        res.status(429).send()
        return
    }
    res.send()
});

app.post("/", express.json(), async (req, res) => {
    const userData = parseRequestUserData(req);

    if (!userData.hasRole("admin")) {
        res.status(403).send();
        return;
    }

    const limitation = {
        user_id: userData.decode(req.body.userId),
        method: userData.decode(req.body.method),
        url: userData.decode(req.body.url),
        max_requests: req.body.max_requests,
    }

    await dbClient.query(`
        INSERT INTO limitations(
            user_id,
            method,
            url,
            max_requests
        ) VALUES (
            ${pg.escapeLiteral(limitation.user_id)},
            ${pg.escapeLiteral(limitation.method)},
            ${pg.escapeLiteral(limitation.url)},
            ${limitation.max_requests}
        ) ON CONFLICT ON CONSTRAINT unique_records DO UPDATE
        SET max_requests = ${limitation.max_requests}
    `);

    res.send();
});

app.listen(3000, () => console.log("started"))