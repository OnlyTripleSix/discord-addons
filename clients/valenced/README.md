# Valenced plugins

Add this repository URL in Valenced's plugin manager:

`https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/clients/valenced/index.json`

| Plugin | Version | Download |
| --- | --- | --- |
| Purge Tools | 0.1.1 | [ZIP](https://github.com/OnlyTripleSix/discord-addons/releases/download/plugins-2026.11.07/dev.itstriplesix.purge-tools@0.1.1.zip) |
| Settings Pins | 0.1.4 | [ZIP](https://github.com/OnlyTripleSix/discord-addons/releases/download/plugins-2026.11.07/dev.itstriplesix.settings-pins@0.1.4.zip) |
| Quick Mock | 0.1.0 | [ZIP](https://github.com/OnlyTripleSix/discord-addons/releases/download/plugins-2026.11.07/dev.itstriplesix.quick-mock@0.1.0.zip) |
| Hidden Channels | 0.1.0 | [ZIP](https://github.com/OnlyTripleSix/discord-addons/releases/download/plugins-2026.11.07/dev.itstriplesix.hidden-channels@0.1.0.zip) |

Purge Tools opens a complete preview-and-cleanup panel, with per-target filters, pinned/media protection, reaction scopes, pacing, reports, and account-specific checkpoints. Start and saved-job Resume require confirmation on the phone. Automatic resume stays disabled. No top confirmation banner is shown.

Settings Pins puts selected plugin settings in the main Valenced section and can hide supported non-core shortcuts. Core Valenced settings stay protected. Settings Pins v0.1.4 fixes the captured cold-start failure by deferring Discord API access until initialization. It was tested on an actual S21 Ultra with Developer Mode OFF. It remains independent of Developer Mode; advanced plugin discovery and hiding unrelated shortcuts still need Developer Mode.

Quick Mock adds **Mock** to a text message's long-press menu. By default, it puts alternating-case text into the chat input for review. Use **`/mock message:Test text`** for typed text, or reply to a text message and send **`/mock`** without an argument. Slash commands send the result. The saved **Long-press sends immediately** option is OFF by default. Quick Mock requires **Coco's Command Lib 2.x** from Valenced's community catalog; keep that library enabled. Composer retries, clipboard fallback, and usage help are included.

Hidden Channels shows inaccessible server channel rows and their real names when Discord has supplied that metadata. It preserves category collapse behavior and leaves server permissions unchanged. Names absent from Discord's local data remain unavailable; this plugin does not grant access to hidden messages. Enable it and open a server's channel list. Its settings include **Inspect hidden channel state**. Disabling the plugin restores the original channel-row visibility.

These packages use the official Valenced API and were tested on Valenced 1.3.0 / Discord 352.6 Alpha. Client updates can require plugin updates. Existing plugin IDs and storage are retained when updating from the private test builds.

Purge Tools permanently deletes the confirmed selection. Discord can restrict automated or abusive activity. Use at your own risk. No password or token is requested or stored by these plugins.

MIT License. Author: ItsTripleSix.
