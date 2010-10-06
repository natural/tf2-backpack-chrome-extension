var apiUrlBase = 'http://tf2apiproxy.appspot.com/';
var urls = {
    apiPlayerItems: apiUrlBase + 'api/v1/items/',
    apiProfile:     apiUrlBase + 'api/v1/profile/',
    apiSchema:      apiUrlBase + 'api/v1/schema',
    apiSearch:      apiUrlBase + 'api/v1/search/',
    sourceOp:       'http://www.sourceop.com/',
    steamCommunity: 'http://steamcommunity.com/',
    tf2Items:       'http://www.tf2items.com/',
    tf2Stats:       'http://tf2stats.net/'
};


var ProfileTool = {
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
    }
};


/*
    this object provides transparent seralization and deseralization
    of values via the localStorage interface.

    this might be useful:  chrome.extension.onRequest.addListener(this.refreshHandler)
*/
var BaseStorage = {
    init: function() {
    },

    profileId: function(v) {
	if (typeof(v) == "undefined") {
	    return this.get('profileId');
	}
	this.set('profileId', v);
    },

    set: function(key, value, options) {
	options = options || {};
	var encoder = options['encoder'] || JSON.stringify;
	localStorage.setItem(key, encoder(value));
    },

    get: function(key, options) {
	options = options || {};
	var factory = options['decoder'] || JSON.parse;
	var missing = options['missing'] || '';
	var value = localStorage.getItem(key);
	if (value == null) {
	    value = missing;
	}
	return factory(value);
    },

    clear: function() {
	localStorage.clear()
    },


    loadItemDefs: function(success, error) {
	var url = "media/items_" + _("language_code") + ".json";
	$.ajax({url: chrome.extension.getURL(url),
		async: false, dataType: "text",
		error: error, success: success});

    },

};

var DebugTool = {};



var NetTool = {
    timeout: 1000*10,

    get: function(url, success, error, async, timeout) {
	var successW = function(data, status, req) {
	    DebugTool.lastReq = [data, status, req];
	    success(req.responseText);
	}
	var errorW = function(req, status, err) {
	    DebugTool.lastErr = [req, status, err];
	    console.error(status, err, req);
	    error({error: err, status: status})
	}
	async = (typeof(async) == 'undefined') ? true : async;
	timeout = (typeof(timeout) == 'undefined') ? this.timeout : timeout;
	$.ajax({url: url, async: async, dataType: 'text',
		success: successW, error: errorW,
		timeout: timeout});
    },
}

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
