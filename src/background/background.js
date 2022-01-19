let request_queue = new Array(0); // urls to get
let elaborated_tab_ids = new Array(0); // tabs in which the button was added

/**
 *
 * @param {int} [null] video id to get
 * @returns array of tabs
 */
const getCurrentTab = async (video_id = null) => {
  let queryOptions;
  if (video_id != null) {
    queryOptions = {
      currentWindow: true,
      url: `https://politecnicomilano.webex.com/recordingservice/sites/politecnicomilano/recording/${video_id}*`,
    };
  } else {
    queryOptions = { active: true, currentWindow: true };
  }
  return await chrome.tabs.query(queryOptions);
};

/**
 * Makes a request via fetch() and returns parsed JSON
 *
 * @param {str} url
 * @returns json content of the url response
 */
const getData = async (url) => {
  const content = await fetch(url);
  try {
    return content.json();
  } catch (E) {
    return "";
  }
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
    // extract list of available tab
    const tabs = await getCurrentTab(video_id);

    // loop through tabs and find one that has not been already elaborated
    let tab_id;
    for (let i = 0; i < tabs.length; i++) {
      if (!elaborated_tab_ids.includes(tabs[i].id)) {
        tab_id = tabs[i].id;
        elaborated_tab_ids.push(tab_id);
        break;
      }
    }

    // pass message to tab
    chrome.tabs.sendMessage(tab_id, {
      action: "prepare-download",
      data: data,
    });

    // remove url from queue, so that it can be loaded again in the future
    request_queue.splice(request_queue.indexOf(request.url), 1);
  }
};

/**
 * Download file, provided url and filename
 *
 * @param {str} url
 * @param {str} filename
 */
const downloadFile = (url, filename) => {
  chrome.downloads.download({
    url: url,
    filename: filename,
  });
};

/**
 * Removes tab_id from list of elaborated tabs
 * Fired when the tab is closed or removed
 *
 * @param {int} tab_id
 */
const removeElaborated = (tab_id) => {
  elaborated_tab_ids.splice(elaborated_tab_ids.indexOf(tab_id), 1);
};

// request listener
chrome.webRequest.onCompleted.addListener(passRequest, {
  urls: ["https://politecnicomilano.webex.com/*"],
});

// listener for message handler - used to communicate from content to background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action == "file-download")
    downloadFile(message.url, message.filename);
});

// listener for closed tab
chrome.tabs.onRemoved.addListener(removeElaborated);
// listener for updated tabs
chrome.tabs.onUpdated.addListener((tab_id, change_info) => {
  // check if the page has been reloaded and if it was previously elaborated
  if (change_info.status == "loading" && elaborated_tab_ids.includes(tab_id))
    removeElaborated(tab_id);
});
