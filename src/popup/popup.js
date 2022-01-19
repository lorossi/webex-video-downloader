/**
 *
 * @returns {str} last published version
 */
const getLatestVersion = async () => {
  const response = await fetch(
    "https://api.github.com/repos/lorossi/polimi-webex-downloader/tags",
    {
      accept: "application/vnd.github.v3+json",
      method: "GET",
    }
  );
  const data = await response.json();
  return data[0].name;
};

/**
 *
 * @returns {str} current version
 */
const getCurrentVersion = () => `v${chrome.runtime.getManifest().version}`;

/**
 * Check if a new version has come out and if so updates the span in the popup
 */
const checkUpdate = async () => {
  const last_version = await getLatestVersion();
  const current_version = getCurrentVersion();
  if (current_version != last_version) {
    const update_span = document.querySelector("#updateavailable");
    update_span.innerHTML = "New version available";
    update_span.href =
      "https://github.com/lorossi/polimi-webex-downloader/releases/latest";
    update_span.target = "_blank";
  }
};

const main = () => {
  // check if update is available
  checkUpdate();

  // put current version in popup
  const version_span = document.querySelector("#currentversion");
  version_span.innerHTML = getCurrentVersion();

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
      req[event.target.id] = event.target.checked;
      chrome.storage.local.set(req);
    });
  });
};

main();
