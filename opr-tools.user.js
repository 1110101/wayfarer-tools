// ==UserScript==
// @name         OPR tools
// @namespace    https://opr.ingress.com/recon
// @version      0.9.10
// @description  Added links to Intel and OSM and disabled autoscroll.
// @author       1110101, tehstone, Hedger, Deep-thot
// @match        https://opr.ingress.com/recon
// @grant        unsafeWindow
// @downloadURL  https://gitlab.com/1110101/opr-tools/raw/master/opr-tools.user.js

// ==/UserScript==

// source https://gitlab.com/1110101/opr-tools
// merge-requests welcome

/*
MIT License

Copyright (c) 2017 1110101, tehstone, Hedger, Deep-thot

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

var PORTAL_MARKER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuOWwzfk4AAADlSURBVDhPY/j//z8CTw3U/V8lcvx/MfPX/2Xcd//XyWwDYxAbJAaS63c2Q9aD0NygUPS/hPXt/3bD5f93LI7DwFvnJILlSlg//K+XrUc1AKS5jOvx/wU55Vg1I2OQmlKOpzBDIM4G2UyMZhgGqQW5BOgdBrC/cDkbHwbpAeplAAcONgWEMChMgHoZwCGMTQExGKiXARxN2CSJwUC9VDCAYi9QHIhVQicpi0ZQ2gYlCrITEigpg5IlqUm5VrILkRdghoBMxeUd5MwE1YxqAAiDvAMKE1DAgmIHFMUgDGKDxDCy838GAPWFoAEBs2EvAAAAAElFTkSuQmCC";
function addGlobalStyle(css) {
	var head, style;
	head = document.getElementsByTagName("head")[0];
	if (!head) { return; }
	style = document.createElement("style");
	style.type = "text/css";
	style.innerHTML = css;
	head.appendChild(style);
}

function init() {
	var w = typeof unsafeWindow == "undefined" ? window : unsafeWindow;
	var tryNumber   = 5,
	    initWatcher = setInterval(function () {
		    if (tryNumber === 0) {
			    clearInterval(initWatcher);
			    w.document.getElementById("NewSubmissionController").insertAdjacentHTML("afterBegin", `
<div class='alert alert-danger'><strong><span class='glyphicon glyphicon-remove'></span> OPR tools initialization failed,</strong> check developer console for error details</div>
`);
			    return;
		    }
		    if (w.angular) {
			    var err = false;
			    try {
				    initAngular();
				    clearInterval(initWatcher);
			    }
			    catch (error) {
				    err = error;
				    console.log(error);
			    }
			    if (!err) {
				    try {
					    initScript();
				    } catch (error) {
					    console.log(error);
				    }
			    }
		    }
		    tryNumber--;
	    }, 500);

	function initAngular() {
		var el = w.document.querySelector("[ng-app='portalApp']");
		w.$app = w.angular.element(el);
		w.$injector = w.$app.injector();
		w.$rootScope = w.$app.scope();

		w.$scope = function (element) {
			return w.angular.element(element).scope();
		};
	}

	function initScript() {
		var desc = document.getElementById("descriptionDiv");
		var box = w.document.querySelector("#AnswersController > form");

		var stats = w.document.getElementById("player_stats").children[2];
		var scope = w.$scope(desc);
		var watchAdded = false;

		// run on init
		modifyPage();

		if (!watchAdded) {
			// re-run on data change
			scope.$watch("subCtrl.pageData", function () {
				modifyPage();
			});
		}

		function modifyPage() {

			var ansController = w.$scope(desc).answerCtrl;
			var subController = w.$scope(desc).subCtrl;
			var data = subController.pageData;

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
			var mapButtons = [
				"<a class='button btn btn-default' target='_blank' href='https://www.ingress.com/intel?ll=" + data.lat + "," + data.lng + "&z=17'>Intel</a>",
				"<a class='button btn btn-default' target='_blank' href='https://www.openstreetmap.org/?mlat=" + data.lat + "&mlon=" + data.lng + "&zoom=16'>OSM</a>",
				"<a class='button btn btn-default' target='_blank' href='https://bing.com/maps/default.aspx?cp=" + data.lat + "~" + data.lng + "&lvl=16&style=a'>bing</a>"
			];

			// more map buttons in a dropdown menu
			var mapDropdown = [
				"<li><a target='_blank' href='https://wego.here.com/?map=" + data.lat + "," + data.lng + ",17,satellite'>HERE maps</a></li>",
				"<li><a target='_blank' href='http://wikimapia.org/#lat=" + data.lat + "&lon=" + data.lng + "&z=16'>Wikimapia</a></li>",

				"<li role='separator' class='divider'></li>",

				// national maps
				"<li><a target='_blank' href='http://map.geo.admin.ch/?swisssearch=" + data.lat + "," + data.lng + "'>CH - Swiss Geo Map</a></li>",
				"<li><a target='_blank' href='http://maps.kompass.de/#lat=" + data.lat + "&lon=" + data.lng + "&z=17'>DE - Kompass.maps</a></li>",
				"<li><a target='_blank' href='https://geoportal.bayern.de/bayernatlas/index.html?X=" + data.lat + "&Y=" + data.lng + "&zoom=14&lang=de&bgLayer=luftbild&topic=ba&catalogNodes=122'>DE - BayernAtlas</a></li>",
				"<li><a target='_blank' href='https://www.hitta.se/kartan!~" + data.lat + "," + data.lng + ",18z/tileLayer!l=1'>SE - Hitta.se</a></li>",
				"<li><a target='_blank' href='https://maps.yandex.ru/?text=" + data.lat + "," + data.lng + "'>RU - Yandex</a></li>",
				"<li><a target='_blank' href='https://kartor.eniro.se/?c=" + data.lat + "," + data.lng + "&z=17&l=nautical'>SE - Eniro Sjökort</a></li>"
			];

			desc.insertAdjacentHTML("beforeEnd", "<div><div class='btn-group'>" + mapButtons.join("") +
					"<div class='button btn btn-primary dropdown'><span class='caret'></span><ul class='dropdown-content dropdown-menu'>" + mapDropdown.join("") + "</div></div>");


			// adding text buttons
			var textButtons = [
				"<button id='photo' class='button btn btn-default textButton' data-tooltip='indicates a low quality photo'>Photo</button>",
				"<button id='private' class='button btn btn-default textButton' data-tooltip='located on private residential property'>Private</button>",
				"<button id='duplicate' class='button btn btn-default textButton' data-tooltip='duplicate of one you have previously reviewed'>Duplicate</button>",
				"<button id='school' class='button btn btn-default textButton' data-tooltip=' located on school property'>School</button>",
				"<button id='person' class='button btn btn-default textButton' data-tooltip='photo contains 1 or more people'>Person</button>",
				"<button id='perm' class='button btn btn-default textButton' data-tooltip='seasonal or temporary display or item'>Temporary</button>",
				"<button id='clear' class='button btn btn-default textButton' data-tooltip='clears the comment box'>Clear</button>"
			];

			box.insertAdjacentHTML("beforeEnd", "<div class='center' style='text-align: center'>" + textButtons.join("") + "</div>");

			var textBox = w.document.querySelector("#AnswersController > form > .text-center > textarea");

			var buttons = w.document.getElementsByClassName("textButton");
			for (var b in buttons) {
				if (buttons.hasOwnProperty(b)) {
					buttons[b].addEventListener("click", function () {
						var source = event.target || event.srcElement;
						switch (source.id) {
							case "photo":
								text = "low quality photo";
								break;
							case "private":
								text = "private residential property";
								break;
							case "duplicate":
								text = "duplicate of previously reviewed portal candidate";
								break;
							case "school":
								text = "located on primary or secondary school grounds";
								break;
							case "person":
								text = "picture contains one or more people";
								break;
							case "perm":
								text = "portal candidate is seasonal or temporary";
								break;
							case "clear":
								text = "";
								break;
						}
						textBox.innerText = text;

					}, false);
					buttons[b].onmouseover = function () {
						w.document.getElementById("popup").style.display = "block";
					};
					buttons[b].onmouseout = function () {
						w.document.getElementById("popup").style.display = "none";

					};
				}
			}

			// adding percent procressed number
			var reviewed = parseInt(stats.children[3].children[2].outerText);
			var accepted = parseInt(stats.children[5].children[2].outerText);
			var rejected = parseInt(stats.children[7].children[2].outerText);

			var percent = (accepted + rejected) / reviewed;
			percent = Math.round(percent * 1000) / 10;
			box.insertAdjacentHTML("beforeEnd", "<div class='text-center'><p class='ingress-mid-blue pull-center'>Percent Processed:</p><p class='gold pull-center'>" + percent + "%</p></div>");

			// kill autoscroll
			ansController.goToLocation = null;

			// portal image zoom button with "=s0"
			w.document.querySelector("#AnswersController .ingress-background").insertAdjacentHTML("beforeBegin",
					"<div style='position:absolute;float:left;'><a class='button btn btn-default' style='display:inline-block;' href='" + subController.pageData.imageUrl + "=s0' target='_blank'><span class='glyphicon glyphicon-search' aria-hidden='true'></span></div>");

			// skip "Your analysis has been recorded." dialog and go directly to next review
			exportFunction(function () {
				window.location.assign("/recon");
			}, ansController, {defineAs: "openSubmissionCompleteModal"});

			// Make photo filmstrip scrollable
			var filmstrip = w.document.getElementById("map-filmstrip");

			function scrollHorizontally(e) {
				e = window.event || e;
				var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
				filmstrip.scrollLeft -= (delta * 50); // Multiplied by 50
				e.preventDefault();
			}

			filmstrip.addEventListener("DOMMouseScroll", scrollHorizontally, false);
			filmstrip.addEventListener("mousewheel", scrollHorizontally, false);

			// Replace map markers with a nice circle
			for (var i = 0; i < subController.markers.length; ++i) {
				var marker = subController.markers[i];
				marker.setIcon(PORTAL_MARKER);
			}
			subController.map.setZoom(16);

			// Re-enabling scroll zoom
			subController.map.setOptions(cloneInto({scrollwheel: true}, w));

			// HACKY way to move portal rating to the right side
			var scorePanel = w.document.querySelector("div[class~='pull-right']");
			var nodesToMove = Array.from(w.document.querySelector("div[class='btn-group']").parentElement.children);
			nodesToMove = nodesToMove.splice(2, 6);
			nodesToMove.push(w.document.createElement("br"));
			for (var j = nodesToMove.length - 1; j >= 0; --j) {
				scorePanel.insertBefore(nodesToMove[j], scorePanel.firstChild);
			}

			// Bind click-event to Dup-Images-Filmstrip. result: a click to the detail-image the large version is loaded in another tab
            var imgDups = w.document.querySelectorAll("#map-filmstrip > ul > li > img");
            var clickListener = function () {
                w.open(this.src + '=s0', '_blank');
            };
            for (var imgSep in imgDups) {
                if (imgDups.hasOwnProperty(imgSep)) {
                    imgDups[imgSep].addEventListener("click", function () {
                        var imgDup = w.document.querySelector('#content > img');
                        imgDup.removeEventListener("click", clickListener);
                        imgDup.addEventListener("click", clickListener);
                        imgDup.setAttribute("style", "cursor: pointer;");
                    });
                }
            }

			// Automatically open the first listed possible duplicate
			try {
				var e = w.document.querySelector("#map-filmstrip > ul > li:nth-child(1) > img");
				setTimeout(function () {
					e.click();
				}, 500);
			} catch (err) {}

			// expand automatically the "What is it?" filter text box
			try {
				var f = w.document.querySelector("#AnswersController > form > div:nth-child(5) > div > p > span.ingress-mid-blue.text-center");
				setTimeout(function () {
					f.click();
				}, 500);
			} catch (err) {}

			watchAdded = true;
		}

	}

}

setTimeout(function () {
	if (document.querySelector("[src*='all-min']")) {
		init();
	}
}, 500);
