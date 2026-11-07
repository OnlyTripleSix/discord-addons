# Purge Tools for BetterDiscord

Version **1.0.0**.

## Install or update

1. Open Discord Settings → BetterDiscord → Plugins → Open Plugins Folder.
2. Copy **PurgeTools.plugin.js** into that folder and enable PurgeTools. When updating, disable it before replacing the file, then enable it again. Keep PurgeTools.config.json to retain your settings.
3. Right-click a DM, channel, server, or the settings gear and choose **Open Purge Tools**. Its plugin settings button also opens the controls.

The shortcut opens your existing target selection. Choose or add the targets you want and configure their filters. Start with **Preview / Discover** to see matching totals without deleting anything. **Start Purge** asks for confirmation before permanent deletion.

Verify after each target is enabled by default. Verification rescans with the same filters and can find new matches after the preview. Disable it to act only on the preview snapshot.

The plugin includes per-target author/reaction scopes, date/message boundaries, pinned and attachment/media protection, preserved extensions such as OGG, deletion order, pause/resume, account-specific checkpoints, adaptive pacing, and reports. Moderator options require Manage Messages in each channel. In DMs, only your own messages and reactions can be removed.

Closing the panel leaves a running job active. Use Pause or Cancel + discard job to stop it. Closing Discord or disabling the plugin interrupts the job and preserves its checkpoint. Automatic resume is off by default.

Discord already supplies the signed-in account; this plugin does not ask for or store a password or token. Reports omit message content and account/channel IDs. Local saved jobs retain the target IDs needed to resume.

Discord can restrict accounts for activity it considers abusive or automated. Use at your own risk.

MIT License; see LICENSE. Author: ItsTripleSix.
