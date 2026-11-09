import {
    REGIONS,
    PREFECTURES,
    BASE_COLORS,
    TILE_LAYERS,
    state,
    getFeaturePrefCode,
    getLineName,
    getLineCompany,
    getLineKey,
    getStationName,
    getStationKey,
    fetchRailwayData,
    getCenterLatLng,
    getRailwayFeatureStyle,
    featureStyle,
    extractBoundaries,
    saveToLocalStorage,
    loadFromLocalStorage,
    isIslandMunicipality,
    getSelectedPrefLabel,
    getCityName,
    getCityCode,
    getPrefName,
    showHoverCard,
    showLoading,
    showToast,
    exportStateJson,
    exportMapImage,
    exportMapSvg
} from './script-1.js';

window.onload = async function() {
    initTabUI();
    initPwaSupport();
    initPrefModalUI();
    loadFromLocalStorage();
    initColorPalettes();
    initMap();
    bindEvents();

    initBoundaryUIValues();
    updateHeaderPrefButton();
    updateModeUI();
    renderRailwayControlPanel();
    lucide.createIcons();

    if (state.railwayConfig.show) {
        await renderRailwayLayer();
    }

    loadPrefectureData(state.selectedPrefCodes);
};

function initTabUI() {
    const btnTabPaint = document.getElementById("btnTabPaint");
    const btnTabRailway = document.getElementById("btnTabRailway");

    if (btnTabPaint) btnTabPaint.addEventListener("click", () => switchTab("paint"));
    if (btnTabRailway) btnTabRailway.addEventListener("click", () => switchTab("railway"));

    switchTab("paint");
}

function switchTab(targetTab) {
    state.activeTab = targetTab;
    showHoverCard(false);

    if (state.map) {
        if (state.map.getPane("railwayPane")) {
            state.map.getPane("railwayPane").style.pointerEvents = targetTab === "paint" ? "none" : "auto";
        }
        if (state.map.getPane("landPane")) {
            state.map.getPane("landPane").style.pointerEvents = targetTab === "railway" ? "none" : "auto";
        }
    }

    const btnTabPaint = document.getElementById("btnTabPaint");
    const btnTabRailway = document.getElementById("btnTabRailway");
    const contentPaint = document.getElementById("tabContentPaint");
    const contentRailway = document.getElementById("tabContentRailway");

    const baseClass = "py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer";
    const activeClass = `${baseClass} bg-indigo-600 text-white shadow-sm`;
    const inactiveClass = `${baseClass} bg-slate-100 text-slate-600 hover:bg-slate-200`;

    if (targetTab === "paint") {
        if (btnTabPaint) btnTabPaint.className = activeClass;
        if (btnTabRailway) btnTabRailway.className = inactiveClass;
        if (contentPaint) contentPaint.classList.remove("hidden");
        if (contentRailway) contentRailway.classList.add("hidden");
    } else {
        if (btnTabPaint) btnTabPaint.className = inactiveClass;
        if (btnTabRailway) btnTabRailway.className = activeClass;
        if (contentPaint) contentPaint.classList.add("hidden");
        if (contentRailway) contentRailway.classList.remove("hidden");
    }

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

function initPwaSupport() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").then((registration) => {
            registration.addEventListener("updatefound", () => {
                const newWorker = registration.installing;
                if (!newWorker) return;
                newWorker.addEventListener("statechange", () => {
                    if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                        showToast("アプリが最新バージョンに更新されました！再読み込みします...");
                        setTimeout(() => window.location.reload(), 1500);
                    }
                });
            });
        }).catch(err => console.log("Service Worker登録制限:", err));

        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (state.isRefreshing) return;
            state.isRefreshing = true;
            window.location.reload();
        });
    }

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        state.deferredPrompt = e;
        document.getElementById("btnInstallPwa")?.classList.remove("hidden");
    });

    document.getElementById("btnInstallPwa")?.addEventListener("click", async () => {
        if (!state.deferredPrompt) return;
        state.deferredPrompt.prompt();
        const { outcome } = await state.deferredPrompt.userChoice;
        if (outcome === "accepted") showToast("アプリがホーム画面に追加されました！");
        state.deferredPrompt = null;
        document.getElementById("btnInstallPwa")?.classList.add("hidden");
    });
}

async function loadPrefectureData(codes) {
    showLoading(true, "GeoJSON境界データを読み込んでいます...");
    try {
        if (!state.nationalFeaturesCache) {
            const res = await fetch("https://raw.githubusercontent.com/smartnews-smri/japan-topography/main/data/municipality/geojson/s0010/N03-21_210101.json");
            if (!res.ok) throw new Error("全国データの取得に失敗しました");
            const data = await res.json();
            state.nationalFeaturesCache = data.features || [];
        }

        const isAll = state.mapMode === "pref" || codes.includes("ALL") || codes.length === 47;
        let displayFeatures = [];

        if (isAll) {
            displayFeatures = state.nationalFeaturesCache;
        } else {
            const selectedSet = new Set(codes);
            displayFeatures = state.nationalFeaturesCache.filter(feature => selectedSet.has(getFeaturePrefCode(feature)));
        }

        state.currentGeoJsonData = { type: "FeatureCollection", features: displayFeatures };

        renderGeoJson(state.currentGeoJsonData, state.nationalFeaturesCache);
        updateUIStats();
        showLoading(false);
    } catch (err) {
        console.error("データ取得エラー:", err);
        showLoading(false);
        showToast("境界データの取得に失敗しました。", "error");
    }
}

function initBoundaryUIValues() {
    const bgColorPicker = document.getElementById("bgColorPicker");
    if (bgColorPicker) {
        bgColorPicker.value = state.mapBgColor;
        applyMapBgColor(state.mapBgColor);
    }

    const landColorPicker = document.getElementById("landColorPicker");
    if (landColorPicker) landColorPicker.value = state.defaultLandColor;

    const chkShowBaseMap = document.getElementById("chkShowBaseMap");
    if (chkShowBaseMap) chkShowBaseMap.checked = state.showBaseMap;

    const chkOpacity = document.getElementById("chkEnableOpacity");
    if (chkOpacity) chkOpacity.checked = state.enableLandOpacity;

    const rangeOpacity = document.getElementById("landOpacityRange");
    if (rangeOpacity) {
        rangeOpacity.value = state.defaultLandOpacity;
        rangeOpacity.disabled = !state.enableLandOpacity;
    }
    const landOpacityVal = document.getElementById("landOpacityVal");
    if (landOpacityVal) landOpacityVal.textContent = state.enableLandOpacity ? state.defaultLandOpacity : "1.00 (不透明)";

    updateTileButtonsUI(state.selectedTileType);

    if (state.bgImageDataUrl) {
        applyBgImage(state.bgImageDataUrl);
        const bgImageName = document.getElementById("bgImageName");
        if (bgImageName) bgImageName.textContent = "背景画像適用中";
        document.getElementById("btnRemoveBgImage")?.classList.remove("hidden");
    }

    const uiMap = [
        { type: "coast", chk: "chkCoastBoundary", color: "colorCoastBoundary", weight: "weightCoastBoundary", style: "styleCoastBoundary" },
        { type: "pref", chk: "chkPrefBoundary", color: "colorPrefBoundary", weight: "weightPrefBoundary", style: "stylePrefBoundary" },
        { type: "city", chk: "chkCityBoundary", color: "colorCityBoundary", weight: "weightCityBoundary", style: "styleCityBoundary" },
        { type: "county", chk: "chkCountyBoundary", color: "colorCountyBoundary", weight: "weightCountyBoundary", style: "styleCountyBoundary" },
        { type: "ward", chk: "chkWardBoundary", color: "colorWardBoundary", weight: "weightWardBoundary", style: "styleWardBoundary" }
    ];

    uiMap.forEach(item => {
        const chk = document.getElementById(item.chk);
        if (chk && state.boundarySettings[item.type]) {
            chk.checked = state.boundarySettings[item.type].show;
            const colorEl = document.getElementById(item.color);
            if (colorEl) colorEl.value = state.boundarySettings[item.type].color;
            const weightEl = document.getElementById(item.weight);
            if (weightEl) weightEl.value = state.boundarySettings[item.type].weight;
            const styleEl = document.getElementById(item.style);
            if (styleEl) styleEl.value = state.boundarySettings[item.type].style;
        }
    });

    const chkRail = document.getElementById("chkRailwayBoundary");
    if (chkRail) chkRail.checked = state.railwayConfig.show;

    const colorLine = document.getElementById("colorLineBoundary") || document.getElementById("colorRailwayBoundary");
    if (colorLine) colorLine.value = state.railwayConfig.line.color;
    const weightLine = document.getElementById("weightLineBoundary") || document.getElementById("weightRailwayBoundary");
    if (weightLine) weightLine.value = state.railwayConfig.line.weight;
    const styleLine = document.getElementById("styleLineBoundary") || document.getElementById("styleRailwayBoundary");
    if (styleLine) styleLine.value = state.railwayConfig.line.style;

    const chkStationShow = document.getElementById("chkStationShow");
    if (chkStationShow) chkStationShow.checked = state.railwayConfig.station.show !== false;
    const colorStation = document.getElementById("colorStationBoundary");
    if (colorStation) colorStation.value = state.railwayConfig.station.color;
    const sizeStation = document.getElementById("sizeStationBoundary");
    if (sizeStation) sizeStation.value = state.railwayConfig.station.radius;
    const colorStationStroke = document.getElementById("colorStationStroke");
    if (colorStationStroke) colorStationStroke.value = state.railwayConfig.station.strokeColor;
    const weightStationStroke = document.getElementById("weightStationStroke");
    if (weightStationStroke) weightStationStroke.value = state.railwayConfig.station.strokeWeight;
}

function applyMapBgColor(color) {
    state.mapBgColor = color;
    const mapContainer = document.getElementById("map");
    if (mapContainer) mapContainer.style.backgroundColor = color;
}

function applyBgImage(url) {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;
    if (url) {
        mapContainer.style.backgroundImage = `url(${url})`;
        mapContainer.style.backgroundSize = "cover";
        mapContainer.style.backgroundPosition = "center";
        mapContainer.style.backgroundRepeat = "no-repeat";
    } else {
        mapContainer.style.backgroundImage = "none";
    }
}

function initPrefModalUI() {
    const gridEl = document.getElementById("prefCheckboxGrid");
    if (!gridEl) return;

    gridEl.innerHTML = REGIONS.map(region => {
        const prefCheckboxes = region.codes.map(code => {
            const pref = PREFECTURES.find(p => p.code === code);
            return `
                <label class="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-700 transition select-none">
                    <input type="checkbox" value="${code}" class="pref-checkbox rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4">
                    <span>${pref.name}</span>
                </label>
            `;
        }).join("");

        return `
            <div>
                <div class="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
                    <span class="text-xs font-bold text-slate-800">${region.name}</span>
                    <button type="button" class="region-select-toggle text-[11px] text-indigo-600 hover:underline font-semibold" data-region-id="${region.id}">この地方を選択</button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-1">${prefCheckboxes}</div>
            </div>
        `;
    }).join("");

    gridEl.querySelectorAll(".pref-checkbox").forEach(chk => {
        chk.addEventListener("change", () => updateTempSelectedFromCheckboxes());
    });

    gridEl.querySelectorAll(".region-select-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
            const region = REGIONS.find(r => r.id === btn.getAttribute("data-region-id"));
            if (region) {
                const allSelected = region.codes.every(c => state.tempSelectedCodes.includes(c));
                if (allSelected) state.tempSelectedCodes = state.tempSelectedCodes.filter(c => !region.codes.includes(c));
                else {
                    region.codes.forEach(c => { if (!state.tempSelectedCodes.includes(c)) state.tempSelectedCodes.push(c); });
                    state.tempSelectedCodes = state.tempSelectedCodes.filter(c => c !== "ALL");
                }
                syncCheckboxesFromTemp();
            }
        });
    });

    document.querySelectorAll("#regionButtons .region-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const reg = btn.getAttribute("data-region");
            if (reg === "ALL") state.tempSelectedCodes = ["ALL"];
            else if (reg === "CLEAR") state.tempSelectedCodes = [];
            else {
                const region = REGIONS.find(r => r.id === reg);
                if (region) state.tempSelectedCodes = [...region.codes];
            }
            syncCheckboxesFromTemp();
        });
    });

    document.getElementById("modalToggleIsland13")?.addEventListener("change", (e) => state.tempIncludeIslands["13"] = e.target.checked);
    document.getElementById("modalToggleIsland46")?.addEventListener("change", (e) => state.tempIncludeIslands["46"] = e.target.checked);
    document.getElementById("modalToggleIsland47")?.addEventListener("change", (e) => state.tempIncludeIslands["47"] = e.target.checked);

    document.getElementById("btnOpenPrefModal")?.addEventListener("click", openPrefModal);
    document.getElementById("btnClosePrefModal")?.addEventListener("click", closePrefModal);
    document.getElementById("btnCancelPrefModal")?.addEventListener("click", closePrefModal);
    
    document.getElementById("btnApplyPrefModal")?.addEventListener("click", () => {
        state.selectedPrefCodes = [...state.tempSelectedCodes];
        if (state.selectedPrefCodes.length === 0) state.selectedPrefCodes = ["ALL"];
        state.includeIslands = { ...state.tempIncludeIslands };
        closePrefModal();
        updateHeaderPrefButton();
        saveToLocalStorage();
        loadPrefectureData(state.selectedPrefCodes);
    });

    document.getElementById("btnModeCity")?.addEventListener("click", () => requestMapModeSwitch("city"));
    document.getElementById("btnModePref")?.addEventListener("click", () => requestMapModeSwitch("pref"));

    document.getElementById("btnCancelModeConfirm")?.addEventListener("click", () => {
        document.getElementById("modeConfirmModal")?.classList.add("hidden");
        state.pendingMapMode = null;
    });

    document.getElementById("btnApplyModeConfirm")?.addEventListener("click", () => {
        if (state.pendingMapMode) {
            state.mapMode = state.pendingMapMode;
            state.colorState = {};
            state.pendingMapMode = null;
            document.getElementById("modeConfirmModal")?.classList.add("hidden");
            updateModeUI();
            updateHeaderPrefButton();
            saveToLocalStorage();
            loadPrefectureData(state.selectedPrefCodes);
        }
    });
}

function requestMapModeSwitch(targetMode) {
    if (state.mapMode === targetMode) return;

    state.pendingMapMode = targetMode;
    const label = targetMode === "pref" ? "「都道府県版」" : "「市区町村版」";
    const targetLabelEl = document.getElementById("targetModeLabel");
    if (targetLabelEl) targetLabelEl.textContent = label;
    document.getElementById("modeConfirmModal")?.classList.remove("hidden");
    lucide.createIcons();
}

function updateModeUI() {
    const btnCity = document.getElementById("btnModeCity");
    const btnPref = document.getElementById("btnModePref");
    const prefSelectSection = document.getElementById("prefSelectSection");
    const appTitle = document.getElementById("appTitle");
    const unitLabel = document.getElementById("unitLabel");
    const coloredListTitle = document.getElementById("coloredListTitle");
    const cityBoundaryBox = document.getElementById("cityBoundaryBox");
    const countyBoundaryBox = document.getElementById("countyBoundaryBox");
    const wardBoundaryBox = document.getElementById("wardBoundaryBox");

    if (state.mapMode === "pref") {
        if (btnPref) btnPref.className = "py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border shadow-sm bg-indigo-600 text-white border-indigo-600";
        if (btnCity) btnCity.className = "py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border bg-white text-slate-700 border-slate-200 hover:bg-slate-50";
        prefSelectSection?.classList.add("hidden");
        if (appTitle) appTitle.textContent = "都道府県ペイントエディタ";
        if (unitLabel) unitLabel.textContent = "都道府県";
        if (coloredListTitle) coloredListTitle.textContent = "塗った都道府県リスト";

        cityBoundaryBox?.classList.add("hidden");
        countyBoundaryBox?.classList.add("hidden");
        wardBoundaryBox?.classList.add("hidden");
    } else {
        if (btnCity) btnCity.className = "py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border shadow-sm bg-indigo-600 text-white border-indigo-600";
        if (btnPref) btnPref.className = "py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border bg-white text-slate-700 border-slate-200 hover:bg-slate-50";
        prefSelectSection?.classList.remove("hidden");
        if (appTitle) appTitle.textContent = "市区町村ペイントエディタ";
        if (unitLabel) unitLabel.textContent = "市区町村";
        if (coloredListTitle) coloredListTitle.textContent = "塗った市区町村リスト";

        cityBoundaryBox?.classList.remove("hidden");
        countyBoundaryBox?.classList.remove("hidden");
        wardBoundaryBox?.classList.remove("hidden");
    }
}

function openPrefModal() {
    state.tempSelectedCodes = [...state.selectedPrefCodes];
    state.tempIncludeIslands = { ...state.includeIslands };
    syncCheckboxesFromTemp();
    syncModalIslandTogglesFromTemp();
    document.getElementById("prefModal")?.classList.remove("hidden");
    lucide.createIcons();
}

function syncModalIslandTogglesFromTemp() {
    const t13 = document.getElementById("modalToggleIsland13");
    const t46 = document.getElementById("modalToggleIsland46");
    const t47 = document.getElementById("modalToggleIsland47");
    if (t13) t13.checked = state.tempIncludeIslands["13"];
    if (t46) t46.checked = state.tempIncludeIslands["46"];
    if (t47) t47.checked = state.tempIncludeIslands["47"];
}

function closePrefModal() {
    document.getElementById("prefModal")?.classList.add("hidden");
}

function updateTempSelectedFromCheckboxes() {
    const checked = Array.from(document.querySelectorAll(".pref-checkbox:checked")).map(cb => cb.value);
    state.tempSelectedCodes = (checked.length === 47 || checked.length === 0) ? ["ALL"] : checked;
    updateModalFooterCount();
}

function syncCheckboxesFromTemp() {
    const isAll = state.tempSelectedCodes.includes("ALL") || state.tempSelectedCodes.length === 47;
    document.querySelectorAll(".pref-checkbox").forEach(cb => cb.checked = isAll || state.tempSelectedCodes.includes(cb.value));
    updateModalFooterCount();
}

function updateModalFooterCount() {
    const isAll = state.tempSelectedCodes.includes("ALL") || state.tempSelectedCodes.length === 47;
    const countEl = document.getElementById("modalSelectedCount");
    if (!countEl) return;
    if (isAll) countEl.textContent = "全国（すべての都道府県）";
    else if (state.tempSelectedCodes.length === 0) countEl.textContent = "未選択（全国を表示）";
    else countEl.textContent = `${getSelectedPrefLabel(state.tempSelectedCodes)} (${state.tempSelectedCodes.length}都道府県)`;
}

function updateHeaderPrefButton() {
    const labelEl = document.getElementById("selectedPrefLabel");
    const badgeEl = document.getElementById("selectedPrefBadge");

    if (!labelEl || !badgeEl) return;

    if (state.mapMode === "pref") {
        labelEl.textContent = "全国（47都道府県）";
        badgeEl.classList.add("hidden");
        return;
    }

    labelEl.textContent = getSelectedPrefLabel(state.selectedPrefCodes);

    if (state.selectedPrefCodes.includes("ALL") || state.selectedPrefCodes.length === 47) {
        badgeEl.classList.add("hidden");
    } else {
        badgeEl.textContent = state.selectedPrefCodes.length;
        badgeEl.classList.remove("hidden");
    }
}

function initColorPalettes() {
    renderBasePalette();
    renderCustomPalette();
}

function renderBasePalette() {
    const paletteEl = document.getElementById("colorPalette");
    if (!paletteEl) return;

    paletteEl.innerHTML = BASE_COLORS.map((color) => `
        <button type="button" data-color="${color}" class="color-swatch w-7 h-7 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 flex items-center justify-center ${color.toLowerCase() === state.selectedColor.toLowerCase() ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}" style="background-color: ${color}">
        </button>
    `).join("");

    paletteEl.querySelectorAll(".color-swatch").forEach(btn => {
        btn.addEventListener("click", () => setColor(btn.getAttribute("data-color")));
    });
}

function renderCustomPalette() {
    const customPaletteEl = document.getElementById("customColorPalette");
    if (!customPaletteEl) return;

    customPaletteEl.innerHTML = state.customColors.map((color, index) => `
        <label data-index="${index}" data-color="${color}" class="custom-swatch relative w-7 h-7 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 flex items-center justify-center cursor-pointer ${color.toLowerCase() === state.selectedColor.toLowerCase() ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}" style="background-color: ${color}">
            <input type="color" value="${color}" data-index="${index}" class="custom-color-input opacity-0 absolute inset-0 w-full h-full cursor-pointer">
        </label>
    `).join("");

    customPaletteEl.querySelectorAll(".custom-color-input").forEach(input => {
        input.addEventListener("input", (e) => {
            const idx = parseInt(e.target.getAttribute("data-index"), 10);
            const newColor = e.target.value;
            state.customColors[idx] = newColor;
            const label = e.target.parentElement;
            label.style.backgroundColor = newColor;
            label.setAttribute("data-color", newColor);
            setColor(newColor);
            saveToLocalStorage();
        });
        input.addEventListener("click", (e) => {
            const idx = parseInt(e.target.getAttribute("data-index"), 10);
            setColor(state.customColors[idx]);
        });
    });
}

function setColor(color) {
    state.selectedColor = color;
    document.querySelectorAll(".color-swatch, .custom-swatch").forEach(btn => {
        const btnColor = btn.getAttribute("data-color");
        if (btnColor && btnColor.toLowerCase() === color.toLowerCase()) {
            btn.classList.add("ring-2", "ring-indigo-600", "ring-offset-2");
        } else {
            btn.classList.remove("ring-2", "ring-indigo-600", "ring-offset-2");
        }
    });

    setToolMode("paint");
}

function setToolMode(mode) {
    state.activeTool = mode;
    const btnPaint = document.getElementById("btnPaintMode");
    const btnEraser = document.getElementById("btnEraserMode");
    if (!btnPaint || !btnEraser) return;

    if (mode === "paint") {
        btnPaint.className = "flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg border border-indigo-600 bg-indigo-50 text-indigo-700 transition shadow-sm";
        btnEraser.className = "flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition";
    } else {
        btnEraser.className = "flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg border border-rose-600 bg-rose-50 text-rose-700 transition shadow-sm";
        btnPaint.className = "flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition";
    }
}

function initMap() {
    state.map = L.map("map", {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true
    }).setView([36.5, 137.5], 5);

    L.control.zoom({ position: "bottomright" }).addTo(state.map);

    state.map.createPane("landPane");
    state.map.getPane("landPane").style.zIndex = 400;

    state.map.createPane("boundaryPane");
    state.map.getPane("boundaryPane").style.zIndex = 500;
    state.map.getPane("boundaryPane").style.pointerEvents = "none";

    state.map.createPane("railwayPane");
    state.map.getPane("railwayPane").style.zIndex = 600;
    state.map.getPane("railwayPane").style.pointerEvents = "none";

    updateTileLayer(state.selectedTileType);
}

function updateTileLayer(tileType) {
    state.selectedTileType = tileType;
    if (state.currentTileLayer) {
        state.map.removeLayer(state.currentTileLayer);
        state.currentTileLayer = null;
    }

    if (state.showBaseMap && tileType !== "none" && TILE_LAYERS[tileType]) {
        state.currentTileLayer = L.tileLayer(TILE_LAYERS[tileType], {
            maxZoom: 18,
            crossOrigin: true
        }).addTo(state.map);
    }
}

function updateTileButtonsUI(tileType) {
    document.querySelectorAll(".tile-btn").forEach(b => {
        if (b.getAttribute("data-tile") === tileType) {
            b.classList.add("active", "bg-white", "text-indigo-600", "shadow-sm");
            b.classList.remove("text-slate-600");
        } else {
            b.classList.remove("active", "bg-white", "text-indigo-600", "shadow-sm");
            b.classList.add("text-slate-600");
        }
    });
}

function bindEvents() {
    document.getElementById("btnPaintMode")?.addEventListener("click", () => setToolMode("paint"));
    document.getElementById("btnEraserMode")?.addEventListener("click", () => setToolMode("eraser"));

    document.getElementById("btnFillAll")?.addEventListener("click", fillAllCurrentPref);
    document.getElementById("btnClearAll")?.addEventListener("click", clearAllCurrentPref);

    document.getElementById("btnResetView")?.addEventListener("click", fitToCurrentBounds);

    document.getElementById("btnExportJson")?.addEventListener("click", exportStateJson);
    document.getElementById("btnImportJson")?.addEventListener("change", importStateJson);
    document.getElementById("btnExportPng")?.addEventListener("click", exportMapImage);
    document.getElementById("btnExportSvg")?.addEventListener("click", exportMapSvg);

    const cityListEl = document.getElementById("coloredCityList");
    if (cityListEl) {
        cityListEl.addEventListener("click", (e) => {
            const deleteBtn = e.target.closest("[data-delete-code]");
            if (deleteBtn) {
                const code = deleteBtn.getAttribute("data-delete-code");
                if (code) {
                    removeCityColor(code);
                }
            }
        });
    }

    document.getElementById("btnApplySampleData")?.addEventListener("click", () => {
        document.getElementById("sampleConfirmModal")?.classList.remove("hidden");
        lucide.createIcons();
    });

    document.getElementById("btnCancelSampleConfirm")?.addEventListener("click", () => {
        document.getElementById("sampleConfirmModal")?.classList.add("hidden");
    });

    document.getElementById("btnApplySampleConfirm")?.addEventListener("click", () => {
        document.getElementById("sampleConfirmModal")?.classList.add("hidden");
        applySampleCategoryColors();
    });

    document.getElementById("bgColorPicker")?.addEventListener("input", (e) => {
        applyMapBgColor(e.target.value);
        saveToLocalStorage();
    });

    document.getElementById("chkShowBaseMap")?.addEventListener("change", (e) => {
        state.showBaseMap = e.target.checked;
        updateTileLayer(state.selectedTileType);
        saveToLocalStorage();
    });

    document.querySelectorAll(".tile-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tileType = btn.getAttribute("data-tile");
            updateTileButtonsUI(tileType);
            updateTileLayer(tileType);
            saveToLocalStorage();
        });
    });

    document.getElementById("landColorPicker")?.addEventListener("input", (e) => {
        state.defaultLandColor = e.target.value;
        refreshLayerStyles();
        saveToLocalStorage();
    });

    document.getElementById("chkEnableOpacity")?.addEventListener("change", (e) => {
        state.enableLandOpacity = e.target.checked;
        const rangeOpacity = document.getElementById("landOpacityRange");
        if (rangeOpacity) rangeOpacity.disabled = !state.enableLandOpacity;
        const valEl = document.getElementById("landOpacityVal");
        if (valEl) valEl.textContent = state.enableLandOpacity ? state.defaultLandOpacity : "1.00 (不透明)";
        refreshLayerStyles();
        saveToLocalStorage();
    });

    document.getElementById("landOpacityRange")?.addEventListener("input", (e) => {
        state.defaultLandOpacity = parseFloat(e.target.value);
        const valEl = document.getElementById("landOpacityVal");
        if (valEl) valEl.textContent = state.defaultLandOpacity;
        refreshLayerStyles();
        saveToLocalStorage();
    });

    document.getElementById("bgImageInput")?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                state.bgImageDataUrl = evt.target.result;
                applyBgImage(state.bgImageDataUrl);
                const nameEl = document.getElementById("bgImageName");
                if (nameEl) nameEl.textContent = file.name;
                document.getElementById("btnRemoveBgImage")?.classList.remove("hidden");
                saveToLocalStorage();
                showToast("背景画像を設定しました");
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById("btnRemoveBgImage")?.addEventListener("click", () => {
        state.bgImageDataUrl = null;
        applyBgImage(null);
        const nameEl = document.getElementById("bgImageName");
        if (nameEl) nameEl.textContent = "背景画像を選択...";
        document.getElementById("btnRemoveBgImage")?.classList.add("hidden");
        const fileInput = document.getElementById("bgImageInput");
        if (fileInput) fileInput.value = "";
        saveToLocalStorage();
        showToast("背景画像を削除しました");
    });

    const boundaryUIKeys = [
        { type: "coast", chk: "chkCoastBoundary", color: "colorCoastBoundary", weight: "weightCoastBoundary", style: "styleCoastBoundary" },
        { type: "pref", chk: "chkPrefBoundary", color: "colorPrefBoundary", weight: "weightPrefBoundary", style: "stylePrefBoundary" },
        { type: "city", chk: "chkCityBoundary", color: "colorCityBoundary", weight: "weightCityBoundary", style: "styleCityBoundary" },
        { type: "county", chk: "chkCountyBoundary", color: "colorCountyBoundary", weight: "weightCountyBoundary", style: "styleCountyBoundary" },
        { type: "ward", chk: "chkWardBoundary", color: "colorWardBoundary", weight: "weightWardBoundary", style: "styleWardBoundary" }
    ];

    boundaryUIKeys.forEach(item => {
        const chkEl = document.getElementById(item.chk);
        if (!chkEl) return;

        const updateSetting = () => {
            state.boundarySettings[item.type] = {
                show: chkEl.checked,
                color: document.getElementById(item.color)?.value || "#000000",
                weight: parseFloat(document.getElementById(item.weight)?.value || 1),
                style: document.getElementById(item.style)?.value || "solid"
            };
            renderBoundaryLayers();
            saveToLocalStorage();
        };

        chkEl.addEventListener("change", updateSetting);
        document.getElementById(item.color)?.addEventListener("input", updateSetting);
        document.getElementById(item.weight)?.addEventListener("change", updateSetting);
        document.getElementById(item.style)?.addEventListener("change", updateSetting);
    });

    const chkRail = document.getElementById("chkRailwayBoundary");
    const colorLine = document.getElementById("colorLineBoundary") || document.getElementById("colorRailwayBoundary");
    const weightLine = document.getElementById("weightLineBoundary") || document.getElementById("weightRailwayBoundary");
    const styleLine = document.getElementById("styleLineBoundary") || document.getElementById("styleRailwayBoundary");
    
    const chkStationShow = document.getElementById("chkStationShow");
    const colorStation = document.getElementById("colorStationBoundary");
    const sizeStation = document.getElementById("sizeStationBoundary");
    const colorStationStroke = document.getElementById("colorStationStroke");
    const weightStationStroke = document.getElementById("weightStationStroke");

    const updateRailwaySetting = async () => {
        if (chkRail) state.railwayConfig.show = chkRail.checked;

        if (colorLine) state.railwayConfig.line.color = colorLine.value;
        if (weightLine) {
            const val = parseFloat(weightLine.value);
            state.railwayConfig.line.weight = isNaN(val) ? 2.0 : val;
        }
        if (styleLine) state.railwayConfig.line.style = styleLine.value;

        if (chkStationShow) state.railwayConfig.station.show = chkStationShow.checked;
        if (colorStation) state.railwayConfig.station.color = colorStation.value;
        if (sizeStation) {
            const val = parseFloat(sizeStation.value);
            state.railwayConfig.station.radius = isNaN(val) ? 5 : val;
        }
        if (colorStationStroke) state.railwayConfig.station.strokeColor = colorStationStroke.value;
        if (weightStationStroke) {
            const val = parseFloat(weightStationStroke.value);
            state.railwayConfig.station.strokeWeight = isNaN(val) ? 2 : val;
        }

        await renderRailwayLayer();
        saveToLocalStorage();
    };

    const bindRailwayEvent = (el, events) => {
        if (!el) return;
        events.forEach(evt => el.addEventListener(evt, updateRailwaySetting));
    };

    bindRailwayEvent(chkRail, ["change"]);
    bindRailwayEvent(colorLine, ["input", "change"]);
    bindRailwayEvent(weightLine, ["input", "change"]);
    bindRailwayEvent(styleLine, ["change"]);

    bindRailwayEvent(chkStationShow, ["change"]);
    bindRailwayEvent(colorStation, ["input", "change"]);
    bindRailwayEvent(sizeStation, ["input", "change"]);
    bindRailwayEvent(colorStationStroke, ["input", "change"]);
    bindRailwayEvent(weightStationStroke, ["input", "change"]);
}

function renderGeoJson(data, topologyFeatures) {
    if (state.geojsonLayer) state.map.removeLayer(state.geojsonLayer);

    state.currentCityMap = {};

    const filteredFeatures = data.features.filter(feature => {
        const code = getCityCode(feature.properties);
        const islandPrefCode = isIslandMunicipality(code, feature.properties);
        return !(islandPrefCode && state.includeIslands[islandPrefCode] === false);
    });

    const filteredTopology = (topologyFeatures || data.features).filter(feature => {
        const code = getCityCode(feature.properties);
        const islandPrefCode = isIslandMunicipality(code, feature.properties);
        return !(islandPrefCode && state.includeIslands[islandPrefCode] === false);
    });

    const selectedSet = new Set(
        (state.mapMode === "pref" || state.selectedPrefCodes.includes("ALL")) ? PREFECTURES.map(p => p.code) : state.selectedPrefCodes
    );

    extractBoundaries(filteredTopology, selectedSet);

    state.geojsonLayer = L.geoJSON({ type: "FeatureCollection", features: filteredFeatures }, {
        pane: "landPane",
        style: featureStyle,
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const cityCode = getCityCode(props);
            const prefCode = getFeaturePrefCode(feature);
            const code = state.mapMode === "pref" ? prefCode : cityCode;
            const name = state.mapMode === "pref" ? (getPrefName(prefCode) || "都道府県") : getCityName(props);
            const prefName = props.N03_001 || getPrefName(prefCode) || "都道府県";

            state.currentCityMap[code] = { name, prefCode, prefName };

            layer.on({
                mouseover: (e) => {
                    if (state.activeTab === "railway") return;

                    const colored = Boolean(state.colorState[code]);
                    const opacity = colored ? 1.0 : (state.enableLandOpacity ? Math.min(1.0, state.defaultLandOpacity + 0.2) : 1.0);
                    
                    if (state.mapMode === "pref") {
                        state.geojsonLayer.eachLayer(l => {
                            if (getFeaturePrefCode(l.feature) === prefCode) {
                                l.setStyle({ fillOpacity: opacity, opacity: opacity });
                            }
                        });
                    } else {
                        e.target.setStyle({ fillOpacity: opacity });
                    }

                    showHoverCard(true, prefName, state.mapMode === "pref" ? prefName : name, code);
                },
                mouseout: (e) => {
                    if (state.activeTab === "railway") return;

                    if (state.mapMode === "pref") {
                        state.geojsonLayer.eachLayer(l => {
                            if (getFeaturePrefCode(l.feature) === prefCode) state.geojsonLayer.resetStyle(l);
                        });
                    } else {
                        state.geojsonLayer.resetStyle(e.target);
                    }
                    showHoverCard(false);
                },
                click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    if (state.activeTab === "railway") return;

                    handleCityClick(code);
                }
            });
        }
    }).addTo(state.map);

    renderBoundaryLayers();
    renderRailwayLayer();
    fitToCurrentBounds();
}

function renderBoundaryLayers() {
    ["ward", "county", "city", "pref", "coast"].forEach(type => {
        if (state.boundaryLayers[type]) {
            state.map.removeLayer(state.boundaryLayers[type]);
            state.boundaryLayers[type] = null;
        }

        if (state.mapMode === "pref" && (type === "city" || type === "county" || type === "ward")) {
            return;
        }

        const setting = state.boundarySettings[type];
        const geojson = state.boundaryGeoJsons[type];

        if (setting && setting.show && geojson) {
            let dashArray = null;
            if (setting.style === "dashed") dashArray = "6, 4";
            else if (setting.style === "dotted") dashArray = "2, 3";

            state.boundaryLayers[type] = L.geoJSON(geojson, {
                pane: "boundaryPane",
                style: {
                    color: setting.color,
                    weight: setting.weight,
                    dashArray: dashArray,
                    opacity: 0.95,
                    lineCap: "round",
                    lineJoin: "round",
                    interactive: false
                }
            }).addTo(state.map);
        }
    });
}

async function renderRailwayLayer() {
    if (state.boundaryLayers.railway) {
        state.map.removeLayer(state.boundaryLayers.railway);
        state.boundaryLayers.railway = null;
    }

    if (!state.railwayConfig.show) return;

    if (!state.boundaryGeoJsons.railway) {
        showLoading(true, "鉄道データを取得中...");
        const data = await fetchRailwayData();
        showLoading(false);
        if (data) {
            state.boundaryGeoJsons.railway = data;
        } else {
            state.railwayConfig.show = false;
            const chkRail = document.getElementById("chkRailwayBoundary");
            if (chkRail) chkRail.checked = false;
            return;
        }
    }

    state.boundaryLayers.railway = L.layerGroup();
    const lineLayerGroup = L.layerGroup();
    const stationLayerGroup = L.layerGroup();

    // 駅の表示・非表示判定関数 (1. 駅個別 -> 2. 路線個別 -> 3. 全体設定)
    // ※ 全体設定がOFFであっても、路線や駅の個別設定でONになっていれば表示されます
    function isStationVisible(feature) {
        const props = feature.properties || {};
        const stKey = getStationKey(props);
        const lineKey = getLineKey(props);

        // 1. 駅個別の表示設定があれば最優先
        const stCustom = stKey ? state.stationColorState[stKey] : null;
        if (stCustom && stCustom.show !== undefined) {
            return stCustom.show;
        }

        // 2. 路線個別の所属駅表示設定があればそれを適用
        const lineCustom = lineKey ? state.railwayColorState[lineKey] : null;
        if (lineCustom && lineCustom.showStations !== undefined) {
            return lineCustom.showStations;
        }

        // 3. どちらも個別設定がなければ全体設定を適用
        return state.railwayConfig.station.show !== false;
    }

    function createStationGroup(latlng, feature) {
        const group = L.layerGroup();
        const stStyle = getRailwayFeatureStyle(feature);

        if (!isStationVisible(feature)) return group;
        
        const hitCircle = L.circleMarker(latlng, {
            pane: "railwayPane",
            radius: Math.max((stStyle.radius || 5) + 10, 16),
            color: "rgba(0,0,0,0)",
            fillColor: "rgba(0,0,0,0)",
            weight: 0,
            fillOpacity: 0.001,
            interactive: true
        });

        const displayCircle = L.circleMarker(latlng, {
            pane: "railwayPane",
            radius: stStyle.radius || 5,
            fillColor: stStyle.fillColor || "#1e293b",
            color: stStyle.color || "#ffffff",
            weight: stStyle.weight !== undefined ? stStyle.weight : 2,
            opacity: stStyle.opacity || 0.95,
            fillOpacity: stStyle.opacity || 0.95,
            interactive: false
        });

        group.addLayer(hitCircle);
        group.addLayer(displayCircle);
        group.displayTarget = displayCircle;
        group.feature = feature;

        bindTargetEvents(hitCircle, feature, displayCircle);

        return group;
    }

    const features = state.boundaryGeoJsons.railway.features || [];

    features.forEach(feature => {
        const props = feature.properties || {};
        const geom = feature.geometry;
        if (!geom) return;

        const isStation = Boolean(getStationName(props));
        const isLineGeom = geom.type === "LineString" || geom.type === "MultiLineString";

        if (!isStation && isLineGeom) {
            const group = L.layerGroup();
            const baseStyle = getRailwayFeatureStyle(feature);
            const lineKey = getLineKey(props);

            const lineCustom = lineKey ? state.railwayColorState[lineKey] : null;
            const coloredHex = lineCustom ? (typeof lineCustom === 'string' ? lineCustom : lineCustom.color) : null;
            const isSelected = Boolean(coloredHex);

            const hitLine = L.geoJSON(feature, {
                pane: "railwayPane",
                style: {
                    color: "#000000",
                    weight: Math.max((state.railwayConfig.line.weight || 2.0) + 20, 30),
                    opacity: 0.001,
                    lineCap: "round",
                    lineJoin: "round",
                    interactive: true
                }
            });

            const displayLine = L.geoJSON(feature, {
                pane: "railwayPane",
                style: {
                    ...baseStyle,
                    color: isSelected ? coloredHex : baseStyle.color,
                    weight: isSelected ? (state.railwayConfig.line.weight || 2.0) + 2.0 : baseStyle.weight,
                    opacity: isSelected ? 1.0 : baseStyle.opacity,
                    interactive: false
                }
            });

            group.addLayer(hitLine);
            group.addLayer(displayLine);
            group.displayTarget = displayLine;
            group.feature = feature;

            hitLine.eachLayer(layer => {
                bindTargetEvents(layer, feature, displayLine);
            });

            lineLayerGroup.addLayer(group);
        }
    });

    features.forEach(feature => {
        const props = feature.properties || {};
        const geom = feature.geometry;
        if (!geom) return;

        const isStation = Boolean(getStationName(props));

        if (isStation && geom.type === "Point") {
            const latlng = L.latLng(geom.coordinates[1], geom.coordinates[0]);
            const stGroup = createStationGroup(latlng, feature);
            stationLayerGroup.addLayer(stGroup);
        }
    });

    features.forEach(f => {
        const isStation = Boolean(getStationName(f.properties));
        const isLineGeom = f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString";

        if (isStation && isLineGeom) {
            const center = getCenterLatLng(f.geometry.coordinates);
            if (center[0] !== 0 && center[1] !== 0) {
                const stGroup = createStationGroup(L.latLng(center[0], center[1]), f);
                stationLayerGroup.addLayer(stGroup);
            }
        }
    });

    state.boundaryLayers.railway.addLayer(lineLayerGroup);
    state.boundaryLayers.railway.addLayer(stationLayerGroup);
    state.boundaryLayers.railway.addTo(state.map);
}

function updateLineHighlight(targetLineKey, isHover) {
    if (!state.boundaryLayers.railway || !targetLineKey) return;

    const lineCustom = state.railwayColorState[targetLineKey];
    const coloredHex = lineCustom ? (typeof lineCustom === 'string' ? lineCustom : lineCustom.color) : null;

    state.boundaryLayers.railway.eachLayer(layerOrGroup => {
        const processGroup = (group) => {
            const feat = group.feature;
            if (!feat) return;
            const lProps = feat.properties || {};
            const lLineKey = getLineKey(lProps);
            const isPt = feat.geometry?.type === "Point" || Boolean(getStationName(lProps));

            if (lLineKey && lLineKey === targetLineKey && !isPt) {
                const target = group.displayTarget;
                if (target && target.setStyle) {
                    const baseStyle = getRailwayFeatureStyle(feat);
                    if (coloredHex) {
                        target.setStyle({
                            color: coloredHex,
                            weight: (state.railwayConfig.line.weight || 2.0) + (isHover ? 3.0 : 2.0),
                            opacity: 1.0
                        });
                    } else if (isHover) {
                        target.setStyle({
                            color: "#ef4444",
                            weight: (state.railwayConfig.line.weight || 2.0) + 3.0,
                            opacity: 1.0
                        });
                    } else {
                        target.setStyle(baseStyle);
                    }
                }
            }
        };

        if (layerOrGroup.eachLayer) {
            layerOrGroup.eachLayer(subGroup => {
                if (subGroup.feature) processGroup(subGroup);
                else if (subGroup.eachLayer) subGroup.eachLayer(processGroup);
            });
        }
    });
}

function updateStationHighlight(targetStationKey, isHover) {
    if (!state.boundaryLayers.railway || !targetStationKey) return;

    state.boundaryLayers.railway.eachLayer(layerOrGroup => {
        const processGroup = (group) => {
            const feat = group.feature;
            if (!feat) return;
            const stProps = feat.properties || {};
            const stKey = getStationKey(stProps);

            if (stKey && stKey === targetStationKey) {
                const target = group.displayTarget;
                if (target && target.setStyle) {
                    const baseStyle = getRailwayFeatureStyle(feat);
                    if (isHover) {
                        target.setStyle({
                            fillColor: "#ef4444",
                            color: "#ffffff",
                            weight: (baseStyle.weight || 2) + 1,
                            fillOpacity: 1.0
                        });
                    } else {
                        target.setStyle(baseStyle);
                    }
                }
            }
        };

        if (layerOrGroup.eachLayer) {
            layerOrGroup.eachLayer(subGroup => {
                if (subGroup.feature) processGroup(subGroup);
                else if (subGroup.eachLayer) subGroup.eachLayer(processGroup);
            });
        }
    });
}

function renderRailwayControlPanel() {
    let container = document.getElementById("railwaySelectedControlCard");
    const parent = document.getElementById("tabContentRailway");
    if (!parent) return;

    if (!container) {
        container = document.createElement("div");
        container.id = "railwaySelectedControlCard";
        container.className = "mb-4 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3";
        parent.insertBefore(container, parent.firstChild);
    }

    if (!state.currentSelectedLineFeature && !state.currentSelectedStationFeature) {
        container.innerHTML = `
            <div class="text-xs text-slate-500 text-center py-2">
                地図上の路線や駅をクリックすると、ここに詳細情報とカスタマイズパネルが表示されます。
            </div>
        `;
    } else {
        let html = "";

        if (state.currentSelectedStationFeature) {
            const props = state.currentSelectedStationFeature.properties || {};
            const stationName = getStationName(props) || "駅名不明";
            const lineName = getLineName(props) || "路線名不明";
            const companyName = getLineCompany(props) || "事業者不明";
            const stKey = getStationKey(props);
            const lineKey = getLineKey(props);
            
            const defaultSt = state.railwayConfig.station;
            const currentCustom = state.stationColorState[stKey] || {};
            
            const hasFillCustom = currentCustom.color !== undefined;
            const hasStrokeCustom = currentCustom.strokeColor !== undefined;
            const hasRadiusCustom = currentCustom.radius !== undefined;
            const hasShowCustom = currentCustom.show !== undefined;
            const hasAnyCustom = hasFillCustom || hasStrokeCustom || hasRadiusCustom || hasShowCustom;

            const fillColor = currentCustom.color || defaultSt.color || "#1e293b";
            const strokeColor = currentCustom.strokeColor || defaultSt.strokeColor || "#ffffff";
            const radius = currentCustom.radius !== undefined ? currentCustom.radius : (defaultSt.radius || 5);

            const lineCustom = lineKey ? state.railwayColorState[lineKey] : null;
            const inheritedShow = (lineCustom && lineCustom.showStations !== undefined) 
                ? lineCustom.showStations 
                : (defaultSt.show !== false);

            const isCurrentlyShown = currentCustom.show !== undefined ? currentCustom.show : inheritedShow;

            html += `
                <div class="p-2.5 bg-white border border-indigo-100 rounded-lg shadow-xs space-y-2.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span class="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-indigo-600"></i> 選択中の駅
                        </span>
                        <button type="button" id="btnCloseStationDetail" class="text-slate-400 hover:text-slate-600 p-0.5" title="閉じる">
                            <i data-lucide="x" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                    <div>
                        <div class="text-[10px] font-semibold text-slate-400">${companyName} ・ ${lineName}</div>
                        <div class="text-sm font-bold text-slate-800">${stationName}駅</div>
                    </div>

                    <div class="space-y-2 pt-1 border-t border-slate-100">
                        <div class="flex items-center justify-between">
                            <span class="text-[11px] font-medium text-slate-600">この駅を表示</span>
                            <div class="flex items-center gap-1.5">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="chkSelectedStationShow" class="sr-only peer" ${isCurrentlyShown ? 'checked' : ''}>
                                    <div class="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                                <button type="button" id="btnClearStationShow" class="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded font-semibold transition ${hasShowCustom ? '' : 'opacity-60 cursor-default'}">
                                    リセット
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center justify-between">
                            <span class="text-[11px] font-medium text-slate-600">塗り色</span>
                            <div class="flex items-center gap-1.5">
                                <input type="color" id="inputSelectedStationColor" value="${fillColor}" class="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0 bg-transparent">
                                <button type="button" id="btnClearStationFillColor" class="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded font-semibold transition ${hasFillCustom ? '' : 'opacity-60 cursor-default'}">
                                    リセット
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center justify-between">
                            <span class="text-[11px] font-medium text-slate-600">枠線色</span>
                            <div class="flex items-center gap-1.5">
                                <input type="color" id="inputSelectedStationStrokeColor" value="${strokeColor}" class="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0 bg-transparent">
                                <button type="button" id="btnClearStationStrokeColor" class="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded font-semibold transition ${hasStrokeCustom ? '' : 'opacity-60 cursor-default'}">
                                    リセット
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[11px] font-medium text-slate-600 shrink-0">サイズ</span>
                            <div class="flex items-center gap-1.5 grow justify-end">
                                <input type="range" id="rangeSelectedStationRadius" min="2" max="15" value="${radius}" class="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer">
                                <span class="text-[11px] font-bold text-slate-700 w-3 text-right" id="valSelectedStationRadius">${radius}</span>
                                <button type="button" id="btnClearStationRadius" class="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded font-semibold transition shrink-0 ${hasRadiusCustom ? '' : 'opacity-60 cursor-default'}">
                                    リセット
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="pt-1.5 border-t border-slate-100 text-right">
                        <button type="button" id="btnClearSelectedStationAll" class="w-full py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] rounded font-semibold transition ${hasAnyCustom ? '' : 'opacity-50 cursor-not-allowed'}" ${hasAnyCustom ? '' : 'disabled'}>
                            駅設定をすべて初期化
                        </button>
                    </div>
                </div>
            `;
        }

        if (state.currentSelectedLineFeature) {
            const props = state.currentSelectedLineFeature.properties || {};
            const lineName = getLineName(props) || "路線名不明";
            const companyName = getLineCompany(props) || "事業者不明";
            const lineKey = getLineKey(props);
            
            const lineCustom = state.railwayColorState[lineKey] || {};
            const currentColor = (typeof lineCustom === 'string' ? lineCustom : lineCustom.color) || state.railwayConfig.line.color || "#334155";
            const hasCustomColor = (typeof lineCustom === 'string' ? true : lineCustom.color !== undefined);
            
            const hasShowStationsCustom = lineCustom.showStations !== undefined;
            const isShowStations = hasShowStationsCustom ? lineCustom.showStations : (state.railwayConfig.station.show !== false);

            html += `
                <div class="p-2.5 bg-white border border-indigo-100 rounded-lg shadow-xs space-y-2">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span class="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                            <i data-lucide="train" class="w-3.5 h-3.5 text-indigo-600"></i> 選択中の路線
                        </span>
                        <button type="button" id="btnCloseLineDetail" class="text-slate-400 hover:text-slate-600 p-0.5" title="閉じる">
                            <i data-lucide="x" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                    <div>
                        <div class="text-[10px] font-semibold text-slate-400">${companyName}</div>
                        <div class="text-sm font-bold text-slate-800">${lineName}</div>
                    </div>

                    <div class="space-y-2 pt-1 border-t border-slate-100">
                        <div class="flex items-center justify-between gap-2">
                            <label class="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                                <span>路線の色</span>
                            </label>
                            <div class="flex items-center gap-2">
                                <input type="color" id="inputSelectedLineColor" value="${currentColor}" class="w-7 h-7 rounded cursor-pointer border border-slate-300 p-0 bg-transparent">
                                <button type="button" id="btnClearSelectedLineColor" class="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded font-semibold transition ${hasCustomColor ? '' : 'opacity-60 cursor-default'}">
                                    リセット
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center justify-between">
                            <span class="text-xs font-medium text-slate-700">所属駅を表示</span>
                            <div class="flex items-center gap-2">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="chkSelectedLineShowStations" class="sr-only peer" ${isShowStations ? 'checked' : ''}>
                                    <div class="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                                <button type="button" id="btnClearSelectedLineShowStations" class="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded font-semibold transition ${hasShowStationsCustom ? '' : 'opacity-60 cursor-default'}">
                                    リセット
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    let globalResetCard = document.getElementById("railwayGlobalResetCard");
    if (!globalResetCard) {
        globalResetCard = document.createElement("div");
        globalResetCard.id = "railwayGlobalResetCard";
        globalResetCard.className = "mt-5 pt-3 border-t border-slate-200";
        parent.appendChild(globalResetCard);
    }

    const stCustomCount = Object.keys(state.stationColorState).length;
    const lnCustomCount = Object.keys(state.railwayColorState).length;
    const totalCustomCount = stCustomCount + lnCustomCount;

    globalResetCard.innerHTML = `
        <button type="button" id="btnClearAllRailwayCustom" class="w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
            totalCustomCount > 0 
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-sm cursor-pointer' 
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'
        }" ${totalCustomCount > 0 ? '' : 'disabled'}>
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            駅・路線の個別設定をすべてリセット ${totalCustomCount > 0 ? `(${totalCustomCount}件)` : ''}
        </button>
    `;

    lucide.createIcons();

    if (state.currentSelectedStationFeature) {
        const props = state.currentSelectedStationFeature.properties || {};
        const stKey = getStationKey(props);

        document.getElementById("btnCloseStationDetail")?.addEventListener("click", () => {
            state.currentSelectedStationFeature = null;
            renderRailwayControlPanel();
        });

        const updateStationCustomProp = async (prop, val) => {
            if (!state.stationColorState[stKey]) state.stationColorState[stKey] = {};
            state.stationColorState[stKey][prop] = val;
            saveToLocalStorage();
            await renderRailwayLayer();
            renderRailwayControlPanel();
        };

        const clearStationCustomProp = async (prop) => {
            if (state.stationColorState[stKey]) {
                delete state.stationColorState[stKey][prop];
                if (Object.keys(state.stationColorState[stKey]).length === 0) {
                    delete state.stationColorState[stKey];
                }
            }
            saveToLocalStorage();
            await renderRailwayLayer();
            renderRailwayControlPanel();
        };

        document.getElementById("chkSelectedStationShow")?.addEventListener("change", (e) => {
            updateStationCustomProp("show", e.target.checked);
        });
        document.getElementById("btnClearStationShow")?.addEventListener("click", () => clearStationCustomProp("show"));

        document.getElementById("inputSelectedStationColor")?.addEventListener("input", (e) => updateStationCustomProp("color", e.target.value));
        document.getElementById("inputSelectedStationStrokeColor")?.addEventListener("input", (e) => updateStationCustomProp("strokeColor", e.target.value));
        document.getElementById("rangeSelectedStationRadius")?.addEventListener("input", (e) => updateStationCustomProp("radius", parseInt(e.target.value, 10)));

        document.getElementById("btnClearStationFillColor")?.addEventListener("click", () => clearStationCustomProp("color"));
        document.getElementById("btnClearStationStrokeColor")?.addEventListener("click", () => clearStationCustomProp("strokeColor"));
        document.getElementById("btnClearStationRadius")?.addEventListener("click", () => clearStationCustomProp("radius"));

        document.getElementById("btnClearSelectedStationAll")?.addEventListener("click", async () => {
            delete state.stationColorState[stKey];
            saveToLocalStorage();
            await renderRailwayLayer();
            renderRailwayControlPanel();
        });
    }

    if (state.currentSelectedLineFeature) {
        const props = state.currentSelectedLineFeature.properties || {};
        const lineKey = getLineKey(props);

        document.getElementById("btnCloseLineDetail")?.addEventListener("click", () => {
            state.currentSelectedLineFeature = null;
            renderRailwayControlPanel();
        });

        const updateLineProp = async (prop, val) => {
            let current = state.railwayColorState[lineKey];
            if (typeof current === 'string') {
                current = { color: current };
            } else if (!current) {
                current = {};
            }
            current[prop] = val;
            state.railwayColorState[lineKey] = current;
            saveToLocalStorage();
            await renderRailwayLayer();
            renderRailwayControlPanel();
        };

        const clearLineProp = async (prop) => {
            let current = state.railwayColorState[lineKey];
            if (current && typeof current === 'object') {
                delete current[prop];
                if (Object.keys(current).length === 0) {
                    delete state.railwayColorState[lineKey];
                }
            }
            saveToLocalStorage();
            await renderRailwayLayer();
            renderRailwayControlPanel();
        };

        document.getElementById("inputSelectedLineColor")?.addEventListener("input", (e) => updateLineProp("color", e.target.value));
        document.getElementById("btnClearSelectedLineColor")?.addEventListener("click", () => clearLineProp("color"));

        document.getElementById("chkSelectedLineShowStations")?.addEventListener("change", (e) => updateLineProp("showStations", e.target.checked));
        document.getElementById("btnClearSelectedLineShowStations")?.addEventListener("click", () => clearLineProp("showStations"));
    }

    document.getElementById("btnClearAllRailwayCustom")?.addEventListener("click", async () => {
        if (totalCustomCount === 0) return;
        
        state.stationColorState = {};
        state.railwayColorState = {};
        state.currentSelectedStationFeature = null;
        state.currentSelectedLineFeature = null;

        saveToLocalStorage();
        await renderRailwayLayer();
        renderRailwayControlPanel();
        showToast("駅・路線のすべての個別設定をリセットしました");
    });
}

function bindTargetEvents(targetLayer, feature, displayTarget) {
    const props = feature.properties || {};
    const stationName = getStationName(props);
    const lineName = getLineName(props);
    const lineKey = getLineKey(props);
    const stKey = getStationKey(props);
    const companyName = getLineCompany(props) || "鉄道事業者";

    const isStationFeature = displayTarget && (displayTarget instanceof L.CircleMarker || displayTarget.options?.radius !== undefined);

    targetLayer.on({
        mouseover: (e) => {
            if (isStationFeature) {
                if (displayTarget && displayTarget.setStyle && state.railwayConfig.station.show !== false) {
                    displayTarget.setStyle({
                        fillColor: "#ef4444",
                        color: "#ffffff",
                        weight: (state.railwayConfig.station.strokeWeight || 2) + 1,
                        fillOpacity: 1.0
                    });
                }
            } else {
                updateLineHighlight(lineKey, true);
            }

            const mainTitle = stationName ? `${stationName}駅（${lineName}）` : (lineName || "路線名不明");
            showHoverCard(true, companyName, mainTitle, "鉄道データ");
        },
        mouseout: (e) => {
            if (isStationFeature) {
                if (stKey) updateStationHighlight(stKey, false);
            } else {
                updateLineHighlight(lineKey, false);
            }
            showHoverCard(false);
        },
        click: (e) => {
            L.DomEvent.stopPropagation(e);
            switchTab("railway");

            if (isStationFeature && stKey) {
                state.currentSelectedStationFeature = feature;
                renderRailwayControlPanel();
                updateStationHighlight(stKey, false);
            } else if (lineKey) {
                state.currentSelectedLineFeature = feature;
                renderRailwayControlPanel();
                updateLineHighlight(lineKey, true);
            }
        }
    });
}

function handleCityClick(code) {
    if (state.activeTab === "railway") return;

    if (state.activeTool === "paint") state.colorState[code] = state.selectedColor;
    else delete state.colorState[code];

    state.geojsonLayer.eachLayer(layer => {
        const layerCode = state.mapMode === "pref" ? getFeaturePrefCode(layer.feature) : getCityCode(layer.feature.properties);
        if (layerCode === code) {
            layer.setStyle(featureStyle(layer.feature));
        }
    });

    saveToLocalStorage();
    updateUIStats();
}

function removeCityColor(code) {
    delete state.colorState[code];

    if (state.geojsonLayer) {
        state.geojsonLayer.eachLayer(layer => {
            const layerCode = state.mapMode === "pref" ? getFeaturePrefCode(layer.feature) : getCityCode(layer.feature.properties);
            if (layerCode === code) {
                layer.setStyle(featureStyle(layer.feature));
            }
        });
    }

    saveToLocalStorage();
    updateUIStats();
}

function applySampleCategoryColors() {
    if (!state.geojsonLayer) return;

    const SAMPLE_COLORS = {
        tokubetsuku: "#fecaca",
        seireishi: "#fbcfe8",
        shi: "#fed7aa",
        cho: "#bbf7d0",
        son: "#bae6fd"
    };

    state.colorState = {};

    state.geojsonLayer.eachLayer(layer => {
        const props = layer.feature.properties || {};
        const code = getCityCode(props);
        const prefCode = getFeaturePrefCode(layer.feature);

        const n03_003 = props.N03_003 ? String(props.N03_003) : "";
        const n03_004 = props.N03_004 ? String(props.N03_004) : "";
        const n03_005 = props.N03_005 ? String(props.N03_005) : "";

        let assignedColor = SAMPLE_COLORS.shi;

        if (prefCode === "13" && (n03_004.endsWith("区") && !n03_003.endsWith("市"))) {
            assignedColor = SAMPLE_COLORS.tokubetsuku;
        } else if (n03_005 !== "" || (n03_003.endsWith("市") && n03_004.endsWith("区"))) {
            assignedColor = SAMPLE_COLORS.seireishi;
        } else if (n03_004.endsWith("町")) {
            assignedColor = SAMPLE_COLORS.cho;
        } else if (n03_004.endsWith("村")) {
            assignedColor = SAMPLE_COLORS.son;
        } else if (n03_004.endsWith("市")) {
            assignedColor = SAMPLE_COLORS.shi;
        }

        state.colorState[code] = assignedColor;
    });

    refreshLayerStyles();
    saveToLocalStorage();
    updateUIStats();
    showToast("自治体区分サンプルデータを適用しました");
}

function fillAllCurrentPref() {
    Object.keys(state.currentCityMap).forEach(code => state.colorState[code] = state.selectedColor);
    refreshLayerStyles();
    saveToLocalStorage();
    updateUIStats();
    showToast(`${state.mapMode === "pref" ? "全国の都道府県" : getSelectedPrefLabel(state.selectedPrefCodes)}を表示エリア全塗りしました`);
}

function clearAllCurrentPref() {
    Object.keys(state.currentCityMap).forEach(code => delete state.colorState[code]);
    refreshLayerStyles();
    saveToLocalStorage();
    updateUIStats();
    showToast(`${state.mapMode === "pref" ? "全国の都道府県" : getSelectedPrefLabel(state.selectedPrefCodes)}の色塗りをクリアしました`);
}

function refreshLayerStyles() {
    if (!state.geojsonLayer) return;
    state.geojsonLayer.eachLayer(layer => layer.setStyle(featureStyle(layer.feature)));
}

function fitToCurrentBounds() {
    if (state.geojsonLayer && state.map) {
        state.map.fitBounds(state.geojsonLayer.getBounds(), { padding: [30, 30] });
    }
}

function updateUIStats() {
    const currentPrefNameEl = document.getElementById("currentPrefName");
    if (currentPrefNameEl) {
        currentPrefNameEl.textContent = state.mapMode === "pref" ? "全国（都道府県版）" : getSelectedPrefLabel(state.selectedPrefCodes);
    }

    let allCodes = [];
    if (state.mapMode === "pref") {
        allCodes = PREFECTURES.map(p => p.code);
    } else {
        allCodes = Object.keys(state.currentCityMap);
    }

    const total = allCodes.length;
    const coloredCodes = allCodes.filter(code => state.colorState[code]);
    const count = coloredCodes.length;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

    const coloredCountEl = document.getElementById("coloredCount");
    const totalCountEl = document.getElementById("totalCount");
    const progressPercentEl = document.getElementById("progressPercent");
    const progressBarEl = document.getElementById("progressBar");
    const coloredBadgeEl = document.getElementById("coloredBadge");

    if (coloredCountEl) coloredCountEl.textContent = count;
    if (totalCountEl) totalCountEl.textContent = total;
    if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
    if (progressBarEl) progressBarEl.style.width = `${percent}%`;
    if (coloredBadgeEl) coloredBadgeEl.textContent = `${count}件`;

    const listEl = document.getElementById("coloredCityList");
    if (!listEl) return;

    if (count === 0) {
        listEl.innerHTML = `<div class="text-slate-400 text-center py-6 text-xs">まだ塗りつぶされた地域はありません</div>`;
        return;
    }

    const isMultiOrNational = state.mapMode === "city" && (state.selectedPrefCodes.includes("ALL") || state.selectedPrefCodes.length > 1);

    listEl.innerHTML = coloredCodes.map(code => {
        const name = state.mapMode === "pref" ? getPrefName(code) : (state.currentCityMap[code]?.name || code);
        const prefName = state.mapMode === "pref" ? "" : state.currentCityMap[code]?.prefName;
        const color = state.colorState[code];
        return `
            <div class="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition">
                <div class="flex items-center gap-2 overflow-hidden">
                    <span class="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs shrink-0" style="background-color: ${color}"></span>
                    <span class="font-medium text-slate-700 truncate">
                        ${isMultiOrNational && prefName ? `<span class="text-slate-400 text-[10px] mr-1">[${prefName}]</span>` : ''}${name}
                    </span>
                </div>
                <button type="button" data-delete-code="${code}" class="text-slate-400 hover:text-rose-500 p-1 transition shrink-0 cursor-pointer" title="消去">
                    <i data-lucide="x" class="w-3.5 h-3.5 pointer-events-none"></i>
                </button>
            </div>
        `;
    }).join("");

    lucide.createIcons();
}

function importStateJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data && data.colorState) {
                if (data.mapMode) state.mapMode = data.mapMode;
                state.colorState = { ...state.colorState, ...data.colorState };
                if (data.railwayColorState) state.railwayColorState = data.railwayColorState;
                if (data.stationColorState) state.stationColorState = data.stationColorState;
                if (data.defaultLandColor) state.defaultLandColor = data.defaultLandColor;
                if (data.enableLandOpacity !== undefined) state.enableLandOpacity = data.enableLandOpacity;
                if (data.defaultLandOpacity !== undefined) state.defaultLandOpacity = parseFloat(data.defaultLandOpacity);
                if (data.mapBgColor) state.mapBgColor = data.mapBgColor;
                if (data.showBaseMap !== undefined) state.showBaseMap = data.showBaseMap;
                if (data.selectedTileType) state.selectedTileType = data.selectedTileType;
                if (data.customColors) state.customColors = data.customColors;
                if (data.railwayConfig) {
                    state.railwayConfig = {
                        ...state.railwayConfig,
                        ...data.railwayConfig,
                        line: { ...state.railwayConfig.line, ...(data.railwayConfig.line || {}) },
                        station: { ...state.railwayConfig.station, ...(data.railwayConfig.station || {}) }
                    };
                }

                updateModeUI();
                initBoundaryUIValues();
                renderCustomPalette();
                updateTileLayer(state.selectedTileType);
                refreshLayerStyles();
                await renderRailwayLayer();
                renderRailwayControlPanel();
                saveToLocalStorage();
                updateUIStats();
                showToast("JSONから復元しました");
            } else throw new Error("無効なJSON");
        } catch (err) {
            showToast("ファイルの読み込みに失敗しました", "error");
        }
    };
    reader.readAsText(file);
    e.target.value = "";
}
