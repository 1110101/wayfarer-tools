// ==UserScript==
// @name            Wayfarer-Tools
// @version         2.0.7-beta
// @description     formerly known as OPR-Tools
// @homepageURL     https://gitlab.com/1110101/opr-tools
// @author          1110101, https://gitlab.com/1110101/opr-tools/graphs/master
// @match           https://wayfarer.nianticlabs.com/review
// @match           https://wayfarer.nianticlabs.com/profile
// @grant           unsafeWindow
// @grant           GM_notification
// @grant           GM_addStyle
// @downloadURL     https://gitlab.com/1110101/opr-tools/raw/feature/wayfarerSupport/opr-tools.user.js
// @updateURL       https://gitlab.com/1110101/opr-tools/raw/feature/wayfarerSupport/opr-tools.user.js
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

const WFRT = {

  VERSION: 20007,

  PREFERENCES: 'wfrt_prefs',

  OPTIONS: {
    KEYBOARD_NAV: 'keyboard_nav',
    NORWAY_MAP_LAYER: 'norway_map_layer',
    PRESET_FEATURE: 'preset_feature',
    SCANNER_OFFSET_FEATURE: 'scanner_offset_feature',
    SCANNER_OFFSET_UI: 'scanner_offset_ui',
    COMMENT_TEMPLATES: 'comment_templates',
    MAP_CIRCLE_20: 'map_circle_20',
    MAP_CIRCLE_40: 'map_circle_40',

    REFRESH: 'refresh',
    REFRESH_NOTI_DESKTOP: 'refresh_noti_desktop'
  },

  PREFIX: 'wfrt_',
  VAR_PREFIX: 'wfrt_var', // used in import/export **only**

  // used for legacy oprt import
  OPRT: 'oprt_',
  OPRT_VAR_PREFIX: 'oprt_var',
  OPRT_PREFERENCES: 'oprt_prefs',

  VAR: { // will be included in import/export
    SCANNER_OFFSET: 'scanner_offset',
    MAP_TYPE_1: 'map_type_1',
    MAP_TYPE_2: 'map_type_2',
    CUSTOM_PRESETS: 'custom_presets'
  },

  VERSION_CHECK: 'version_check', // outside var, because it should not get exported

  FROM_REFRESH: 'from_refresh' // sessionStorage
}

function addGlobalStyle (css) {
  GM_addStyle(css)
  // noop after first run
  addGlobalStyle = () => {} // eslint-disable-line no-func-assign
}

class Preferences {
  constructor () {
    this.options = {}
    this.defaults = {
      [WFRT.OPTIONS.KEYBOARD_NAV]: true,
      [WFRT.OPTIONS.NORWAY_MAP_LAYER]: false,
      [WFRT.OPTIONS.PRESET_FEATURE]: true,
      [WFRT.OPTIONS.SCANNER_OFFSET_FEATURE]: false,
      [WFRT.OPTIONS.SCANNER_OFFSET_UI]: false,
      [WFRT.OPTIONS.COMMENT_TEMPLATES]: true,
      [WFRT.OPTIONS.REFRESH]: true,
      [WFRT.OPTIONS.REFRESH_NOTI_DESKTOP]: true,
      [WFRT.OPTIONS.MAP_CIRCLE_20]: false,
      [WFRT.OPTIONS.MAP_CIRCLE_40]: true
    }
    this.loadOptions()
  }

  showPreferencesUI (w) {
    let inout = new InOut(this)
    let pageContainer = w.document.querySelector('#content-container')
    let wfrtPreferences = w.document.querySelector('#wfrt_sidepanel_container')

    if (wfrtPreferences !== null) wfrtPreferences.classList.toggle('hide')
    else {
      pageContainer.insertAdjacentHTML('afterbegin', `
<section id="wfrt_sidepanel_container" style="
    background: black;
    border-left: 2px gold inset;
    border-top: 2px gold inset;
    border-bottom: 2px gold inset;
    color: white;
    position: absolute;
    right: 0;
    height: 90%;
    padding: 0 20px;
    z-index: 10;
    width: 400px;
    ">
  <div class="row">
    <div class="col-lg-12">
      <h4 class="gold">Wayfarer-Tools Preferences</h4>
    </div>
    <div class="col-lg-12">
      <div class="btn-group" role="group">
        <button id="import_all" class="btn btn-success">Import</button>
        <button id="export_all" class="btn btn-success">Export</button>
      </div>
    </div>
  </div>
  <div id="wfrt_options"></div>
  <a id="wfrt_reload" class="btn btn-warning hide"><span class="glyphicon glyphicon-refresh"></span>
 Reload to apply changes</a>

 <div style="position: absolute; bottom: 0; left: 0; margin:20px;"><a href="https://t.me/oprtools">${TG_SVG} Wayfarer-Tools Telegram Channel</a></div>
</section>`)

      let optionsContainer = w.document.getElementById('wfrt_options')
      let reloadButton = w.document.getElementById('wfrt_reload')

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
    Object.assign(this.options, this.defaults, JSON.parse(localStorage.getItem(WFRT.PREFERENCES)))
  }

  set (key, value) {
    this.options[key] = value
    localStorage.setItem(WFRT.PREFERENCES, JSON.stringify(this.options))
  }

  get (key) {
    return this.options[key]
  }

  remove (key) {
    delete this.options[key]
    localStorage.setItem(WFRT.PREFERENCES, JSON.stringify(this.options))
  }

  exportPrefs () {
    return JSON.stringify(this.options)
  }

  importPrefs (string) {
    try {
      this.options = JSON.parse(string)
      localStorage.setItem(WFRT.PREFERENCES, JSON.stringify(this.options))
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
    for (const item in WFRT.VAR) {
      exportObject[WFRT.VAR[item]] = localStorage.getItem(WFRT.PREFIX + WFRT.VAR[item])
    }
    return exportObject
  }

  static importVars (importObject) {
    for (const item in importObject) {
      localStorage.setItem(WFRT.PREFIX + item, importObject[item])
    }
  }

  importFromString (string) {
    try {
      let json = JSON.parse(string)

      if (json.hasOwnProperty(WFRT.PREFERENCES)) { this.preferences.importPrefs(json[WFRT.PREFERENCES]) }
      if (json.hasOwnProperty(WFRT.VAR_PREFIX)) { InOut.importVars(json[WFRT.VAR_PREFIX]) }

      // legacy import for oprt stuff
      if (json.hasOwnProperty(WFRT.OPRT_PREFERENCES)) { this.preferences.importPrefs(json[WFRT.OPRT_PREFERENCES]) }
      if (json.hasOwnProperty(WFRT.OPRT_VAR_PREFIX)) { InOut.importVars(json[WFRT.OPRT_VAR_PREFIX]) }
    } catch (e) {
      throw new Error('Import failed')
    }
  }

  exportAll () {
    return JSON.stringify(Object.assign({}, { [WFRT.PREFERENCES]: this.preferences.exportPrefs() }, { [WFRT.VAR_PREFIX]: InOut.exportVars() }))
  }
}

function init () {
  const w = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  let tryNumber = 15

  let wfrtCustomPresets

  let browserLocale = window.navigator.languages[0] || window.navigator.language || 'en'

  let preferences = new Preferences()

  const initWatcher = setInterval(() => {
    if (tryNumber === 0) {
      clearInterval(initWatcher)
      w.document.getElementById('NewSubmissionController')
      .insertAdjacentHTML('afterBegin', `
<div id="wfrt_init_failed" class='alert alert-danger'><strong><span class='glyphicon glyphicon-remove'></span> Wayfarer-Tools initialization failed, refresh page</strong></div>
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

    addOptionsButton()

    const subMissionDiv = w.document.getElementById('NewSubmissionController')

    // check if subCtrl exists (should exists if we're on /review)
    if (subMissionDiv !== null && w.$scope(subMissionDiv).subCtrl !== null) {
      const subController = w.$scope(subMissionDiv).subCtrl
      const newPortalData = subController.pageData

      var cardId
      if (subController.reviewType == 'EDIT') {
        cardId = 'what-is-it-card-edit'
      } else {
        cardId = 'what-is-it-card-review'
      }

      const whatController = w.$scope(w.document.getElementById(cardId).children[0]).whatCtrl

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
    } else if (w.location.pathname.includes('profile')) {
      modifyProfile()
    }

  }

  function modifyNewPage (ansController, subController, whatController, newPortalData) {
    let skipDialog = false

    mapButtons(newPortalData, w.document.querySelector('#map-card .card__footer'), 'afterBegin')

    // mutation observer
    const bodyObserver = new MutationObserver(mutationList => {
      for (let mutationRecord of mutationList) {
        // we just want added nodes with (class:modal). null and undefined check for performance reasons
        if (mutationRecord.addedNodes.length > 0 && mutationRecord.addedNodes[0].className === 'modal fade ng-isolate-scope') {
          // adds keyboard-numbers to low quality sub-sub-lists
          let sublistItems = mutationRecord.addedNodes[0].querySelectorAll('ul.sub-group-list')
          if (sublistItems !== undefined) {
            sublistItems.forEach(el => {
              let i = 1
              el.querySelectorAll('li > a').forEach(el2 => { el2.insertAdjacentHTML('afterbegin', `<kbd>${i++}</kbd> `) })
            })
            let i = 1
            // adds keyboard numbers to low quality sub-list
            mutationRecord.addedNodes[0].querySelectorAll('label.sub-group')
            .forEach(el2 => { el2.insertAdjacentHTML('beforeend', `<kbd class="pull-right ">${i++}</kbd>`) })
          }
          // skip "Your analysis has been recorded" dialog
          if (skipDialog) {
            if (mutationRecord.addedNodes[0].querySelector('.modal-body button[ng-click="answerCtrl3.reloadPage()"]') !== null) {
              w.document.location.href = '/review'
              return
            }
          }
        }
      }
    })
    bodyObserver.observe(w.document.body, { childList: true })

    let newSubmitDiv = w.document.querySelector('.answer-btn-container.bottom-btns')
    let { submitButton, submitAndNext } = quickSubmitButton(newSubmitDiv, ansController, bodyObserver)

    if (preferences.get(WFRT.OPTIONS.COMMENT_TEMPLATES)) { commentTemplates() }

    /* region presets start */
    if (preferences.get(WFRT.OPTIONS.PRESET_FEATURE)) {
      const customPresetUI = `<div class="card" id="wfrt_custom_presets_card"><div class="card__body"><div>Presets&nbsp;<button class="btn btn-default btn-xs" id="addPreset">+</button></div>
  <div class='btn-group' id="wfrt_custom_presets"></div></div></div>
`

      w.document.querySelector('.card-row-container').insertAdjacentHTML('afterbegin', customPresetUI)

      addCustomPresetButtons()

      // we have to inject the tooltip to angular
      w.$injector.invoke(['$compile', ($compile) => {
        let compiledSubmit = $compile(`<span class="glyphicon glyphicon-info-sign darkgray" uib-tooltip-trigger="outsideclick" uib-tooltip-placement="left" tooltip-class="goldBorder" uib-tooltip="(Wayfarer-Tools) Create your own presets for stuff like churches, playgrounds or crosses'.\nHowto: Answer every question you want included and click on the +Button.\n\nTo delete a preset shift-click it."></span>&nbsp; `)(w.$scope(document.getElementById('descriptionDiv')))
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

        let preset = wfrtCustomPresets.find(item => item.uid === value)

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

      w.document.getElementById('wfrt_custom_presets').addEventListener('click', clickListener, false)
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
      if (preferences.get(WFRT.OPTIONS.MAP_CIRCLE_40)) {
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
      }

      if (preferences.get(WFRT.OPTIONS.MAP_CIRCLE_20)) {
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
    }

    if (preferences.get(WFRT.OPTIONS.MAP_CIRCLE_40) || preferences.get(WFRT.OPTIONS.MAP_CIRCLE_20)) {
      document.querySelector('.flex-map-row').insertAdjacentHTML('beforeEnd',
        `<small id="wfrt_map_legend">
                ${preferences.get(WFRT.OPTIONS.MAP_CIRCLE_40) ? '<span style="color:#ebbc4a">outer circle:</span> 40m' : ''}
                ${preferences.get(WFRT.OPTIONS.MAP_CIRCLE_20) ? '<span style="color:#effc4a">inner circle:</span> 20m' : ''}
            </small>`)
    }

    // // move portal rating to the right side. don't move on mobile devices / small width
    // if (screen.availWidth > 768) {
    //   let nodeToMove = w.document.querySelector('div[class="btn-group"]').parentElement
    //   if (subController.hasSupportingImageOrStatement) {
    //     const descDiv = w.document.getElementById('descriptionDiv')
    //     const scorePanel = descDiv.querySelector('div.text-center.hidden-xs')
    //     scorePanel.insertBefore(nodeToMove, scorePanel.firstChild)
    //   } else {
    //     const scorePanel = w.document.querySelector('div[class~="pull-right"]')
    //     scorePanel.insertBefore(nodeToMove, scorePanel.firstChild)
    //   }
    // }

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
    const titleContainer = w.document.querySelector('h1.title-description')
    const content = titleContainer.innerText.trim()
    let a = w.document.createElement('a')
    let span = w.document.createElement('span')
    span.className = 'glyphicon glyphicon-book'
    span.innerHTML = ' '
    a.appendChild(span)
    a.className = 'translate-title btn btn-default pull-right'
    a.target = 'translate'
    a.style.setProperty('padding', '0px 4px')
    a.href = `https://translate.google.com/#auto/${lang}/${encodeURIComponent(content)}`
    a.id = 'wfrt_translate_title'
    titleContainer.insertAdjacentElement('beforeend', a)

    const descContainer = w.document.querySelector('h4.title-description')
    if (descContainer.innerText !== '&lt;No description&gt;' && descContainer.innerText !== '') {
      a = w.document.createElement('a')
      span = w.document.createElement('span')
      span.className = 'glyphicon glyphicon-book'
      span.innerHTML = ' '
      a.appendChild(span)
      a.className = 'translate-description btn btn-default pull-right'
      a.target = 'translate'
      a.style.setProperty('padding', '0px 4px')
      a.href = `https://translate.google.com/#auto/${lang}/${encodeURIComponent(descContainer.innerText.trim())}`
      a.id = 'wfrt_translate_desc'
      descContainer.insertAdjacentElement('beforeend', a)
      descContainer.insertAdjacentHTML('beforebegin', '<hr>')
    }

    const supportingStatement = w.document.querySelector('.supporting-statement-central-field p')
    if (supportingStatement != null && supportingStatement.innerText !== '') {
      a = w.document.createElement('a')
      span = w.document.createElement('span')
      span.className = 'glyphicon glyphicon-book'
      span.innerHTML = ' '
      a.appendChild(span)
      a.className = 'translate-supporting btn btn-default pull-right'
      a.target = 'translate'
      a.style.setProperty('padding', '0px 4px')
      a.href = `https://translate.google.com/#auto/${lang}/${encodeURIComponent(supportingStatement.innerText)}`
      a.id = 'wfrt_translate_support'
      supportingStatement.insertAdjacentElement('beforebegin', a)
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

        w.$injector.invoke(['$compile', ($compile) => {
          let target = w.document.querySelector('.modal-body button:last-child')
          let compiledSubmit = $compile(`<button id="submitAndSkipLowQuality" class="button-primary" ng-click="answerCtrl2.confirmLowQuality()" ng-disabled="!(answerCtrl2.readyToSubmitSpam())" disabled="disabled">
                        <span class="glyphicon glyphicon-floppy-disk"></span>&nbsp;<span class="glyphicon glyphicon-forward"></span></button>`)(w.$scope(target))
          target.insertAdjacentElement('beforebegin', compiledSubmit[0])
          w.document.getElementById('submitAndSkipLowQuality').addEventListener('click', () => {
            skipDialog = true
          })
        }])
      }, 10)
    }

    /* global markDuplicatePressed */
    let _markDuplicatePressed = markDuplicatePressed
    markDuplicatePressed = (guid) => { // eslint-disable-line no-global-assign
      _markDuplicatePressed(guid)
      setTimeout(() => {
        w.$injector.invoke(['$compile', ($compile) => {
          let target = w.document.querySelector('.modal-body button:last-child')
          let compiledSubmit = $compile(`<button id="submitAndSkipDuplicate" class="button-primary" ng-click="answerCtrl2.confirmDuplicate()">
                      <span class="glyphicon glyphicon-floppy-disk"></span>&nbsp;<span class="glyphicon glyphicon-forward"></span></button>`)(w.$scope(target))
          target.insertAdjacentElement('beforebegin', compiledSubmit[0])
          w.document.getElementById('submitAndSkipDuplicate').addEventListener('click', () => {
            skipDialog = true
          })
        }])
      }, 10)
    }

    /* region keyboard nav */
    if (preferences.get(WFRT.OPTIONS.KEYBOARD_NAV)) {
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
      let starsAndSubmitButtons = w.document.querySelectorAll('.five-stars, #submitFF')

      function highlight () {
        starsAndSubmitButtons.forEach((element) => { element.style.setProperty('border', 'none') })
        if (currentSelectable <= maxItems - 2) {
          starsAndSubmitButtons[currentSelectable].style.setProperty('border', '2px dashed #E47252')
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
        } else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector('a.button[href="/review"]')) {
          // "analyze next" button
          w.document.location.href = '/review'
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
          const link = w.document.querySelector('#wfrt_translate_title')
          if (link) {
            link.click()
            event.preventDefault()
          }
        } else if (event.keyCode === 89) {
          // click on translate description link (key Y)
          const link = w.document.querySelector('#wfrt_translate_desc')
          if (link) {
            link.click()
            event.preventDefault()
          }
        } else if (event.keyCode === 85) {
          // click on translate extra info link (key U)
          const link = w.document.querySelector('#wfrt_translate_support')
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
            if (!document.getElementById('submitFF').disabled) {
              currentSelectable = 6
              highlight()
            }
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
          mutationRecord.addedNodes[0].querySelector('.modal-body a[href=\'/review\']') !== null) {
          w.document.location.href = '/review'
        }
      }
    })
    bodyObserver.observe(w.document.body, { childList: true })

    let newSubmitDiv = w.document.querySelector('.answer-btn-container.bottom-btns')
    let { submitButton, submitAndNext } = quickSubmitButton(newSubmitDiv, ansController, bodyObserver)

    if (preferences.get(WFRT.OPTIONS.COMMENT_TEMPLATES)) { commentTemplates() }

    mapTypes(subController.locationEditsMap, true)

    // add translation links to title and description edits
    if (newPortalData.titleEdits.length > 1 || newPortalData.descriptionEdits.length > 1) {
      for (const titleEditBox of editDiv.querySelectorAll('.titleEditBox.ng-scope')) {
        const contentSpan = titleEditBox.querySelector('.poi-edit-text')
        let a = w.document.createElement('a')
        let span = w.document.createElement('span')
        span.className = 'glyphicon glyphicon-book'
        span.innerHTML = ' '
        a.appendChild(span)
        a.className = 'translate-title button btn btn-default pull-right'
        a.target = 'translate'
        a.style.setProperty('padding', '0px 4px')
        a.href = `https://translate.google.com/#auto/${browserLocale.split('-')[0]}/${encodeURIComponent(contentSpan.innerText.trim())}`
        contentSpan.style.setProperty('display', 'inline-block')
        contentSpan.insertAdjacentElement('beforeEnd', a)
      }
    }

    if (newPortalData.titleEdits.length <= 1) {
      let titleDiv = editDiv.querySelector('div[ng-if="!answerCtrl.needsTitleEdit"]')
      let a = w.document.createElement('a')
      let span = w.document.createElement('span')
      span.className = 'glyphicon glyphicon-book'
      span.innerHTML = ' '
      a.appendChild(span)
      a.className = 'translate-title btn btn-default'
      a.target = 'translate'
      a.style.setProperty('padding', '0px 4px')
      a.style.setProperty('margin-left', '14px')
      a.href = `https://translate.google.com/#auto/${browserLocale.split('-')[0]}/${encodeURIComponent(titleDiv.innerText.trim())}`
      titleDiv.insertAdjacentElement('beforeend', a)
    }

    if (newPortalData.descriptionEdits.length <= 1) {
      let titleDiv = editDiv.querySelector('div[ng-if="!answerCtrl.needsDescriptionEdit"]')
      const content = titleDiv.innerText.trim() || ''
      if (content !== '<No description>' && content !== '') {
        let a = w.document.createElement('a')
        let span = w.document.createElement('span')
        span.className = 'glyphicon glyphicon-book'
        span.innerHTML = ' '
        a.appendChild(span)
        a.className = 'translate-title btn btn-default'
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

    if (preferences.get(WFRT.OPTIONS.KEYBOARD_NAV)) {
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
        '.edit-container  div[ng-show="subCtrl.pageData.titleEdits.length > 1"]:not(.ng-hide),' +
        '.edit-container div[ng-show="subCtrl.pageData.descriptionEdits.length > 1"]:not(.ng-hide),' +
        '.edit-container div[ng-show="subCtrl.pageData.locationEdits.length > 1"]:not(.ng-hide),' +
        '#submitFF')

      /* EDIT PORTAL */
      function highlight () {
        let el = editDiv.querySelector('.poi-edit-map-unable')
        el.style.setProperty('border', 'none')

        starsAndSubmitButtons.forEach((element) => { element.style.setProperty('border', 'none') })
        if (hasLocationEdit && currentSelectable === maxItems - 3) {
          el.style.setProperty('border-left', '4px dashed #ebbc4a')
          el.style.setProperty('border-top', '4px dashed #ebbc4a')
          el.style.setProperty('border-bottom', '4px dashed #ebbc4a')
          el.style.setProperty('border-right', '4px dashed #ebbc4a')
          el.style.setProperty('padding', '8px')
          // el.style.setProperty('margin-bottom', '0')
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
        } else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector('a.button[href="/review"]')) {
          // "analyze next" button
          w.document.location.href = '/review'
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
            if (hasLocationEdit) {
              numkey = 1
            }

            // starsAndSubmitButtons[currentSelectable].querySelectorAll('.poi-edit-box')[numkey - 1].click()
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
<a class='btn btn-default' target='intel' href='https://intel.ingress.com/intel?ll=${newPortalData.lat},${newPortalData.lng}&z=17'>Intel</a>
<a class='btn btn-default' target='gmaps' href='https://www.google.com/maps/place/${newPortalData.lat},${newPortalData.lng}'>GMaps</a>
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
<li><a target='kakao' href='http://map.kakao.com/?map_type=TYPE_SKYVIEW&map_hybrid=true&q=${newPortalData.lat}%2C${newPortalData.lng}'>KR - Kakao map</a></li>
<li><a target='naver' href='http://map.naver.com/?menu=location&lat=${newPortalData.lat}&lng=${newPortalData.lng}&dLevel=14&title=CandidatePortalLocation'>KR - Naver map</a></li>
<li><a target='kartverket' href='http://norgeskart.no/#!?project=seeiendom&layers=1002,1014&zoom=17&lat=${coordUtm33[1].toFixed(2)}&lon=${coordUtm33[0].toFixed(2)}&sok=${newPortalData.lat},${newPortalData.lng}'>NO - Kartverket</a></li>
<li><a target='kulturminnesok' href='https://www.kulturminnesok.no/search?lat=${newPortalData.lat}&lng=${newPortalData.lng}'>NO - Kulturminnesøk</a></li>
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
    targetElement.insertAdjacentHTML(where, `<div id="wfrt_map_button_group" class='btn-group dropup'>${mapButtons}<div class='btn btn-default dropdown'><span class='caret'></span><ul id="wfrt_map_dropdown" class='dropdown-content dropdown-menu'>${mapDropdown}</div></div>`)
  }

  // add new button "Submit and reload", skipping "Your analysis has been recorded." dialog
  function quickSubmitButton (submitDiv, ansController, bodyObserver) {
    let submitButton = submitDiv.querySelector('button.button-primary')
    // submitButton.classList.add('btn', 'btn-warning')

    let submitAndNext = submitButton.cloneNode(false)
    submitButton.addEventListener('click', () => {
      bodyObserver.disconnect()
    })
    submitAndNext.innerHTML = `<span class="glyphicon glyphicon-floppy-disk"></span>&nbsp;<span class="glyphicon glyphicon-forward"></span>`
    submitAndNext.title = 'Submit and go to next review'
    submitAndNext.id = 'submitFF'
    submitAndNext.addEventListener('click', () => {
      ansController.openSubmissionCompleteModal = () => {
        window.location.assign('/review')
      }
    })

    w.$injector.invoke(['$compile', ($compile) => {
      let compiledSubmit = $compile(submitAndNext)(w.$scope(submitDiv))
      document.getElementById('submit-bottom').children[0].insertAdjacentElement('beforeBegin', compiledSubmit[0])
    }])
    return { submitButton, submitAndNext }
  }

  function commentTemplates () {
    // add text buttons
    const textButtons = `
<button id='photo' class='btn btn-default textButton' data-tooltip='Indicates a low quality photo'>Photo</button>
<button id='private' class='btn btn-default textButton' data-tooltip='Located on private residential property'>Private</button>`
    const textDropdown = `
<li><a class='textButton' id='school' data-tooltip='Located on school property'>School</a></li>
<li><a class='textButton' id='person' data-tooltip='Photo contains 1 or more people'>Person</a></li>
<li><a class='textButton' id='perm' data-tooltip='Seasonal or temporary display or item'>Temporary</a></li>
<li><a class='textButton' id='location' data-tooltip='Location wrong'>Location</a></li>
<li><a class='textButton' id='natural' data-tooltip='Candidate is a natural feature'>Natural</a></li>
<li><a class='textButton' id='emergencyway' data-tooltip='Obstructing emergency way'>Emergency Way</a></li>
`

    const cardAdditionalText = w.document.getElementById('additional-comments-card')
    const cardTextBox = cardAdditionalText.querySelector('textarea')

    cardAdditionalText.insertAdjacentHTML('beforeend', `<div class="card__footer">
<span id="wfrt_comment_button_group" class='btn-group dropup pull-left'>${textButtons}
<span class='btn btn-default dropdown'><span class='caret'></span><ul id="wfrt_comment_button_dropdown" class='dropdown-content dropdown-menu'>${textDropdown}</ul>
</span></span><span class="hidden-xs pull-right"><button id='clear' class='btn btn-default textButton' data-tooltip='clears the comment box'>Clear</button></span></div>
`)

    const buttons = w.document.getElementsByClassName('textButton')
    for (let b in buttons) {
      if (buttons.hasOwnProperty(b)) {
        buttons[b].addEventListener('click', event => {
          const source = event.target || event.srcElement
          let text = cardTextBox.value
          if (text.length > 0) {
            text += ', '
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

          cardTextBox.value = text
          cardTextBox.dispatchEvent(new Event('change')) // eslint-disable-line no-undef

          event.target.blur()
        }, false)
      }
    }
  }

  // adding a 40m circle and a smaller 20m circle around the portal (capture range)
  function mapOriginCircle (map) {
    // noinspection JSUnusedLocalSymbols
    if (preferences.get(WFRT.OPTIONS.MAP_CIRCLE_40)) {
      const circle40 = new google.maps.Circle({ // eslint-disable-line no-unused-vars
        map: map,
        center: map.center,
        radius: 40,
        strokeColor: '#ebbc4a',
        strokeOpacity: 0.8,
        strokeWeight: 1.5,
        fillOpacity: 0
      })
    }

    if (preferences.get(WFRT.OPTIONS.MAP_CIRCLE_20)) {
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
  }

  // replace map markers with a nice circle
  function mapMarker (markers) {
    for (let i = 0; i < markers.length; ++i) {
      const marker = markers[i]
      marker.setIcon(POI_MARKER)
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

    if (preferences.get(WFRT.OPTIONS.NORWAY_MAP_LAYER)) {
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
      mapType = WFRT.PREFIX + WFRT.VAR.MAP_TYPE_1
    } else {
      mapType = WFRT.PREFIX + WFRT.VAR.MAP_TYPE_2
    }

    // save selection when changed
    map.addListener('maptypeid_changed', function () {
      w.localStorage.setItem(mapType, map.getMapTypeId())
    })

    // get map type saved from last use or fall back to default
    map.setMapTypeId(w.localStorage.getItem(mapType) || defaultMapType)
  }

  // // move submit button to right side of classification-div. don't move on mobile devices / small width
  // function moveSubmitButton () {
  //   const submitDiv = w.document.querySelectorAll('#submitDiv, #submitDiv + .text-center')
  //
  //   if (screen.availWidth > 768) {
  //     let newSubmitDiv = w.document.createElement('div')
  //     const classificationRow = w.document.querySelector('.classification-row')
  //     newSubmitDiv.className = 'col-xs-12 col-sm-6'
  //     submitDiv[0].style.setProperty('margin-top', '16px')
  //     newSubmitDiv.appendChild(submitDiv[0])
  //     newSubmitDiv.appendChild(submitDiv[1])
  //     classificationRow.insertAdjacentElement('afterend', newSubmitDiv)
  //
  //     // edit-page - remove .col-sm-offset-3 from .classification-row (why did you add this, niantic?
  //     classificationRow.classList.remove('col-sm-offset-3')
  //     return newSubmitDiv
  //   } else {
  //     return submitDiv[0]
  //   }
  // }

  // expand automatically the "What is it?" filter text box
  function expandWhatIsItBox () {
    try {
      const whatController = w.$scope(w.document.getElementById('WhatIsItController')).whatCtrl
      setTimeout(() => {
        whatController.showWhat = true
        w.$rootScope.$apply()
      }, 50)
    } catch (err) {}
  }

  function modifyProfile () {
    // stats enhancements: add processed by nia, percent processed, progress to next recon badge numbers

    let wfrtScannerOffset = 0
    if (preferences.get(WFRT.OPTIONS.SCANNER_OFFSET_FEATURE)) {
      // get scanner offset from localStorage
      wfrtScannerOffset = parseInt(w.localStorage.getItem(WFRT.SCANNER_OFFSET)) || 0
    }
    const stats = w.document.querySelector('#profile-stats:not(.visible-xs)')

    const reviewed = parseInt(stats.children[0].children[0].children[1].innerText)
    const accepted = parseInt(stats.children[1].children[1].children[1].innerText)
    const rejected = parseInt(stats.children[1].children[2].children[1].innerText)
    const duplicated = parseInt(stats.children[1].children[3].children[1].innerText)

    const processed = accepted + rejected + duplicated - wfrtScannerOffset
    const processedPercent = roundToPrecision(processed / reviewed * 100, 1)

    const acceptedPercent = roundToPrecision(accepted / (reviewed) * 100, 1)
    const rejectedPercent = roundToPrecision(rejected / (reviewed) * 100, 1)
    const duplicatedPercent = roundToPrecision(duplicated / (reviewed) * 100, 1)

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

    const numberSpans = stats.querySelectorAll('span.stats-right')

    numberSpans[0].insertAdjacentHTML('beforeend', `, <span class=''>100%</span>`)
    numberSpans[1].insertAdjacentHTML('beforeend', `, <span class=''>${acceptedPercent}%</span>`)
    numberSpans[2].insertAdjacentHTML('beforeend', `, <span class=''>${rejectedPercent}%</span>`)
    numberSpans[3].insertAdjacentHTML('beforeend', `, <span class=''>${duplicatedPercent}%</span>`)

    stats.querySelectorAll('h4')[2].insertAdjacentHTML('afterend', `<br>
<h4><span class="stats-left">Processed <u>and</u> accepted analyses:</span> <span class="stats-right">${processed}, <span class="ingress-gray">${processedPercent}%</span></span></h4>`)

    if (processed < 10000) {
      stats.insertAdjacentHTML('beforeEnd', `
<br><div>Next Ingress Recon badge tier: <b>${nextBadgeName} (${nextBadgeCount})</b><br>
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
    } else stats.insertAdjacentHTML('beforeEnd', `<hr>`)
    stats.insertAdjacentHTML('beforeEnd', `<div><i class="glyphicon glyphicon-share"></i> <input readonly onFocus="this.select();" style="width: 90%;" type="text"
value="Reviewed: ${reviewed} / Processed: ${accepted + rejected + duplicated} (Created: ${accepted}/ Rejected: ${rejected}/ Duplicated: ${duplicated}) / ${Math.round(processedPercent)}%"/></div>`)

    // ** wayfarer-scanner offset
    if (accepted < 10000 && preferences.get(WFRT.OPTIONS.SCANNER_OFFSET_UI)) {
      stats.insertAdjacentHTML('beforeEnd', `
<div id='scannerOffsetContainer'>
<span style="margin-left: 5px" class="ingress-mid-blue pull-left">Scanner offset:</span>
<input id="scannerOffset" onFocus="this.select();" type="text" name="scannerOffset" size="8" class="pull-right" value="${wfrtScannerOffset}">
</div>`)

      // we have to inject the tooltip to angular
      w.$injector.invoke(['$compile', ($compile) => {
        let compiledSubmit = $compile(`<span class="glyphicon glyphicon-info-sign ingress-gray pull-left" uib-tooltip-trigger="outsideclick" uib-tooltip-placement="left" tooltip-class="goldBorder" uib-tooltip="Use negative values, if scanner is ahead of Wayfarer"></span>`)(w.$scope(stats))
        w.document.getElementById('scannerOffsetContainer').insertAdjacentElement('afterbegin', compiledSubmit[0])
      }]);

      ['change', 'keyup', 'cut', 'paste', 'input'].forEach(e => {
        w.document.getElementById('scannerOffset').addEventListener(e, (event) => {
          w.localStorage.setItem(WFRT.SCANNER_OFFSET, event.target.value)
        })
      })
      // **
    }

    modifyProfile = () => {} // eslint-disable-line
  }

  function addOptionsButton () {
    // Add preferences button only once
    if (w.document.getElementById('wfrt_preferences_button') !== null) {
      return
    }

    // add wayfarer-tools preferences button
    let wfrtPreferencesButton = w.document.createElement('a')
    wfrtPreferencesButton.classList.add('brand', 'upgrades-icon', 'pull-right')
    wfrtPreferencesButton.addEventListener('click', () => preferences.showPreferencesUI(w))
    wfrtPreferencesButton.title = 'Wayfarer-Tools Preferences'
    wfrtPreferencesButton.setAttribute('id', 'wfrt_preferences_button')

    const prefCog = w.document.createElement('span')
    prefCog.classList.add('glyphicon', 'glyphicon-cog')
    wfrtPreferencesButton.appendChild(prefCog)

    w.document.querySelector('.header .inner-container:last-of-type').insertAdjacentElement('afterbegin', wfrtPreferencesButton)
  }

  function addRefreshContainer () {
    let cbxRefresh = w.document.createElement('input')
    let cbxRefreshDesktop = w.document.createElement('input')

    cbxRefresh.id = WFRT.OPTIONS.REFRESH
    cbxRefresh.type = 'checkbox'
    cbxRefresh.checked = preferences.get(WFRT.OPTIONS.REFRESH) === 'true'

    cbxRefreshDesktop.id = WFRT.OPTIONS.REFRESH_NOTI_DESKTOP
    cbxRefreshDesktop.type = 'checkbox'
    cbxRefreshDesktop.checked = preferences.get(WFRT.OPTIONS.REFRESH_NOTI_DESKTOP) === 'true'

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
<div class='panel-heading'><span class='glyphicon glyphicon-refresh'></span> Refresh <sup>beta</sup> <a href='https://gitlab.com/1110101/opr-tools'><span class='label label-success pull-right'>Wayfarer-Tools</span></a></div>
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
      reloadWayfarer()
    }, time)

    function reloadWayfarer () {
      clearInterval(refreshIntervalID)
      w.sessionStorage.setItem(WFRT.FROM_REFRESH, 'true')
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
    if (w.sessionStorage.getItem(WFRT.FROM_REFRESH)) {
      // reset flag
      w.sessionStorage.removeItem(WFRT.FROM_REFRESH)

      if (w.document.hidden) { // if tab in background: flash favicon
        let flag = true

        if (preferences.get(WFRT.OPTIONS.REFRESH_NOTI_DESKTOP) === 'true') {
          GM_notification({
            'title': 'Wayfarer - New Wayspot Analysis Available',
            'text': 'by Wayfarer-Tools',
            'image': 'https://gitlab.com/uploads/-/system/project/avatar/3311015/opr-tools.png'
          })
        }

        let flashId = setInterval(() => {
          flag = !flag
          changeFavicon(`${flag ? POI_MARKER : '/imgpub/favicon.ico'}`)
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
    w.document.querySelector('.header .inner-container:last-of-type').insertAdjacentHTML('afterbegin', '<span id="countdownDisplay"></span>')

    let countdownEnd = subController.pageData.expires
    let countdownDisplay = document.getElementById('countdownDisplay')
    countdownDisplay.style.setProperty('color', 'black')

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
    if (WFRT.VERSION > (parseInt(w.localStorage.getItem(WFRT.PREFIX + WFRT.VERSION_CHECK)) || WFRT.VERSION - 1)) {
      w.localStorage.setItem(WFRT.PREFIX + WFRT.VERSION_CHECK, WFRT.VERSION)

      const changelogString = `
        <h4><span class="glyphicon glyphicon-asterisk"></span> Wayfarer-Tools was updated:</h4>
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
    wfrtCustomPresets = getCustomPresets(w)
    let customPresetOptions = ''
    for (const customPreset of wfrtCustomPresets) {
      customPresetOptions += `<button class='btn btn-default customPresetButton' id='${customPreset.uid}'>${customPreset.label}</button>`
    }
    w.document.getElementById('wfrt_custom_presets').innerHTML = customPresetOptions
  }

  function getCustomPresets (w) {
    // simply to scope the string we don't need after JSON.parse
    let presetsJSON = w.localStorage.getItem(WFRT.PREFIX + WFRT.VAR.CUSTOM_PRESETS)
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
    wfrtCustomPresets.push(preset)
    w.localStorage.setItem(WFRT.PREFIX + WFRT.VAR.CUSTOM_PRESETS, JSON.stringify(wfrtCustomPresets))
  }

  function deleteCustomPreset (preset) {
    wfrtCustomPresets = wfrtCustomPresets.filter(item => item.uid !== preset.uid)
    w.localStorage.setItem(WFRT.PREFIX + WFRT.VAR.CUSTOM_PRESETS, JSON.stringify(wfrtCustomPresets))
  }

  function showHelp () {
    let helpString = `<a href='https://gitlab.com/1110101/opr-tools'><span class='label label-success'>Wayfarer-Tools</span></a> Key shortcuts<br>
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
      <td><kbd>U</kbd></td>
      <td>Open supporting statement translation</td>
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
    [WFRT.OPTIONS.COMMENT_TEMPLATES]: 'Comment templates',
    [WFRT.OPTIONS.KEYBOARD_NAV]: 'Keyboard navigation',
    [WFRT.OPTIONS.NORWAY_MAP_LAYER]: 'Norwegian map layer',
    [WFRT.OPTIONS.PRESET_FEATURE]: 'Rating presets',
    [WFRT.OPTIONS.REFRESH]: 'Periodically refresh wayfarer if no analysis is available',
    [WFRT.OPTIONS.REFRESH_NOTI_DESKTOP]: '↳ With desktop notification',
    [WFRT.OPTIONS.SCANNER_OFFSET_FEATURE]: 'Scanner offset',
    [WFRT.OPTIONS.SCANNER_OFFSET_UI]: '↳ Display offset input field',
    [WFRT.OPTIONS.MAP_CIRCLE_20]: 'Show 20 meter circle around candidate location (minimum portal distance)',
    [WFRT.OPTIONS.MAP_CIRCLE_40]: 'Show 40 meter circle around candidate location (capture range)'
  },
  changelog:
    `
Version 2.0.7
<br>* Adopted new Wayfarer changes. Thanks to @MrJPGames, check out Wayfarer+!</a>
<br>
Version 2.0.6
<br>* Added shortcut key U to open supporting statement translation
<br>* Fixed countdown timer and percentage breakdowns (thanks to @fotofreund0815)
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

.dropdown:hover .dropdown-content {
display: block;
}

.dropdown-menu > li > a:focus, .dropdown-menu > li > a:hover {
background-color: unset;
}

.dropdown .dropdown-menu {
left: 0px;
right: unset;
width: unset;
}

.modal-sm {
width: 350px !important;
}

.panel-ingress {
background-color: #004746;
border: 1px solid #0ff;
border-radius: 1px;
box-shadow: inset 0 0 6px rgba(255, 255, 255, 1);
color: #0ff;
}

[data-tooltip] {
position: relative;
cursor: pointer;
}

[data-tooltip]:before,
[data-tooltip]:after {
visibility: hidden;
-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=0)";
filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=0);
opacity: 0;
pointer-events: none;
}

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

[data-tooltip]:hover:before,
[data-tooltip]:hover:after {
visibility: visible;
-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=100)";
filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=100);
opacity: 1;
}

.titleEditBox:hover {
box-shadow: inset 0 0 20px #ebbc4a;
}

.titleEditBox:active {
box-shadow: inset 0 0 15px 2px white;
}

.group-list li label:hover, ul.sub-group-list a:hover, #root-label:hover {
box-shadow: inset 0 0 5px #000000 !important;
}

.group-list li label:active, ul.sub-group-list a:active, #root-label:active {
box-shadow: inset 0 0 10px 2px #000000 !important;
}

.modal-body .button:focus, .modal-body textarea:focus {
outline: 2px dashed #ebbc4a;
}

.modal-body .button:hover, .gm-style-iw button.button:hover {
filter: brightness(150%);
}

.alertify-logs {
z-index: 100;
}

.alertify .dialog .msg {
color: black;
}

.alertify-logs > .default {
background-image: url(/img/ingress-background-dark.png) !important;
}

.btn-xs {
margin-left: 8px;
padding: 0px 7px 1px !important;
box-shadow: inset 0 0 4px rgba(255, 255, 255, 1);
-webkit-box-shadow: inset 0 0 4px rgba(255, 255, 255, 1);
-moz-box-shadow: inset 0 0 4px rgba(255, 255, 255, 1);
}

kbd {
display: inline-block;
padding: 3px 5px;
font: 11px SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace;
line-height: 10px;
color: #444d56;
vertical-align: middle;
background-color: #fafbfc;
border: 1px solid #d1d5da;
border-bottom-color: #c6cbd1;
border-radius: 3px;
box-shadow: inset 0 -1px 0 #c6cbd1;
}

.dropdown-menu {
margin: 0 !important;
}

.opr-yellow {
color: #F3EADA;
}

#submitAndSkipLowQuality, #submitAndSkipDuplicate {
margin-left: 32px;
margin-right: 32px;
}

#profile-stats > div {
width: 60%;
}
#scannerOffsetContainer {
margin-top: 16px;
}

#wfrt_preferences_button {
 cursor: pointer;
 margin-right: 20px;
 margin-left: 20px;
 color: rgb(157,157,157);
}
#wfrt_custom_presets_card {
    width: 100%;
    height: auto;
    min-height: unset;
    margin-left: 15px;
}
#submitFF {
margin-right: 16px;
}

@media (min-width: 768px) {
div.modal-custom1 {
width: 500px;
max-width: unset !important;
}
}
`

const POI_MARKER = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACx
jwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAu
OWwzfk4AAADlSURBVDhPY/j//z8CTw3U/V8lcvx/MfPX/2Xcd//XyWwDYxAbJAaS63c2Q9aD0Nyg
UPS/hPXt/3bD5f93LI7DwFvnJILlSlg//K+XrUc1AKS5jOvx/wU55Vg1I2OQmlKOpzBDIM4G2UyM
ZhgGqQW5BOgdBrC/cDkbHwbpAeplAAcONgWEMChMgHoZwCGMTQExGKiXARxN2CSJwUC9VDCAYi9Q
HIhVQicpi0ZQ2gYlCrITEigpg5IlqUm5VrILkRdghoBMxeUd5MwE1YxqAAiDvAMKE1DAgmIHFMUg
DGKDxDCy838GAPWFoAEBs2EvAAAAAElFTkSuQmCC`

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
