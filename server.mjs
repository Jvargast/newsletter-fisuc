import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import nunjucks from "nunjucks";
import mjml2html from "mjml";
import juice from "juice";
import { htmlToText } from "html-to-text";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import crypto from "crypto";

function cidify(html) {
  const attachments = [];
  let i = 0;
  const replaced = html.replace(
    /src="(https?:\/\/[^"]+\/uploads\/[^"]+)"/g,
    (m, href) => {
      try {
        const u = new URL(href);
        const file = path.basename(u.pathname);
        const localPath = path.join(UPLOAD_DIR, file);
        if (fs.existsSync(localPath)) {
          const cid = `img${i++}@newsletter`;
          attachments.push({ filename: file, path: localPath, cid });
          return `src="cid:${cid}"`;
        }
      } catch (_) {}
      return m;
    }
  );
  return { html: replaced, attachments };
}

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const ROOT = process.cwd();
app.use(express.static(path.join(ROOT, "public")));

const UPLOAD_DIR = path.join(ROOT, "public", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(8).toString("hex") + ext);
  },
});
const fileFilter = (_req, file, cb) =>
  cb(null, /image\/(png|jpe?g|gif|webp|svg\+xml)/i.test(file.mimetype));
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ ok: false, error: "Archivo inválido" });
  const url = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.json({ ok: true, url });
});

const TEMPLATES_DIR = path.join(ROOT, "templates");
nunjucks.configure(TEMPLATES_DIR, { autoescape: false, noCache: true });

function buildHtml(data = {}) {
  const renderedMjml = nunjucks.render("index.mjml", data);
  const { html, errors } = mjml2html(renderedMjml, {
    minify: false,
    keepComments: false,
  });
  if (errors?.length) console.warn("[MJML]", errors);

  const inlined = juice(html);
  const text = htmlToText(inlined, { wordwrap: 80 });
  return { html: inlined, text, errors };
}

app.post("/api/build", (req, res) => {
  try {
    const { html, text, errors } = buildHtml(req.body || {});
    res.json({ ok: true, html, text, errors: errors || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/send-test", async (req, res) => {
  try {
    console.log("INICIO /api/send-test");
    const { to } = req.query;

    const { html: rawHtml, text } = buildHtml(req.body || {});
    const { html, attachments } = cidify(rawHtml);

    const port = Number(process.env.SMTP_PORT || 465);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, 
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    console.log("Enviando a:", to || process.env.TEST_TO);

    const info = await transporter.sendMail({
      from: `${process.env.FROM_NAME || "Newsletter"} <${
        process.env.FROM_EMAIL
      }>`,
      to: to || process.env.TEST_TO,
      subject: req.body?.edition?.preview || "Prueba Newsletter",
      text,
      html,
      attachments,
    });

    console.log("Enviado:", info);

    res.json({
      ok: true,
      messageId: info.messageId,
      response: info.response,
    });
  } catch (e) {
    console.error("Error en /api/send-test:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(
    `Newsletter mini-app corriendo en http://localhost:${PORT}/admin.html`
  );
});
