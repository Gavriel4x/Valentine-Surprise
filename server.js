import express from "express";
import db from "./db/index.js";
import { questions } from "./config/questions.js";

const app = express();
const PORT = process.env.PORT || 3000;
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

/* START */
app.get("/v/:id/choice", (req, res) => {
  res.redirect(`/v/${req.params.id}/step/1`);
});

/* RENDER STEP */
app.get("/v/:id/step/:step", (req, res) => {
  const { id, step } = req.params;
  const q = questions.find(q => q.step === Number(step));

  if (!q) return res.redirect(`/v/${id}/result`);

  res.render("choice", {
    id,
    step: q.step,
    question: q.question,
    options: q.options,
    totalSteps: questions.length
  });
});

/* HANDLE ANSWER */
app.post("/v/:id/answer", (req, res) => {
  const { id } = req.params;
  const { step, answer } = req.body;

  db.get(
    "SELECT answers FROM links WHERE id = ?",
    [id],
    (err, row) => {
      const prev = row?.answers ? JSON.parse(row.answers) : [];
      prev.push(answer);

      db.run(
        "UPDATE links SET answers = ?, step = ? WHERE id = ?",
        [JSON.stringify(prev), Number(step) + 1, id],
        () => {
          res.redirect(`/v/${id}/step/${Number(step) + 1}`);
        }
      );
    }
  );
});

app.get("/v/:id/result", (req, res) => {
  const { id } = req.params;

  db.get(
    "SELECT sender_name, target_name, message, answers FROM links WHERE id = ?",
    [id],
    (err, row) => {
      if (!row) return res.send("Link tidak ditemukan");

      const answers = row.answers ? JSON.parse(row.answers) : [];

      const shareUrl = `${req.protocol}://${req.get("host")}/v/${id}`;

      res.render("result", {
        id,
        senderName: row.sender_name,
        targetName: row.target_name,
        message: row.message,
        answers,
        shareUrl
      });
    }
  );
});
