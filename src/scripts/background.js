/*

animation to spin the badge icon; based on the gmail checker
extension.

*/
var iconTool = {
    rotation: 0, frames: 48, speed: 15, canvas: null, context: null,

    // nice easing
    ease: function(x) {
	return (1-Math.sin(Math.PI/2+x*Math.PI))/2;
    },

    // update for the next frame and call to redraw
    next: function() {
	this.rotation += 1/this.frames;
	this.draw();
	if (this.rotation <= 1) {
	    setTimeout("iconTool.next()", this.speed);
	} else {
	    this.rotation = 0;
	    this.draw();
	}
    },

    // draw the current frame
    draw: function() {
	var ceil = Math.ceil;
	var width = this.canvas.width;
	var height = this.canvas.height;
	var context = this.context;
	context.save();
	context.clearRect(0, 0, width, height);
	context.translate(ceil(width/2), ceil(height/2));
	context.rotate(2*Math.PI*this.ease(this.rotation));
	context.drawImage(this.icon, -ceil(width/2), -ceil(height/2));
	context.restore();
	chrome.browserAction.setIcon(
	    {imageData: context.getImageData(0, 0, width, height)}
	);
    },

    enabled: function(v) {
	var ico = v ? "images/icon.png" : "images/icon_disabled.png";
	chrome.browserAction.setIcon({path:ico});
    },
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

    // begin a new xhr request for the backpack feed
    start: function() {
	var self = feedDriver;
	var url = self.url();
	if (!url) {
	    self.onError();
	    return;
	}

	var req = new XMLHttpRequest();
	var abort = function() {
	    console.log('xhr request aborted');
	    req.abort();
	}
	var timeoutId  = self.timeoutId = window.setTimeout(abort, self.timeout);
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
	iconTool.enabled(true);
        textTool.stop();
	var count = hatCount + nonCount
	if (count != this.lastCount) {
	    this.lastCount = count;
	    iconTool.next();
	    count = count.toString();
	    count = count ? count : "0";
	    chrome.browserAction.setBadgeText({text:count == "0" ? "" : count});
	    chrome.browserAction.setBadgeBackgroundColor(
                {color:hatCount > 0 ? colors.blue : colors.green}
	    );
        }
	storage.cachedFeed(this.lastText);
	this.schedule();
	console.log("checked");
    },

    onError: function(e) {
	this.failures++;
	window.clearTimeout(this.timeoutId);
        textTool.stop();
        // showLoggedOut()
        this.schedule();
    }
};


var textTool = {
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
	iconTool.enabled(false);
	if (!storage.profileId()) {
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
    iconTool.canvas = document.getElementById("canvas");
    iconTool.context = iconTool.canvas.getContext("2d");
    iconTool.icon = document.getElementById("tf2icon");
    textTool.start();
    feedDriver.start();
    console.log("backgroundInit(10)");
}
