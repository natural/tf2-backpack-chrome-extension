/*


*/
var spinAnimation = {
    rotation: 0, frames: 48, speed: 15, canvas: null, context: null,

    // nice
    ease: function(x) {
	return (1-Math.sin(Math.PI/2+x*Math.PI))/2;
    },

    // update for the next frame and call to redraw
    next: function() {
	this.rotation += 1/this.frames;
	this.draw();
	if (this.rotation <= 1) {
	    setTimeout("spinAnimation.next()", this.speed);
	} else {
	    this.rotation = 0;
	    this.draw();
	}
    },

    // draw the current frame
    draw: function() {
	var ceil = Math.ceil;
	var w = this.canvas.width;
	var h = this.canvas.height;
	var context = this.context;
	context.save();
	context.clearRect(0, 0, w, h);
	context.translate(ceil(w/2), ceil(h/2));
	context.rotate(2*Math.PI*this.ease(this.rotation));
	context.drawImage(this.icon, -ceil(w/2), -ceil(h/2));
	context.restore();
	chrome.browserAction.setIcon({imageData:context.getImageData(0, 0, w,h)});
    }
};


/*

*/
var feedDriver = {
    failures: 0, timeout: 1000*5, pollMin: 1000*60, pollMax: 1000*60*5,
    lastCount: 0, url: getXmlUrl, timeoutId:null, hatCount:0, nonCount:0,
    lastText:null, lastXml:null,

    // pause and then fetch
    schedule: function () {
	var rnd = Math.random() * 2;
	var exp = Math.pow(2, this.failures);
	var delay = Math.round(Math.min(rnd * this.pollMin * exp, this.pollMax));
	window.setTimeout(this.start, delay);
    },

    // move this into onSuccess
    update: function(count, color) {
	if (count != this.lastCount) {
	    this.lastCount = count;
	    spinAnimation.next();
	    count = count.toString();
	    count = count ? count : "0";
	    chrome.browserAction.setBadgeText({text:count == "0" ? "" : count});
	    chrome.browserAction.setBadgeBackgroundColor(
                {color:color == null ? colors.blue : color}
	    );
        }
    },

    // begin a new xhr request for the backpack feed
    start: function() {
	var url = this.url();
	if (!url) {
	    self.onError();
	    return;
	}
	var self = this;
	var req = new XMLHttpRequest();
	var abort = function() {
	    console.log('xhr request aborted');
	    req.abort();
	}
	var timeoutId  = this.timeoutId = window.setTimeout(abort, this.timeout);
	try {
	    req.onerror = self.onError;
	    req.onreadystatechange = function() {
		if (req.readyState == 4) {
		    console.log("xhr request ready");
		    var xml = req.responseXML;
		    if (xml) {
			self.lastXml = xml;
			self.lastText = req.responseText;
			self.onSuccess();
			return;
		    }
		    self.onError();
		}
	    }
	    req.open("GET", url, true);
	    req.send(null);
	} catch(e) {
	    console.error(e);
	    self.onError();
	}
    },

    onSuccess: function() {
	this.failures = 0;
	window.clearTimeout(this.timeoutId);
	var xml = this.lastXml;
	var hatCount = parseInt($("totalJustFound hats", xml).text());
	var nonCount = parseInt($("totalJustFound nonHats", xml).text());
	hatCount = hatCount ? hatCount : 0;
	nonCount = nonCount ? nonCount : 0;
	this.hatCount = hatCount;
	this.nonCount = nonCount;
	setEnabledIcon();
        loadingAnimation.stop();

	// move update into this func.
        this.update(nonCount + hatCount, hatCount > 0 ? colors.green : null);
	setCachedXml(this.lastText);
	this.schedule();
	console.log("checked");
    },

    onError: function(e) {
	this.failures++;
	window.clearTimeout(this.timeoutId);
        loadingAnimation.stop();
        // showLoggedOut()
        this.schedule();
    }
};


var loadingAnimation = {
    timerId: 0, maxCount: 6, current: 0, maxDot: 3,

    draw: function() {
	var text = "";
	for (var i = 0; i < this.maxDot; i++) {
	    text += (i == this.current) ? "." : " ";
	}
	if (this.current >= this.maxDot) {
	    text += "";
	}
	chrome.browserAction.setBadgeText({text:text})
	if (++this.current == this.maxCount) {
	    this.current = 0
	};
    },

    start: function() {
	setDisabledIcon();
	if (!getProfileId()) {
	    return
	}
	if (!this.timerId) {
	    var ani = this;
	    this.timerId = window.setInterval(function() { ani.draw() }, 100);
	}
    },

    stop: function() {
	if (this.timerId) {
	    window.clearInterval(this.timerId)
	    this.timerId = 0;
	}
    },
};


function backgroundInit() {
    spinAnimation.canvas = document.getElementById("canvas");
    spinAnimation.context = spinAnimation.canvas.getContext("2d");
    spinAnimation.icon = document.getElementById("tf2icon");
    loadingAnimation.start();
    feedDriver.start();
    console.log("backgroundInit(10)");
}
