/******************************************************************************
 * VetPara Atlas
 * Galéria – stránka pre prehliadanie fotografií
 *
 * Samostatná stránka, ktorá filtruje fotografie podľa objectId (diagnostický
 * objekt) a voliteľne podľa host (hostiteľ).
 *
 * Vizuálny jazyk nadväzuje na atlas.css, ale používa vlastné CSS triedy
 * (gallery-*) aby nedošlo ku konfliktom.
 ******************************************************************************/

import DatabaseService from "../services/DatabaseService.js";
import Repository from "../services/Repository.js";

const IMAGES_FILE = "images.json";

const GalleryPage = {
  state: {
    images: [],
    records: [],
    filterObjectId: "",
    filterHost: "",
    selectedImage: null,
  },

  render() {
    return `
      <div id="gallery-view" class="view-page active-view">
        <div class="gallery-layout">
          <aside class="gallery-sidebar card">
            <div class="gallery-header">
              <h1>Galéria</h1>
              <p>Fotografie parazitov</p>
            </div>

            <div class="gallery-filters">
              <div class="filter-section">
                <label for="gallery-filter-object" class="filter-title">
                  Diagnostický objekt
                </label>
                <input
                  id="gallery-filter-object"
                  type="text"
                  list="gallery-object-list"
                  placeholder="Vyhľadať podľa latinského názvu..."
                  autocomplete="off"
                >
                <datalist id="gallery-object-list"></datalist>
              </div>

              <div class="filter-section">
                <label for="gallery-filter-host" class="filter-title">
                  Hostiteľ
                </label>
                <input
                  id="gallery-filter-host"
                  type="text"
                  list="gallery-host-list"
                  placeholder="Vyhľadať hostiteľa..."
                  autocomplete="off"
                >
                <datalist id="gallery-host-list"></datalist>
              </div>

              <button
                type="button"
                id="gallery-clear-filters"
                class="gallery-clear-filters"
              >
                Zrušiť filtre
              </button>
            </div>

            <div id="gallery-stats" class="gallery-stats" aria-live="polite">
              Načítavanie...
            </div>
          </aside>

          <main>
            <div id="gallery-grid" class="gallery-grid">
              <div class="gallery-loading">Načítavanie fotografií...</div>
            </div>
          </main>
        </div>

        <!-- Lightbox pre detail fotografie -->
        <div id="gallery-lightbox" class="gallery-lightbox" style="display: none;">
          <div class="gallery-lightbox-content card">
            <button
              type="button"
              id="gallery-lightbox-close"
              class="gallery-lightbox-close"
              aria-label="Zavrieť detail fotografie"
            >×</button>
            <div id="gallery-lightbox-body"></div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadData();
    this.bindEvents();
    this.renderGrid();

    // Po načítaní host_hierarchy aktualizovať zoznam hostiteľov
    await Repository.loadHostHierarchy();
    this.populateHostDatalist();
    this.populateObjectDatalist();
  },

  async loadData() {
    try {
      this.state.images = await DatabaseService.load(IMAGES_FILE);
      this.state.records = Repository.getAll();
    } catch (error) {
      console.warn("Galéria: nepodarilo sa načítať fotografie", error);
      this.state.images = [];
    }
  },

  bindEvents() {
    const objectInput = document.getElementById("gallery-filter-object");
    const hostInput = document.getElementById("gallery-filter-host");
    const clearButton = document.getElementById("gallery-clear-filters");
    const lightbox = document.getElementById("gallery-lightbox");
    const closeButton = document.getElementById("gallery-lightbox-close");

    if (objectInput) {
      objectInput.addEventListener("input", () => {
        this.state.filterObjectId = objectInput.value.trim();
        this.renderGrid();
      });
      // Po výbere z datalistu
      objectInput.addEventListener("change", () => {
        this.state.filterObjectId = objectInput.value.trim();
        this.renderGrid();
      });
    }

    if (hostInput) {
      hostInput.addEventListener("input", () => {
        this.state.filterHost = hostInput.value.trim();
        this.renderGrid();
      });
      hostInput.addEventListener("change", () => {
        this.state.filterHost = hostInput.value.trim();
        this.renderGrid();
      });
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        if (objectInput) objectInput.value = "";
        if (hostInput) hostInput.value = "";
        this.state.filterObjectId = "";
        this.state.filterHost = "";
        this.renderGrid();
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", () => {
        lightbox.style.display = "none";
        this.state.selectedImage = null;
      });
    }

    // Zatvorenie lightboxu kliknutím mimo obsah
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.style.display = "none";
        this.state.selectedImage = null;
      }
    });

    // Esc pre zatvorenie lightboxu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.style.display !== "none") {
        lightbox.style.display = "none";
        this.state.selectedImage = null;
      }
    });
  },

  getFilteredImages() {
    const { images, records, filterObjectId, filterHost } = this.state;

    if (!images || images.length === 0) return [];

    // Získať všetky objectId, ktoré matchujú filterObjectId (podľa latinského názvu)
    let matchingObjectIds = null;
    if (filterObjectId) {
      const search = filterObjectId.toLowerCase();
      matchingObjectIds = records
        .filter((r) =>
          (r.latinName || "").toLowerCase().includes(search) ||
          (r.slovakName || "").toLowerCase().includes(search) ||
          r.id.toLowerCase().includes(search)
        )
        .map((r) => r.id);
    }

    // Získať všetky hostiteľov, ktorí matchujú filterHost
    let matchingHosts = null;
    if (filterHost) {
      const search = filterHost.toLowerCase();
      matchingHosts = records
        .flatMap((r) => Repository.resolveHosts(r))
        .filter((h) => h && h.toLowerCase().includes(search));
      matchingHosts = [...new Set(matchingHosts)];
    }

    return images.filter((img) => {
      // Filter podľa objectId
      if (matchingObjectIds && !matchingObjectIds.includes(img.objectId)) {
        return false;
      }

      // Filter podľa hostiteľa
      if (matchingHosts && matchingHosts.length > 0) {
        if (!img.host) return false;
        if (!matchingHosts.some((h) => img.host.includes(h))) return false;
      }

      return true;
    });
  },

  getRecordForImage(image) {
    return this.state.records.find((r) => r.id === image.objectId) || null;
  },

  renderGrid() {
    const container = document.getElementById("gallery-grid");
    const stats = document.getElementById("gallery-stats");

    if (!container) return;

    const filtered = this.getFilteredImages();
    const total = this.state.images?.length || 0;

    if (stats) {
      stats.textContent =
        total === 0
          ? "Žiadne fotografie"
          : `Zobrazené: ${filtered.length} / ${total}`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="gallery-empty">
          ${total === 0
            ? "V databáze zatiaľ nie sú žiadne fotografie."
            : "Žiadna fotografia nevyhovuje zadaným kritériám."}
        </div>
      `;
      return;
    }

    container.innerHTML = filtered
      .sort((a, b) => {
        // Primárne fotografie najskôr, potom podľa sortOrder
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      })
      .map((img) => {
        const record = this.getRecordForImage(img);
        const latinName = record?.latinName || img.objectId || "Neznámy objekt";

        return `
          <div class="gallery-item card" data-image-id="${this.escapeHtml(img.id)}">
            <div class="gallery-item-thumb">
              <div class="gallery-thumb-placeholder">
                <span class="gallery-thumb-icon">🔬</span>
                <span class="gallery-thumb-label">Fotka</span>
              </div>
              ${img.isPrimary ? `<span class="gallery-badge-primary">Hlavná</span>` : ""}
            </div>
            <div class="gallery-item-info">
              <div class="gallery-item-title">${this.escapeHtml(latinName)}</div>
              <div class="gallery-item-meta">
                ${img.host ? `<span>${this.escapeHtml(img.host)}</span>` : ""}
                ${img.author ? `<span>© ${this.escapeHtml(img.author)}</span>` : ""}
                ${img.year ? `<span>${this.escapeHtml(img.year)}</span>` : ""}
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // Bind klik na položky – otvorenie lightboxu
    container.querySelectorAll(".gallery-item").forEach((el) => {
      const imageId = el.dataset.imageId;
      const image = this.state.images.find((img) => img.id === imageId);
      if (image) {
        el.addEventListener("click", () => {
          this.openLightbox(image);
        });
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.openLightbox(image);
          }
        });
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
      }
    });
  },

  openLightbox(image) {
    const lightbox = document.getElementById("gallery-lightbox");
    const body = document.getElementById("gallery-lightbox-body");

    if (!lightbox || !body) return;

    const record = this.getRecordForImage(image);

    body.innerHTML = `
      <div class="gallery-lightbox-image">
        <div class="gallery-lightbox-placeholder">
          <span class="gallery-lightbox-icon">🔬</span>
          <span>Fotografia: ${this.escapeHtml(image.filename || "bez názvu")}</span>
        </div>
      </div>
      <div class="gallery-lightbox-info">
        <h3>${this.escapeHtml(record?.latinName || image.objectId || "Neznámy objekt")}</h3>
        ${record?.slovakName ? `<p><strong>Slovenský názov:</strong> ${this.escapeHtml(record.slovakName)}</p>` : ""}
        <div class="gallery-lightbox-details">
          ${image.host ? `<div class="gallery-lightbox-detail"><strong>Hostiteľ:</strong> ${this.escapeHtml(image.host)}</div>` : ""}
          ${image.sample ? `<div class="gallery-lightbox-detail"><strong>Vzorka:</strong> ${this.escapeHtml(image.sample)}</div>` : ""}
          ${image.stage ? `<div class="gallery-lightbox-detail"><strong>Štádium:</strong> ${this.escapeHtml(image.stage)}</div>` : ""}
          ${image.method ? `<div class="gallery-lightbox-detail"><strong>Metóda:</strong> ${this.escapeHtml(image.method)}</div>` : ""}
          ${image.objective || image.magnification ? `<div class="gallery-lightbox-detail"><strong>Zväčšenie:</strong> ${[image.objective, image.magnification].filter(Boolean).join(" / ")}</div>` : ""}
          ${image.author ? `<div class="gallery-lightbox-detail"><strong>Autor:</strong> ${this.escapeHtml(image.author)}</div>` : ""}
          ${image.laboratory ? `<div class="gallery-lightbox-detail"><strong>Laboratórium:</strong> ${this.escapeHtml(image.laboratory)}</div>` : ""}
          ${image.year ? `<div class="gallery-lightbox-detail"><strong>Rok:</strong> ${this.escapeHtml(image.year)}</div>` : ""}
          ${image.license ? `<div class="gallery-lightbox-detail"><strong>Licencia:</strong> ${this.escapeHtml(image.license)}</div>` : ""}
          ${image.description ? `<div class="gallery-lightbox-detail"><strong>Popis:</strong> ${this.escapeHtml(image.description)}</div>` : ""}
        </div>
        ${record ? `
          <div class="gallery-lightbox-actions">
            <button
              type="button"
              class="gallery-lightbox-btn"
              data-object-id="${this.escapeHtml(record.id)}"
            >
              Zobraziť v Atlase
            </button>
          </div>
        ` : ""}
      </div>
    `;

    // Bind na tlačidlo "Zobraziť v Atlase"
    body.querySelector(".gallery-lightbox-btn")?.addEventListener("click", () => {
      const objectId = body.querySelector(".gallery-lightbox-btn")?.dataset.objectId;
      if (objectId && typeof window.showAtlasDetail === "function") {
        window.showAtlasDetail(objectId);
        lightbox.style.display = "none";
        this.state.selectedImage = null;
      }
    });

    lightbox.style.display = "flex";
    this.state.selectedImage = image;
  },

  populateObjectDatalist() {
    const datalist = document.getElementById("gallery-object-list");
    if (!datalist) return;

    const records = this.state.records;
    const options = records
      .filter((r) => r.latinName)
      .map((r) => ({
        value: r.latinName,
        id: r.id,
      }));

    datalist.innerHTML = options
      .map((opt) => `<option value="${this.escapeHtml(opt.value)}" data-id="${this.escapeHtml(opt.id)}">`)
      .join("");
  },

  populateHostDatalist() {
    const datalist = document.getElementById("gallery-host-list");
    if (!datalist) return;

    const hosts = new Set();
    this.state.records.forEach((record) => {
      Repository.resolveHosts(record).forEach((h) => {
        if (h) hosts.add(h);
      });
    });

    datalist.innerHTML = Array.from(hosts)
      .sort((a, b) => a.localeCompare(b, "sk"))
      .map((h) => `<option value="${this.escapeHtml(h)}">`)
      .join("");
  },

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  },
};

export default GalleryPage;