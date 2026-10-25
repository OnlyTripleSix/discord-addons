# Discord Add-ons

Stable plugins, themes, and other add-ons for supported Discord clients.

## Quick navigation

- [ShiggyCord plugins](#shiggycord-plugins)
- [ShiggyCord install URLs](#shiggycord-install-urls)
- [Purge Tools account-risk notice](#purge-tools-account-risk-notice)
- [Revenge Classic plugins](#revenge-classic-plugins)
- [Themes](#themes)
- [Repository roles](#repository-roles)

## ShiggyCord plugins

The ShiggyCord collection has **8 released plugins**. Theme Toolkit remains separate and has not been ported to ShiggyCord.

### Account Switcher

Restores Discord's native-style mobile multi-account switching.

- Uses Discord's existing saved-account state rather than storing or exporting account tokens itself.
- Keeps Android push registration focused on the active account.
- Uses native notification handling.
- Includes persisted plugin settings.

### Composer Cleaner

Cleans up the message composer without removing third-party composer plugins.

- Individually hide attachments, gifts, emoji, microphone/voice, apps/commands, and new-thread controls.
- Changes are configurable from plugin settings.
- Targets native Discord composer controls only.

### Hidden Channels

Makes inaccessible channels easier to understand when Discord has already sent their metadata to the client.

- Shows hidden/inaccessible channel entries that are already present locally.
- Restores channel names from available metadata.
- Does not grant message access or bypass server permissions.
- Does not load inaccessible channel messages.

### Hide Call Buttons

Reliably hides call controls across current Discord mobile surfaces.

- Hides DM voice and video call buttons.
- Hides the user-profile call button.
- Hides the Friends-list call action.
- Hides the voice-channel camera button.
- Uses ShiggyCord's lazy module hooks so late-loaded Discord screens stay covered.

### Purge Tools

Bulk cleanup for messages and reactions across selected DMs, channels, and servers.

- Per-target author, reaction, filter, and deletion-order controls.
- Preview/discovery before destructive cleanup.
- Reusable preview snapshots so a confirmed purge can skip repeating initial discovery.
- Message deletion and reaction cleanup with permission checks for moderator actions.
- Media/attachment protection controls.
- Pause, resume, interruption checkpoints, and optional automatic resume.
- Conservative shared request pacing that adapts to Discord feedback.
- Transient server-error retries with recovered/unresolved failure accounting.
- Verification passes and readable progress/status reporting.

### Quick Mock

Fast alternating-case mock text.

- `/mock` command workflow.
- Reply-to-mock workflow.
- Long-press message action.
- Configurable long-press behavior.

### Settings Pins

Puts frequently used plugin settings directly into the main ShiggyCord settings section.

- Pin installed plugin settings with per-plugin saved toggles.
- Hide non-core plugin shortcuts that were already registered in ShiggyCord, including bundled/hard-baked entries.
- Core ShiggyCord settings remain protected from hiding.
- Pin and visibility choices persist.
- After changing a pin or existing shortcut, use **ReShiggy** for the main Settings list to rebuild.

### Silent Typing

Adds an Aliucord-style silent-typing control to the message composer.

- Toggle silent typing directly from chat input.
- Suppresses Discord's typing event while enabled.
- Customizable behavior through plugin settings.

## ShiggyCord install URLs

Add the raw directory URL to ShiggyCord's plugin manager.

| Plugin | Install URL |
| --- | --- |
| Account Switcher | `https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/clients/shiggycord/plugins/account-switcher/` |
| Composer Cleaner | `https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/clients/shiggycord/plugins/composer-cleaner/` |
| Hidden Channels | `https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/clients/shiggycord/plugins/hidden-channels/` |
| Hide Call Buttons | `https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/clients/shiggycord/plugins/hide-call-buttons/` |
| Purge Tools | `https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/clients/shiggycord/plugins/purge-tools/` |
| Quick Mock | `https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/clients/shiggycord/plugins/quick-mock/` |
| Settings Pins | `https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/clients/shiggycord/plugins/settings-pins/` |
| Silent Typing | `https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/clients/shiggycord/plugins/silent-typing/` |

## Purge Tools account-risk notice

> **Personally, Purge Tools has worked fine for me. Discord can still restrict or ban accounts for activity it considers abusive or automated. Use it at your own risk. I am not responsible for account restrictions, suspensions, or bans.**

This notice applies to both the ShiggyCord and Revenge Classic builds.

## Revenge Classic plugins

### Account Switcher

Restores Discord's native mobile multi-account switcher and uses Discord's own saved-account state.

`https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/plugins/account-switcher/`

### Silent Typing

Adds a configurable silent-typing toggle to the message composer.

`https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/plugins/silent-typing/`

### Composer Cleaner

Lets you hide selected native composer buttons.

`https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/plugins/composer-cleaner/`

### Purge Tools

Bulk cleanup for messages and reactions with previews, checkpoints, resume support, verification, and rate-limit-aware pacing.

`https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/plugins/purge-tools/`

### Hidden Channels

Shows available channel metadata for inaccessible channels without granting message access.

`https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/plugins/hidden-channels/`

### Quick Mock

Adds alternating-case mock text through long-press and `/mock` workflows.

`https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/plugins/quick-mock/`

### Theme Toolkit

Revenge Classic only for now. Create, edit, save, switch, preview, export, and share themes with additional color, icon, folder, mention, and avatar controls.

`https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/plugins/theme-toolkit/`

## Themes

### AMOLED Monochrome

Pure-black OLED theme with white and gray UI accents.

`https://raw.githubusercontent.com/OnlyTripleSix/discord-addons/main/themes/amoled-monochrome.json`

## Compatibility

Discord updates can change internal modules and occasionally require plugin fixes. Check the client-specific section for the build intended for your client.

## Repository roles

| Repository | Purpose |
| --- | --- |
| `discord-addons` | Stable public releases |
| `discord-addons-staging` | Testing and refetch candidates |
| `discord-addons-workbench` | Private development/workbench |
| `ShiggyCord` | ShiggyCord client fork |

## License

Repository-owned code is MIT unless otherwise noted. Hide Call Buttons retains the original BSD-3-Clause terms in its plugin folder.
