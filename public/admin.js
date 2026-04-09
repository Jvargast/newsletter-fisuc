const STORAGE_KEY = "newsletter-fisuc-draft-v2";
const FIELD_IDS = [
  "issue",
  "date",
  "subject",
  "preheader",
  "brand_name",
  "brand_logo",
  "brand_primary",
  "brand_bg",
  "brand_text",
  "brand_gray",
  "heading",
  "subheading",
  "unsubscribe",
  "copyright",
  "test_to",
];

const TYPE_META = {
  story: {
    label: "Noticia",
    hint: "Título, fuente, cuerpo e imagen destacada.",
    empty: "Nueva noticia sin título",
  },
  gallery: {
    label: "Galería",
    hint: "",
    empty: "Nueva galería visual",
  },
  note: {
    label: "Texto",
    hint: "Bloque libre sin imágenes.",
    empty: "Nuevo bloque de texto",
  },
};

const CAPTION_ALIGNMENTS = ["left", "center", "right"];
const CAPTION_ALIGN_META = [
  { value: "left", label: "Izquierda", icon: "alignLeft" },
  { value: "center", label: "Centro", icon: "alignCenter" },
  { value: "right", label: "Derecha", icon: "alignRight" },
];
const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const mediaState = {
  items: [],
  loaded: false,
  loading: false,
  onSelect: null,
};

const confirmState = {
  resolver: null,
};

let sendButtonUi = null;

const state = {
  cards: [],
  defaultDraft: null,
  currentPreviewUrl: null,
  previewTimer: null,
  previewRequestId: 0,
  uploadTarget: null,
  currentView: "desktop",
  imageEditor: {
    open: false,
    cardId: null,
    slot: null,
    imageUrl: "",
    imageName: "",
    image: null,
    outputWidth: 1200,
    outputHeight: 675,
    minScale: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    dragPointerId: null,
    dragStartX: 0,
    dragStartY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  },
};

function id(name) {
  return document.getElementById(name);
}

function getSendButtonUi() {
  if (!sendButtonUi && window.createSendFeedback) {
    sendButtonUi = window.createSendFeedback(id("btnSend"));
  }
  return sendButtonUi;
}

function valueOf(name, fallback = "") {
  const el = id(name);
  return el && typeof el.value !== "undefined" ? el.value : fallback;
}

function setValue(name, value) {
  const el = id(name);
  if (!el || typeof el.value === "undefined") return;
  if (name === "date") {
    el.value = normalizeDateInputValue(value);
    return;
  }
  el.value = value ?? "";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fileNameFromUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";

  try {
    const url = new URL(value, window.location.href);
    return decodeURIComponent(url.pathname.split("/").pop() || "");
  } catch (_) {
    return value.split("/").pop() || "";
  }
}

function replaceFileExtension(name, nextExtension) {
  const cleanName = String(name || "").trim() || "imagen";
  const ext = String(nextExtension || "png").replace(/^\./, "");
  return cleanName.replace(/\.[a-z0-9]+$/i, "") + `.${ext}`;
}

function normalizeAssetUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";

  try {
    return new URL(value, window.location.href).href;
  } catch (_) {
    return value;
  }
}

function assetUrlToKey(raw, fallbackName = "") {
  const value = normalizeAssetUrl(raw);
  const fallback = String(fallbackName || "").trim();

  try {
    const url = new URL(value, window.location.href);
    if (/\/uploads\//i.test(url.pathname)) {
      return `upload:${decodeURIComponent(url.pathname.split("/").pop() || fallback)}`;
    }
    return url.href;
  } catch (_) {
    return fallback || value;
  }
}

function isSvgAssetReference(raw, fallbackName = "") {
  const fileName = fileNameFromUrl(raw);
  return /\.svg$/i.test(fileName) || /\.svg$/i.test(String(fallbackName || "").trim());
}

function isSvgFile(file) {
  if (!file) return false;
  return file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");
}

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function stripAccents(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseDateInputValue(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  const match = value.match(
    /^(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)(?:\s+de)?\s+(\d{4})$/i
  );
  if (!match) return null;

  const day = Number(match[1]);
  const monthName = stripAccents(match[2]);
  const year = Number(match[3]);
  const month = MONTH_NAMES.findIndex((item) => stripAccents(item) === monthName) + 1;

  if (!month || day < 1 || day > 31) return null;
  return { year, month, day };
}

function normalizeDateInputValue(raw) {
  const parsed = parseDateInputValue(raw);
  if (!parsed) return "";
  return `${parsed.year}-${padDatePart(parsed.month)}-${padDatePart(parsed.day)}`;
}

function formatNewsletterDate(raw) {
  const parsed = parseDateInputValue(raw);
  if (!parsed) return String(raw || "").trim();
  return `${parsed.day} de ${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`;
}

function normalizeHex(val, fallback) {
  if (!val) return fallback;
  let next = val.trim();
  if (!next.startsWith("#")) next = `#${next}`;
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(next)) return fallback;
  if (next.length === 4) {
    next = `#${next[1]}${next[1]}${next[2]}${next[2]}${next[3]}${next[3]}`;
  }
  return next.toUpperCase();
}

function bindColorPair(pickerId, inputId) {
  const picker = id(pickerId);
  const input = id(inputId);
  if (!picker || !input) return;

  const syncFromPicker = () => {
    input.value = normalizeHex(picker.value, input.value);
    commit();
  };

  const syncFromInput = () => {
    const normalized = normalizeHex(input.value, picker.value);
    input.value = normalized;
    picker.value = normalized;
    commit();
  };

  picker.addEventListener("input", syncFromPicker);
  input.addEventListener("change", syncFromInput);
}

function syncColorInputs() {
  [
    ["brand_primary_picker", "brand_primary"],
    ["brand_bg_picker", "brand_bg"],
    ["brand_text_picker", "brand_text"],
    ["brand_gray_picker", "brand_gray"],
  ].forEach(([pickerId, inputId]) => {
    const picker = id(pickerId);
    const input = id(inputId);
    if (!picker || !input) return;
    const normalized = normalizeHex(input.value, picker.value);
    input.value = normalized;
    picker.value = normalized;
  });
}

function normalizeIssue(raw) {
  return String(raw || "").replace(/\D/g, "");
}

function splitLegacySource(rawDesc = "", explicitSource = "") {
  const source = String(explicitSource || "").trim();
  const desc = String(rawDesc || "").replace(/\r\n/g, "\n").trim();

  if (source) return { source, desc };

  const match = desc.match(/^Fuente:\s*(.+?)(?:\n{2,}|\n|$)/i);
  if (!match) return { source: "", desc };

  const cleanDesc = desc.slice(match[0].length).trim();
  return { source: match[1].trim(), desc: cleanDesc };
}

function normalizeCaptionAlign(raw, fallback = "center") {
  const value = String(raw || "").trim().toLowerCase();
  return CAPTION_ALIGNMENTS.includes(value) ? value : fallback;
}

function normalizeTextArray(raw, size = 2) {
  if (!Array.isArray(raw)) {
    return Array.from({ length: size }, () => "");
  }

  return Array.from({ length: size }, (_, index) => String(raw[index] || ""));
}

function normalizeAlignArray(raw, size = 2, fallback = "center") {
  if (!Array.isArray(raw)) {
    return Array.from({ length: size }, () => fallback);
  }

  return Array.from({ length: size }, (_, index) =>
    normalizeCaptionAlign(raw[index], fallback)
  );
}

function getCardLabel(card, index) {
  const title = String(card?.title || "").trim();
  return title || `Bloque ${index + 1}`;
}

function collectUsedAssetReferences() {
  const references = [];
  const logo = valueOf("brand_logo").trim();

  if (logo) {
    references.push({
      key: assetUrlToKey(logo, "logo"),
      url: logo,
      label: "Logo de marca",
    });
  }

  state.cards.forEach((card, index) => {
    const blockLabel = getCardLabel(card, index);

    if (card.image?.trim()) {
      references.push({
        key: assetUrlToKey(card.image, fileNameFromUrl(card.image)),
        url: card.image.trim(),
        label: `${blockLabel} / Imagen destacada`,
      });
    }

    (card.images || []).forEach((imageUrl, imageIndex) => {
      if (!String(imageUrl || "").trim()) return;
      references.push({
        key: assetUrlToKey(imageUrl, fileNameFromUrl(imageUrl)),
        url: String(imageUrl).trim(),
        label: `${blockLabel} / Imagen ${imageIndex + 1}`,
      });
    });
  });

  return references;
}

function getAssetUsageList(item) {
  const assetKey = assetUrlToKey(item?.url, item?.name);
  return collectUsedAssetReferences()
    .filter((entry) => entry.key === assetKey)
    .map((entry) => entry.label);
}

function getSvgAssetIssues() {
  return collectUsedAssetReferences()
    .filter((entry) => isSvgAssetReference(entry.url))
    .map((entry) => `${entry.label}: usa SVG y puede fallar en clientes de correo.`);
}

function hasText(values = []) {
  return values.some((value) => String(value || "").trim());
}

function hasNonDefaultAlign(values = []) {
  return values.some((value) => normalizeCaptionAlign(value) !== "center");
}

function normalizeCard(raw = {}) {
  const parsed = splitLegacySource(raw.desc, raw.source);
  const galleryImages = Array.isArray(raw.images)
    ? [raw.images[0] || "", raw.images[1] || ""]
    : ["", ""];
  const galleryCaptions = normalizeTextArray(raw.imageCaptions);
  const galleryCaptionAligns = normalizeAlignArray(raw.imageCaptionAligns);

  let type = raw.type;
  if (!type) {
    type = galleryImages.some(Boolean)
      ? "gallery"
      : raw.image
      ? "story"
      : "note";
  }

  const card = {
    id: raw.id || makeId(),
    type,
    title: String(raw.title || ""),
    source: parsed.source,
    desc: parsed.desc,
    image: String(raw.image || ""),
    imageCaption: String(raw.imageCaption || ""),
    imageCaptionAlign: normalizeCaptionAlign(raw.imageCaptionAlign),
    images: galleryImages,
    caption: String(raw.caption || ""),
    imageCaptions: galleryCaptions,
    imageCaptionAligns: galleryCaptionAligns,
  };

  if (type === "gallery") {
    card.image = "";
    card.imageCaption = "";
    card.imageCaptionAlign = "center";
  } else {
    card.images = ["", ""];
    card.imageCaptions = ["", ""];
    card.imageCaptionAligns = ["center", "center"];
    card.caption = type === "note" ? "" : card.caption;
  }

  if (type === "note") {
    card.image = "";
    card.imageCaption = "";
    card.imageCaptionAlign = "center";
    card.caption = "";
  }

  return card;
}

function normalizeCards(cards) {
  if (!Array.isArray(cards)) return [];
  return cards.map((card) => normalizeCard(card));
}

function createCard(type) {
  return normalizeCard({ type });
}

function convertCardType(card, nextType) {
  const next = normalizeCard({ ...card, type: nextType });

  if (nextType === "gallery") {
    next.images = [card.images?.[0] || card.image || "", card.images?.[1] || ""];
    next.image = "";
    next.imageCaptions = normalizeTextArray(card.imageCaptions);
    next.imageCaptionAligns = normalizeAlignArray(card.imageCaptionAligns);
    if (!next.imageCaptions[0] && card.imageCaption) {
      next.imageCaptions[0] = card.imageCaption;
    }
    if (
      normalizeCaptionAlign(card.imageCaptionAlign) !== "center" &&
      normalizeCaptionAlign(next.imageCaptionAligns[0]) === "center"
    ) {
      next.imageCaptionAligns[0] = normalizeCaptionAlign(card.imageCaptionAlign);
    }
    next.imageCaption = "";
    next.imageCaptionAlign = "center";
  } else if (nextType === "story") {
    next.image = card.image || card.images?.[0] || "";
    next.imageCaption = String(card.imageCaption || card.imageCaptions?.[0] || "");
    next.imageCaptionAlign = normalizeCaptionAlign(
      card.imageCaptionAlign || card.imageCaptionAligns?.[0] || "center"
    );
    next.images = ["", ""];
    next.imageCaptions = ["", ""];
    next.imageCaptionAligns = ["center", "center"];
    next.caption = "";
  } else {
    next.image = "";
    next.imageCaption = "";
    next.imageCaptionAlign = "center";
    next.images = ["", ""];
    next.imageCaptions = ["", ""];
    next.imageCaptionAligns = ["center", "center"];
    next.caption = "";
  }

  return next;
}

function exportCard(card) {
  const out = {};
  if (card.type) out.type = card.type;
  if (card.title.trim()) out.title = card.title.trim();
  if (card.source.trim()) out.source = card.source.trim();
  if (card.desc.trim()) out.desc = card.desc.trim();

  if (card.type === "gallery") {
    if (card.images.some(Boolean)) out.images = [...card.images];
    if (hasText(card.imageCaptions)) out.imageCaptions = [...card.imageCaptions];
    if (hasText(card.imageCaptions) || hasNonDefaultAlign(card.imageCaptionAligns)) {
      out.imageCaptionAligns = [...card.imageCaptionAligns];
    }
    if (card.caption.trim()) out.caption = card.caption.trim();
  } else {
    if (card.image.trim()) out.image = card.image.trim();
    if (card.imageCaption.trim()) out.imageCaption = card.imageCaption.trim();
    if (
      card.imageCaption.trim() ||
      normalizeCaptionAlign(card.imageCaptionAlign) !== "center"
    ) {
      out.imageCaptionAlign = normalizeCaptionAlign(card.imageCaptionAlign);
    }
  }

  return out;
}

function toPayloadCard(card) {
  const out = {};

  if (card.title.trim()) out.title = card.title.trim();
  if (card.source.trim()) out.source = card.source.trim();
  if (card.desc.trim()) out.desc = card.desc.trim();

  if (card.type === "gallery") {
    if (card.images.some(Boolean)) out.images = [...card.images];
    if (hasText(card.imageCaptions)) out.imageCaptions = [...card.imageCaptions];
    if (hasText(card.imageCaptions) || hasNonDefaultAlign(card.imageCaptionAligns)) {
      out.imageCaptionAligns = [...card.imageCaptionAligns];
    }
    if (card.caption.trim()) out.caption = card.caption.trim();
  } else {
    if (card.image.trim()) out.image = card.image.trim();
    if (card.imageCaption.trim()) out.imageCaption = card.imageCaption.trim();
    if (
      card.imageCaption.trim() ||
      normalizeCaptionAlign(card.imageCaptionAlign) !== "center"
    ) {
      out.imageCaptionAlign = normalizeCaptionAlign(card.imageCaptionAlign);
    }
  }

  return out;
}

function readInitialCards() {
  const script = id("initial-cards");
  if (!script) return [];
  try {
    return JSON.parse(script.textContent || "[]");
  } catch (error) {
    console.error("Error cargando bloques iniciales:", error);
    return [];
  }
}

function getFieldState() {
  return FIELD_IDS.reduce((acc, fieldId) => {
    acc[fieldId] = valueOf(fieldId);
    return acc;
  }, {});
}

function getDraft() {
  return {
    fields: getFieldState(),
    cards: state.cards.map((card) => exportCard(card)),
  };
}

function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getDraft()));
  } catch (error) {
    console.warn("No se pudo guardar el borrador local:", error);
  }
}

function loadStoredDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn("No se pudo leer el borrador guardado:", error);
    return null;
  }
}

function applyDraft(draft = {}, options = {}) {
  const { renderBlocks = true, previewNow = false, save = false } = options;

  if (draft.fields) {
    FIELD_IDS.forEach((fieldId) => {
      if (Object.hasOwn(draft.fields, fieldId)) {
        setValue(fieldId, draft.fields[fieldId]);
      }
    });
  }

  if (Array.isArray(draft.cards)) {
    state.cards = normalizeCards(draft.cards);
  }

  syncColorInputs();
  refreshIssueHint();
  refreshLogoPreview();
  refreshSummary();

  if (renderBlocks) renderBlocksList();
  syncJsonPanel();

  if (save) saveDraft();
  if (previewNow) {
    preview();
  } else {
    schedulePreview();
  }
}

function refreshIssueHint() {
  const input = id("issue");
  const hint = id("issue_hint");
  if (!input || !hint) return;
  const clean = normalizeIssue(input.value);
  input.value = clean;
  hint.textContent = `Se mostrará como “NEWSLETTER #${clean || "X"}”.`;
}

function refreshLogoPreview() {
  const image = id("logo_preview");
  const placeholder = id("logo_placeholder");
  const logo = valueOf("brand_logo").trim();
  if (!image || !placeholder) return;

  if (logo) {
    image.src = logo;
    image.style.display = "block";
    placeholder.style.display = "none";
  } else {
    image.removeAttribute("src");
    image.style.display = "none";
    placeholder.style.display = "block";
  }
}

function refreshSummary() {
  const subject = valueOf("subject").trim() || "Sin asunto";
  const preheader = valueOf("preheader").trim() || "Sin preheader";
  id("summary_subject").textContent = subject;
  id("summary_preheader").textContent = preheader;
}

function setPreviewStatus(text, tone = "ok") {
  const statusCard = id("preview_status")?.closest(".summary-chip--status");
  if (!statusCard) return;
  statusCard.classList.remove("is-error", "is-warn");
  if (tone === "error") statusCard.classList.add("is-error");
  if (tone === "warn") statusCard.classList.add("is-warn");
  id("preview_status").textContent = text;
}

function setPreviewStamp(text) {
  const stamp = id("preview_timestamp");
  if (stamp) stamp.textContent = text;
}

function closeConfirmModal(result = false) {
  const modal = id("confirm-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  const resolver = confirmState.resolver;
  confirmState.resolver = null;
  if (resolver) resolver(result);
}

function openConfirmModal(options = {}) {
  const {
    title = "Confirmar acción",
    description = "",
    items = [],
    confirmLabel = "Confirmar",
  } = options;

  const modal = id("confirm-modal");
  const titleNode = id("confirm_title");
  const descriptionNode = id("confirm_description");
  const itemsNode = id("confirm_items");
  const confirmButton = id("confirm_accept");

  if (!modal || !titleNode || !descriptionNode || !itemsNode || !confirmButton) {
    return Promise.resolve(window.confirm(description || title));
  }

  titleNode.textContent = title;
  descriptionNode.textContent = description;
  confirmButton.textContent = confirmLabel;
  itemsNode.innerHTML = "";

  if (items.length) {
    itemsNode.classList.remove("hidden");
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      itemsNode.appendChild(li);
    });
  } else {
    itemsNode.classList.add("hidden");
  }

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  return new Promise((resolve) => {
    confirmState.resolver = resolve;
  });
}

function syncJsonPanel() {
  const field = id("cards_json");
  if (!field) return;
  field.value = JSON.stringify(
    state.cards.map((card) => exportCard(card)),
    null,
    2
  );
}

function textareaRows(text, minimum = 6) {
  return Math.max(minimum, String(text || "").split("\n").length + 1);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function safeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function imagePreview(url, label) {
  if (url) {
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" />`;
  }
  return `<div class="image-slot__empty">${escapeHtml(label)}</div>`;
}

function iconSvg(name) {
  const icons = {
    up: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M10 15V5" />
        <path d="M6.5 8.5 10 5l3.5 3.5" />
      </svg>
    `,
    down: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M10 5v10" />
        <path d="M6.5 11.5 10 15l3.5-3.5" />
      </svg>
    `,
    copy: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <rect x="7" y="5" width="8" height="10" rx="2" />
        <path d="M5 12.5H4.5A1.5 1.5 0 0 1 3 11V4.5A1.5 1.5 0 0 1 4.5 3H11a1.5 1.5 0 0 1 1.5 1.5V5" />
      </svg>
    `,
    trash: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M4.5 6h11" />
        <path d="M8 3.5h4" />
        <path d="M7 6v8.5a1.5 1.5 0 0 0 1.5 1.5h3A1.5 1.5 0 0 0 13 14.5V6" />
        <path d="M8.75 8.5v4.5" />
        <path d="M11.25 8.5v4.5" />
      </svg>
    `,
    upload: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M10 12V4.5" />
        <path d="M6.75 7.75 10 4.5l3.25 3.25" />
        <path d="M4 12.5v1.75A1.75 1.75 0 0 0 5.75 16h8.5A1.75 1.75 0 0 0 16 14.25V12.5" />
      </svg>
    `,
    library: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <rect x="3" y="4" width="14" height="12" rx="2" />
        <path d="m6.5 12 2.25-2.5L12 13l1.5-1.75L16 14" />
        <circle cx="7" cy="7.25" r="1" />
      </svg>
    `,
    crop: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M6 3.5v9a1.5 1.5 0 0 0 1.5 1.5h9" />
        <path d="M3.5 6H12a1.5 1.5 0 0 1 1.5 1.5V16" />
      </svg>
    `,
    alignLeft: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M4 5h12" />
        <path d="M4 9h8" />
        <path d="M4 13h12" />
        <path d="M4 17h7" />
      </svg>
    `,
    alignCenter: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M4 5h12" />
        <path d="M6 9h8" />
        <path d="M4 13h12" />
        <path d="M6.5 17h7" />
      </svg>
    `,
    alignRight: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M4 5h12" />
        <path d="M8 9h8" />
        <path d="M4 13h12" />
        <path d="M9 17h7" />
      </svg>
    `,
    clear: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="m6 6 8 8" />
        <path d="m14 6-8 8" />
        <circle cx="10" cy="10" r="7" />
      </svg>
    `,
  };

  return icons[name] || "";
}

function renderImageActionButton(
  action,
  slot,
  icon,
  label,
  toneClass,
  disabled = false
) {
  return `
    <button
      type="button"
      class="btn image-action-btn ${toneClass}"
      data-action="${action}"
      data-slot="${slot}"
      title="${label}"
      aria-label="${label}"
      ${disabled ? "disabled" : ""}
    >
      ${iconSvg(icon)}
    </button>
  `;
}

function renderTypeButton(card, type) {
  const meta = TYPE_META[type];
  const active = card.type === type ? " is-active" : "";
  return `
    <button type="button" class="btn chip-btn${active}" data-action="switch-type" data-type="${type}">
      <strong>${meta.label}</strong>
    </button>
  `;
}

function renderCaptionAlignButton(alignField, align, activeAlign) {
  const meta = CAPTION_ALIGN_META.find((item) => item.value === align);
  const active = align === activeAlign ? " is-active" : "";
  return `
    <button
      type="button"
      class="btn align-btn${active}"
      data-action="set-caption-align"
      data-align-field="${alignField}"
      data-align="${align}"
      title="${meta.label}"
      aria-label="${meta.label}"
      aria-pressed="${align === activeAlign ? "true" : "false"}"
    >
      ${iconSvg(meta.icon)}
    </button>
  `;
}

function renderImageCaptionEditor(text, align, options = {}) {
  const {
    fieldName = "imageCaption",
    alignField = "imageCaptionAlign",
    label = "Pie",
    placeholder = "Pie de imagen",
    ariaLabel = "Alineación del pie",
  } = options;

  return `
    <div class="image-caption">
      <div class="image-caption__top">
        <span class="image-caption__label">${escapeHtml(label)}</span>
      </div>

      <div class="align-toggle" role="group" aria-label="${escapeHtml(ariaLabel)}">
        ${CAPTION_ALIGN_META.map((item) =>
          renderCaptionAlignButton(alignField, item.value, align)
        ).join("")}
      </div>

      <textarea
        class="autosize image-caption__input"
        data-field="${fieldName}"
        data-min-height="78"
        rows="${textareaRows(text, 2)}"
        placeholder="${escapeHtml(placeholder)}"
      >${escapeHtml(text)}</textarea>
    </div>
  `;
}

function renderImageSlot(cardId, slot, url, label, options = {}) {
  const {
    caption = "",
    captionAlign = "center",
    allowCaption = false,
    captionField = "imageCaption",
    captionAlignField = "imageCaptionAlign",
    captionLabel = "Pie",
    captionPlaceholder = "Pie de imagen",
  } = options;
  return `
    <div class="image-slot" data-slot-wrap="${slot}">
      <div class="image-slot__preview" data-preview-slot="${slot}">
        ${imagePreview(url, label)}
      </div>
      ${
        allowCaption
          ? renderImageCaptionEditor(caption, captionAlign, {
              fieldName: captionField,
              alignField: captionAlignField,
              label: captionLabel,
              placeholder: captionPlaceholder,
              ariaLabel: `Alineación de ${label.toLowerCase()}`,
            })
          : ""
      }
      <div class="field">
        <label>${label}</label>
        <input
          type="text"
          data-field="${slot === "image" ? "image" : `images.${slot}`}"
          value="${escapeHtml(url)}"
          placeholder="URL pública o usa la biblioteca"
        />
      </div>
      <div class="image-slot__actions">
        ${renderImageActionButton("upload-image", slot, "upload", "Subir imagen", "image-action-btn--upload")}
        ${renderImageActionButton("pick-image", slot, "library", "Elegir desde biblioteca", "image-action-btn--library")}
        ${renderImageActionButton("edit-image", slot, "crop", "Recortar y escalar", "image-action-btn--edit", !url)}
        ${renderImageActionButton("clear-image", slot, "clear", "Quitar imagen", "image-action-btn--clear")}
      </div>
    </div>
  `;
}

function renderBlock(card, index) {
  const meta = TYPE_META[card.type];
  const title = card.title.trim() || meta.empty;
  const descriptionLabel =
    card.type === "note" ? "Contenido del bloque" : "Cuerpo del bloque";

  return `
    <article class="block-card" data-card-id="${card.id}">
      <div class="block-card__header">
        <div>
          <span class="block-card__eyebrow">Bloque ${index + 1} / ${meta.label}</span>
          <h3 data-role="block-title">${escapeHtml(title)}</h3>
          ${meta.hint ? `<p>${escapeHtml(meta.hint)}</p>` : ""}
        </div>

        <div class="block-card__tools">
          <button type="button" class="btn icon-btn tool-btn tool-btn--up" data-action="move-up" title="Mover arriba" aria-label="Mover arriba">
            ${iconSvg("up")}
          </button>
          <button type="button" class="btn icon-btn tool-btn tool-btn--duplicate" data-action="duplicate" title="Duplicar bloque" aria-label="Duplicar bloque">
            ${iconSvg("copy")}
          </button>
          <button type="button" class="btn icon-btn tool-btn tool-btn--down" data-action="move-down" title="Mover abajo" aria-label="Mover abajo">
            ${iconSvg("down")}
          </button>
          <button type="button" class="btn icon-btn tool-btn tool-btn--delete" data-action="delete" title="Eliminar bloque" aria-label="Eliminar bloque">
            ${iconSvg("trash")}
          </button>
        </div>
      </div>

      <div class="block-type-switch">
        ${renderTypeButton(card, "story")}
        ${renderTypeButton(card, "gallery")}
        ${renderTypeButton(card, "note")}
      </div>

      <div class="grid-2">
        <div class="field">
          <label>Título del bloque</label>
          <input
            type="text"
            data-field="title"
            value="${escapeHtml(card.title)}"
            placeholder="Ej. Rubisco Biotechnology avanza..."
          />
        </div>

        <div class="field">
          <label>Fuente o etiqueta</label>
          <input
            type="text"
            data-field="source"
            value="${escapeHtml(card.source)}"
            placeholder="Ej. Diario Financiero (DF LAB)"
          />
        </div>
      </div>

      ${
        card.type === "story"
          ? `
            <div class="field">
              <label>Imagen destacada</label>
              ${renderImageSlot(card.id, "image", card.image, "Imagen destacada", {
                allowCaption: true,
                caption: card.imageCaption,
                captionAlign: card.imageCaptionAlign,
                captionField: "imageCaption",
                captionAlignField: "imageCaptionAlign",
              })}
            </div>
          `
          : ""
      }

      ${
        card.type === "gallery"
          ? `
            <div class="field">
              <label>Galería</label>
              <div class="image-grid">
                ${renderImageSlot(card.id, 0, card.images[0], "Imagen 1", {
                  allowCaption: true,
                  caption: card.imageCaptions[0],
                  captionAlign: card.imageCaptionAligns[0],
                  captionField: "imageCaptions.0",
                  captionAlignField: "imageCaptionAligns.0",
                })}
                ${renderImageSlot(card.id, 1, card.images[1], "Imagen 2", {
                  allowCaption: true,
                  caption: card.imageCaptions[1],
                  captionAlign: card.imageCaptionAligns[1],
                  captionField: "imageCaptions.1",
                  captionAlignField: "imageCaptionAligns.1",
                })}
              </div>
            </div>

            <div class="field">
              <label>Pie común</label>
              <input
                type="text"
                data-field="caption"
                value="${escapeHtml(card.caption)}"
                placeholder="Texto común"
              />
            </div>
          `
          : ""
      }

      <div class="field">
        <label>${descriptionLabel}</label>
        <textarea
          class="autosize"
          data-field="desc"
          rows="${textareaRows(card.desc, card.type === "note" ? 7 : 6)}"
          placeholder="Pega o escribe el texto del bloque. Usa líneas en blanco para separar párrafos."
        >${escapeHtml(card.desc)}</textarea>
      </div>
    </article>
  `;
}

function getImageEditorOutput() {
  return {
    width: clamp(safeNumber(id("image_editor_width")?.value, 1200), 120, 2400),
    height: clamp(safeNumber(id("image_editor_height")?.value, 675), 120, 2400),
  };
}

function updateImageEditorZoomLabel() {
  const zoom = id("image_editor_zoom");
  const label = id("image_editor_zoom_label");
  if (!zoom || !label) return;
  label.textContent = `${Math.round(Number(zoom.value) * 100)}%`;
}

function updateImageEditorSourceLabel() {
  const source = id("image_editor_source");
  if (!source) return;
  source.textContent =
    state.imageEditor.imageName || state.imageEditor.imageUrl || "Imagen seleccionada";
}

function syncImageEditorControls() {
  const editor = state.imageEditor;
  const width = id("image_editor_width");
  const height = id("image_editor_height");
  const zoom = id("image_editor_zoom");

  if (width) width.value = String(editor.outputWidth);
  if (height) height.value = String(editor.outputHeight);

  if (zoom) {
    zoom.min = String(editor.minScale);
    zoom.max = String(Math.max(editor.minScale * 4, editor.minScale + 1));
    zoom.value = String(editor.scale);
  }

  updateImageEditorZoomLabel();
}

function clampImageEditorOffsets() {
  const editor = state.imageEditor;
  if (!editor.image) return;

  const drawWidth = editor.image.width * editor.scale;
  const drawHeight = editor.image.height * editor.scale;

  if (drawWidth <= editor.outputWidth) {
    editor.offsetX = (editor.outputWidth - drawWidth) / 2;
  } else {
    editor.offsetX = clamp(editor.offsetX, editor.outputWidth - drawWidth, 0);
  }

  if (drawHeight <= editor.outputHeight) {
    editor.offsetY = (editor.outputHeight - drawHeight) / 2;
  } else {
    editor.offsetY = clamp(editor.offsetY, editor.outputHeight - drawHeight, 0);
  }
}

function renderImageEditorCanvas() {
  const canvas = id("image_editor_canvas");
  const stage = canvas?.parentElement;
  const editor = state.imageEditor;
  if (!canvas || !stage) return;

  const ratio = editor.outputWidth / editor.outputHeight;
  const bounds = stage.getBoundingClientRect();
  const maxWidth = Math.max(bounds.width - 20, 180);
  const maxHeight = Math.max(bounds.height - 20, 180);

  let displayWidth = maxWidth;
  let displayHeight = displayWidth / ratio;
  if (displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = displayHeight * ratio;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(displayWidth * dpr);
  canvas.height = Math.round(displayHeight * dpr);
  canvas.style.width = `${Math.round(displayWidth)}px`;
  canvas.style.height = `${Math.round(displayHeight)}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  if (!editor.image) return;

  const displayScale = displayWidth / editor.outputWidth;
  const drawWidth = editor.image.width * editor.scale * displayScale;
  const drawHeight = editor.image.height * editor.scale * displayScale;
  const drawX = editor.offsetX * displayScale;
  const drawY = editor.offsetY * displayScale;

  ctx.drawImage(editor.image, drawX, drawY, drawWidth, drawHeight);
}

function fitImageEditorToFrame() {
  const editor = state.imageEditor;
  if (!editor.image) return;

  editor.minScale = Math.max(
    editor.outputWidth / editor.image.width,
    editor.outputHeight / editor.image.height
  );
  editor.scale = editor.minScale;
  editor.offsetX = (editor.outputWidth - editor.image.width * editor.scale) / 2;
  editor.offsetY =
    (editor.outputHeight - editor.image.height * editor.scale) / 2;

  clampImageEditorOffsets();
  syncImageEditorControls();
  renderImageEditorCanvas();
}

function applyImageEditorSize() {
  const editor = state.imageEditor;
  const next = getImageEditorOutput();

  const currentCenterX = editor.outputWidth / 2 - editor.offsetX;
  const currentCenterY = editor.outputHeight / 2 - editor.offsetY;
  const imageCenterX = currentCenterX / (editor.scale || 1);
  const imageCenterY = currentCenterY / (editor.scale || 1);

  editor.outputWidth = next.width;
  editor.outputHeight = next.height;

  if (!editor.image) {
    syncImageEditorControls();
    renderImageEditorCanvas();
    return;
  }

  editor.minScale = Math.max(
    editor.outputWidth / editor.image.width,
    editor.outputHeight / editor.image.height
  );
  editor.scale = Math.max(editor.scale, editor.minScale);
  editor.offsetX = editor.outputWidth / 2 - imageCenterX * editor.scale;
  editor.offsetY = editor.outputHeight / 2 - imageCenterY * editor.scale;

  clampImageEditorOffsets();
  syncImageEditorControls();
  renderImageEditorCanvas();
}

function closeImageEditor() {
  state.imageEditor.open = false;
  state.imageEditor.dragPointerId = null;
  id("image-editor-modal")?.classList.add("hidden");
  id("image_editor_canvas")?.classList.remove("is-dragging");
}

function loadImageSource(src, options = {}) {
  const { crossOrigin = false } = options;
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    image.src = src;
  });
}

async function rasterizeSvgBlob(blob, originalName = "imagen.svg") {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImageSource(objectUrl);
    const width = clamp(image.naturalWidth || image.width || 1200, 1, 2400);
    const height = clamp(image.naturalHeight || image.height || 1200, 1, 2400);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No se pudo preparar el SVG para correo.");
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((fileBlob) => {
        if (fileBlob) resolve(fileBlob);
        else reject(new Error("No se pudo convertir el SVG a PNG."));
      }, "image/png");
    });

    return new File([pngBlob], replaceFileExtension(originalName, "png"), {
      type: "image/png",
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function normalizeFileForEmail(file) {
  if (!isSvgFile(file)) return file;
  setPreviewStatus("Convirtiendo SVG a PNG para correo...", "warn");
  return rasterizeSvgBlob(file, file.name || "imagen.svg");
}

async function getEmailSafeMediaItem(item) {
  if (!item?.url || !isSvgAssetReference(item.url, item.name)) return item;

  setPreviewStatus("Preparando SVG para correo...", "warn");
  const response = await fetch(item.url);
  if (!response.ok) {
    throw new Error("No se pudo preparar esta imagen SVG para el correo.");
  }

  const blob = await response.blob();
  const file = await rasterizeSvgBlob(
    blob,
    item.name || fileNameFromUrl(item.url) || "imagen.svg"
  );
  return uploadImage(file);
}

function createEditableImage(url) {
  return loadImageSource(url, { crossOrigin: true }).catch(() => {
    throw new Error(
      "No se pudo abrir esta imagen para editarla. Si viene de una URL externa, súbela primero a la biblioteca."
    );
  });
}

async function openImageEditor(cardId, slot) {
  const card = state.cards.find((entry) => entry.id === cardId);
  if (!card) return;

  const url =
    slot === "image" ? card.image : card.images?.[Number(slot)] || "";
  if (!url) {
    alert("Primero asigna una imagen para poder editarla.");
    return;
  }

  try {
    setPreviewStatus("Abriendo editor de imagen...", "ok");
    const image = await createEditableImage(url);
    const editor = state.imageEditor;
    editor.cardId = cardId;
    editor.slot = slot;
    editor.imageUrl = url;
    editor.imageName = url.split("/").pop() || "imagen";
    editor.image = image;
    editor.outputWidth = card.type === "gallery" ? 900 : 1200;
    editor.outputHeight = card.type === "gallery" ? 900 : 675;

    updateImageEditorSourceLabel();
    id("image-editor-modal")?.classList.remove("hidden");
    editor.open = true;
    window.requestAnimationFrame(() => {
      fitImageEditorToFrame();
    });
    setPreviewStatus("Editor de imagen listo", "ok");
  } catch (error) {
    console.error(error);
    setPreviewStatus(error.message || "No se pudo abrir el editor", "error");
    alert(error.message || "No se pudo abrir el editor de imagen");
  }
}

function resetImageEditor() {
  fitImageEditorToFrame();
}

async function applyImageEditor() {
  const editor = state.imageEditor;
  if (!editor.image) return;

  const canvas = document.createElement("canvas");
  canvas.width = editor.outputWidth;
  canvas.height = editor.outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    editor.image,
    editor.offsetX,
    editor.offsetY,
    editor.image.width * editor.scale,
    editor.image.height * editor.scale
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((fileBlob) => {
      if (fileBlob) resolve(fileBlob);
      else reject(new Error("No se pudo generar la imagen editada."));
    }, "image/png");
  });

  try {
    setPreviewStatus("Guardando imagen editada...", "ok");
    const file = new File([blob], "newsletter-edited.png", {
      type: "image/png",
    });
    const uploaded = await uploadImage(file);
    assignImage(editor.cardId, editor.slot, uploaded.url);
    closeImageEditor();
    setPreviewStatus("Imagen editada aplicada", "ok");
  } catch (error) {
    console.error(error);
    setPreviewStatus(error.message || "No se pudo guardar la imagen", "error");
    alert(error.message || "No se pudo guardar la imagen editada");
  }
}

function renderBlocksList() {
  const container = id("blocks_list");
  const empty = id("blocks_empty");
  if (!container || !empty) return;

  empty.style.display = state.cards.length ? "none" : "block";
  container.innerHTML = state.cards.map((card, index) => renderBlock(card, index)).join("");
  autosizeTextareas(container);
}

function autosizeTextareas(root = document) {
  root.querySelectorAll("textarea.autosize, #subheading").forEach((textarea) => {
    const minHeight = safeNumber(textarea.dataset.minHeight, 130);
    textarea.style.height = "0px";
    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
  });
}

function getPreviewScrollState() {
  const frame = id("frame");
  const view = frame?.contentWindow;
  const doc = frame?.contentDocument;
  const root = doc?.scrollingElement || doc?.documentElement || doc?.body;

  if (!view || !root) {
    return { x: 0, y: 0, ratioY: 0 };
  }

  const y = view.scrollY || root.scrollTop || 0;
  const maxY = Math.max(root.scrollHeight - view.innerHeight, 0);

  return {
    x: view.scrollX || 0,
    y,
    ratioY: maxY > 0 ? y / maxY : 0,
  };
}

function restorePreviewScroll(scrollState) {
  const frame = id("frame");
  const view = frame?.contentWindow;
  const doc = frame?.contentDocument;
  const root = doc?.scrollingElement || doc?.documentElement || doc?.body;
  if (!view || !root) return;

  const maxY = Math.max(root.scrollHeight - view.innerHeight, 0);
  const targetY =
    scrollState.y > 0
      ? Math.min(Math.round(maxY * scrollState.ratioY), maxY)
      : 0;

  view.scrollTo(scrollState.x || 0, targetY);
}

function schedulePreview() {
  window.clearTimeout(state.previewTimer);
  state.previewTimer = window.setTimeout(() => preview(), 350);
}

function buildPayload() {
  return {
    meta: {
      issue: normalizeIssue(valueOf("issue")),
      date: formatNewsletterDate(valueOf("date")),
    },
    brand: {
      name: valueOf("brand_name"),
      logo: valueOf("brand_logo"),
      primary: valueOf("brand_primary"),
      bg: valueOf("brand_bg"),
      text: valueOf("brand_text"),
      gray: valueOf("brand_gray"),
      dark: "#111827",
    },
    unsubscribe: valueOf("unsubscribe"),
    edition: {
      subject: valueOf("subject"),
      preheader: valueOf("preheader"),
      preview: valueOf("preheader"),
      heading: valueOf("heading"),
      subheading: valueOf("subheading"),
      cards: state.cards.map((card) => toPayloadCard(card)),
    },
    legal: {
      copyright: valueOf("copyright"),
    },
  };
}

async function compileNewsletter() {
  const response = await fetch("/api/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildPayload()),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || "No se pudo compilar el newsletter");
  }

  return data;
}

function timestampLabel() {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

async function preview() {
  const requestId = ++state.previewRequestId;
  const frame = id("frame");
  const scrollState = getPreviewScrollState();
  setPreviewStatus("Compilando preview...", "ok");

  try {
    const out = await compileNewsletter();
    if (requestId !== state.previewRequestId) return;

    if (state.currentPreviewUrl) {
      URL.revokeObjectURL(state.currentPreviewUrl);
      state.currentPreviewUrl = null;
    }

    if (frame) {
      frame.onload = () => {
        window.requestAnimationFrame(() => restorePreviewScroll(scrollState));
      };
      frame.srcdoc = out.html;
    }

    id("plain_text_output").value = out.text || "";

    const svgIssues = getSvgAssetIssues();
    const mjmlWarnings = Array.isArray(out.errors) ? out.errors.length : 0;
    const warningCount = svgIssues.length + mjmlWarnings;

    if (warningCount > 0) {
      const message = svgIssues.length
        ? `Preview actualizado con ${warningCount} alerta(s)`
        : `Compilado con ${warningCount} advertencia(s)`;
      setPreviewStatus(message, "warn");
    } else {
      setPreviewStatus("Preview actualizado", "ok");
    }

    setPreviewStamp(`Última compilación ${timestampLabel()}`);
  } catch (error) {
    console.error(error);
    setPreviewStatus(error.message || "Error al compilar", "error");
  }
}

async function downloadHtml() {
  try {
    setPreviewStatus("Generando HTML...", "ok");
    const out = await compileNewsletter();
    const issue = normalizeIssue(valueOf("issue")) || "newsletter";
    const a = document.createElement("a");
    a.href = `data:text/html;charset=utf-8,${encodeURIComponent(out.html)}`;
    a.download = `newsletter-n${issue}.html`;
    a.click();
    setPreviewStatus("HTML listo para descargar", "ok");
  } catch (error) {
    console.error(error);
    setPreviewStatus(error.message || "No se pudo descargar el HTML", "error");
    alert(error.message || "No se pudo descargar el HTML");
  }
}

async function sendTest() {
  const sendUi = getSendButtonUi();

  try {
    const svgIssues = getSvgAssetIssues();
    if (svgIssues.length) {
      sendUi?.error("Revisa imágenes");
      setPreviewStatus("Corrige las imágenes SVG antes de enviar", "error");
      alert(
        `Antes de enviar la prueba, reemplaza estas imágenes SVG por una versión PNG/JPG o vuelve a elegirlas desde la biblioteca para convertirlas:\n\n- ${svgIssues.join("\n- ")}`
      );
      return;
    }

    sendUi?.start("Enviando");
    setPreviewStatus("Enviando prueba...", "ok");
    const to = valueOf("test_to").trim();
    const query = to ? `?to=${encodeURIComponent(to)}` : "";

    const response = await fetch(`/api/send-test${query}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    const out = await response.json();
    if (!out.ok) throw new Error(out.error || "No se pudo enviar la prueba");

    sendUi?.success("Enviado");
    setPreviewStatus(`Prueba enviada (${out.messageId})`, "ok");
    alert(`Correo enviado correctamente.\nMessage ID: ${out.messageId}`);
  } catch (error) {
    console.error(error);
    sendUi?.error("Reintentar");
    setPreviewStatus(error.message || "Error al enviar la prueba", "error");
    alert(error.message || "Error al enviar la prueba");
  }
}

async function uploadImage(file) {
  if (!file) throw new Error("No se seleccionó archivo");
  const uploadFile = await normalizeFileForEmail(file);
  const form = new FormData();
  form.append("image", uploadFile);

  const response = await fetch("/api/upload", { method: "POST", body: form });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Respuesta inválida del servidor al subir la imagen");
  }

  const out = await response.json();
  if (!out.ok || !out.url) {
    throw new Error(out.error || "No se pudo subir la imagen");
  }

  const item = {
    name: out.name || out.url.split("/").pop() || "imagen",
    url: out.url,
  };
  rememberUploadedMedia(item);
  return item;
}

function rememberUploadedMedia(item) {
  if (!item?.url) return;

  const normalized = {
    name: item.name || item.url.split("/").pop() || "imagen",
    url: item.url,
  };

  const existingIndex = mediaState.items.findIndex(
    (entry) => entry.name === normalized.name || entry.url === normalized.url
  );

  if (existingIndex >= 0) {
    mediaState.items[existingIndex] = normalized;
  } else {
    mediaState.items.unshift(normalized);
  }

  mediaState.loaded = true;

  const modal = id("media-modal");
  if (modal && !modal.classList.contains("hidden")) {
    renderMediaGrid();
  }
}

async function loadMedia() {
  if (mediaState.loading) return Promise.resolve();
  mediaState.loading = true;

  try {
    const response = await fetch("/api/media");
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "No se pudo cargar la biblioteca");
    mediaState.items = data.items || [];
    mediaState.loaded = true;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    mediaState.loading = false;
  }
}

function renderMediaGrid() {
  const grid = id("media_grid");
  const empty = id("media_empty");
  if (!grid || !empty) return;

  grid.innerHTML = "";
  empty.style.display = "none";

  if (!mediaState.items.length) {
    empty.style.display = "block";
    empty.textContent = "Aún no hay imágenes subidas.";
    return;
  }

  mediaState.items.forEach((item) => {
    const usages = getAssetUsageList(item);
    const wrapper = document.createElement("div");
    wrapper.className = "media-item";

    const image = document.createElement("img");
    image.src = item.url;
    image.alt = item.name;

    const removeButton = document.createElement("button");
    removeButton.className = "media-delete";
    removeButton.type = "button";
    removeButton.textContent = "🗑";

    removeButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      const accepted = await openConfirmModal({
        title: usages.length ? "Eliminar imagen en uso" : "Eliminar imagen",
        description: usages.length
          ? "Esta imagen ya está asignada dentro del boletín. Si la borras, esos bloques quedarán apuntando a un archivo que ya no existirá."
          : "La imagen se borrará de la biblioteca y ya no estará disponible para reutilizarla.",
        items: usages.length ? usages : [`Archivo: ${item.name}`],
        confirmLabel: "Eliminar imagen",
      });
      if (!accepted) return;

      try {
        const response = await fetch(`/api/media/${encodeURIComponent(item.name)}`, {
          method: "DELETE",
        });

        const out = await response.json();
        if (!out.ok) throw new Error(out.error || "No se pudo borrar la imagen");

        mediaState.items = mediaState.items.filter((entry) => entry.name !== item.name);
        renderMediaGrid();
      } catch (error) {
        console.error(error);
        alert("No se pudo eliminar el archivo.");
      }
    });

    wrapper.addEventListener("click", async () => {
      try {
        const selectedItem = await getEmailSafeMediaItem(item);
        mediaState.onSelect?.(selectedItem);
        closeMediaModal();
      } catch (error) {
        console.error(error);
        setPreviewStatus(error.message || "No se pudo preparar la imagen", "error");
        alert(error.message || "No se pudo preparar la imagen");
      }
    });

    wrapper.appendChild(image);
    wrapper.appendChild(removeButton);
    grid.appendChild(wrapper);
  });
}

function openMediaModal(onSelect) {
  mediaState.onSelect = onSelect;
  id("media-modal").classList.remove("hidden");

  const finishRender = () => {
    renderMediaGrid();
  };

  if (!mediaState.loaded) {
    loadMedia()
      .then(finishRender)
      .catch(() => {
        const empty = id("media_empty");
        if (empty) {
          empty.style.display = "block";
          empty.textContent = "No se pudieron cargar las imágenes.";
        }
      });
  } else {
    finishRender();
  }
}

function closeMediaModal() {
  id("media-modal").classList.add("hidden");
  mediaState.onSelect = null;
}

function updateCard(cardId, updater) {
  const index = state.cards.findIndex((card) => card.id === cardId);
  if (index === -1) return;
  const updated = normalizeCard(updater({ ...state.cards[index] }));
  state.cards[index] = updated;
}

function assignImage(cardId, slot, url) {
  updateCard(cardId, (card) => {
    if (slot === "image") {
      const next = card.type === "note" ? convertCardType(card, "story") : { ...card };
      next.image = url;
      return next;
    }

    const next = card.type === "gallery" ? { ...card } : convertCardType(card, "gallery");
    next.images = [...next.images];
    next.images[Number(slot)] = url;
    return next;
  });

  renderBlocksList();
  commit({ scheduleOnly: true });
}

function clearImage(cardId, slot) {
  updateCard(cardId, (card) => {
    const next = { ...card };
    if (slot === "image") {
      next.image = "";
    } else {
      next.images = [...next.images];
      next.images[Number(slot)] = "";
    }
    return next;
  });

  renderBlocksList();
  commit({ scheduleOnly: true });
}

function requestUpload(onDone) {
  state.uploadTarget = onDone;
  const input = id("asset_upload_input");
  input.value = "";
  input.click();
}

async function handleUploadInput() {
  const input = id("asset_upload_input");
  const file = input.files?.[0];
  if (!file || !state.uploadTarget) return;

  try {
    setPreviewStatus("Subiendo imagen...", "ok");
    const uploaded = await uploadImage(file);
    state.uploadTarget(uploaded.url);
    setPreviewStatus("Imagen subida correctamente", "ok");
  } catch (error) {
    console.error(error);
    setPreviewStatus(error.message || "Error al subir imagen", "error");
    alert(error.message || "Error al subir la imagen");
  } finally {
    state.uploadTarget = null;
    input.value = "";
  }
}

function updateInlinePreview(slotWrap, url, label) {
  const preview = slotWrap?.querySelector("[data-preview-slot]");
  if (!preview) return;
  preview.innerHTML = imagePreview(url, label);
}

function labelForSlot(slot) {
  return slot === "image"
    ? "Imagen destacada"
    : `Imagen ${Number(slot) + 1}`;
}

function handleBlockFieldInput(event) {
  const target = event.target;
  const field = target.dataset.field;
  if (!field) return;

  const cardElement = target.closest("[data-card-id]");
  if (!cardElement) return;

  const cardId = cardElement.dataset.cardId;
  const value = target.value;

  updateCard(cardId, (card) => {
    const next = { ...card };

    if (field.includes(".")) {
      const [baseField, rawIndex] = field.split(".");
      const index = Number(rawIndex);
      if (Array.isArray(next[baseField])) {
        next[baseField] = [...next[baseField]];
        next[baseField][index] = value;
      } else {
        next[field] = value;
      }
    } else {
      next[field] = value;
    }

    return next;
  });

  if (field === "title") {
    const titleEl = cardElement.querySelector("[data-role='block-title']");
    if (titleEl) {
      const meta = TYPE_META[state.cards.find((card) => card.id === cardId)?.type || "story"];
      titleEl.textContent = value.trim() || meta.empty;
    }
  }

  if (field === "image" || field.startsWith("images.")) {
    const slot = field === "image" ? "image" : Number(field.split(".")[1]);
    const slotWrap = target.closest("[data-slot-wrap]");
    updateInlinePreview(slotWrap, value.trim(), labelForSlot(slot));
    const editButton = slotWrap?.querySelector('[data-action="edit-image"]');
    if (editButton) editButton.disabled = !value.trim();
  }

  if (target.tagName === "TEXTAREA") autosizeTextareas(cardElement);

  commit({ scheduleOnly: true });
}

function handleBlockActions(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const cardElement = actionButton.closest("[data-card-id]");
  const cardId = cardElement?.dataset.cardId;
  const action = actionButton.dataset.action;

  if (action === "switch-type" && cardId) {
    const nextType = actionButton.dataset.type;
    updateCard(cardId, (card) => convertCardType(card, nextType));
    renderBlocksList();
    commit({ scheduleOnly: true });
    return;
  }

  if (!cardId) return;

  const index = state.cards.findIndex((card) => card.id === cardId);
  if (index === -1) return;

  if (action === "move-up" && index > 0) {
    [state.cards[index - 1], state.cards[index]] = [
      state.cards[index],
      state.cards[index - 1],
    ];
    renderBlocksList();
    commit({ scheduleOnly: true });
    return;
  }

  if (action === "move-down" && index < state.cards.length - 1) {
    [state.cards[index + 1], state.cards[index]] = [
      state.cards[index],
      state.cards[index + 1],
    ];
    renderBlocksList();
    commit({ scheduleOnly: true });
    return;
  }

  if (action === "duplicate") {
    const duplicate = normalizeCard({
      ...exportCard(state.cards[index]),
      id: makeId(),
    });
    state.cards.splice(index + 1, 0, duplicate);
    renderBlocksList();
    commit({ scheduleOnly: true });
    return;
  }

  if (action === "delete") {
    if (!confirm("¿Eliminar este bloque?")) return;
    state.cards.splice(index, 1);
    renderBlocksList();
    commit({ scheduleOnly: true });
    return;
  }

  if (action === "upload-image") {
    const slot = actionButton.dataset.slot;
    requestUpload((url) => assignImage(cardId, slot, url));
    return;
  }

  if (action === "pick-image") {
    const slot = actionButton.dataset.slot;
    openMediaModal((item) => assignImage(cardId, slot, item.url));
    return;
  }

  if (action === "edit-image") {
    openImageEditor(cardId, actionButton.dataset.slot);
    return;
  }

  if (action === "set-caption-align") {
    const fieldName = actionButton.dataset.alignField;
    const align = normalizeCaptionAlign(actionButton.dataset.align);
    if (!fieldName) return;
    updateCard(cardId, (card) => {
      const next = { ...card };

      if (fieldName.includes(".")) {
        const [baseField, rawIndex] = fieldName.split(".");
        const index = Number(rawIndex);
        next[baseField] = [...next[baseField]];
        next[baseField][index] = align;
      } else {
        next[fieldName] = align;
      }

      return next;
    });
    renderBlocksList();
    commit({ scheduleOnly: true });
    return;
  }

  if (action === "clear-image") {
    clearImage(cardId, actionButton.dataset.slot);
  }
}

function commit(options = {}) {
  const { scheduleOnly = false } = options;

  refreshIssueHint();
  refreshLogoPreview();
  refreshSummary();
  syncJsonPanel();
  saveDraft();

  if (scheduleOnly) {
    schedulePreview();
    return;
  }

  schedulePreview();
}

function addCard(type) {
  state.cards.push(createCard(type));
  renderBlocksList();
  commit({ scheduleOnly: true });
}

async function copyJson() {
  const text = id("cards_json").value;
  try {
    await navigator.clipboard.writeText(text);
    setPreviewStatus("JSON copiado al portapapeles", "ok");
  } catch (error) {
    console.error(error);
    alert("No se pudo copiar el JSON.");
  }
}

function applyJson() {
  try {
    const parsed = JSON.parse(id("cards_json").value || "[]");
    if (!Array.isArray(parsed)) {
      throw new Error("El JSON debe ser un arreglo de bloques.");
    }
    state.cards = normalizeCards(parsed);
    renderBlocksList();
    commit({ scheduleOnly: true });
  } catch (error) {
    console.error(error);
    alert(error.message || "JSON inválido.");
  }
}

function restoreSampleDraft() {
  if (!state.defaultDraft) return;
  if (!confirm("Se reemplazará el borrador actual por el ejemplo base. ¿Continuar?")) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  applyDraft(state.defaultDraft, { renderBlocks: true, previewNow: true, save: true });
}

function togglePreviewView(view) {
  state.currentView = view;
  const shell = id("mail_shell");
  const toggle = id("view_toggle");
  if (!shell) return;

  shell.classList.remove("desktop", "mobile");
  shell.classList.add(view);

  if (!toggle) return;

  toggle.dataset.activeView = view;
  toggle.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function bindImageEditorControls() {
  const canvas = id("image_editor_canvas");
  const zoom = id("image_editor_zoom");
  const width = id("image_editor_width");
  const height = id("image_editor_height");
  const editor = state.imageEditor;

  id("image_editor_close")?.addEventListener("click", closeImageEditor);
  document
    .querySelector("#image-editor-modal .media-backdrop")
    ?.addEventListener("click", closeImageEditor);
  id("image_editor_reset")?.addEventListener("click", resetImageEditor);
  id("image_editor_apply")?.addEventListener("click", applyImageEditor);

  zoom?.addEventListener("input", () => {
    editor.scale = Number(zoom.value);
    clampImageEditorOffsets();
    updateImageEditorZoomLabel();
    renderImageEditorCanvas();
  });

  width?.addEventListener("change", applyImageEditorSize);
  height?.addEventListener("change", applyImageEditorSize);

  canvas?.addEventListener("pointerdown", (event) => {
    if (!editor.image) return;
    editor.dragPointerId = event.pointerId;
    editor.dragStartX = event.clientX;
    editor.dragStartY = event.clientY;
    editor.startOffsetX = editor.offsetX;
    editor.startOffsetY = editor.offsetY;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(event.pointerId);
  });

  canvas?.addEventListener("pointermove", (event) => {
    if (editor.dragPointerId !== event.pointerId || !editor.image) return;

    const displayWidth = canvas.clientWidth;
    const ratio = displayWidth / editor.outputWidth;
    editor.offsetX =
      editor.startOffsetX + (event.clientX - editor.dragStartX) / ratio;
    editor.offsetY =
      editor.startOffsetY + (event.clientY - editor.dragStartY) / ratio;
    clampImageEditorOffsets();
    renderImageEditorCanvas();
  });

  const stopDrag = (event) => {
    if (editor.dragPointerId !== event.pointerId) return;
    editor.dragPointerId = null;
    canvas.classList.remove("is-dragging");
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  canvas?.addEventListener("pointerup", stopDrag);
  canvas?.addEventListener("pointercancel", stopDrag);

  window.addEventListener("resize", () => {
    if (editor.open) renderImageEditorCanvas();
  });
}

function bindFormFields() {
  FIELD_IDS.forEach((fieldId) => {
    const field = id(fieldId);
    if (!field) return;
    field.addEventListener("input", () => {
      if (fieldId === "brand_logo") refreshLogoPreview();
      if (fieldId === "issue") refreshIssueHint();
      if (field.tagName === "TEXTAREA") autosizeTextareas();
      commit({ scheduleOnly: true });
    });
    field.addEventListener("change", () => commit({ scheduleOnly: true }));
  });
}

function bindPreviewControls() {
  getSendButtonUi();
  id("btnPreview")?.addEventListener("click", preview);
  id("btnDownload")?.addEventListener("click", downloadHtml);
  id("btnSend")?.addEventListener("click", sendTest);

  id("view_toggle")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    togglePreviewView(button.dataset.view);
  });
}

function bindBlockControls() {
  id("add_story_btn")?.addEventListener("click", () => addCard("story"));
  id("add_gallery_btn")?.addEventListener("click", () => addCard("gallery"));
  id("add_note_btn")?.addEventListener("click", () => addCard("note"));

  const blocks = id("blocks_list");
  blocks?.addEventListener("input", handleBlockFieldInput);
  blocks?.addEventListener("click", handleBlockActions);
}

function bindAssetControls() {
  id("upload_logo_btn")?.addEventListener("click", () => {
    requestUpload((url) => {
      setValue("brand_logo", url);
      refreshLogoPreview();
      commit({ scheduleOnly: true });
    });
  });

  id("choose_logo_existing")?.addEventListener("click", () => {
    openMediaModal((item) => {
      setValue("brand_logo", item.url);
      refreshLogoPreview();
      commit({ scheduleOnly: true });
    });
  });

  id("clear_logo_btn")?.addEventListener("click", () => {
    setValue("brand_logo", "");
    refreshLogoPreview();
    commit({ scheduleOnly: true });
  });

  id("asset_upload_input")?.addEventListener("change", handleUploadInput);

  id("media_close")?.addEventListener("click", closeMediaModal);
  document
    .querySelector("#media-modal .media-backdrop")
    ?.addEventListener("click", closeMediaModal);
}

function bindConfirmModal() {
  id("confirm_close")?.addEventListener("click", () => closeConfirmModal(false));
  id("confirm_cancel")?.addEventListener("click", () => closeConfirmModal(false));
  id("confirm_accept")?.addEventListener("click", () => closeConfirmModal(true));
  document
    .querySelector("#confirm-modal .media-backdrop")
    ?.addEventListener("click", () => closeConfirmModal(false));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const modal = id("confirm-modal");
    if (modal && !modal.classList.contains("hidden")) {
      closeConfirmModal(false);
    }
  });
}

function bindAdvancedControls() {
  id("apply_json_btn")?.addEventListener("click", applyJson);
  id("copy_json_btn")?.addEventListener("click", copyJson);
  id("load_sample_btn")?.addEventListener("click", restoreSampleDraft);
}

function finishAccordionAnimation(panel, shouldOpen) {
  panel.style.height = "";
  panel.style.overflow = "";
  panel.style.transition = "";
  panel.dataset.animating = "false";
  if (!shouldOpen) panel.open = false;
}

function animateAccordion(panel, shouldOpen) {
  const summary = panel.querySelector(".panel-head");
  if (!summary) return;

  const startHeight = panel.getBoundingClientRect().height;
  panel.dataset.animating = "true";
  panel.style.height = `${startHeight}px`;
  panel.style.overflow = "hidden";
  panel.style.transition = "height 240ms cubic-bezier(0.22, 1, 0.36, 1)";

  if (shouldOpen) {
    panel.open = true;
  }

  const endHeight = shouldOpen
    ? panel.scrollHeight
    : summary.getBoundingClientRect().height;

  const handleDone = (event) => {
    if (event.propertyName !== "height") return;
    panel.removeEventListener("transitionend", handleDone);
    finishAccordionAnimation(panel, shouldOpen);
  };

  panel.removeEventListener("transitionend", handleDone);
  panel.addEventListener("transitionend", handleDone);

  window.requestAnimationFrame(() => {
    panel.style.height = `${endHeight}px`;
  });
}

function toggleAccordion(panel, shouldOpen) {
  if (panel.dataset.animating === "true") return;
  if (shouldOpen === panel.open) return;
  animateAccordion(panel, shouldOpen);
}

function bindAccordionBehavior() {
  document.querySelectorAll("details.panel").forEach((panel) => {
    const summary = panel.querySelector(".panel-head");
    summary?.addEventListener("click", (event) => {
      event.preventDefault();

      if (panel.dataset.animating === "true") return;

      const shouldOpen = !panel.open;

      if (shouldOpen) {
        document.querySelectorAll("details.panel[open]").forEach((other) => {
          if (other !== panel) toggleAccordion(other, false);
        });
      }

      toggleAccordion(panel, shouldOpen);
    });
  });
}

function init() {
  window.addEventListener("error", (event) => {
    setPreviewStatus(event.message || "Error de JavaScript", "error");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || event.reason || "Error inesperado";
    setPreviewStatus(String(reason), "error");
  });

  bindColorPair("brand_primary_picker", "brand_primary");
  bindColorPair("brand_bg_picker", "brand_bg");
  bindColorPair("brand_text_picker", "brand_text");
  bindColorPair("brand_gray_picker", "brand_gray");

  bindFormFields();
  bindPreviewControls();
  bindBlockControls();
  bindAssetControls();
  bindConfirmModal();
  bindImageEditorControls();
  bindAdvancedControls();
  bindAccordionBehavior();

  syncColorInputs();

  const defaultFields = getFieldState();
  const defaultCards = normalizeCards(readInitialCards());
  state.defaultDraft = {
    fields: defaultFields,
    cards: defaultCards.map((card) => exportCard(card)),
  };

  const stored = loadStoredDraft();
  if (stored) {
    applyDraft(stored, { renderBlocks: true, previewNow: false, save: false });
  } else {
    applyDraft(state.defaultDraft, {
      renderBlocks: true,
      previewNow: false,
      save: true,
    });
  }

  togglePreviewView(state.currentView);
  autosizeTextareas();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
