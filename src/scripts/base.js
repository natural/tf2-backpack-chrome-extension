var colors = {
    red: [208, 0, 24, 255],
    blue: [51, 152, 197, 255],
    green: [59, 174, 73, 255],
    grey: [128, 128, 128, 255],
};
var urls = {
    tf2Items:"http://www.tf2items.com/",
    steamCommunity:"http://steamcommunity.com/",
    sourceOp:"http://www.sourceop.com/",

};
urls.profileSearch = urls.tf2Items + "search.php?tf2items_q=";
urls.pnatural = urls.steamCommunity + "profiles/76561197992805111";


// Function currying
// Copyright (c) 2008 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
// Licensed under BSD (http://www.opensource.org/licenses/bsd-license.php)
function curry(fn) {
    return function() {
	var args = curry.args(arguments),
	    master = arguments.callee,
	    self = this;
	return args.length >= fn.length ? fn.apply(self,args) : function() {
	    return master.apply(self, args.concat(curry.args(arguments)));
	};
    };
};
curry.args = function(args) { return Array.prototype.slice.call(args); };
Function.prototype.curry = function() { return curry(this); };


var profile = {
    feedUrl: function () {
	if (storage.testFeed()) {
	    return chrome.extension.getURL(storage.testFeed());
	}
	var id = storage.profileId();
	return id ? urls.tf2Items + "packxml.php?profileid=" + id : "";
    },

    backpackViewUrl: function() {
	var id = storage.profileId();
	return id ? urls.tf2Items + "profiles/" + id : urls.tf2Items;
    },

    communityUrl: function () {
	var id = storage.profileId();
	return id ? urls.steamCommunity + "profiles/" + id : urls.steamCommunity;
    },

    search: function(v, okay, error) {
	var onError = function(req, status, err) {
	    error({statusText: err});
	};
	var onSuccess = function(data, status, req) {
	    if (!data) {
		error({statusText: "Network failure"});
		return;
	    }
	    try {
		var msg = JSON.parse(data)
	    } catch (e) {
		error({statusText: "Parse error"});
		return;
	    }
	    if (msg.success == "true") {
		okay(msg.profile);
	    } else {
		error({statusText: "Search failed"});
	    }
	};
	$.ajax({url: urls.profileSearch + v, dataType: "text",
		error: onError, success: onSuccess});
    },

};

var storage = {
    init: function() {
	//chrome.extension.onRequest.addListener(this.refreshHandler)
    },

    profileId: function(v) {
	if (typeof(v) == "undefined") {
	    return localStorage.profileId || "";
	}
	localStorage.profileId = v;
    },

    cachedFeed: function(v) {
	if (typeof(v) == "undefined") {
	    return localStorage.cachedXml || "";
	}
	localStorage.cachedXml = v;
    },

    debug: function(v) {
	if (typeof(v) == "undefined") {
	    return localStorage.debug == "true" || false;
	}
	localStorage.cachedXml = v;
    },

    testFeed: function(v) {
	if (typeof(v) == "undefined") {
	    return localStorage.testXml || "";
	}
	localStorage.testXml = v;
    },

    clear: function() {
	this.profileId("");
	this.cachedFeed("");
	this.debug(false);
	this.testFeed("");
    },

};


function textNodeInt(selector, xml) {
    v = parseInt($(selector, xml).text());
    return v ? v : 0;
}

function _ (item) {
    if (typeof(item) == "string") {
	var options = {key: item, missing: item};
    } else {
	var options = item;
    }
    var key = options.key;
    if (!key) {
	return options.missing || "";
    }
    if (options.subs) {
	var val = chrome.i18n.getMessage(key, options.subs);
    } else {
	var val = chrome.i18n.getMessage(key);
    }
    return !val ? options.missing || "" : val;
}


var i18nMap = {
    "its_msg_7":
        function(id) {
	    var h = $("h2."+id);
	    var i = $("#steamID").parent().html();
	    h.html(_({key:id, subs:[i]}));
	},

};


function i18nize() {
    var targets = $("[class*='its_msg_'], [id*='its_msg_']");
    targets.each(function(index, node) {
        node = $(node);
        if (node.attr("id").indexOf("its_msg_")==0) {
            var msgid = node.attr("id");
        } else {
	    var cls = node.attr("class");
	    var msgid = cls.substring(cls.search(/its_msg_\d+/)).split(" ")[0];
	}
	if (msgid in i18nMap) {
	    var fun = i18nMap[msgid];
	    fun(msgid);
	} else {
	    var txt = _(msgid);
	    node.html(txt);
	}
    });
}


