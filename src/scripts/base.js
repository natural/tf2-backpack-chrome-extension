var colors = {
    blue: [51, 152, 197, 255],
    green: [59, 174, 73, 255],
    grey: [128, 128, 128, 255],
};


var apiUrlBase = 'http://tf2apiproxy.appspot.com/';
var urls = {
    apiSearch:      apiUrlBase + 'api/v1/search/',
    apiProfile:     apiUrlBase + 'api/v1/profile/',
    sourceOp:       'http://www.sourceop.com/',
    steamCommunity: 'http://steamcommunity.com/',
    tf2Items:       'http://www.tf2items.com/',
    tf2Stats:       'http://tf2stats.net/'
};
urls.pnatural = urls.steamCommunity + "profiles/76561197992805111";


var profile = {
    feedUrl: function () {
	if (storage.testUrl()) {
	    return chrome.extension.getURL(storage.testUrl());
	}
	var id = storage.profileId();
	return id ? urls.tf2Items + "packxml.php?profileid=" + id : "";
    },

    backpackViewUrl: function() {
	var id = storage.profileId();
	return id ? urls.tf2Items + "profiles/" + id : urls.tf2Items;
    },

    playerStatsUrl: function() {
	var id = storage.profileId();
	return id ? urls.tf2Stats + "player_stats/" + id : urls.tf2Stats;
    },

    communityUrl: function (id) {
	if (typeof(id) == "undefined") {
	    id = storage.profileId();
	}
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
		var results = JSON.parse(data)
	    } catch (e) {
		error({statusText: "Parse error"});
		return;
	    }
	    if (results.length) {
		okay(results);
	    } else {
		error({statusText: "Search failed"});
	    }
	};
	$.ajax({url: urls.apiSearch + v, dataType: 'text',
		error: onError, success: onSuccess});
    },

    load: function(v, okay, error) {
	var onError = function(req, status, err) {
	    error({statusText: err});
	};
	var onSuccess = function(data, status, req) {
	    if (!data) {
		error({statusText: 'Network failure'});
		return;
	    }
	    try {
		var results = JSON.parse(data)
	    } catch (e) {
		error({statusText: 'Parse error'});
		return;
	    }
	    if (results['steamid']) {
		okay(results);
	    } else {
		GRES = results;
		console.log(results);
		error({statusText: 'Fetch failed'});
	    }
	};
	$.ajax({url: urls.apiProfile + v, dataType: "text",
		error: onError, success: onSuccess})
    }


};

var storage = {
    init: function() {
	//chrome.extension.onRequest.addListener(this.refreshHandler)
    },

    useNotifications: function(v) {
	if (typeof(v) == "undefined") {
	    if (typeof(localStorage.useNotifications) == "undefined") {
		return true;
	    } else {
		return typeof(localStorage.useNotifications) == "undefined" ? true : localStorage.useNotifications == "true";
	    }
	}
	localStorage.useNotifications = v;
    },

    profileId: function(v) {
	if (typeof(v) == "undefined") {
	    return localStorage.profileId || "";
	}
	localStorage.profileId = v;
    },

    profileFeed: function(v) {
	if (typeof(v) == "undefined") {
	    return localStorage.profileFeed || "";
	}
	localStorage.profileFeed = v;
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

    testUrl: function(v) {
	if (typeof(v) == "undefined") {
	    return localStorage.testUrl || "";
	}
	localStorage.testUrl = v;
    },

    clear: function() {
	this.profileId("");
	this.cachedFeed("");
	this.debug(false);
	this.testUrl("");
    },

    lastPage: function(v) {
	if (typeof(v) == "undefined") {
	    return parseInt(localStorage.lastPage) || 1;
	}
	localStorage.lastPage = v;
    },

    pollMax: function(v) {
	if (typeof(v) == "undefined") {
	    return parseInt(localStorage.pollMax || 1000*60*15)
	}
	localStorage.pollMax = v;
    },

    pollMin: function(v) {
	if (typeof(v) == "undefined") {
	    return parseInt(localStorage.pollMin || 1000*60*5)
	}
	localStorage.pollMin = v;
    },

    loadItemDefs: function(success, error) {
	var url = "media/items_" + _("language_code") + ".json";
	$.ajax({url: chrome.extension.getURL(url),
		async: false, dataType: "text",
		error: error, success: success});

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

// wha?
var steamIdElement = null;

var i18nMap = {
    "its_msg_7":
        function(id) {
	    if (!steamIdElement) {
		steamIdElement = $("#steamID").parent().html();
		$("#steamID").remove();
	    }
	    var h = $("h2."+id);
	    h.html(_({key:id, subs:[steamIdElement]}));
	},

};


function i18nize() {
    var lang = chrome.i18n.getMessage("language_code");
    if (lang != "en") {
	$("[lang="+lang+"]").css("display", "inline")
	$("[lang="+lang+"]").children().css("display", "inline")
    }
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
