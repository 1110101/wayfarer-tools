# Wayfarer-Tools
(Formerly known as OPR-Tools)

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![OPR-Tools Telegram Channel](https://img.shields.io/badge/OPR_Tools_Telegram_Channel--blue.svg?logo=telegram&style=social)](https://t.me/oprtools)

Userscript for [Niantic Wayfarer](http://wayfarer.nianticlabs.com/)

## Installation

Wayfarer-Tools is tested with Chrome and Firefox. You need a userscript manager like [Tampermonkey](https://tampermonkey.net/) (You already have one if you use IITC for Ingress). Wayfarer-Tools does not work with Greasemonkey for Firefox.

####⚠🛠 We're working on Wayfarer compatibility. You can download a test-version [here](https://gitlab.com/1110101/opr-tools/raw/feature/wayfarerSupport/opr-tools.user.js?inline=false).


## Features:
- Additional links to map services like Intel, OpenStreetMap, bing and national ones
- Create your own presets for frequent analyses. Wayfarer-tools does not include any presets in order to remain neutral.
- Automatically opens the first listed possible duplicate and the "What is it?" filter text box
- Buttons above the comments box to auto-type common 1-star rejection reasons
- Percent of total reviewed candidates processed
- Translate text buttons for title and description
- Moved overall portal rating to same group as other ratings
- Changed portal markers to small circles, inspired by IITC style
- Made "Nearby portals" list and map scrollable with mouse wheel
- Refresh page if no portal analysis available
- Displays a 20m and 40m capture circle around the candidates location
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
