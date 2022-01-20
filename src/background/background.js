let request_queue = new Array(0); // urls to get
let elaborated_tab_ids = new Array(0); // tabs in which the button was added
let last_fetched = 0; // epoch of last version fetch
const FETCH_INTERVAL = 1800; // number of seconds between latest version fetches

/**
 * Makes a request via fetch() and returns parsed JSON
 *
 * @param {str} url
 * @returns json content of the url response
 */
const getData = (url) => {
  return fetch(url)
    .then((content) => {
      return content.json();
    })
    .catch((err) => {
      return null;
    });
};

/**
 * Finds the id of the tab that made the request
 *
 * @param {str} video_id id of the video that is going to be extracted
 * @param {Array} old_tabs array of tabs ids that have already been elaborated (a button is already placed there)
 * @returns
 */
const getTab = (video_id, old_tabs) => {
  // extract list of available tab
  return chrome.tabs.query({}).then((tabs) => {
    // loop through tabs and find one that has not been already elaborated
    // and contains the video url
    // keep looking until found
    for (let i = 0; i < tabs.length; i++) {
      if (!old_tabs.includes(tabs[i].id) && tabs[i].url.includes(video_id)) {
        return tabs[i].id;
      }
    }

    return null;
  });
};

/**
 * Intercepts and handles request
 *
 * @param {obj} request
 */
const passRequest = async (request) => {
  // check if url needs to be elaborated
  if (
    request.url.includes("/recordings/") &&
    !request_queue.includes(request.url)
  ) {
    // add to request queue so that it does not loop forever
    request_queue.push(request.url);

    // extract request data
    const data = await getData(request.url);
    // extract video id
    const video_id = request.url.split("/").slice(-2, -1)[0];
    // find tab id
    const tab_id = await getTab(video_id, elaborated_tab_ids);
    // sometimes tabs don't get loaded. Just go on and do nothing
    // TODO might find a smarter way to do this (maybe wait?)
    if (tab_id) {
      // add tab id to list of already elaborated tabs
      elaborated_tab_ids.push(tab_id);

      // pass message to tab
      chrome.tabs.sendMessage(tab_id, {
        action: "prepare_download",
        data: data,
      });
    }

    // remove url from queue, so that it can be loaded again in the future
    request_queue.splice(request_queue.indexOf(request.url), 1);
  }
};

/**
 * Removes tab_id from list of elaborated tabs
 * Fired when the tab is closed or removed
 *
 * @param {int} tab_id
 */
const removeElaborated = (tab_id) => {
  if (elaborated_tab_ids.includes(tab_id))
    elaborated_tab_ids.splice(elaborated_tab_ids.indexOf(tab_id), 1);
};

/**
 * @returns {str} current version
 *
 */
const getCurrentVersion = () => `v${chrome.runtime.getManifest().version}`;

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
 * Check if an update is available by comparing the two versions
 *
 * @param {str} version_1
 * @param {str} version_2
 * @returns {bool} true if version_1 if newer than version 2
 */
const checkUpdateAvailable = (version_1, version_2) => {
  const parse_version = (str) => {
    return str
      .concat(".0")
      .replace("v", "")
      .split(".")
      .map((i) => parseInt(i));
  };
  // new
  const v1 = parse_version(version_1);
  // old
  const v2 = parse_version(version_2);

  for (let i = 0; i < 3; i++) {
    if (v1[i] > v2[i]) return true;
    if (v2[i] < v1[i]) return false;
  }

  return false;
};

/**
 * Fetches versions either from storage or from remote url
 *
 * @returns {obj} versions obj
 */
const getUpdate = async () => {
  let current_version, latest_version, update_available;

  if (new Date().getTime() > last_fetched + FETCH_INTERVAL) {
    // if enough time has passed, fetch again everything
    last_fetched = new Date().getTime();
    current_version = getCurrentVersion();
    latest_version = await getLatestVersion();
    update_available = await checkUpdateAvailable(
      latest_version,
      current_version
    );
    // save into storage
    chrome.storage.local.set({
      current_version: current_version,
      latest_version: latest_version,
      update_available: update_available,
    });

    return { current_version, latest_version, update_available };
  }

  // otherwise, just load from storage
  return chrome.storage.local.get([
    "current_version",
    "latest_version",
    "update_available",
  ]);
};

// request listener
chrome.webRequest.onCompleted.addListener(passRequest, {
  urls: ["https://*.webex.com/*"],
});

// listener for message handler - used to communicate from content to background
chrome.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.action) {
    case "file_download":
      // content asked to download a file
      chrome.downloads.download({
        url: message.url,
        filename: message.filename,
      });
      break;

    case "get_version":
      // popup asked to get the current and latest version
      // send message to popup
      const current_version = getCurrentVersion();

      chrome.runtime.sendMessage({
        action: "post_version",
        current_version: current_version,
      });

      break;

    case "get_update":
      getUpdate()
        .then((version) => {
          version.action = "post_update";
          return version;
        })
        .then((version) => {
          chrome.runtime.sendMessage(version);
        });
      break;

    default:
      break;
  }
});

// listener for closed tab
chrome.tabs.onRemoved.addListener(removeElaborated);
// listener for updated tabs
chrome.tabs.onUpdated.addListener((tab_id, change_info) => {
  // check if the page has been reloaded and if it was previously elaborated
  if (change_info.status == "loading") removeElaborated(tab_id);
});
