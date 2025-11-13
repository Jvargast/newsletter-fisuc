window.addEventListener("error", (e) =>
  alert("JS Error: " + (e.message || ""))
);
window.addEventListener("unhandledrejection", (e) =>
  alert("Promise Error: " + (e.reason?.message || e.reason || ""))
);

function v(id, def = "") {
  const el = document.getElementById(id);
  return el && typeof el.value !== "undefined" ? el.value : def;
}

function normalizeHex(val, fallback) {
  if (!val) return fallback;
  let v = val.trim();
  if (v[0] !== "#") v = "#" + v;
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) return fallback;
  if (v.length === 4) v = "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  return v.toUpperCase();
}

function bindColorPair(pickerId, inputId, onChange) {
  const picker = document.getElementById(pickerId);
  const input = document.getElementById(inputId);
  if (!picker || !input) return;
  picker.addEventListener("input", () => {
    input.value = normalizeHex(picker.value, input.value);
    onChange?.();
  });
  input.addEventListener("change", () => {
    const norm = normalizeHex(input.value, picker.value);
    input.value = norm;
    picker.value = norm;
    onChange?.();
  });
}

async function buildPayload() {
  let cards = [];
  try {
    cards = JSON.parse(v("cards", "[]"));
  } catch {
    alert("JSON inválido en Cards");
  }

  const ctaLabel = v("cta_label", "").trim();
  const ctaUrl = v("cta_url", "").trim();
  const cta = ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : null;

  return {
    meta: {
      issue: v("issue"),
      date: v("date"),
    },
    brand: {
      name: v("brand_name"),
      logo: v("brand_logo"),
      primary: v("brand_primary"),
      bg: v("brand_bg"),
      text: v("brand_text"),
      gray: v("brand_gray"),
      dark: "#111827",
    },
    unsubscribe: v("unsubscribe"),
    edition: {
      preview: v("preview"),
      heading: v("heading"),
      subheading: v("subheading"),
      cta,
      heroImage: document.getElementById("hero_image_hidden")?.value || null,
      cards,
    },
    legal: { copyright: "© 2025 FISUC - Todos los derechos reservados." },
  };
}

async function preview() {
  const res = await fetch("/api/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await buildPayload()),
  });
  const { ok, html, error } = await res.json();
  if (!ok) return alert(error || "Error al compilar");
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  document.getElementById("frame").src = url;
}

async function downloadHtml() {
  const res = await fetch("/api/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await buildPayload()),
  });
  const { ok, html, error } = await res.json();
  if (!ok) return alert(error || "Error al compilar");
  const a = document.createElement("a");
  a.href = "data:text/html;charset=utf-8," + encodeURIComponent(html);
  a.download = "newsletter.html";
  a.click();
}

async function sendTest() {
  const res = await fetch("/api/send-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await buildPayload()),
  });
  const out = await res.json();
  console.log(out);
  if (out.ok) {
    alert("Enviado: " + out.messageId);
  } else {
    alert("Error: " + out.error);
  }
}

async function uploadImage(file) {
  if (!file) throw new Error("No se seleccionó archivo");
  const fd = new FormData();
  fd.append("image", file);

  let r;
  try {
    r = await fetch("/api/upload", { method: "POST", body: fd });
  } catch (e) {
    throw new Error("No se pudo conectar con /api/upload");
  }

  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await r.text();
    throw new Error("Respuesta no válida del servidor al subir la imagen");
  }

  const out = await r.json();
  if (!out.ok || !out.url) {
    throw new Error(out.error || "Error al subir la imagen");
  }
  return out.url;
}

async function onUploadLogo() {
  const f = document.getElementById("logo_file").files[0];
  if (!f) return alert("Elige un archivo de logo");

  const url = await uploadImage(f);

  const logoInput = document.getElementById("brand_logo");
  if (!logoInput) {
    alert(
      "No existe el input #brand_logo. Agrega <input id='brand_logo'> en el HTML."
    );
    return;
  }
  logoInput.value = url;

  const img = document.getElementById("logo_preview");
  if (img) {
    img.src = url;
    img.style.display = "block";
  }

  preview();
  alert("Logo subido ✔");
}

async function onUploadHero() {
  const f = document.getElementById("hero_file").files[0];
  if (!f) return alert("Elige un archivo");
  const url = await uploadImage(f);
  const el = document.getElementById("hero_image_hidden");
  if (el) el.value = url;
  else {
    const i = document.createElement("input");
    i.type = "hidden";
    i.id = "hero_image_hidden";
    i.value = url;
    document.body.appendChild(i);
  }
  alert("Hero subido ✔\nURL asignada a edition.heroImage");
}

async function onUploadCard() {
  const idx = Number(document.getElementById("card_index").value || 0);
  const f = document.getElementById("card_file").files[0];
  if (!f) return alert("Elige un archivo");

  const url = await uploadImage(f);

  let cards = [];
  try {
    cards = JSON.parse(document.getElementById("cards").value || "[]");
  } catch (e) {}

  if (!cards[idx]) return alert("No existe la card " + idx);
  const card = cards[idx];

  if (Array.isArray(card.images)) {
    let pos = card.images.findIndex((x) => !x);

    if (pos === -1) {
      pos = card.images.length - 1;
    }

    card.images[pos] = url;
    alert(`Imagen asignada a Card #${idx} (images[${pos}])`);
  } else {
    card.image = url;
    alert("Imagen asignada a Card #" + idx);
  }

  document.getElementById("cards").value = JSON.stringify(cards, null, 2);
}

function init() {
  bindColorPair("brand_primary_picker", "brand_primary");
  bindColorPair("brand_bg_picker", "brand_bg");
  bindColorPair("brand_text_picker", "brand_text");
  bindColorPair("brand_gray_picker", "brand_gray");

  const rePreview = () => {};
  bindColorPair("brand_primary_picker", "brand_primary", rePreview);
  bindColorPair("brand_bg_picker", "brand_bg", rePreview);
  bindColorPair("brand_text_picker", "brand_text", rePreview);
  bindColorPair("brand_gray_picker", "brand_gray", rePreview);
  const btnPrev = document.getElementById("btnPreview");
  const btnDown = document.getElementById("btnDownload");
  const btnSend = document.getElementById("btnSend");
  if (btnPrev) btnPrev.onclick = preview;
  if (btnDown) btnDown.onclick = downloadHtml;
  if (btnSend) btnSend.onclick = sendTest;

  const ul = document.getElementById("upload_logo_btn");
  const uh = document.getElementById("upload_hero_btn");
  const uc = document.getElementById("upload_card_btn");
  if (ul) ul.onclick = onUploadLogo;
  if (uh) uh.onclick = onUploadHero;
  if (uc) uc.onclick = onUploadCard;

  const issueInput = document.getElementById("issue");
  const issueHint = document.getElementById("issue_hint");

  function syncIssueHint() {
    const n = (issueInput.value || "").replace(/\D/g, "");
    issueInput.value = n;
    issueHint.textContent = `Se mostrará como “NEWSLETTER #${n || "X"}”.`;
  }

  if (issueInput && issueHint) {
    issueInput.addEventListener("input", syncIssueHint);
    syncIssueHint();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

document.querySelectorAll("details.panel").forEach((d) => {
  d.addEventListener("toggle", () => {
    if (!d.open) return;
    document.querySelectorAll("details.panel").forEach((o) => {
      if (o !== d) o.removeAttribute("open");
    });
  });
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".file-btn[data-for]");
  if (!btn) return;
  e.preventDefault();
  const forId = btn.getAttribute("data-for");
  const input = document.getElementById(forId);
  if (input && input.type === "file") input.click();
});

[
  ["logo_file", "logo_file_name"],
  ["hero_file", "hero_file_name"],
  ["card_file", "card_file_name"],
].forEach(([fileId, nameId]) => {
  const input = document.getElementById(fileId);
  const span = document.getElementById(nameId);
  if (!input || !span) return;
  input.addEventListener("change", () => {
    span.textContent = input.files?.[0]?.name || "Ningún archivo seleccionado";
  });
});
