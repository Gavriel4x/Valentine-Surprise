import express from "express";
import db from "./db/index.js";

const app = express();
const PORT = 3000;
const {v4 : uuidv4} = await import('uuid');

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.render("landing.ejs");
});

//NOTE
//-----------
//IF message isEmpty = "Will you be my Valentine?"

//Insert to database, only if data not exists
app.post("/create", async (req, res) => {

    req.body.message = req.body.message.trim();
    if(req.body.message === "") {
      req.body.message = "Will you be my Valentine?";
    }

    const id = uuidv4();
    const { senderName, targetName, message } = req.body;

    const sql = 
        `INSERT INTO links 
        (id, sender_name, target_name, message) 
        VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [id, senderName, targetName, message], (err) => {
        if (err) {
            console.error(err);
            return res.send("Gagal membuat link");
        }

        console.log(`Link created with ID: ${id}`);
        console.log(senderName, targetName, message);
        res.redirect(`/v/${id}`);
    });
});

app.get("/v/:id", (req, res) => {
    
    const linkId = req.params.id;

    db.run(
    "UPDATE links SET views = views + 1 WHERE id = ?",
    [linkId]
    );

    const sql = `SELECT * FROM links WHERE id = ?`;
    db.get(sql, [linkId], (err, row) => {
        if (err) {
            console.error(err);
            return res.send("Error retrieving link");
        }
        if (!row) {
            return res.send("Link not found");
        }

        res.render("opening.ejs", { data: row});
    });
});
