const STORAGE_KEY = "newsletter-fisuc-draft-v2";
const CONFIG_FIELD_IDS = [
  "config_smtp_host",
  "config_smtp_port",
  "config_smtp_user",
  "config_smtp_pass",
  "config_from_email",
  "config_from_name",
  "config_test_to",
];
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
const EMAIL_ADDRESS_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const RECIPIENT_LIBRARY_STORAGE_KEY = "newsletter-fisuc-recipient-lists-v1";
const DEFAULT_BROADCAST_BATCH_SIZE = 200;
const BROADCAST_BATCH_SIZE_OPTIONS = [50, 100, 200, 250, 500];

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
const PROVIDER_PRESETS = {
  gmail: {
    key: "gmail",
    label: "Gmail",
    tone: "gmail",
    description: "Ideal si usarás una cuenta Google con contraseña de aplicación.",
    host: "smtp.gmail.com",
    port: "587",
    iconSrc: "/provider-icons/gmail.svg",
    meta: "Configuración automática",
    steps: [
      {
        title: "Entra a tu Cuenta de Google",
        copy:
          "Abre la seguridad de tu cuenta Google y revisa si ya tienes activada la verificación en dos pasos.",
        links: [
          {
            label: "Google: verificación en dos pasos",
            url: "https://support.google.com/accounts/answer/185839",
          },
        ],
      },
      {
        title: "Crea una contraseña de aplicación",
        copy:
          "Google te entregará una clave de 16 caracteres. Esa es la que debes pegar en esta app como contraseña.",
        links: [
          {
            label: "Google: contraseñas de aplicación",
            url: "https://support.google.com/mail/answer/185833",
          },
        ],
      },
      {
        title: "Vuelve a esta pantalla",
        copy:
          "Escribe tu correo Gmail, pega la clave de aplicación y define el nombre visible. La parte técnica se completa sola.",
        links: [
          {
            label: "Google: ayuda SMTP",
            url: "https://support.google.com/a/answer/176600?hl=en",
          },
        ],
      },
      {
        title: "Si no ves la opción",
        copy:
          "Si es una cuenta de trabajo o estudio, puede que el administrador haya bloqueado las contraseñas de aplicación. En ese caso esta app no podrá usar esa cuenta todavía.",
      },
    ],
  },
  office365: {
    key: "office365",
    label: "Outlook / Microsoft 365",
    tone: "outlook",
    description: "Pensado para cuentas de trabajo o institución en Microsoft 365.",
    host: "smtp.office365.com",
    port: "587",
    iconSrc: "/provider-icons/outlook.svg",
    meta: "Configuración automática",
    steps: [
      {
        title: "Confirma que tu cuenta pueda enviar desde apps",
        copy:
          "En muchas organizaciones esta opción está bloqueada por seguridad. Si es una cuenta de empresa o universidad, quizá necesites ayuda del administrador.",
        links: [
          {
            label: "Microsoft: envío autenticado",
            url: "https://learn.microsoft.com/en-us/Exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission",
          },
        ],
      },
      {
        title: "Usa tu correo completo",
        copy:
          "Normalmente aquí usarás el correo completo de la cuenta que enviará las pruebas y su contraseña.",
      },
      {
        title: "Si falla aunque la clave esté bien",
        copy:
          "El problema suele estar en una política de seguridad del tenant, permisos del buzón o en que el método de inicio de sesión permitido no sea compatible con esta app.",
      },
      {
        title: "Para cuentas personales Outlook.com",
        copy:
          "Si usas una cuenta personal Outlook.com, este flujo puede no funcionar porque Microsoft suele exigir métodos más modernos como OAuth.",
      },
    ],
  },
  custom: {
    key: "custom",
    label: "Otro SMTP",
    tone: "smtp",
    description: "Para hosting, dominio propio o cualquier servidor distinto.",
    host: "",
    port: "587",
    iconSrc: "/provider-icons/smtp.svg",
    meta: "Requiere ajustes avanzados",
    steps: [
      {
        title: "Pide los datos del servidor",
        copy:
          "Tu proveedor debería entregarte correo de envío, contraseña, servidor, puerto y si el usuario es el mismo correo o uno distinto.",
      },
      {
        title: "Confirma desde qué dirección puedes enviar",
        copy:
          "Algunos servicios obligan a usar exactamente la misma dirección que autentica la conexión.",
      },
      {
        title: "Abre los ajustes avanzados",
        copy:
          "En este caso sí tendrás que completar manualmente el servidor, el puerto y, si aplica, el usuario de inicio de sesión.",
      },
      {
        title: "Prueba antes de guardar",
        copy:
          "Si no responde bien, vuelve a revisar los datos con tu proveedor antes de guardar la configuración.",
      },
    ],
  },
};
const STORY_IMAGE_MAX_WIDTH = 552;
const STORY_IMAGE_MIN_WIDTH = 120;
const GALLERY_IMAGE_MAX_WIDTH = 280;
const GALLERY_IMAGE_MIN_WIDTH = 80;

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
  imageSizeEditor: {
    open: false,
    cardId: null,
    slot: null,
    imageUrl: "",
    imageName: "",
    image: null,
    currentWidth: 0,
    minWidth: 0,
    maxWidth: 0,
    dragPointerId: null,
    centerX: 0,
    centerY: 0,
    startDistance: 1,
    startWidth: 0,
  },
  imageResize: {
    active: false,
    pointerId: null,
    cardId: null,
    slot: null,
    slotWrap: null,
    startWidth: 0,
    currentWidth: 0,
    minWidth: 0,
    maxWidth: 0,
    centerX: 0,
    centerY: 0,
    startDistance: 1,
  },
  selectedImage: {
    cardId: null,
    slot: null,
  },
  appConfig: {
    loaded: false,
    loading: false,
    loadError: "",
    saving: false,
    testing: false,
    canPersist: false,
    isConfigured: false,
    source: "none",
    values: {},
    providerKey: "",
    lastTestOk: false,
  },
  appMeta: {
    name: "FISUC Newsletter",
    version: "1.1.0",
  },
  delivery: {
    recipients: [],
    batchSize: DEFAULT_BROADCAST_BATCH_SIZE,
  },
  recipientLibrary: {
    items: [],
    selectedId: "",
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

function normalizeBroadcastBatchSize(value) {
  const parsed = Number.parseInt(value, 10);
  return BROADCAST_BATCH_SIZE_OPTIONS.includes(parsed)
    ? parsed
    : DEFAULT_BROADCAST_BATCH_SIZE;
}

function getTodayIsoDate() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function pluralizeEs(count, singular, plural) {
  return count === 1 ? singular : plural;
}

function batchSizeToScaleIndex(value) {
  const normalized = normalizeBroadcastBatchSize(value);
  const index = BROADCAST_BATCH_SIZE_OPTIONS.indexOf(normalized);
  return index >= 0 ? index : BROADCAST_BATCH_SIZE_OPTIONS.indexOf(DEFAULT_BROADCAST_BATCH_SIZE);
}

function scaleIndexToBatchSize(value) {
  const index = Number.parseInt(value, 10);
  if (!Number.isFinite(index)) return DEFAULT_BROADCAST_BATCH_SIZE;
  return (
    BROADCAST_BATCH_SIZE_OPTIONS[
      Math.min(Math.max(index, 0), BROADCAST_BATCH_SIZE_OPTIONS.length - 1)
    ] || DEFAULT_BROADCAST_BATCH_SIZE
  );
}

function getBroadcastBatchSize() {
  const control = id("broadcast_batch_size");
  if (control?.type === "range") {
    return scaleIndexToBatchSize(control.value);
  }

  return normalizeBroadcastBatchSize(control?.value || state.delivery.batchSize);
}

function syncBroadcastBatchScale() {
  document
    .querySelectorAll("[data-broadcast-batch-size]")
    .forEach((button) => {
      button.classList.toggle(
        "is-active",
        Number.parseInt(button.dataset.broadcastBatchSize || "", 10) ===
          state.delivery.batchSize
      );
    });
}

function setBroadcastBatchSize(value) {
  state.delivery.batchSize = normalizeBroadcastBatchSize(value);
  const control = id("broadcast_batch_size");
  if (control) {
    control.value =
      control.type === "range"
        ? String(batchSizeToScaleIndex(state.delivery.batchSize))
        : String(state.delivery.batchSize);
  }
  syncBroadcastBatchScale();
  refreshBroadcastMeta();
}

function estimateBroadcastBatchCount(count = state.delivery.recipients.length) {
  if (!count) return 0;
  return Math.ceil(count / Math.max(1, getBroadcastBatchSize()));
}

function defaultRecipientListName() {
  return `Lista ${new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date())}`;
}

function formatRecipientLibraryStamp(value) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (_error) {
    return "";
  }
}

function normalizeRecipientLibraryItem(raw = {}, index = 0) {
  const recipients = uniqueRecipientEmails(raw.recipients || []);
  if (!recipients.length) return null;

  const createdAt = raw.createdAt || new Date().toISOString();
  const updatedAt = raw.updatedAt || createdAt;

  return {
    id: String(raw.id || `recipient-list-${Date.now()}-${index}`),
    name: String(raw.name || "").trim() || `Lista ${index + 1}`,
    recipients,
    createdAt,
    updatedAt,
  };
}

function sortRecipientLibraryItems(items = []) {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt || left.createdAt || 0) || 0;
    const rightTime = Date.parse(right.updatedAt || right.createdAt || 0) || 0;
    return rightTime - leftTime;
  });
}

function setSavedRecipientListsHint(message = "") {
  const hint = id("saved_broadcast_lists_hint");
  if (!hint) return;
  hint.textContent = message || "";
}

function renderRecipientLibrary() {
  const select = id("saved_broadcast_lists");
  if (!select) return;

  const loadButton = id("load_broadcast_list_btn");
  const appendButton = id("append_broadcast_list_btn");
  const deleteButton = id("delete_broadcast_list_btn");

  const items = sortRecipientLibraryItems(state.recipientLibrary.items);
  state.recipientLibrary.items = items;

  select.innerHTML = "";

  if (!items.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No hay listas guardadas";
    select.appendChild(option);
    select.disabled = true;
    state.recipientLibrary.selectedId = "";
    if (loadButton) loadButton.disabled = true;
    if (appendButton) appendButton.disabled = true;
    if (deleteButton) deleteButton.disabled = true;
    setSavedRecipientListsHint();
    return;
  }

  const selectedId = items.some((item) => item.id === state.recipientLibrary.selectedId)
    ? state.recipientLibrary.selectedId
    : items[0].id;

  state.recipientLibrary.selectedId = selectedId;
  select.disabled = false;
  if (loadButton) loadButton.disabled = false;
  if (appendButton) appendButton.disabled = false;
  if (deleteButton) deleteButton.disabled = false;

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.name} · ${item.recipients.length} ${pluralizeEs(
      item.recipients.length,
      "destinatario",
      "destinatarios"
    )}`;
    select.appendChild(option);
  });

  select.value = selectedId;

  const selected = items.find((item) => item.id === selectedId);
  setSavedRecipientListsHint(
    selected
      ? `${selected.recipients.length} ${pluralizeEs(
          selected.recipients.length,
          "destinatario",
          "destinatarios"
        )} · ${formatRecipientLibraryStamp(selected.updatedAt)}`
      : ""
  );
}

function persistRecipientLibrary() {
  try {
    localStorage.setItem(
      RECIPIENT_LIBRARY_STORAGE_KEY,
      JSON.stringify(state.recipientLibrary.items)
    );
  } catch (error) {
    console.warn("No se pudieron guardar las listas de destinatarios:", error);
  }
}

function loadRecipientLibrary() {
  try {
    const raw = localStorage.getItem(RECIPIENT_LIBRARY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    state.recipientLibrary.items = sortRecipientLibraryItems(
      parsed
        .map((item, index) => normalizeRecipientLibraryItem(item, index))
        .filter(Boolean)
    );
  } catch (error) {
    console.warn("No se pudieron cargar las listas de destinatarios:", error);
    state.recipientLibrary.items = [];
  }

  renderRecipientLibrary();
}

function upsertRecipientLibraryItem(nextItem) {
  const normalized = normalizeRecipientLibraryItem(nextItem);
  if (!normalized) return null;

  const existingIndex = state.recipientLibrary.items.findIndex(
    (item) => item.id === normalized.id || item.name.toLowerCase() === normalized.name.toLowerCase()
  );

  if (existingIndex >= 0) {
    const current = state.recipientLibrary.items[existingIndex];
    state.recipientLibrary.items[existingIndex] = {
      ...current,
      ...normalized,
      id: current.id,
      createdAt: current.createdAt || normalized.createdAt,
      updatedAt: new Date().toISOString(),
    };
    state.recipientLibrary.selectedId = current.id;
  } else {
    state.recipientLibrary.items.push(normalized);
    state.recipientLibrary.selectedId = normalized.id;
  }

  persistRecipientLibrary();
  renderRecipientLibrary();
  return state.recipientLibrary.items.find(
    (item) => item.id === state.recipientLibrary.selectedId
  );
}

function syncSendActionOffset() {
  const hint = id("send_availability_hint");
  const wrap = hint?.closest(".send-action-wrap");
  if (!hint || !wrap) return;

  if (window.matchMedia("(max-width: 900px)").matches) {
    wrap.style.setProperty("--send-action-offset", "0px");
    return;
  }

  const wrapStyles = window.getComputedStyle(wrap);
  const gap = Number.parseFloat(wrapStyles.rowGap || wrapStyles.gap || "0") || 0;
  const hintHeight = Math.ceil(hint.getBoundingClientRect().height);
  wrap.style.setProperty("--send-action-offset", `${gap + hintHeight}px`);
}

function scheduleSendActionOffsetSync() {
  window.requestAnimationFrame(syncSendActionOffset);
}

function isBroadcastEnabled() {
  return Boolean(id("broadcast_enabled")?.checked);
}

function setBroadcastEnabled(enabled) {
  const checkbox = id("broadcast_enabled");
  if (!checkbox) return;
  checkbox.checked = Boolean(enabled);
}

function normalizeRecipientEmail(value = "") {
  return String(value || "")
    .trim()
    .replace(/^<+|>+$/g, "")
    .toLowerCase();
}

function isRecipientEmailValid(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeRecipientEmail(value));
}

function extractRecipientEmails(raw = "") {
  const text = String(raw || "");
  const matches = text.match(EMAIL_ADDRESS_REGEX);
  if (matches?.length) return matches;
  return text.split(/[,\n;]+/g);
}

function uniqueRecipientEmails(list = []) {
  const seen = new Set();
  return list.reduce((acc, item) => {
    const email = normalizeRecipientEmail(item);
    if (!email || !isRecipientEmailValid(email) || seen.has(email)) return acc;
    seen.add(email);
    acc.push(email);
    return acc;
  }, []);
}

function mergeRecipientValues(values = [], seed = []) {
  const next = uniqueRecipientEmails(seed);
  const seen = new Set(next);
  let addedCount = 0;
  let invalidCount = 0;

  values.forEach((value) => {
    const email = normalizeRecipientEmail(value);
    if (!email) return;
    if (!isRecipientEmailValid(email)) {
      invalidCount += 1;
      return;
    }
    if (seen.has(email)) return;
    seen.add(email);
    next.push(email);
    addedCount += 1;
  });

  return { recipients: next, addedCount, invalidCount };
}

function getBroadcastRecipients() {
  return [...state.delivery.recipients];
}

function getSelectedRecipientList() {
  return (
    state.recipientLibrary.items.find(
      (item) => item.id === state.recipientLibrary.selectedId
    ) || null
  );
}

function getSendActionLabel() {
  return isBroadcastEnabled() ? "Enviar multidifusión" : "Enviar prueba";
}

function refreshBroadcastMeta() {
  const recipientCount = state.delivery.recipients.length;
  const batchSize = getBroadcastBatchSize();
  const batchCount = estimateBroadcastBatchCount(recipientCount);
  const batchLabel = pluralizeEs(batchCount, "lote", "lotes");
  const recipientLabel = pluralizeEs(
    batchSize,
    "destinatario",
    "destinatarios"
  );

  const hintNode = id("broadcast_batch_hint");

  if (hintNode) {
    hintNode.textContent = recipientCount
      ? `${batchCount} ${batchLabel} de hasta ${batchSize} ${recipientLabel}.`
      : `Hasta ${batchSize} ${recipientLabel} por lote.`;
  }
}

function setBroadcastSummary(message = "", tone = "") {
  const summary = id("broadcast_summary");
  if (!summary) return;
  summary.textContent = message;
  if (tone) {
    summary.dataset.tone = tone;
  } else {
    delete summary.dataset.tone;
  }
}

function refreshBroadcastSummary(options = {}) {
  const { addedCount = 0, invalidCount = 0, removed = false } = options;
  const count = state.delivery.recipients.length;
  const recipientLabel = pluralizeEs(count, "destinatario", "destinatarios");
  const invalidLabel =
    invalidCount === 1
      ? "1 correo no se pudo reconocer."
      : `${invalidCount} correos no se pudieron reconocer.`;

  if (!count) {
    setBroadcastSummary(
      invalidCount
        ? `${invalidLabel}`
        : "Enter, coma o pegar lista.",
      invalidCount ? "error" : ""
    );
    return;
  }

  if (invalidCount && addedCount) {
    setBroadcastSummary(
      `${addedCount} agregado(s) · ${invalidLabel}`,
      "warning"
    );
    return;
  }

  if (invalidCount) {
    setBroadcastSummary(
      `${invalidLabel}`,
      "error"
    );
    return;
  }

  if (removed) {
    setBroadcastSummary(
      `${count} ${recipientLabel} en la lista.`,
      ""
    );
    return;
  }

  if (addedCount) {
    setBroadcastSummary(
      `${addedCount} agregado(s) · ${count} total.`,
      ""
    );
    return;
  }

  setBroadcastSummary(
    `${count} ${recipientLabel} en la lista.`,
    ""
  );
}

function renderBroadcastRecipients() {
  const list = id("broadcast_recipient_list");
  if (!list) return;

  const recipients = getBroadcastRecipients();
  if (!recipients.length) {
    list.innerHTML =
      '<div class="recipient-empty">La lista activa aparecerá aquí. Puedes agregar correos uno a uno o pegar una tanda completa.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();

  recipients.forEach((email) => {
    const chip = document.createElement("span");
    chip.className = "recipient-chip";

    const text = document.createElement("span");
    text.className = "recipient-chip__text";
    text.textContent = email;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "recipient-chip__remove";
    removeButton.dataset.removeRecipient = email;
    removeButton.setAttribute("aria-label", `Quitar ${email}`);
    removeButton.textContent = "×";

    chip.append(text, removeButton);
    fragment.appendChild(chip);
  });

  list.innerHTML = "";
  list.appendChild(fragment);
}

function setBroadcastRecipients(list = [], options = {}) {
  state.delivery.recipients = uniqueRecipientEmails(list);
  renderBroadcastRecipients();
  refreshBroadcastSummary(options);
  refreshBroadcastMeta();
}

function addBroadcastRecipients(rawValues = []) {
  const values = Array.isArray(rawValues) ? rawValues : [rawValues];
  const { recipients, addedCount, invalidCount } = mergeRecipientValues(
    values,
    state.delivery.recipients
  );

  setBroadcastRecipients(recipients, { addedCount, invalidCount });
  return { recipients, addedCount, invalidCount };
}

function replaceBroadcastRecipients(rawValues = []) {
  const values = Array.isArray(rawValues) ? rawValues : [rawValues];
  const { recipients, addedCount, invalidCount } = mergeRecipientValues(values);
  setBroadcastRecipients(recipients, { addedCount, invalidCount });
  return { recipients, addedCount, invalidCount };
}

function commitBroadcastInput() {
  const input = id("broadcast_recipient_input");
  if (!input) return { addedCount: 0, invalidCount: 0 };
  const raw = input.value;
  input.value = "";
  return addBroadcastRecipients(extractRecipientEmails(raw));
}

function removeBroadcastRecipient(email) {
  const target = normalizeRecipientEmail(email);
  setBroadcastRecipients(
    state.delivery.recipients.filter((item) => item !== target),
    { removed: true }
  );
}

function selectRecipientLibraryItem(value = "") {
  state.recipientLibrary.selectedId = value;
  renderRecipientLibrary();

  const selected = getSelectedRecipientList();
  const nameInput = id("broadcast_list_name");
  if (nameInput && selected) {
    nameInput.value = selected.name;
  }
}

function toggleBroadcastImportPanel(forceOpen) {
  const panel = id("broadcast_import_panel");
  const button = id("toggle_broadcast_import_btn");
  if (!panel) return;

  const shouldOpen =
    typeof forceOpen === "boolean" ? forceOpen : panel.hidden;

  panel.hidden = !shouldOpen;
  panel.classList.toggle("hidden", !shouldOpen);

  if (button) {
    button.classList.toggle("is-active", shouldOpen);
    button.setAttribute("aria-pressed", String(shouldOpen));
    const label = shouldOpen
      ? "Ocultar pegado masivo"
      : "Mostrar pegado masivo";
    button.setAttribute("title", label);
    button.setAttribute("aria-label", label);
  }

  if (shouldOpen) {
    window.requestAnimationFrame(() => id("broadcast_bulk_input")?.focus());
  }
}

function importBroadcastRecipients(mode = "replace") {
  const textarea = id("broadcast_bulk_input");
  const raw = textarea?.value || "";
  if (!raw.trim()) {
    setPreviewStatus("Pega una lista de correos antes de importarla.", "warn");
    textarea?.focus();
    return;
  }

  const extracted = extractRecipientEmails(raw);
  const result =
    mode === "append"
      ? addBroadcastRecipients(extracted)
      : replaceBroadcastRecipients(extracted);

  if (!result.recipients.length) {
    setPreviewStatus("No se reconocieron correos válidos en la lista.", "error");
    return;
  }

  if (textarea) textarea.value = "";
  toggleBroadcastImportPanel(false);
  commit({ scheduleOnly: true });

  setPreviewStatus(
    mode === "append"
      ? `Se agregaron ${result.addedCount} destinatario(s) desde la lista pegada.`
      : `Se cargó una lista con ${result.recipients.length} destinatario(s).`,
    "ok"
  );
}

function saveCurrentBroadcastList() {
  if (!state.delivery.recipients.length) {
    setPreviewStatus("Agrega destinatarios antes de guardar una lista.", "warn");
    return;
  }

  const nameInput = id("broadcast_list_name");
  const selected = getSelectedRecipientList();
  const typedName = nameInput?.value.trim();
  const name = typedName || selected?.name || defaultRecipientListName();
  const shouldUpdateSelected =
    Boolean(selected) &&
    (!typedName || typedName.toLowerCase() === selected.name.toLowerCase());

  const saved = upsertRecipientLibraryItem({
    id: shouldUpdateSelected ? selected.id : undefined,
    name,
    recipients: state.delivery.recipients,
    createdAt: shouldUpdateSelected ? selected.createdAt : undefined,
  });

  if (nameInput && saved) {
    nameInput.value = saved.name;
  }

  setPreviewStatus(
    saved
      ? `Lista "${saved.name}" guardada con ${saved.recipients.length} destinatario(s).`
      : "No se pudo guardar la lista actual.",
    saved ? "ok" : "error"
  );
}

function applySelectedRecipientList(mode = "replace") {
  const selected = getSelectedRecipientList();
  if (!selected) {
    setPreviewStatus("Selecciona una lista guardada primero.", "warn");
    return;
  }

  const result =
    mode === "append"
      ? addBroadcastRecipients(selected.recipients)
      : replaceBroadcastRecipients(selected.recipients);

  const nameInput = id("broadcast_list_name");
  if (nameInput) {
    nameInput.value = selected.name;
  }

  commit({ scheduleOnly: true });

  if (mode === "append") {
    setPreviewStatus(
      result.addedCount
        ? `Se sumaron ${result.addedCount} destinatario(s) desde "${selected.name}".`
        : `Todos los destinatarios de "${selected.name}" ya estaban en la lista actual.`,
      result.addedCount ? "ok" : "warn"
    );
    return;
  }

  setPreviewStatus(
    `Se cargó "${selected.name}" con ${result.recipients.length} destinatario(s).`,
    "ok"
  );
}

async function deleteSelectedRecipientList() {
  const selected = getSelectedRecipientList();
  if (!selected) {
    setPreviewStatus("Selecciona una lista guardada para eliminar.", "warn");
    return;
  }

  const accepted = await openConfirmModal({
    title: "Eliminar lista guardada",
    description: `Esta acción quitará "${selected.name}" de esta app en este equipo.`,
    items: [`${selected.recipients.length} destinatario(s) guardados`],
    confirmLabel: "Eliminar lista",
  });

  if (!accepted) return;

  state.recipientLibrary.items = state.recipientLibrary.items.filter(
    (item) => item.id !== selected.id
  );
  state.recipientLibrary.selectedId = "";
  persistRecipientLibrary();
  renderRecipientLibrary();

  const nameInput = id("broadcast_list_name");
  if (nameInput && nameInput.value.trim() === selected.name) {
    nameInput.value = "";
  }

  setPreviewStatus(`Se eliminó la lista "${selected.name}".`, "ok");
}

function exportDeliveryState() {
  return {
    broadcastEnabled: isBroadcastEnabled(),
    recipients: getBroadcastRecipients(),
    batchSize: getBroadcastBatchSize(),
  };
}

function applyDeliveryState(delivery = {}) {
  setBroadcastEnabled(Boolean(delivery.broadcastEnabled));
  setBroadcastBatchSize(delivery.batchSize);
  setBroadcastRecipients(Array.isArray(delivery.recipients) ? delivery.recipients : []);
  refreshDeliveryModeUi();
}

function refreshDeliveryModeUi() {
  const broadcastEnabled = isBroadcastEnabled();
  const singleField = id("test_to_field");
  const broadcastPanel = id("broadcast_panel");
  const testToInput = id("test_to");
  const broadcastInput = id("broadcast_recipient_input");
  const broadcastGeneralControls = [
    "broadcast_batch_size",
    "toggle_broadcast_import_btn",
    "broadcast_import_replace_btn",
    "broadcast_import_append_btn",
    "save_broadcast_list_btn",
    "broadcast_list_name",
    "broadcast_bulk_input",
    "clear_broadcast_btn",
  ];
  const sendUi = getSendButtonUi();
  const sendLabel = getSendActionLabel();

  if (singleField) {
    singleField.hidden = broadcastEnabled;
    singleField.classList.toggle("hidden", broadcastEnabled);
  }

  if (broadcastPanel) {
    broadcastPanel.hidden = !broadcastEnabled;
    broadcastPanel.classList.toggle("hidden", !broadcastEnabled);
  }

  if (testToInput) testToInput.disabled = broadcastEnabled;
  if (broadcastInput) broadcastInput.disabled = !broadcastEnabled;
  broadcastGeneralControls.forEach((controlId) => {
    const control = id(controlId);
    if (!control) return;
    control.disabled = !broadcastEnabled;
  });
  document
    .querySelectorAll("[data-broadcast-batch-size]")
    .forEach((button) => {
      button.disabled = !broadcastEnabled;
    });

  if (broadcastEnabled) {
    renderRecipientLibrary();
  } else {
    ["saved_broadcast_lists", "load_broadcast_list_btn", "append_broadcast_list_btn", "delete_broadcast_list_btn"].forEach(
      (controlId) => {
        const control = id(controlId);
        if (control) control.disabled = true;
      }
    );
  }

  sendUi?.setIdleLabel?.(sendLabel);
  refreshSendAvailability();
}

function setSendAvailabilityHint(message = "", tone = "") {
  const hint = id("send_availability_hint");
  if (!hint) return;
  hint.textContent = message;
  if (tone) {
    hint.dataset.tone = tone;
  } else {
    delete hint.dataset.tone;
  }
  scheduleSendActionOffsetSync();
}

function refreshSendAvailability() {
  const sendUi = getSendButtonUi();
  if (!sendUi) return;
  const label = getSendActionLabel();

  sendUi.setIdleLabel?.(label);

  if (state.appConfig.loading) {
    sendUi.lock(label);
    setSendAvailabilityHint("Revisando envío...", "");
    return;
  }

  if (state.appConfig.loadError) {
    sendUi.lock(label);
    setSendAvailabilityHint(state.appConfig.loadError, "error");
    return;
  }

  if (!state.appConfig.loaded) {
    sendUi.lock(label);
    setSendAvailabilityHint("Revisando envío...", "");
    return;
  }

  if (!state.appConfig.isConfigured) {
    sendUi.lock(label);
    setSendAvailabilityHint(
      state.appConfig.canPersist
        ? "Configura el envío para habilitar esta acción."
        : "El envío todavía no está disponible en esta sesión.",
      "warning"
    );
    return;
  }

  sendUi.unlock(label);
  setSendAvailabilityHint("");
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

function configValueOf(name, fallback = "") {
  const el = id(`config_${name}`);
  return el && typeof el.value !== "undefined" ? el.value : fallback;
}

function setConfigValue(name, value) {
  const el = id(`config_${name}`);
  if (!el || typeof el.value === "undefined") return;
  el.value = value ?? "";
}

function setButtonBusy(button, isBusy, label) {
  if (!button) return;
  if (!button.dataset.originalLabel) {
    button.dataset.originalLabel = button.textContent.trim();
  }

  if (isBusy) {
    button.disabled = true;
    if (label) button.textContent = label;
    return;
  }

  button.disabled = false;
  button.textContent = button.dataset.originalLabel || button.textContent;
}

function inferProviderKey(values = {}) {
  const host = String(values.smtpHost || "").trim().toLowerCase();
  if (!host) return "";
  if (host.includes("gmail")) return "gmail";
  if (host.includes("office365")) return "office365";
  return "custom";
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

function normalizeImageWidth(raw, maxWidth, minWidth) {
  if (
    raw === null ||
    typeof raw === "undefined" ||
    (typeof raw === "string" && !raw.trim())
  ) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  const next = Math.round(clamp(parsed, minWidth, maxWidth));
  return next >= maxWidth ? null : next;
}

function normalizeImageWidthArray(raw, size = 2) {
  if (!Array.isArray(raw)) {
    return Array.from({ length: size }, () => null);
  }

  return Array.from({ length: size }, (_, index) =>
    normalizeImageWidth(raw[index], GALLERY_IMAGE_MAX_WIDTH, GALLERY_IMAGE_MIN_WIDTH)
  );
}

function hasCustomImageWidth(values = []) {
  return values.some((value) => Number.isFinite(value));
}

function getCardImageMaxWidth(card, slot) {
  return slot === "image" ? STORY_IMAGE_MAX_WIDTH : GALLERY_IMAGE_MAX_WIDTH;
}

function getCardImageMinWidth(card, slot) {
  return slot === "image" ? STORY_IMAGE_MIN_WIDTH : GALLERY_IMAGE_MIN_WIDTH;
}

function getCardStoredImageWidth(card, slot) {
  if (slot === "image") return Number.isFinite(card.imageWidth) ? card.imageWidth : null;
  const index = Number(slot);
  return Number.isFinite(card.imageWidths?.[index]) ? card.imageWidths[index] : null;
}

function getCardImageEffectiveWidth(card, slot) {
  return getCardStoredImageWidth(card, slot) || getCardImageMaxWidth(card, slot);
}

function getCardImageSizeLabel(card, slot) {
  const maxWidth = getCardImageMaxWidth(card, slot);
  const width = getCardImageEffectiveWidth(card, slot);
  return width >= maxWidth ? `Auto (${maxWidth}px)` : `${width}px`;
}

function getCardImagePreviewMeta(card, slot) {
  const maxWidth = getCardImageMaxWidth(card, slot);
  const currentWidth = getCardImageEffectiveWidth(card, slot);
  return {
    currentWidth,
    maxWidth,
    widthPercent: (currentWidth / maxWidth) * 100,
    sizeLabel: getCardImageSizeLabel(card, slot),
  };
}

function normalizeSlotKey(slot) {
  return slot === "image" ? "image" : String(Number(slot));
}

function isImageSelected(cardId, slot) {
  return (
    state.selectedImage.cardId === cardId &&
    state.selectedImage.slot === normalizeSlotKey(slot)
  );
}

function syncImageSelectionUi(root = document) {
  root.querySelectorAll("[data-select-image]").forEach((node) => {
    const active = isImageSelected(node.dataset.cardId, node.dataset.slot);
    node.classList.toggle("is-selected", active);
    node.setAttribute("aria-pressed", active ? "true" : "false");
  });

  root.querySelectorAll("[data-image-hint]").forEach((node) => {
    const active = isImageSelected(node.dataset.cardId, node.dataset.slot);
    node.textContent = active
      ? "Arrastra una esquina o usa el botón de tamaño para abrir el editor grande sin modificar la imagen original."
      : "Haz click en la imagen para seleccionarla o usa el botón de tamaño para abrir el editor grande.";
  });
}

function setSelectedImage(cardId, slot) {
  state.selectedImage.cardId = cardId || null;
  state.selectedImage.slot = cardId ? normalizeSlotKey(slot) : null;
  syncImageSelectionUi();
}

function clearSelectedImage() {
  if (!state.selectedImage.cardId && !state.selectedImage.slot) return;
  state.selectedImage.cardId = null;
  state.selectedImage.slot = null;
  syncImageSelectionUi();
}

function setCardImageWidth(card, slot, width) {
  const maxWidth = getCardImageMaxWidth(card, slot);
  const minWidth = getCardImageMinWidth(card, slot);
  const normalized = normalizeImageWidth(width, maxWidth, minWidth);

  if (slot === "image") {
    card.imageWidth = normalized;
    return card;
  }

  const index = Number(slot);
  card.imageWidths = Array.isArray(card.imageWidths)
    ? [...card.imageWidths]
    : [null, null];
  card.imageWidths[index] = normalized;
  return card;
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
  const storyImageWidth = normalizeImageWidth(
    raw.imageWidth,
    STORY_IMAGE_MAX_WIDTH,
    STORY_IMAGE_MIN_WIDTH
  );
  const galleryImageWidths = normalizeImageWidthArray(raw.imageWidths);

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
    imageWidth: storyImageWidth,
    imageCaption: String(raw.imageCaption || ""),
    imageCaptionAlign: normalizeCaptionAlign(raw.imageCaptionAlign),
    images: galleryImages,
    imageWidths: galleryImageWidths,
    caption: String(raw.caption || ""),
    imageCaptions: galleryCaptions,
    imageCaptionAligns: galleryCaptionAligns,
  };

  if (type === "gallery") {
    card.image = "";
    card.imageWidth = null;
    card.imageCaption = "";
    card.imageCaptionAlign = "center";
  } else {
    card.images = ["", ""];
    card.imageWidths = [null, null];
    card.imageCaptions = ["", ""];
    card.imageCaptionAligns = ["center", "center"];
    card.caption = type === "note" ? "" : card.caption;
  }

  if (type === "note") {
    card.image = "";
    card.imageWidth = null;
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
    next.imageWidths = normalizeImageWidthArray(card.imageWidths);
    if (!next.imageWidths[0] && Number.isFinite(card.imageWidth)) {
      next.imageWidths[0] = normalizeImageWidth(
        card.imageWidth,
        GALLERY_IMAGE_MAX_WIDTH,
        GALLERY_IMAGE_MIN_WIDTH
      );
    }
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
    next.imageWidth = null;
    next.imageCaption = "";
    next.imageCaptionAlign = "center";
  } else if (nextType === "story") {
    next.image = card.image || card.images?.[0] || "";
    next.imageWidth = normalizeImageWidth(
      card.imageWidth ?? card.imageWidths?.[0],
      STORY_IMAGE_MAX_WIDTH,
      STORY_IMAGE_MIN_WIDTH
    );
    next.imageCaption = String(card.imageCaption || card.imageCaptions?.[0] || "");
    next.imageCaptionAlign = normalizeCaptionAlign(
      card.imageCaptionAlign || card.imageCaptionAligns?.[0] || "center"
    );
    next.images = ["", ""];
    next.imageWidths = [null, null];
    next.imageCaptions = ["", ""];
    next.imageCaptionAligns = ["center", "center"];
    next.caption = "";
  } else {
    next.image = "";
    next.imageWidth = null;
    next.imageCaption = "";
    next.imageCaptionAlign = "center";
    next.images = ["", ""];
    next.imageWidths = [null, null];
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
    if (hasCustomImageWidth(card.imageWidths)) out.imageWidths = [...card.imageWidths];
    if (hasText(card.imageCaptions)) out.imageCaptions = [...card.imageCaptions];
    if (hasText(card.imageCaptions) || hasNonDefaultAlign(card.imageCaptionAligns)) {
      out.imageCaptionAligns = [...card.imageCaptionAligns];
    }
    if (card.caption.trim()) out.caption = card.caption.trim();
  } else {
    if (card.image.trim()) out.image = card.image.trim();
    if (Number.isFinite(card.imageWidth)) out.imageWidth = card.imageWidth;
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
    if (hasCustomImageWidth(card.imageWidths)) out.imageWidths = [...card.imageWidths];
    if (hasText(card.imageCaptions)) out.imageCaptions = [...card.imageCaptions];
    if (hasText(card.imageCaptions) || hasNonDefaultAlign(card.imageCaptionAligns)) {
      out.imageCaptionAligns = [...card.imageCaptionAligns];
    }
    if (card.caption.trim()) out.caption = card.caption.trim();
  } else {
    if (card.image.trim()) out.image = card.image.trim();
    if (Number.isFinite(card.imageWidth)) out.imageWidth = card.imageWidth;
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
    delivery: exportDeliveryState(),
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

  applyDeliveryState(draft.delivery || {});

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

function setConfigFeedback(text = "", tone = "") {
  const node = id("config_feedback");
  if (!node) return;
  node.textContent = text;
  node.classList.remove("is-ok", "is-error");
  if (tone === "ok") node.classList.add("is-ok");
  if (tone === "error") node.classList.add("is-error");
}

function collectConfigForm() {
  const preset = PROVIDER_PRESETS[state.appConfig.providerKey] || {};
  const fromEmail = configValueOf("from_email").trim();
  const host = configValueOf("smtp_host").trim() || preset.host || "";
  const port = configValueOf("smtp_port").trim() || preset.port || "587";
  const smtpUser = configValueOf("smtp_user").trim() || fromEmail;

  return {
    smtpHost: host,
    smtpPort: port,
    smtpUser,
    smtpPass: configValueOf("smtp_pass"),
    fromEmail,
    fromName: configValueOf("from_name").trim(),
    testTo: configValueOf("test_to").trim(),
  };
}

function hasConfigPassword(formValues = collectConfigForm()) {
  return Boolean(
    String(formValues.smtpPass || "").trim() ||
      state.appConfig.values?.hasPassword
  );
}

function isConfigFormComplete(formValues = collectConfigForm()) {
  return Boolean(
    formValues.smtpHost &&
      formValues.smtpPort &&
      formValues.smtpUser &&
      formValues.fromEmail &&
      hasConfigPassword(formValues)
  );
}

function populateConfigForm(values = {}, options = {}) {
  const { preservePassword = false } = options;
  const providerKey = inferProviderKey(values) || state.appConfig.providerKey;
  const preset = PROVIDER_PRESETS[providerKey] || {};

  setConfigValue("smtp_host", values.smtpHost || preset.host || "");
  setConfigValue("smtp_port", values.smtpPort || preset.port || "587");
  setConfigValue("smtp_user", values.smtpUser || "");
  setConfigValue("from_email", values.fromEmail || "");
  setConfigValue("from_name", values.fromName || "FISUC Newsletter");
  setConfigValue("test_to", values.testTo || "");

  if (!preservePassword) {
    setConfigValue("smtp_pass", "");
  }
}

function renderProviderCards() {
  const container = id("config_provider_cards");
  if (!container) return;

  const activeKey = state.appConfig.providerKey;
  container.innerHTML = Object.values(PROVIDER_PRESETS)
    .map(
      (provider) => `
        <button
          type="button"
          class="btn provider-card provider-card--${provider.tone}${provider.key === activeKey ? " is-active" : ""}"
          data-config-provider="${provider.key}"
          data-provider-tone="${provider.tone}"
          aria-pressed="${provider.key === activeKey ? "true" : "false"}"
        >
          <div class="provider-card__logo provider-card__logo--${provider.tone}">
            <img src="${escapeHtml(provider.iconSrc)}" alt="" />
          </div>
          <div class="provider-card__title">
            <span>${escapeHtml(provider.label)}</span>
          </div>
          <p class="provider-card__desc">${escapeHtml(provider.description)}</p>
          <span class="provider-card__meta">${escapeHtml(provider.meta)}</span>
        </button>
      `
    )
    .join("");
}

function renderConfigSteps() {
  const container = id("config_setup_steps");
  if (!container) return;

  const preset = PROVIDER_PRESETS[state.appConfig.providerKey];
  if (!preset) {
    container.innerHTML = `
      <div class="setup-step">
        <span class="setup-step__index">A</span>
        <div>
          <h4>Elige una opción arriba</h4>
          <p>Al seleccionar Gmail, Microsoft 365 u otro SMTP, aquí verás los pasos exactos para conseguir las credenciales.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = preset.steps
    .map(
      (step, index) => `
        <div class="setup-step">
          <span class="setup-step__index">${String.fromCharCode(65 + index)}</span>
          <div>
            <h4>${escapeHtml(step.title)}</h4>
            <p>${escapeHtml(step.copy)}</p>
            ${
              Array.isArray(step.links) && step.links.length
                ? `
                  <div class="setup-step__links">
                    ${step.links
                      .map(
                        (link) => `
                          <a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer noopener">
                            ${escapeHtml(link.label)}
                            ${iconSvg("externalLink")}
                          </a>
                        `
                      )
                      .join("")}
                  </div>
                `
                : ""
            }
          </div>
        </div>
      `
    )
    .join("");
}

function renderConfigStepStatus() {
  const container = id("config_step_status");
  if (!container) return;

  const providerDone = Boolean(state.appConfig.providerKey);
  const formValues = collectConfigForm();
  const formDone = isConfigFormComplete(formValues);
  const readyDone = state.appConfig.isConfigured || state.appConfig.lastTestOk;

  const chips = [
    { label: "Cuenta elegida", done: providerDone },
    { label: "Datos listos", done: formDone },
    { label: "Conexión validada", done: readyDone },
  ];

  container.innerHTML = chips
    .map(
      (chip) => `
        <span class="config-status-chip${chip.done ? " is-done" : ""}">
          ${escapeHtml(chip.label)}
        </span>
      `
    )
    .join("");
}

function refreshPasswordNote() {
  const note = id("config_pass_note");
  if (!note) return;

  if (state.appConfig.values?.hasPassword && !configValueOf("smtp_pass").trim()) {
    note.textContent = "Ya hay una contraseña guardada. Escribe una nueva solo si quieres reemplazarla.";
    return;
  }

  const providerKey = state.appConfig.providerKey;
  if (providerKey === "gmail") {
    note.textContent = "En Gmail normalmente aquí va la clave de aplicación de 16 caracteres, no tu clave habitual.";
    return;
  }

  if (providerKey === "office365") {
    note.textContent = "Si es una cuenta de empresa o institución, confirma con el administrador qué credencial debes usar aquí.";
    return;
  }

  if (providerKey === "custom") {
    note.textContent = "Usa la clave exacta que te entregó tu proveedor o administrador del correo.";
    return;
  }

  note.textContent = "";
}

function refreshConfigWizard() {
  renderProviderCards();
  renderConfigSteps();
  renderConfigStepStatus();
  refreshPasswordNote();
  syncConfigAdvancedState();
}

function setConfigProvider(providerKey, options = {}) {
  const { autofill = true } = options;
  const preset = PROVIDER_PRESETS[providerKey];
  if (!preset) return;

  state.appConfig.providerKey = providerKey;
  state.appConfig.lastTestOk = false;

  if (autofill) {
    setConfigValue("smtp_host", preset.host || "");
    setConfigValue("smtp_port", preset.port || "587");
    if (providerKey !== "custom") {
      setConfigValue(
        "smtp_user",
        configValueOf("smtp_user").trim() || configValueOf("from_email").trim()
      );
    }
    if (!configValueOf("from_name").trim()) {
      setConfigValue("from_name", "FISUC Newsletter");
    }
  }

  setConfigFeedback("");
  refreshConfigWizard();
}

function syncConfigAdvancedState() {
  const advanced = id("config_advanced");
  if (!advanced) return;
  advanced.open = state.appConfig.providerKey === "custom";
}

function refreshConfigEntryPoint() {
  const button = id("open_config_btn");
  if (!button) return;

  if (state.appConfig.loaded && !state.appConfig.canPersist) {
    button.hidden = true;
    return;
  }

  button.hidden = false;

  const label = state.appConfig.isConfigured
    ? "Configuración de envío"
    : "Configurar envío";

  button.textContent = label;
  button.classList.toggle("danger", state.appConfig.loaded && !state.appConfig.isConfigured);
  button.classList.toggle("subtle", !state.appConfig.loaded || state.appConfig.isConfigured);
}

function refreshAppFooter() {
  const nameNode = id("app_footer_name");
  const versionNode = id("app_footer_version");
  if (nameNode) {
    nameNode.textContent = state.appMeta.name || "Newsletter";
  }
  if (versionNode) {
    versionNode.textContent = state.appMeta.version
      ? `v${state.appMeta.version}`
      : "";
  }
}

function applyLoadedConfig(data = {}) {
  state.appConfig = {
    ...state.appConfig,
    loaded: true,
    loading: false,
    loadError: "",
    canPersist: Boolean(data.canPersist),
    isConfigured: Boolean(data.isConfigured),
    source: data.source || "none",
    values: data.values || {},
    providerKey: inferProviderKey(data.values || {}),
    lastTestOk: Boolean(data.isConfigured),
  };

  state.appMeta = {
    name: String(data.app?.name || state.appMeta.name || "Newsletter"),
    version: String(data.app?.version || state.appMeta.version || ""),
  };

  populateConfigForm(state.appConfig.values);

  if (!valueOf("test_to").trim() && state.appConfig.values?.testTo) {
    setValue("test_to", state.appConfig.values.testTo);
  }

  refreshConfigEntryPoint();
  refreshAppFooter();
  refreshConfigWizard();
  refreshSendAvailability();
}

function openConfigModal(options = {}) {
  const { clearFeedback = false } = options;
  const modal = id("config-modal");
  if (!modal) return;
  if (clearFeedback) setConfigFeedback("");
  refreshConfigWizard();
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeConfigModal() {
  const modal = id("config-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

async function loadAppConfig() {
  if (state.appConfig.loading) return;
  state.appConfig.loading = true;
  state.appConfig.loadError = "";
  refreshSendAvailability();

  try {
    const response = await fetch("/api/app-config");
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "No se pudo leer la configuración");

    applyLoadedConfig(data);

    if (data.canPersist && !data.isConfigured) {
      openConfigModal({ clearFeedback: true });
      setConfigFeedback(
        "Completa estos datos una vez y quedarán guardados en este equipo.",
        ""
      );
    }
  } catch (error) {
    console.error(error);
    state.appConfig = {
      ...state.appConfig,
      loading: false,
      loadError: "No se pudo revisar el envío.",
    };
    refreshSendAvailability();
    setPreviewStatus(error.message || "No se pudo cargar la configuración", "error");
  }
}

async function saveAppConfig() {
  const saveButton = id("config_save");
  const payload = collectConfigForm();

  try {
    state.appConfig.saving = true;
    setButtonBusy(saveButton, true, "Guardando...");
    setConfigFeedback("Guardando configuración...", "");

    const response = await fetch("/api/app-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "No se pudo guardar la configuración");

    applyLoadedConfig({
      ...data,
      canPersist: true,
    });
    state.appConfig.lastTestOk = true;
    setConfigFeedback("Configuración guardada en este equipo.", "ok");
    closeConfigModal();
    setPreviewStatus("Configuración de envío lista", "ok");
    refreshSendAvailability();
  } catch (error) {
    console.error(error);
    setConfigFeedback(error.message || "No se pudo guardar la configuración.", "error");
  } finally {
    state.appConfig.saving = false;
    setButtonBusy(saveButton, false);
  }
}

async function testAppConfig() {
  const testButton = id("config_test");
  const payload = collectConfigForm();

  try {
    state.appConfig.testing = true;
    setButtonBusy(testButton, true, "Probando...");
    setConfigFeedback("Probando conexión SMTP...", "");

    const response = await fetch("/api/app-config/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "No se pudo validar la conexión");

    state.appConfig.lastTestOk = true;
    refreshConfigWizard();
    setConfigFeedback("Conexión SMTP válida.", "ok");
  } catch (error) {
    console.error(error);
    state.appConfig.lastTestOk = false;
    refreshConfigWizard();
    setConfigFeedback(error.message || "No se pudo validar la conexión.", "error");
  } finally {
    state.appConfig.testing = false;
    setButtonBusy(testButton, false);
  }
}

function ensureConfigBeforeSend() {
  if (state.appConfig.isConfigured) return true;

  if (state.appConfig.loading || !state.appConfig.loaded) {
    setPreviewStatus("Revisando configuración de envío...", "warn");
    refreshSendAvailability();
    return false;
  }

  if (!state.appConfig.canPersist) {
    setPreviewStatus("El envío todavía no está disponible en esta sesión.", "warn");
    refreshSendAvailability();
    return false;
  }

  openConfigModal({ clearFeedback: false });
  setConfigFeedback(
    `Completa y guarda la configuración antes de ${getSendActionLabel().toLowerCase()}.`,
    "error"
  );
  refreshSendAvailability();
  return false;
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

function imagePreview(url, label, previewMeta = {}, options = {}) {
  const { cardId = "", slot = "", selected = false } = options;
  if (url) {
    return `
      <div class="image-slot__canvas">
        <div
          class="image-slot__media${selected ? " is-selected" : ""}"
          data-resizable-media
          data-select-image
          data-card-id="${escapeHtml(cardId)}"
          data-slot="${escapeHtml(normalizeSlotKey(slot))}"
          role="button"
          tabindex="0"
          aria-pressed="${selected ? "true" : "false"}"
          style="width:${clamp(safeNumber(previewMeta.widthPercent, 100), 20, 100)}%;"
        >
          <img
            src="${escapeHtml(url)}"
            alt="${escapeHtml(label)}"
            draggable="false"
          />
          <span class="image-resize-handle image-resize-handle--nw" data-resize-handle="nw" aria-hidden="true"></span>
          <span class="image-resize-handle image-resize-handle--ne" data-resize-handle="ne" aria-hidden="true"></span>
          <span class="image-resize-handle image-resize-handle--sw" data-resize-handle="sw" aria-hidden="true"></span>
          <span class="image-resize-handle image-resize-handle--se" data-resize-handle="se" aria-hidden="true"></span>
        </div>
        <span class="image-slot__size-chip" data-size-label>
          ${escapeHtml(previewMeta.sizeLabel || "")}
        </span>
      </div>
    `;
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
    resetSize: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M5 10a5 5 0 1 0 1.3-3.35" />
        <path d="M5.2 4.9v2.9H8.1" />
      </svg>
    `,
    resize: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M7 3.5H3.5V7" />
        <path d="M13 3.5h3.5V7" />
        <path d="M7 16.5H3.5V13" />
        <path d="M13 16.5h3.5V13" />
        <path d="M3.5 3.5 8 8" />
        <path d="m16.5 3.5-4.5 4.5" />
        <path d="m3.5 16.5 4.5-4.5" />
        <path d="m16.5 16.5-4.5-4.5" />
      </svg>
    `,
    externalLink: `
      <svg viewBox="0 0 20 20" aria-hidden="true" class="icon-svg">
        <path d="M11 4h5v5" />
        <path d="M9 11 16 4" />
        <path d="M8 5H6.25A2.25 2.25 0 0 0 4 7.25v6.5A2.25 2.25 0 0 0 6.25 16h6.5A2.25 2.25 0 0 0 15 13.75V12" />
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

function renderImageSlot(card, slot, url, label, options = {}) {
  const {
    caption = "",
    captionAlign = "center",
    allowCaption = false,
    captionField = "imageCaption",
    captionAlignField = "imageCaptionAlign",
    captionLabel = "Pie",
    captionPlaceholder = "Pie de imagen",
  } = options;
  const previewMeta = getCardImagePreviewMeta(card, slot);
  const selected = isImageSelected(card.id, slot);
  return `
    <div class="image-slot" data-slot-wrap="${slot}">
      <div class="image-slot__preview" data-preview-slot="${slot}">
        ${imagePreview(url, label, previewMeta, {
          cardId: card.id,
          slot,
          selected,
        })}
      </div>
      ${
        url
          ? `<p class="image-slot__hint" data-image-hint data-card-id="${escapeHtml(card.id)}" data-slot="${escapeHtml(normalizeSlotKey(slot))}">${
              selected
                ? "Arrastra una esquina o usa el botón de tamaño para abrir el editor grande sin modificar la imagen original."
                : "Haz click en la imagen para seleccionarla o usa el botón de tamaño para abrir el editor grande."
            }</p>`
          : ""
      }
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
        ${renderImageActionButton("resize-image", slot, "resize", "Cambiar tamaño", "image-action-btn--resize", !url)}
        ${renderImageActionButton("edit-image", slot, "crop", "Recortar imagen", "image-action-btn--edit", !url)}
        ${renderImageActionButton("reset-image-size", slot, "resetSize", "Restablecer tamaño", "image-action-btn--reset", !url)}
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
            placeholder="Ej. Título de la noticia"
          />
        </div>

        <div class="field">
          <label>Fuente o etiqueta</label>
          <input
            type="text"
            data-field="source"
            value="${escapeHtml(card.source)}"
            placeholder="Ej. Fuente o categoría"
          />
        </div>
      </div>

      ${
        card.type === "story"
          ? `
            <div class="field">
              <label>Imagen destacada</label>
              ${renderImageSlot(card, "image", card.image, "Imagen destacada", {
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
                ${renderImageSlot(card, 0, card.images[0], "Imagen 1", {
                  allowCaption: true,
                  caption: card.imageCaptions[0],
                  captionAlign: card.imageCaptionAligns[0],
                  captionField: "imageCaptions.0",
                  captionAlignField: "imageCaptionAligns.0",
                })}
                ${renderImageSlot(card, 1, card.images[1], "Imagen 2", {
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
                placeholder="Pie general"
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
          placeholder="Escribe aquí el contenido del bloque."
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

function getImageSizeEditorHeight(width = state.imageSizeEditor.currentWidth) {
  const editor = state.imageSizeEditor;
  if (!editor.image || !width) return 0;

  const naturalWidth = editor.image.naturalWidth || editor.image.width || 1;
  const naturalHeight = editor.image.naturalHeight || editor.image.height || 1;
  return Math.round((width / naturalWidth) * naturalHeight);
}

function renderImageSizeEditor() {
  const editor = state.imageSizeEditor;
  const media = id("image_size_media");
  const preview = id("image_size_preview");
  if (!media || !preview || !editor.image) return;

  preview.src = editor.image.src;
  preview.alt = editor.imageName || "Vista previa";
  media.style.width = `${(editor.currentWidth / editor.maxWidth) * 100}%`;
}

function syncImageSizeEditorControls() {
  const editor = state.imageSizeEditor;
  const widthInput = id("image_size_width");
  const range = id("image_size_range");
  const rangeLabel = id("image_size_range_label");
  const source = id("image_size_source");
  const heightLabel = id("image_size_height_label");
  const original = id("image_size_original");
  const limit = id("image_size_limit");

  if (widthInput) {
    widthInput.min = String(editor.minWidth);
    widthInput.max = String(editor.maxWidth);
    widthInput.value = String(editor.currentWidth);
  }

  if (range) {
    range.min = String(editor.minWidth);
    range.max = String(editor.maxWidth);
    range.value = String(editor.currentWidth);
  }

  if (rangeLabel) {
    rangeLabel.textContent = `${Math.round((editor.currentWidth / editor.maxWidth) * 100)}% del máximo`;
  }

  if (source) {
    source.textContent = editor.imageName || editor.imageUrl || "Imagen seleccionada";
  }

  if (heightLabel) {
    heightLabel.textContent = `${getImageSizeEditorHeight()} px`;
  }

  if (original && editor.image) {
    const originalWidth = editor.image.naturalWidth || editor.image.width || 0;
    const originalHeight = editor.image.naturalHeight || editor.image.height || 0;
    original.textContent = `${originalWidth} x ${originalHeight} px`;
  }

  if (limit) {
    limit.textContent = `${editor.maxWidth} px`;
  }

  renderImageSizeEditor();
}

function closeImageSizeEditor() {
  const editor = state.imageSizeEditor;
  editor.open = false;
  editor.dragPointerId = null;
  id("image-size-modal")?.classList.add("hidden");
}

async function openImageSizeEditor(cardId, slot) {
  const card = state.cards.find((entry) => entry.id === cardId);
  if (!card) return;

  const normalizedSlot = slot === "image" ? "image" : Number(slot);
  const url =
    normalizedSlot === "image"
      ? card.image
      : card.images?.[Number(normalizedSlot)] || "";

  if (!url) {
    alert("Primero asigna una imagen para poder ajustar su tamaño.");
    return;
  }

  try {
    setPreviewStatus("Abriendo editor de tamaño...", "ok");
    const image = await createEditableImage(url);
    const editor = state.imageSizeEditor;
    editor.cardId = cardId;
    editor.slot = normalizedSlot;
    editor.imageUrl = url;
    editor.imageName = fileNameFromUrl(url) || "imagen";
    editor.image = image;
    editor.minWidth = getCardImageMinWidth(card, normalizedSlot);
    editor.maxWidth = getCardImageMaxWidth(card, normalizedSlot);
    editor.currentWidth = getCardImageEffectiveWidth(card, normalizedSlot);

    id("image-size-modal")?.classList.remove("hidden");
    editor.open = true;
    window.requestAnimationFrame(() => {
      syncImageSizeEditorControls();
    });
    setPreviewStatus("Editor de tamaño listo", "ok");
  } catch (error) {
    console.error(error);
    setPreviewStatus(error.message || "No se pudo abrir el editor", "error");
    alert(error.message || "No se pudo abrir el editor de tamaño");
  }
}

function resetImageSizeEditor() {
  const editor = state.imageSizeEditor;
  editor.currentWidth = editor.maxWidth;
  syncImageSizeEditorControls();
}

function applyImageSizeEditorWidth(rawWidth) {
  const editor = state.imageSizeEditor;
  editor.currentWidth = Math.round(
    clamp(safeNumber(rawWidth, editor.maxWidth), editor.minWidth, editor.maxWidth)
  );
  syncImageSizeEditorControls();
}

function applyImageSizeEditor() {
  const editor = state.imageSizeEditor;
  if (!editor.cardId) return;

  updateCard(editor.cardId, (card) =>
    setCardImageWidth(card, editor.slot, editor.currentWidth)
  );
  setSelectedImage(editor.cardId, editor.slot);
  renderBlocksList();
  commit({ scheduleOnly: true });
  closeImageSizeEditor();
  setPreviewStatus("Tamaño de imagen aplicado", "ok");
}

function startImageSizeEditorResize(event) {
  const handle = event.target.closest("[data-size-resize-handle]");
  const editor = state.imageSizeEditor;
  if (!handle || !editor.image) return;

  const media = id("image_size_media");
  const rect = media?.getBoundingClientRect();
  if (!rect) return;

  editor.dragPointerId = event.pointerId;
  editor.startWidth = editor.currentWidth;
  editor.centerX = rect.left + rect.width / 2;
  editor.centerY = rect.top + rect.height / 2;
  editor.startDistance = Math.max(
    Math.hypot(event.clientX - editor.centerX, event.clientY - editor.centerY),
    1
  );

  media?.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveImageSizeEditorResize(event) {
  const editor = state.imageSizeEditor;
  if (editor.dragPointerId !== event.pointerId) return;

  const distance = Math.max(
    Math.hypot(event.clientX - editor.centerX, event.clientY - editor.centerY),
    1
  );

  applyImageSizeEditorWidth(
    editor.startWidth * (distance / editor.startDistance)
  );
  event.preventDefault();
}

function stopImageSizeEditorResize(event) {
  const editor = state.imageSizeEditor;
  if (editor.dragPointerId !== event.pointerId) return;

  const media = id("image_size_media");
  if (media?.hasPointerCapture?.(event.pointerId)) {
    media.releasePointerCapture(event.pointerId);
  }

  editor.dragPointerId = null;
}

function renderBlocksList() {
  const container = id("blocks_list");
  const empty = id("blocks_empty");
  if (!container || !empty) return;

  empty.style.display = state.cards.length ? "none" : "block";
  container.innerHTML = state.cards.map((card, index) => renderBlock(card, index)).join("");
  autosizeTextareas(container);
  syncImageSelectionUi(container);
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
      dark: "#101826",
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
  const broadcastEnabled = isBroadcastEnabled();
  const recipients = getBroadcastRecipients();
  const batchSize = getBroadcastBatchSize();
  const batchCount = estimateBroadcastBatchCount(recipients.length);
  const singleRecipient = valueOf("test_to").trim();

  try {
    if (!ensureConfigBeforeSend()) {
      setPreviewStatus("Falta la configuración de envío", "warn");
      return;
    }

    const svgIssues = getSvgAssetIssues();
    if (svgIssues.length) {
      sendUi?.error("Revisa imágenes");
      setPreviewStatus("Corrige las imágenes SVG antes de enviar", "error");
      alert(
        `Antes de ${getSendActionLabel().toLowerCase()}, reemplaza estas imágenes SVG por una versión PNG/JPG o vuelve a elegirlas desde la biblioteca para convertirlas:\n\n- ${svgIssues.join("\n- ")}`
      );
      return;
    }

    if (broadcastEnabled && !recipients.length) {
      sendUi?.error("Falta lista");
      setPreviewStatus("Agrega destinatarios para la multidifusión", "warn");
      alert("Agrega al menos un correo a la lista de multidifusión.");
      id("broadcast_recipient_input")?.focus();
      return;
    }

    sendUi?.start("Enviando");
    setPreviewStatus(
      broadcastEnabled
        ? `Enviando multidifusión a ${recipients.length} destinatario(s) en ${batchCount} lote(s)...`
        : "Enviando prueba...",
      "ok"
    );

    const response = await fetch("/api/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...buildPayload(),
        delivery: broadcastEnabled
          ? {
              mode: "broadcast",
              recipients,
              batchSize,
            }
          : {
              mode: "test",
              to: singleRecipient,
            },
      }),
    });

    const out = await response.json();
    if (!out.ok) {
      const partialMessage =
        broadcastEnabled && out.sentRecipientCount
          ? ` Se alcanzaron a enviar ${out.sentRecipientCount} destinatario(s) en ${out.sentBatchCount || 0} lote(s) antes del fallo.`
          : "";
      throw new Error(
        (out.error ||
          (broadcastEnabled
            ? "No se pudo enviar la multidifusión"
            : "No se pudo enviar la prueba")) + partialMessage
      );
    }

    sendUi?.success("Enviado");
    if (broadcastEnabled) {
      const deliveredCount = out.recipientCount || recipients.length;
      const deliveredBatchCount = out.batchCount || batchCount;
      setPreviewStatus(
        `Multidifusión enviada a ${deliveredCount} destinatario(s) en ${deliveredBatchCount} lote(s)`,
        "ok"
      );
      alert(
        `Multidifusión enviada correctamente a ${
          deliveredCount
        } destinatario(s) en ${deliveredBatchCount} lote(s).\nMessage ID: ${out.messageId}`
      );
      return;
    }

    setPreviewStatus(`Prueba enviada (${out.messageId})`, "ok");
    alert(`Correo enviado correctamente.\nMessage ID: ${out.messageId}`);
  } catch (error) {
    console.error(error);
    sendUi?.error("Reintentar");
    setPreviewStatus(
      error.message ||
        (broadcastEnabled
          ? "Error al enviar la multidifusión"
          : "Error al enviar la prueba"),
      "error"
    );
    alert(
      error.message ||
        (broadcastEnabled
          ? "Error al enviar la multidifusión"
          : "Error al enviar la prueba")
    );
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

  setSelectedImage(cardId, slot);
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

  if (isImageSelected(cardId, slot)) {
    state.selectedImage.cardId = null;
    state.selectedImage.slot = null;
  }
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

function updateInlinePreview(slotWrap, url, label, card, slot) {
  const preview = slotWrap?.querySelector("[data-preview-slot]");
  if (!preview) return;
  const selected = isImageSelected(card.id, slot);
  preview.innerHTML = imagePreview(url, label, getCardImagePreviewMeta(card, slot), {
    cardId: card.id,
    slot,
    selected,
  });
  const hint = slotWrap?.querySelector(".image-slot__hint");
  if (hint) {
    hint.style.display = url ? "block" : "none";
    hint.textContent = selected
      ? "Arrastra una esquina o usa el botón de tamaño para abrir el editor grande sin modificar la imagen original."
      : "Haz click en la imagen para seleccionarla o usa el botón de tamaño para abrir el editor grande.";
  } else if (url) {
    const nextHint = document.createElement("p");
    nextHint.className = "image-slot__hint";
    nextHint.dataset.imageHint = "";
    nextHint.dataset.cardId = card.id;
    nextHint.dataset.slot = normalizeSlotKey(slot);
    nextHint.textContent = selected
      ? "Arrastra una esquina o usa el botón de tamaño para abrir el editor grande sin modificar la imagen original."
      : "Haz click en la imagen para seleccionarla o usa el botón de tamaño para abrir el editor grande.";
    preview.insertAdjacentElement("afterend", nextHint);
  }
}

function labelForSlot(slot) {
  return slot === "image"
    ? "Imagen destacada"
    : `Imagen ${Number(slot) + 1}`;
}

function applyImagePreviewWidth(slotWrap, width, maxWidth) {
  const media = slotWrap?.querySelector("[data-resizable-media]");
  const label = slotWrap?.querySelector("[data-size-label]");
  if (!media || !label) return;

  media.style.width = `${(width / maxWidth) * 100}%`;
  label.textContent = width >= maxWidth ? `Auto (${maxWidth}px)` : `${width}px`;
}

function stopImageResize() {
  const resize = state.imageResize;
  if (resize.slotWrap) {
    resize.slotWrap
      .querySelector("[data-resizable-media]")
      ?.classList.remove("is-resizing");
  }

  Object.assign(resize, {
    active: false,
    pointerId: null,
    cardId: null,
    slot: null,
    slotWrap: null,
    startWidth: 0,
    currentWidth: 0,
    minWidth: 0,
    maxWidth: 0,
    centerX: 0,
    centerY: 0,
    startDistance: 1,
  });
}

function commitImageResize() {
  const resize = state.imageResize;
  if (!resize.active || !resize.cardId) {
    stopImageResize();
    return;
  }

  updateCard(resize.cardId, (card) => setCardImageWidth(card, resize.slot, resize.currentWidth));
  commit({ scheduleOnly: true });
  stopImageResize();
}

function handleImageSelectionClick(event) {
  if (event.target.closest("[data-resize-handle]")) return;

  const media = event.target.closest("[data-select-image]");
  if (!media) return;

  setSelectedImage(media.dataset.cardId, media.dataset.slot);
}

function handleImageResizeStart(event) {
  const handle = event.target.closest("[data-resize-handle]");
  if (!handle) return false;

  const slotWrap = handle.closest("[data-slot-wrap]");
  const cardElement = handle.closest("[data-card-id]");
  const cardId = cardElement?.dataset.cardId;
  if (!slotWrap || !cardId) return false;

  const slotValue = slotWrap.dataset.slotWrap;
  const slot = slotValue === "image" ? "image" : Number(slotValue);
  if (!isImageSelected(cardId, slot)) return false;
  const card = state.cards.find((entry) => entry.id === cardId);
  if (!card) return false;

  const maxWidth = getCardImageMaxWidth(card, slot);
  const minWidth = getCardImageMinWidth(card, slot);
  const currentWidth = getCardImageEffectiveWidth(card, slot);
  const media = slotWrap.querySelector("[data-resizable-media]");
  const rect = media?.getBoundingClientRect();
  if (!rect) return false;

  Object.assign(state.imageResize, {
    active: true,
    pointerId: event.pointerId,
    cardId,
    slot,
    slotWrap,
    startWidth: currentWidth,
    currentWidth,
    minWidth,
    maxWidth,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
    startDistance: Math.max(
      Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2)),
      1
    ),
  });

  media.classList.add("is-resizing");
  event.preventDefault();
  return true;
}

function handleImageResizeMove(event) {
  const resize = state.imageResize;
  if (!resize.active || resize.pointerId !== event.pointerId) return;

  const distance = Math.max(
    Math.hypot(event.clientX - resize.centerX, event.clientY - resize.centerY),
    1
  );
  const nextWidth = Math.round(
    clamp(
      resize.startWidth * (distance / resize.startDistance),
      resize.minWidth,
      resize.maxWidth
    )
  );

  resize.currentWidth = nextWidth;
  applyImagePreviewWidth(resize.slotWrap, nextWidth, resize.maxWidth);
  event.preventDefault();
}

function handleImageResizeEnd(event) {
  const resize = state.imageResize;
  if (!resize.active || resize.pointerId !== event.pointerId) return;
  commitImageResize();
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
    const currentCard = state.cards.find((card) => card.id === cardId);
    if (!value.trim() && isImageSelected(cardId, slot)) {
      state.selectedImage.cardId = null;
      state.selectedImage.slot = null;
    }
    updateInlinePreview(slotWrap, value.trim(), labelForSlot(slot), currentCard, slot);
    const resetButton = slotWrap?.querySelector('[data-action="reset-image-size"]');
    if (resetButton) resetButton.disabled = !value.trim();
    const resizeButton = slotWrap?.querySelector('[data-action="resize-image"]');
    if (resizeButton) resizeButton.disabled = !value.trim();
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

  if (action === "resize-image") {
    openImageSizeEditor(cardId, actionButton.dataset.slot);
    return;
  }

  if (action === "edit-image") {
    openImageEditor(cardId, actionButton.dataset.slot);
    return;
  }

  if (action === "reset-image-size") {
    const slot = actionButton.dataset.slot;
    updateCard(cardId, (card) => setCardImageWidth(card, slot === "image" ? "image" : Number(slot), null));
    renderBlocksList();
    commit({ scheduleOnly: true });
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

function bindImageSizeEditorControls() {
  const editor = state.imageSizeEditor;
  const width = id("image_size_width");
  const range = id("image_size_range");
  const media = id("image_size_media");

  id("image_size_close")?.addEventListener("click", closeImageSizeEditor);
  document
    .querySelector("#image-size-modal .media-backdrop")
    ?.addEventListener("click", closeImageSizeEditor);
  id("image_size_reset")?.addEventListener("click", resetImageSizeEditor);
  id("image_size_apply")?.addEventListener("click", applyImageSizeEditor);

  width?.addEventListener("input", () => applyImageSizeEditorWidth(width.value));
  width?.addEventListener("change", () => applyImageSizeEditorWidth(width.value));
  range?.addEventListener("input", () => applyImageSizeEditorWidth(range.value));

  media?.addEventListener("pointerdown", startImageSizeEditorResize);
  media?.addEventListener("pointermove", moveImageSizeEditorResize);
  media?.addEventListener("pointerup", stopImageSizeEditorResize);
  media?.addEventListener("pointercancel", stopImageSizeEditorResize);

  window.addEventListener("resize", () => {
    if (editor.open) renderImageSizeEditor();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const modal = id("image-size-modal");
    if (modal && !modal.classList.contains("hidden")) {
      closeImageSizeEditor();
    }
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

function bindDeliveryControls() {
  const checkbox = id("broadcast_enabled");
  const input = id("broadcast_recipient_input");
  const list = id("broadcast_recipient_list");
  const box = id("broadcast_recipient_box");
  const batchSelect = id("broadcast_batch_size");
  const batchScale = id("broadcast_batch_scale");
  const toggleImportButton = id("toggle_broadcast_import_btn");
  const importReplaceButton = id("broadcast_import_replace_btn");
  const importAppendButton = id("broadcast_import_append_btn");
  const saveListButton = id("save_broadcast_list_btn");
  const savedListsSelect = id("saved_broadcast_lists");
  const loadListButton = id("load_broadcast_list_btn");
  const appendListButton = id("append_broadcast_list_btn");
  const deleteListButton = id("delete_broadcast_list_btn");
  const clearRecipientsButton = id("clear_broadcast_btn");

  checkbox?.addEventListener("change", () => {
    refreshDeliveryModeUi();
    commit({ scheduleOnly: true });

    if (checkbox.checked) {
      window.requestAnimationFrame(() => input?.focus());
    }
  });

  box?.addEventListener("click", () => {
    if (!isBroadcastEnabled()) return;
    input?.focus();
  });

  input?.addEventListener("keydown", (event) => {
    if (["Enter", "Tab", ",", ";"].includes(event.key)) {
      const currentValue = input.value.trim();
      if (currentValue) {
        event.preventDefault();
        commitBroadcastInput();
        commit({ scheduleOnly: true });
      }
      return;
    }

    if (event.key === "Backspace" && !input.value.trim()) {
      const lastRecipient = state.delivery.recipients.at(-1);
      if (!lastRecipient) return;
      event.preventDefault();
      removeBroadcastRecipient(lastRecipient);
      commit({ scheduleOnly: true });
    }
  });

  input?.addEventListener("input", () => {
    if (/[,\n;]/.test(input.value)) {
      commitBroadcastInput();
      commit({ scheduleOnly: true });
    }
  });

  input?.addEventListener("paste", (event) => {
    const pasted = event.clipboardData?.getData("text") || "";
    const extracted = extractRecipientEmails(pasted);
    if (extracted.length <= 1 && !/[,;\n]/.test(pasted)) return;

    event.preventDefault();
    addBroadcastRecipients(extracted);
    commit({ scheduleOnly: true });
  });

  input?.addEventListener("blur", () => {
    if (!input.value.trim()) return;
    commitBroadcastInput();
    commit({ scheduleOnly: true });
  });

  list?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-recipient]");
    if (!button) return;
    removeBroadcastRecipient(button.dataset.removeRecipient);
    commit({ scheduleOnly: true });
    input?.focus();
  });

  batchSelect?.addEventListener("input", () => {
    setBroadcastBatchSize(scaleIndexToBatchSize(batchSelect.value));
  });

  batchSelect?.addEventListener("change", () => {
    setBroadcastBatchSize(scaleIndexToBatchSize(batchSelect.value));
    commit({ scheduleOnly: true });
  });

  batchScale?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-broadcast-batch-size]");
    if (!button) return;
    setBroadcastBatchSize(button.dataset.broadcastBatchSize);
    commit({ scheduleOnly: true });
  });

  toggleImportButton?.addEventListener("click", () => {
    toggleBroadcastImportPanel();
  });

  importReplaceButton?.addEventListener("click", () => {
    importBroadcastRecipients("replace");
  });

  importAppendButton?.addEventListener("click", () => {
    importBroadcastRecipients("append");
  });

  saveListButton?.addEventListener("click", () => {
    saveCurrentBroadcastList();
  });

  savedListsSelect?.addEventListener("change", () => {
    selectRecipientLibraryItem(savedListsSelect.value);
  });

  loadListButton?.addEventListener("click", () => {
    applySelectedRecipientList("replace");
  });

  appendListButton?.addEventListener("click", () => {
    applySelectedRecipientList("append");
  });

  deleteListButton?.addEventListener("click", () => {
    deleteSelectedRecipientList();
  });

  clearRecipientsButton?.addEventListener("click", async () => {
    if (!state.delivery.recipients.length) {
      setPreviewStatus("La lista de multidifusión ya está vacía.", "warn");
      return;
    }

    const accepted = await openConfirmModal({
      title: "Vaciar lista actual",
      description:
        "Se quitarán los destinatarios cargados en esta multidifusión, pero las listas guardadas seguirán intactas.",
      items: [`${state.delivery.recipients.length} destinatario(s) en la lista actual`],
      confirmLabel: "Vaciar lista",
    });

    if (!accepted) return;

    setBroadcastRecipients([]);
    commit({ scheduleOnly: true });
    setPreviewStatus("Se vació la lista actual de destinatarios.", "ok");
  });
}

function bindPreviewControls() {
  getSendButtonUi();
  scheduleSendActionOffsetSync();
  id("btnPreview")?.addEventListener("click", preview);
  id("btnDownload")?.addEventListener("click", downloadHtml);
  id("btnSend")?.addEventListener("click", sendTest);
  window.addEventListener("resize", scheduleSendActionOffsetSync);

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
  blocks?.addEventListener("click", handleImageSelectionClick);
  blocks?.addEventListener("pointerdown", (event) => {
    handleImageResizeStart(event);
  });

  window.addEventListener("pointermove", handleImageResizeMove);
  window.addEventListener("pointerup", handleImageResizeEnd);
  window.addEventListener("pointercancel", () => stopImageResize());
  document.addEventListener("pointerdown", (event) => {
    if (state.imageResize.active) return;
    if (
      event.target.closest("[data-select-image]") ||
      event.target.closest("[data-resize-handle]")
    ) {
      return;
    }
    clearSelectedImage();
  });
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

function bindConfigControls() {
  id("open_config_btn")?.addEventListener("click", () => {
    populateConfigForm(state.appConfig.values, { preservePassword: false });
    setConfigFeedback(
      state.appConfig.isConfigured
        ? "Puedes actualizar los datos y guardar de nuevo."
        : "Completa los datos para dejar el envío listo en este equipo.",
      ""
    );
    openConfigModal();
  });

  id("config_provider_cards")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-config-provider]");
    if (!button) return;
    setConfigProvider(button.dataset.configProvider, { autofill: true });
  });

  CONFIG_FIELD_IDS.forEach((fieldId) => {
    const field = id(fieldId);
    if (!field) return;
    field.addEventListener("input", () => {
      state.appConfig.lastTestOk = false;
      if (fieldId === "config_smtp_host") {
        const inferred = inferProviderKey({ smtpHost: field.value });
        if (inferred && state.appConfig.providerKey !== inferred) {
          state.appConfig.providerKey = inferred;
        }
      }
      refreshConfigWizard();
    });
  });

  id("config_close")?.addEventListener("click", closeConfigModal);
  id("config_cancel")?.addEventListener("click", closeConfigModal);
  id("config_test")?.addEventListener("click", testAppConfig);
  id("config_save")?.addEventListener("click", saveAppConfig);
  document
    .querySelector("#config-modal .media-backdrop")
    ?.addEventListener("click", closeConfigModal);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const modal = id("config-modal");
    if (modal && !modal.classList.contains("hidden")) {
      closeConfigModal();
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

async function init() {
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
  bindDeliveryControls();
  bindPreviewControls();
  bindBlockControls();
  bindAssetControls();
  bindConfirmModal();
  bindConfigControls();
  bindImageEditorControls();
  bindImageSizeEditorControls();
  bindAdvancedControls();
  bindAccordionBehavior();
  loadRecipientLibrary();
  toggleBroadcastImportPanel(false);

  syncColorInputs();
  refreshAppFooter();

  const dateField = id("date");
  if (dateField && !dateField.value) {
    dateField.value = getTodayIsoDate();
  }

  const defaultFields = getFieldState();
  const defaultCards = normalizeCards(readInitialCards());
  state.defaultDraft = {
    fields: defaultFields,
    delivery: exportDeliveryState(),
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
  refreshConfigEntryPoint();
  refreshSendAvailability();
  await loadAppConfig();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
