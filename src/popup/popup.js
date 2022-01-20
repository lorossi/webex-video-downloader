/**
 * If a new version has come out, updates the span in the popup
 * with a link and the name of the new version
 *
 * @param {str} latest_version
 */
const setUpdate = (latest_version) => {
  const update_span = document.querySelector("#updateavailable");
  update_span.innerHTML = `New version available: ${latest_version}`;
  update_span.href =
    "https://github.com/lorossi/polimi-webex-downloader/releases/latest";
  update_span.target = "_blank";
};

/**
 * Sets the current version in a span in the popup
 *
 * @param {str} current_version
 */
const setCurrentVersion = (current_version) => {
  // put current version in popup
  const version_span = document.querySelector("#currentversion");
  version_span.innerHTML = current_version;
};

const main = () => {
  // ask background worker for version infos
  chrome.runtime.sendMessage({
    action: "get_version",
  });
  // select checkboxes from popup
  const checkboxes = document.querySelectorAll("input[type=checkbox]");

  // iterate over each checkbox
  checkboxes.forEach((c) => {
    let req = {};
    req[c.id] = true;
    // load previous checked state (defaults to true)
    chrome.storage.local.get(req).then((v) => {
      c.checked = v[c.id];
    });

    // add listener to save to storage
    c.addEventListener("change", (event) => {
      let req = {};
      // TODO might want to find a way to sanitize this
      req[event.target.id] = event.target.checked;
      chrome.storage.local.set(req);
    });
  });
};

// listener for message handler _ used to communicate from background to content
chrome.runtime.onMessage.addListener((message) => {
  switch (message.action) {
    case "post_version":
      // background answered version question message
      setCurrentVersion(message.current_version);
      if (message.update_available) setUpdate(message.latest_version);
      break;

    default:
      break;
  }
});

main();
