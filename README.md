# Polimi Webex Downloader

Since a Webex update broke the marvelous [Jacopo J's](https://github.com/jacopo-j/) Chrome and Firefox [extension to download recorded Polimi lessons from Webex](https://github.com/jacopo-j/WebXDownloader), I decided to jump the gun and try write a new extension **that does not rely on url matching.**

As now it's only compatible with Google Chrome, and it's quite buggy.
I am currently focused on making it better, so shall you find any bug, [open an issue](https://github.com/lorossi/polimi-webex-downloader/issues), [send me a message](https://github.com/lorossi) or make a [pull request](https://github.com/lorossi/polimi-webex-downloader/pulls) and I wil try my best *(i swear!)* fix it.

## Installations

### Chrome

* Download the `.zip` file clicking [**here**](https://github.com/lorossi/polimi-webex-downloader/archive/refs/heads/main.zip)
* Extract the zip file
* Browse to `chrome://extensions`
* Turn on "Developer mode" on the top right
* Click "Load unpacked extension..." on the top left
* Select the folder to which your zip file was extracted.

### Firefox

* *Currently WIP*

## Usage

Just click on the download icon, as shown in the image.

![img](/images/how_to_download.png)

Currently there are two options, available by clicking the extension's icon:

1. Add recording date to filename
   * will prepend the recording date (ISO 8061) to the downloaded video filename
2. Add recording title to filename
   * will prepend the recording original title to the downloaded video filename

If neither option is selected, filename will be the elapsed seconds since *January 1, 1970* at the moment of the download.

## Todo

* Automatic version checking with popup whenever a new one is detected
* Create Firefox extension
* Package Chrome extension
* Do some (more) testing
* Implement a blockchain based, machine learning trained, big data fed AI to improve download speeds
* Avoid inevitable Cisco's cease and desist by running to Panama
* Add an icon

## Known bugs

* Sometimes the extension might fail if more than one tab is opened in fast succession
  * if that happens, try to reload
