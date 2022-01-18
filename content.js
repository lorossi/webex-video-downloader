/**
 * Sends message to background worker with info for the download
 *
 * @param {obj} event
 */
const passDownloadOptions = (event) => {
  // url and filename are loaded from the button
  const url = event.target.getAttribute("download-url");
  const filename = event.target.getAttribute("download-filename");
  // sends info to background worker as download cannot be started from content script
  chrome.runtime.sendMessage({
    action: "file-download",
    url: url,
    filename: filename,
  });
};

/**
 * Format the title according to the video infos
 *
 * @param {obj} data
 * @returns {str} formatted title
 */
const formatTitle = (data) => {
  return [
    new Date(data.createTime).toISOString().slice(0, 10).replaceAll("-", ""),
    "-",
    data.recordName,
    ".mp4",
  ].join("");
};

/**
 * Creates download button
 *
 * @param {obj} data
 */
const prepareDownload = (data) => {
  const title = formatTitle(data);
  const container = document.querySelector(".recordingHeader");
  const button = document.createElement("button");

  button.innerHTML = "download";
  button.id = "download-video";
  // video url and title are set as attributes on the button
  button.setAttribute("download-url", data.fallbackPlaySrc);
  button.setAttribute("download-filename", title);
  container.appendChild(button);

  button.addEventListener("click", passDownloadOptions);
};

// listener for message handler - used to communicate from background to content
chrome.runtime.onMessage.addListener((message) => {
  if (message.action == "prepare-download") prepareDownload(message.data);
});
