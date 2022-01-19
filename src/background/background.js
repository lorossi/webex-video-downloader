let request_queue = new Array(0); // urls to get
let elaborated_tab_ids = new Array(0); // tabs in which the button was added

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
    while (true) {
      for (let i = 0; i < tabs.length; i++) {
        if (!old_tabs.includes(tabs[i].id) && tabs[i].url.includes(video_id)) {
          return tabs[i].id;
        }
      }
    }
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
    // add tab id to list of already elaborated tabs
    elaborated_tab_ids.push(tab_id);

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
  if (elaborated_tab_ids.includes(tab_id))
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
  if (change_info.status == "loading") removeElaborated(tab_id);
});
