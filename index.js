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
// POSTER Ô VUÔNG MÀU
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
  if (
    args.type !== "tv" ||
    args.id !== "hoanganhtv"
  ) {
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
// SERVER
// ==========================================

const { getRouter } = require("stremio-addon-sdk");
const http = require("http");

const PORT = process.env.PORT || 7000;

const addonInterface = builder.getInterface();
const router = getRouter(addonInterface);

const server = http.createServer((req, res) => {

  // Trang cài đặt
  if (req.url === "/" || req.url === "/configure") {

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
<!DOCTYPE html>
<html lang="vi">

<head>
<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>HoàngAnh TV</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: #0f1115;
  color: white;

  font-family:
    Arial,
    sans-serif;
}

.card {
  width: 100%;
  max-width: 430px;

  padding: 30px 22px;

  background: #181b21;

  border-radius: 24px;

  text-align: center;
}

.logo {
  width: 85px;
  height: 85px;

  margin: 0 auto 18px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 22px;

  background: #1565C0;

  font-size: 25px;
  font-weight: bold;
}

h1 {
  margin: 0;
  font-size: 29px;
}

.version {
  margin-top: 7px;

  color: #969da8;
  font-size: 14px;
}

.description {
  margin: 18px 0 25px;

  color: #c4c8d0;

  line-height: 1.5;
}

button {
  width: 100%;

  padding: 15px;

  border: none;
  border-radius: 14px;

  font-size: 16px;
  font-weight: bold;

  cursor: pointer;
}

.install {
  background: #7b5cff;
  color: white;
}

.nuvio {
  margin-top: 30px;
  text-align: left;
}

.nuvio h2 {
  margin-bottom: 7px;
  font-size: 18px;
}

.nuvio p {
  color: #aeb4be;

  font-size: 14px;
  line-height: 1.5;
}

.link {
  margin-top: 12px;

  padding: 13px;

  background: #101216;

  border-radius: 12px;

  color: #c9ced6;

  font-size: 12px;

  word-break: break-all;
}

.copy {
  margin-top: 10px;

  background: #2b3039;
  color: white;
}

.footer {
  margin-top: 27px;

  color: #686f7b;

  font-size: 12px;
}

</style>

</head>

<body>

<div class="card">

  <div class="logo">
    TV
  </div>

  <h1>
    HoàngAnh TV
  </h1>

  <div class="version">
    Phiên bản 6.6.2
  </div>

  <div class="description">
    Truyền hình trực tuyến Việt Nam
  </div>

  <button
    class="install"
    onclick="installStremio()"
  >
    Cài vào Stremio
  </button>

  <div class="nuvio">

    <h2>
      Cài vào Nuvio
    </h2>

    <p>
      Sao chép link addon bên dưới,
      sau đó thêm vào Nuvio.
    </p>

    <div class="link">
      https://hoanganh-tv-addon.onrender.com/manifest.json
    </div>

    <button
      id="copy"
      class="copy"
      onclick="copyLink()"
    >
      Sao chép link
    </button>

  </div>

  <div class="footer">
    HoàngAnh TV
  </div>

</div>

<script>

const manifest =
  "https://hoanganh-tv-addon.onrender.com/manifest.json";

function installStremio() {

  window.location.href =
    "stremio://hoanganh-tv-addon.onrender.com/manifest.json";

}

async function copyLink() {

  const button =
    document.getElementById("copy");

  try {

    await navigator.clipboard.writeText(
      manifest
    );

  } catch (error) {

    const input =
      document.createElement("textarea");

    input.value = manifest;

    document.body.appendChild(input);

    input.select();

    document.execCommand("copy");

    input.remove();
  }

  button.innerText =
    "✓ Đã sao chép";

  setTimeout(() => {

    button.innerText =
      "Sao chép link";

  }, 1800);
}

</script>

</body>
</html>
    `);

    return;
  }

  router(req, res);
});

server.listen(PORT, () => {
  console.log(
    `HoàngAnh TV đang chạy tại port ${PORT}`
  );
});
