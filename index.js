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
  types: ["tv", "series"],

  catalogs: [
    {
      type: "tv",
      id: "hoanganhtv",
      name: "HoàngAnh TV"
    },
    {
      type: "series",
      id: "hoanganhtv-switch",
      name: "HoàngAnh TV - Chuyển kênh"
    }
  ],

  idPrefixes: ["hoanganhtv:", "hoanganhtv-switch"]
};

const builder = new addonBuilder(manifest);

// ==========================================
// TẢI M3U
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

    let url = "";

    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j]) continue;

      if (lines[j].startsWith("#EXTINF:")) break;

      if (!lines[j].startsWith("#")) {
        url = lines[j];
        break;
      }
    }

    if (!url) continue;

    channels.push({
      id: `hoanganhtv:${channels.length + 1}`,
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
// POSTER Ô MÀU
// ==========================================

function getGroupColor(channel) {
  const text =
    `${channel.name} ${channel.group}`.toUpperCase();

  if (text.includes("VTV")) return "1565C0";
  if (text.includes("ON")) return "8E24AA";

  if (
    text.includes("HTV") ||
    text.includes("HTVC")
  ) {
    return "00897B";
  }

  if (text.includes("SCTV")) return "D32F2F";

  return "455A64";
}

function makeChannelPoster(channel) {
  const color = getGroupColor(channel);

  return (
    `https://placehold.co/500x500/${color}/FFFFFF.png` +
    `?text=${encodeURIComponent(channel.name)}`
  );
}

// ==========================================
// CATALOG
// ==========================================

builder.defineCatalogHandler(async args => {
  try {
    const channels = await getChannels();

    // Catalog kênh bình thường
    if (
      args.type === "tv" &&
      args.id === "hoanganhtv"
    ) {
      return {
        metas: channels.map(channel => ({
          id: channel.id,
          type: "tv",
          name: channel.name,
          poster: makeChannelPoster(channel),
          posterShape: "square",
          description: channel.group
        }))
      };
    }

    // Catalog chuyển kênh
    if (
      args.type === "series" &&
      args.id === "hoanganhtv-switch"
    ) {
      return {
        metas: [
          {
            id: "hoanganhtv-switch",
            type: "series",
            name: "HoàngAnh TV",
            poster:
              "https://placehold.co/500x500/1565C0/FFFFFF.png?text=HoangAnh+TV",
            posterShape: "square",
            description:
              "Chọn kênh truyền hình để xem"
          }
        ]
      };
    }

    return { metas: [] };
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

    // Meta từng kênh TV
    if (args.type === "tv") {
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
    }

    // Meta danh sách chuyển kênh
    if (
      args.type === "series" &&
      args.id === "hoanganhtv-switch"
    ) {
      const videos = channels.map(
        (channel, index) => ({
          id: `hoanganhtv-switch:${index + 1}`,
          title: channel.name,
          season: 1,
          episode: index + 1,
          released:
            new Date().toISOString(),
          thumbnail:
            makeChannelPoster(channel)
        })
      );

      return {
        meta: {
          id: "hoanganhtv-switch",
          type: "series",
          name: "HoàngAnh TV",
          poster:
            "https://placehold.co/500x500/1565C0/FFFFFF.png?text=HoangAnh+TV",
          posterShape: "square",
          description:
            "Chọn kênh bên dưới để chuyển kênh",
          videos
        }
      };
    }

    return { meta: null };
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

    // Phát từ catalog TV bình thường
    if (args.type === "tv") {
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
    }

    // Phát kênh từ danh sách dạng episode
    if (
      args.type === "series" &&
      args.id.startsWith("hoanganhtv-switch:")
    ) {
      const number = Number(
        args.id.split(":")[1]
      );

      const channel = channels[number - 1];

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
    }

    return { streams: [] };
  } catch (error) {
    console.error("Stream error:", error);
    return { streams: [] };
  }
});

// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), {
  port: PORT
});

console.log(
  `HoàngAnh TV đang chạy tại port ${PORT}`
);
