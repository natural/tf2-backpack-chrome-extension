var itemContentSelector = "#unplaced table.unplaced td img, #backpack table.backpack td img, span.equipped";
var formatCountDown = function(value, zero, single, plural) {
    var seconds = Math.round((value  - Date.now())/1000);
    if (seconds == 1) {
	return "1 " + single;
    } else if (seconds == 0) {
	return zero;
    } else {
	return seconds + " " + plural;
    }
};


var backpack = {
    feed: null,
    defs: null,

    init: function() {
	this.loadItemDefs();
	this.loadAndShow();
    },

    loadItemDefs: function() {
	var req = new XMLHttpRequest();
	var self = this;
	req.onreadystatechange = function() {
	    if (req.readyState == 4) {
		self.defs = JSON.parse(req.responseText);
	    }
	}
	req.open("GET", chrome.extension.getURL("data/items.json"), false);
	req.send();
    },

    loadAndShow: function () {
	var xml = storage.cachedFeed();
	var self = this;
	if (xml) {
	    $(itemContentSelector).fadeOut().remove();
	    self.feed = (new DOMParser()).parseFromString(xml, "text/xml");
	    pageOps.putItems(self.feed);
	    pageOps.putCharInfo(self.feed);
	} else {
	    // handle empty
	}
    },
};


var pages = {
    current: 1,
    count: 1,

    init: function() {
	this.count = $("#backpack table.backpack tbody").length;
	this.current = 1 + $("#backpack tbody").filter(":visible").index();
	this.updateNav();
	$(".nav:first a").live("click", function (e) {return pages.nav(e, -1)});
	$(".nav:last a").live("click",  function (e) {return pages.nav(e, 1)});
    },

    nav: function(event, offset) {
	if (event.detail != 1) { return }
	var self = this;
	if ((self.current + offset) > 0 && (self.current + offset <= self.count)) {
	    $("#backpackPage-" + self.current).fadeOut(250, function() {
		self.current += offset;
		$("#backpackPage-" + self.current).fadeIn(250);
		self.updateNav();
	    });
	}
	return false;
    },

    updateNav: function () {
	$("#pages").text(this.current + "/" + this.count);
	if (this.current == 1) {
	    $(".nonav:first").show();
	    $(".nav:first").hide();
	} else {
	    $(".nonav:first").hide();
	    $(".nav:first").show();
	}
	if (this.current == this.count) {
	    $(".nonav:last").show();
	    $(".nav:last").hide();
	} else {
	    $(".nonav:last").hide();
	    $(".nav:last").show();
	}
    },
};


var showTab = {
    externalBackpack: function() {
	return this.open(this.isTF2ItemsUrl, profile.backpackViewUrl());
    },

    steamProfile: function() {
	return this.open(this.isSteamCommunityProfileUrl, profile.communityUrl());
    },

    sourceOp: function() {
	return this.open(this.isSourceOpUrl, urls.sourceOp);
    },

    pnaturalProfile: function() {
	return this.open(this.isPnaturalUrl, urls.pnatural);
    },

    options: function() {
	chrome.tabs.create({url:"./options.html"});
	window.close();
	return false;
    },

    isTF2ItemsUrl: function (url) {
	var urlItems = profile.backpackViewUrl();
	if (url.indexOf(urlItems) != 0) {
	    return false;
	}
	return url.length == urlItems.length ||
            url[urlItems.length] == "?" ||
	    url[urlItems.length] == "#";
    },

    isSteamCommunityProfileUrl: function (url) {
	var urlProfile = urls.steamCommunity + "profiles/" + storage.profileId();
	return (url.indexOf(urlProfile) == 0);
    },

    isSourceOpUrl: function (url) {
	return (url.indexOf(urls.sourceOp) == 0);
    },


    isPnaturalUrl: function (url) {
	return (url == urls.pnatural);
    },

    open: function(match, newUrl) {
	chrome.tabs.getAllInWindow(undefined,
            function(tabs) {
                for (var i = 0, tab; tab = tabs[i]; i++) {
                    if (tab.url && match(tab.url)) {
		        window.close();
                        chrome.tabs.update(tab.id, {selected:true});
                        return false;
                    }
                }
	        window.close();
                chrome.tabs.create({url:newUrl});
	        return false;
            });
    },

};


var pageOps = {
    init: function() {
	chrome.extension.onRequest.addListener(this.handleRefresh);
	$("table.unplaced td:has(img)")
	    .live("mouseenter", function() {$(this).addClass("itemHover")})
	    .live("mouseleave", function() {$(this).removeClass("itemHover")});
        $("body").mousedown(function(){return false}) //disable text selection
	$("#toolbar, #stats").css("width", -6 + Math.max(400, $("#backpack tr:first").width()));
	$("table.backpack td").click(this.itemClicked);
	window.setInterval(this.updateRefreshTime, 1000);
    },

    updateRefreshTime: function() {
	var data = $("#nextFetch").data();
	if (data && data.next) {
	    var show = formatCountDown(data.next, "Refreshing...", "second", "seconds");
	    $("#nextFetch").text(show);
	}
    },

    handleRefresh: function(request, sender, sendResponse) {
	if (request.type == "refresh" && request.status) {
	    switch(request.status) {
	        case "okay":
	        console.log("popup received refresh complete msg", request);
		    // the length check won't hurt if the backpack is totally
                    // empty, and it will help if the page is just loading
                    // via the options div.
                    if (request.updated || $("#backpack img").length==0) {
	                backpack.loadAndShow();
	                pages.init();
		    } else {
			pageOps.putTimings();
			$("#information").text("Feed Refreshed; No Changes").slideDown().delay(3000).slideUp();
			console.log("refresh complete without change to feed.");
		    }
	            break;
	        case "abort":
	        case "error":
	            console.log("popup received refresh failed msg");
	            break;
	        default:
	            console.log("unknown refresh msg");
	    }
	}
	sendResponse({});
    },

    itemImage: function(t) {
	return "<img style='display:none' src='icons/"+t+".png' onerror='pageOps.missingImage(this, "+t+")' />"
    },

    itemClicked: function(event) {
	if (!event.ctrlKey) {
	    $("table.backpack td").removeClass("selected");
	}
	$(this).addClass("selected");
    },

    requestRefresh: function(event) {
	chrome.extension.sendRequest({type:"driver", message:"refresh"}, function(response) {});
	return false;
    },

    missingImage: function(img, typ) {
	if (img) {
	    img.src = "icons/missing.png";
	    img.onerror = null;
	    return true;
	}
    },

    showStats: function() {
	$("#stats").slideDown(400, function() {
	    $("#controls a:contains('Stats')").fadeOut();
	    var ele = $("table.backpack");
	    $("html body").animate({scrollTop: ele.position().top + ele.height()})
	});
	return false;
    },

    hideStats: function() {
	$("#stats").slideUp(400, function() {
	    $("#controls a:contains('Stats')").fadeIn();
	    $("html body").animate({scrollTop: 0})
	});
	return false;
    },

    putTimings: function() {
	chrome.extension.sendRequest(
	    {type: "driver", message: "params"},
	    function(response) {
	        $("#lastFetch").text(Date(response.pollLast));
		$("#nextFetch").data({"next":response.pollNext});
		var duration = response.pollDuration;
		$("#requestTime").text(duration==0 ? "Cached" : duration + " ms");
	    });
    },

    putCharInfo: function(feed) {
	$("#steamID a").text($("steamID", feed).text());
	var avatarUrl = $("avatarFull", feed).text();
	if (avatarUrl) {
	    $("#avatar img").fadeOut().remove();
	    $("#avatar").append("<img src='" + avatarUrl + "' />");
	}
	$(["numHats", "numNormal", "numMisc",
	   "numMetal", "numUnknown", "totalItems",
	   "metalWorth", "profileViews"]).each(function(index, key) {
	       $("#"+key).text( $("backpack "+key, feed).text() );
	});
	if ($("backpack fromCache", feed).text()=="1") {
	    $("#cacheTime").text(Date($("backpack cacheTime").text()));
	} else {
	    $("#cacheTime").text("Not from cache.");
	}
        $("table.stats td:contains('Cache Time'), table.stats td:has(a)")
	    .css("padding-top", "1.5em");
	this.putTimings();
    },

    putNewItem: function(index, node) {
	var type = $(node).attr("definitionIndex");
	if (!type) {
	    return;
	}
	if ($("table.unplaced td:not(:has(img))").length == 0) {
	    var cells = new Array(5+1).join("<td><div></div></td>");
	    $("table.unplaced").append("<tbody><tr>" + cells + "</tr></tbody>");
	}
	$("table.unplaced td:eq("+index+") div").append(pageOps.itemImage(type));
	$("table.unplaced td img:last").data("node", node);
    },

    putOldItem: function(index, node) {
	var pos = $("position", node).text();
	var typ = $(node).attr("definitionIndex");
	var ele = $("#c" + (pos & 0xffff) + " div");
	ele.append(pageOps.itemImage(typ));
	var img = $("img:last", ele);
	img.data("node", node);
	if (pos & 0x80000000 && pos & 0x0FFF0000) {
	    // nudge the image up a bit; related to margin-top on the equipped class
	    img.css("margin-top", "-5px");
	    img.after("<span style='display:none' class='equipped'>Equipped</span>");
	}
    },

    putItems: function(feed) {
	$(itemContentSelector).fadeOut().remove();
	if (!feed) {
	    console.log("empty feed");
	    return;
	}
	var newNodes = $("item", feed).filter(function (index) {
	    return $("position", this).text() == "0" }).each(this.putNewItem);
	$("#unplaced, hr.unplaced").toggle(newNodes.length > 0);
	$("item", feed).filter(function (index) {
	    return $("position", this).text() != "0" }).each(this.putOldItem);
	$(itemContentSelector).fadeIn(750);
    },

};


var toolTip = {
    init: function() {
	$("table.backpack td, table.unplaced td")
            .live("mouseenter", this.show)
            .live("mouseleave", this.hide);
    },

    hide: function(event) {
	$("#tooltip").hide();
    },

    show: function(event) {
	var cell = $(this), tooltip = $("#tooltip");
	if (!cell.children().length) {
	    return;
	}
	try {
	    var node = $($("img", cell).data("node"));
	    var type = node.attr("definitionIndex");
	    var item = backpack.defs[type];
	    var levelType = item.type;
	    var level = $("level", node).text();
	} catch (e) {
	    return;
	}
	tooltip.hide().css({left:0, top:0});
	$("#tooltip h4").text(item.description).removeClass("valve community");
	$("#tooltip .level").text("Level " + level + (levelType ? " " + levelType : ""));

	// special formatting valve and community weapons
	var extras = [];
	var attrMap = {};
	$.each($("attributes attribute", node), function(index, value) {
	    var index = $(value).attr("definitionIndex");
            var format = backpack.defs["other_attributes"][index] || "";
	    if (format) {
		extras.push( format.replace("%s1", $(value).text()) );
	    }
	    attrMap[index] = $(value).text();
	});
	if (item["alt"]) {
	    item["alt"].concat(extras);
	} else if (extras) {
	    item["alt"] = extras;
	}
	if (attrMap["134"] == "2") {
	    $("#tooltip h4").text($("#tooltip h4").text().replace("The ", ""));
	    $("#tooltip h4").addClass("valve");
	} else if (attrMap["134"] == "4") {
	    $("#tooltip h4").text($("#tooltip h4").text().replace("The ", ""));
	    $("#tooltip h4").addClass("community");
	}

	// add the various descriptions
	$(["alt", "positive", "negative"]).each(function(index, key) {
	    if (item[key]) {
		var value = item[key].join("<br />");
		$("#tooltip ." + key).html(value).show();
	    } else {
		$("#tooltip ." + key).text("").hide();
	    }
	});
	tooltip.show().hide();
	// position and show the tooltip
	var pos = cell.position();
	var minleft = cell.parent().position().left;
	var cellw = cell.width();
	var toolw = tooltip.width();
	var left = pos.left - (toolw/2.0) + (cellw/2.0) - 4; // 4 == half border?
	    left = left < minleft ? minleft : left;
	var maxright = cell.parent().position().left + cell.parent().width();
	if (left + toolw > maxright) {
    	    left = cell.position().left + cellw - toolw - 12;
	}
	left = left < 0 ? (window.innerWidth/2)-toolw/2 : left;
	var top = pos.top + cell.height() + 12;
	if (top + tooltip.height() > (window.innerHeight+window.scrollY)) {
    	    top = pos.top - tooltip.height() - 36;
	}
	tooltip.css({left:left, top:top});
	tooltip.show();
    },
};


var popupInit = function() {
    if (!storage.profileId()) {
        $("#main").fadeOut('fast');
	$("#unknownProfile").fadeIn('fast');
	optionsAltInit();
	return;
    }
    pages.init();
    backpack.init();
    pageOps.init();
    toolTip.init();
};
