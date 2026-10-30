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

const PALETTE_COLORS = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
    "#06b6d4", "#f97316", "#84cc16", "#6366f1", "#14b8a6", "#64748b"
];

const TILE_LAYERS = {
    pale: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    std: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
};

// 内陸8県（海岸線を持たない都道府県）
const LANDLOCKED_PREFS = new Set(["09", "10", "11", "19", "20", "21", "25", "29"]);

// --- アプリケーション状態 ---
let map = null;
let currentTileLayer = null;
let geojsonLayer = null;
let currentGeoJsonData = null;
let selectedPrefCodes = ["ALL"];
let tempSelectedCodes = ["ALL"];
let activeTool = "paint";
let selectedColor = "#3b82f6";

let colorState = {};
let currentCityMap = {};
let nationalFeaturesCache = null;

// 境界線カスタマイズ状態
let boundarySettings = {
    coast: { show: true, color: "#1e293b", weight: 2.0, style: "solid" },
    pref: { show: true, color: "#0f172a", weight: 2.5, style: "solid" },
    city: { show: true, color: "#475569", weight: 1.0, style: "solid" },
    county: { show: true, color: "#64748b", weight: 1.0, style: "dotted" },
    ward: { show: true, color: "#64748b", weight: 1.0, style: "dashed" }
};
let mapBgColor = "#f1f5f9";

// 抽出された境界線データ & レイヤー
let boundaryGeoJsons = { coast: null, pref: null, city: null, county: null, ward: null };
let boundaryLayers = { coast: null, pref: null, city: null, county: null, ward: null };

// 島嶼部（離島）表示フラグ
let includeIslands = {
    "13": true, // 東京都
    "46": true, // 鹿児島県
    "47": true  // 沖縄県
};
let tempIncludeIslands = { ...includeIslands };

// LocalStorage 保存キー
const STORAGE_KEY_COLOR_STATE = "japan_map_color_state_v1";
const STORAGE_KEY_SELECTED_PREFS = "japan_map_selected_prefs_v1";
const STORAGE_KEY_ISLANDS = "japan_map_include_islands_v1";
const STORAGE_KEY_BOUNDARIES = "japan_map_boundaries_v1";
const STORAGE_KEY_BGCOLOR = "japan_map_bgcolor_v1";

// --- 初期化処理 ---
window.onload = function() {
    lucide.createIcons();
    initPwaSupport();
    initPrefModalUI();
    initColorPalette();
    initMap();
    bindEvents();

    loadFromLocalStorage();

    initBoundaryUIValues();
    updateHeaderPrefButton();
    loadPrefectureData(selectedPrefCodes);
};

// --- Service Worker 登録 & インストールプロンプト＆自動更新機能 ---
let deferredPrompt = null;
let isRefreshing = false;

function initPwaSupport() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").then((registration) => {
            registration.addEventListener("updatefound", () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener("statechange", () => {
                    if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                        showToast("アプリが最新バージョンに更新されました！再読み込みします...");
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    }
                });
            });
        }).catch(err => {
            console.log("Service Worker登録制限 (環境依存):", err);
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (isRefreshing) return;
            isRefreshing = true;
            window.location.reload();
        });
    }

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const btnInstall = document.getElementById("btnInstallPwa");
        if (btnInstall) {
            btnInstall.classList.remove("hidden");
        }
    });

    document.getElementById("btnInstallPwa")?.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            showToast("アプリがホーム画面に追加されました！");
        }
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

async function loadPrefectureData(codes) {
    showLoading(true, "GeoJSON境界データを読み込んでいます...");
    try {
        if (!nationalFeaturesCache) {
            const res = await fetch("https://raw.githubusercontent.com/smartnews-smri/japan-topography/main/data/municipality/geojson/s0010/N03-21_210101.json");
            if (!res.ok) throw new Error("全国データの取得に失敗しました");
            const data = await res.json();
            nationalFeaturesCache = data.features || [];
        }

        const isAll = codes.includes("ALL") || codes.length === 47;
        let displayFeatures = [];

        if (isAll) {
            displayFeatures = nationalFeaturesCache;
        } else {
            const selectedSet = new Set(codes);
            displayFeatures = nationalFeaturesCache.filter(feature => {
                const prefCode = getFeaturePrefCode(feature);
                return selectedSet.has(prefCode);
            });
        }

        currentGeoJsonData = {
            type: "FeatureCollection",
            features: displayFeatures
        };

        renderGeoJson(currentGeoJsonData, nationalFeaturesCache);
        updateUIStats();
        showLoading(false);
    } catch (err) {
        console.error("データ取得エラー:", err);
        showLoading(false);
        showToast("境界データの取得に失敗しました。時間をおいて再試行してください。", "error");
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_COLOR_STATE, JSON.stringify(colorState));
        localStorage.setItem(STORAGE_KEY_SELECTED_PREFS, JSON.stringify(selectedPrefCodes));
        localStorage.setItem(STORAGE_KEY_ISLANDS, JSON.stringify(includeIslands));
        localStorage.setItem(STORAGE_KEY_BOUNDARIES, JSON.stringify(boundarySettings));
        localStorage.setItem(STORAGE_KEY_BGCOLOR, mapBgColor);
    } catch (e) {
        console.warn("LocalStorage への保存に失敗しました:", e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedState = localStorage.getItem(STORAGE_KEY_COLOR_STATE);
        const savedPrefs = localStorage.getItem(STORAGE_KEY_SELECTED_PREFS);
        const savedIslands = localStorage.getItem(STORAGE_KEY_ISLANDS);
        const savedBoundaries = localStorage.getItem(STORAGE_KEY_BOUNDARIES);
        const savedBgColor = localStorage.getItem(STORAGE_KEY_BGCOLOR);

        if (savedState) colorState = JSON.parse(savedState) || {};
        if (savedPrefs) selectedPrefCodes = JSON.parse(savedPrefs) || ["ALL"];
        if (savedIslands) includeIslands = { ...includeIslands, ...JSON.parse(savedIslands) };
        if (savedBoundaries) boundarySettings = { ...boundarySettings, ...JSON.parse(savedBoundaries) };
        if (savedBgColor) mapBgColor = savedBgColor;
    } catch (e) {
        console.warn("LocalStorage からの読み込みに失敗しました:", e);
    }
}

function initBoundaryUIValues() {
    document.getElementById("bgColorPicker").value = mapBgColor;
    applyMapBgColor(mapBgColor);

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
            document.getElementById(item.color).value = boundarySettings[item.type].color;
            document.getElementById(item.weight).value = boundarySettings[item.type].weight;
            document.getElementById(item.style).value = boundarySettings[item.type].style;
        }
    });
}

function applyMapBgColor(color) {
    mapBgColor = color;
    const mapContainer = document.getElementById("map");
    if (mapContainer) mapContainer.style.backgroundColor = color;
}

function isIslandMunicipality(code, props = null) {
    const strCode = String(code).trim();
    const numCode = parseInt(strCode, 10);

    let propText = "";
    if (props) {
        propText = Object.values(props).map(v => (v !== null && v !== undefined) ? String(v) : "").join(" ");
    }

    const isTokyo = strCode.startsWith("13") || propText.includes("東京都");

    if (isTokyo) {
        if (propText.includes("支庁")) return "13";
        if (!isNaN(numCode) && numCode >= 13361 && numCode <= 13421) return "13";

        const islandKeywords = ["大島", "利島", "新島", "神津島", "三宅", "御蔵島", "八丈", "青ヶ島", "小笠原", "父島", "母島", "硫黄島", "鳥島"];
        if (islandKeywords.some(k => propText.includes(k))) return "13";

        const isUnassigned = propText.includes("未定") || propText.includes("地先") || propText.includes("水面") || strCode === "13000" || strCode === "13100" || strCode === "13300" || strCode === "00000";

        if (isUnassigned) {
            const bayWards = ["中央区", "港区", "江東区", "品川区", "大田区", "江戸川区", "東京港", "東京湾"];
            const isBayArea = bayWards.some(w => propText.includes(w));
            return isBayArea ? null : "13";
        }

        if (["13303", "13305", "13307", "13308"].includes(strCode)) return null;

        const is23Ku = !isNaN(numCode) && numCode >= 13101 && numCode <= 13123;
        const isCity = !isNaN(numCode) && numCode >= 13201 && numCode <= 13229;
        if (is23Ku || isCity) return null;

        return "13";
    }

    if (strCode === "46213" || strCode === "46222" || 
        strCode === "46303" || strCode === "46304" || 
        (!isNaN(numCode) && numCode >= 46500 && numCode <= 46599) ||
        (props && (propText.includes("奄美") || propText.includes("大島郡") || propText.includes("熊毛郡") || propText.includes("屋久島") || propText.includes("種子島")))) {
        return "46";
    }

    const okinawaIslands = [
        "47207", "47214", "47315", "47353", "47354", "47355", 
        "47357", "47358", "47359", "47360", "47361", 
        "47375", "47381", "47382"
    ];
    if (okinawaIslands.includes(strCode) || 
        (props && (propText.includes("宮古") || propText.includes("八重山") || propText.includes("石垣") || propText.includes("久米島") || propText.includes("渡嘉敷") || propText.includes("座間味") || propText.includes("粟国") || propText.includes("渡名喜") || propText.includes("南大東") || propText.includes("北大東") || propText.includes("伊平屋") || propText.includes("伊江") || propText.includes("竹富") || propText.includes("与那国")))) {
        return "47";
    }

    return null;
}

function initPrefModalUI() {
    const gridEl = document.getElementById("prefCheckboxGrid");
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
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-1">
                    ${prefCheckboxes}
                </div>
            </div>
        `;
    }).join("");

    gridEl.querySelectorAll(".pref-checkbox").forEach(chk => {
        chk.addEventListener("change", () => updateTempSelectedFromCheckboxes());
    });

    gridEl.querySelectorAll(".region-select-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
            const regionId = btn.getAttribute("data-region-id");
            const region = REGIONS.find(r => r.id === regionId);
            if (region) {
                const allSelected = region.codes.every(c => tempSelectedCodes.includes(c));
                if (allSelected) {
                    tempSelectedCodes = tempSelectedCodes.filter(c => !region.codes.includes(c));
                } else {
                    region.codes.forEach(c => {
                        if (!tempSelectedCodes.includes(c)) tempSelectedCodes.push(c);
                    });
                    tempSelectedCodes = tempSelectedCodes.filter(c => c !== "ALL");
                }
                syncCheckboxesFromTemp();
            }
        });
    });

    document.querySelectorAll("#regionButtons .region-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const reg = btn.getAttribute("data-region");
            if (reg === "ALL") {
                tempSelectedCodes = ["ALL"];
            } else if (reg === "CLEAR") {
                tempSelectedCodes = [];
            } else {
                const region = REGIONS.find(r => r.id === reg);
                if (region) tempSelectedCodes = [...region.codes];
            }
            syncCheckboxesFromTemp();
        });
    });

    document.getElementById("modalToggleIsland13").addEventListener("change", (e) => tempIncludeIslands["13"] = e.target.checked);
    document.getElementById("modalToggleIsland46").addEventListener("change", (e) => tempIncludeIslands["46"] = e.target.checked);
    document.getElementById("modalToggleIsland47").addEventListener("change", (e) => tempIncludeIslands["47"] = e.target.checked);

    document.getElementById("btnOpenPrefModal").addEventListener("click", openPrefModal);
    document.getElementById("btnClosePrefModal").addEventListener("click", closePrefModal);
    document.getElementById("btnCancelPrefModal").addEventListener("click", closePrefModal);
    
    document.getElementById("btnApplyPrefModal").addEventListener("click", () => {
        selectedPrefCodes = [...tempSelectedCodes];
        if (selectedPrefCodes.length === 0) selectedPrefCodes = ["ALL"];
        includeIslands = { ...tempIncludeIslands };
        closePrefModal();
        updateHeaderPrefButton();
        saveToLocalStorage();
        loadPrefectureData(selectedPrefCodes);
    });
}

function openPrefModal() {
    tempSelectedCodes = [...selectedPrefCodes];
    tempIncludeIslands = { ...includeIslands };
    syncCheckboxesFromTemp();
    syncModalIslandTogglesFromTemp();
    document.getElementById("prefModal").classList.remove("hidden");
    lucide.createIcons();
}

function syncModalIslandTogglesFromTemp() {
    document.getElementById("modalToggleIsland13").checked = tempIncludeIslands["13"];
    document.getElementById("modalToggleIsland46").checked = tempIncludeIslands["46"];
    document.getElementById("modalToggleIsland47").checked = tempIncludeIslands["47"];
}

function closePrefModal() {
    document.getElementById("prefModal").classList.add("hidden");
}

function updateTempSelectedFromCheckboxes() {
    const checked = Array.from(document.querySelectorAll(".pref-checkbox:checked")).map(cb => cb.value);
    if (checked.length === 47 || checked.length === 0) {
        tempSelectedCodes = ["ALL"];
    } else {
        tempSelectedCodes = checked;
    }
    updateModalFooterCount();
}

function syncCheckboxesFromTemp() {
    const isAll = tempSelectedCodes.includes("ALL") || tempSelectedCodes.length === 47;
    document.querySelectorAll(".pref-checkbox").forEach(cb => {
        cb.checked = isAll || tempSelectedCodes.includes(cb.value);
    });
    updateModalFooterCount();
}

function updateModalFooterCount() {
    const isAll = tempSelectedCodes.includes("ALL") || tempSelectedCodes.length === 47;
    const countEl = document.getElementById("modalSelectedCount");
    if (isAll) {
        countEl.textContent = "全国（すべての都道府県）";
    } else if (tempSelectedCodes.length === 0) {
        countEl.textContent = "未選択（全国を表示）";
    } else {
        countEl.textContent = `${getSelectedPrefLabel(tempSelectedCodes)} (${tempSelectedCodes.length}都道府県)`;
    }
}

function updateHeaderPrefButton() {
    const labelEl = document.getElementById("selectedPrefLabel");
    const badgeEl = document.getElementById("selectedPrefBadge");
    const label = getSelectedPrefLabel(selectedPrefCodes);
    labelEl.textContent = label;

    if (selectedPrefCodes.includes("ALL") || selectedPrefCodes.length === 47) {
        badgeEl.classList.add("hidden");
    } else {
        badgeEl.textContent = selectedPrefCodes.length;
        badgeEl.classList.remove("hidden");
    }
}

function getSelectedPrefLabel(codes) {
    if (!codes || codes.includes("ALL") || codes.length === 47 || codes.length === 0) {
        return "全国（日本全体）";
    }
    if (codes.length === 1) {
        return getPrefName(codes[0]);
    }
    const names = codes.map(c => getPrefName(c));
    if (codes.length <= 2) {
        return names.join("・");
    }
    return `${names[0]}・${names[1]} 外${codes.length - 2}県`;
}

function initColorPalette() {
    const paletteEl = document.getElementById("colorPalette");
    paletteEl.innerHTML = PALETTE_COLORS.map((color) => `
        <button type="button" data-color="${color}" class="color-swatch w-7 h-7 rounded-full border border-slate-300 shadow-sm transition hover:scale-110 flex items-center justify-center ${color === selectedColor ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}" style="background-color: ${color}">
        </button>
    `).join("");

    paletteEl.querySelectorAll(".color-swatch").forEach(btn => {
        btn.addEventListener("click", () => setColor(btn.getAttribute("data-color")));
    });

    document.getElementById("customColorPicker").addEventListener("input", (e) => setColor(e.target.value));
}

function setColor(color) {
    selectedColor = color;
    document.getElementById("customColorPicker").value = color;
    
    document.querySelectorAll(".color-swatch").forEach(btn => {
        if (btn.getAttribute("data-color") === color) {
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

    currentTileLayer = L.tileLayer(TILE_LAYERS.pale, {
        maxZoom: 18,
        crossOrigin: true,
        attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
    }).addTo(map);
}

function bindEvents() {
    document.getElementById("btnPaintMode").addEventListener("click", () => setToolMode("paint"));
    document.getElementById("btnEraserMode").addEventListener("click", () => setToolMode("eraser"));

    document.getElementById("btnFillAll").addEventListener("click", fillAllCurrentPref);
    document.getElementById("btnClearAll").addEventListener("click", clearAllCurrentPref);

    document.getElementById("btnResetView").addEventListener("click", fitToCurrentBounds);

    document.getElementById("btnExportJson").addEventListener("click", exportStateJson);
    document.getElementById("btnImportJson").addEventListener("change", importStateJson);
    document.getElementById("btnExportPng").addEventListener("click", exportMapImage);
    document.getElementById("btnExportSvg").addEventListener("click", exportMapSvg);

    document.getElementById("bgColorPicker").addEventListener("input", (e) => {
        applyMapBgColor(e.target.value);
        saveToLocalStorage();
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

        const updateBoundarySetting = () => {
            boundarySettings[item.type] = {
                show: chkEl.checked,
                color: document.getElementById(item.color).value,
                weight: parseFloat(document.getElementById(item.weight).value),
                style: document.getElementById(item.style).value
            };
            renderBoundaryLayers();
            saveToLocalStorage();
        };

        chkEl.addEventListener("change", updateBoundarySetting);
        document.getElementById(item.color)?.addEventListener("input", updateBoundarySetting);
        document.getElementById(item.weight)?.addEventListener("change", updateBoundarySetting);
        document.getElementById(item.style)?.addEventListener("change", updateBoundarySetting);
    });

    document.querySelectorAll(".tile-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tileType = btn.getAttribute("data-tile");
            document.querySelectorAll(".tile-btn").forEach(b => {
                b.classList.remove("active", "bg-white", "text-indigo-600", "shadow-sm");
                b.classList.add("text-slate-600");
            });
            btn.classList.add("active", "bg-white", "text-indigo-600", "shadow-sm");
            btn.classList.remove("text-slate-600");

            if (currentTileLayer) {
                map.removeLayer(currentTileLayer);
                currentTileLayer = null;
            }

            if (tileType !== "none" && TILE_LAYERS[tileType]) {
                currentTileLayer = L.tileLayer(TILE_LAYERS[tileType], {
                    maxZoom: 18,
                    crossOrigin: true,
                    attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
                }).addTo(map);
            }
        });
    });
}

function renderGeoJson(data, topologyFeatures) {
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }

    currentCityMap = {};

    const filteredFeatures = data.features.filter(feature => {
        const code = getCityCode(feature.properties);
        const islandPrefCode = isIslandMunicipality(code, feature.properties);
        if (islandPrefCode && includeIslands[islandPrefCode] === false) {
            return false;
        }
        return true;
    });

    const filteredTopology = (topologyFeatures || data.features).filter(feature => {
        const code = getCityCode(feature.properties);
        const islandPrefCode = isIslandMunicipality(code, feature.properties);
        if (islandPrefCode && includeIslands[islandPrefCode] === false) {
            return false;
        }
        return true;
    });

    const filteredGeoJson = {
        type: "FeatureCollection",
        features: filteredFeatures
    };

    const selectedSet = new Set(
        selectedPrefCodes.includes("ALL") ? PREFECTURES.map(p => p.code) : selectedPrefCodes
    );

    extractBoundaries(filteredTopology, selectedSet);

    geojsonLayer = L.geoJSON(filteredGeoJson, {
        style: featureStyle,
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const code = getCityCode(props);
            const name = getCityName(props);
            const prefCode = props.N03_007 ? String(props.N03_007).padStart(5, "0").substring(0, 2) : "";
            const prefName = props.N03_001 || getPrefName(prefCode) || "都道府県";

            currentCityMap[code] = { name, prefCode, prefName };

            layer.on({
                mouseover: (e) => {
                    const l = e.target;
                    l.setStyle({ fillOpacity: 0.95 });
                    showHoverCard(true, prefName, name, code);
                },
                mouseout: (e) => {
                    geojsonLayer.resetStyle(e.target);
                    showHoverCard(false);
                },
                click: () => handleCityClick(code)
            });
        }
    }).addTo(map);

    renderBoundaryLayers();
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
                const p1 = ring[i];
                const p2 = ring[i + 1];

                const x1 = Math.round(p1[0] * SCALE);
                const y1 = Math.round(p1[1] * SCALE);
                const x2 = Math.round(p2[0] * SCALE);
                const y2 = Math.round(p2[1] * SCALE);

                if (x1 === x2 && y1 === y2) continue;

                const k1 = `${x1}_${y1}`;
                const k2 = `${x2}_${y2}`;
                const key = k1 < k2 ? `${k1}:${k2}` : `${k2}:${k1}`;

                if (!edgeMap.has(key)) {
                    edgeMap.set(key, { p1, p2, f1: meta, f2: null });
                } else {
                    const existing = edgeMap.get(key);
                    if (existing.f1.cityCode !== meta.cityCode) {
                        existing.f2 = meta;
                    }
                }
            }
        }

        const geom = feature.geometry;
        if (geom) {
            if (geom.type === "Polygon") {
                geom.coordinates.forEach(processRing);
            } else if (geom.type === "MultiPolygon") {
                geom.coordinates.forEach(poly => poly.forEach(processRing));
            }
        }
    });

    const coastLines = [];
    const prefLines = [];
    const cityLines = [];
    const countyLines = [];
    const wardLines = [];

    edgeMap.forEach(({ p1, p2, f1, f2 }) => {
        const f1Selected = f1 && selectedPrefSet.has(f1.prefCode);
        const f2Selected = f2 && selectedPrefSet.has(f2.prefCode);

        if (!f1Selected && !f2Selected) return;

        if (f2) {
            if (f1.prefCode !== f2.prefCode) {
                prefLines.push([p1, p2]);
            } else if (f1.cityCode !== f2.cityCode) {
                if (f1Selected && f2Selected) {
                    if (f1.seireiName && f2.seireiName && f1.seireiName === f2.seireiName) {
                        wardLines.push([p1, p2]);
                    } else if (f1.countyName && f2.countyName && f1.countyName === f2.countyName) {
                        countyLines.push([p1, p2]);
                    } else {
                        cityLines.push([p1, p2]);
                    }
                }
            }
        } else {
            const activeMeta = f1Selected ? f1 : f2;
            if (LANDLOCKED_PREFS.has(activeMeta.prefCode)) {
                prefLines.push([p1, p2]);
            } else {
                coastLines.push([p1, p2]);
            }
        }
    });

    boundaryGeoJsons = {
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

        const setting = boundarySettings[type];
        const geojson = boundaryGeoJsons[type];

        if (setting && setting.show && geojson && geojson.geometry.coordinates.length > 0) {
            let dashArray = null;
            if (setting.style === "dashed") dashArray = "6, 4";
            else if (setting.style === "dotted") dashArray = "2, 3";

            boundaryLayers[type] = L.geoJSON(geojson, {
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

            if (boundaryLayers[type].bringToFront) {
                boundaryLayers[type].bringToFront();
            }
        }
    });
}

function bringBoundariesToFront() {
    ["ward", "county", "city", "pref", "coast"].forEach(type => {
        if (boundaryLayers[type] && boundaryLayers[type].bringToFront) {
            boundaryLayers[type].bringToFront();
        }
    });
}

function featureStyle(feature) {
    const code = getCityCode(feature.properties);
    const colored = colorState[code];

    if (colored) {
        return {
            fillColor: colored,
            fillOpacity: 0.85,
            stroke: false
        };
    } else {
        return {
            fillColor: "#ffffff",
            fillOpacity: 0.45,
            stroke: false
        };
    }
}

function handleCityClick(code) {
    if (activeTool === "paint") {
        colorState[code] = selectedColor;
    } else {
        delete colorState[code];
    }

    geojsonLayer.eachLayer(layer => {
        if (getCityCode(layer.feature.properties) === code) {
            layer.setStyle(featureStyle(layer.feature));
        }
    });

    bringBoundariesToFront();

    saveToLocalStorage();
    updateUIStats();
}

function fillAllCurrentPref() {
    Object.keys(currentCityMap).forEach(code => {
        colorState[code] = selectedColor;
    });
    refreshLayerStyles();
    saveToLocalStorage();
    updateUIStats();
    showToast(`${getSelectedPrefLabel(selectedPrefCodes)}を表示エリア全塗りしました`);
}

function clearAllCurrentPref() {
    Object.keys(currentCityMap).forEach(code => {
        delete colorState[code];
    });
    refreshLayerStyles();
    saveToLocalStorage();
    updateUIStats();
    showToast(`${getSelectedPrefLabel(selectedPrefCodes)}の色塗りをクリアしました`);
}

function refreshLayerStyles() {
    if (!geojsonLayer) return;
    geojsonLayer.eachLayer(layer => {
        layer.setStyle(featureStyle(layer.feature));
    });
    bringBoundariesToFront();
}

function fitToCurrentBounds() {
    if (geojsonLayer && map) {
        map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
    }
}

function updateUIStats() {
    const prefName = getSelectedPrefLabel(selectedPrefCodes);
    document.getElementById("currentPrefName").textContent = prefName;

    const allCodes = Object.keys(currentCityMap);
    const total = allCodes.length;
    const coloredCodes = allCodes.filter(code => colorState[code]);
    const count = coloredCodes.length;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

    document.getElementById("coloredCount").textContent = count;
    document.getElementById("totalCount").textContent = total;
    document.getElementById("progressPercent").textContent = `${percent}%`;
    document.getElementById("progressBar").style.width = `${percent}%`;
    document.getElementById("coloredBadge").textContent = `${count}件`;

    const listEl = document.getElementById("coloredCityList");
    if (count === 0) {
        listEl.innerHTML = `<div class="text-slate-400 text-center py-6 text-xs">まだ塗りつぶされた市区町村はありません</div>`;
        return;
    }

    const isMultiOrNational = selectedPrefCodes.includes("ALL") || selectedPrefCodes.length > 1;

    listEl.innerHTML = coloredCodes.map(code => {
        const city = currentCityMap[code];
        const color = colorState[code];
        return `
            <div class="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition">
                <div class="flex items-center gap-2 overflow-hidden">
                    <span class="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs shrink-0" style="background-color: ${color}"></span>
                    <span class="font-medium text-slate-700 truncate">
                        ${isMultiOrNational && city.prefName ? `<span class="text-slate-400 text-[10px] mr-1">[${city.prefName}]</span>` : ''}${city.name}
                    </span>
                </div>
                <button onclick="handleCityClick('${code}')" class="text-slate-400 hover:text-rose-500 p-1 transition shrink-0" title="消去">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
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
    if (show) {
        document.getElementById("loadingText").textContent = text;
        overlay.classList.remove("hidden");
    } else {
        overlay.classList.add("hidden");
    }
}

function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
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
        colorState: colorState
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `japan_map_color_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast("塗り状態をJSONファイルに保存しました");
}

function importStateJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data && data.colorState) {
                colorState = { ...colorState, ...data.colorState };
                refreshLayerStyles();
                saveToLocalStorage();
                updateUIStats();
                showToast("JSONから塗り状態を復元しました");
            } else {
                throw new Error("無効なJSONデータ構造です");
            }
        } catch (err) {
            showToast("ファイルの読み込みに失敗しました", "error");
        }
    };
    reader.readAsText(file);
    e.target.value = "";
}

function exportMapImage() {
    showLoading(true, "高解像度画像を生成中...");

    if (!map || !geojsonLayer) {
        showLoading(false);
        return;
    }

    map.invalidateSize();

    const bounds = geojsonLayer.getBounds();
    if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], animate: false });
    }

    setTimeout(() => {
        leafletImage(map, function(err, canvas) {
            if (err || !canvas) {
                console.error("leafletImage error:", err);
                const mapContainer = document.getElementById("map");
                html2canvas(mapContainer, {
                    useCORS: true,
                    allowTaint: true,
                    logging: false
                }).then(fallbackCanvas => {
                    saveCanvasAsImage(fallbackCanvas);
                }).catch(e => {
                    showLoading(false);
                    showToast("画像の生成に失敗しました", "error");
                });
                return;
            }

            saveCanvasAsImage(canvas);
        });
    }, 300);
}

function saveCanvasAsImage(canvas) {
    try {
        const margin = 40;
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = canvas.width + margin * 2;
        finalCanvas.height = canvas.height + margin * 2;
        const ctx = finalCanvas.getContext("2d");

        ctx.fillStyle = mapBgColor;
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        ctx.drawImage(canvas, margin, margin);

        const link = document.createElement("a");
        const labelName = getSelectedPrefLabel(selectedPrefCodes);
        link.download = `japan_map_${labelName}_${new Date().toISOString().slice(0,10)}.png`;
        link.href = finalCanvas.toDataURL("image/png");
        link.click();
        showLoading(false);
        showToast("地図をPNG画像として保存しました");
    } catch (err) {
        console.error(err);
        showLoading(false);
        showToast("画像の保存処理に失敗しました", "error");
    }
}

function exportMapSvg() {
    if (!currentGeoJsonData || !currentGeoJsonData.features) {
        showToast("データが読み込まれていません", "error");
        return;
    }

    showLoading(true, "SVGベクター画像を生成中...");

    setTimeout(() => {
        try {
            const exportFeatures = currentGeoJsonData.features.filter(feature => {
                const code = getCityCode(feature.properties);
                const islandPrefCode = isIslandMunicipality(code, feature.properties);
                if (islandPrefCode && includeIslands[islandPrefCode] === false) {
                    return false;
                }
                return true;
            });

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

            function processCoords(coords) {
                if (typeof coords[0] === 'number') {
                    const [lon, lat] = coords;
                    const [mx, my] = geoToMercator(lon, lat);
                    if (mx < minX) minX = mx;
                    if (mx > maxX) maxX = mx;
                    if (my < minY) minY = my;
                    if (my > maxY) maxY = my;
                } else {
                    coords.forEach(processCoords);
                }
            }

            exportFeatures.forEach(f => {
                if (f.geometry && f.geometry.coordinates) {
                    processCoords(f.geometry.coordinates);
                }
            });

            const viewBoxWidth = 1200;
            const padding = 20;
            const mercWidth = maxX - minX;
            const mercHeight = maxY - minY;
            const scale = (viewBoxWidth - 2 * padding) / mercWidth;
            const viewBoxHeight = Math.round(mercHeight * scale + 2 * padding);

            function project([lon, lat]) {
                const [mx, my] = geoToMercator(lon, lat);
                const sx = (padding + (mx - minX) * scale).toFixed(2);
                const sy = (padding + (maxY - my) * scale).toFixed(2);
                return `${sx},${sy}`;
            }

            function ringToD(ring) {
                return "M " + ring.map(project).join(" L ") + " Z";
            }

            function geomToD(geom) {
                if (geom.type === "Polygon") {
                    return geom.coordinates.map(ringToD).join(" ");
                } else if (geom.type === "MultiPolygon") {
                    return geom.coordinates.map(poly => poly.map(ringToD).join(" ")).join(" ");
                }
                return "";
            }

            function lineToD(lines) {
                return lines.map(line => `M ${project(line[0])} L ${project(line[1])}`).join(" ");
            }

            let pathsHtml = "";
            exportFeatures.forEach(feature => {
                const props = feature.properties;
                const code = getCityCode(props);
                const name = getCityName(props);
                const prefCode = props.N03_007 ? String(props.N03_007).padStart(5, "0").substring(0, 2) : "";
                const prefName = props.N03_001 || getPrefName(prefCode) || "都道府県";
                const colored = Boolean(colorState[code]);
                const fillColor = colored ? colorState[code] : "#ffffff";
                const fillOpacity = colored ? 0.85 : 0.45;
                const d = geomToD(feature.geometry);

                if (d) {
                    pathsHtml += `    <path d="${d}" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="none" data-code="${code}" data-name="${name}" data-pref="${prefName}"><title>${prefName} ${name}</title></path>\n`;
                }
            });

            let boundarySvgHtml = "";
            ["ward", "county", "city", "pref", "coast"].forEach(type => {
                const setting = boundarySettings[type];
                const geojson = boundaryGeoJsons[type];
                if (setting && setting.show && geojson && geojson.geometry.coordinates.length > 0) {
                    let dashAttr = "";
                    if (setting.style === "dashed") dashAttr = 'stroke-dasharray="6,4"';
                    else if (setting.style === "dotted") dashAttr = 'stroke-dasharray="2,3"';

                    const d = lineToD(geojson.geometry.coordinates);
                    if (d) {
                        boundarySvgHtml += `    <path d="${d}" fill="none" stroke="${setting.color}" stroke-width="${setting.weight}" ${dashAttr} stroke-linecap="round" stroke-linejoin="round"/>\n`;
                    }
                }
            });

            const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}">
  <style>
    path { transition: fill 0.2s; }
  </style>
  <rect width="100%" height="100%" fill="${mapBgColor}"/>
  <g id="municipalities">
${pathsHtml}  </g>
  <g id="boundaries">
${boundarySvgHtml}  </g>
</svg>`;

            const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const labelName = getSelectedPrefLabel(selectedPrefCodes);
            a.download = `japan_map_${labelName}_${new Date().toISOString().slice(0,10)}.svg`;
            a.click();
            URL.revokeObjectURL(url);

            showLoading(false);
            showToast("SVGベクター画像を保存しました");
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