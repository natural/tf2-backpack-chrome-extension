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

    init: function() {
	this.canvas = $("#canvas")[0];
	this.icon = $("#icon")[0];
	this.context = this.canvas.getContext("2d");
	this.enabled(false);
    },

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
            {path:v ? "media/icon.png" : "media/icon_disabled.png"}
        );
    },
};


/*

encapsulates feed checking and the scheduling of those checks.

*/
var feedDriver = {
    countHats: 0,
    countNotHats: 0,
    countTotal: 0,
    pollDuration: 0,
    pollLast: 0,
    pollNext: 0,
    requestBackoff: 0,
    requestError: null,
    requestFails: 0,
    requestOkays: 0,
    scheduleId: null,
    timeoutMin: 1000*10,

    init: function() {
	chrome.extension.onRequest.addListener(this.listen);
	this.start();
    },

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
	    delay = Math.min(storage.pollMax(), rnd * storage.pollMin() * exp);
	    delay = Math.max(storage.pollMin(), delay);
	}
	delay = Math.round(delay)
	this.pollNext = Date.now() + delay;
	window.clearTimeout(this.scheduleId);
	this.scheduleId = window.setTimeout(this.start, delay);
    },

    // begin a new xhr request for the backpack feed
    start: function() {
	var self = feedDriver, url = profile.feedUrl();
	if (!url) {
	    self.onError("error", _("feed_url_error"));
	    return;
	}
	var error = function(req, status, error) {
	    switch (status) {
	        case "timeout":
		    self.onError("abort", _("request_aborted"));
		    break;
                case "parseerror":
		    self.onError("error", _("parse_error"));
		    break;
	        case "feederror":
		    self.onError("error", _(error));
		    break;
	        case "feedwarning":
		    self.onError("warning", _(error));
		    break;
	        default: /* covers "error" and null values, and everything else, too */
		    self.onError("error", _("network_error"));
	    }
	};
	var success = function(xml, status, req) {
	    try {
		var errmsg = $("error", xml).text();
		var warnmsg = $("warningMessage", xml).text();
		if (errmsg) {
		    error(null, "feederror", _(errmsg));
	        } else if (warnmsg) {
		    error(null, "feedwarning", _(warnmsg));
		} else {
		    self.onSuccess(xml, req.responseText);
		}
	    } catch (e) {
		error(null, "exception", _(e));
	    }
	};
	self.pollDuration = 0;
	$.ajax({url: url, async: true, dataType: "xml", error: error,
		success: success, timeout: self.timeoutMin, });
    },

    onCommon: function() {
        this.pollLast = Date.now();
	this.pollDuration = this.pollNext==0 ? 0 : this.pollLast - this.pollNext;
	this.schedule();
    },

    // request errored
    onError: function(status, message) {
	this.onCommon();
	this.requestFails++;
	this.requestBackoff++;
	this.requestError = message;
	iconTool.enabled(false);
        textTool.stop("?", colors.grey);
	chrome.extension.sendRequest({status: status, type: "refresh", message: message});
    },

    // request successful; xml present but not yet checked
    onSuccess: function(xml, text) {
	this.onCommon();
	this.requestOkays++;
	this.requestBackoff = 0;
	this.requestError = "";
	this.updateCounts(xml);
	iconTool.enabled(true);
	var cs = "backpack cachedTime";
	var same = $(cs, storage.cachedFeed()).text() == $(cs, text).text()
	storage.cachedFeed(text);
	chrome.extension.sendRequest({status: "okay", type: "refresh", updated: !same});
    },

    updateCounts: function(xml) {
	var self = this;
	var lastTotal = this.countTotal;

	var defsError = function(req, status, error) {
	    console.log(req, status, error);
	    self.countHats = 0;
	}
	var defsLoaded = function(data, status, req) {
	    var defs = JSON.parse(data);
	    var hc = function (index, node) {
		return defs[$(node).attr("definitionIndex")]["type"];
	    }
            var newNodes = $("item", xml).filter(function (index) {
                return $("position", this).text() == "0"
	    }).map(hc);

	    notificationTool.showItems(
		$("item", xml).filter(function (index) {
                    return $("position", this).text() == "0"
		})
	    );

	    self.countHats = $.grep(newNodes, function(node, index) {
		return node=='Hat' }).length
	    self.countNotHats = textNodeInt("totalJustFound nonHats", xml);
	    self.countTotal = self.countNotHats; // + self.countHats
	    if (lastTotal != self.countTotal) {
		if (self.countTotal) {
		    iconTool.next();
		}
	    }
	    textTool.stop(
		self.countTotal ? self.countTotal.toString() : "",
		self.countHats > 0 ? colors.green : colors.blue
	    );
	}
	storage.loadItemDefs(defsLoaded, defsError);
    },

    listen: function(request, sender, sendResponse) {
	var response = {};
	if (request.type == "driver") {
            switch (request.message) {
	        case "params":
                    response = feedDriver.toJSON();
                    break;
                case "refresh":
	            feedDriver.schedule(0);
	            response = feedDriver.toJSON();
	            break;
	    }
	}
	sendResponse(response);
    },
};


var textTool = {
    timerId: 0, maxCount: 6, current: 0, maxDot: 3,

    init: function() {
	this.start(colors.grey);
    },

    draw: function() {
	var text = "";
	for (var i = 0; i < this.maxDot; i++) {
	    text += (i == this.current) ? "." : " ";
	}
	if (this.current >= this.maxDot) {
	    text += "";
	}
	chrome.browserAction.setBadgeText({text: text})
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
    },

};


var notificationTool = {
    cache: {},
    defs: null,

    init: function() {
	this.loadItemDefs();
    },

    loadItemDefs: function() {
	var error = function(req, status, error) {
	    console.log(req, status, error)
	};
	var success = function(data, status, req) {
	    try {
		notificationTool.defs = JSON.parse(data);
	    } catch (e) {
		error(req, status, data);
	    }
	};
	storage.loadItemDefs(success, error);
    },

    showItems: function(items) {
	if (!storage.useNotifications()) {
	    return;
	}
	items.map(function(index, item) {
	    var uid = $("uniqueId", item).text();
	    if (uid in notificationTool.cache) {
		return
	    }
	    notificationTool.cache[uid] = uid;
	    var idx = $(item).attr("definitionIndex");
	    var pop = webkitNotifications.createNotification(
		'icons/' + idx + '.png',
		_('new_item_title_prefix') + ' ' + notificationTool.defs[idx]['description'],
		_('new_item_level_prefix') + ' ' + $("level", item).text() + " " + notificationTool.defs[idx]['type']
	    );
	    pop.show();
	})
    },
};


function backgroundInit() {
    iconTool.init();
    notificationTool.init();
    textTool.init();
    feedDriver.init();
}
