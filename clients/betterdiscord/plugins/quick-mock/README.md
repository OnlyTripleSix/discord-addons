# Quick Mock for BetterDiscord

Version **1.0.0**. Author: **ItsTripleSix**.

[Download QuickMock.plugin.js](https://github.com/OnlyTripleSix/discord-addons/releases/download/plugins-2026.11.07/QuickMock.plugin.js) · [Mock + Hidden Channels ZIP](https://github.com/OnlyTripleSix/discord-addons/releases/download/plugins-2026.11.07/BetterDiscord-Mock-HiddenChannels-1.0.0.zip)

Copy the plugin file into Settings → BetterDiscord → Plugins → Open Plugins Folder, then enable QuickMock.

Right-click a text message → **Mock** inserts alternating-case text into your composer. Existing draft text is retained. If that channel is not active, the result is copied instead.

Use **/mock message:Your text** to send a real message. Reply to a text message and use **/mock** without an argument to use that reply's text and native reply reference. Slash commands require BetterDiscord's Commands API; older clients can still use the message-menu action.

**Message-menu action sends immediately** is off by default. Turn it on in the plugin settings if a click on Mock should send immediately. A failed send falls back to review and is not retried automatically.

The user accepted the desktop build before release. The release changes only its version label from the tested beta. MIT License.
