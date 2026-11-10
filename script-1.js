// script-1.js

export const REGIONS = [
    { id: "hokkaido_tohoku", name: "北海道・東北", codes: ["01", "02", "03", "04", "05", "06", "07"] },
    { id: "kanto", name: "関東", codes: ["08", "09", "10", "11", "12", "13", "14"] },
    { id: "chubu", name: "中部", codes: ["15", "16", "17", "18", "19", "20", "21", "22", "23"] },
    { id: "kansai", name: "関西", codes: ["24", "25", "26", "27", "28", "29", "30"] },
    { id: "chugoku", name: "中国", codes: ["31", "32", "33", "34", "35"] },
    { id: "shikoku", name: "四国", codes: ["36", "37", "38", "39"] },
    { id: "kyushu_okinawa", name: "九州・沖縄", codes: ["40", "41", "42", "43", "44", "45", "46", "47"] }
];

export const PREFECTURES = [
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

export const BASE_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", 
    "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"
];

export const TILE_LAYERS = {
    gsi_std: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
    gsi_pale: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    gsi_photo: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};

export const state = {
    map: null,
    geojsonLayer: null,
    boundaryLayers: {},
    boundaryGeoJsons: {},
    nationalFeaturesCache: null,
    currentGeoJsonData: null,
    currentCityMap: {},
    
    mapMode: "city",
    pendingMapMode: null,
    selectedPrefCodes: ["ALL"],
    tempSelectedCodes: ["ALL"],
    includeIslands: { "13": true, "46": true, "47": true },
    tempIncludeIslands: { "13": true, "46": true, "47": true },
    
    activeTool: "paint",
    selectedColor: BASE_COLORS[0],
    customColors: ["#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"],
    
    colorState: {},
    railwayColorState: {},
    stationColorState: {},
    segmentColorState: {}, // ← 駅間（区間）ごとの色・太さ設定用
    
    defaultLandColor: "#ffffff",
    enableLandOpacity: false,
    defaultLandOpacity: 1.0,
    mapBgColor: "#f8fafc",
    showBaseMap: false,
    selectedTileType: "gsi_pale",
    currentTileLayer: null,
    bgImageDataUrl: null,
    activeTab: "paint",
    
    boundarySettings: {
        coast: { show: true, color: "#000000", weight: 1.5, style: "solid" },
        pref: { show: true, color: "#475569", weight: 1.2, style: "solid" },
        city: { show: true, color: "#94a3b8", weight: 0.8, style: "solid" },
        county: { show: false, color: "#cbd5e1", weight: 0.6, style: "dashed" },
        ward: { show: false, color: "#e2e8f0", weight: 0.5, style: "dotted" }
    },
    
    railwayConfig: {
        show: false,
        line: { color: "#334155", weight: 2.0, style: "solid" },
        station: { show: true, color: "#1e293b", radius: 5, strokeColor: "#ffffff", strokeWeight: 2 }
    },
    
    currentSelectedLineFeature: null,
    currentSelectedStationFeature: null,
    deferredPrompt: null,
    isRefreshing: false
};

export function getFeaturePrefCode(feature) {
    const props = feature.properties || {};
    let code = props.N03_007 || props.prefCode || props.code || "";
    if (code && code.length >= 2) return code.substring(0, 2);
    return "00";
}

export function getCityCode(properties) {
    return properties.N03_007 || properties.code || "";
}

export function getCityName(properties) {
    return properties.N03_004 || properties.N03_003 || properties.N03_001 || "不明な地域";
}

export function getPrefName(prefCode) {
    const pref = PREFECTURES.find(p => p.code === prefCode);
    return pref ? pref.name : "";
}

export function getSelectedPrefLabel(codes) {
    if (codes.includes("ALL") || codes.length === 47) return "全国（すべての都道府県）";
    if (codes.length === 0) return "未選択";
    if (codes.length === 1) return getPrefName(codes[0]);
    return `${getPrefName(codes[0])} ほか${codes.length - 1}県`;
}

export function isIslandMunicipality(cityCode, properties) {
    const prefCode = cityCode.substring(0, 2);
    if (!["13", "46", "47"].includes(prefCode)) return null;

    const name = (properties.N03_004 || "") + (properties.N03_003 || "");
    if (prefCode === "13") {
        if (name.includes("大島") || name.includes("八丈") || name.includes("三宅") || name.includes("小笠原") || name.includes("神津島") || name.includes("新島") || name.includes("利島") || name.includes("青ヶ島") || name.includes("御蔵島")) return "13";
    } else if (prefCode === "46") {
        if (name.includes("奄美") || name.includes("屋久島") || name.includes("種子島") || name.includes("西之表") || name.includes("大島郡") || name.includes("三島") || name.includes("十島")) return "46";
    } else if (prefCode === "47") {
        if (name.includes("宮古") || name.includes("八重山") || name.includes("石垣") || name.includes("久米島") || name.includes("渡嘉敷") || name.includes("座間味") || name.includes("粟国") || name.includes("渡名喜") || name.includes("南大東") || name.includes("北大東") || name.includes("伊平屋") || name.includes("伊是名")) return "47";
    }
    return null;
}

export function getLineName(props) {
    return props.N02_003 || props.line_name || props.name || "";
}

export function getLineCompany(props) {
    return props.N02_004 || props.company || "";
}

export function getLineKey(props) {
    const name = getLineName(props);
    const company = getLineCompany(props);
    return `${company}_${name}`;
}

export function getStationName(props) {
    return props.N02_005 || props.station_name || props.st_name || "";
}

export function getStationKey(props) {
    const lineKey = getLineKey(props);
    const stName = getStationName(props);
    return `${lineKey}_st_${stName}`;
}

export async function fetchRailwayData() {
    try {
        const res = await fetch("https://raw.githubusercontent.com/smartnews-smri/japan-topography/main/data/railway/N02-21_RailroadSection.json");
        if (!res.ok) throw new Error("鉄道データの取得に失敗");
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

export function getCenterLatLng(coords) {
    if (!coords || coords.length === 0) return [0, 0];
    let flat = [];
    const extract = (arr) => {
        if (typeof arr[0] === 'number') flat.push(arr);
        else arr.forEach(extract);
    };
    extract(coords);
    if (flat.length === 0) return [0, 0];
    let sumLat = 0, sumLng = 0;
    flat.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
    return [sumLat / flat.length, sumLng / flat.length];
}

export function getRailwayFeatureStyle(feature) {
    const props = feature.properties || {};
    const lineKey = getLineKey(props);
    const stKey = getStationKey(props);

    const isStation = Boolean(getStationName(props));
    
    if (isStation) {
        const custom = state.stationColorState[stKey];
        return {
            fillColor: custom?.color || state.railwayConfig.station.color,
            radius: custom?.radius !== undefined ? custom.radius : state.railwayConfig.station.radius,
            color: custom?.strokeColor || state.railwayConfig.station.strokeColor,
            weight: custom?.strokeWeight !== undefined ? custom.strokeWeight : state.railwayConfig.station.strokeWeight,
            opacity: 0.95
        };
    } else {
        const custom = state.railwayColorState[lineKey];
        const coloredHex = custom ? (typeof custom === 'string' ? custom : custom.color) : null;
        return {
            color: coloredHex || state.railwayConfig.line.color,
            weight: state.railwayConfig.line.weight,
            dashArray: state.railwayConfig.line.style === "dashed" ? "6,4" : (state.railwayConfig.line.style === "dotted" ? "2,3" : null),
            opacity: 0.95
        };
    }
}

export function featureStyle(feature) {
    const code = state.mapMode === "pref" ? getFeaturePrefCode(feature) : getCityCode(feature.properties);
    const color = state.colorState[code];
    const opacity = state.enableLandOpacity ? state.defaultLandOpacity : 1.0;

    return {
        fillColor: color || state.defaultLandColor,
        fillOpacity: color ? 1.0 : opacity,
        color: "transparent",
        weight: 0,
        opacity: 0
    };
}

export function extractBoundaries(features, selectedPrefSet) {
    state.boundaryGeoJsons = {
        coast: { type: "FeatureCollection", features: [] },
        pref: { type: "FeatureCollection", features: [] },
        city: { type: "FeatureCollection", features: [] },
        county: { type: "FeatureCollection", features: [] },
        ward: { type: "FeatureCollection", features: [] }
    };
}

export function saveToLocalStorage() {
    try {
        const data = {
            mapMode: state.mapMode,
            selectedPrefCodes: state.selectedPrefCodes,
            includeIslands: state.includeIslands,
            colorState: state.colorState,
            railwayColorState: state.railwayColorState,
            stationColorState: state.stationColorState,
            segmentColorState: state.segmentColorState, // ← 保存に追加
            defaultLandColor: state.defaultLandColor,
            enableLandOpacity: state.enableLandOpacity,
            defaultLandOpacity: state.defaultLandOpacity,
            mapBgColor: state.mapBgColor,
            showBaseMap: state.showBaseMap,
            selectedTileType: state.selectedTileType,
            customColors: state.customColors,
            boundarySettings: state.boundarySettings,
            railwayConfig: state.railwayConfig
        };
        localStorage.setItem("japan_map_paint_state", JSON.stringify(data));
    } catch (e) {
        console.error("LocalStorage保存エラー:", e);
    }
}

export function loadFromLocalStorage() {
    try {
        const str = localStorage.getItem("japan_map_paint_state");
        if (!str) return;
        const data = JSON.parse(str);
        if (data.mapMode) state.mapMode = data.mapMode;
        if (data.selectedPrefCodes) state.selectedPrefCodes = data.selectedPrefCodes;
        if (data.includeIslands) state.includeIslands = data.includeIslands;
        if (data.colorState) state.colorState = data.colorState;
        if (data.railwayColorState) state.railwayColorState = data.railwayColorState;
        if (data.stationColorState) state.stationColorState = data.stationColorState;
        if (data.segmentColorState) state.segmentColorState = data.segmentColorState; // ← 復元に追加
        if (data.defaultLandColor) state.defaultLandColor = data.defaultLandColor;
        if (data.enableLandOpacity !== undefined) state.enableLandOpacity = data.enableLandOpacity;
        if (data.defaultLandOpacity !== undefined) state.defaultLandOpacity = data.defaultLandOpacity;
        if (data.mapBgColor) state.mapBgColor = data.mapBgColor;
        if (data.showBaseMap !== undefined) state.showBaseMap = data.showBaseMap;
        if (data.selectedTileType) state.selectedTileType = data.selectedTileType;
        if (data.customColors) state.customColors = data.customColors;
        if (data.boundarySettings) state.boundarySettings = { ...state.boundarySettings, ...data.boundarySettings };
        if (data.railwayConfig) state.railwayConfig = { ...state.railwayConfig, ...data.railwayConfig };
    } catch (e) {
        console.error("LocalStorage読み込みエラー:", e);
    }
}

export function showHoverCard(show, title1 = "", title2 = "", code = "") {
    const card = document.getElementById("hoverCard");
    if (!card) return;
    if (show) {
        card.classList.remove("hidden");
        document.getElementById("hoverTitle1").textContent = title1;
        document.getElementById("hoverTitle2").textContent = title2;
        document.getElementById("hoverCode").textContent = code ? `(コード: ${code})` : "";
    } else {
        card.classList.add("hidden");
    }
}

export function showLoading(show, message = "読み込み中...") {
    const loader = document.getElementById("loadingSpinner");
    if (!loader) return;
    if (show) {
        loader.classList.remove("hidden");
        const msgEl = document.getElementById("loadingMessage");
        if (msgEl) msgEl.textContent = message;
    } else {
        loader.classList.add("hidden");
    }
}

export function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-5 right-5 z-[9999] px-4 py-2.5 rounded-lg shadow-lg text-xs font-bold text-white transition-all transform translate-y-2 opacity-0 ${
        type === "error" ? "bg-rose-600" : "bg-indigo-600"
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.remove("translate-y-2", "opacity-0"); }, 10);
    setTimeout(() => {
        toast.classList.add("translate-y-2", "opacity-0");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

export function exportStateJson() {
    const data = {
        version: 1,
        timestamp: new Date().toISOString(),
        mapMode: state.mapMode,
        selectedPrefCodes: state.selectedPrefCodes,
        colorState: state.colorState,
        railwayColorState: state.railwayColorState,
        stationColorState: state.stationColorState,
        segmentColorState: state.segmentColorState, // ← JSON出力に追加
        defaultLandColor: state.defaultLandColor,
        enableLandOpacity: state.enableLandOpacity,
        defaultLandOpacity: state.defaultLandOpacity,
        mapBgColor: state.mapBgColor,
        showBaseMap: state.showBaseMap,
        selectedTileType: state.selectedTileType,
        customColors: state.customColors,
        railwayConfig: state.railwayConfig
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `japan_map_config_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("設定ファイルを保存しました");
}

export function exportMapImage() {
    showToast("画像書き出し中...");
}

export function exportMapSvg() {
    showToast("SVG書き出し中...");
}
