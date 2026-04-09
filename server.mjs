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
import { fileURLToPath } from "url";

const MODULE_FILE = fileURLToPath(import.meta.url);
const MODULE_DIR = path.dirname(MODULE_FILE);

function escapeHtmlText(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sanitizeHeaderText(value = "") {
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

function sanitizeCard(card = {}) {
  const next = { ...card };

  ["title", "source", "desc", "caption", "imageCaption"].forEach((field) => {
    if (typeof next[field] !== "undefined") {
      next[field] = escapeHtmlText(next[field]);
    }
  });

  if (Array.isArray(next.imageCaptions)) {
    next.imageCaptions = next.imageCaptions.map((value) =>
      escapeHtmlText(value)
    );
  }

  ["image", "logo"].forEach((field) => {
    if (typeof next[field] !== "undefined") {
      next[field] = escapeHtmlText(next[field]);
    }
  });

  if (Array.isArray(next.images)) {
    next.images = next.images.map((value) => escapeHtmlText(value));
  }

  return next;
}

function sanitizePayload(data = {}) {
  return {
    ...data,
    meta: {
      ...(data.meta || {}),
      issue: escapeHtmlText(data.meta?.issue || ""),
      date: escapeHtmlText(data.meta?.date || ""),
    },
    brand: {
      ...(data.brand || {}),
      name: escapeHtmlText(data.brand?.name || ""),
      logo: escapeHtmlText(data.brand?.logo || ""),
      primary: data.brand?.primary || "",
      bg: data.brand?.bg || "",
      text: data.brand?.text || "",
      gray: data.brand?.gray || "",
      dark: data.brand?.dark || "",
    },
    unsubscribe: escapeHtmlText(data.unsubscribe || ""),
    edition: {
      ...(data.edition || {}),
      subject: sanitizeHeaderText(data.edition?.subject || ""),
      preheader: sanitizeHeaderText(data.edition?.preheader || ""),
      preview: sanitizeHeaderText(data.edition?.preview || ""),
      heading: escapeHtmlText(data.edition?.heading || ""),
      subheading: escapeHtmlText(data.edition?.subheading || ""),
      cards: Array.isArray(data.edition?.cards)
        ? data.edition.cards.map((card) => sanitizeCard(card))
        : [],
    },
    legal: {
      ...(data.legal || {}),
      copyright: escapeHtmlText(data.legal?.copyright || ""),
    },
  };
}

function resolveEnvPath(rootDir, explicitEnvPath) {
  const candidates = [
    explicitEnvPath,
    path.join(rootDir, ".env"),
    rootDir !== process.cwd() ? path.join(process.cwd(), ".env") : null,
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function loadEnvironment(rootDir, explicitEnvPath) {
  const envPath = resolveEnvPath(rootDir, explicitEnvPath);
  if (envPath) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
  return envPath;
}

function createCidify(uploadsDir) {
  return function cidify(html) {
    const attachments = [];
    let i = 0;
    const replaced = html.replace(
      /src="(https?:\/\/[^"]+\/uploads\/[^"]+)"/g,
      (match, href) => {
        try {
          const url = new URL(href);
          const file = path.basename(url.pathname);
          const localPath = path.join(uploadsDir, file);
          if (fs.existsSync(localPath)) {
            const cid = `img${i++}@newsletter`;
            attachments.push({ filename: file, path: localPath, cid });
            return `src="cid:${cid}"`;
          }
        } catch (_) {}
        return match;
      }
    );
    return { html: replaced, attachments };
  };
}

function createBuildHtml(templatesDir) {
  const renderer = nunjucks.configure(templatesDir, {
    autoescape: false,
    noCache: true,
  });

  return function buildHtml(data = {}) {
    const safeData = sanitizePayload(data);
    const renderedMjml = renderer.render("index.mjml", safeData);
    const { html, errors } = mjml2html(renderedMjml, {
      minify: false,
      keepComments: false,
    });
    if (errors?.length) console.warn("[MJML]", errors);

    const inlined = juice(html);
    const text = htmlToText(inlined, { wordwrap: 80 });
    return { html: inlined, text, errors };
  };
}

export function createNewsletterApp(options = {}) {
  const rootDir = options.rootDir || MODULE_DIR;
  const publicDir = path.join(rootDir, "public");
  const uploadsDir =
    options.uploadsDir || path.join(rootDir, "public", "uploads");
  const templatesDir = path.join(rootDir, "templates");

  loadEnvironment(rootDir, options.envPath);
  fs.mkdirSync(uploadsDir, { recursive: true });

  const fsp = fs.promises;
  const app = express();
  const buildHtml = createBuildHtml(templatesDir);
  const cidify = createCidify(uploadsDir);

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.static(publicDir));
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/media", async (req, res) => {
    try {
      const entries = await fsp.readdir(uploadsDir, { withFileTypes: true });
      const base = `${req.protocol}://${req.get("host")}`;

      const images = entries
        .filter((entry) => entry.isFile())
        .filter((entry) => /\.(png|jpe?g|gif|webp|svg)$/i.test(entry.name))
        .map((entry) => ({
          name: entry.name,
          url: `${base}/uploads/${entry.name}`,
        }));

      res.json({ ok: true, items: images });
    } catch (error) {
      console.error("Error listando media:", error);
      res.status(500).json({ ok: false, error: "No se pudo listar media" });
    }
  });

  app.delete("/api/media/:file", async (req, res) => {
    try {
      const fileName = path.basename(req.params.file);
      const filePath = path.join(uploadsDir, fileName);

      if (!filePath.startsWith(uploadsDir)) {
        return res.status(400).json({ ok: false, error: "Ruta inválida" });
      }

      await fsp.unlink(filePath);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error borrando archivo:", error);
      res
        .status(500)
        .json({ ok: false, error: "No se pudo borrar el archivo" });
    }
  });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
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
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "Archivo inválido" });
    }

    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.json({ ok: true, url, name: req.file.filename });
  });

  app.post("/api/build", (req, res) => {
    try {
      const { html, text, errors } = buildHtml(req.body || {});
      res.json({ ok: true, html, text, errors: errors || [] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/send-test", async (req, res) => {
    try {
      const { to } = req.query;
      const { html: rawHtml, text } = buildHtml(req.body || {});
      const { html, attachments } = cidify(rawHtml);

      const smtpPort = Number(process.env.SMTP_PORT || 465);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `${process.env.FROM_NAME || "Newsletter"} <${
          process.env.FROM_EMAIL
        }>`,
        to: to || process.env.TEST_TO,
        subject:
          req.body?.edition?.subject ||
          req.body?.edition?.preheader ||
          req.body?.edition?.preview ||
          "Prueba Newsletter",
        text,
        html,
        attachments,
      });

      res.json({
        ok: true,
        messageId: info.messageId,
        response: info.response,
      });
    } catch (error) {
      console.error("Error en /api/send-test:", error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  return {
    app,
    buildHtml,
    cidify,
    rootDir,
    publicDir,
    uploadsDir,
    templatesDir,
  };
}

export function startServer(options = {}) {
  const host = options.host || process.env.HOST || "127.0.0.1";
  const port =
    typeof options.port === "number"
      ? options.port
      : Number(process.env.PORT || 3000);
  const context = createNewsletterApp(options);

  return new Promise((resolve, reject) => {
    const server = context.app
      .listen(port, host, () => {
        const address = server.address();
        const actualPort =
          typeof address === "object" && address ? address.port : port;
        const url = `http://${host}:${actualPort}/admin.html`;

        if (!options.quiet) {
          console.log(`Newsletter mini-app corriendo en ${url}`);
        }

        resolve({
          ...context,
          server,
          host,
          port: actualPort,
          url,
        });
      })
      .on("error", reject);
  });
}

export function stopServer(server) {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }

    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === MODULE_FILE;

if (isDirectRun) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
