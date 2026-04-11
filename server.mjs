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
const DEFAULT_FROM_NAME = "FISUC Newsletter";

function toCleanString(value = "") {
  return sanitizeHeaderText(String(value ?? ""));
}

function normalizeSmtpPort(value) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return String(Math.round(parsed));
}

function normalizeMailConfig(raw = {}) {
  return {
    smtpHost: toCleanString(raw.smtpHost),
    smtpPort: normalizeSmtpPort(raw.smtpPort),
    smtpUser: toCleanString(raw.smtpUser),
    smtpPass: String(raw.smtpPass ?? ""),
    fromEmail: toCleanString(raw.fromEmail),
    fromName: toCleanString(raw.fromName || DEFAULT_FROM_NAME),
    testTo: toCleanString(raw.testTo),
  };
}

function getEnvMailConfig() {
  return normalizeMailConfig({
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT || 587,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    fromEmail: process.env.FROM_EMAIL,
    fromName: process.env.FROM_NAME || DEFAULT_FROM_NAME,
    testTo: process.env.TEST_TO,
  });
}

function isMailConfigComplete(config = {}) {
  return Boolean(
    config.smtpHost &&
      config.smtpPort &&
      config.smtpUser &&
      config.smtpPass &&
      config.fromEmail
  );
}

function createConfigStore(configPath) {
  function read() {
    if (!configPath || !fs.existsSync(configPath)) return null;

    try {
      const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const source = raw?.mail || raw || {};
      return normalizeMailConfig(source);
    } catch (error) {
      console.warn("No se pudo leer la configuración local:", error);
      return null;
    }
  }

  function write(config) {
    if (!configPath) {
      throw new Error("El almacenamiento local no está disponible en este modo.");
    }

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      mail: normalizeMailConfig(config),
    };
    fs.writeFileSync(configPath, JSON.stringify(payload, null, 2), "utf8");
    return payload.mail;
  }

  function resolve() {
    const stored = read();
    const env = getEnvMailConfig();
    const actual = normalizeMailConfig({
      ...env,
      ...(stored || {}),
    });

    let source = "none";
    if (stored && isMailConfigComplete(actual)) {
      source = "stored";
    } else if (isMailConfigComplete(env)) {
      source = "env";
    }

    return {
      actual,
      stored,
      env,
      source,
      canPersist: Boolean(configPath),
      isConfigured: isMailConfigComplete(actual),
    };
  }

  return { read, write, resolve, configPath };
}

function mailConfigForClient(config = {}) {
  const normalized = normalizeMailConfig(config);
  return {
    smtpHost: normalized.smtpHost,
    smtpPort: normalized.smtpPort || "587",
    smtpUser: normalized.smtpUser,
    smtpPass: "",
    fromEmail: normalized.fromEmail,
    fromName: normalized.fromName || DEFAULT_FROM_NAME,
    testTo: normalized.testTo,
    hasPassword: Boolean(normalized.smtpPass),
  };
}

function mergeEditableMailConfig(existing = {}, incoming = {}) {
  const normalizedIncoming = normalizeMailConfig(incoming);
  const normalizedExisting = normalizeMailConfig(existing);

  return normalizeMailConfig({
    ...normalizedExisting,
    ...normalizedIncoming,
    smtpPass:
      typeof incoming.smtpPass === "string" && incoming.smtpPass
        ? incoming.smtpPass
        : normalizedExisting.smtpPass,
  });
}

function createMailTransport(config = {}) {
  const smtpPort = Number(config.smtpPort || 465);
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
}

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

function sanitizeImageWidth(value, min, max) {
  if (
    value === null ||
    typeof value === "undefined" ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const next = Math.round(Math.min(Math.max(parsed, min), max));
  return next >= max ? null : next;
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

  if (typeof next.imageWidth !== "undefined") {
    next.imageWidth = sanitizeImageWidth(next.imageWidth, 120, 552);
  }

  if (Array.isArray(next.imageWidths)) {
    next.imageWidths = next.imageWidths.map((value) =>
      sanitizeImageWidth(value, 80, 280)
    );
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
  const configStore = createConfigStore(options.configPath || null);

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

  app.get("/api/app-config", (req, res) => {
    const resolved = configStore.resolve();
    const values = mailConfigForClient(resolved.actual);

    res.json({
      ok: true,
      mode: resolved.canPersist ? "desktop" : "web",
      canPersist: resolved.canPersist,
      source: resolved.source,
      isConfigured: resolved.isConfigured,
      values,
    });
  });

  app.post("/api/app-config/test", async (req, res) => {
    try {
      const resolved = configStore.resolve();
      const config = mergeEditableMailConfig(resolved.stored || resolved.env, req.body || {});

      if (!isMailConfigComplete(config)) {
        return res.status(400).json({
          ok: false,
          error: "Completa host, puerto, usuario, contraseña y remitente antes de probar.",
        });
      }

      const transporter = createMailTransport(config);
      await transporter.verify();

      res.json({ ok: true });
    } catch (error) {
      console.error("Error validando configuración SMTP:", error);
      res.status(500).json({
        ok: false,
        error: error.message || "No se pudo validar la configuración SMTP",
      });
    }
  });

  app.put("/api/app-config", (req, res) => {
    try {
      if (!configStore.configPath) {
        return res.status(400).json({
          ok: false,
          error: "La configuración local solo está disponible en modo escritorio.",
        });
      }

      const existing = configStore.read() || {};
      const next = mergeEditableMailConfig(existing, req.body || {});

      if (!isMailConfigComplete(next)) {
        return res.status(400).json({
          ok: false,
          error: "Completa host, puerto, usuario, contraseña y remitente para guardar.",
        });
      }

      const saved = configStore.write(next);
      res.json({
        ok: true,
        isConfigured: true,
        source: "stored",
        values: mailConfigForClient(saved),
      });
    } catch (error) {
      console.error("Error guardando configuración local:", error);
      res.status(500).json({
        ok: false,
        error: error.message || "No se pudo guardar la configuración",
      });
    }
  });

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
      const resolvedConfig = configStore.resolve();
      const mailConfig = resolvedConfig.actual;

      if (!isMailConfigComplete(mailConfig)) {
        return res.status(400).json({
          ok: false,
          error:
            "Falta la configuración de envío. Abre la configuración de la app y completa SMTP y remitente.",
        });
      }

      const transporter = createMailTransport(mailConfig);
      const targetEmail = to || mailConfig.testTo;

      if (!targetEmail) {
        return res.status(400).json({
          ok: false,
          error:
            "Falta el correo de destino para la prueba. Completa uno en la app o en la configuración.",
        });
      }

      const info = await transporter.sendMail({
        from: `${mailConfig.fromName || DEFAULT_FROM_NAME} <${mailConfig.fromEmail}>`,
        to: targetEmail,
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
