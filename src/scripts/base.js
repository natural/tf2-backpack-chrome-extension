var colors = {
    red: [208, 0, 24, 255], blue: [51, 152, 197, 255],
    green: [59, 174, 73, 255], grey: [128, 128, 128, 255],
};


var steamIdPattern = /\d{17}/;


var urls = {
    tf2Items:"http://www.tf2items.com/",
    steamCommunity:"http://steamcommunity.com/",
    sourceOp:"http://www.sourceop.com/",
};
urls.profileSearch = urls.tf2Items + "search.php?tf2items_q=";
urls.pnatural = urls.steamCommunity + "profiles/76561197992805111";


function lookupProfileId(v) {
    if (v.match(steamIdPattern)) {
	return v;
    }
    var searchResult;
    var searchRequest = new XMLHttpRequest();
    searchRequest.onreadystatechange = function() {
	if (searchRequest.readyState == 4) {
	    var message = eval("(" + searchRequest.responseText + ")");
	    if (message.success == "true") {
		searchResult = message.profile
	    }
	}
    }
    searchRequest.open("GET", urls.profileSearch + v, false);
    searchRequest.send(null);
    return searchResult;
}


var storage = {
    profileId: function(v) {
	if (typeof(v) == 'undefined') {
	    return localStorage.profileId || "";
	}
	localStorage.profileId = v;
    },

    cachedFeed: function(v) {
	if (typeof(v) == 'undefined') {
	    return localStorage.cachedXml || "";
	}
	localStorage.cachedXml = v;
    },

    debug: function(v) {
	if (typeof(v) == 'undefined') {
	    return localStorage.debug == "true" || false;
	}
	localStorage.cachedXml = v;
    },

    testFeed: function(v) {
	if (typeof(v) == 'undefined') {
	    return localStorage.testXml || "";
	}
	localStorage.testXml = v;
    }


};


function getBackpackViewUrl() {
    var id = storage.profileId();
    return id ? urls.tf2Items + "profiles/" + id : urls.tf2Items;
}


function getProfileUrl() {
    var id = storage.profileId();
    return id ? urls.steamCommunity + "profiles/" + id : urls.steamCommunity;
}


function getXmlUrl() {
    if (storage.testFeed()) {
	return chrome.extension.getURL(storage.testFeed());
    }
    var id = storage.profileId();
    return id ? urls.tf2Items + "packxml.php?profileid=" + id : "";
}
