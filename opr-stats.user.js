// ==UserScript==
// @name         OPR stats
// @version      0.1.4
// @description  save OPR statistics in local browser storage
// @author       https://gitlab.com/fotofreund0815
// @match        https://opr.ingress.com/
// @grant        none
// @downloadURL  https://gitlab.com/fotofreund0815/opr-tools/raw/release/opr-stats.user.js
// @updateURL    https://gitlab.com/fotofreund0815/opr-tools/raw/release/opr-stats.user.js
// ==/UserScript==

(function () {
	let body = document.getElementsByTagName('body')[0];
	let section = document.getElementsByTagName('section')[0];

    // get Values from localStorage
	let oprtstats = JSON.parse(localStorage.getItem('oprtstats')) || [];

	section.insertAdjacentHTML("beforeEnd", '<div><button class="button" id="oprt-stats">show my stats</button></div>');

	document.getElementById('oprt-stats').addEventListener('click', function(){
		body.innerHTML = null;
        for (var i = 0; i < oprtstats.length;i++) {
            body.insertAdjacentHTML("beforeEnd", YMDfromTime(oprtstats[i].datum) + ';' + oprtstats[i].reviewed + ';' + oprtstats[i].accepted + ';' + oprtstats[i].rejected + '<br/>');
        }
	});

	// nur tun, wenn heute noch nicht und Stunde > 3
	let jetzt = new Date();
	let heute = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() );

	if (oprtstats.length > 0) {
		last = oprtstats[oprtstats.length-1].datum;
	} else {
		last = 0;
	}

	let stunde = jetzt.getHours();

	console.log(jetzt.getTime() + ' # ' + heute.getTime() + ' # ' + last);

	if ((heute > last) && (stunde > 2)) {

		console.log('saving stats');

		const stats = document.querySelector("#player_stats").children[2];
		const reviewed = parseInt(stats.children[3].children[2].innerText);
		const accepted = parseInt(stats.children[5].children[2].innerText);
		const rejected = parseInt(stats.children[7].children[2].innerText);

	    let ut = jetzt.getTime();

	    let curstats = {'datum':ut,'reviewed':reviewed,'accepted':accepted,'rejected':rejected};
	    oprtstats.push(curstats);

	    let jsonstats = JSON.stringify(oprtstats);
	    localStorage.setItem('oprtstats',jsonstats);

	} else {
		console.log('stats already saved today');
	}

    for (var i = 0; i < oprtstats.length;i++) {
       ymd = YMDfromTime(oprtstats[i].datum);
       let prozent = 100*(oprtstats[i].accepted + oprtstats[i].rejected)/ oprtstats[i].reviewed;
       section.insertAdjacentHTML("beforeEnd", ymd +':  ' + oprtstats[i].reviewed + ' / ' + oprtstats[i].accepted + ' / ' + oprtstats[i].rejected + ' - ' + prozent.toFixed(2) + '% <br>');
    }


    function YMDfromTime(time){
    	let curdate = new Date();
    	curdate.setTime(time);

        let Jahr  = curdate.getFullYear(),
            Monat = curdate.getMonth() + 1,
            Tag   = curdate.getDate();
        let ymd = (Jahr*10000) + (Monat*100) + Tag;

        return ymd;
    }

})();
