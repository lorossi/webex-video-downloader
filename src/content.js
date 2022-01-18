/**
 * Format the filename according to the video infos
 *
 * @param {obj} data
 * @returns {str} formatted title
 */
const formatFilename = (data) => {
  // filename options are set in popup.js
  return chrome.storage.local
    .get({
      "filename-date": true,
      "filename-title": true,
    })
    .then((v) => {
      let filename = [];

      // option to append date has been checked
      if (v["filename-date"] === true) {
        filename.push(
          new Date(data.createTime)
            .toISOString()
            .slice(0, 10)
            .replaceAll("-", "")
        );
      }

      // option ot append filename has been checked
      if (v["filename-title"] === true) {
        if (filename.length > 0) filename.push("-");

        filename.push(data.recordName);
      }

      // no text, just append epoch
      if (filename.length == 0) {
        filename.push(new Date().getTime());
      }

      // add extension
      filename.push(".mp4");

      // join everything
      return filename.join("");
    });
};

/**
 * Creates download button
 *
 * @param {obj} data
 */
const createDownloadButton = (data) => {
  const url = data.fallbackPlaySrc;

  const container = document.querySelector(".recordingHeader");
  const button = document.createElement("div");

  // set style
  const style = {
    backgroundImage: `url(${chrome.runtime.getURL("images/download.png")})`,
    position: "relative",
    display: "inline-block",
    height: "26px",
    marginLeft: "13px",
    aspectRatio: 1,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    cursor: "pointer",
  };

  // apply style
  Object.assign(button.style, style);

  // add button to page
  container.appendChild(button);

  // add listener to button
  button.addEventListener("click", () => {
    formatFilename(data).then((filename) => {
      // message background worker to download the file
      chrome.runtime.sendMessage({
        action: "file-download",
        url: url,
        filename: filename,
      });
    });
  });
};

// listener for message handler - used to communicate from background to content
chrome.runtime.onMessage.addListener((message) => {
  if (message.action == "prepare-download") createDownloadButton(message.data);
});
