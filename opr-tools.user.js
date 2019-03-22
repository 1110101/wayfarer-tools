// ==UserScript==
// @name            OPR tools
// @version         0.27.3
// @description     OPR enhancements
// @homepageURL     https://gitlab.com/1110101/opr-tools
// @author          1110101, https://gitlab.com/1110101/opr-tools/graphs/master
// @match           https://opr.ingress.com/
// @match           https://opr.ingress.com/?login=true
// @match           https://opr.ingress.com/recon
// @match           https://opr.ingress.com/help
// @match           https://opr.ingress.com/faq
// @match           https://opr.ingress.com/guide
// @match           https://opr.ingress.com/settings
// @match           https://opr.ingress.com/upgrades*
// @grant           unsafeWindow
// @grant           GM_notification
// @grant           GM_addStyle
// @downloadURL     https://gitlab.com/1110101/opr-tools/raw/master/opr-tools.user.js
// @updateURL       https://gitlab.com/1110101/opr-tools/raw/master/opr-tools.user.js
// @supportURL      https://gitlab.com/1110101/opr-tools/issues
// @require         https://cdnjs.cloudflare.com/ajax/libs/alertifyjs-alertify.js/1.0.11/js/alertify.js
// @require         https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.4.4/proj4.js

// ==/UserScript==

// source https://gitlab.com/1110101/opr-tools
// merge-requests welcome

/*
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

/* globals screen, MutationObserver, addEventListener, localStorage, MutationObserver, GM_addStyle, GM_notification, unsafeWindow, angular, google, alertify, proj4 */

const OPRT = {

  VERSION: 2701,

  PREFERENCES: 'oprt_prefs',

  OPTIONS: {
    KEYBOARD_NAV: 'keyboard_nav',
    NORWAY_MAP_LAYER: 'norway_map_layer',
    PRESET_FEATURE: 'preset_feature',
    SCANNER_OFFSET_FEATURE: 'scanner_offset_feature',
    SCANNER_OFFSET_UI: 'scanner_offset_ui',
    COMMENT_TEMPLATES: 'comment_templates',
    SKIP_ANALYZED_DIALOG: 'skip_analyzed_dialog',

    REFRESH: 'refresh',
    REFRESH_NOTI_DESKTOP: 'refresh_noti_desktop'
  },

  PREFIX: 'oprt_',
  VAR_PREFIX: 'oprt_var', // used in import/export **only**
  VAR: { // will be included in import/export
    SCANNER_OFFSET: 'scanner_offset',
    MAP_TYPE_1: 'map_type_1',
    MAP_TYPE_2: 'map_type_2',
    CUSTOM_PRESETS: 'custom_presets'
  },

  VERSION_CHECK: 'version_check', // outside var, because it should not get Exported

  FROM_REFRESH: 'from_refresh' // sessionStorage
}

function addGlobalStyle (css) {
  GM_addStyle(css)

  addGlobalStyle = () => {} // noop after first run
}

class Preferences {
  constructor () {
    this.options = {}
    this.defaults = {
      [OPRT.OPTIONS.KEYBOARD_NAV]: true,
      [OPRT.OPTIONS.NORWAY_MAP_LAYER]: false,
      [OPRT.OPTIONS.PRESET_FEATURE]: true,
      [OPRT.OPTIONS.SCANNER_OFFSET_FEATURE]: false,
      [OPRT.OPTIONS.SCANNER_OFFSET_UI]: false,
      [OPRT.OPTIONS.COMMENT_TEMPLATES]: true,
      [OPRT.OPTIONS.SKIP_ANALYZED_DIALOG]: true,
      [OPRT.OPTIONS.REFRESH]: true,
      [OPRT.OPTIONS.REFRESH_NOTI_DESKTOP]: true
    }
    this.loadOptions()
  }

  showPreferencesUI (w) {
    let inout = new InOut(this)
    let pageContainer = w.document.querySelector('body > div.container')
    let oprtPreferences = w.document.querySelector('#oprt_sidepanel_container')

    if (oprtPreferences !== null) oprtPreferences.classList.toggle('hide')
    else {
      pageContainer.insertAdjacentHTML('afterbegin', `
<section id="oprt_sidepanel_container" style="
    background: black;
    border-left: 2px gold inset;
    border-top: 2px gold inset;
    border-bottom: 2px gold inset;
    position: absolute;
    right: 0;
    height: 90%;
    padding: 0 20px;
    z-index: 10;
    width: 400px;    
    ">
  <div class="row">
    <div class="col-lg-12">
      <h4 class="gold">OPR Tools Preferences</h4>
    </div>
    <div class="col-lg-12">
      <div class="btn-group" role="group">
        <button id="import_all" class="btn btn-success">Import</button>
        <button id="export_all" class="btn btn-success">Export</button>
      </div>
    </div>
  </div>
  <div id="oprt_options"></div>
  <a id="oprt_reload" class="btn btn-danger hide"><span class="glyphicon glyphicon-refresh"></span>
 Reload to apply changes</a>
 
 <div style="position: absolute; bottom: 0; left: 0; margin:20px;"><a href="https://t.me/oprtools">${TG_SVG} OPR-Tools Telegram Channel</a></div>
 
</section>`)

      let optionsContainer = w.document.getElementById('oprt_options')
      let reloadButton = w.document.getElementById('oprt_reload')

      for (let item in this.options) {
        // remove unknown or removed options
        if (strings.options[item] === undefined) {
          this.remove(item)
          continue
        }

        const div = w.document.createElement('div')
        div.classList.add('checkbox')
        const label = w.document.createElement('label')
        const input = w.document.createElement('input')
        input.type = 'checkbox'
        input.name = item
        input.checked = this.options[item]
        div.appendChild(label)
        label.appendChild(input)
        label.appendChild(w.document.createTextNode(strings.options[item]))
        optionsContainer.insertAdjacentElement('beforeEnd', div)
      }

      optionsContainer.addEventListener('change', (event) => {
        this.set(event.target.name, event.target.checked)
        reloadButton.classList.remove('hide')
      })

      reloadButton.addEventListener('click', () => {
        window.location.reload()
      })

      w.document.getElementById('import_all').addEventListener('click', () => {
        alertify.okBtn('Import').prompt('Paste here:',
          (value, event) => {
            event.preventDefault()
            if (value === 'undefined' || value === '') {
              return
            }
            inout.importFromString(value)
            alertify.success(`✔ Imported preferences`)
          }, event => {
            event.preventDefault()
          }
        )
      })

      w.document.getElementById('export_all').addEventListener('click', () => {
        if (navigator.clipboard !== undefined) {
          navigator.clipboard.writeText(inout.exportAll()).then(() => {
            alertify.success(`✔ Exported preferences to your clipboard!`)
          }, () => {
            // ugly alert as fallback
            alertify.alert(inout.exportAll())
          })
        } else {
          alertify.alert(inout.exportAll())
        }
      }
      )
    }
  }

  loadOptions () {
    Object.assign(this.options, this.defaults, JSON.parse(localStorage.getItem(OPRT.PREFERENCES)))
  }

  set (key, value) {
    this.options[key] = value
    localStorage.setItem(OPRT.PREFERENCES, JSON.stringify(this.options))
  }

  get (key) {
    return this.options[key]
  }

  remove (key) {
    delete this.options[key]
    localStorage.setItem(OPRT.PREFERENCES, JSON.stringify(this.options))
  }

  exportPrefs () {
    return JSON.stringify(this.options)
  }

  importPrefs (string) {
    try {
      this.options = JSON.parse(string)
      localStorage.setItem(OPRT.PREFERENCES, JSON.stringify(this.options))
    } catch (e) {
      throw new Error('Could not import preferences!')
    }
  }
}

class InOut {
  constructor (preferences) {
    this.preferences = preferences
  }

  static exportVars () {
    let exportObject = {}
    for (const item in OPRT.VAR) {
      exportObject[OPRT.VAR[item]] = localStorage.getItem(OPRT.PREFIX + OPRT.VAR[item])
    }
    return exportObject
  }

  static importVars (string) {
    let importObject = JSON.parse(string)
    for (const item of importObject) {
      localStorage.setItem(OPRT.PREFIX + item, importObject[item])
    }
  }

  importFromString (string) {
    try {
      let json = JSON.parse(string)

      if (json.hasOwnProperty(OPRT.PREFERENCES)) { this.preferences.importPrefs(json[OPRT.PREFERENCES]) }

      if (json.hasOwnProperty(OPRT.VAR)) { InOut.importVars(json[OPRT.VAR]) }
    } catch (e) {
      throw new Error('Import failed')
    }
  }

  exportAll () {
    return JSON.stringify(Object.assign({}, { [OPRT.PREFERENCES]: this.preferences.exportPrefs() }, { [OPRT.VAR_PREFIX]: InOut.exportVars() }))
  }
}

function init () {
  const w = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  let tryNumber = 15

  let oprtCustomPresets

  let browserLocale = window.navigator.languages[0] || window.navigator.language || 'en'

  let preferences = new Preferences()

  const initWatcher = setInterval(() => {
    if (tryNumber === 0) {
      clearInterval(initWatcher)
      w.document.getElementById('NewSubmissionController')
        .insertAdjacentHTML('afterBegin', `
<div class='alert alert-danger'><strong><span class='glyphicon glyphicon-remove'></span> OPR-Tools initialization failed, refresh page</strong></div>
`)
      addRefreshContainer()
      return
    }
    if (w.angular) {
      let err = false
      try {
        initAngular()
      } catch (error) {
        err = error
        // console.log(error);
      }
      if (!err) {
        try {
          initScript()
          clearInterval(initWatcher)
        } catch (error) {
          console.log(error)
          if (error.message === '41') {
            addRefreshContainer()
          }
          if (error.message !== '42') {
            clearInterval(initWatcher)
          }
        }
      }
    }
    tryNumber--
  }, 1000)

  function initAngular () {
    const el = w.document.querySelector('[ng-app="portalApp"]')
    w.$app = w.angular.element(el)
    w.$injector = w.$app.injector()
    w.inject = w.$injector.invoke
    w.$rootScope = w.$app.scope()

    w.getService = function getService (serviceName) {
      w.inject([serviceName, function (s) { w[serviceName] = s }])
    }

    w.$scope = element => w.angular.element(element).scope()
  }

  function initScript () {
    // adding CSS
    addGlobalStyle(GLOBAL_CSS)

    modifyHeader()

    const subMissionDiv = w.document.getElementById('NewSubmissionController')

    // check if subCtrl exists (should exists if we're on /recon)
    if (subMissionDiv !== null && w.$scope(subMissionDiv).subCtrl !== null) {
      const subController = w.$scope(subMissionDiv).subCtrl
      const newPortalData = subController.pageData

      const whatController = w.$scope(w.document.getElementById('WhatIsItController')).whatCtrl

      const answerDiv = w.document.getElementById('AnswersController')
      const ansController = w.$scope(answerDiv).answerCtrl

      if (subController.errorMessage !== '') {
        // no portal analysis data available
        throw new Error(41) // @todo better error code
      }

      if (typeof newPortalData === 'undefined') {
        // no submission data present
        throw new Error(42) // @todo better error code
      }

      // detect portal edit
      if (subController.reviewType === 'NEW') {
        modifyNewPage(ansController, subController, whatController, newPortalData)
      } else if (subController.reviewType === 'EDIT') {
        modifyEditPage(ansController, subController, newPortalData)
      }

      checkIfAutorefresh()

      startExpirationTimer(subController)

      versionCheck()
    }
  }

  function modifyNewPage (ansController, subController, whatController, newPortalData) {
    mapButtons(newPortalData, w.document.getElementById('descriptionDiv'), 'beforeEnd')

    // mutation observer
    const bodyObserver = new MutationObserver(mutationList => {
      for (let mutationRecord of mutationList) {
        // we just want addednodes with (class:modal). null and undefined check for performance reasons
        if (mutationRecord.addedNodes.length > 0 && mutationRecord.addedNodes[0].className === 'modal fade ng-isolate-scope') {
          // adds keyboard-numbers to lowquality sub-sub-lists
          let sublistItems = mutationRecord.addedNodes[0].querySelectorAll('ul.sub-group-list')
          if (sublistItems !== undefined) {
            sublistItems.forEach(el => {
              let i = 1
              el.querySelectorAll('li > a').forEach(el2 => { el2.insertAdjacentHTML('afterbegin', `<kbd>${i++}</kbd> `) })
            })
            let i = 1
            // adds keyboard numbers to lowquality sub-list
            mutationRecord.addedNodes[0].querySelectorAll('label.sub-group')
              .forEach(el2 => { el2.insertAdjacentHTML('beforeend', `<kbd class="pull-right ">${i++}</kbd>`) })
          }
          // skip "Your analysis has been recorded" dialog
          if (preferences.get(OPRT.OPTIONS.SKIP_ANALYZED_DIALOG) && mutationRecord.addedNodes[0].querySelector('.modal-body a[href=\'/recon\']') !== null) {
            w.document.location.href = '/recon'
          }
        }
      }
    })
    bodyObserver.observe(w.document.body, { childList: true })

    let newSubmitDiv = moveSubmitButton()
    let { submitButton, submitAndNext } = quickSubmitButton(newSubmitDiv, ansController, bodyObserver)

    if (preferences.get(OPRT.OPTIONS.COMMENT_TEMPLATES)) { commentTemplates() }

    /* region presets start */
    if (preferences.get(OPRT.OPTIONS.PRESET_FEATURE)) {
      const customPresetUI = `
<div class="row" id="presets"><div class="col-xs-12">
  <div>Presets&nbsp;<button class="button btn btn-default btn-xs" id="addPreset">+</button></div>
  <div class='btn-group' id="customPresets"></div>
</div></div>`

      w.document.querySelector('form[name="answers"] div.row').insertAdjacentHTML('afterend', customPresetUI)

      addCustomPresetButtons()

      // we have to inject the tooltip to angular
      w.$injector.invoke(['$compile', ($compile) => {
        let compiledSubmit = $compile(`<span class="glyphicon glyphicon-info-sign darkgray" uib-tooltip-trigger="outsideclick" uib-tooltip-placement="left" tooltip-class="goldBorder" uib-tooltip="(OPR-Tools) Create your own presets for stuff like churches, playgrounds or crosses'.\nHowto: Answer every question you want included and click on the +Button.\n\nTo delete a preset shift-click it."></span>&nbsp; `)(w.$scope(document.getElementById('descriptionDiv')))
        w.document.getElementById('addPreset').insertAdjacentElement('beforebegin', compiledSubmit[0])
      }])

      // click listener for +preset button
      w.document.getElementById('addPreset').addEventListener('click', event => {
        alertify.okBtn('Save').prompt('New preset name:',
          (value, event) => {
            event.preventDefault()
            if (value === 'undefined' || value === '') {
              return
            }
            saveCustomPreset(value, ansController, whatController)
            alertify.success(`✔ Created preset <i>${value}</i>`)
            addCustomPresetButtons()
          }, event => {
            event.preventDefault()
          }
        )
      })

      let clickListener = event => {
        const source = event.target || event.srcElement
        let value = source.id
        if (value === '' || event.target.nodeName !== 'BUTTON') {
          return
        }

        let preset = oprtCustomPresets.find(item => item.uid === value)

        if (event.shiftKey) {
          alertify.log(`Deleted preset <i>${preset.label}</i>`)
          w.document.getElementById(preset.uid).remove()
          deleteCustomPreset(preset)
          return
        }

        ansController.formData.quality = preset.quality
        ansController.formData.description = preset.description
        ansController.formData.cultural = preset.cultural
        ansController.formData.uniqueness = preset.uniqueness
        ansController.formData.location = preset.location
        ansController.formData.safety = preset.safety

        // the controller's set by ID function doesn't work
        // and autocomplete breaks if there are any spaces
        // so set the field to the first word from name and match autocomplete by ID
        // at the very least, I know this will set it and leave the UI looking like it was manually set.
        whatController.whatInput = preset.nodeName.split(' ')[0]
        let nodes = whatController.getWhatAutocomplete()
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === preset.nodeId) {
            whatController.setWhatAutocompleteNode(nodes[i])
            break
          }
        }
        whatController.whatInput = ''

        // update ui
        event.target.blur()
        w.$rootScope.$apply()

        alertify.success(`✔ Applied <i>${preset.label}</i>`)
      }

      w.document.getElementById('customPresets').addEventListener('click', clickListener, false)
    }
    /* endregion presets end */

    // make photo filmstrip scrollable
    const filmstrip = w.document.getElementById('map-filmstrip')
    let lastScrollLeft = filmstrip.scrollLeft

    function scrollHorizontally (e) {
      e = window.event || e
      if ((('deltaY' in e && e.deltaY !== 0) || ('wheelDeltaY' in e && e.wheelDeltaY !== 0)) && lastScrollLeft === filmstrip.scrollLeft) {
        e.preventDefault()
        const delta = (e.wheelDeltaY || -e.deltaY * 25 || -e.detail)
        filmstrip.scrollLeft -= (delta)
        lastScrollLeft = filmstrip.scrollLeft
      }
    }

    filmstrip.addEventListener('wheel', scrollHorizontally, false)
    filmstrip.addEventListener('DOMMouseScroll', scrollHorizontally, false)

    // hotfix for #27 not sure if it works
    let _initMap = subController.initMap
    subController.initMap = () => {
      _initMap()
      mapMarker(subController.markers)
    }

    mapOriginCircle(subController.map2)
    mapMarker(subController.markers)
    mapTypes(subController.map, false)
    mapTypes(subController.map2, true)

    // hook resetStreetView() and re-apply map types and options to first map. not needed for duplicates because resetMap() just resets the position
    let _resetStreetView = subController.resetStreetView
    subController.resetStreetView = () => {
      _resetStreetView()
      mapOriginCircle(subController.map2)
      mapTypes(subController.map2, true)
    }

    // adding a green 40m circle and a smaller 20m circle around the new location marker that updates on dragEnd
    let draggableMarkerCircle
    let draggableMarkerCircleSmall
    let _showDraggableMarker = subController.showDraggableMarker
    subController.showDraggableMarker = () => {
      _showDraggableMarker()

      w.getService('NewSubmissionDataService')
      let newLocMarker = w.NewSubmissionDataService.getNewLocationMarker()

      google.maps.event.addListener(newLocMarker, 'dragend', function () {
        if (draggableMarkerCircle == null) {
          draggableMarkerCircle = new google.maps.Circle({
            map: subController.map2,
            center: newLocMarker.position,
            radius: 40,
            strokeColor: '#4CAF50', // material green 500
            strokeOpacity: 1,
            strokeWeight: 2,
            fillOpacity: 0
          })
        } else draggableMarkerCircle.setCenter(newLocMarker.position)
      })

      google.maps.event.addListener(newLocMarker, 'dragend', function () {
        if (draggableMarkerCircleSmall == null) {
          draggableMarkerCircleSmall = new google.maps.Circle({
            map: subController.map2,
            center: newLocMarker.position,
            radius: 20,
            strokeColor: '#4CCF50',
            strokeOpacity: 1,
            strokeWeight: 2,
            fillOpacity: 0
          })
        } else draggableMarkerCircleSmall.setCenter(newLocMarker.position)
      })
    }

    document.querySelector('#street-view + small').insertAdjacentHTML('beforeBegin', '<small class="pull-left"><span style="color:#ebbc4a">Outer circle:</span> 40m, <span style="color:#effc4a">inner circle:</span> 20m</small>')

    // move portal rating to the right side. don't move on mobile devices / small width
    if (screen.availWidth > 768) {
      let nodeToMove = w.document.querySelector('div[class="btn-group"]').parentElement
      if (subController.hasSupportingImageOrStatement) {
        const descDiv = w.document.getElementById('descriptionDiv')
        const scorePanel = descDiv.querySelector('div.text-center.hidden-xs')
        scorePanel.insertBefore(nodeToMove, scorePanel.firstChild)
      } else {
        const scorePanel = w.document.querySelector('div[class~="pull-right"]')
        scorePanel.insertBefore(nodeToMove, scorePanel.firstChild)
      }
    }

    // bind click-event to Dup-Images-Filmstrip. result: a click to the detail-image the large version is loaded in another tab
    const imgDups = w.document.querySelectorAll('#map-filmstrip > ul > li > img')
    const openFullImage = function () {
      w.open(`${this.src}=s0`, 'fulldupimage')
    }
    for (let imgSep in imgDups) {
      if (imgDups.hasOwnProperty(imgSep)) {
        imgDups[imgSep].addEventListener('click', () => {
          const imgDup = w.document.querySelector('#content > img')
          if (imgDup !== null) {
            imgDup.removeEventListener('click', openFullImage)
            imgDup.addEventListener('click', openFullImage)
            imgDup.setAttribute('style', 'cursor: pointer;')
          }
        })
      }
    }

    // add translate buttons to title and description (if existing)
    let lang = 'en'
    try { lang = browserLocale.split('-')[0] } catch (e) {}
    const link = w.document.querySelector('#descriptionDiv a')
    const content = link.innerText.trim()
    let a = w.document.createElement('a')
    let span = w.document.createElement('span')
    span.className = 'glyphicon glyphicon-book'
    span.innerHTML = ' '
    a.appendChild(span)
    a.className = 'translate-title button btn btn-default pull-right'
    a.target = 'translate'
    a.style.setProperty('padding', '0px 4px')
    a.href = `https://translate.google.com/#auto/${lang}/${encodeURIComponent(content)}`
    link.insertAdjacentElement('afterend', a)

    const description = w.document.querySelector('#descriptionDiv').innerHTML.split('<br>')[3].trim()
    if (description !== '&lt;No description&gt;' && description !== '') {
      a = w.document.createElement('a')
      span = w.document.createElement('span')
      span.className = 'glyphicon glyphicon-book'
      span.innerHTML = ' '
      a.appendChild(span)
      a.className = 'translate-description button btn btn-default pull-right'
      a.target = 'translate'
      a.style.setProperty('padding', '0px 4px')
      a.href = `https://translate.google.com/#auto/${lang}/${encodeURIComponent(description)}`
      const br = w.document.querySelectorAll('#descriptionDiv br')[2]
      br.insertAdjacentElement('afterend', a)
    }

    // automatically open the first listed possible duplicate
    try {
      const e = w.document.querySelector('#map-filmstrip > ul > li:nth-child(1) > img')
      if (e !== null) {
        setTimeout(() => {
          e.click()
        }, 500)
      }
    } catch (err) {}

    expandWhatIsItBox()

    // Fix rejectComment width
    let _showLowQualityModal = ansController.showLowQualityModal
    ansController.showLowQualityModal = () => {
      _showLowQualityModal()
      setTimeout(() => {
        let rejectReasonTA = w.document.querySelector('textarea[ng-model="answerCtrl2.rejectComment"]')
        rejectReasonTA.style.setProperty('max-width', '100%')
      }, 10)
    }

    /* region keyboard nav */
    if (preferences.get(OPRT.OPTIONS.KEYBOARD_NAV)) {
      activateShortcuts()
    }

    function activateShortcuts () {
      // keyboard navigation
      // documentation: https://gitlab.com/1110101/opr-tools#keyboard-navigation

      let currentSelectable = 0
      let maxItems = 7
      let selectedReasonGroup = -1
      let selectedReasonSubGroup = -1

      // Reset when modal is closed
      let _resetLowQuality = ansController.resetLowQuality
      ansController.resetLowQuality = () => {
        _resetLowQuality()
        selectedReasonGroup = -1
        selectedReasonSubGroup = -1
        currentSelectable = 0
        highlight()
      }

      // a list of all 6 star button rows, and the two submit buttons
      let starsAndSubmitButtons
      if (subController.hasSupportingImageOrStatement) {
        starsAndSubmitButtons = w.document.querySelectorAll('.col-sm-6 .btn-group, .text-center.hidden-xs:not(.ng-hide) .btn-group, .big-submit-button')
      } else {
        starsAndSubmitButtons = w.document.querySelectorAll('.col-sm-6 .btn-group, .col-sm-4.hidden-xs .btn-group, .big-submit-button')
      }

      function highlight () {
        starsAndSubmitButtons.forEach((element) => { element.style.setProperty('border', 'none') })
        if (currentSelectable <= maxItems - 2) {
          starsAndSubmitButtons[currentSelectable].style.setProperty('border', '1px dashed #ebbc4a')
          submitAndNext.blur()
          submitButton.blur()
        } else if (currentSelectable === 6) {
          submitAndNext.focus()
        } else if (currentSelectable === 7) {
          submitButton.focus()
        }
      }

      addEventListener('keydown', (event) => {
        /*
        keycodes:

        8: Backspace
        9: TAB
        13: Enter
        16: Shift
        27: Escape
        32: Space
        68: D
        107: NUMPAD +
        109: NUMPAD -
        111: NUMPAD /

        49 - 53:  Keys 1-5
        97 - 101: NUMPAD 1-5

         */

        let numkey = null
        if (event.keyCode >= 49 && event.keyCode <= 55) {
          numkey = event.keyCode - 48
        } else if (event.keyCode >= 97 && event.keyCode <= 103) {
          numkey = event.keyCode - 96
        }

        // do not do anything if a text area or a input with type text has focus
        if (w.document.querySelector('input[type=text]:focus') || w.document.querySelector('textarea:focus')) {
          return
        } else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector('a.button[href="/recon"]')) {
          // "analyze next" button
          w.document.location.href = '/recon'
          event.preventDefault()
        } else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector('[ng-click="answerCtrl2.confirmLowQuality()"]')) {
          // submit low quality rating
          w.document.querySelector('[ng-click="answerCtrl2.confirmLowQuality()"]').click()
          currentSelectable = 0
          event.preventDefault()
        } else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector('[ng-click="answerCtrl2.confirmLowQualityOld()"]')) {
          // submit low quality rating alternate
          w.document.querySelector('[ng-click="answerCtrl2.confirmLowQualityOld()"]').click()
          currentSelectable = 0
          event.preventDefault()
        } else if ((event.keyCode === 68) && w.document.querySelector('#content > button')) {
          // click first/selected duplicate (key D)
          w.document.querySelector('#content > button').click()
          currentSelectable = 0
          event.preventDefault()
        } else if (event.keyCode === 84) {
          // click on translate title link (key T)
          const link = w.document.querySelector('#descriptionDiv > .translate-title')
          if (link) {
            link.click()
            event.preventDefault()
          }
        } else if (event.keyCode === 89) {
          // click on translate description link (key Y)
          const link = w.document.querySelector('#descriptionDiv > .translate-description')
          if (link) {
            link.click()
            event.preventDefault()
          }
        } else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector('[ng-click="answerCtrl2.confirmDuplicate()"]')) {
          // submit duplicate
          w.document.querySelector('[ng-click="answerCtrl2.confirmDuplicate()"]').click()
          currentSelectable = 0
          event.preventDefault()
        } else if ((event.keyCode === 13 || event.keyCode === 32) && currentSelectable === maxItems) {
          // submit normal rating
          w.document.querySelector('[ng-click="answerCtrl.submitForm()"]').click()
          event.preventDefault()
        } else if ((event.keyCode === 27 || event.keyCode === 111) && w.document.querySelector('[ng-click="answerCtrl2.resetDuplicate()"]')) {
          // close duplicate dialog
          w.document.querySelector('[ng-click="answerCtrl2.resetDuplicate()"]').click()
          currentSelectable = 0
          event.preventDefault()
        } else if ((event.keyCode === 27 || event.keyCode === 111) && w.document.querySelector('[ng-click="answerCtrl2.resetLowQuality()"]')) {
          // close low quality ration dialog
          w.document.querySelector('[ng-click="answerCtrl2.resetLowQuality()"]').click()
          currentSelectable = 0
          event.preventDefault()
        } else if (event.keyCode === 27 || event.keyCode === 111) {
          // return to first selection (should this be a portal)
          currentSelectable = 0
          event.preventDefault()
        } else if (event.keyCode === 106 || event.keyCode === 220) {
          // skip portal if possible
          if (newPortalData.canSkip) {
            ansController.skipToNext()
          }
        } else if (event.keyCode === 72) {
          showHelp() // @todo
        } else if (w.document.querySelector('[ng-click="answerCtrl2.confirmLowQuality()"]')) {
          // Reject reason shortcuts
          if (numkey != null) {
            if (selectedReasonGroup === -1) {
              try {
                w.document.getElementById('sub-group-' + numkey).click()
                selectedReasonGroup = numkey - 1
                w.document.querySelectorAll('label.sub-group kbd').forEach(el => el.classList.add('hide'))
              } catch (err) {}
            } else {
              if (selectedReasonSubGroup === -1) {
                try {
                  w.document.querySelectorAll('#reject-reason ul ul')[selectedReasonGroup].children[numkey - 1].children[0].click()
                  selectedReasonSubGroup = numkey - 1
                } catch (err) {}
              } else {
                w.document.getElementById('root-label').click()
                selectedReasonGroup = -1
                selectedReasonSubGroup = -1
                w.document.querySelectorAll('label.sub-group kbd').forEach(el => el.classList.remove('hide'))
              }
            }
            event.preventDefault()
          }
        } else if ((event.keyCode === 107 || event.keyCode === 9) && currentSelectable < maxItems) {
          // select next rating
          currentSelectable++
          event.preventDefault()
        } else if ((event.keyCode === 109 || event.keyCode === 16 || event.keyCode === 8) && currentSelectable > 0) {
          // select previous rating
          currentSelectable--
          event.preventDefault()
        } else if (numkey === null || currentSelectable > maxItems - 2) {
          return
        } else if (numkey !== null && event.shiftKey) {
          try {
            w.document.getElementsByClassName('customPresetButton')[numkey - 1].click()
          } catch (e) {
            // ignore
          }
        } else {
          // rating 1-5
          starsAndSubmitButtons[currentSelectable].querySelectorAll('button.button-star')[numkey - 1].click()
          currentSelectable++
        }
        highlight()
      })

      highlight()
    }

    /* endregion keyboard nav */

    modifyNewPage = () => {} // eslint-disable-line
  }

  function modifyEditPage (ansController, subController, newPortalData) {
    let editDiv = w.document.querySelector('div[ng-show="subCtrl.reviewType===\'EDIT\'"]')

    mapButtons(newPortalData, editDiv, 'afterEnd')

    // mutation observer
    const bodyObserver = new MutationObserver(mutationList => {
      for (let mutationRecord of mutationList) {
        // we just want addednodes with (class:modal). null and undefined check for performance reasons
        if (mutationRecord.addedNodes.length > 0 &&
          mutationRecord.addedNodes[0].className === 'modal fade ng-isolate-scope' &&
          mutationRecord.addedNodes[0].querySelector('.modal-body a[href=\'/recon\']') !== null) {
          w.document.location.href = '/recon'
        }
      }
    })
    bodyObserver.observe(w.document.body, { childList: true })

    let newSubmitDiv = moveSubmitButton()
    let { submitButton, submitAndNext } = quickSubmitButton(newSubmitDiv, ansController, bodyObserver)

    if (preferences.get(OPRT.OPTIONS.COMMENT_TEMPLATES)) { commentTemplates() }

    mapTypes(subController.locationEditsMap, true)

    // add translation links to title and description edits
    if (newPortalData.titleEdits.length > 1 || newPortalData.descriptionEdits.length > 1) {
      for (const titleEditBox of editDiv.querySelectorAll('.titleEditBox')) {
        const content = titleEditBox.innerText.trim()
        let a = w.document.createElement('a')
        let span = w.document.createElement('span')
        span.className = 'glyphicon glyphicon-book'
        span.innerHTML = ' '
        a.appendChild(span)
        a.className = 'translate-title button btn btn-default pull-right'
        a.target = 'translate'
        a.style.setProperty('padding', '0px 4px')
        a.href = `https://translate.google.com/#auto/${browserLocale.split('-')[0]}/${encodeURIComponent(content)}`
        titleEditBox.querySelector('p').style.setProperty('display', 'inline-block')
        titleEditBox.insertAdjacentElement('beforeEnd', a)
      }
    }

    if (newPortalData.titleEdits.length <= 1) {
      let titleDiv = editDiv.querySelector('div[ng-show="subCtrl.pageData.titleEdits.length <= 1"] h3')
      const content = titleDiv.innerText.trim()
      let a = w.document.createElement('a')
      let span = w.document.createElement('span')
      span.className = 'glyphicon glyphicon-book'
      span.innerHTML = ' '
      a.appendChild(span)
      a.className = 'translate-title button btn btn-default'
      a.target = 'translate'
      a.style.setProperty('padding', '0px 4px')
      a.style.setProperty('margin-left', '14px')
      a.href = `https://translate.google.com/#auto/${browserLocale.split('-')[0]}/${encodeURIComponent(content)}`
      titleDiv.insertAdjacentElement('beforeend', a)
    }

    if (newPortalData.descriptionEdits.length <= 1) {
      let titleDiv = editDiv.querySelector('div[ng-show="subCtrl.pageData.descriptionEdits.length <= 1"] p')
      const content = titleDiv.innerText.trim() || ''
      if (content !== '<No description>' && content !== '') {
        let a = w.document.createElement('a')
        let span = w.document.createElement('span')
        span.className = 'glyphicon glyphicon-book'
        span.innerHTML = ' '
        a.appendChild(span)
        a.className = 'translate-title button btn btn-default'
        a.target = 'translate'
        a.style.setProperty('padding', '0px 4px')
        a.style.setProperty('margin-left', '14px')
        a.href = `https://translate.google.com/#auto/${browserLocale.split('-')[0]}/${encodeURIComponent(content)}`
        titleDiv.insertAdjacentElement('beforeEnd', a)
      }
    }

    expandWhatIsItBox()

    // fix locationEditsMap if only one location edit exists
    if (newPortalData.locationEdits.length <= 1 || subController.locationEditsMap.getZoom() > 19) {
      subController.locationEditsMap.setZoom(19)
    }

    /* EDIT PORTAL */
    /* region keyboard navigation */

    if (preferences.get(OPRT.OPTIONS.KEYBOARD_NAV)) {
      activateShortcuts()
    }

    function activateShortcuts () {
      let currentSelectable = 0
      let hasLocationEdit = (newPortalData.locationEdits.length > 1)
      // counting *true*, please don't shoot me
      let maxItems = (newPortalData.descriptionEdits.length > 1) + (newPortalData.titleEdits.length > 1) + (hasLocationEdit) + 2

      let mapMarkers
      if (hasLocationEdit) mapMarkers = subController.allLocationMarkers
      else mapMarkers = []

      // a list of all 6 star button rows, and the two submit buttons
      let starsAndSubmitButtons = w.document.querySelectorAll(
        'div[ng-show="subCtrl.reviewType===\'EDIT\'"] > div[ng-show="subCtrl.pageData.titleEdits.length > 1"]:not(.ng-hide),' +
        'div[ng-show="subCtrl.reviewType===\'EDIT\'"] > div[ng-show="subCtrl.pageData.descriptionEdits.length > 1"]:not(.ng-hide),' +
        'div[ng-show="subCtrl.reviewType===\'EDIT\'"] > div[ng-show="subCtrl.pageData.locationEdits.length > 1"]:not(.ng-hide),' +
        '.big-submit-button')

      /* EDIT PORTAL */
      function highlight () {
        let el = editDiv.querySelector('h3[ng-show="subCtrl.pageData.locationEdits.length > 1"]')
        el.style.setProperty('border', 'none')

        starsAndSubmitButtons.forEach((element) => { element.style.setProperty('border', 'none') })
        if (hasLocationEdit && currentSelectable === maxItems - 3) {
          el.style.setProperty('border-left', '4px dashed #ebbc4a')
          el.style.setProperty('border-top', '4px dashed #ebbc4a')
          el.style.setProperty('border-right', '4px dashed #ebbc4a')
          el.style.setProperty('padding', '16px')
          el.style.setProperty('margin-bottom', '0')
          submitAndNext.blur()
          submitButton.blur()
        } else if (currentSelectable < maxItems - 2) {
          starsAndSubmitButtons[currentSelectable].style.setProperty('border-left', '4px dashed #ebbc4a')
          starsAndSubmitButtons[currentSelectable].style.setProperty('padding-left', '16px')
          submitAndNext.blur()
          submitButton.blur()
        } else if (currentSelectable === maxItems - 2) {
          submitAndNext.focus()
        } else if (currentSelectable === maxItems) {
          submitButton.focus()
        }
      }

      /* EDIT PORTAL */
      addEventListener('keydown', (event) => {
        /*
        Keycodes:

        8: Backspace
        9: TAB
        13: Enter
        16: Shift
        27: Escape
        32: Space
        68: D
        107: NUMPAD +
        109: NUMPAD -
        111: NUMPAD /

        49 - 53:  Keys 1-5
        97 - 101: NUMPAD 1-5
         */

        let numkey = null
        if (event.keyCode >= 49 && event.keyCode <= 53) {
          numkey = event.keyCode - 48
        } else if (event.keyCode >= 97 && event.keyCode <= 101) {
          numkey = event.keyCode - 96
        }

        // do not do anything if a text area or a input with type text has focus
        if (w.document.querySelector('input[type=text]:focus') || w.document.querySelector('textarea:focus')) {
          return
        } else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector('a.button[href="/recon"]')) {
          // "analyze next" button
          w.document.location.href = '/recon'
          event.preventDefault()
        } else if ((event.keyCode === 13 || event.keyCode === 32) && currentSelectable === maxItems) {
          // submit normal rating
          w.document.querySelector('[ng-click="answerCtrl.submitForm()"]').click()
          event.preventDefault()
        } else if (event.keyCode === 27 || event.keyCode === 111) {
          // return to first selection (should this be a portal)
          currentSelectable = 0
        } else if ((event.keyCode === 107 || event.keyCode === 9) && currentSelectable < maxItems) {
          // select next rating
          currentSelectable++
          event.preventDefault()
        } else if ((event.keyCode === 109 || event.keyCode === 16 || event.keyCode === 8) && currentSelectable > 0) {
          // select previous rating
          currentSelectable--
          event.preventDefault()
        } else if (numkey === null || currentSelectable > maxItems - 2) {
          return
        } else {
          // rating 1-5
          if (hasLocationEdit && currentSelectable === maxItems - 3 && numkey <= mapMarkers.length) {
            google.maps.event.trigger(angular.element(document.getElementById('NewSubmissionController')).scope().getAllLocationMarkers()[numkey - 1], 'click')
          } else {
            if (hasLocationEdit) numkey = 1
            starsAndSubmitButtons[currentSelectable].querySelectorAll('.titleEditBox, input[type="checkbox"]')[numkey - 1].click()
            currentSelectable++
          }
        }
        highlight()
      })

      highlight()
    }
  }

  // add map buttons
  function mapButtons (newPortalData, targetElement, where) {
    // coordinate format conversion
    const coordUtm33 = proj4('+proj=longlat', '+proj=utm +zone=33', [newPortalData.lng, newPortalData.lat])
    const coordUtm35 = proj4('+proj=longlat', '+proj=utm +zone=35', [newPortalData.lng, newPortalData.lat])
    const coordPuwg92 = proj4('+proj=longlat', '+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +units=m +no_defs', [newPortalData.lng, newPortalData.lat])

    const mapButtons = `
<a class='button btn btn-default' target='intel' href='https://intel.ingress.com/intel?ll=${newPortalData.lat},${newPortalData.lng}&z=17'>Intel</a>
<a class='button btn btn-default' target='wikimapia' href='http://wikimapia.org/#lat=${newPortalData.lat}&lon=${newPortalData.lng}&z=16'>Wikimapia</a>
`

    // more map buttons in a dropdown menu
    const mapDropdown = `
<li><a target='osm' href='https://www.openstreetmap.org/?mlat=${newPortalData.lat}&mlon=${newPortalData.lng}&zoom=16'>OSM</a></li>
<li><a target='bing' href='https://bing.com/maps/default.aspx?cp=${newPortalData.lat}~${newPortalData.lng}&lvl=16&style=a'>bing</a></li>
<li><a target='heremaps' href='https://wego.here.com/?map=${newPortalData.lat},${newPortalData.lng},17,satellite'>HERE maps</a></li>
<li><a targeT='zoomearth' href='https://zoom.earth/#${newPortalData.lat},${newPortalData.lng},18z,sat'>Zoom Earth</a></li>
<li role='separator' class='divider'></li>
<li><a target='swissgeo' href='http://map.geo.admin.ch/?swisssearch=${newPortalData.lat},${newPortalData.lng}'>CH - Swiss Geo Map</a></li>
<li><a target='mapycz' href='https://mapy.cz/zakladni?x=${newPortalData.lng}&y=${newPortalData.lat}&z=17&base=ophoto&source=coor&id=${newPortalData.lng}%2C${newPortalData.lat}&q=${newPortalData.lng}%20${newPortalData.lat}'>CZ-mapy.cz (ortofoto)</a></li>
<li><a target='mapycz' href='https://mapy.cz/zakladni?x=${newPortalData.lng}&y=${newPortalData.lat}&z=17&base=ophoto&m3d=1&height=180&yaw=-279.39&pitch=-40.7&source=coor&id=${newPortalData.lng}%2C${newPortalData.lat}&q=${newPortalData.lng}%20${newPortalData.lat}'>CZ-mapy.cz (orto+3D)</a></li>
<li><a target='kompass' href='http://maps.kompass.de/#lat=${newPortalData.lat}&lon=${newPortalData.lng}&z=17'>DE - Kompass.maps</a></li>
<li><a target='bayernatlas' href='https://geoportal.bayern.de/bayernatlas/index.html?X=${newPortalData.lat}&Y=${newPortalData.lng}&zoom=14&lang=de&bgLayer=luftbild&topic=ba&catalogNodes=122'>DE - BayernAtlas</a></li>
<li><a target='pegel' href='http://opr.pegel.dk/?17/${newPortalData.lat}/${newPortalData.lng}'>DK - SDFE Orthophotos</a></li>
<li><a target='kortforsyningen' href='https://skraafoto.kortforsyningen.dk/oblivisionjsoff/index.aspx?project=Denmark&lon=${newPortalData.lng}&lat=${newPortalData.lat}'>DK - Kortforsyningen Skråfoto</a></li>
<li><a target='maanmittauslaitos' href='https://asiointi.maanmittauslaitos.fi/karttapaikka/?lang=en&share=customMarker&n=${coordUtm35[1].toFixed(3)}&e=${coordUtm35[0].toFixed(3)}&title=${encodeURIComponent(newPortalData.title)}&desc=&zoom=11&layers=%5B%7B%22id%22%3A2%2C%22opacity%22%3A100%7D%5D'>FI - Maanmittauslaitos</a></li>
<li><a target='paikkatietoikkuna' href='https://kartta.paikkatietoikkuna.fi/?zoomLevel=11&coord=${coordUtm35[0].toFixed(3)}_${coordUtm35[1].toFixed(3)}&mapLayers=801+100+default&uuid=90246d84-3958-fd8c-cb2c-2510cccca1d3&showMarker=true'>FI - Paikkatietoikkuna</a></li>
<li><a target='kakao' href='http://map.daum.net/link/map/${newPortalData.lat},${newPortalData.lng}'>KR - Kakao map</a></li>
<li><a target='naver' href='http://map.naver.com/?menu=location&lat=${newPortalData.lat}&lng=${newPortalData.lng}&dLevel=14&title=CandidatePortalLocation'>KR - Naver map</a></li>
<li><a target='kartverket' href='http://norgeskart.no/#!?project=seeiendom&layers=1002,1014&zoom=17&lat=${coordUtm33[1].toFixed(2)}&lon=${coordUtm33[0].toFixed(2)}&sok=${newPortalData.lat},${newPortalData.lng}'>NO - Kartverket</a></li>
<li><a target='norgeibilder' href='https://norgeibilder.no/?x=${Math.round(coordUtm33[0])}&y=${Math.round(coordUtm33[1])}&level=16&utm=33'>NO - Norge i Bilder</a></li>
<li><a target='finnno' href='http://kart.finn.no/?lng=${newPortalData.lng}&lat=${newPortalData.lat}&zoom=17&mapType=normap&markers=${newPortalData.lng},${newPortalData.lat},r,'>NO - Finn Kart</a></li>
<li><a target='toposvalbard' href='http://toposvalbard.npolar.no/?lat=${newPortalData.lat}&long=${newPortalData.lng}&zoom=17&layer=map'>NO - Polarinstituttet, Svalbard</a></li>
<li><a target='geoportal_pl' href='http://mapy.geoportal.gov.pl/imap/?actions=acShowWgButtonPanel_kraj_ORTO&bbox=${coordPuwg92[0] - 127},${coordPuwg92[1] - 63},${coordPuwg92[0] + 127},${coordPuwg92[1] + 63}'>PL - GeoPortal</a></li>
<li><a target='yandex' href='https://yandex.ru/maps/?ll=${newPortalData.lng},${newPortalData.lat}&z=18&mode=whatshere&whatshere%5Bpoint%5D=${newPortalData.lng},${newPortalData.lat}&whatshere%5Bzoom%5D=18'>RU - Yandex</a></li>
<li><a target='2GIS' href='https://2gis.ru/geo/${newPortalData.lng},${newPortalData.lat}?queryState=center/${newPortalData.lng},${newPortalData.lat}/zoom/13'>RU - 2GIS</a></li>
<li><a target='lantmateriet' href='https://kso.etjanster.lantmateriet.se/?e=${Math.round(coordUtm33[0])}&n=${Math.round(coordUtm33[1])}&z=13'>SE - Läntmateriet</a></li>
<li><a target='hitta' href='https://www.hitta.se/kartan!~${newPortalData.lat},${newPortalData.lng},18z/tileLayer!l=1'>SE - Hitta.se</a></li>
<li><a target='eniro' href='https://kartor.eniro.se/?c=${newPortalData.lat},${newPortalData.lng}&z=17&l=nautical'>SE - Eniro Sjökort</a></li>
`

    targetElement.insertAdjacentHTML(where, `<div><div class='btn-group'>${mapButtons}<div class='button btn btn-default dropdown'><span class='caret'></span><ul class='dropdown-content dropdown-menu'>${mapDropdown}</div>`)
  }

  // add new button "Submit and reload", skipping "Your analysis has been recorded." dialog
  function quickSubmitButton (submitDiv, ansController, bodyObserver) {
    let submitButton = submitDiv.querySelector('button')
    submitButton.classList.add('btn', 'btn-warning')

    if (!preferences.get(OPRT.OPTIONS.SKIP_ANALYZED_DIALOG)) { // quick hack, meh
      return { submitButton, submitAndNext: submitButton } // eslint-disable-line
    }

    let submitAndNext = submitButton.cloneNode(false)
    submitButton.addEventListener('click', () => {
      bodyObserver.disconnect()
    })
    submitAndNext.innerHTML = `<span class="glyphicon glyphicon-floppy-disk"></span>&nbsp;<span class="glyphicon glyphicon-forward"></span>`
    submitAndNext.title = 'Submit and go to next review'
    submitAndNext.addEventListener('click', () => {
      ansController.openSubmissionCompleteModal = () => {
        window.location.assign('/recon')
      }
    })

    w.$injector.invoke(['$compile', ($compile) => {
      let compiledSubmit = $compile(submitAndNext)(w.$scope(submitDiv))
      submitDiv.querySelector('button').insertAdjacentElement('beforeBegin', compiledSubmit[0])
    }])
    return { submitButton, submitAndNext }
  }

  function commentTemplates () {
    // add text buttons
    const textButtons = `
<button id='photo' class='button btn btn-default textButton' data-tooltip='Indicates a low quality photo'>Photo</button>
<button id='private' class='button btn btn-default textButton' data-tooltip='Located on private residential property'>Private</button>`
    const textDropdown = `
<li><a class='textButton' id='school' data-tooltip='Located on school property'>School</a></li>
<li><a class='textButton' id='person' data-tooltip='Photo contains 1 or more people'>Person</a></li>
<li><a class='textButton' id='perm' data-tooltip='Seasonal or temporary display or item'>Temporary</a></li>
<li><a class='textButton' id='location' data-tooltip='Location wrong'>Location</a></li>
<li><a class='textButton' id='natural' data-tooltip='Candidate is a natural feature'>Natural</a></li>
<li><a class='textButton' id='emergencyway' data-tooltip='Obstructing emergency way'>Emergency Way</a></li>
`

    const textBox = w.document.querySelector('#submitDiv + .text-center > textarea')

    w.document.querySelector('#submitDiv + .text-center').insertAdjacentHTML('beforeend', `
<div class='btn-group dropup'>${textButtons}
<div class='button btn btn-default dropdown'><span class='caret'></span><ul class='dropdown-content dropdown-menu'>${textDropdown}</ul>
</div></div><div class="hidden-xs"><button id='clear' class='button btn btn-default textButton' data-tooltip='clears the comment box'>Clear</button></div>
`)

    const buttons = w.document.getElementsByClassName('textButton')
    for (let b in buttons) {
      if (buttons.hasOwnProperty(b)) {
        buttons[b].addEventListener('click', event => {
          const source = event.target || event.srcElement
          let text = textBox.value
          if (text.length > 0) {
            text += ',\n'
          }
          switch (source.id) {
            case 'photo':
              text += 'Low quality photo'
              break
            case 'private':
              text += 'Private residential property'
              break
            case 'duplicate':
              text += 'Duplicate of previously reviewed portal candidate'
              break
            case 'school':
              text += 'Located on primary or secondary school grounds'
              break
            case 'person':
              text += 'Picture contains one or more people'
              break
            case 'perm':
              text += 'Portal candidate is seasonal or temporary'
              break
            case 'location':
              text += 'Portal candidate\'s location is not on object'
              break
            case 'emergencyway':
              text += 'Portal candidate is obstructing the path of emergency vehicles'
              break
            case 'natural':
              text += 'Portal candidate is a natural feature'
              break
            case 'clear':
              text = ''
              break
          }

          textBox.value = text
          textBox.dispatchEvent(new Event('change')) // eslint-disable-line no-undef

          event.target.blur()
        }, false)
      }
    }
  }

  // adding a 40m circle and a smaller 20m circle around the portal (capture range)
  function mapOriginCircle (map) {
    // noinspection JSUnusedLocalSymbols
    const circle40 = new google.maps.Circle({ // eslint-disable-line no-unused-vars
      map: map,
      center: map.center,
      radius: 40,
      strokeColor: '#ebbc4a',
      strokeOpacity: 0.8,
      strokeWeight: 1.5,
      fillOpacity: 0
    })

    const circle20 = new google.maps.Circle({ // eslint-disable-line no-unused-vars
      map: map,
      center: map.center,
      radius: 20,
      strokeColor: '#eddc4a',
      strokeOpacity: 0.8,
      strokeWeight: 1.5,
      fillOpacity: 0
    })
  }

  // replace map markers with a nice circle
  function mapMarker (markers) {
    for (let i = 0; i < markers.length; ++i) {
      const marker = markers[i]
      marker.setIcon(PORTAL_MARKER)
    }
  }

  // set available map types
  function mapTypes (map, isMainMap) {
    const PROVIDERS = {
      GOOGLE: 'google',
      KARTVERKET: 'kartverket'
    }

    const types = [
      { provider: PROVIDERS.GOOGLE, id: 'roadmap' },
      { provider: PROVIDERS.GOOGLE, id: 'terrain' },
      { provider: PROVIDERS.GOOGLE, id: 'satellite' },
      { provider: PROVIDERS.GOOGLE, id: 'hybrid' }]

    if (preferences.get(OPRT.OPTIONS.NORWAY_MAP_LAYER)) {
      types.push({ provider: PROVIDERS.KARTVERKET, id: `${PROVIDERS.KARTVERKET}_topo`, code: 'topo4', label: 'NO - Topo' },
        { provider: PROVIDERS.KARTVERKET, id: `${PROVIDERS.KARTVERKET}_raster`, code: 'toporaster3', label: 'NO - Raster' },
        { provider: PROVIDERS.KARTVERKET, id: `${PROVIDERS.KARTVERKET}_sjo`, code: 'sjokartraster', label: 'NO - Sjøkart' }
      )
    }

    const defaultMapType = 'hybrid'

    const mapOptions = {
      // re-enabling map scroll zoom and allow zoom with out holding ctrl
      scrollwheel: true,
      gestureHandling: 'greedy',
      // map type selection
      mapTypeControl: true,
      mapTypeControlOptions: {
        mapTypeIds: types.map(t => t.id),
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
      }
    }
    map.setOptions(mapOptions)

    // register custom map types
    types.forEach(t => {
      switch (t.provider) {
        case PROVIDERS.KARTVERKET:
          map.mapTypes.set(t.id, new google.maps.ImageMapType({
            layer: t.code,
            name: t.label,
            alt: t.label,
            maxZoom: 19,
            tileSize: new google.maps.Size(256, 256),
            getTileUrl: function (coord, zoom) {
              return `//opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=${this.layer}&zoom=${zoom}&x=${coord.x}&y=${coord.y}`
            }
          }))
          break
      }
    })

    // track current selection for position map
    let mapType
    if (isMainMap) {
      mapType = OPRT.PREFIX + OPRT.VAR.MAP_TYPE_1
    } else {
      mapType = OPRT.PREFIX + OPRT.VAR.MAP_TYPE_2
    }

    // save selection when changed
    map.addListener('maptypeid_changed', function () {
      w.localStorage.setItem(mapType, map.getMapTypeId())
    })

    // get map type saved from last use or fall back to default
    map.setMapTypeId(w.localStorage.getItem(mapType) || defaultMapType)
  }

  // move submit button to right side of classification-div. don't move on mobile devices / small width
  function moveSubmitButton () {
    const submitDiv = w.document.querySelectorAll('#submitDiv, #submitDiv + .text-center')

    if (screen.availWidth > 768) {
      let newSubmitDiv = w.document.createElement('div')
      const classificationRow = w.document.querySelector('.classification-row')
      newSubmitDiv.className = 'col-xs-12 col-sm-6'
      submitDiv[0].style.setProperty('margin-top', '16px')
      newSubmitDiv.appendChild(submitDiv[0])
      newSubmitDiv.appendChild(submitDiv[1])
      classificationRow.insertAdjacentElement('afterend', newSubmitDiv)

      // edit-page - remove .col-sm-offset-3 from .classification-row (why did you add this, niantic?
      classificationRow.classList.remove('col-sm-offset-3')
      return newSubmitDiv
    } else {
      return submitDiv[0]
    }
  }

  // expand automatically the "What is it?" filter text box
  function expandWhatIsItBox () {
    try {
      const f = w.document.querySelector('#WhatIsItController > div > p > span.ingress-mid-blue.text-center')
      setTimeout(() => {
        f.click()
      }, 250)
    } catch (err) {}
  }

  function modifyHeader () {
    // shorten Operation Portal Recon to OPR to make more room
    w.document.querySelector('.navbar-brand').innerHTML = 'OPR'

    // stats enhancements: add processed by nia, percent processed, progress to next recon badge numbers

    let oprtScannerOffset = 0
    if (preferences.get(OPRT.OPTIONS.SCANNER_OFFSET_FEATURE)) {
      // get scanner offset from localStorage
      oprtScannerOffset = parseInt(w.localStorage.getItem(OPRT.SCANNER_OFFSET)) || 0
    }
    const lastPlayerStatLine = w.document.querySelector('#player_stats:not(.visible-xs) div')
    const stats = w.document.querySelector('#player_stats:not(.visible-xs) div')

    // add opr-tools preferences button
    let oprtPreferencesButton = w.document.createElement('a')
    oprtPreferencesButton.classList.add('brand', 'upgrades-icon', 'pull-right')
    oprtPreferencesButton.style.setProperty('cursor', 'pointer')
    oprtPreferencesButton.style.setProperty('margin-right', '20px')
    oprtPreferencesButton.style.setProperty('color', 'rgb(157, 157, 157)')
    oprtPreferencesButton.addEventListener('click', () => preferences.showPreferencesUI(w))
    oprtPreferencesButton.title = 'OPR-Tools Preferences'

    const prefCog = w.document.createElement('span')
    prefCog.classList.add('glyphicon', 'glyphicon-cog')
    oprtPreferencesButton.appendChild(prefCog)

    stats.parentElement.insertAdjacentElement('beforebegin', oprtPreferencesButton)

    // move upgrade button to the right
    const upgradeIcon = w.document.querySelector('.upgrades-icon')
    if (upgradeIcon !== undefined) {
      upgradeIcon.parentElement.removeChild(upgradeIcon)

      upgradeIcon.style.setProperty('margin-right', '20px')
      upgradeIcon.style.setProperty('color', '#9d9d9d')
      upgradeIcon.classList.add('pull-right')

      stats.parentElement.insertAdjacentElement('beforebegin', upgradeIcon)
    }

    let perfBadge = null
    const imgSrc = stats.children[1].src

    if (imgSrc.indexOf('great.png') !== -1) {
      perfBadge = PERF_GREAT
    } else if (imgSrc.indexOf('good.png') !== -1) {
      perfBadge = PERF_GOOD
    } else if (imgSrc.indexOf('poor.png') !== -1) {
      perfBadge = PERF_POOR
    }

    if (perfBadge != null) {
      stats.removeChild(stats.children[1])
      stats.children[1].insertAdjacentHTML('beforeBegin', '<img style="float: right !important; margin-top: -2px;" src="' + perfBadge + '">')
      stats.children[2].setAttribute('style', 'clear: both; margin-bottom: 10px;')
    }

    const reviewed = parseInt(stats.children[3].children[2].innerText)
    const accepted = parseInt(stats.children[5].children[2].innerText)
    const rejected = parseInt(stats.children[7].children[2].innerText)

    const processed = accepted + rejected - oprtScannerOffset
    const processedPercent = roundToPrecision(processed / reviewed * 100, 1)

    const acceptedPercent = roundToPrecision(accepted / (reviewed) * 100, 1)
    const rejectedPercent = roundToPrecision(rejected / (reviewed) * 100, 1)

    const reconBadge = { 100: 'Bronze', 750: 'Silver', 2500: 'Gold', 5000: 'Platin', 10000: 'Black' }
    let nextBadgeName, nextBadgeCount

    for (const key in reconBadge) {
      if (processed <= key) {
        nextBadgeCount = key
        nextBadgeName = reconBadge[key]
        break
      }
    }
    const nextBadgeProcess = processed / nextBadgeCount * 100

    const numberSpans = stats.querySelectorAll('p span.gold')

    numberSpans[0].insertAdjacentHTML('beforeend', `, <span class='ingress-gray'>100%</span>`)
    numberSpans[1].insertAdjacentHTML('beforeend', `, <span class='opr-yellow'>${acceptedPercent}%</span>`)
    numberSpans[2].insertAdjacentHTML('beforeend', `, <span class='opr-yellow'>${rejectedPercent}%</span>`)

    stats.querySelectorAll('p')[1].insertAdjacentHTML('afterend', `<br>
<p><span class="glyphicon glyphicon-info-sign ingress-gray pull-left"></span><span style="margin-left: 5px;" class="ingress-mid-blue pull-left">Processed <u>and</u> accepted analyses:</span> <span class="gold pull-right">${processed}, <span class="ingress-gray">${processedPercent}%</span></span></p>`)

    if (processed < 10000) {
      lastPlayerStatLine.insertAdjacentHTML('beforeEnd', `
<br><div>Next recon badge tier: <b>${nextBadgeName} (${nextBadgeCount})</b><span class='pull-right'></span>
<div class='progress'>
<div class='progress-bar progress-bar-warning'
role='progressbar'
aria-valuenow='${nextBadgeProcess}'
aria-valuemin='0'
aria-valuemax='100'
style='width: ${Math.round(nextBadgeProcess)}%;'
title='${nextBadgeCount - processed} to go'>
${Math.round(nextBadgeProcess)}%
</div></div></div>
`)
    } else lastPlayerStatLine.insertAdjacentHTML('beforeEnd', `<hr>`)
    lastPlayerStatLine.insertAdjacentHTML('beforeEnd', `<p><i class="glyphicon glyphicon-share"></i> <input readonly onFocus="this.select();" style="width: 90%;" type="text"
value="Reviewed: ${reviewed} / Processed: ${accepted + rejected} (Created: ${accepted}/ Rejected: ${rejected}) / ${Math.round(processedPercent)}%"/></p>`)

    // ** opr-scanner offset
    if (accepted < 10000 && preferences.get(OPRT.OPTIONS.SCANNER_OFFSET_UI)) {
      lastPlayerStatLine.insertAdjacentHTML('beforeEnd', `
<p id='scannerOffsetContainer'>
<span style="margin-left: 5px" class="ingress-mid-blue pull-left">Scanner offset:</span>
<input id="scannerOffset" onFocus="this.select();" type="text" name="scannerOffset" size="8" class="pull-right" value="${oprtScannerOffset}">
</p>`)

      // we have to inject the tooltip to angular
      w.$injector.invoke(['$compile', ($compile) => {
        let compiledSubmit = $compile(`<span class="glyphicon glyphicon-info-sign ingress-gray pull-left" uib-tooltip-trigger="outsideclick" uib-tooltip-placement="left" tooltip-class="goldBorder" uib-tooltip="Use negative values, if scanner is ahead of OPR"></span>`)(w.$scope(stats))
        w.document.getElementById('scannerOffsetContainer').insertAdjacentElement('afterbegin', compiledSubmit[0])
      }]);

      ['change', 'keyup', 'cut', 'paste', 'input'].forEach(e => {
        w.document.getElementById('scannerOffset').addEventListener(e, (event) => {
          w.localStorage.setItem(OPRT.SCANNER_OFFSET, event.target.value)
        })
      })
      // **
    }

    modifyHeader = () => {} // eslint-disable-line
  }

  function addRefreshContainer () {
    let cbxRefresh = w.document.createElement('input')
    let cbxRefreshDesktop = w.document.createElement('input')

    cbxRefresh.id = OPRT.OPTIONS.REFRESH
    cbxRefresh.type = 'checkbox'
    cbxRefresh.checked = preferences.get(OPRT.OPTIONS.REFRESH) === 'true'

    cbxRefreshDesktop.id = OPRT.OPTIONS.REFRESH_NOTI_DESKTOP
    cbxRefreshDesktop.type = 'checkbox'
    cbxRefreshDesktop.checked = preferences.get(OPRT.OPTIONS.REFRESH_NOTI_DESKTOP) === 'true'

    let refreshPanel = w.document.createElement('div')
    refreshPanel.className = 'panel panel-ingress'

    refreshPanel.addEventListener('change', (event) => {
      preferences.set(event.target.id, event.target.checked)
      if (event.target.checked) {
        startRefresh()
      } else {
        stopRefresh()
      }
    })

    refreshPanel.innerHTML = `
<div class='panel-heading'><span class='glyphicon glyphicon-refresh'></span> Refresh <sup>beta</sup> <a href='https://gitlab.com/1110101/opr-tools'><span class='label label-success pull-right'>OPR-Tools</span></a></div>
<div id='cbxDiv' class='panel-body bg-primary' style='background:black;'></div>`

    refreshPanel.querySelector('#cbxDiv').insertAdjacentElement('afterbegin', appendCheckbox(cbxRefreshDesktop, 'Desktop notification'))
    refreshPanel.querySelector('#cbxDiv').insertAdjacentElement('afterbegin', appendCheckbox(cbxRefresh, 'Refresh every 5-10 minutes'))

    let colDiv = w.document.createElement('div')
    colDiv.className = 'col-md-4 col-md-offset-4'
    colDiv.appendChild(refreshPanel)

    let rowDiv = w.document.createElement('div')
    rowDiv.className = 'row'
    rowDiv.appendChild(colDiv)

    w.document.getElementById('NewSubmissionController').insertAdjacentElement('beforeend', rowDiv)

    cbxRefresh.checked === true ? startRefresh() : stopRefresh()

    function appendCheckbox (checkbox, text) {
      let label = w.document.createElement('label')
      let div = w.document.createElement('div')
      div.className = 'checkbox'
      label.appendChild(checkbox)
      label.appendChild(w.document.createTextNode(text))
      div.appendChild(label)
      return div
    }

    addRefreshContainer = () => {} // eslint-disable-line
  }

  let refreshIntervalID

  function startRefresh () {
    let time = getRandomIntInclusive(5, 10) * 60000

    refreshIntervalID = setInterval(() => {
      reloadOPR()
    }, time)

    function reloadOPR () {
      clearInterval(refreshIntervalID)
      w.sessionStorage.setItem(OPRT.FROM_REFRESH, 'true')
      w.document.location.reload()
    }

    // source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    function getRandomIntInclusive (min, max) {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    }
  }

  function stopRefresh () {
    clearInterval(refreshIntervalID)
  }

  function checkIfAutorefresh () {
    if (w.sessionStorage.getItem(OPRT.FROM_REFRESH)) {
      // reset flag
      w.sessionStorage.removeItem(OPRT.FROM_REFRESH)

      if (w.document.hidden) { // if tab in background: flash favicon
        let flag = true

        if (preferences.get(OPRT.OPTIONS.REFRESH_NOTI_DESKTOP) === 'true') {
          GM_notification({
            'title': 'OPR - New Portal Analysis Available',
            'text': 'by OPR-Tools',
            'image': 'https://gitlab.com/uploads/-/system/project/avatar/3311015/opr-tools.png'
          })
        }

        let flashId = setInterval(() => {
          flag = !flag
          changeFavicon(`${flag ? PORTAL_MARKER : '/imgpub/favicon.ico'}`)
        }, 1000)

        // stop flashing if tab in foreground
        addEventListener('visibilitychange', () => {
          if (!w.document.hidden) {
            changeFavicon('/imgpub/favicon.ico')
            clearInterval(flashId)
          }
        })
      }
    }
  }

  function changeFavicon (src) {
    let link = w.document.querySelector('link[rel="shortcut icon"]')
    link.href = src
  }

  function startExpirationTimer (subController) {
    w.document.querySelector('ul.nav.navbar-nav > li:nth-child(7)').insertAdjacentHTML('afterbegin', '<a><span id="countdownDisplay"></span></a>')

    let countdownEnd = subController.countdownDate
    let countdownDisplay = document.getElementById('countdownDisplay')
    countdownDisplay.style.setProperty('color', 'white')

    // Update the count down every 1 second
    let counterInterval = setInterval(function () {
      // Get todays date and time
      let now = new Date().getTime()
      // Find the distance between now an the count down date
      let distance = countdownEnd - now
      // Time calculations for minutes and seconds
      let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      let seconds = Math.floor((distance % (1000 * 60)) / 1000)

      // Display the result in the element
      countdownDisplay.innerText = `${minutes}m ${seconds}s `

      if (distance < 0) {
        // If the count down is finished, write some text
        clearInterval(counterInterval)
        countdownDisplay.innerText = 'EXPIRED'
        countdownDisplay.style.setProperty('color', 'red')
      } else if (distance < 90000) {
        countdownDisplay.style.setProperty('color', 'red')
      }
    }, 1000)
  }

  function versionCheck () {
    if (OPRT.VERSION > (parseInt(w.localStorage.getItem(OPRT.PREFIX + OPRT.VERSION_CHECK)) || OPRT.VERSION - 1)) {
      w.localStorage.setItem(OPRT.PREFIX + OPRT.VERSION_CHECK, OPRT.VERSION)

      const changelogString = `
        <h4><span class="glyphicon glyphicon-asterisk"></span> OPR Tools was updated:</h4>
        <div>${strings.changelog}</div>      
      `
      // show changelog
      alertify.closeLogOnClick(false).logPosition('bottom right').delay(0).log(changelogString, (ev) => {
        ev.preventDefault()
        ev.target.closest('div.default.show').remove()
      }).reset()
    }
  }

  function addCustomPresetButtons () {
    // add customPreset UI
    oprtCustomPresets = getCustomPresets(w)
    let customPresetOptions = ''
    for (const customPreset of oprtCustomPresets) {
      customPresetOptions += `<button class='button btn btn-default customPresetButton' id='${customPreset.uid}'>${customPreset.label}</button>`
    }
    w.document.getElementById('customPresets').innerHTML = customPresetOptions
  }

  function getCustomPresets (w) {
    // simply to scope the string we don't need after JSON.parse
    let presetsJSON = w.localStorage.getItem(OPRT.PREFIX + OPRT.VAR.CUSTOM_PRESETS)
    if (presetsJSON != null && presetsJSON !== '') {
      return JSON.parse(presetsJSON)
    }
    return []
  }

  function saveCustomPreset (label, ansController, whatController) {
    // uid snippet from https://stackoverflow.com/a/47496558/6447397
    let preset = {
      uid: [...Array(5)].map(() => Math.random().toString(36)[3]).join(''),
      label: label,
      nodeName: whatController.whatNode.name,
      nodeId: whatController.whatNode.id,
      quality: ansController.formData.quality,
      description: ansController.formData.description,
      cultural: ansController.formData.cultural,
      uniqueness: ansController.formData.uniqueness,
      location: ansController.formData.location,
      safety: ansController.formData.safety
    }
    oprtCustomPresets.push(preset)
    w.localStorage.setItem(OPRT.PREFIX + OPRT.VAR.CUSTOM_PRESETS, JSON.stringify(oprtCustomPresets))
  }

  function deleteCustomPreset (preset) {
    oprtCustomPresets = oprtCustomPresets.filter(item => item.uid !== preset.uid)
    w.localStorage.setItem(OPRT.PREFIX + OPRT.VAR.CUSTOM_PRESETS, JSON.stringify(oprtCustomPresets))
  }

  function showHelp () {
    let helpString = `<a href='https://gitlab.com/1110101/opr-tools'><span class='label label-success'>OPR-Tools</span></a> Key shortcuts<br>
    <table class="table table-condensed ">
    <thead>
    <tr>
      <th>Keys</th>
      <th>Function</th>
    </tr>
    </thead>
    <tbody>
    <tr>
      <td><kbd>Keys 1-5</kbd> / <kbd>Numpad 1-5</kbd></td>
      <td>Valuate current selected field (the yellow highlighted one)</td>
    </tr>
    <tr>
      <td><kbd>Shift</kbd> + <kbd>Keys 1-5</kbd></td>
      <td>Apply custom preset (if exists)</td>
    </tr>
    <tr>
      <td><kbd>Keys 1-7</kbd> / <kbd>Numpad 1-7</kbd></td>
      <td>Rejection popup: Select list element</td>
    </tr>
    <tr>
      <td><kbd>D</kbd></td>
      <td>Mark current candidate as a duplicate of the opened portal in "duplicates"</td>
    </tr>
    <tr>
      <td><kbd>T</kbd></td>
      <td>Open title translation</td>
    </tr>
    <tr>
      <td><kbd>Y</kbd></td>
      <td>Open description translation</td>
    </tr>
    <tr>
      <td><kbd>Space</kbd> / <kbd>Enter</kbd> / <kbd>Numpad Enter</kbd></td>
      <td>Confirm dialog / Send valuation</td>
    </tr>
    <tr>
      <td><kbd>Tab</kbd> / <kbd>Numpad +</kbd></td>
      <td>Next field</td>
    </tr>
    <tr>
      <td><kbd>Shift</kbd> / <kbd>Backspace</kbd> / <kbd>Numpad -</kbd></td>
      <td>Previous field</td>
    </tr>
    <tr>
      <td><kbd>Esc</kbd> / <kbd>Numpad /</kbd></td>
      <td>First field</td>
    </tr>
    <tr>
      <td><kbd>^</kbd> / <kbd>Numpad *</kbd></td>
      <td>Skip Portal (if possible)</td>
    </tr>
    </tbody>
    </table>`

    alertify.closeLogOnClick(false).logPosition('bottom right').delay(0).log(helpString, (ev) => {
      ev.preventDefault()
      ev.target.closest('div.default.show').remove()
    }).reset()
  }

  function roundToPrecision (num, precision) {
    let shifter
    precision = Number(precision || 0)
    if (precision % 1 !== 0) throw new RangeError('precision must be an integer')
    shifter = Math.pow(10, precision)
    return Math.round(num * shifter) / shifter
  }
}

setTimeout(() => {
  init()
}, 250)

// region const

const strings = {
  options: {
    [OPRT.OPTIONS.COMMENT_TEMPLATES]: 'Comment templates',
    [OPRT.OPTIONS.KEYBOARD_NAV]: 'Keyboard Navigation',
    [OPRT.OPTIONS.NORWAY_MAP_LAYER]: 'Norwegian Map Layer',
    [OPRT.OPTIONS.PRESET_FEATURE]: 'Presets',
    [OPRT.OPTIONS.REFRESH]: 'Periodically refresh opr if no analysis is available',
    [OPRT.OPTIONS.REFRESH_NOTI_DESKTOP]: '↳ With desktop notification',
    [OPRT.OPTIONS.SKIP_ANALYZED_DIALOG]: 'Skip \'Analysis recorded\' dialog',
    [OPRT.OPTIONS.SCANNER_OFFSET_FEATURE]: 'Scanner offset',
    [OPRT.OPTIONS.SCANNER_OFFSET_UI]: '↳ Display offset input field'
  },
  changelog:
    `Version 1.0.0!
<br>* New preferences menu
<br>- Enable or disable some not so often needed features.
<br>
<br>* Refresh notification: removed sound option
<br>* Added new 20m circle around candidate location, thanks @aenariel
<br>* Remembering selected layer type of duplicate map
    `
}

const GLOBAL_CSS = `
.dropdown {
position: relative;
display: inline-block;
}

.dropdown-content {
display: none;
position: absolute;
z-index: 1;
margin: 0;
}
.dropdown-menu li a {
color: #ddd !important;
}
.dropdown:hover .dropdown-content {
display: block;
background-color: #004746 !important;
border: 1px solid #0ff !important;
border-radius: 0px !important;

}
.dropdown-menu>li>a:focus, .dropdown-menu>li>a:hover {
background-color: #008780;
}
.modal-sm {
width: 350px !important;
}

/**
* Ingress Panel Style
*/

.panel-ingress {
background-color: #004746;
border: 1px solid #0ff;
border-radius: 1px;
box-shadow: inset 0 0 6px rgba(255, 255, 255, 1);
color: #0ff;
}

/**
* Tooltip Styles
*/

/* Add this attribute to the element that needs a tooltip */
[data-tooltip] {
position: relative;
cursor: pointer;
}

/* Hide the tooltip content by default */
[data-tooltip]:before,
[data-tooltip]:after {
visibility: hidden;
-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=0)";
filter: progid: DXImageTransform.Microsoft.Alpha(Opacity=0);
opacity: 0;
pointer-events: none;
}

/* Position tooltip above the element */
[data-tooltip]:before {
position: absolute;
top: 150%;
left: 50%;
margin-bottom: 5px;
margin-left: -80px;
padding: 7px;
width: relative;
-webkit-border-radius: 3px;
-moz-border-radius: 3px;
border-radius: 3px;
background-color: #000;
background-color: hsla(0, 0%, 20%, 0.9);
color: #fff;
content: attr(data-tooltip);
text-align: center;
font-size: 14px;
line-height: 1.2;
z-index: 100;
}

/* Triangle hack to make tooltip look like a speech bubble */
[data-tooltip]:after {
position: absolute;
top: 132%;
left: relative;
width: 0;
border-bottom: 5px solid #000;
border-bottom: 5px solid hsla(0, 0%, 20%, 0.9);
border-right: 5px solid transparent;
border-left: 5px solid transparent;
content: " ";
font-size: 0;
line-height: 0;
}

/* Show tooltip content on hover */
[data-tooltip]:hover:before,
[data-tooltip]:hover:after {
visibility: visible;
-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=100)";
filter: progid: DXImageTransform.Microsoft.Alpha(Opacity=100);
opacity: 1;
}

.titleEditBox:hover {
  box-shadow: inset 0 0 20px #ebbc4a;
}

.titleEditBox:active {
  box-shadow: inset 0 0 15px 2px white;
}

.group-list li label:hover, ul.sub-group-list a:hover, #root-label:hover {
    box-shadow: inset 0 0 5px #ffffff !important;
}

.group-list li label:active, ul.sub-group-list a:active, #root-label:active {
    box-shadow: inset 0 0 10px 2px #ffffff !important;
}

.modal-body .button:focus, .modal-body textarea:focus {
  outline: 2px dashed #ebbc4a;
}

.modal-body .button:hover, .gm-style-iw button.button:hover {
  filter: brightness(150%);
}

.alertify .dialog .msg {
color: black;
}
.alertify-logs > .default {
    background-image: url(/img/ingress-background-dark.png) !important;
}

.btn-xs {
  padding: 0px 7px 1px !important;
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 1);
  -webkit-box-shadow: inset 0 0 4px rgba(255, 255, 255, 1);
  -moz-box-shadow: inset 0 0 4px rgba(255, 255, 255, 1);
}

kbd {
    display: inline-block;
    padding: 3px 5px;
    font: 11px SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace;
    line-height: 10px;
    color: #444d56;
    vertical-align: middle;
    background-color: #fafbfc;
    border: 1px solid #d1d5da;
    border-bottom-color: #c6cbd1;
    border-radius: 3px;
    box-shadow: inset 0 -1px 0 #c6cbd1;
}

.opr-yellow {
    color: #F3EADA;
}
.upgrades-icon:hover {
  color: rgb(200, 200, 200) !important;
}

@media(min-width:768px) {
  div.modal-custom1 {
    width: 500px
  }
}

`

const PORTAL_MARKER = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACx
jwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAu
OWwzfk4AAADlSURBVDhPY/j//z8CTw3U/V8lcvx/MfPX/2Xcd//XyWwDYxAbJAaS63c2Q9aD0Nyg
UPS/hPXt/3bD5f93LI7DwFvnJILlSlg//K+XrUc1AKS5jOvx/wU55Vg1I2OQmlKOpzBDIM4G2UyM
ZhgGqQW5BOgdBrC/cDkbHwbpAeplAAcONgWEMChMgHoZwCGMTQExGKiXARxN2CSJwUC9VDCAYi9Q
HIhVQicpi0ZQ2gYlCrITEigpg5IlqUm5VrILkRdghoBMxeUd5MwE1YxqAAiDvAMKE1DAgmIHFMUg
DGKDxDCy838GAPWFoAEBs2EvAAAAAElFTkSuQmCC`

const PERF_GREAT = `data:image/png;base64,
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
WH1hTgAAAABJRU5ErkJggg==`

const PERF_GOOD = `data:image/png;base64,
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
YII=`

const PERF_POOR = `data:image/png;base64,
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
AAAAAElFTkSuQmCC`

// TG SVG Icon from https://commons.wikimedia.org/wiki/File:Telegram_logo.svg
const TG_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" style="
    width: 16px;
    height: 16px;
">
<defs>
	<linearGradient id="b" x1="0.6667" y1="0.1667" x2="0.4167" y2="0.75">
		<stop stop-color="#37aee2" offset="0"></stop>
		<stop stop-color="#1e96c8" offset="1"></stop>
	</linearGradient>
	<linearGradient id="w" x1="0.6597" y1="0.4369" x2="0.8512" y2="0.8024">
		<stop stop-color="#eff7fc" offset="0"></stop>
		<stop stop-color="#fff" offset="1"></stop>
	</linearGradient>
</defs>
<circle cx="120" cy="120" r="120" fill="url(#b)"></circle>
<path fill="#c8daea" d="m98 175c-3.8876 0-3.227-1.4679-4.5678-5.1695L82
132.2059 170 80"></path>
<path fill="#a9c9dd" d="m98 175c3 0 4.3255-1.372
6-3l16-15.558-19.958-12.035"></path>
<path fill="url(#w)" d="m100.04 144.41 48.36 35.729c5.5185 3.0449 9.5014
1.4684
10.876-5.1235l19.685-92.763c2.0154-8.0802-3.0801-11.745-8.3594-9.3482l-115.59
 44.571c-7.8901 3.1647-7.8441 7.5666-1.4382 9.528l29.663
  9.2583 68.673-43.325c3.2419-1.9659 6.2173-0.90899 3.7752 1.2584"></path>
</svg>`
// endregion
