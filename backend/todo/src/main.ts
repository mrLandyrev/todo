import express from "express"
import pg from "pg"
import { v4 } from "uuid"


const db = new pg.Client({
    "host": "db",
    "password": "very-strong-password",
    "user": "postgres",
    "database": "postgres"
});
await db.connect();
await db.query("CREATE TABLE IF NOT EXISTS todos (id UUID not null, author UUID not null, text TEXT not null, primary key (id))");

const app = express();

type UserData = {
    hasRole: (role: string) => boolean;
    id: string;
}

const parseRequestUserData = (req: express.Request): UserData => ({
    hasRole: (role: string) => (req.headers['x-user-roles'] as string).split(", ").some(x => x === role),
    id: req.headers["x-user-id"] as string,
})

app.post("/", express.json(), async (req, res) => {
    const userData = parseRequestUserData(req)
    const todo = {
        id: v4(),
        author: userData.id,
        text: req.body.text,
    }

    await db.query(`INSERT INTO todos (id, author, text) VALUES ('${todo.id}', '${todo.author}', ${pg.escapeLiteral(todo.text)})`);
    res.send(todo)
});

app.delete("/:id", async (req, res) => {
    const userData = parseRequestUserData(req)

    const id = req.params.id;

    let query = `DELETE FROM todos WHERE 'id = ${pg.escapeLiteral(id)}`

    if (!userData.hasRole('admin')) {
        query += ` AND author = ${pg.escapeLiteral(userData.id)}`
    }

    const result = await db.query(query)
    if (result.rowCount == 0) {
        res.status(404).send()
        return;
    }

    res.send();
});

app.get("/", async (req, res) => {
    const userData = parseRequestUserData(req)
    
    let author = userData.id;

    if (!!req.query['author'] && userData.hasRole("admin")) {
        author = req.query['author'] as string
    }
    

    const list = await db.query(`SELECT id, text FROM todos WHERE author = ${pg.escapeLiteral(author)}`);
    res.send(list.rows.map(todo => ({
        id: todo.id,
        text: todo.text,
    })));
});

app.listen(3000, () => console.log("started"));