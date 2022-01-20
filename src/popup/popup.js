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
  chrome.runtime.sendMessage({
    action: "get_update",
  });

  // select checkboxes from popup
  const checkboxes = document.querySelectorAll(
    ".filename input[type=checkbox]"
  );
  // map DOM elements ids to request name
  const ids_map = {
    filenamedate: "filename_date",
    filenametitle: "filename_title",
  };

  // iterate over each checkbox
  checkboxes.forEach((c) => {
    // get element id
    const element_id = ids_map[c.id];
    let request = {};
    request[element_id] = true;

    // load previous checked state (defaults to true)
    chrome.storage.local.get(request).then((storage) => {
      c.checked = storage[element_id];
    });

    // add listener to save to storage
    c.addEventListener("change", (event) => {
      const element_id = ids_map[event.target.id];
      let request = {};
      request[element_id] = event.target.checked;
      chrome.storage.local.set(request);
    });
  });
};

// listener for message handler _ used to communicate from background to content
chrome.runtime.onMessage.addListener((message) => {
  switch (message.action) {
    case "post_version":
      // background answered version question message
      setCurrentVersion(message.current_version);
      break;

    case "post_update":
      if (message.update_available) setUpdate(message.latest_version);
      break;

    default:
      break;
  }
});

// entry point
main();
