/******************************************************************************
 * VetPara Atlas
 * Galéria – stránka pre prehliadanie fotografií
 *
 * OPRAVA (2026-08-22): Filter hostiteľa bol doteraz funkčne mŕtvy — hľadal
 * hodnotu `img.host`, ktorú nový formát `images.json` (parasiteId/url/alt/
 * caption/credit/dateAdded) vôbec neobsahuje (pozri AI_STATUS.md §0.9).
 * Fotografia sama o sebe hostiteľa nepozná — hostiteľa má priradeného až
 * diagnostický objekt (parasites.json record, cez `hostGroups`/`hosts`),
 * ku ktorému fotka patrí (`img.parasiteId`).
 *
 * Oprava: filter teraz vôbec nečíta `img.host`. Namiesto toho sa pre každú
 * fotku dohľadá jej záznam (getRecordForImage) a porovná sa
 * `Repository.resolveHosts(record)` voči vybraným hostiteľom — presne
 * rovnaká logika, akú už používa Atlas (`matchesHost` v AtlasPage.js).
 *
 * Zároveň bol filter prerobený z voľného textového vyhľadávania na
 * rovnaký viacúrovňový rozbaľovací (accordion) strom hostiteľov ako v
 * Atlase — vrátane hromadného výberu celej kategórie jedným klikom.
 * Samotná stromová logika (render + bind) je zdieľaná s Atlasom cez
 * src/components/HostFilterTree.js, aby sa nič neduplikovalo.
 ******************************************************************************/

import DatabaseService from "../services/DatabaseService.js";
import Repository from "../services/Repository.js";
import HostFilterTree from "../components/HostFilterTree.js";

const IMAGES_FILE = "images.json";
const HOST_HIERARCHY_FILE = "dictionary/host_hierarchy.json";

const GalleryPage = {
  state: {
    images: [],
    records: [],
    filterObjectId: "",
    // OPRAVA (bug: klik na fotku v detaile parazita otváral aj fotky
    // iných rodov, napr. Strongylus sp. -> Trichostrongylus/Metastrongylus).
    // filterObjectId je voľný text a filtruje sa cez .includes() (fuzzy,
    // zámerné pre ručné písanie do poľa). filterExactId je presné ID
    // záznamu, nastavuje sa iba pri prechode z detailu (init(objectId))
    // a v getFilteredImages() má prednosť pred fuzzy textovým hľadaním.
    // Akékoľvek ručné písanie/mazanie vo filtri ho zruší (pozri bindEvents).
    filterExactId: null,
    // Pole vybraných hostiteľov (checkboxy v hierarchickom strome) —
    // nahrádza pôvodné voľné textové filterHost.
    filterHosts: [],
    selectedImage: null,
  },

  // Rovnaká konvencia ako v AtlasPage.js: hostHierarchy je {} kým sa
  // async fetch host_hierarchy.json nedokončí — dovtedy sa filter zobrazí
  // bez skupín (prípadne sa vôbec nevykreslí, kým nedoletia dáta), po
  // dokončení loadHostHierarchy() sa prekreslí so skupinami.
  hostHierarchy: {},
  hostHierarchyLoaded: false,

  render() {
    return `
      <div id="gallery-view" class="view-page active-view">
        <div class="gallery-layout">
          <aside class="gallery-sidebar card">
            <div class="gallery-header">
              <h1>Galéria</h1>
              <p>Fotografie parazitov</p>
            </div>

            <!-- NOVÉ (2026-09-05): rovnaký zbaliteľný panel filtrov ako
                 v Atlase (§0.29 bod 4) — tlačidlo "Zobraziť/Skryť filtre"
                 je vidno len na mobile/tablete (≤700px, CSS z atlas.css,
                 triedy .atlas-filters-toggle/.atlas-filters-panel sú
                 globálne, nič nové v CSS netreba). Na desktope zostáva
                 panel vždy display:block a tlačidlo skryté, presne ako
                 v Atlase. -->
            <button
              type="button"
              id="gallery-filters-toggle"
              class="atlas-filters-toggle"
              aria-expanded="false"
              aria-controls="gallery-filters-panel"
            >
              <span>Zobraziť filtre</span>
              <span class="atlas-filters-toggle-icon" aria-hidden="true">▾</span>
            </button>

            <div id="gallery-filters-panel" class="atlas-filters-panel">
              <button
                type="button"
                id="gallery-clear-filters"
                class="gallery-clear-filters"
              >
                Zrušiť filtre
              </button>

              <div
                id="gallery-active-filters"
                class="gallery-active-filters atlas-active-filters"
                aria-live="polite"
              ></div>

              <div id="gallery-stats" class="gallery-stats" aria-live="polite">
                Načítavanie...
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

                <div id="gallery-host-filter-container">
                  <!-- Hierarchický strom hostiteľov sa vykreslí po načítaní
                       dát (init() -> renderHostFilterSection()), rovnako ako
                       v Atlase. -->
                </div>
              </div>
            </div>
          </aside>

          <main>
            <div id="gallery-grid" class="gallery-grid">
              <div class="gallery-loading">Načítavanie fotografií...</div>
            </div>
          </main>
        </div>

        <!-- Lightbox -->
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

  /**
   * @param {string|null} objectId - ak je zadané (napr. prechod z detailu
   * parazita cez window.showGalleryForParasite), textový filter objektu sa
   * predvyplní na latinský názov tohto parazita, takže sa hneď zobrazia
   * všetky jeho fotky (nielen tá, na ktorú sa kliklo).
   */
  async init(objectId = null) {
    await this.loadData();

    if (objectId) {
      const record = this.state.records.find((r) => r.id === objectId);
      if (record) {
        // filterObjectId je len na zobrazenie v textovom poli (nech
        // používateľ vidí latinský názov) — reálne filtrovanie robí
        // filterExactId, ktorý je presné ID, nie substring-matchovaný text.
        this.state.filterObjectId = record.latinName || record.id;
        this.state.filterExactId = record.id;
      }
    }

    this.bindEvents();

    const objectInput = document.getElementById("gallery-filter-object");
    if (objectInput && this.state.filterObjectId) {
      objectInput.value = this.state.filterObjectId;
    }

    this.renderGrid();

    // Rovnaký async načítavací vzor ako AtlasPage.loadHostHierarchy():
    // Repository.loadHostHierarchy() zabezpečí, že Repository.resolveHosts()
    // vie správne rozbaliť hostGroups; DatabaseService.load() navyše
    // cachuje podľa súboru, takže vlastný fetch host_hierarchy.json tu
    // nespôsobí druhý sieťový request.
    await Repository.loadHostHierarchy();
    await this.loadHostHierarchy();

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

  /**
   * Async načítanie dictionary/host_hierarchy.json (rovnaký bezpečný
   * try/catch vzor ako AtlasPage.loadHostHierarchy() — ak fetch zlyhá,
   * appka nepadne, filter hostiteľov sa zobrazí bez skupín).
   */
  async loadHostHierarchy() {
    try {
      this.hostHierarchy = await DatabaseService.load(HOST_HIERARCHY_FILE);
    } catch (error) {
      console.warn(
        "Galéria: host_hierarchy.json sa nepodarilo načítať, hostiteľský filter zostáva bez skupín.",
        error
      );
      this.hostHierarchy = {};
    }

    this.hostHierarchyLoaded = true;
    this.renderHostFilterSection();
    this.renderGrid();
  },

  /**
   * Zoznam všetkých hostiteľov naprieč diagnostickými objektmi (rovnaká
   * logika ako AtlasPage.getHostValues() — union explicitných `hosts` a
   * rozbaleného `hostGroups`).
   */
  getHostValues() {
    const values = this.state.records
      .flatMap((record) => Repository.resolveHosts(record))
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
      .map((value) => String(value).trim());

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, "sk"));
  },

  /**
   * Vykreslí (alebo prekreslí) sekciu filtra hostiteľov do
   * #gallery-host-filter-container a znovu naviaže jej event listenery.
   */
  renderHostFilterSection() {
    const container = document.getElementById("gallery-host-filter-container");
    if (!container) return;

    container.innerHTML = HostFilterTree.renderFilterSection({
      fieldsetId: "gallery-filter-host",
      legend: "Hostiteľ",
      hosts: this.getHostValues(),
      hostHierarchy: this.hostHierarchy,
      selectedHosts: this.state.filterHosts,
      fieldName: "host",
    });

    this.bindHostFilterEvents();
  },

  /**
   * NOVÉ (2026-09-05): naviazanie tlačidla "Zobraziť/Skryť filtre" na
   * mobile/tablete — rovnaký princíp ako Atlas (§0.29 bod 4). Samotné
   * skrývanie/zobrazovanie robí CSS (.atlas-filters-panel.is-open) z
   * atlas.css, tu sa iba prepína trieda + text tlačidla + aria-expanded.
   * Na desktope (≥992px) je tlačidlo cez CSS skryté, takže tento listener
   * jednoducho nikdy nedostane klik.
   */
  bindFiltersToggle() {
    const toggle = document.getElementById("gallery-filters-toggle");
    const panel = document.getElementById("gallery-filters-panel");
    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.querySelector("span").textContent = isOpen
        ? "Skryť filtre"
        : "Zobraziť filtre";
    });
  },

  bindHostFilterEvents() {
    const fieldset = document.getElementById("gallery-filter-host");
    if (!fieldset) return;

    HostFilterTree.bindCheckboxes(fieldset, "host", (selected) => {
      this.state.filterHosts = selected;
      this.renderGrid();
    });

    HostFilterTree.bindGroupSelectors(fieldset, "host", (selected) => {
      this.state.filterHosts = selected;
      this.renderGrid();
    });
  },

  bindEvents() {
    const objectInput = document.getElementById("gallery-filter-object");
    const clearButton = document.getElementById("gallery-clear-filters");
    const lightbox = document.getElementById("gallery-lightbox");
    const closeButton = document.getElementById("gallery-lightbox-close");

    this.bindFiltersToggle();

    if (objectInput) {
      objectInput.addEventListener("input", () => {
        this.state.filterObjectId = objectInput.value.trim();
        // Používateľ píše ručne -> zrušiť presný filter z detailu,
        // nech znova prevezme kontrolu fuzzy textové vyhľadávanie.
        this.state.filterExactId = null;
        this.renderGrid();
      });
      objectInput.addEventListener("change", () => {
        this.state.filterObjectId = objectInput.value.trim();
        this.state.filterExactId = null;
        this.renderGrid();
      });
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        if (objectInput) objectInput.value = "";
        this.state.filterObjectId = "";
        this.state.filterExactId = null;
        this.state.filterHosts = [];
        // Checkboxy sú reálne DOM elementy so svojím vlastným "checked"
        // stavom — najjednoduchší spoľahlivý spôsob, ako ich všetky
        // odškrtnúť (vrátane vnorených skupinových checkboxov a ich
        // indeterminate stavu), je sekciu jednoducho prekresliť odznova.
        this.renderHostFilterSection();
        this.renderGrid();
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", () => {
        lightbox.style.display = "none";
        this.state.selectedImage = null;
      });
    }

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.style.display = "none";
        this.state.selectedImage = null;
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.style.display !== "none") {
        lightbox.style.display = "none";
        this.state.selectedImage = null;
      }
    });
  },

  getFilteredImages() {
    const { images, filterObjectId, filterExactId, filterHosts } = this.state;

    if (!images || images.length === 0) return [];

    let matchingObjectIds = null;
    if (filterExactId) {
      // Presná zhoda (klik na fotku v detaile parazita) — nesmie sa
      // spustiť fuzzy substring hľadanie, ktoré by napr. pre
      // "Strongylus sp." nesprávne zachytilo aj "Trichostrongylus sp."
      // a "Metastrongylus sp." (bug hlásený autorkou).
      matchingObjectIds = [filterExactId];
    } else if (filterObjectId) {
      const search = filterObjectId.toLowerCase();
      matchingObjectIds = this.state.records
        .filter((r) =>
          (r.latinName || "").toLowerCase().includes(search) ||
          (r.slovakName || "").toLowerCase().includes(search) ||
          r.id.toLowerCase().includes(search)
        )
        .map((r) => r.id);
    }

    return images.filter((img) => {
      // Nový formát: používa parasiteId
      if (matchingObjectIds && !matchingObjectIds.includes(img.parasiteId)) {
        return false;
      }

      // OPRAVA (2026-08-22): fotka sama hostiteľa nepozná (images.json
      // nemá pole `host`) — hostiteľa má priradený diagnostický objekt,
      // ku ktorému fotka patrí. Rovnaká OR-logika ako v Atlase
      // (Repository.resolveHosts(record).some(...)).
      if (filterHosts && filterHosts.length > 0) {
        const record = this.getRecordForImage(img);
        if (!record) return false;

        const recordHosts = Repository.resolveHosts(record);
        if (!recordHosts.some((h) => filterHosts.includes(h))) return false;
      }

      return true;
    });
  },

  getRecordForImage(image) {
    // Nový formát: používa parasiteId
    return this.state.records.find((r) => r.id === image.parasiteId) || null;
  },

  /**
   * NOVÉ (2026-08-22): chip-tagy vybratých filtrov, rovnaký princíp ako
   * AtlasPage.renderActiveFilters() (autorka nahlásila, že Galéria toto
   * doteraz vôbec neukazovala, na rozdiel od Atlasu). Vypisuje sa do
   * #gallery-active-filters, volané z renderGrid() -> teda po každej
   * zmene filtra (search input, host checkboxy, Zrušiť filtre).
   */
  renderActiveFilters() {
    const container = document.getElementById("gallery-active-filters");
    if (!container) return;

    const filters = [];

    if (this.state.filterObjectId.trim()) {
      filters.push({
        key: "object",
        label: "Objekt",
        value: this.state.filterObjectId.trim(),
      });
    }

    (this.state.filterHosts || []).forEach((host) => {
      filters.push({
        key: "host",
        label: "Hostiteľ",
        value: host,
      });
    });

    if (filters.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <span class="filter-tag-label">Aktívne filtre:</span>
      ${filters.map((filter) => `
        <button
          type="button"
          class="atlas-filter-tag gallery-filter-tag"
          data-filter-key="${filter.key}"
          data-filter-value="${this.escapeHtml(filter.value)}"
          aria-label="Odstrániť filter ${filter.label}: ${this.escapeHtml(filter.value)}"
        >
          ${filter.label}: ${this.escapeHtml(filter.value)}
          <span aria-hidden="true">×</span>
        </button>
      `).join("")}
    `;

    container.querySelectorAll(".gallery-filter-tag").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.filterKey;
        const value = button.dataset.filterValue;

        if (key === "object") {
          this.state.filterObjectId = "";
          this.state.filterExactId = null;
          const objectInput = document.getElementById("gallery-filter-object");
          if (objectInput) objectInput.value = "";
        } else if (key === "host") {
          this.state.filterHosts = this.state.filterHosts.filter((h) => h !== value);
          // rovnaký dôvod ako pri "Zrušiť filtre": checkboxy majú vlastný
          // DOM "checked" stav (vrátane indeterminate pri skupinách),
          // najspoľahlivejšie je sekciu prekresliť odznova.
          this.renderHostFilterSection();
        }

        this.renderGrid();
      });
    });
  },

  renderGrid() {
    const container = document.getElementById("gallery-grid");
    const stats = document.getElementById("gallery-stats");

    if (!container) return;

    this.renderActiveFilters();

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
      .map((img) => {
        const record = this.getRecordForImage(img);
        const latinName = record?.latinName || img.parasiteId || "Neznámy objekt";

        // Nový formát: url je kompletná cesta
        return `
          <div class="gallery-item card" data-image-url="${this.escapeHtml(img.url)}">
            <div class="gallery-item-header">
              <div class="gallery-item-title">${this.escapeHtml(latinName)}</div>
            </div>

            <div class="gallery-item-thumb">
              <img 
               src="${this.resolveImageUrl(img.url)}" 
               alt="${this.escapeHtml(latinName)}"
               class="gallery-thumb-img"
              >
            </div>

            <div class="gallery-item-info">
              <div class="gallery-item-meta">
                ${img.caption ? `<span>${this.escapeHtml(img.caption)}</span>` : ""}
                ${img.dateAdded ? `<span>${this.escapeHtml(img.dateAdded.split("T")[0])}</span>` : ""}
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    container.querySelectorAll(".gallery-item").forEach((el) => {
      const url = el.dataset.imageUrl;
      const image = this.state.images.find((img) => img.url === url);
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
        <img 
          src="${this.resolveFullImageUrl(image.url)}" 
          alt="${this.escapeHtml(record?.latinName || image.parasiteId)}"
          class="gallery-lightbox-img"
        >
      </div>

      <div class="gallery-lightbox-info">
        <h3>${this.escapeHtml(record?.latinName || image.parasiteId)}</h3>

        ${record?.slovakName ? `<p><strong>Slovenský názov:</strong> ${this.escapeHtml(record.slovakName)}</p>` : ""}

        <div class="gallery-lightbox-details">
          ${image.alt ? `<div><strong>Popis:</strong> ${this.escapeHtml(image.alt)}</div>` : ""}
          ${image.caption ? `<div><strong>Popis:</strong> ${this.escapeHtml(image.caption)}</div>` : ""}
          ${image.dateAdded ? `<div><strong>Dátum:</strong> ${this.escapeHtml(image.dateAdded.split("T")[0])}</div>` : ""}
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

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  },
  resolveImageUrl(url) {
    if (!url) return "";
    return url.replace(/^\/+/, "");
  },

  /**
   * images.json obsahuje v `url` iba thumbnail cestu
   * (`<objectId>_<poradie>.webp`). Zväčšená verzia pre lightbox podľa
   * schválenej konvencie (AI_STATUS.md, Priorita č. 2) má rovnaký názov
   * s príponou `_full` pred `.webp` (`<objectId>_<poradie>_full.webp`),
   * takže sa odvodí, nie číta z dát.
   */
  resolveFullImageUrl(url) {
    const resolved = this.resolveImageUrl(url);
    if (!resolved) return "";
    // Ak by už niekedy prišla plná cesta priamo z dát, neduplikovať "_full".
    if (/_full\.webp$/i.test(resolved)) return resolved;
    return resolved.replace(/\.webp$/i, "_full.webp");
  },
};

export default GalleryPage;