let request_lock = false;

const getCurrentTab = async () => {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return await tab;
};

const getData = async (url) => {
  const content = await fetch(url);
  try {
    return content.json();
  } catch (SyntaxError) {
    return "";
  }
};

const passRequest = async (message) => {
  if (message.url.includes("/recordings/") && !request_lock) {
    request_lock = true;

    const data = await getData(message.url);
    const tab = await getCurrentTab();

    chrome.tabs.sendMessage(tab.id, {
      action: "prepare-download",
      data: data,
    });

    request_lock = false;
  }
};

const downloadFile = (url, filename) => {
  chrome.downloads.download({
    url: url,
    filename: filename,
  });
};

const messageHandler = (message) => {
  if (message.action == "file-download")
    downloadFile(message.url, message.filename);
};

chrome.webRequest.onCompleted.addListener(passRequest, {
  urls: ["https://politecnicomilano.webex.com/*"],
});

chrome.runtime.onMessage.addListener(messageHandler);
