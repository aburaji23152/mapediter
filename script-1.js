// 定数データ定義
export const REGIONS = [
    { id: "hokkaido-tohoku", name: "北海道・東北", codes: ["01", "02", "03", "04", "05", "06", "07"] },
    { id: "kanto", name: "関東", codes: ["08", "09", "10", "11", "12", "13", "14"] },
    { id: "chubu", name: "中部", codes: ["15", "16", "17", "18", "19", "20", "21", "22", "23"] },
    { id: "kinki", name: "近畿", codes: ["24", "25", "26", "27", "28", "29", "30"] },
    { id: "chugoku-shikoku", name: "中国・四国", codes: ["31", "32", "33", "34", "35", "36", "37", "38", "39"] },
    { id: "kyushu-okinawa", name: "九州・沖縄", codes: ["40", "41", "42", "43", "44", "45", "46", "47"] }
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
    "#bfdbfe", "#fca5a5", "#86efac", "#fde047", "#d8b4fe", "#f9a8d4",
    "#a5f3fc", "#fdba74", "#bef264", "#c7d2fe", "#99f6e4", "#cbd5e1",
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
    "#06b6d4", "#f97316", "#84cc16", "#6366f1", "#14b8a6", "#64748b"
];

export const TILE_LAYERS = {
    pale: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    std: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
};

export const LANDLOCKED_PREFS = new Set(["09", "10", "11", "19", "20", "21", "25", "29"]);

// LocalStorage キー定数
export const STORAGE_KEY_MAP_MODE = "japan_map_mode_v1";
export const STORAGE_KEY_COLOR_STATE = "japan_map_color_state_v1";
export const STORAGE_KEY_RAILWAY_COLOR_STATE = "japan_map_railway_color_state_v1";
export const STORAGE_KEY_STATION_COLOR_STATE = "japan_map_station_color_state_v1";
export const STORAGE_KEY_SELECTED_PREFS = "japan_map_selected_prefs_v1";
export const STORAGE_KEY_ISLANDS = "japan_map_include_islands_v1";
export const STORAGE_KEY_BOUNDARIES = "japan_map_boundaries_v1";
export const STORAGE_KEY_RAILWAY_CONFIG = "japan_map_railway_config_v1";
export const STORAGE_KEY_BGCOLOR = "japan_map_bgcolor_v1";
export const STORAGE_KEY_LANDCOLOR = "japan_map_landcolor_v1";
export const STORAGE_KEY_ENABLE_OPACITY = "japan_map_enable_opacity_v1";
export const STORAGE_KEY_LANDOPACITY = "japan_map_landopacity_v1";
export const STORAGE_KEY_BGIMAGE = "japan_map_bgimage_v1";
export const STORAGE_KEY_SHOW_BASEMAP = "japan_map_show_basemap_v1";
export const STORAGE_KEY_TILE_TYPE = "japan_map_tile_type_v1";
export const STORAGE_KEY_CUSTOM_COLORS = "japan_map_custom_colors_v1";

// --- アプリケーション一括状態オブジェクト ---
export const state = {
    customColors: [
        "#e0e7ff", "#ffe4e6", "#dcfce7", "#fef9c3", "#f3e8ff", "#fce7f3",
        "#cffafe", "#ffedd5", "#ecfccb", "#e0e7ff", "#ccfbf1", "#f1f5f9"
    ],
    mapMode: "city",
    pendingMapMode: null,
    activeTab: "paint",
    map: null,
    currentTileLayer: null,
    selectedTileType: "pale",
    showBaseMap: true,
    geojsonLayer: null,
    currentGeoJsonData: null,
    selectedPrefCodes: ["ALL"],
    tempSelectedCodes: ["ALL"],
    activeTool: "paint",
    selectedColor: BASE_COLORS[0],
    colorState: {},
    railwayColorState: {},
    stationColorState: {},
    currentSelectedLineFeature: null,
    currentSelectedStationFeature: null,
    currentCityMap: {},
    nationalFeaturesCache: null,
    railwayGeoJsonCache: null,
    defaultLandColor: "#ffffff",
    enableLandOpacity: false,
    defaultLandOpacity: 0.45,
    bgImageDataUrl: null,
    mapBgColor: "#f1f5f9",
    boundarySettings: {
        coast: { show: true, color: "#1e293b", weight: 2.0, style: "solid" },
        pref: { show: true, color: "#0f172a", weight: 2.5, style: "solid" },
        city: { show: true, color: "#475569", weight: 1.0, style: "solid" },
        county: { show: true, color: "#64748b", weight: 1.0, style: "dotted" },
        ward: { show: true, color: "#64748b", weight: 1.0, style: "dashed" }
    },
    railwayConfig: {
        show: false,
        line: {
            color: "#334155",
            weight: 2.0,
            style: "solid",
            opacity: 0.95
        },
        station: {
            show: true,
            color: "#1e293b",
            radius: 5,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            opacity: 0.95
        }
    },
    boundaryGeoJsons: { coast: null, pref: null, city: null, county: null, ward: null, railway: null },
    boundaryLayers: { coast: null, pref: null, city: null, county: null, ward: null, railway: null },
    includeIslands: { "13": true, "46": true, "47": true },
    tempIncludeIslands: { "13": true, "46": true, "47": true },
    deferredPrompt: null,
    isRefreshing: false
};

// ユーティリティ・補助関数
export function getFeaturePrefCode(feature) {
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

export function getLineName(props) {
    if (!props) return "";
    return props.N02_003 || props.line_name || props.line || props.name || props.title || "";
}

export function getLineCompany(props) {
    if (!props) return "";
    return props.N02_004 || props.company || props.company_name || props.operator || props.railway_company || props.corp_name || props.provider || props.N02_002 || "";
}

export function getLineKey(props) {
    if (!props) return "";
    const line = getLineName(props);
    if (!line) return "";
    const company = getLineCompany(props);
    const type = props.N02_001 || "";
    const pref = props.pref || props.N03_001 || "";
    return `${company || 'COMP_UNKNOWN'}::${type}::${pref}::${line}`;
}

export function getStationName(props) {
    if (!props) return "";
    return props.N02_005 || props.station_name || props.station || props.st_name || "";
}

export function getStationKey(props) {
    if (!props) return "";
    const st = getStationName(props);
    if (!st) return "";
    const line = getLineName(props);
    const company = getLineCompany(props);
    return `${company || 'COMP_UNKNOWN'}::${line || 'LINE_UNKNOWN'}::${st}`;
}

export async function fetchRailwayData(showToast) {
    if (state.railwayGeoJsonCache) return state.railwayGeoJsonCache;

    try {
        console.log("鉄道データ (路線区間・駅) の取得中...");

        const fetchFile = async (path) => {
            try {
                const res = await fetch(path);
                if (!res.ok) return null;
                return await res.json();
            } catch (e) {
                return null;
            }
        };

        const [railroadSection, stationData] = await Promise.all([
            fetchFile("./rail_data/N02-25_RailroadSection.geojson"),
            fetchFile("./rail_data/N02-25_Station.geojson")
        ]);

        let combinedFeatures = [];
        if (railroadSection && railroadSection.features) {
            combinedFeatures.push(...railroadSection.features);
        }
        if (stationData && stationData.features) {
            combinedFeatures.push(...stationData.features);
        }

        if (combinedFeatures.length === 0) {
            const fallback = await fetchFile("./rail_data/2026_1031.geojson");
            if (fallback && fallback.features) {
                combinedFeatures = fallback.features;
            }
        }

        if (combinedFeatures.length === 0) {
            throw new Error("鉄道データの読み込みに失敗しました。");
        }

        state.railwayGeoJsonCache = {
            type: "FeatureCollection",
            features: combinedFeatures
        };
        console.log("鉄道データの読み込み完了", combinedFeatures.length, "件");
        return state.railwayGeoJsonCache;

    } catch (e) {
        console.warn("鉄道データ取得エラー:", e);
        if (showToast) showToast("鉄道データの取得に失敗しました", "error");
        return null;
    }
}

export function getCenterLatLng(coords) {
    if (!coords || coords.length === 0) return [0, 0];
    let sumLon = 0, sumLat = 0, count = 0;
    
    function extract(c) {
        if (typeof c[0] === 'number') {
            sumLon += c[0];
            sumLat += c[1];
            count++;
        } else {
            c.forEach(extract);
        }
    }
    extract(coords);
    return count > 0 ? [sumLat / count, sumLon / count] : [0, 0];
}

export function getRailwayFeatureStyle(feature) {
    if (!state.railwayConfig.show) {
        return { opacity: 0, weight: 0 };
    }

    const geomType = feature.geometry?.type;
    const isStation = geomType === "Point" || Boolean(getStationName(feature.properties));

    if (isStation) {
        const st = state.railwayConfig.station || {};
        if (st.show === false) return { opacity: 0, fillOpacity: 0, weight: 0, radius: 0 };
        
        const stKey = getStationKey(feature.properties);
        const customSt = stKey ? state.stationColorState[stKey] : null;

        return {
            fillColor: (customSt && customSt.color) ? customSt.color : (st.color || "#1e293b"),
            color: (customSt && customSt.strokeColor) ? customSt.strokeColor : (st.strokeColor || "#ffffff"),
            weight: (customSt && customSt.strokeWeight !== undefined) ? customSt.strokeWeight : (st.strokeWeight !== undefined ? st.strokeWeight : 2),
            radius: (customSt && customSt.radius !== undefined) ? customSt.radius : (st.radius || 5),
            opacity: st.opacity !== undefined ? st.opacity : 0.95,
            fillOpacity: st.opacity !== undefined ? st.opacity : 0.95,
            interactive: true
        };
    } else {
        const ln = state.railwayConfig.line || {};
        let dashArray = null;
        if (ln.style === "dashed") dashArray = "6, 4";
        else if (ln.style === "dotted") dashArray = "2, 3";

        return {
            color: ln.color || "#334155",
            weight: ln.weight || 2.0,
            dashArray: dashArray,
            opacity: ln.opacity !== undefined ? ln.opacity : 0.95,
            lineCap: "round",
            lineJoin: "round",
            interactive: true
        };
    }
}

export function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_MAP_MODE, state.mapMode);
        localStorage.setItem(STORAGE_KEY_COLOR_STATE, JSON.stringify(state.colorState));
        localStorage.setItem(STORAGE_KEY_RAILWAY_COLOR_STATE, JSON.stringify(state.railwayColorState));
        localStorage.setItem(STORAGE_KEY_STATION_COLOR_STATE, JSON.stringify(state.stationColorState));
        localStorage.setItem(STORAGE_KEY_SELECTED_PREFS, JSON.stringify(state.selectedPrefCodes));
        localStorage.setItem(STORAGE_KEY_ISLANDS, JSON.stringify(state.includeIslands));
        localStorage.setItem(STORAGE_KEY_BOUNDARIES, JSON.stringify(state.boundarySettings));
        localStorage.setItem(STORAGE_KEY_RAILWAY_CONFIG, JSON.stringify(state.railwayConfig));
        localStorage.setItem(STORAGE_KEY_BGCOLOR, state.mapBgColor);
        localStorage.setItem(STORAGE_KEY_LANDCOLOR, state.defaultLandColor);
        localStorage.setItem(STORAGE_KEY_ENABLE_OPACITY, JSON.stringify(state.enableLandOpacity));
        localStorage.setItem(STORAGE_KEY_LANDOPACITY, state.defaultLandOpacity);
        localStorage.setItem(STORAGE_KEY_SHOW_BASEMAP, JSON.stringify(state.showBaseMap));
        localStorage.setItem(STORAGE_KEY_TILE_TYPE, state.selectedTileType);
        localStorage.setItem(STORAGE_KEY_CUSTOM_COLORS, JSON.stringify(state.customColors));
        if (state.bgImageDataUrl) localStorage.setItem(STORAGE_KEY_BGIMAGE, state.bgImageDataUrl);
        else localStorage.removeItem(STORAGE_KEY_BGIMAGE);
    } catch (e) {
        console.warn("LocalStorage 保存エラー:", e);
    }
}

export function loadFromLocalStorage() {
    try {
        const savedMode = localStorage.getItem(STORAGE_KEY_MAP_MODE);
        const savedState = localStorage.getItem(STORAGE_KEY_COLOR_STATE);
        const savedRailwayColors = localStorage.getItem(STORAGE_KEY_RAILWAY_COLOR_STATE);
        const savedStationColors = localStorage.getItem(STORAGE_KEY_STATION_COLOR_STATE);
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

        if (savedMode) state.mapMode = savedMode;
        if (savedState) state.colorState = JSON.parse(savedState) || {};
        if (savedRailwayColors) state.railwayColorState = JSON.parse(savedRailwayColors) || {};
        if (savedStationColors) state.stationColorState = JSON.parse(savedStationColors) || {};
        if (savedPrefs) state.selectedPrefCodes = JSON.parse(savedPrefs) || ["ALL"];
        if (savedIslands) state.includeIslands = { ...state.includeIslands, ...JSON.parse(savedIslands) };
        if (savedBoundaries) state.boundarySettings = { ...state.boundarySettings, ...JSON.parse(savedBoundaries) };
        if (savedRailway) {
            const parsed = JSON.parse(savedRailway);
            state.railwayConfig = {
                ...state.railwayConfig,
                ...parsed,
                line: { ...state.railwayConfig.line, ...(parsed.line || {}) },
                station: { ...state.railwayConfig.station, ...(parsed.station || {}) }
            };
        }
        if (savedBgColor) state.mapBgColor = savedBgColor;
        if (savedLandColor) state.defaultLandColor = savedLandColor;
        if (savedEnableOpacity !== null) state.enableLandOpacity = JSON.parse(savedEnableOpacity);
        if (savedLandOpacity !== null) state.defaultLandOpacity = parseFloat(savedLandOpacity);
        if (savedBgImage) state.bgImageDataUrl = savedBgImage;
        if (savedShowBaseMap !== null) state.showBaseMap = JSON.parse(savedShowBaseMap);
        if (savedTileType) state.selectedTileType = savedTileType;
        if (savedCustomColors) state.customColors = JSON.parse(savedCustomColors);
    } catch (e) {
        console.warn("LocalStorage 読み込みエラー:", e);
    }
}

export function isIslandMunicipality(code, props = null) {
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

export function getSelectedPrefLabel(codes) {
    if (!codes || codes.includes("ALL") || codes.length === 47 || codes.length === 0) return "全国（日本全体）";
    if (codes.length === 1) return getPrefName(codes[0]);
    const names = codes.map(c => getPrefName(c));
    return codes.length <= 2 ? names.join("・") : `${names[0]}・${names[1]} 外${codes.length - 2}県`;
}

export function getCityName(props) {
    if (!props) return "不明";
    const county = props.N03_003 ? props.N03_003 : "";
    const city = props.N03_004 ? props.N03_004 : (props.N03_001 || "");
    return county ? `${county}${city}` : city;
}

export function getCityCode(props) {
    if (!props) return "00000";
    const raw = props.N03_007 || props.N03_004 || "00000";
    const str = String(raw).trim();
    return str.length < 5 && !isNaN(str) ? str.padStart(5, "0") : str;
}

export function getPrefName(code) {
    if (code === "ALL") return "全国（日本全体）";
    const pref = PREFECTURES.find(p => p.code === code);
    return pref ? pref.name : "";
}

export function geoToMercator(lon, lat) {
    const x = lon * Math.PI / 180;
    const rad = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
    const y = Math.log(Math.tan(Math.PI / 4 + rad / 2));
    return [x, y];
}

export function generateMapSvgString() {
    if (!state.currentGeoJsonData || !state.currentGeoJsonData.features) return null;

    const exportFeatures = state.currentGeoJsonData.features.filter(feature => {
        const code = getCityCode(feature.properties);
        const islandPrefCode = isIslandMunicipality(code, feature.properties);
        return !(islandPrefCode && state.includeIslands[islandPrefCode] === false);
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

    function railwayToSvgPaths(geojson) {
        if (!geojson || !geojson.features || !state.railwayConfig.show) return "";
        let pathsHtml = "";
        geojson.features.forEach(f => {
            const geom = f.geometry;
            if (!geom) return;

            const isStation = Boolean(getStationName(f.properties));
            let style = getRailwayFeatureStyle(f);
            if (!style || style.opacity === 0) return;

            const lineKey = getLineKey(f.properties);
            if (!isStation && lineKey && state.railwayColorState[lineKey]) {
                style = {
                    ...style,
                    color: state.railwayColorState[lineKey],
                    weight: (state.railwayConfig.line.weight || 2.0) + 2.0,
                    opacity: 1.0
                };
            }

            let dashAttr = "";
            if (style.dashArray) dashAttr = `stroke-dasharray="${style.dashArray}"`;

            if (isStation) {
                if (state.railwayConfig.station.show === false) return;
                let coords = geom.type === "Point" ? geom.coordinates : getCenterLatLng(geom.coordinates);
                if (coords[0] !== 0 && coords[1] !== 0) {
                    const latlngCoord = geom.type === "Point" ? coords : [coords[1], coords[0]];
                    const ptStr = project(latlngCoord);
                    if (!ptStr.includes("NaN")) {
                        const [cx, cy] = ptStr.split(",");
                        pathsHtml += `    <circle cx="${cx}" cy="${cy}" r="${style.radius || 5}" fill="${style.fillColor}" stroke="${style.color}" stroke-width="${style.weight}" opacity="${style.opacity}"/>\n`;
                    }
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
        const code = state.mapMode === "pref" ? prefCode : cityCode;
        const name = state.mapMode === "pref" ? getPrefName(prefCode) : getCityName(props);
        const prefName = props.N03_001 || getPrefName(prefCode) || "都道府県";
        const colored = Boolean(state.colorState[code]);
        const fillColor = colored ? state.colorState[code] : state.defaultLandColor;
        const fillOpacity = colored ? 1.0 : (state.enableLandOpacity ? state.defaultLandOpacity : 1.0);
        const d = geomToD(feature.geometry);

        const strokeAttr = state.mapMode === "pref" 
            ? `stroke="${fillColor}" stroke-width="1.5" stroke-opacity="${fillOpacity}" stroke-linejoin="round" stroke-linecap="round"`
            : `stroke="none"`;

        if (d) pathsHtml += `    <path d="${d}" fill="${fillColor}" fill-opacity="${fillOpacity}" ${strokeAttr} data-code="${code}" data-name="${name}" data-pref="${prefName}"><title>${prefName} ${name}</title></path>\n`;
    });

    let boundarySvgHtml = "";
    const boundaryTypes = state.mapMode === "pref" ? ["pref", "coast"] : ["ward", "county", "city", "pref", "coast"];

    boundaryTypes.forEach(type => {
        const setting = state.boundarySettings[type];
        const geojson = state.boundaryGeoJsons[type];
        if (setting && setting.show && geojson && geojson.geometry && geojson.geometry.coordinates) {
            let dashAttr = "";
            if (setting.style === "dashed") dashAttr = 'stroke-dasharray="6,4"';
            else if (setting.style === "dotted") dashAttr = 'stroke-dasharray="2,3"';

            const d = lineToD(geojson.geometry.coordinates);
            if (d) boundarySvgHtml += `    <path d="${d}" fill="none" stroke="${setting.color}" stroke-width="${setting.weight}" ${dashAttr} stroke-linecap="round" stroke-linejoin="round"/>\n`;
        }
    });

    const railwaySvgHtml = railwayToSvgPaths(state.boundaryGeoJsons.railway);

    let bgImageSvg = "";
    if (state.bgImageDataUrl) bgImageSvg = `  <image href="${state.bgImageDataUrl}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />\n`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}">
  <style>
    path { transition: fill 0.2s; }
  </style>
  <rect width="100%" height="100%" fill="${state.mapBgColor}"/>
${bgImageSvg}  <g id="municipalities">
${pathsHtml}  </g>
  <g id="boundaries">
${boundarySvgHtml}  </g>
  <g id="railways">
${railwaySvgHtml}  </g>
</svg>`;
}