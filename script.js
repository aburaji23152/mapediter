// 定数データ定義
const REGIONS = [
    { id: "hokkaido-tohoku", name: "北海道・東北", codes: ["01", "02", "03", "04", "05", "06", "07"] },
    { id: "kanto", name: "関東", codes: ["08", "09", "10", "11", "12", "13", "14"] },
    { id: "chubu", name: "中部", codes: ["15", "16", "17", "18", "19", "20", "21", "22", "23"] },
    { id: "kinki", name: "近畿", codes: ["24", "25", "26", "27", "28", "29", "30"] },
    { id: "chugoku-shikoku", name: "中国・四国", codes: ["31", "32", "33", "34", "35", "36", "37", "38", "39"] },
    { id: "kyushu-okinawa", name: "九州・沖縄", codes: ["40", "41", "42", "43", "44", "45", "46", "47"] }
];

const PREFECTURES = [
    { code: "01", name: "北海道" }, { code: "02", name: "青森県" }, { code: "03", name: "岩手県" },
    { code: "04", name: "宮城県" }, { code: "05", name: "秋田県" }, { code: "06", name: "山形県" },
    { code: "07", name: "福島県" }, { code: "08", name: "茨城県" }, { code: "09", name: "栃木県" },
    { code: "10", name: "群馬県" }, { code: "11", name: "埼玉県" }, { code: "12", name: "千葉県" },
    { code: "13", name: "東京都" }, { code: "14", name: "神奈川県" }, { code: "15", name: "新潟県" },
    { code: "16", name: "富山県" }, { code: "17", name: "石川県" }, { code: "18", name: "福井県" },
    { code: "19", name: "山梨県" }, { code: "20", name: "長野県" }, { code: "21", name: "岐阜県" },
    { code: "22", name: "静岡県" }, { code: "23", name: "愛知県" }, { code: "24", name: "三重県" },
    { code: "25", name: "滋賀県" }, { code: "26", name: "京都府" }, { code: "27", name: "大阪府" },
    { code: "28", name: "兵庫県" }, { code: "29", name: "奈良県" }, { code: "30", name: "和歌山県" },
    { code: "31", name: "鳥取県" }, { code: "32", name: "島根県" }, { code: "33", name: "岡山県" },
    { code: "34", name: "広島県" }, { code: "35", name: "山口県" }, { code: "36", name: "徳島県" },
    { code: "37", name: "香川県" }, { code: "38", name: "愛媛県" }, { code: "39", name: "高知県" },
    { code: "40", name: "福岡県" }, { code: "41", name: "佐賀県" }, { code: "42", name: "長崎県" },
    { code: "43", name: "熊本県" }, { code: "44", name: "大分県" }, { code: "45", name: "宮崎県" },
    { code: "46", name: "鹿児島県" }, { code: "47", name: "沖縄県" }
];

const BASE_COLORS = [
    "#bfdbfe", "#fca5a5", "#86efac", "#fde047", "#d8b4fe", "#f9a8d4",
    "#a5f3fc", "#fdba74", "#bef264", "#c7d2fe", "#99f6e4", "#cbd5e1",
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
    "#06b6d4", "#f97316", "#84cc16", "#6366f1", "#14b8a6", "#64748b"
];

let customColors = [
    "#e0e7ff", "#ffe4e6", "#dcfce7", "#fef9c3", "#f3e8ff", "#fce7f3",
    "#cffafe", "#ffedd5", "#ecfccb", "#e0e7ff", "#ccfbf1", "#f1f5f9"
];

const TILE_LAYERS = {
    pale: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    std: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
};

const LANDLOCKED_PREFS = new Set(["09", "10", "11", "19", "20", "21", "25", "29"]);

// --- アプリケーション状態 ---
let mapMode = "city"; 
let pendingMapMode = null;
let activeTab = "paint"; // "paint" | "railway"

let map = null;
let currentTileLayer = null;
let selectedTileType = "pale";
let showBaseMap = true;
let geojsonLayer = null;
let currentGeoJsonData = null;
let selectedPrefCodes = ["ALL"];
let tempSelectedCodes = ["ALL"];
let activeTool = "paint";
let selectedColor = BASE_COLORS[0];

let colorState = {};
let currentCityMap = {};
let nationalFeaturesCache = null;
let railwayGeoJsonCache = null;

let defaultLandColor = "#ffffff";
let enableLandOpacity = false;
let defaultLandOpacity = 0.45;
let bgImageDataUrl = null;
let mapBgColor = "#f1f5f9";

// 境界線 カスタマイズ状態
let boundarySettings = {
    coast: { show: true, color: "#1e293b", weight: 2.0, style: "solid" },
    pref: { show: true, color: "#0f172a", weight: 2.5, style: "solid" },
    city: { show: true, color: "#475569", weight: 1.0, style: "solid" },
    county: { show: true, color: "#64748b", weight: 1.0, style: "dotted" },
    ward: { show: true, color: "#64748b", weight: 1.0, style: "dashed" }
};

// 独立した路線図（鉄道）設定
let railwayConfig = {
    show: false,
    defaultStyle: {
        color: "#334155",
        weight: 1.5,
        style: "solid",
        opacity: 0.95
    },
    lineStyles: {},
    segmentStyles: {}
};

let boundaryGeoJsons = { coast: null, pref: null, city: null, county: null, ward: null, railway: null };
let boundaryLayers = { coast: null, pref: null, city: null, county: null, ward: null, railway: null };

let includeIslands = { "13": true, "46": true, "47": true };
let tempIncludeIslands = { ...includeIslands };

const STORAGE_KEY_MAP_MODE = "japan_map_mode_v1";
const STORAGE_KEY_COLOR_STATE = "japan_map_color_state_v1";
const STORAGE_KEY_SELECTED_PREFS = "japan_map_selected_prefs_v1";
const STORAGE_KEY_ISLANDS = "japan_map_include_islands_v1";
const STORAGE_KEY_BOUNDARIES = "japan_map_boundaries_v1";
const STORAGE_KEY_RAILWAY_CONFIG = "japan_map_railway_config_v1";
const STORAGE_KEY_BGCOLOR = "japan_map_bgcolor_v1";
const STORAGE_KEY_LANDCOLOR = "japan_map_landcolor_v1";
const STORAGE_KEY_ENABLE_OPACITY = "japan_map_enable_opacity_v1";
const STORAGE_KEY_LANDOPACITY = "japan_map_landopacity_v1";
const STORAGE_KEY_BGIMAGE = "japan_map_bgimage_v1";
const STORAGE_KEY_SHOW_BASEMAP = "japan_map_show_basemap_v1";
const STORAGE_KEY_TILE_TYPE = "japan_map_tile_type_v1";
const STORAGE_KEY_CUSTOM_COLORS = "japan_map_custom_colors_v1";

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
    lucide.createIcons();

    if (railwayConfig.show) {
        await renderRailwayLayer();
    }

    loadPrefectureData(selectedPrefCodes);
};

let deferredPrompt = null;
let isRefreshing = false;

// --- タブ切り替えの制御 ---
function initTabUI() {
    const btnTabPaint = document.getElementById("btnTabPaint");
    const btnTabRailway = document.getElementById("btnTabRailway");

    if (btnTabPaint) {
        btnTabPaint.addEventListener("click", () => switchTab("paint"));
    }
    if (btnTabRailway) {
        btnTabRailway.addEventListener("click", () => switchTab("railway"));
    }

    switchTab("paint");
}

function switchTab(targetTab) {
    activeTab = targetTab;
    showHoverCard(false);

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
            if (isRefreshing) return;
            isRefreshing = true;
            window.location.reload();
        });
    }

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById("btnInstallPwa")?.classList.remove("hidden");
    });

    document.getElementById("btnInstallPwa")?.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") showToast("アプリがホーム画面に追加されました！");
        deferredPrompt = null;
        document.getElementById("btnInstallPwa").classList.add("hidden");
    });
}

function getFeaturePrefCode(feature) {
    const props = feature.properties || {};
    if (props.N03_007) {
        const raw = String(props.N03_007).trim();
        const padded = raw.length < 5 && !isNaN(raw) ? raw.padStart(5, "0") : raw;
        if (padded.length >= 2) return padded.substring(0, 2);
    }
    if (props.N03_001) {
        const pref = PREFECTURES.find(p => p.name === props.N03_001);
        if (pref) return pref.code;
    }
    return "";
}

// 修正：国土数値情報の鉄道駅データ (N02-25_Station.geojson) を読み込む設定に変更
async function fetchRailwayData() {
    if (railwayGeoJsonCache) return railwayGeoJsonCache;

    try {
        console.log("鉄道駅データ (N02-25_Station.geojson) の取得中...");
        const res = await fetch("./rail_data/N02-25_Station.geojson");

        if (!res.ok) throw new Error(`HTTPエラー status: ${res.status}`);

        const data = await res.json();
        railwayGeoJsonCache = data;
        console.log("鉄道駅データの読み込み完了");
        return railwayGeoJsonCache;

    } catch (e) {
        console.warn("鉄道データ取得エラー:", e);
        showToast("鉄道データの取得に失敗しました", "error");
        return null;
    }
}

// 修正：N02-25属性キー（N02_003:路線名）への対応
function getRailwayFeatureStyle(feature) {
    if (!railwayConfig.show) {
        return { opacity: 0, weight: 0 };
    }

    const props = feature.properties || {};
    const lineName = props.N02_003 || props.line_name || props.line || props.name;
    const segmentId = props.segment_id || (props.from && props.to ? `${props.from}-${props.to}` : null);

    let currentStyle = { ...railwayConfig.defaultStyle };

    if (segmentId && railwayConfig.segmentStyles[segmentId]) {
        currentStyle = { ...currentStyle, ...railwayConfig.segmentStyles[segmentId] };
    } else if (lineName && railwayConfig.lineStyles[lineName]) {
        currentStyle = { ...currentStyle, ...railwayConfig.lineStyles[lineName] };
    } else if (props.color || props.weight) {
        if (props.color) currentStyle.color = props.color;
        if (props.weight) currentStyle.weight = parseFloat(props.weight);
        if (props.style) currentStyle.style = props.style;
    }

    let dashArray = null;
    if (currentStyle.style === "dashed") dashArray = "6, 4";
    else if (currentStyle.style === "dotted") dashArray = "2, 3";

    return {
        color: currentStyle.color,
        weight: currentStyle.weight,
        dashArray: dashArray,
        opacity: currentStyle.opacity,
        lineCap: "round",
        lineJoin: "round",
        interactive: true
    };
}

async function loadPrefectureData(codes) {
    showLoading(true, "GeoJSON境界データを読み込んでいます...");
    try {
        if (!nationalFeaturesCache) {
            const res = await fetch("https://raw.githubusercontent.com/smartnews-smri/japan-topography/main/data/municipality/geojson/s0010/N03-21_210101.json");
            if (!res.ok) throw new Error("全国データの取得に失敗しました");
            const data = await res.json();
            nationalFeaturesCache = data.features || [];
        }

        const isAll = mapMode === "pref" || codes.includes("ALL") || codes.length === 47;
        let displayFeatures = [];

        if (isAll) {
            displayFeatures = nationalFeaturesCache;
        } else {
            const selectedSet = new Set(codes);
            displayFeatures = nationalFeaturesCache.filter(feature => selectedSet.has(getFeaturePrefCode(feature)));
        }

        currentGeoJsonData = { type: "FeatureCollection", features: displayFeatures };

        renderGeoJson(currentGeoJsonData, nationalFeaturesCache);
        updateUIStats();
        showLoading(false);
    } catch (err) {
        console.error("データ取得エラー:", err);
        showLoading(false);
        showToast("境界データの取得に失敗しました。", "error");
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_MAP_MODE, mapMode);
        localStorage.setItem(STORAGE_KEY_COLOR_STATE, JSON.stringify(colorState));
        localStorage.setItem(STORAGE_KEY_SELECTED_PREFS, JSON.stringify(selectedPrefCodes));
        localStorage.setItem(STORAGE_KEY_ISLANDS, JSON.stringify(includeIslands));
        localStorage.setItem(STORAGE_KEY_BOUNDARIES, JSON.stringify(boundarySettings));
        localStorage.setItem(STORAGE_KEY_RAILWAY_CONFIG, JSON.stringify(railwayConfig));
        localStorage.setItem(STORAGE_KEY_BGCOLOR, mapBgColor);
        localStorage.setItem(STORAGE_KEY_LANDCOLOR, defaultLandColor);
        localStorage.setItem(STORAGE_KEY_ENABLE_OPACITY, JSON.stringify(enableLandOpacity));
        localStorage.setItem(STORAGE_KEY_LANDOPACITY, defaultLandOpacity);
        localStorage.setItem(STORAGE_KEY_SHOW_BASEMAP, JSON.stringify(showBaseMap));
        localStorage.setItem(STORAGE_KEY_TILE_TYPE, selectedTileType);
        localStorage.setItem(STORAGE_KEY_CUSTOM_COLORS, JSON.stringify(customColors));
        if (bgImageDataUrl) localStorage.setItem(STORAGE_KEY_BGIMAGE, bgImageDataUrl);
        else localStorage.removeItem(STORAGE_KEY_BGIMAGE);
    } catch (e) {
        console.warn("LocalStorage 保存エラー:", e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedMode = localStorage.getItem(STORAGE_KEY_MAP_MODE);
        const savedState = localStorage.getItem(STORAGE_KEY_COLOR_STATE);
        const savedPrefs = localStorage.getItem(STORAGE_KEY_SELECTED_PREFS);
        const savedIslands = localStorage.getItem(STORAGE_KEY_ISLANDS);
        const savedBoundaries = localStorage.getItem(STORAGE_KEY_BOUNDARIES);
        const savedRailway = localStorage.getItem(STORAGE_KEY_RAILWAY_CONFIG);
        const savedBgColor = localStorage.getItem(STORAGE_KEY_BGCOLOR);
        const savedLandColor = localStorage.getItem(STORAGE_KEY_LANDCOLOR);
        const savedEnableOpacity = localStorage.getItem(STORAGE_KEY_ENABLE_OPACITY);
        const savedLandOpacity = localStorage.getItem(STORAGE_KEY_LANDOPACITY);
        const savedBgImage = localStorage.getItem(STORAGE_KEY_BGIMAGE);
        const savedShowBaseMap = localStorage.getItem(STORAGE_KEY_SHOW_BASEMAP);
        const savedTileType = localStorage.getItem(STORAGE_KEY_TILE_TYPE);
        const savedCustomColors = localStorage.getItem(STORAGE_KEY_CUSTOM_COLORS);

        if (savedMode) mapMode = savedMode;
        if (savedState) colorState = JSON.parse(savedState) || {};
        if (savedPrefs) selectedPrefCodes = JSON.parse(savedPrefs) || ["ALL"];
        if (savedIslands) includeIslands = { ...includeIslands, ...JSON.parse(savedIslands) };
        if (savedBoundaries) boundarySettings = { ...boundarySettings, ...JSON.parse(savedBoundaries) };
        if (savedRailway) railwayConfig = { ...railwayConfig, ...JSON.parse(savedRailway) };
        if (savedBgColor) mapBgColor = savedBgColor;
        if (savedLandColor) defaultLandColor = savedLandColor;
        if (savedEnableOpacity !== null) enableLandOpacity = JSON.parse(savedEnableOpacity);
        if (savedLandOpacity !== null) defaultLandOpacity = parseFloat(savedLandOpacity);
        if (savedBgImage) bgImageDataUrl = savedBgImage;
        if (savedShowBaseMap !== null) showBaseMap = JSON.parse(savedShowBaseMap);
        if (savedTileType) selectedTileType = savedTileType;
        if (savedCustomColors) customColors = JSON.parse(savedCustomColors);
    } catch (e) {
        console.warn("LocalStorage 読み込みエラー:", e);
    }
}

function initBoundaryUIValues() {
    const bgColorPicker = document.getElementById("bgColorPicker");
    if (bgColorPicker) {
        bgColorPicker.value = mapBgColor;
        applyMapBgColor(mapBgColor);
    }

    const landColorPicker = document.getElementById("landColorPicker");
    if (landColorPicker) landColorPicker.value = defaultLandColor;

    const chkShowBaseMap = document.getElementById("chkShowBaseMap");
    if (chkShowBaseMap) chkShowBaseMap.checked = showBaseMap;

    const chkOpacity = document.getElementById("chkEnableOpacity");
    if (chkOpacity) chkOpacity.checked = enableLandOpacity;

    const rangeOpacity = document.getElementById("landOpacityRange");
    if (rangeOpacity) {
        rangeOpacity.value = defaultLandOpacity;
        rangeOpacity.disabled = !enableLandOpacity;
    }
    const landOpacityVal = document.getElementById("landOpacityVal");
    if (landOpacityVal) landOpacityVal.textContent = enableLandOpacity ? defaultLandOpacity : "1.00 (不透明)";

    updateTileButtonsUI(selectedTileType);

    if (bgImageDataUrl) {
        applyBgImage(bgImageDataUrl);
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
        if (chk && boundarySettings[item.type]) {
            chk.checked = boundarySettings[item.type].show;
            const colorEl = document.getElementById(item.color);
            if (colorEl) colorEl.value = boundarySettings[item.type].color;
            const weightEl = document.getElementById(item.weight);
            if (weightEl) weightEl.value = boundarySettings[item.type].weight;
            const styleEl = document.getElementById(item.style);
            if (styleEl) styleEl.value = boundarySettings[item.type].style;
        }
    });

    const chkRail = document.getElementById("chkRailwayBoundary");
    if (chkRail) {
        chkRail.checked = railwayConfig.show;
        const colorRail = document.getElementById("colorRailwayBoundary");
        if (colorRail) colorRail.value = railwayConfig.defaultStyle.color;
        const weightRail = document.getElementById("weightRailwayBoundary");
        if (weightRail) weightRail.value = railwayConfig.defaultStyle.weight;
        const styleRail = document.getElementById("styleRailwayBoundary");
        if (styleRail) styleRail.value = railwayConfig.defaultStyle.style;
    }
}

function applyMapBgColor(color) {
    mapBgColor = color;
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

function isIslandMunicipality(code, props = null) {
    const strCode = String(code).trim();
    const numCode = parseInt(strCode, 10);
    let propText = props ? Object.values(props).map(v => (v !== null && v !== undefined) ? String(v) : "").join(" ") : "";

    const isTokyo = strCode.startsWith("13") || propText.includes("東京都");
    if (isTokyo) {
        if (propText.includes("支庁") || (!isNaN(numCode) && numCode >= 13361 && numCode <= 13421)) return "13";
        const islandKeywords = ["大島", "利島", "新島", "神津島", "三宅", "御蔵島", "八丈", "青ヶ島", "小笠原", "父島", "母島", "硫黄島", "鳥島"];
        if (islandKeywords.some(k => propText.includes(k))) return "13";
        if (["13303", "13305", "13307", "13308"].includes(strCode)) return null;
        if (!isNaN(numCode) && numCode >= 13101 && numCode <= 13229) return null;
        return "13";
    }

    if (strCode === "46213" || strCode === "46222" || strCode === "46303" || strCode === "46304" || (!isNaN(numCode) && numCode >= 46500 && numCode <= 46599)) return "46";
    const okinawaIslands = ["47207", "47214", "47315", "47353", "47354", "47355", "47357", "47358", "47359", "47360", "47361", "47375", "47381", "47382"];
    if (okinawaIslands.includes(strCode)) return "47";

    return null;
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
                const allSelected = region.codes.every(c => tempSelectedCodes.includes(c));
                if (allSelected) tempSelectedCodes = tempSelectedCodes.filter(c => !region.codes.includes(c));
                else {
                    region.codes.forEach(c => { if (!tempSelectedCodes.includes(c)) tempSelectedCodes.push(c); });
                    tempSelectedCodes = tempSelectedCodes.filter(c => c !== "ALL");
                }
                syncCheckboxesFromTemp();
            }
        });
    });

    document.querySelectorAll("#regionButtons .region-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const reg = btn.getAttribute("data-region");
            if (reg === "ALL") tempSelectedCodes = ["ALL"];
            else if (reg === "CLEAR") tempSelectedCodes = [];
            else {
                const region = REGIONS.find(r => r.id === reg);
                if (region) tempSelectedCodes = [...region.codes];
            }
            syncCheckboxesFromTemp();
        });
    });

    document.getElementById("modalToggleIsland13")?.addEventListener("change", (e) => tempIncludeIslands["13"] = e.target.checked);
    document.getElementById("modalToggleIsland46")?.addEventListener("change", (e) => tempIncludeIslands["46"] = e.target.checked);
    document.getElementById("modalToggleIsland47")?.addEventListener("change", (e) => tempIncludeIslands["47"] = e.target.checked);

    document.getElementById("btnOpenPrefModal")?.addEventListener("click", openPrefModal);
    document.getElementById("btnClosePrefModal")?.addEventListener("click", closePrefModal);
    document.getElementById("btnCancelPrefModal")?.addEventListener("click", closePrefModal);
    
    document.getElementById("btnApplyPrefModal")?.addEventListener("click", () => {
        selectedPrefCodes = [...tempSelectedCodes];
        if (selectedPrefCodes.length === 0) selectedPrefCodes = ["ALL"];
        includeIslands = { ...tempIncludeIslands };
        closePrefModal();
        updateHeaderPrefButton();
        saveToLocalStorage();
        loadPrefectureData(selectedPrefCodes);
    });

    document.getElementById("btnModeCity")?.addEventListener("click", () => requestMapModeSwitch("city"));
    document.getElementById("btnModePref")?.addEventListener("click", () => requestMapModeSwitch("pref"));

    document.getElementById("btnCancelModeConfirm")?.addEventListener("click", () => {
        document.getElementById("modeConfirmModal")?.classList.add("hidden");
        pendingMapMode = null;
    });

    document.getElementById("btnApplyModeConfirm")?.addEventListener("click", () => {
        if (pendingMapMode) {
            mapMode = pendingMapMode;
            colorState = {};
            pendingMapMode = null;
            document.getElementById("modeConfirmModal")?.classList.add("hidden");
            updateModeUI();
            updateHeaderPrefButton();
            saveToLocalStorage();
            loadPrefectureData(selectedPrefCodes);
        }
    });
}

function requestMapModeSwitch(targetMode) {
    if (mapMode === targetMode) return;

    pendingMapMode = targetMode;
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

    if (mapMode === "pref") {
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
    tempSelectedCodes = [...selectedPrefCodes];
    tempIncludeIslands = { ...includeIslands };
    syncCheckboxesFromTemp();
    syncModalIslandTogglesFromTemp();
    document.getElementById("prefModal")?.classList.remove("hidden");
    lucide.createIcons();
}

function syncModalIslandTogglesFromTemp() {
    const t13 = document.getElementById("modalToggleIsland13");
    const t46 = document.getElementById("modalToggleIsland46");
    const t47 = document.getElementById("modalToggleIsland47");
    if (t13) t13.checked = tempIncludeIslands["13"];
    if (t46) t46.checked = tempIncludeIslands["46"];
    if (t47) t47.checked = tempIncludeIslands["47"];
}

function closePrefModal() {
    document.getElementById("prefModal")?.classList.add("hidden");
}

function updateTempSelectedFromCheckboxes() {
    const checked = Array.from(document.querySelectorAll(".pref-checkbox:checked")).map(cb => cb.value);
    tempSelectedCodes = (checked.length === 47 || checked.length === 0) ? ["ALL"] : checked;
    updateModalFooterCount();
}

function syncCheckboxesFromTemp() {
    const isAll = tempSelectedCodes.includes("ALL") || tempSelectedCodes.length === 47;
    document.querySelectorAll(".pref-checkbox").forEach(cb => cb.checked = isAll || tempSelectedCodes.includes(cb.value));
    updateModalFooterCount();
}

function updateModalFooterCount() {
    const isAll = tempSelectedCodes.includes("ALL") || tempSelectedCodes.length === 47;
    const countEl = document.getElementById("modalSelectedCount");
    if (!countEl) return;
    if (isAll) countEl.textContent = "全国（すべての都道府県）";
    else if (tempSelectedCodes.length === 0) countEl.textContent = "未選択（全国を表示）";
    else countEl.textContent = `${getSelectedPrefLabel(tempSelectedCodes)} (${tempSelectedCodes.length}都道府県)`;
}

function updateHeaderPrefButton() {
    const labelEl = document.getElementById("selectedPrefLabel");
    const badgeEl = document.getElementById("selectedPrefBadge");

    if (!labelEl || !badgeEl) return;

    if (mapMode === "pref") {
        labelEl.textContent = "全国（47都道府県）";
        badgeEl.classList.add("hidden");
        return;
    }

    labelEl.textContent = getSelectedPrefLabel(selectedPrefCodes);

    if (selectedPrefCodes.includes("ALL") || selectedPrefCodes.length === 47) {
        badgeEl.classList.add("hidden");
    } else {
        badgeEl.textContent = selectedPrefCodes.length;
        badgeEl.classList.remove("hidden");
    }
}

function getSelectedPrefLabel(codes) {
    if (!codes || codes.includes("ALL") || codes.length === 47 || codes.length === 0) return "全国（日本全体）";
    if (codes.length === 1) return getPrefName(codes[0]);
    const names = codes.map(c => getPrefName(c));
    return codes.length <= 2 ? names.join("・") : `${names[0]}・${names[1]} 外${codes.length - 2}県`;
}

function initColorPalettes() {
    renderBasePalette();
    renderCustomPalette();
}

function renderBasePalette() {
    const paletteEl = document.getElementById("colorPalette");
    if (!paletteEl) return;

    paletteEl.innerHTML = BASE_COLORS.map((color) => `
        <button type="button" data-color="${color}" class="color-swatch w-7 h-7 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 flex items-center justify-center ${color.toLowerCase() === selectedColor.toLowerCase() ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}" style="background-color: ${color}">
        </button>
    `).join("");

    paletteEl.querySelectorAll(".color-swatch").forEach(btn => {
        btn.addEventListener("click", () => setColor(btn.getAttribute("data-color")));
    });
}

function renderCustomPalette() {
    const customPaletteEl = document.getElementById("customColorPalette");
    if (!customPaletteEl) return;

    customPaletteEl.innerHTML = customColors.map((color, index) => `
        <label data-index="${index}" data-color="${color}" class="custom-swatch relative w-7 h-7 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 flex items-center justify-center cursor-pointer ${color.toLowerCase() === selectedColor.toLowerCase() ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}" style="background-color: ${color}">
            <input type="color" value="${color}" data-index="${index}" class="custom-color-input opacity-0 absolute inset-0 w-full h-full cursor-pointer">
        </label>
    `).join("");

    customPaletteEl.querySelectorAll(".custom-color-input").forEach(input => {
        input.addEventListener("input", (e) => {
            const idx = parseInt(e.target.getAttribute("data-index"), 10);
            const newColor = e.target.value;
            customColors[idx] = newColor;
            const label = e.target.parentElement;
            label.style.backgroundColor = newColor;
            label.setAttribute("data-color", newColor);
            setColor(newColor);
            saveToLocalStorage();
        });
        input.addEventListener("click", (e) => {
            const idx = parseInt(e.target.getAttribute("data-index"), 10);
            setColor(customColors[idx]);
        });
    });
}

function setColor(color) {
    selectedColor = color;
    
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
    activeTool = mode;
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
    map = L.map("map", {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true
    }).setView([36.5, 137.5], 5);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.createPane("landPane");
    map.getPane("landPane").style.zIndex = 400;

    map.createPane("boundaryPane");
    map.getPane("boundaryPane").style.zIndex = 500;
    map.getPane("boundaryPane").style.pointerEvents = "none";

    map.createPane("railwayPane");
    map.getPane("railwayPane").style.zIndex = 600;

    updateTileLayer(selectedTileType);
}

function updateTileLayer(tileType) {
    selectedTileType = tileType;
    if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
        currentTileLayer = null;
    }

    if (showBaseMap && tileType !== "none" && TILE_LAYERS[tileType]) {
        currentTileLayer = L.tileLayer(TILE_LAYERS[tileType], {
            maxZoom: 18,
            crossOrigin: true
        }).addTo(map);
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
        showBaseMap = e.target.checked;
        updateTileLayer(selectedTileType);
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
        defaultLandColor = e.target.value;
        refreshLayerStyles();
        saveToLocalStorage();
    });

    document.getElementById("chkEnableOpacity")?.addEventListener("change", (e) => {
        enableLandOpacity = e.target.checked;
        const rangeOpacity = document.getElementById("landOpacityRange");
        if (rangeOpacity) rangeOpacity.disabled = !enableLandOpacity;
        const valEl = document.getElementById("landOpacityVal");
        if (valEl) valEl.textContent = enableLandOpacity ? defaultLandOpacity : "1.00 (不透明)";
        refreshLayerStyles();
        saveToLocalStorage();
    });

    document.getElementById("landOpacityRange")?.addEventListener("input", (e) => {
        defaultLandOpacity = parseFloat(e.target.value);
        const valEl = document.getElementById("landOpacityVal");
        if (valEl) valEl.textContent = defaultLandOpacity;
        refreshLayerStyles();
        saveToLocalStorage();
    });

    document.getElementById("bgImageInput")?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                bgImageDataUrl = evt.target.result;
                applyBgImage(bgImageDataUrl);
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
        bgImageDataUrl = null;
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
            boundarySettings[item.type] = {
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
    const colorRail = document.getElementById("colorRailwayBoundary");
    const weightRail = document.getElementById("weightRailwayBoundary");
    const styleRail = document.getElementById("styleRailwayBoundary");

    const updateRailwaySetting = async () => {
        if (chkRail) railwayConfig.show = chkRail.checked;
        if (colorRail) railwayConfig.defaultStyle.color = colorRail.value;
        if (weightRail) railwayConfig.defaultStyle.weight = parseFloat(weightRail.value);
        if (styleRail) railwayConfig.defaultStyle.style = styleRail.value;

        await renderRailwayLayer();
        saveToLocalStorage();
    };

    if (chkRail) chkRail.addEventListener("change", updateRailwaySetting);
    if (colorRail) colorRail.addEventListener("input", updateRailwaySetting);
    if (weightRail) weightRail.addEventListener("change", updateRailwaySetting);
    if (styleRail) styleRail.addEventListener("change", updateRailwaySetting);
}

function renderGeoJson(data, topologyFeatures) {
    if (geojsonLayer) map.removeLayer(geojsonLayer);

    currentCityMap = {};

    const filteredFeatures = data.features.filter(feature => {
        const code = getCityCode(feature.properties);
        const islandPrefCode = isIslandMunicipality(code, feature.properties);
        return !(islandPrefCode && includeIslands[islandPrefCode] === false);
    });

    const filteredTopology = (topologyFeatures || data.features).filter(feature => {
        const code = getCityCode(feature.properties);
        const islandPrefCode = isIslandMunicipality(code, feature.properties);
        return !(islandPrefCode && includeIslands[islandPrefCode] === false);
    });

    const selectedSet = new Set(
        (mapMode === "pref" || selectedPrefCodes.includes("ALL")) ? PREFECTURES.map(p => p.code) : selectedPrefCodes
    );

    extractBoundaries(filteredTopology, selectedSet);

    geojsonLayer = L.geoJSON({ type: "FeatureCollection", features: filteredFeatures }, {
        pane: "landPane",
        style: featureStyle,
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const cityCode = getCityCode(props);
            const prefCode = getFeaturePrefCode(feature);
            const code = mapMode === "pref" ? prefCode : cityCode;
            const name = mapMode === "pref" ? (getPrefName(prefCode) || "都道府県") : getCityName(props);
            const prefName = props.N03_001 || getPrefName(prefCode) || "都道府県";

            currentCityMap[code] = { name, prefCode, prefName };

            layer.on({
                mouseover: (e) => {
                    if (activeTab === "railway") return;

                    const colored = Boolean(colorState[code]);
                    const opacity = colored ? 1.0 : (enableLandOpacity ? Math.min(1.0, defaultLandOpacity + 0.2) : 1.0);
                    
                    if (mapMode === "pref") {
                        geojsonLayer.eachLayer(l => {
                            if (getFeaturePrefCode(l.feature) === prefCode) {
                                l.setStyle({ fillOpacity: opacity, opacity: opacity });
                            }
                        });
                    } else {
                        e.target.setStyle({ fillOpacity: opacity });
                    }

                    showHoverCard(true, prefName, mapMode === "pref" ? prefName : name, code);
                },
                mouseout: (e) => {
                    if (activeTab === "railway") return;

                    if (mapMode === "pref") {
                        geojsonLayer.eachLayer(l => {
                            if (getFeaturePrefCode(l.feature) === prefCode) geojsonLayer.resetStyle(l);
                        });
                    } else {
                        geojsonLayer.resetStyle(e.target);
                    }
                    showHoverCard(false);
                },
                click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    if (activeTab === "railway") return;

                    handleCityClick(code);
                }
            });
        }
    }).addTo(map);

    renderBoundaryLayers();
    renderRailwayLayer();
    fitToCurrentBounds();
}

function extractBoundaries(topologyFeatures, selectedPrefSet) {
    const edgeMap = new Map();
    const SCALE = 10000;

    topologyFeatures.forEach(feature => {
        const props = feature.properties || {};
        const rawCode = props.N03_007 ? String(props.N03_007).trim() : "";
        const paddedCode = rawCode.length < 5 && !isNaN(rawCode) && rawCode.length > 0 ? rawCode.padStart(5, "0") : rawCode;
        const prefCode = paddedCode && paddedCode.length >= 2 ? paddedCode.substring(0, 2) : (props.N03_001 || "");
        const cityCode = paddedCode || "00000";
        const isWard = Boolean(props.N03_005) || (props.N03_004 && String(props.N03_004).endsWith("区") && props.N03_003 && String(props.N03_003).endsWith("市"));
        const seireiName = isWard ? (props.N03_003 || "") : null;
        const countyName = (!isWard && props.N03_003 && String(props.N03_003).endsWith("郡")) ? props.N03_003 : null;

        const meta = { prefCode, cityCode, seireiName, countyName };

        function processRing(ring) {
            for (let i = 0; i < ring.length - 1; i++) {
                const p1 = ring[i], p2 = ring[i + 1];
                const x1 = Math.round(p1[0] * SCALE), y1 = Math.round(p1[1] * SCALE);
                const x2 = Math.round(p2[0] * SCALE), y2 = Math.round(p2[1] * SCALE);
                if (x1 === x2 && y1 === y2) continue;

                const k1 = `${x1}_${y1}`, k2 = `${x2}_${y2}`;
                const key = k1 < k2 ? `${k1}:${k2}` : `${k2}:${k1}`;

                if (!edgeMap.has(key)) edgeMap.set(key, { p1, p2, f1: meta, f2: null });
                else {
                    const existing = edgeMap.get(key);
                    if (existing.f1.cityCode !== meta.cityCode) existing.f2 = meta;
                }
            }
        }

        const geom = feature.geometry;
        if (geom) {
            if (geom.type === "Polygon") geom.coordinates.forEach(processRing);
            else if (geom.type === "MultiPolygon") geom.coordinates.forEach(poly => poly.forEach(processRing));
        }
    });

    const coastLines = [], prefLines = [], cityLines = [], countyLines = [], wardLines = [];

    edgeMap.forEach(({ p1, p2, f1, f2 }) => {
        const f1Selected = f1 && selectedPrefSet.has(f1.prefCode);
        const f2Selected = f2 && selectedPrefSet.has(f2.prefCode);
        if (!f1Selected && !f2Selected) return;

        if (f2) {
            if (f1.prefCode !== f2.prefCode) prefLines.push([p1, p2]);
            else if (f1.cityCode !== f2.cityCode && f1Selected && f2Selected) {
                if (f1.seireiName && f2.seireiName && f1.seireiName === f2.seireiName) wardLines.push([p1, p2]);
                else if (f1.countyName && f2.countyName && f1.countyName === f2.countyName) countyLines.push([p1, p2]);
                else cityLines.push([p1, p2]);
            }
        } else {
            const activeMeta = f1Selected ? f1 : f2;
            if (LANDLOCKED_PREFS.has(activeMeta.prefCode)) prefLines.push([p1, p2]);
            else coastLines.push([p1, p2]);
        }
    });

    boundaryGeoJsons = {
        ...boundaryGeoJsons,
        coast: { type: "Feature", geometry: { type: "MultiLineString", coordinates: coastLines } },
        pref: { type: "Feature", geometry: { type: "MultiLineString", coordinates: prefLines } },
        city: { type: "Feature", geometry: { type: "MultiLineString", coordinates: cityLines } },
        county: { type: "Feature", geometry: { type: "MultiLineString", coordinates: countyLines } },
        ward: { type: "Feature", geometry: { type: "MultiLineString", coordinates: wardLines } }
    };
}

function renderBoundaryLayers() {
    ["ward", "county", "city", "pref", "coast"].forEach(type => {
        if (boundaryLayers[type]) {
            map.removeLayer(boundaryLayers[type]);
            boundaryLayers[type] = null;
        }

        if (mapMode === "pref" && (type === "city" || type === "county" || type === "ward")) {
            return;
        }

        const setting = boundarySettings[type];
        const geojson = boundaryGeoJsons[type];

        if (setting && setting.show && geojson) {
            let dashArray = null;
            if (setting.style === "dashed") dashArray = "6, 4";
            else if (setting.style === "dotted") dashArray = "2, 3";

            boundaryLayers[type] = L.geoJSON(geojson, {
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
            }).addTo(map);
        }
    });
}

// 修正：N02-25_Station属性（N02_005:駅名, N02_003:路線名, N02_004:事業者名）に対応させたレイヤー描画処理
async function renderRailwayLayer() {
    if (boundaryLayers.railway) {
        map.removeLayer(boundaryLayers.railway);
        boundaryLayers.railway = null;
    }

    if (!railwayConfig.show) return;

    if (!boundaryGeoJsons.railway) {
        showLoading(true, "鉄道データを取得中...");
        const data = await fetchRailwayData();
        showLoading(false);
        if (data) {
            boundaryGeoJsons.railway = data;
        } else {
            railwayConfig.show = false;
            const chkRail = document.getElementById("chkRailwayBoundary");
            if (chkRail) chkRail.checked = false;
            return;
        }
    }

    boundaryLayers.railway = L.geoJSON(boundaryGeoJsons.railway, {
        pane: "railwayPane",
        style: getRailwayFeatureStyle,
        onEachFeature: (feature, layer) => {
            layer.on({
                mouseover: (e) => {
                    const props = feature.properties || {};
                    // N02プロパティ（国土数値情報）を最優先で取得
                    const stationName = props.N02_005 || props.station_name || props.station || "";
                    const lineName = props.N02_003 || props.line_name || props.line || props.name || "路線名不明";
                    const companyName = props.N02_004 || props.N02_002 || props.company || "鉄道事業者";

                    const currentStyle = getRailwayFeatureStyle(feature);
                    e.target.setStyle({
                        weight: (currentStyle.weight || 1.5) + 2.0,
                        opacity: 1.0
                    });

                    const mainTitle = stationName ? `${stationName}駅（${lineName}）` : lineName;
                    showHoverCard(true, companyName, mainTitle, "鉄道駅データ");
                },
                mouseout: (e) => {
                    if (boundaryLayers.railway) {
                        boundaryLayers.railway.resetStyle(e.target);
                    }
                    showHoverCard(false);
                }
            });
        }
    }).addTo(map);
}

function featureStyle(feature) {
    const cityCode = getCityCode(feature.properties);
    const prefCode = getFeaturePrefCode(feature);
    const code = mapMode === "pref" ? prefCode : cityCode;
    const colored = colorState[code];
    const fillColor = colored ? colored : defaultLandColor;
    const fillOpacity = colored ? 1.0 : (enableLandOpacity ? defaultLandOpacity : 1.0);

    if (mapMode === "pref") {
        return {
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            stroke: true,
            color: fillColor,
            weight: 1.5,
            opacity: fillOpacity
        };
    } else {
        return {
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            stroke: false
        };
    }
}

function handleCityClick(code) {
    if (activeTab === "railway") return;

    if (activeTool === "paint") colorState[code] = selectedColor;
    else delete colorState[code];

    geojsonLayer.eachLayer(layer => {
        const layerCode = mapMode === "pref" ? getFeaturePrefCode(layer.feature) : getCityCode(layer.feature.properties);
        if (layerCode === code) {
            layer.setStyle(featureStyle(layer.feature));
        }
    });

    saveToLocalStorage();
    updateUIStats();
}

function removeCityColor(code) {
    delete colorState[code];

    if (geojsonLayer) {
        geojsonLayer.eachLayer(layer => {
            const layerCode = mapMode === "pref" ? getFeaturePrefCode(layer.feature) : getCityCode(layer.feature.properties);
            if (layerCode === code) {
                layer.setStyle(featureStyle(layer.feature));
            }
        });
    }

    saveToLocalStorage();
    updateUIStats();
}

function applySampleCategoryColors() {
    if (!geojsonLayer) return;

    const SAMPLE_COLORS = {
        tokubetsuku: "#fecaca",
        seireishi: "#fbcfe8",
        shi: "#fed7aa",
        cho: "#bbf7d0",
        son: "#bae6fd"
    };

    colorState = {};

    geojsonLayer.eachLayer(layer => {
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

        colorState[code] = assignedColor;
    });

    refreshLayerStyles();
    saveToLocalStorage();
    updateUIStats();
    showToast("自治体区分サンプルデータを適用しました");
}

function fillAllCurrentPref() {
    Object.keys(currentCityMap).forEach(code => colorState[code] = selectedColor);
    refreshLayerStyles();
    saveToLocalStorage();
    updateUIStats();
    showToast(`${mapMode === "pref" ? "全国の都道府県" : getSelectedPrefLabel(selectedPrefCodes)}を表示エリア全塗りしました`);
}

function clearAllCurrentPref() {
    Object.keys(currentCityMap).forEach(code => delete colorState[code]);
    refreshLayerStyles();
    saveToLocalStorage();
    updateUIStats();
    showToast(`${mapMode === "pref" ? "全国の都道府県" : getSelectedPrefLabel(selectedPrefCodes)}の色塗りをクリアしました`);
}

function refreshLayerStyles() {
    if (!geojsonLayer) return;
    geojsonLayer.eachLayer(layer => layer.setStyle(featureStyle(layer.feature)));
}

function fitToCurrentBounds() {
    if (geojsonLayer && map) {
        map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
    }
}

function updateUIStats() {
    const currentPrefNameEl = document.getElementById("currentPrefName");
    if (currentPrefNameEl) {
        currentPrefNameEl.textContent = mapMode === "pref" ? "全国（都道府県版）" : getSelectedPrefLabel(selectedPrefCodes);
    }

    let allCodes = [];
    if (mapMode === "pref") {
        allCodes = PREFECTURES.map(p => p.code);
    } else {
        allCodes = Object.keys(currentCityMap);
    }

    const total = allCodes.length;
    const coloredCodes = allCodes.filter(code => colorState[code]);
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

    const isMultiOrNational = mapMode === "city" && (selectedPrefCodes.includes("ALL") || selectedPrefCodes.length > 1);

    listEl.innerHTML = coloredCodes.map(code => {
        const name = mapMode === "pref" ? getPrefName(code) : (currentCityMap[code]?.name || code);
        const prefName = mapMode === "pref" ? "" : currentCityMap[code]?.prefName;
        const color = colorState[code];
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

function getCityName(props) {
    if (!props) return "不明";
    const county = props.N03_003 ? props.N03_003 : "";
    const city = props.N03_004 ? props.N03_004 : (props.N03_001 || "");
    return county ? `${county}${city}` : city;
}

function getCityCode(props) {
    if (!props) return "00000";
    const raw = props.N03_007 || props.N03_004 || "00000";
    const str = String(raw).trim();
    return str.length < 5 && !isNaN(str) ? str.padStart(5, "0") : str;
}

function getPrefName(code) {
    if (code === "ALL") return "全国（日本全体）";
    const pref = PREFECTURES.find(p => p.code === code);
    return pref ? pref.name : "";
}

function showHoverCard(show, prefName = "", cityName = "", code = "") {
    const card = document.getElementById("hoverCard");
    if (!card) return;
    if (show) {
        document.getElementById("hoverPref").textContent = prefName;
        document.getElementById("hoverCity").textContent = cityName;
        document.getElementById("hoverCode").textContent = code;
        card.classList.remove("hidden");
    } else {
        card.classList.add("hidden");
    }
}

function showLoading(show, text = "") {
    const overlay = document.getElementById("loadingOverlay");
    if (!overlay) return;
    if (show) {
        const textEl = document.getElementById("loadingText");
        if (textEl) textEl.textContent = text;
        overlay.classList.remove("hidden");
    } else {
        overlay.classList.add("hidden");
    }
}

function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all transform duration-300 translate-y-2 opacity-0 ${
        type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
    }`;
    toast.innerHTML = `
        <i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle-2'}" class="w-4 h-4 text-emerald-400"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => toast.classList.remove("translate-y-2", "opacity-0"), 10);
    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function exportStateJson() {
    const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        mapMode: mapMode,
        colorState: colorState,
        defaultLandColor: defaultLandColor,
        enableLandOpacity: enableLandOpacity,
        defaultLandOpacity: defaultLandOpacity,
        mapBgColor: mapBgColor,
        showBaseMap: showBaseMap,
        selectedTileType: selectedTileType,
        customColors: customColors,
        railwayConfig: railwayConfig
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `japan_map_color_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("設定をJSONに保存しました");
}

function importStateJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data && data.colorState) {
                if (data.mapMode) mapMode = data.mapMode;
                colorState = { ...colorState, ...data.colorState };
                if (data.defaultLandColor) defaultLandColor = data.defaultLandColor;
                if (data.enableLandOpacity !== undefined) enableLandOpacity = data.enableLandOpacity;
                if (data.defaultLandOpacity !== undefined) defaultLandOpacity = parseFloat(data.defaultLandOpacity);
                if (data.mapBgColor) mapBgColor = data.mapBgColor;
                if (data.showBaseMap !== undefined) showBaseMap = data.showBaseMap;
                if (data.selectedTileType) selectedTileType = data.selectedTileType;
                if (data.customColors) customColors = data.customColors;
                if (data.railwayConfig) railwayConfig = data.railwayConfig;

                updateModeUI();
                initBoundaryUIValues();
                renderCustomPalette();
                updateTileLayer(selectedTileType);
                refreshLayerStyles();
                await renderRailwayLayer();
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

function generateMapSvgString() {
    if (!currentGeoJsonData || !currentGeoJsonData.features) return null;

    const exportFeatures = currentGeoJsonData.features.filter(feature => {
        const code = getCityCode(feature.properties);
        const islandPrefCode = isIslandMunicipality(code, feature.properties);
        return !(islandPrefCode && includeIslands[islandPrefCode] === false);
    });

    if (exportFeatures.length === 0) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    function processCoords(coords) {
        if (typeof coords[0] === 'number') {
            const [lon, lat] = coords;
            const [mx, my] = geoToMercator(lon, lat);
            if (mx < minX) minX = mx;
            if (mx > maxX) maxX = mx;
            if (my < minY) minY = my;
            if (my > maxY) maxY = my;
        } else coords.forEach(processCoords);
    }

    exportFeatures.forEach(f => {
        if (f.geometry && f.geometry.coordinates) processCoords(f.geometry.coordinates);
    });

    let targetScale = (256 * Math.pow(2, 10)) / (2 * Math.PI);
    const mercWidth = maxX - minX, mercHeight = maxY - minY;
    const maxDimension = 8000;
    const padding = 40;
    
    if (mercWidth * targetScale > maxDimension || mercHeight * targetScale > maxDimension) {
        targetScale = Math.min(maxDimension / mercWidth, maxDimension / mercHeight);
    }

    const viewBoxWidth = Math.ceil(mercWidth * targetScale + 2 * padding);
    const viewBoxHeight = Math.ceil(mercHeight * targetScale + 2 * padding);

    function project([lon, lat]) {
        const [mx, my] = geoToMercator(lon, lat);
        const sx = (padding + (mx - minX) * targetScale).toFixed(2);
        const sy = (padding + (maxY - my) * targetScale).toFixed(2);
        return `${sx},${sy}`;
    }

    function ringToD(ring) { return "M " + ring.map(project).join(" L ") + " Z"; }
    function geomToD(geom) {
        if (geom.type === "Polygon") return geom.coordinates.map(ringToD).join(" ");
        else if (geom.type === "MultiPolygon") return geom.coordinates.map(poly => poly.map(ringToD).join(" ")).join(" ");
        return "";
    }

    function lineToD(lines) { 
        if (!lines || lines.length === 0) return "";
        return lines.map(line => `M ${project(line[0])} L ${project(line[1])}`).join(" "); 
    }

    // 修正：LineStringだけでなくPoint型駅データにも対応するSVG変換処理
    function railwayToSvgPaths(geojson) {
        if (!geojson || !geojson.features || !railwayConfig.show) return "";
        let pathsHtml = "";
        geojson.features.forEach(f => {
            const geom = f.geometry;
            if (!geom) return;

            const style = getRailwayFeatureStyle(f);
            if (!style || style.opacity === 0 || style.weight === 0) return;

            let dashAttr = "";
            if (style.dashArray) dashAttr = `stroke-dasharray="${style.dashArray}"`;

            if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
                const ptStr = project(geom.coordinates);
                if (!ptStr.includes("NaN")) {
                    const [cx, cy] = ptStr.split(",");
                    const radius = (style.weight || 1.5) + 1;
                    pathsHtml += `    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${style.color}" opacity="${style.opacity}"/>\n`;
                }
            } else {
                let d = "";
                if (geom.type === "LineString" && Array.isArray(geom.coordinates)) {
                    const pts = geom.coordinates.map(project).filter(p => !p.includes("NaN"));
                    if (pts.length >= 2) d = "M " + pts.join(" L ");
                } else if (geom.type === "MultiLineString" && Array.isArray(geom.coordinates)) {
                    let segments = [];
                    geom.coordinates.forEach(coords => {
                        const pts = coords.map(project).filter(p => !p.includes("NaN"));
                        if (pts.length >= 2) segments.push("M " + pts.join(" L "));
                    });
                    d = segments.join(" ");
                }

                if (d) {
                    pathsHtml += `    <path d="${d}" fill="none" stroke="${style.color}" stroke-width="${style.weight}" ${dashAttr} stroke-linecap="round" stroke-linejoin="round"/>\n`;
                }
            }
        });
        return pathsHtml;
    }

    let pathsHtml = "";

    exportFeatures.forEach(feature => {
        const props = feature.properties;
        const cityCode = getCityCode(props);
        const prefCode = getFeaturePrefCode(feature);
        const code = mapMode === "pref" ? prefCode : cityCode;
        const name = mapMode === "pref" ? getPrefName(prefCode) : getCityName(props);
        const prefName = props.N03_001 || getPrefName(prefCode) || "都道府県";
        const colored = Boolean(colorState[code]);
        const fillColor = colored ? colorState[code] : defaultLandColor;
        const fillOpacity = colored ? 1.0 : (enableLandOpacity ? defaultLandOpacity : 1.0);
        const d = geomToD(feature.geometry);

        const strokeAttr = mapMode === "pref" 
            ? `stroke="${fillColor}" stroke-width="1.5" stroke-opacity="${fillOpacity}" stroke-linejoin="round" stroke-linecap="round"`
            : `stroke="none"`;

        if (d) pathsHtml += `    <path d="${d}" fill="${fillColor}" fill-opacity="${fillOpacity}" ${strokeAttr} data-code="${code}" data-name="${name}" data-pref="${prefName}"><title>${prefName} ${name}</title></path>\n`;
    });

    let boundarySvgHtml = "";
    const boundaryTypes = mapMode === "pref" ? ["pref", "coast"] : ["ward", "county", "city", "pref", "coast"];

    boundaryTypes.forEach(type => {
        const setting = boundarySettings[type];
        const geojson = boundaryGeoJsons[type];
        if (setting && setting.show && geojson && geojson.geometry && geojson.geometry.coordinates) {
            let dashAttr = "";
            if (setting.style === "dashed") dashAttr = 'stroke-dasharray="6,4"';
            else if (setting.style === "dotted") dashAttr = 'stroke-dasharray="2,3"';

            const d = lineToD(geojson.geometry.coordinates);
            if (d) boundarySvgHtml += `    <path d="${d}" fill="none" stroke="${setting.color}" stroke-width="${setting.weight}" ${dashAttr} stroke-linecap="round" stroke-linejoin="round"/>\n`;
        }
    });

    const railwaySvgHtml = railwayToSvgPaths(boundaryGeoJsons.railway);

    let bgImageSvg = "";
    if (bgImageDataUrl) bgImageSvg = `  <image href="${bgImageDataUrl}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />\n`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}">
  <style>
    path { transition: fill 0.2s; }
  </style>
  <rect width="100%" height="100%" fill="${mapBgColor}"/>
${bgImageSvg}  <g id="municipalities">
${pathsHtml}  </g>
  <g id="boundaries">
${boundarySvgHtml}  </g>
  <g id="railways">
${railwaySvgHtml}  </g>
</svg>`;
}

function exportMapImage() {
    showLoading(true, "ズーム10相当のPNG画像を生成中...");

    setTimeout(() => {
        try {
            const svgString = generateMapSvgString();
            if (!svgString) {
                showLoading(false);
                showToast("画像の生成に失敗しました", "error");
                return;
            }

            const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                
                ctx.fillStyle = mapBgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                const link = document.createElement("a");
                const labelName = mapMode === "pref" ? "都道府県版" : getSelectedPrefLabel(selectedPrefCodes);
                link.download = `japan_map_${labelName}_z10_${new Date().toISOString().slice(0,10)}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();

                URL.revokeObjectURL(url);
                showLoading(false);
                showToast("高精細PNG画像を保存しました");
            };

            img.onerror = (err) => {
                console.error("PNG変換エラー:", err);
                URL.revokeObjectURL(url);
                showLoading(false);
                showToast("PNG画像の生成に失敗しました", "error");
            };

            img.src = url;
        } catch (err) {
            console.error(err);
            showLoading(false);
            showToast("画像の保存処理に失敗しました", "error");
        }
    }, 50);
}

function exportMapSvg() {
    showLoading(true, "ズーム10相当のSVGベクター画像を生成中...");

    setTimeout(() => {
        try {
            const svgString = generateMapSvgString();
            if (!svgString) {
                showLoading(false);
                showToast("データが読み込まれていません", "error");
                return;
            }

            const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const labelName = mapMode === "pref" ? "都道府県版" : getSelectedPrefLabel(selectedPrefCodes);
            a.download = `japan_map_${labelName}_z10_${new Date().toISOString().slice(0,10)}.svg`;
            a.click();
            URL.revokeObjectURL(url);

            showLoading(false);
            showToast("高精細SVGベクター画像を保存しました");
        } catch (err) {
            console.error("SVG export error:", err);
            showLoading(false);
            showToast("SVG画像の生成に失敗しました", "error");
        }
    }, 50);
}

function geoToMercator(lon, lat) {
    const x = lon * Math.PI / 180;
    const rad = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
    const y = Math.log(Math.tan(Math.PI / 4 + rad / 2));
    return [x, y];
}
