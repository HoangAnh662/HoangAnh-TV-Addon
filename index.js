const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

// ==========================================
// CẤU HÌNH
// ==========================================

const M3U_URL =
  "https://raw.githubusercontent.com/HoangAnh662/Vietnam-TV/main/playlist.m3u";

const manifest = {
  id: "org.hoanganh.tv",
  version: "6.6.2",
  name: "HoàngAnh TV",
  description: "Truyền hình trực tuyến Việt Nam",

  resources: ["catalog", "meta", "stream"],
  types: ["tv"],

  catalogs: [
    {
      type: "tv",
      id: "hoanganhtv",
      name: "HoàngAnh TV"
    }
  ],

  idPrefixes: ["hoanganhtv:"]
};

const builder = new addonBuilder(manifest);

// ==========================================
// TẢI FILE M3U
// ==========================================

async function loadM3U() {
  const response = await fetch(M3U_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Không tải được playlist.m3u: HTTP ${response.status}`
    );
  }

  return await response.text();
}

// ==========================================
// ĐỌC DANH SÁCH KÊNH
// ==========================================

function parseM3U(text) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(line => line.trim());

  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.startsWith("#EXTINF:")) continue;

    const logo =
      line.match(/tvg-logo="([^"]*)"/i)?.[1] || "";

    const group =
      line.match(/group-title="([^"]*)"/i)?.[1] || "TV";

    const tvgName =
      line.match(/tvg-name="([^"]*)"/i)?.[1] || "";

    const commaIndex = line.indexOf(",");
    const displayName =
      commaIndex !== -1
        ? line.substring(commaIndex + 1).trim()
        : "";

    const name =
      displayName ||
      tvgName ||
      `Kênh ${channels.length + 1}`;

    // Tìm URL stream tiếp theo
    let url = "";

    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j]) continue;

      if (lines[j].startsWith("#EXTINF:")) {
        break;
      }

      if (!lines[j].startsWith("#")) {
        url = lines[j];
        break;
      }
    }

    if (!url) continue;

    const id = `hoanganhtv:${channels.length + 1}`;

    channels.push({
      id,
      name,
      logo,
      group,
      url
    });
  }

  return channels;
}

async function getChannels() {
  const text = await loadM3U();
  return parseM3U(text);
}
// ==========================================
// POSTER TÊN KÊNH THEO NHÓM
// ==========================================

function getGroupColor(channel) {
  const text = `${channel.name} ${channel.group}`.toUpperCase();

  if (text.includes("VTV")) return "1565C0";
  if (text.includes("ON")) return "8E24AA";
  if (text.includes("HTV") || text.includes("HTVC")) return "00897B";
  if (text.includes("SCTV")) return "D32F2F";

  return "455A64";
}

function makeChannelPoster(channel) {
  const color = getGroupColor(channel);

  return `https://placehold.co/500x500/${color}/FFFFFF.png?text=${encodeURIComponent(channel.name)}`;
}
// ==========================================
// CATALOG
// ==========================================

builder.defineCatalogHandler(async args => {
  if (args.type !== "tv" || args.id !== "hoanganhtv") {
    return { metas: [] };
  }

  try {
    const channels = await getChannels();

    const metas = channels.map(channel => ({
      id: channel.id,
      type: "tv",
      name: channel.name,
      poster: makeChannelPoster(channel),
      posterShape: "square",
      description: channel.group
    }));

    return { metas };
  } catch (error) {
    console.error("Catalog error:", error);
    return { metas: [] };
  }
});

// ==========================================
// META
// ==========================================

builder.defineMetaHandler(async args => {
  try {
    const channels = await getChannels();

    const channel = channels.find(
      item => item.id === args.id
    );

    if (!channel) {
      return { meta: null };
    }

    return {
      meta: {
        id: channel.id,
        type: "tv",
        name: channel.name,
        poster: makeChannelPoster(channel),
        posterShape: "square",
        description: channel.group
      }
    };
  } catch (error) {
    console.error("Meta error:", error);
    return { meta: null };
  }
});

// ==========================================
// STREAM
// ==========================================

builder.defineStreamHandler(async args => {
  try {
    const channels = await getChannels();

    const channel = channels.find(
      item => item.id === args.id
    );

    if (!channel) {
      return { streams: [] };
    }

    return {
      streams: [
        {
          name: "HoàngAnh TV",
          title: channel.name,
          url: channel.url
        }
      ]
    };
  } catch (error) {
    console.error("Stream error:", error);
    return { streams: [] };
  }
});

// ==========================================
// KHỞI ĐỘNG SERVER
// ==========================================

const PORT = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), {
  port: PORT
});

console.log(`HoàngAnh TV đang chạy tại port ${PORT}`);
