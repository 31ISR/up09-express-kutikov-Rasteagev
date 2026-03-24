const express = require("express")
const db = require("./db")
const bcr = require("bcryptjs")
const app = express()
const SECRET = "dfgdgf"
const jwt = require("jsonwebtoken")
const res = require("express/lib/response")
app.use(express.json())
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization


    if (!authHeader) return res.status(401)
        .json({ error: "missing auth header" })
    const token = authHeader.split(" ")[1]
    if (!token) return res.status(401).json({ error: "wrong token format" })
    try {
        const decoded = jwt.verify(token, SECRET)
        req.user = decoded
        next()
    } catch (error) {
        console.error(error)

    }
}


app.get("/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all()
    console.log(users);

    return res.status(200).json(users)
})
app.get("/todos", (req, res) => {
    const todos = db.prepare("SELECT * FROM todos").all();
    res.status(200).json(todos);
});

app.get("/", (req, res) => {
    res.status(200).json({ message: "Bye dreem" })
})

app.post("/auth/signup", (req, res) => {
    const { email, name, password } = req.body
    try {
        if (!email || !name || !password)
            return res
                .status(400)
                .json({ error: "Не хватает папы" })
        const syncSalt = bcr.genSaltSync(10)
        const hashed = bcr.hashSync(password, syncSalt)
        const query = db.prepare(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`).run(name, email, hashed)
        const newUser = db.prepare("SELECT * FROM users WHERE id  = ?").get(query.lastInsertRowid)
        const { password: _, ...safeUser } = newUser
        res.status(201).json(safeUser)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Что-то пошло не так" })
    }
})

app.delete("/users/:id", auth, (req, res) => {
    const { id } = req.params

    try {
        const query = db.prepare("DELETE FROM users WHERE id = ?").run(id)
        if (query.changes == 0) {
            return res.status(404).json({ error: "э а где гей" })
        }
        return res.status(200).json({ message: "успешно" })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ messages: "что-то пошло не так" })
    }
})

app.post("/auth/signin", (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: "я не вижу че там написано" })
        }
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email)
        if (!user) return res.status(401).json({ error: "ты накосячил гдетол" })
        const hashed = bcr.compareSync(password, user.password)
        if (!hashed) return res.status(401).json({ error: "не правильго" })
        const { password: _, ...safeUser } = user
        const token = jwt.sign(safeUser, SECRET, { expiresIn: "24h" })
        return res.status(200).json({ success: true, token, error: null })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Somethin went wrong" })
    }

})
app.post("/todos", (req, res) => {
    const { name, status } = req.body;
    try {
        if (!name) return res.status(400).json({ message: "Title is required" });

        const query = db.prepare("INSERT INTO todos (name, status) VALUES (?, ?)").run(name, status);
        const newTodo = db.prepare("SELECT * FROM todos WHERE id = ?").get(query.lastInsertRowid);

        res.status(200).json(newTodo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
app.delete("/todos/:id", auth, (req, res) => {
    const { id } = req.params

    try {
        const query = db.prepare("DELETE FROM todos WHERE id = ?").run(id)
        if (query.changes == 0) {
            return res.status(404).json({ error: "э а где гей" })
        }
        return res.status(200).json({ message: "успешно" })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ messages: "что-то пошло не так" })
    }
})


app.listen(3000)