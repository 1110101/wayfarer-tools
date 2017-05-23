// ==UserScript==
// @name         OPR tools
// @namespace    https://opr.ingress.com/recon
// @version      0.9
// @description  Added links to Intel and OSM and disabled autoscroll.
// @author       1110101
// @match        https://opr.ingress.com/recon
// @grant        unsafeWindow
// @downloadURL  https://gitlab.com/1110101/opr-tools/raw/master/opr-tools.user.js

// ==/UserScript==

// source https://gitlab.com/1110101/opr-tools
// merge-requests welcome

/*
MIT License

Copyright (c) 2017 1110101

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

var PORTAL_MARKER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuOWwzfk4AAADlSURBVDhPY/j//z8CTw3U/V8lcvx/MfPX/2Xcd//XyWwDYxAbJAaS63c2Q9aD0NygUPS/hPXt/3bD5f93LI7DwFvnJILlSlg//K+XrUc1AKS5jOvx/wU55Vg1I2OQmlKOpzBDIM4G2UyMZhgGqQW5BOgdBrC/cDkbHwbpAeplAAcONgWEMChMgHoZwCGMTQExGKiXARxN2CSJwUC9VDCAYi9QHIhVQicpi0ZQ2gYlCrITEigpg5IlqUm5VrILkRdghoBMxeUd5MwE1YxqAAiDvAMKE1DAgmIHFMUgDGKDxDCy838GAPWFoAEBs2EvAAAAAElFTkSuQmCC';

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

function init() {
    var w = typeof unsafeWindow == 'undefined' ? window : unsafeWindow;
    var tryNumber = 20,
        initWatcher = setInterval(function() {
            if (w.angular || !tryNumber) {
                if (w.angular) {
                    try {
                        initAngular();
                        initScript();

                        clearInterval(initWatcher);
                    }
                    catch(error) {
                        // todo repeat
                        console.log(error);
                    }
                }
            }
            tryNumber--;
        }, 500);

    function initAngular() {
        var el = w.document.querySelector('[ng-app="portalApp"]');
        w.$app = w.angular.element(el);
        w.$injector = w.$app.injector();
        w.$get = w.$injector.get;
        w.$rootScope = w.$app.scope();
        w.$scope = function(element) {
            return w.angular.element(element).scope();
        };
        w.checkDigest = function() {
            console.time('$digest');
            $rootScope.$digest();
            console.timeEnd('$digest');
        };
    }
    function initScript() {
        var desc = document.getElementById("descriptionDiv");
        var scope = w.$scope(desc);
        var watchAdded = false;

        // run on init
        modifyPage();

        if(!watchAdded) {
            // re-run on data change
            scope.$watch("subCtrl.pageData", function() {
                modifyPage();
            });
        }

        function modifyPage() {

            var ansController = w.$scope(desc).answerCtrl;
            var subController = w.$scope(desc).subCtrl;
            var data = subController.pageData;

            var mapButtons = [];
            var mapDropdown = [];

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
`);

            // adding map buttons
            mapButtons.push("<a class='button btn btn-default' target='_blank' href='https://www.ingress.com/intel?ll=" + data.lat + "," + data.lng +  "&z=17'>Intel</a>");
            mapButtons.push("<a class='button btn btn-default' target='_blank' href='https://www.openstreetmap.org/?mlat=" + data.lat + "&mlon=" + data.lng +  "&zoom=16'>OSM</a>");
            mapButtons.push("<a class='button btn btn-default' target='_blank' href='https://bing.com/maps/default.aspx?cp=" + data.lat + "~" + data.lng +  "&lvl=16&style=a'>bing</a>");

            // more buttons in a dropdown menu
            mapDropdown.push("<li><a target='_blank' href='https://wego.here.com/?map=" + data.lat + "," + data.lng + ",17,satellite'>HERE maps</a></li>");

            mapDropdown.push("<li role='separator' class='divider'></li>");

            // national maps
            mapDropdown.push("<li><a target='_blank' href='http://map.geo.admin.ch/?swisssearch=" + data.lat + "," + data.lng + "'>CH - Swiss Geo Map</a></li>");
            mapDropdown.push("<li><a target='_blank' href='http://maps.kompass.de/#lat=" + data.lat + "&lon=" + data.lng + "&z=17'>DE - Kompass.maps</a></li>");
            mapDropdown.push("<li><a target='_blank' href='https://geoportal.bayern.de/bayernatlas/index.html?X=" + data.lat + "&Y=" + data.lng +  "&zoom=14&lang=de&bgLayer=luftbild&topic=ba&catalogNodes=122'>DE - BayernAtlas</a></li>");


            desc.insertAdjacentHTML("beforeEnd", "<div><div class='btn-group'>" + mapButtons.join('') +
                                    '<div class="button btn btn-primary dropdown"><span class="caret"></span><ul class="dropdown-content dropdown-menu">' + mapDropdown.join('') + "</div></div>");

            // kill autoscroll
            ansController.goToLocation = null;

            // portal image zoom button with "=s0"
            document.querySelector("#AnswersController .ingress-background").insertAdjacentHTML("beforeBegin",
                                                                                                '<div style="position:absolute;float:left;"><a class="button btn btn-default" style="display:inline-block;" href="' + subController.pageData.imageUrl+ '=s0" target="_blank"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></div>');

            // skip blabla dialog and go directly to next review
            // need some magic here because firefox.
            // exportFunction(function() {
            //     window.location.assign("/recon");
            // }, ansController, {defineAs: "openSubmissionCompleteModal"});

            // Make photo filmstrip scrollable
            var filmstrip = document.getElementById('map-filmstrip');
            function scrollHorizontally(e) {
                e = window.event || e;
                var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                filmstrip.scrollLeft -= (delta*50); // Multiplied by 50
                e.preventDefault();
            }
            filmstrip.addEventListener("mousewheel", scrollHorizontally, false);

            // Replace map markers with a nice circle
            for (var i = 0; i < subController.markers.length; ++i) {
                var marker = subController.markers[i];
                marker.setIcon(PORTAL_MARKER);
            }
            subController.map.setZoom(16);

            watchAdded = true;

        }
    }
}

setTimeout(function() {
    if(document.querySelector('[src*="all-min"]')) {
        init();
    }
}, 500);
