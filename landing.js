const landingHTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

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
  background: #0f1115;
  color: #ffffff;
  font-family: Arial, sans-serif;
  padding: 20px;
}

.card {
  width: 100%;
  max-width: 430px;
  background: #181b21;
  border-radius: 24px;
  padding: 30px 22px;
  text-align: center;
  box-shadow: 0 15px 50px rgba(0,0,0,.35);
}

.logo {
  width: 82px;
  height: 82px;
  margin: 0 auto 18px;
  border-radius: 20px;
  background: #1565C0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 25px;
  font-weight: bold;
}

h1 {
  margin: 0;
  font-size: 28px;
}

.version {
  margin-top: 7px;
  color: #9fa6b2;
  font-size: 14px;
}

.description {
  margin: 18px 0 25px;
  color: #c5c9d1;
  line-height: 1.5;
}

.button {
  width: 100%;
  border: 0;
  border-radius: 14px;
  padding: 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}

.stremio {
  background: #7b5cff;
  color: white;
}

.copy {
  background: #2a2f38;
  color: white;
}

.nuvio {
  margin-top: 28px;
  text-align: left;
}

.nuvio h2 {
  font-size: 18px;
  margin-bottom: 8px;
}

.nuvio p {
  color: #aeb4be;
  font-size: 14px;
  line-height: 1.4;
}

.linkbox {
  background: #101216;
  padding: 13px;
  border-radius: 12px;
  font-size: 12px;
  color: #cbd0d8;
  word-break: break-all;
  margin: 12px 0 4px;
}

.footer {
  margin-top: 28px;
  color: #6f7682;
  font-size: 12px;
}
</style>
</head>

<body>

<div class="card">

  <div class="logo">TV</div>

  <h1>HoàngAnh TV</h1>

  <div class="version">
    Phiên bản 6.6.2
  </div>

  <div class="description">
    Truyền hình trực tuyến Việt Nam
  </div>

  <button
    class="button stremio"
    onclick="installStremio()">
    Cài vào Stremio
  </button>

  <div class="nuvio">

    <h2>Cài vào Nuvio</h2>

    <p>
      Sao chép link addon bên dưới rồi thêm
      addon trong ứng dụng Nuvio.
    </p>

    <div class="linkbox" id="manifest">
      https://hoanganh-tv-addon.onrender.com/manifest.json
    </div>

    <button
      class="button copy"
      id="copyButton"
      onclick="copyManifest()">
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

  const url =
    manifest.replace(
      /^https?:\\/\\//,
      "stremio://"
    );

  window.location.href = url;
}

async function copyManifest() {

  const button =
    document.getElementById("copyButton");

  try {

    await navigator.clipboard.writeText(
      manifest
    );

    button.innerText = "✓ Đã sao chép";

    setTimeout(() => {
      button.innerText = "Sao chép link";
    }, 1800);

  } catch {

    const textarea =
      document.createElement("textarea");

    textarea.value = manifest;

    document.body.appendChild(textarea);

    textarea.select();

    document.execCommand("copy");

    textarea.remove();

    button.innerText = "✓ Đã sao chép";

    setTimeout(() => {
      button.innerText = "Sao chép link";
    }, 1800);
  }
}

</script>

</body>
</html>
`;

module.exports = landingHTML;
