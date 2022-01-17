const passDownloadOptions = (event) => {
  const url = event.target.getAttribute("download-url");
  const filename = event.target.getAttribute("download-filename");

  chrome.runtime.sendMessage({
    action: "file-download",
    url: url,
    filename: filename,
  });
};

const formatTitle = (data) => {
  return [
    new Date(data.createTime).toISOString().slice(0, 10).replaceAll("-", ""),
    "-",
    data.recordName,
    ".mp4",
  ].join("");
};

const prepareDownload = (data) => {
  const title = formatTitle(data);
  const container = document.querySelector(".recordingHeader");
  const button = document.createElement("button");

  button.innerHTML = "download";
  button.id = "download-video";
  button.setAttribute("download-url", data.fallbackPlaySrc);
  button.setAttribute("download-filename", title);
  container.appendChild(button);

  button.addEventListener("click", passDownloadOptions);
};

const messageHandler = (message) => {
  if (message.action == "prepare-download") prepareDownload(message.data);
};

chrome.runtime.onMessage.addListener(messageHandler);
