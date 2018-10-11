# OPR-Tools

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Userscript for [Ingress Operation Portal Recon](https://opr.ingress.com/recon)

> Userscript manager such as [Tampermonkey](https://tampermonkey.net/) required.

> **Download:** https://gitlab.com/1110101/opr-tools/raw/master/opr-tools.user.js

 OPR-Tools is not compatible with Greasemonkey for Firefox.

![](./image/opr-tools-1.png)
![](./image/opr-tools-3.png)
![](./image/opr-tools-2.png)

## Features:
- Additional links to map services like Intel, OpenStreetMap, bing and national ones
- Create your own presets for frequent analyses. OPR-tools does not include any presets in order to remain neutral.
- Automatically opens the first listed possible duplicate and the "What is it?" filter text box
- Buttons above the comments box to auto-type common 1-star rejection reasons
- Percent of total reviewed candidates processed
- Translate text buttons for title and description
- Moved overall portal rating to same group as other ratings
- Changed portal markers to small circles, inspired by IITC style
- Made "Nearby portals" list and map scrollable with mouse wheel
- Refresh page if no portal analysis available
- Displays a 40m capture circle around the candidates location
- Expiration timer in navigation bar
- **Keyboard navigation**

## Keyboard Navigation

You can use keyboard to fully control the page as follows:

|           Key(s)           |                 Function                 |
| :------------------------: | :--------------------------------------: |
|    Keys 1-5, Numpad 1-5    | Valuate current selected field (the yellow highlighted one) |
|       Shift-Keys 1-5       | Apply custom preset (if exists)          |
|             D              | Mark current candidate as a duplicate of the opened portal in "duplicates" |
|             T              |          Open title translation          |
|             Y              |      Open description translation        |
| Space, Enter, Numpad Enter |     Confirm dialog / Send valuation      |
|       Tab, Numpad +        |                Next field                |
| Shift, Backspace, Numpad - |              Previous field              |
|       Esc, Numpad /        |               First field                |
|           \^, Numpad *     |        Skip Portal (if possible)         |
