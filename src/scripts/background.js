/*

animation to spin the badge icon; based on the gmail checker
extension.

*/
var iconTool = {
    canvas: null,
    context: null,
    frames: 48,
    rotation: 0,
    speed: 15,

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

    // show the enabled or disabled icon
    enabled: function(v) {
	chrome.browserAction.setIcon(
            {path:v ? "images/icon.png" : "images/icon_disabled.png"}
        );
    },
};


/*

encapsulates feed checking and scheduling those checks.

*/
var feedDriver = {
    countHats: 0,
    countNotHats: 0,
    countTotal: 0,
    pollMax: 1000*60*5,
    pollMin: 1000*60,
    pollNext: 0,
    requestBackoff: 0,
    requestError: null,
    requestFails: 0,
    requestOkays: 0,
    timeoutId: null,
    timeoutMin: 1000*10,

    toJSON: function() {
	var r = {};
	for (var k in feedDriver) {
	    var v = feedDriver[k];
	    if (typeof(v) != "function") {
		r[k] = v;
	    }
	}
	return r;
    },

    // schedule an xhr request to happen after a delay
    schedule: function(delay) {
	if (typeof(delay) == "undefined") {
	    var rnd = Math.random() * 2;
	    var exp = Math.pow(2, this.requestBackoff);
	    delay = Math.round(Math.max(this.pollMin, Math.min(rnd * this.pollMin * exp, this.pollMax)));
	}
	this.pollNext = Date.now() + delay;
	window.setTimeout(this.start, delay);
	console.log("Scheduled fetch in", delay/1000, "sec.")
    },

    // begin a new xhr request for the backpack feed
    start: function() {
	var self = feedDriver, url = urls.profile(), req = new XMLHttpRequest();
	if (!url) {
	    self.onError();
	    return;
	}
	req.onerror = self.onError;
	self.timeoutId = window.setTimeout(
	    function() {req.abort(); self.onAbort()}, self.timeoutMin
	);
	try {
	    req.onreadystatechange = function() {
		if (req.readyState != 4) {
		    return;
		}
		if (req.responseXML) {
		    self.onSuccess(req.responseXML, req.responseText);
		} else {
		    self.onError(Error("no xml"));
		}
	    }
	    req.open("GET", url);
	    req.send();
	} catch(e) {
	    self.onError(e);
	}
    },

    // request aborted
    onAbort: function() {
	this.requestFails++;
	this.requestBackoff++;
	console.warn("XHR abort");
    },

    // request successful; xml present but not yet checked
    onSuccess: function(xml, text) {
	window.clearTimeout(this.timeoutId);
	this.requestOkays++;
	this.requestBackoff = 0;
	var error = $("error", xml).text()
	if (error) {
	    iconTool.enabled(false);
	    textTool.stop("?", colors.grey);
	    this.requestError = error;
	    console.error("XHR success with feed error:", error);
	} else {
	    iconTool.enabled(true);
	    storage.cachedFeed(text);
	    this.updateCounts(xml);
	    this.requestError = "";
	    console.log("XHR success");
	}
	this.schedule();
    },

    onError: function(e) {
	this.requestFails++;
	this.requestBackoff++;
	window.clearTimeout(this.timeoutId);
        textTool.stop("?", colors.grey);
        this.schedule();
	console.error("XHR error", e || "");
    },

    updateCounts: function(xml) {
	var lastTotal = this.countTotal;
	this.countHats = textNodeInt("totalJustFound hats", xml);
	this.countNotHats = textNodeInt("totalJustFound nonHats", xml);
	this.countTotal = this.countHats + this.countNotHats;
	if (lastTotal != this.countTotal) {
	    if (this.countTotal) {
		iconTool.next();
	    }
	}
	textTool.stop(
	    this.countTotal ? this.countTotal.toString() : "",
	    this.countHats > 0 ? colors.green : colors.blue
       );
    },


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

    start: function(color) {
	if (!storage.profileId()) {
	    return
	}
	if (typeof(color) == "object") {
	    chrome.browserAction.setBadgeBackgroundColor({color: color});
	}
	if (!this.timerId) {
	    var ani = this;
	    this.timerId = window.setInterval(function() { ani.draw() }, 100);
	}
    },

    stop: function(text, color) {
	if (this.timerId) {
	    window.clearInterval(this.timerId)
	    this.timerId = 0;
	}
	this.set(text, color);
    },

    set: function(text, color) {
	if (typeof(text) == "string") {
	    chrome.browserAction.setBadgeText({text: text});
	}
	if (typeof(color) == "object") {
	    chrome.browserAction.setBadgeBackgroundColor({color: color});
	}
    }
};


function backgroundInit() {
    iconTool.canvas = document.getElementById("canvas");
    iconTool.context = iconTool.canvas.getContext("2d");
    iconTool.icon = document.getElementById("tf2icon");

    iconTool.enabled(false);
    textTool.start(colors.grey);

    feedDriver.start();
    console.log("backgroundInit(10)");

    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.type == "feedParams") {
	    sendResponse(feedDriver.toJSON());
	} else {
	    sendResponse({});
	}
    });

}
