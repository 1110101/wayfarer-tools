// ==UserScript==
// @name            OPR tools light
// @version         0.20.0
// @description     light version of OPR tools for mobile browsers or if you don't need all features
// @homepageURL     https://gitlab.com/1110101/opr-tools
// @author          1110101, https://gitlab.com/1110101/opr-tools/graphs/master
// @match           https://opr.ingress.com/recon
// @grant           unsafeWindow
// @grant           GM_addStyle
// @downloadURL     https://gitlab.com/1110101/opr-tools/raw/master/opr-tools-light.user.js
// @updateURL       https://gitlab.com/1110101/opr-tools/raw/master/opr-tools-light.user.js
// @supportURL      https://gitlab.com/1110101/opr-tools/issues

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

// polyfill for ViolentMonkey
if (typeof exportFunction !== "function") {
	exportFunction = (func, scope, options) => {
		if (options && options.defineAs) {
			scope[options.defineAs] = func;
		}
		return func;
	};
}
if (typeof cloneInto !== "function") {
	cloneInto = obj => obj;
}

function addGlobalStyle(css) {
	GM_addStyle(css);
	addGlobalStyle = () => {}; // noop after first run
}
function init() {
	const w = typeof unsafeWindow == "undefined" ? window : unsafeWindow;
	let tryNumber = 15;

	let browserLocale = window.navigator.languages[0] || window.navigator.language || "en";

	const initWatcher = setInterval(() => {
		if (tryNumber === 0) {
			clearInterval(initWatcher);
			w.document.getElementById("NewSubmissionController")
			.insertAdjacentHTML("afterBegin", `
<div class='alert alert-danger'><strong><span class='glyphicon glyphicon-remove'></span> OPR-Tools initialization failed, refresh page</strong></div>
`);
			return;
		}
		if (w.angular) {
			let err = false;
			try {
				initAngular();
			}
			catch (error) {
				console.log(error);
				err = error;
			}
			if (!err) {
				try {
					initScript();
					clearInterval(initWatcher);
				} catch (error) {
					console.log(error);
					if (error !== 42) {
						clearInterval(initWatcher);
					}
				}
			}
		}
		tryNumber--;
	}, 1000);

	function initAngular() {
		const el = w.document.querySelector("[ng-app='portalApp']");
		w.$app = w.angular.element(el);
		w.$injector = w.$app.injector();
		w.$rootScope = w.$app.scope();

		w.$scope = element => w.angular.element(element).scope();
	}

	function initScript() {
		const subMissionDiv = w.document.getElementById("NewSubmissionController");
		const subController = w.$scope(subMissionDiv).subCtrl;
		const newPortalData = subController.pageData;

		const whatController = w.$scope(w.document.getElementById("WhatIsItController")).whatCtrl;

		const answerDiv = w.document.getElementById("AnswersController");
		const ansController = w.$scope(answerDiv).answerCtrl;

		// adding CSS
		addGlobalStyle(GLOBAL_CSS);

		modifyHeader();

		if (subController.errorMessage !== "") {
			// no portal analysis data available
			throw 41; // @todo better error code
		}

		if (typeof newPortalData === "undefined") {
			// no submission data present
			throw 42; // @todo better error code
		}

		// detect portal edit
		if (subController.reviewType === "NEW") {
			modifyNewPage(ansController, subController, whatController, newPortalData);
		} else if (subController.reviewType === "EDIT") {
			modifyEditPage(ansController, subController, newPortalData);
		}
	}

	function modifyNewPage(ansController, subController, whatController, newPortalData) {

		mapButtons(newPortalData, w.document.getElementById("descriptionDiv"), "beforeEnd");

		let newSubmitDiv = moveSubmitButton();
		let {submitButton, submitAndNext} = quickSubmitButton(newSubmitDiv, ansController);

		textButtons();

		// re-enabling map scroll zoom and allow zoom with out holding ctrl
		const mapOptions = {scrollwheel: true, gestureHandling: "greedy"};
		subController.map.setOptions(cloneInto(mapOptions, w));
		subController.map2.setOptions(cloneInto(mapOptions, w));

		// move portal rating to the right side. don't move on mobile devices / small width
		if (screen.availWidth > 768) {
			let nodeToMove = w.document.querySelector("div[class='btn-group']").parentElement;
			if (subController.hasSupportingImageOrStatement) {
				const descDiv = w.document.getElementById("descriptionDiv");
				const scorePanel = descDiv.querySelector("div.text-center.hidden-xs");
				scorePanel.insertBefore(nodeToMove, scorePanel.firstChild);
			} else {
				const scorePanel = w.document.querySelector("div[class~='pull-right']");
				scorePanel.insertBefore(nodeToMove, scorePanel.firstChild);
			}
		}

		// bind click-event to Dup-Images-Filmstrip. result: a click to the detail-image the large version is loaded in another tab
		const imgDups = w.document.querySelectorAll("#map-filmstrip > ul > li > img");
		const openFullImage = function () {
			w.open(`${this.src}=s0`, "fulldupimage");
		};
		for (let imgSep in imgDups) {
			if (imgDups.hasOwnProperty(imgSep)) {
				imgDups[imgSep].addEventListener("click", () => {
					const imgDup = w.document.querySelector("#content > img");
					if (imgDup !== null) {
						imgDup.removeEventListener("click", openFullImage);
						imgDup.addEventListener("click", openFullImage);
						imgDup.setAttribute("style", "cursor: pointer;");
					}
				});
			}
		}

		// add translate buttons to title and description (if existing)
		let lang = "en";
		try { lang = browserLocale.split("-")[0]; } catch (e) {}
		const link = w.document.querySelector("#descriptionDiv a");
		const content = link.innerText.trim();
		let a = w.document.createElement("a");
		let span = w.document.createElement("span");
		span.className = "glyphicon glyphicon-book";
		span.innerHTML = " ";
		a.appendChild(span);
		a.className = "translate-title button btn btn-default pull-right";
		a.target = "translate";
		a.style.padding = "0px 4px";
		a.href = `https://translate.google.com/#auto/${lang}/${encodeURIComponent(content)}`;
		link.insertAdjacentElement("afterend", a);

		const description = w.document.querySelector("#descriptionDiv").innerHTML.split("<br>")[3].trim();
		if (description !== "&lt;No description&gt;" && description !== "") {
			a = w.document.createElement("a");
			span = w.document.createElement("span");
			span.className = "glyphicon glyphicon-book";
			span.innerHTML = " ";
			a.appendChild(span);
			a.className = "translate-description button btn btn-default pull-right";
			a.target = "translate";
			a.style.padding = "0px 4px";
			a.href = `https://translate.google.com/#auto/${lang}/${encodeURIComponent(description)}`;
			const br = w.document.querySelectorAll("#descriptionDiv br")[2];
			br.insertAdjacentElement("afterend", a);
		}

		// automatically open the first listed possible duplicate
		try {
			const e = w.document.querySelector("#map-filmstrip > ul > li:nth-child(1) > img");
			if (e !== null) {
				setTimeout(() => {
					e.click();
				}, 500);
			}
		} catch (err) {}

		expandWhatIsItBox();

		// keyboard navigation
		// keys 1-5 to vote
		// space/enter to confirm dialogs
		// esc or numpad "/" to reset selector
		// Numpad + - to navigate

		let currentSelectable = 0;
		let maxItems = 7;

		// a list of all 6 star button rows, and the two submit buttons
		let starsAndSubmitButtons = w.document.querySelectorAll(".col-sm-6 .btn-group, .col-sm-4.hidden-xs .btn-group, .big-submit-button");

		function highlight() {
			starsAndSubmitButtons.forEach(exportFunction((element) => { element.style.border = "none"; }, w));
			if (currentSelectable <= maxItems - 2) {
				starsAndSubmitButtons[currentSelectable].style.border = cloneInto("1px dashed #ebbc4a", w);
				submitAndNext.blur();
				submitButton.blur();
			} else if (currentSelectable == 6) {
				submitAndNext.focus();
			}
			else if (currentSelectable == 7) {
				submitButton.focus();
			}
		}

		addEventListener("keydown", (event) => {

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

			if (event.keyCode >= 49 && event.keyCode <= 53)
				numkey = event.keyCode - 48;
			else if (event.keyCode >= 97 && event.keyCode <= 101)
				numkey = event.keyCode - 96;
			else
				numkey = null;

			// do not do anything if a text area or a input with type text has focus
			if (w.document.querySelector("input[type=text]:focus") || w.document.querySelector("textarea:focus")) {
				return;
			}
			// "analyze next" button
			else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector("a.button[href=\"/recon\"]")) {
				w.document.location.href = "/recon";
				event.preventDefault();
			} // submit low quality rating
			else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector("[ng-click=\"answerCtrl2.confirmLowQuality()\"]")) {
				w.document.querySelector("[ng-click=\"answerCtrl2.confirmLowQuality()\"]").click();
				currentSelectable = 0;
				event.preventDefault();

			} // click first/selected duplicate (key D)
			else if ((event.keyCode === 68) && w.document.querySelector("#content > button")) {
				w.document.querySelector("#content > button").click();
				currentSelectable = 0;
				event.preventDefault();

			} // click on translate title link (key T)
			else if (event.keyCode === 84) {
				const link = w.document.querySelector("#descriptionDiv > .translate-title");
				if (link) {
					link.click();
					event.preventDefault();
				}

			} // click on translate description link (key Y)
			else if (event.keyCode === 89) {
				const link = w.document.querySelector("#descriptionDiv > .translate-description");
				if (link) {
					link.click();
					event.preventDefault();
				}

			} // submit duplicate
			else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector("[ng-click=\"answerCtrl2.confirmDuplicate()\"]")) {
				w.document.querySelector("[ng-click=\"answerCtrl2.confirmDuplicate()\"]").click();
				currentSelectable = 0;
				event.preventDefault();

			} // submit normal rating
			else if ((event.keyCode === 13 || event.keyCode === 32) && currentSelectable === maxItems) {
				w.document.querySelector("[ng-click=\"answerCtrl.submitForm()\"]").click();
				event.preventDefault();

			} // close duplicate dialog
			else if ((event.keyCode === 27 || event.keyCode === 111) && w.document.querySelector("[ng-click=\"answerCtrl2.resetDuplicate()\"]")) {
				w.document.querySelector("[ng-click=\"answerCtrl2.resetDuplicate()\"]").click();
				currentSelectable = 0;
				event.preventDefault();

			} // close low quality ration dialog
			else if ((event.keyCode === 27 || event.keyCode === 111) && w.document.querySelector("[ng-click=\"answerCtrl2.resetLowQuality()\"]")) {
				w.document.querySelector("[ng-click=\"answerCtrl2.resetLowQuality()\"]").click();
				currentSelectable = 0;
				event.preventDefault();
			}
			// return to first selection (should this be a portal)
			else if (event.keyCode === 27 || event.keyCode === 111) {
				currentSelectable = 0;
			}
			// skip portal if possible
			else if (event.keyCode === 106 || event.keyCode === 220) {
				if (newPortalData.canSkip)
					ansController.skipToNext();
			}
			else if (event.keyCode === 72) {
				showHelp(); // @todo
			}
			// select next rating
			else if ((event.keyCode === 107 || event.keyCode === 9) && currentSelectable < maxItems) {
				currentSelectable++;
				event.preventDefault();
			}
			// select previous rating
			else if ((event.keyCode === 109 || event.keyCode === 16 || event.keyCode === 8) && currentSelectable > 0) {
				currentSelectable--;
				event.preventDefault();
			}
			else if (numkey === null || currentSelectable > maxItems - 2) {
				return;
			}
			else if (numkey !== null && event.shiftKey) {
				try {
					w.document.getElementsByClassName("customPresetButton")[numkey - 1].click();
				} catch (e) {
					// ignore
				}
			}
			// rating 1-5
			else {
				starsAndSubmitButtons[currentSelectable].querySelectorAll("button.button-star")[numkey - 1].click();
				currentSelectable++;
			}
			highlight();
		});

		highlight();

		modifyNewPage = () => {}; // just run once
	}

	function modifyEditPage(ansController, subController, newPortalData) {
		let editDiv = w.document.querySelector("div[ng-show=\"subCtrl.reviewType==='EDIT'\"]");

		mapButtons(newPortalData, editDiv, "afterEnd");

		let newSubmitDiv = moveSubmitButton();
		let {submitButton, submitAndNext} = quickSubmitButton(newSubmitDiv, ansController);

		textButtons();

		// re-enable map scroll zoom and allow zoom with out holding ctrl
		const mapOptions = {scrollwheel: true, gestureHandling: "greedy"};
		subController.locationEditsMap.setOptions(cloneInto(mapOptions, w));

		// add translation links to title and description edits
		if (newPortalData.titleEdits.length > 1 || newPortalData.descriptionEdits.length > 1) {
			for (const titleEditBox of editDiv.querySelectorAll(".titleEditBox")) {
				const content = titleEditBox.innerText.trim();
				let a = w.document.createElement("a");
				let span = w.document.createElement("span");
				span.className = "glyphicon glyphicon-book";
				span.innerHTML = " ";
				a.appendChild(span);
				a.className = "translate-title button btn btn-default pull-right";
				a.target = "translate";
				a.style.padding = "0px 4px";
				a.href = `https://translate.google.com/#auto/${browserLocale.split("-")[0]}/${encodeURIComponent(content)}`;
				titleEditBox.querySelector("p").style.display = "inline-block";
				titleEditBox.insertAdjacentElement("beforeEnd", a);
			}
		}

		if (newPortalData.titleEdits.length <= 1) {
			let titleDiv = editDiv.querySelector("div[ng-show=\"subCtrl.pageData.titleEdits.length <= 1\"] h3");
			const content = titleDiv.innerText.trim();
			let a = w.document.createElement("a");
			let span = w.document.createElement("span");
			span.className = "glyphicon glyphicon-book";
			span.innerHTML = " ";
			a.appendChild(span);
			a.className = "translate-title button btn btn-default";
			a.target = "translate";
			a.style.padding = "0px 4px";
			a.style.marginLeft = "14px";
			a.href = `https://translate.google.com/#auto/${browserLocale.split("-")[0]}/${encodeURIComponent(content)}`;
			titleDiv.insertAdjacentElement("beforeend", a);
		}

		if (newPortalData.descriptionEdits.length <= 1) {
			let titleDiv = editDiv.querySelector("div[ng-show=\"subCtrl.pageData.descriptionEdits.length <= 1\"] p");
			const content = titleDiv.innerText.trim() || "";
			if (content !== "<No description>" && content !== "") {
				let a = w.document.createElement("a");
				let span = w.document.createElement("span");
				span.className = "glyphicon glyphicon-book";
				span.innerHTML = " ";
				a.appendChild(span);
				a.className = "translate-title button btn btn-default";
				a.target = "translate";
				a.style.padding = "0px 4px";
				a.style.marginLeft = "14px";
				a.href = `https://translate.google.com/#auto/${browserLocale.split("-")[0]}/${encodeURIComponent(content)}`;
				titleDiv.insertAdjacentElement("beforeEnd", a);
			}
		}

		expandWhatIsItBox();

		// fix locationEditsMap if only one location edit exists
		if (newPortalData.locationEdits.length <= 1)
			subController.locationEditsMap.setZoom(19);

		/* EDIT PORTAL */
		// keyboard navigation

		let currentSelectable = 0;
		let hasLocationEdit = (newPortalData.locationEdits.length > 1);
		// counting *true*, please don't shoot me
		let maxItems = (newPortalData.descriptionEdits.length > 1) + (newPortalData.titleEdits.length > 1) + (hasLocationEdit) + 2;

		let mapMarkers;
		if (hasLocationEdit) mapMarkers = subController.allLocationMarkers;
		else mapMarkers = [];

		// a list of all 6 star button rows, and the two submit buttons
		let starsAndSubmitButtons = w.document.querySelectorAll(
				"div[ng-show=\"subCtrl.reviewType==='EDIT'\"] > div[ng-show=\"subCtrl.pageData.titleEdits.length > 1\"]:not(.ng-hide)," +
				"div[ng-show=\"subCtrl.reviewType==='EDIT'\"] > div[ng-show=\"subCtrl.pageData.descriptionEdits.length > 1\"]:not(.ng-hide)," +
				"div[ng-show=\"subCtrl.reviewType==='EDIT'\"] > div[ng-show=\"subCtrl.pageData.locationEdits.length > 1\"]:not(.ng-hide)," +
				".big-submit-button");


		/* EDIT PORTAL */
		function highlight() {
			let el = editDiv.querySelector("h3[ng-show=\"subCtrl.pageData.locationEdits.length > 1\"]");
			el.style.border = "none";

			starsAndSubmitButtons.forEach(exportFunction((element) => { element.style.border = "none"; }, w));
			if (hasLocationEdit && currentSelectable === maxItems - 3) {
				el.style.borderLeft = cloneInto("4px dashed #ebbc4a", w);
				el.style.borderTop = cloneInto("4px dashed #ebbc4a", w);
				el.style.borderRight = cloneInto("4px dashed #ebbc4a", w);
				el.style.padding = cloneInto("16px", w);
				el.style.marginBottom = cloneInto("0", w);
				submitAndNext.blur();
				submitButton.blur();
			}
			else if (currentSelectable < maxItems - 2) {
				starsAndSubmitButtons[currentSelectable].style.borderLeft = cloneInto("4px dashed #ebbc4a", w);
				starsAndSubmitButtons[currentSelectable].style.paddingLeft = cloneInto("16px", w);
				submitAndNext.blur();
				submitButton.blur();
			} else if (currentSelectable === maxItems - 2) {
				submitAndNext.focus();
			}
			else if (currentSelectable === maxItems) {
				submitButton.focus();
			}

		}

		/* EDIT PORTAL */
		addEventListener("keydown", (event) => {

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

			if (event.keyCode >= 49 && event.keyCode <= 53)
				numkey = event.keyCode - 48;
			else if (event.keyCode >= 97 && event.keyCode <= 101)
				numkey = event.keyCode - 96;
			else
				numkey = null;

			// do not do anything if a text area or a input with type text has focus
			if (w.document.querySelector("input[type=text]:focus") || w.document.querySelector("textarea:focus")) {
				return;
			}
			// "analyze next" button
			else if ((event.keyCode === 13 || event.keyCode === 32) && w.document.querySelector("a.button[href=\"/recon\"]")) {
				w.document.location.href = "/recon";
				event.preventDefault();
			}  // submit normal rating
			else if ((event.keyCode === 13 || event.keyCode === 32) && currentSelectable === maxItems) {
				w.document.querySelector("[ng-click=\"answerCtrl.submitForm()\"]").click();
				event.preventDefault();

			} // return to first selection (should this be a portal)
			else if (event.keyCode === 27 || event.keyCode === 111) {
				currentSelectable = 0;
			}
			// select next rating
			else if ((event.keyCode === 107 || event.keyCode === 9) && currentSelectable < maxItems) {
				currentSelectable++;
				event.preventDefault();
			}
			// select previous rating
			else if ((event.keyCode === 109 || event.keyCode === 16 || event.keyCode === 8) && currentSelectable > 0) {
				currentSelectable--;
				event.preventDefault();

			}
			else if (numkey === null || currentSelectable > maxItems - 2) {
				return;
			}
			// rating 1-5
			else {

				if (hasLocationEdit && currentSelectable === maxItems - 3 && numkey <= mapMarkers.length) {
					google.maps.event.trigger(angular.element(document.getElementById("NewSubmissionController")).scope().getAllLocationMarkers()[numkey - 1], "click");
				}
				else {
					if (hasLocationEdit) numkey = 1;
					starsAndSubmitButtons[currentSelectable].querySelectorAll(".titleEditBox, input[type='checkbox']")[numkey - 1].click();
					currentSelectable++;
				}
			}
			highlight();
		});

		highlight();
	}

	// add map buttons
	function mapButtons(newPortalData, targetElement, where) {
		const mapButtons = `
<a class='button btn btn-default' target='intel' href='https://www.ingress.com/intel?ll=${newPortalData.lat},${newPortalData.lng}&z=17'>Intel</a>
<a class='button btn btn-default' target='osm' href='https://www.openstreetmap.org/?mlat=${newPortalData.lat}&mlon=${newPortalData.lng}&zoom=16'>OSM</a>
<a class='button btn btn-default' target='bing' href='https://bing.com/maps/default.aspx?cp=${newPortalData.lat}~${newPortalData.lng}&lvl=16&style=a'>bing</a></li>
`;
		targetElement.insertAdjacentHTML(where, `<div><div class='btn-group'>${mapButtons}</div></div>`);
	}

	// add new button "Submit and reload", skipping "Your analysis has been recorded." dialog
	function quickSubmitButton(submitDiv, ansController) {
		let submitButton = submitDiv.querySelector("button");
		submitButton.classList.add("btn", "btn-warning");
		let submitAndNext = submitButton.cloneNode(false);
		submitAndNext.innerHTML = `<span class="glyphicon glyphicon-floppy-disk"></span>&nbsp;<span class="glyphicon glyphicon-forward"></span>`;
		submitAndNext.title = "Submit and go to next review";
		submitAndNext.addEventListener("click", exportFunction(() => {
			exportFunction(() => {
				window.location.assign("/recon");
			}, ansController, {defineAs: "openSubmissionCompleteModal"});
		}, w));

		w.$injector.invoke(cloneInto(["$compile", ($compile) => {
			let compiledSubmit = $compile(submitAndNext)(w.$scope(submitDiv));
			submitDiv.querySelector("button").insertAdjacentElement("beforeBegin", compiledSubmit[0]);
		}], w, {cloneFunctions: true}));

		return {submitButton, submitAndNext};
	}

	function textButtons() {
		let emergencyWay = "";
		if (browserLocale.includes("de")) {
			emergencyWay = "RETTUNGSWEG!1";
		} else {
			emergencyWay = "Emergency Way";
		}
		// add text buttons
		const textButtons = `
<button id='photo' class='button btn btn-default textButton' data-tooltip='Indicates a low quality photo'>Photo</button>
<button id='private' class='button btn btn-default textButton' data-tooltip='Located on private residential property'>Private</button>`;
		const textDropdown = `
<li><a class='textButton' id='school' data-tooltip='Located on school property'>School</a></li>
<li><a class='textButton' id='person' data-tooltip='Photo contains 1 or more people'>Person</a></li>
<li><a class='textButton' id='perm' data-tooltip='Seasonal or temporary display or item'>Temporary</a></li>
<li><a class='textButton' id='location' data-tooltip='Location wrong'>Location</a></li>
<li><a class='textButton' id='natural' data-tooltip='Candidate is a natural feature'>Natural</a></li>
<li><a class='textButton' id='emergencyway' data-tooltip='Obstructing emergency way'>${emergencyWay}</a></li>
`;

		const textBox = w.document.querySelector("#submitDiv + .text-center > textarea");

		w.document.querySelector("#submitDiv + .text-center").insertAdjacentHTML("beforebegin", `
<div class='btn-group dropup'>${textButtons}
<div class='button btn btn-default dropdown'><span class='caret'></span><ul class='dropdown-content dropdown-menu'>${textDropdown}</ul>
</div></div><div class="pull-right hidden-xs"><button id='clear' class='button btn btn-default textButton' data-tooltip='clears the comment box'>Clear</button></div>
`);

		const buttons = w.document.getElementsByClassName("textButton");
		for (let b in buttons) {
			if (buttons.hasOwnProperty(b)) {
				buttons[b].addEventListener("click", exportFunction(event => {
					const source = event.target || event.srcElement;
					let text = textBox.value;
					if (text.length > 0) {
						text += ",\n";
					}
					switch (source.id) {
						case "photo":
							text += "Low quality photo";
							break;
						case "private":
							text += "Private residential property";
							break;
						case "duplicate":
							text += "Duplicate of previously reviewed portal candidate";
							break;
						case "school":
							text += "Located on primary or secondary school grounds";
							break;
						case "person":
							text += "Picture contains one or more people";
							break;
						case "perm":
							text += "Portal candidate is seasonal or temporary";
							break;
						case "location":
							text += "Portal candidate's location is not on object";
							break;
						case "emergencyway":
							text += "Portal candidate is obstructing the path of emergency vehicles";
							break;
						case "natural":
							text += "Portal candidate is a natural feature";
							break;
						case "clear":
							text = "";
							break;
					}

					textBox.value = text;
					textBox.dispatchEvent(new Event("change"));

					event.target.blur();

				}, w), false);
			}
		}
	}

	// move submit button to right side of classification-div. don't move on mobile devices / small width
	function moveSubmitButton() {
		const submitDiv = w.document.querySelectorAll("#submitDiv, #submitDiv + .text-center");

		if (screen.availWidth > 768) {
			let newSubmitDiv = w.document.createElement("div");
			const classificationRow = w.document.querySelector(".classification-row");
			newSubmitDiv.className = "col-xs-12 col-sm-6";
			submitDiv[0].style.marginTop = 16;
			newSubmitDiv.appendChild(submitDiv[0]);
			newSubmitDiv.appendChild(submitDiv[1]);
			classificationRow.insertAdjacentElement("afterend", newSubmitDiv);

			// edit-page - remove .col-sm-offset-3 from .classification-row (why did you add this, niantic?
			classificationRow.classList.remove("col-sm-offset-3");
			return newSubmitDiv;
		} else {
			return submitDiv[0];
		}
	}
	// expand automatically the "What is it?" filter text box
	function expandWhatIsItBox() {
		try {
			const f = w.document.querySelector("#WhatIsItController > div > p > span.ingress-mid-blue.text-center");
			setTimeout(() => {
				f.click();
			}, 250);
		} catch (err) {}
	}

	function modifyHeader() {
		// stats enhancements: add processed by nia, percent processed, progress to next recon badge numbers
		const lastPlayerStatLine = w.document.querySelector("#player_stats:not(.visible-xs) div");
		const stats = w.document.querySelector("#player_stats").children[2];

		const reviewed = parseInt(stats.children[3].children[2].innerText);
		const accepted = parseInt(stats.children[5].children[2].innerText);
		const rejected = parseInt(stats.children[7].children[2].innerText);

		const processed = accepted + rejected;
		const percent = Math.round(processed / reviewed * 1000) / 10;

		const reconBadge = {100: "Bronze", 750: "Silver", 2500: "Gold", 5000: "Platin", 10000: "Black"};
		let nextBadgeName, nextBadgeCount;

		for (const key in reconBadge) {
			if (processed <= key) {
				nextBadgeCount = key;
				nextBadgeName = reconBadge[key];
				break;
			}
		}
		const nextBadgeProcess = processed / nextBadgeCount * 100;

		lastPlayerStatLine.insertAdjacentHTML("beforeEnd", `<br>
<p><span class="glyphicon glyphicon-info-sign ingress-gray pull-left"></span><span style="margin-left: 5px;" class="ingress-mid-blue pull-left">Processed <u>and</u> accepted analyses:</span> <span class="gold pull-right">${processed} (${percent}%) </span></p>`);

		if (accepted < 10000) {
			lastPlayerStatLine.insertAdjacentHTML("beforeEnd", `
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
`);
		}

		else lastPlayerStatLine.insertAdjacentHTML("beforeEnd", `<hr>`);
		lastPlayerStatLine.insertAdjacentHTML("beforeEnd", `<p><i class="glyphicon glyphicon-share"></i> <input readonly onFocus="this.select();" style="width: 90%;" type="text"
value="Reviewed: ${reviewed} / Processed: ${accepted + rejected } (Created: ${accepted}/ Rejected: ${rejected}) / ${Math.round(percent)}%"/></p>`);

		modifyHeader = () => {}; // just run once
	}
}

setTimeout(() => {
	init();
}, 500);

//region const
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
filter: progid: DXImageTransform.Microsoft.Alpha(Opacity=0);
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
filter: progid: DXImageTransform.Microsoft.Alpha(Opacity=100);
opacity: 1;
}
.titleEditBox:hover {
	box-shadow: inset 0 0 20px #ebbc4a;
}
.titleEditBox:active {
	box-shadow: inset 0 0 15px 2px white;
}`;
//endregion
