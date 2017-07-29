// ==UserScript==
// @name         OPR tools
// @version      0.10.5
// @description  OPR enhancements
// @homepageURL     https://gitlab.com/1110101/opr-tools
// @author       1110101, https://gitlab.com/1110101/opr-tools/graphs/master
// @match        https://opr.ingress.com/recon
// @grant        unsafeWindow
// @downloadURL  https://gitlab.com/1110101/opr-tools/raw/master/opr-tools.user.js
// @updateURL    https://gitlab.com/1110101/opr-tools/raw/master/opr-tools.user.js
// @supportURL   null


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

const PORTAL_MARKER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuOWwzfk4AAADlSURBVDhPY/j//z8CTw3U/V8lcvx/MfPX/2Xcd//XyWwDYxAbJAaS63c2Q9aD0NygUPS/hPXt/3bD5f93LI7DwFvnJILlSlg//K+XrUc1AKS5jOvx/wU55Vg1I2OQmlKOpzBDIM4G2UyMZhgGqQW5BOgdBrC/cDkbHwbpAeplAAcONgWEMChMgHoZwCGMTQExGKiXARxN2CSJwUC9VDCAYi9QHIhVQicpi0ZQ2gYlCrITEigpg5IlqUm5VrILkRdghoBMxeUd5MwE1YxqAAiDvAMKE1DAgmIHFMUgDGKDxDCy838GAPWFoAEBs2EvAAAAAElFTkSuQmCC";
function addGlobalStyle(css) {
	let head, style;
	head = document.getElementsByTagName("head")[0];
	if (!head) return;
	style = document.createElement("style");
	style.type = "text/css";
	style.innerHTML = css;
	head.appendChild(style);
}

function init() {
	const w = typeof unsafeWindow == "undefined" ? window : unsafeWindow;
	let tryNumber = 8;
	const initWatcher = setInterval(function () {
		if (tryNumber === 0) {
			clearInterval(initWatcher);
			w.document.getElementById("NewSubmissionController").insertAdjacentHTML("afterBegin", `
<div class='alert alert-danger'><strong><span class='glyphicon glyphicon-remove'></span> OPR tools initialization failed, refresh page</strong> or check developer console for error details</div>
`);
            return;
        }
        if (w.angular) {
            let err = false;
            try {
                initAngular();
            }
            catch (error) {
                err = error;
                console.log(error);
            }
            if (!err) {
                try {
                    initScript();
                    clearInterval(initWatcher);
                } catch (error) {
                    console.log(error);
                    if(error !== 42) {
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

		w.$scope = function (element) {
			return w.angular.element(element).scope();
		};
	}

    function initScript() {
        const descDiv = document.getElementById("descriptionDiv");
        const ansController = w.$scope(descDiv).answerCtrl;
        const subController = w.$scope(descDiv).subCtrl;
        const scope = w.$scope(descDiv);
        const pageData = subController.pageData;
        if(typeof pageData === "undefined") {
			throw 42; // @todo better error code
		}

		// run on init
		modifyPage();

        function modifyPage() {

			// adding CSS
			addGlobalStyle(`
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
* Tooltip Styles
*/

/* Add this attribute to the element that needs a tooltip */
[data-tooltip] {
position: relative;
z-index: 2;
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
`);

			// adding map buttons
			const mapButtons = [
				"<a class='button btn btn-default' target='intel' href='https://www.ingress.com/intel?ll=" + pageData.lat + "," + pageData.lng + "&z=17'>Intel</a>",
				"<a class='button btn btn-default' target='osm' href='https://www.openstreetmap.org/?mlat=" + pageData.lat + "&mlon=" + pageData.lng + "&zoom=16'>OSM</a>",
				"<a class='button btn btn-default' target='bing' href='https://bing.com/maps/default.aspx?cp=" + pageData.lat + "~" + pageData.lng + "&lvl=16&style=a'>bing</a>"
			];

			// more map buttons in a dropdown menu
			const mapDropdown = [
				"<li><a target='heremaps' href='https://wego.here.com/?map=" + pageData.lat + "," + pageData.lng + ",17,satellite'>HERE maps</a></li>",
				"<li><a target='wikimapia' href='http://wikimapia.org/#lat=" + pageData.lat + "&lon=" + pageData.lng + "&z=16'>Wikimapia</a></li>",
				"<li><a targeT='zoomearth' href='https://zoom.earth/#" + pageData.lat + "," + pageData.lng + ",18z,sat'>Zoom Earth</a></li>",

				"<li role='separator' class='divider'></li>",

                // national maps
                "<li><a target='swissgeo' href='http://map.geo.admin.ch/?swisssearch=" + pageData.lat + "," + pageData.lng + "'>CH - Swiss Geo Map</a></li>",
                "<li><a target='mapycz' href='https://mapy.cz/zakladni?x=" + pageData.lng + "&y=" + pageData.lat +
                "&z=17&base=ophoto&source=coor&id=" + pageData.lng + "%2C" + pageData.lat + "&q=" + pageData.lng + "%20" + pageData.lat + "'>CZ-mapy.cz (ortofoto)</a></li>",
                "<li><a target='mapycz' href='https://mapy.cz/zakladni?x=" + pageData.lng + "&y=" + pageData.lat +
                "&z=17&base=ophoto&m3d=1&height=180&yaw=-279.39&pitch=-40.7&source=coor&id=" + pageData.lng + "%2C" + pageData.lat + "&q=" + pageData.lng + "%20" + pageData.lat + "'>CZ-mapy.cz (orto+3D)</a></li>",
                "<li><a target='kompass' href='http://maps.kompass.de/#lat=" + pageData.lat + "&lon=" + pageData.lng + "&z=17'>DE - Kompass.maps</a></li>",
                "<li><a target='bayernatlas' href='https://geoportal.bayern.de/bayernatlas/index.html?X=" + pageData.lat + "&Y=" + pageData.lng + "&zoom=14&lang=de&bgLayer=luftbild&topic=ba&catalogNodes=122'>DE - BayernAtlas</a></li>",
                "<li><a target='eniro' href='http://opr.pegel.dk/?17/" + pageData.lat + "/" + pageData.lng + "'>DK - SDFE Orthophotos</a></li>",
                "<li><a target='kakao' href='http://map.daum.net/link/map/" + pageData.lat + "," + pageData.lng + "'>KR - Kakao map</a></li>",
	            "<li><a target='naver' href='http://map.naver.com/?menu=location&lat=" + pageData.lat + "&lng=" + pageData.lng + "&dLevel=14&title=CandidatePortalLocation"+"'>KR - Naver map</a></li>",

				"<li><a target='yandex' href='https://maps.yandex.ru/?text=" + pageData.lat + "," + pageData.lng + "'>RU - Yandex</a></li>",
				"<li><a target='hitta' href='https://www.hitta.se/kartan!~" + pageData.lat + "," + pageData.lng + ",18z/tileLayer!l=1'>SE - Hitta.se</a></li>",
				"<li><a target='eniro' href='https://kartor.eniro.se/?c=" + pageData.lat + "," + pageData.lng + "&z=17&l=nautical'>SE - Eniro Sjökort</a></li>"
			];

			descDiv.insertAdjacentHTML("beforeEnd", "<div><div class='btn-group'>" + mapButtons.join("") +
					"<div class='button btn btn-primary dropdown'><span class='caret'></span><ul class='dropdown-content dropdown-menu'>" + mapDropdown.join("") + "</div></div>");


			// moving submit button to right side of classification-div
			const submitDiv = w.document.querySelectorAll("#submitDiv, #submitDiv + .text-center");
			const classificationRow = w.document.querySelector(".classification-row");
			const newSubmitDiv = w.document.createElement("div");
			newSubmitDiv.className = "col-xs-12 col-sm-6";
			submitDiv[0].style.marginTop = 16;
			newSubmitDiv.appendChild(submitDiv[0]);
			newSubmitDiv.appendChild(submitDiv[1]);
			classificationRow.insertAdjacentElement("afterend", newSubmitDiv);

            // add new button "Submit and reload", skipping "Your analysis has been recorded." dialog
            let submitButton = submitDiv[0].querySelector("button");
            submitButton.classList.add("btn", "btn-warning");
	        let submitAndNext = submitButton.cloneNode(false);
            submitAndNext.innerHTML = '<span class="glyphicon glyphicon-floppy-disk"></span>&nbsp;<span class="glyphicon glyphicon-forward"></span>';
            submitAndNext.title = "Submit and go to next review";
	        submitAndNext.addEventListener('click', exportFunction(() => {
		        exportFunction(function () {
			        window.location.assign("/recon");
		        }, ansController, {defineAs: "openSubmissionCompleteModal"});
	        }, w));
            // we have to inject the button to angular
            w.$injector.invoke(cloneInto(['$compile', ($compile) => {
	            let compiledSubmit = $compile(submitAndNext)(w.$scope(submitDiv[0]));
                submitDiv[0].querySelector("button").insertAdjacentElement("beforeBegin", compiledSubmit[0]);
            }], w, {cloneFunctions: true}));


			// adding text buttons
			const textButtons = [
				"<button id='photo' class='button btn btn-default textButton' data-tooltip='indicates a low quality photo'>Photo</button>",
				"<button id='private' class='button btn btn-default textButton' data-tooltip='located on private residential property'>Private</button>",
				"<button id='duplicate' class='button btn btn-default textButton' data-tooltip='duplicate of one you have previously reviewed'>Duplicate</button>",
				"<button id='school' class='button btn btn-default textButton' data-tooltip='located on school property'>School</button>",
				"<button id='person' class='button btn btn-default textButton' data-tooltip='photo contains 1 or more people'>Person</button>",
				"<button id='perm' class='button btn btn-default textButton' data-tooltip='seasonal or temporary display or item'>Temporary</button>",
				"<button id='location' class='button btn btn-default textButton' data-tooltip='location wrong'>Location</button>",
				"<button id='clear' class='button btn btn-default textButton' data-tooltip='clears the comment box'>Clear</button>"
			];

			newSubmitDiv.insertAdjacentHTML("beforeEnd", "<div class='center' style='text-align: center'>" + textButtons.join("") + "</div>");

			const textBox = w.document.querySelector("#submitDiv + .text-center > textarea");

			const buttons = w.document.getElementsByClassName("textButton");
			for (let b in buttons) {
				if (buttons.hasOwnProperty(b)) {
					buttons[b].addEventListener("click", exportFunction(function (event) {
						const source = event.target || event.srcElement;
						let text;
						switch (source.id) {
							case "photo":
								text = "Low quality photo";
								break;
							case "private":
								text = "Private residential property";
								break;
							case "duplicate":
								text = "Duplicate of previously reviewed portal candidate";
								break;
							case "school":
								text = "Located on primary or secondary school grounds";
								break;
							case "person":
								text = "Picture contains one or more people";
								break;
							case "perm":
								text = "Portal candidate is seasonal or temporary";
								break;
							case "location":
								text = "Portal candidate's location is not on object";
								break;
							case "clear":
								text = "";
								break;
						}

                        textBox.value = text;
                        textBox.dispatchEvent(new Event('change'));

					},w), false);
				}
			}

			// stats enhancements: adding processed by nia, percent processed, progress to next recon badge numbers
	        const lastPlayerStatLine = w.document.querySelector("#player_stats:not(.visible-xs) div");
			const stats = w.document.querySelector("#player_stats").children[2];

			const reviewed = parseInt(stats.children[3].children[2].innerText);
			const accepted = parseInt(stats.children[5].children[2].innerText);
			const rejected = parseInt(stats.children[7].children[2].innerText);

			const processed = accepted + rejected;
	        const percent = Math.round(processed / reviewed * 1000) / 10;

	        const reconBadge = { 100: "Bronze", 750: "Silver", 2500: "Gold", 5000: "Platin", 10000: "Black"};
	        let nextBadgeName, nextBadgeCount;

	        for(const key in reconBadge) {
		        if(processed <= key) {
			        nextBadgeCount = key;
			        nextBadgeName = reconBadge[key];
			        break;
		        }
	        }
	        const nextBadgeProcess = processed / nextBadgeCount * 100;

	        lastPlayerStatLine.insertAdjacentHTML("beforeEnd", '<br><p><span class="glyphicon glyphicon-info-sign ingress-gray pull-left"></span>' +
			        '<span style="margin-left: 5px;" class="ingress-mid-blue pull-left">Processed by NIA</span> <span class="gold pull-right">' + processed + ' (' + percent + '%) </span></p>');

	        lastPlayerStatLine.insertAdjacentHTML("beforeEnd",
			        `<br><div>Next recon badge tier: <b>`+nextBadgeName + ' (' + nextBadgeCount +')'+`</b><span class="pull-right"></span>
			        <div class="progress">
				        <div class="progress-bar progress-bar-warning" 
				        role="progressbar" 
				        aria-valuenow="`+ nextBadgeProcess +`" 
				        aria-valuemin="0" 
				        aria-valuemax="100" 
				        style="width: `+  Math.round(nextBadgeProcess) +`%;"
				        title="`+ (nextBadgeCount - processed) +` to go">
				            `+ Math.round(nextBadgeProcess) +`%
			        </div></div></div>`);

	        lastPlayerStatLine.insertAdjacentHTML("beforeEnd", '<p><input onFocus="this.select();" style="width: 99%;" type="text" ' +
	        		'value="'+reviewed+' / '+ (accepted + rejected ) + ' (' +accepted+  '/'+rejected+') / '+Math.round(percent)+'%"/></p>');

			// kill autoscroll
			ansController.goToLocation = null;

			// portal image zoom button with "=s0"
			w.document.querySelector("#AnswersController .ingress-background").insertAdjacentHTML("beforeBegin",
					"<div style='position:absolute;float:left;'><a class='button btn btn-default' style='display:inline-block;' href='" + subController.pageData.imageUrl + "=s0' target='fullimage'><span class='glyphicon glyphicon-search' aria-hidden='true'></span></div>");

			// Make photo filmstrip scrollable
			const filmstrip = w.document.getElementById("map-filmstrip");

			function scrollHorizontally(e) {
				e = window.event || e;
				const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
				filmstrip.scrollLeft -= (delta * 50); // Multiplied by 50
				e.preventDefault();
			}

			filmstrip.addEventListener("DOMMouseScroll", exportFunction(scrollHorizontally, w), false);
			filmstrip.addEventListener("mousewheel", exportFunction(scrollHorizontally, w), false);

			// Replace map markers with a nice circle
			for (let i = 0; i < subController.markers.length; ++i) {
				const marker = subController.markers[i];
				marker.setIcon(PORTAL_MARKER);
			}
			subController.map.setZoom(16);

			// Re-enabling scroll zoom
			subController.map.setOptions(cloneInto({scrollwheel: true}, w));

			// move portal rating to the right side
			const scorePanel = w.document.querySelector("div[class~='pull-right']");
			let nodesToMove = Array.from(w.document.querySelector("div[class='btn-group']").parentElement.children);
			nodesToMove = nodesToMove.splice(2, 6);
			nodesToMove.push(w.document.createElement("br"));
			for (let j = nodesToMove.length - 1; j >= 0; --j) {
				scorePanel.insertBefore(nodesToMove[j], scorePanel.firstChild);
			}

			// Bind click-event to Dup-Images-Filmstrip. result: a click to the detail-image the large version is loaded in another tab
			const imgDups = w.document.querySelectorAll("#map-filmstrip > ul > li > img");
			const clickListener = function () {
				w.open(this.src + "=s0", 'fulldupimage');
			};
			for (let imgSep in imgDups) {
				if (imgDups.hasOwnProperty(imgSep)) {
					imgDups[imgSep].addEventListener("click", function () {
						const imgDup = w.document.querySelector("#content > img");
						imgDup.removeEventListener("click", clickListener);
						imgDup.addEventListener("click", clickListener);
						imgDup.setAttribute("style", "cursor: pointer;");
					});
				}
			}

			// add translate buttons to title and description (if existing)
			const link = w.document.querySelector("#descriptionDiv a");
			const content = link.innerText.trim();
			let a = w.document.createElement("a");
			let span = w.document.createElement("span");
			span.className = "glyphicon glyphicon-book";
			span.innerHTML = " ";
			a.appendChild(span);
			a.className = "button btn btn-default pull-right";
			a.target = 'translate';
			a.style.padding = '0px 4px';
			a.href = "https://translate.google.com/#auto/en/" + content;
			link.insertAdjacentElement("afterend",a);

			const description = w.document.querySelector("#descriptionDiv").innerHTML.split("<br>")[3].trim();
			if (description !== '&lt;No description&gt;' && description !== '') {
				a = w.document.createElement('a');
				span = w.document.createElement("span");
				span.className = "glyphicon glyphicon-book";
				span.innerHTML = " ";
				a.appendChild(span);
				a.className = "button btn btn-default pull-right";
				a.target = 'translate';
				a.style.padding = '0px 4px';
				a.href = "https://translate.google.com/#auto/en/" + description;
				const br = w.document.querySelectorAll("#descriptionDiv br")[2];
				br.insertAdjacentElement("afterend",a);
			}

			// Automatically open the first listed possible duplicate
			try {
				const e = w.document.querySelector("#map-filmstrip > ul > li:nth-child(1) > img");
                if (e != null) {
                    setTimeout(function () {
                        e.click();
                    }, 500);
                }
			} catch (err) {}

			// expand automatically the "What is it?" filter text box
			try {
				const f = w.document.querySelector("#AnswersController > form > div:nth-child(5) > div > p > span.ingress-mid-blue.text-center");
				setTimeout(function () {
					f.click();
				}, 500);
			} catch (err) {}


			// keyboard navigation
			// keys 1-5 to vote
			// space/enter to confirm dialogs
			// esc or numpad "/" to reset selector
			// Numpad + - to navigate

			let currentSelectable = 0;
			let maxItems = 7;

            function highlight() {
                w.document.querySelectorAll('.btn-group').forEach(exportFunction((element) => { element.style.border = 'none'; }, w));
                if(currentSelectable <= maxItems-2) {
                    w.document.querySelectorAll('.btn-group')[currentSelectable+1].style.border = cloneInto('1px dashed #ebbc4a', w);
                    submitAndNext.blur();
					submitButton.blur();
				} else if (currentSelectable == 6) {
					submitAndNext.focus();
				}
				else if (currentSelectable == 7) {
					submitButton.focus();
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

				if(event.keyCode >= 49 && event.keyCode <= 53)
					numkey = event.keyCode - 48;
				else if(event.keyCode >= 97 && event.keyCode <= 101)
					numkey = event.keyCode - 96;
				else
					numkey = null;

				// do not do anything if a text area or a input with type text has focus
				if(w.document.querySelector("input[type=text]:focus") || w.document.querySelector("textarea:focus")) {
					return;
				}
				// "analyze next" button
				else if((event.keyCode === 13 ||event.keyCode === 32) && w.document.querySelector('a.button[href="/recon"]')) {
					w.document.location.href='/recon';
					event.preventDefault();
				} // submit low quality rating
				else if((event.keyCode === 13 ||event.keyCode === 32) && w.document.querySelector('[ng-click="answerCtrl2.confirmLowQuality()"]')) {
					w.document.querySelector('[ng-click="answerCtrl2.confirmLowQuality()"]').click();
					currentSelectable = 0;
					event.preventDefault();

                } // click first/selected duplicate (key D)
                else if((event.keyCode === 68) && w.document.querySelector('#content > button')) {
                    w.document.querySelector('#content > button').click();
                    currentSelectable = 0;
                    event.preventDefault();

                } // submit duplicate
                else if((event.keyCode === 13 ||event.keyCode === 32) && w.document.querySelector('[ng-click="answerCtrl2.confirmDuplicate()"]')) {
                    w.document.querySelector('[ng-click="answerCtrl2.confirmDuplicate()"]').click();
                    currentSelectable = 0;
                    event.preventDefault();

				} // submit normal rating
				else if((event.keyCode === 13 ||event.keyCode === 32) && currentSelectable === maxItems) {
					w.document.querySelector('[ng-click="answerCtrl.submitForm()"]').click();
					event.preventDefault();

				} // close duplicate dialog
				else if((event.keyCode === 27 || event.keyCode === 111) && w.document.querySelector('[ng-click="answerCtrl2.resetDuplicate()"]')) {
					w.document.querySelector('[ng-click="answerCtrl2.resetDuplicate()"]').click();
					currentSelectable = 0;
					event.preventDefault();

				} // close low quality ration dialog
				else if((event.keyCode === 27 || event.keyCode === 111) && w.document.querySelector('[ng-click="answerCtrl2.resetLowQuality()"]')) {
					w.document.querySelector('[ng-click="answerCtrl2.resetLowQuality()"]').click();
					currentSelectable = 0;
					event.preventDefault();
				}
				// return to first selection (should this be a portal)
				else if(event.keyCode === 27 || event.keyCode === 111) {
					currentSelectable = 0;
				}
				// select next rating
				else if((event.keyCode === 107 || event.keyCode === 9) && currentSelectable < maxItems) {
					currentSelectable++;
					event.preventDefault();
				}
				// select previous rating
				else if((event.keyCode === 109 || event.keyCode === 16 || event.keyCode === 8) && currentSelectable > 0) {
					currentSelectable--;
					event.preventDefault();

				}
				else if(numkey === null || currentSelectable >= maxItems) {
					return;
				}
				// rating 1-5
				else {
					w.document.querySelectorAll('.btn-group')[currentSelectable+1].querySelectorAll('button.button-star')[numkey-1].click();
					currentSelectable++;
				}
				highlight();
			});

            highlight();

        }

	}

}

setTimeout(function () {
    init();
}, 500);
