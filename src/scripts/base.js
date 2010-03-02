var steamIdPattern = /\d{17}/;
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
	if (v.match(steamIdPattern)) {
	    return v;
	}
	var req = new XMLHttpRequest();
	error = error ? error : function(e) {};
	req.onerror = function() {
	    error(this);
	}
	req.onreadystatechange = function() {
	    if (req.readyState == 4 && req.status == 200) {
		try {
		    var message = JSON.parse(req.responseText);
		} catch (e) {
		    console.log("parse error", e);
		    error({statusText: "Parse error"});
		    return;
		}
		if (message.success == "true") {
		    okay(message.profile);
		} else {
		    error({statusText: "Search failed"});
		}
	    } else if (req.readyState == 4) {
		error(message);
	    }
	}
	req.open("GET", urls.profileSearch + v)
	req.send(null);
    },

}


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


