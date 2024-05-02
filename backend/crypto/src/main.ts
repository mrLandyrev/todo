import express from "express"
import redis from "redis"
import pg from "pg"
import { v4 } from "uuid";

const redisClient = await redis.createClient({
    url: "redis://default:redispw@redis:6379"
}).connect();

const dbClient = new pg.Client({
    "host": "db",
    "password": "very-strong-password",
    "user": "postgres",
    "database": "postgres"
});
await dbClient.connect();
await dbClient.query("CREATE TABLE IF NOT EXISTS crypto (id UUID not null, author UUID not null, key TEXT not null, primary key (id))");

const app = express();

app.post("/", express.json(), async (req, res) => {
    const author = req.headers["x-user-id"] as string
    const id = v4();
    const key = req.body.key;

    await dbClient.query(`insert into crypto (id, author, key) values (${pg.escapeLiteral(id)}, ${pg.escapeLiteral(author)}, ${pg.escapeLiteral(key)})`);

    res.send({
        id: id,
    });
});

app.get("/:id", async (req, res) => {
    const author = req.headers["x-user-id"] as string
    const id = req.params.id;
    const key = await dbClient.query(`SELECT key FROM crypto WHERE author = ${pg.escapeLiteral(author)} and id = ${pg.escapeLiteral(id)}`);
    // if (key != )
    res.send()
});

app.listen(3000, () => console.log("started"))