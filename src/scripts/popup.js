var unplacedItemSelector = "#unplaced table.unplaced td img"
var placedItemSelector = "#backpack table.backpack td img"
var equippedItemSelector = "span.equipped"
var itemContentSelector = [unplacedItemSelector, placedItemSelector, equippedItemSelector].join(", ")


/*
    this object encapsulates storing and providing data for the popup.
    it uses the BaseStorage class for serialization/deserialization,
    and the NetTool class for network data.

*/
var PopupStorage = {
    feed: null,
    defs: null,

    init: function() {
	this.loadItemDefs()
	this.loadAndShow()
    },

    loadItemDefs: function() {
	var error = function(req, status, error) {
	    console.log(req, status, error)
	}
	var success = function(data, status, req) {
	    try {
		PopupStorage.defs = JSON.parse(data)
	    } catch (e) {
		error(req, status, data)
	    }
	}
	BaseStorage.loadItemDefs(success, error)
    },

    // this doesn't belong here.  not.  one.  bit.
    loadAndShow: function () {
	return
	var xml = BaseStorage.get('xmlCache', {missing:''})
	var self = this
	if (xml) {
	    $(itemContentSelector).fadeOut().remove()
	    self.feed = (new DOMParser()).parseFromString(xml, "text/xml")
	    PopupView.putItems(self.feed)
	    //PopupView.putCharInfo(self.feed)
	    //PopupView.loadAndShowProfile()
	} else {
	    console.error("empty xml")
	}
    },


}


/*

    this object encapsulates the state and behavior of the backpack
    view: the items, their locations, current page, etc.

*/
var BackpackView = {
    current: 1,
    count: 1,

    init: function() {
	this.count = $("#backpack table.backpack tbody").length
	this.current = 1 + $("#backpack tbody").filter(":visible").index()
	this.updateNav()
	$(".nav:first a").live("click", function (e) {return BackpackView.nav(e, -1)})
	$(".nav:last a").live("click",  function (e) {return BackpackView.nav(e, 1)})
	this.fastForward()
    },

    nav: function(event, offset) {
	if (event.detail != 1) { return }
	var self = this
	if ((self.current + offset) > 0 && (self.current + offset <= self.count)) {
	    $("#backpackPage-" + self.current).fadeOut(250, function() {
		self.current += offset
		$("#backpackPage-" + self.current).fadeIn(250)
		BaseStorage.set('lastPage', self.current)
		self.updateNav()
	    })
	}
	return false
    },

    navTo: function(page) {
	this.current = page
	$("#backpackPage-" + this.current).fadeIn(250)
	this.updateNav()
    },

    updateNav: function () {
	var current = _("num"+this.current), count = _("num"+this.count)
	$("#pages").text(current + "/" + count)
	if (this.current == 1) {
	    $(".nonav:first").show()
	    $(".nav:first").hide()
	} else {
	    $(".nonav:first").hide()
	    $(".nav:first").show()
	}
	if (this.current == this.count) {
	    $(".nonav:last").show()
	    $(".nav:last").hide()
	} else {
	    $(".nonav:last").hide()
	    $(".nav:last").show()
	}
    },

    fastForward: function() {
	var last = BaseStorage.get('lastPage', {missing:1})
	if (last > 1) {
	    $("#backpackPage-1").hide()
	    BackpackView.navTo(last)
	}
    },

    showStock: function() {
	var showStock = function(req, status) {
	    var xml = req.responseXML
	    $(itemContentSelector).fadeOut().remove()
	    PopupView.putItems(xml)
	}
	$.ajax({url:"media/stock_items.xml", complete:showStock})
    },

    hideStock: function() {
	var xml = this.feed
	if (xml) {
	    $(itemContentSelector).fadeOut().remove()
	    PopupView.putItems(xml)
	} else {
	    console.warning("empty xml")
	}
    },


}


/*


*/
var BrowserTool = {
    betterTranslation: function() {
	return window.open('mailto:phineas.natural@gmail.com?subject=Better Translation')
    },

    externalBackpack: function() {
	return this.show(urls.tf2Items + 'profiles/' + BaseStorage.profileId())
    },

    externalStats: function() {
	return this.show(urls.tf2Stats + 'player_stats/' + BaseStorage.profileId())
    },

    showOptions: function() {
	chrome.tabs.create({url:'./options.html'})
	window.close()
	return false
    },

    showProfile: function(id64) {
	id64 = (typeof(id64) == 'undefined') ? BaseStorage.profileId() : id64
        return this.show(urls.steamCommunity + 'profiles/' + id64)
    },

    show: function(url) {
	this.open(function (m) { return m.indexOf(url) == 0 }, url)
    },

    open: function(match, newUrl) {
	chrome.tabs.getAllInWindow(undefined,
            function(tabs) {
                for (var i = 0, tab; tab = tabs[i]; i++) {
                    if (tab.url && match(tab.url)) {
		        window.close()
                        chrome.tabs.update(tab.id, {selected:true})
                        return false
                    }
                }
	        window.close()
                chrome.tabs.create({url:newUrl})
	        return false
            })
    },

}


var PopupView = {
    init: function() {
	chrome.extension.onRequest.addListener(this.handleRefresh)
	$("table.unplaced td:has(img)")
	    .live("mouseenter", function() {$(this).addClass("itemHover")})
	    .live("mouseleave", function() {$(this).removeClass("itemHover")})
	if (_("language_code") != "en") {
	    $("#translation_suggestion").show()
	}
        $("body").mousedown(function(){return false}) //disable text selection
	var w = $("#controls").width()
	$("#nav span").each(function(i,x) { w+=$(x).width() })
	if (w+6< $("#backpack tr:first").width()) {
	    $("#toolbar, #stats").css("width", -6 + $("#backpack tr:first").width())
	}
	$("table.backpack td").click(this.itemClicked)
	$("#showstock").click(function() {
	    if ($(this).attr("src").indexOf("unchecked") > -1) {
		$(this).attr("src", "media/checkbox-checked.png")
		BackpackView.showStock()
	    } else {
		$(this).attr("src", "media/checkbox-unchecked.png")
		BackpackView.hideStock()
	    }
	})

	window.setInterval(this.updateRefreshTime, 1000)
    },

    showMessage: function(type, message, duration) {
	if (type=="warning" && message.toLowerCase().indexOf("warning") != 0) {
	    message = _("warning") + ": " +  _(message)
	}
	if (type=="error" && message.toLowerCase().indexOf("error") != 0) {
	    message = _("error") + ": " +  _(message)
	}
        $("#"+type).text(message).slideDown().delay(duration||5000).slideUp()
    },

    updateRefreshTime: function() {
	var data = $("#nextFetch").data()
	if (data && data.next) {
	    var show = PopupView.formatCountDown(data.next, _("refreshing")+"...", _("second"), _("seconds"))
	} else {
	    var show = _("error")
	}
	$("#nextFetch").text(show)
    },

    formatCountDown: function(value, zero, single, plural) {
	var seconds = Math.round((value  - Date.now())/1000)
	if (seconds == 1) {
	    return "1 " + single
	} else if (seconds == 0 || seconds < 0) {
	    return zero
	} else {
	    return seconds + " " + plural
	}
    },

    handleRefresh: function(request, sender, sendResponse) {
	if (request.type == "refresh" && request.status) {
	    switch(request.status) {
	        case "okay":
		    // the length check won't hurt if the backpack is totally
                    // empty, and it will help if the page is just loading
                    // via the options div.
                    if (request.updated || $("#backpack img").length==0) {
	                PopupStorage.loadAndShow()
	                BackpackView.init()
		    } else {
			PopupView.putTimings()
			PopupView.showMessage("information", _("refresh_nochange"))
		    }
	            break
	        case "warning":
                    PopupView.showMessage("warning", _(request.message))
		    break
	        case "abort":
	        case "error":
	        case "exception":
		    PopupView.showMessage("error", _(request.message))
	            break
	        default:
	            console.log("unknown refresh msg")
	    }
	}
	sendResponse({})
    },

    itemImage: function(t) {
	return "<img style='display:none' src='icons/"+t+".png' onerror='PopupView.missingImage(this, "+t+")' />"
    },

    itemClicked: function(event) {
	if (!event.ctrlKey) {
	    $("table.backpack td").removeClass("selected")
	}
	$(this).addClass("selected")
    },

    requestRefresh: function(event) {
	$("html body").animate({scrollTop: 0})
	chrome.extension.sendRequest({type:"driver", message:"refresh"}, function(response) {})
	return false
    },

    missingImage: function(img, typ) {
	if (img) {
	    img.src = "icons/missing.png"
	    img.onerror = null
	    return true
	}
    },

    showStats: function() {
	$("#stats").slideDown(400, function() {
	    $("#controls a:contains('Stats')").fadeOut()
	    var ele = $("table.backpack")
	    $("html body").animate({scrollTop: ele.position().top + ele.height()})
	})
	return false
    },

    hideStats: function() {
	$("#stats").slideUp(400, function() {
	    $("#controls a:contains('Stats')").fadeIn()
	    $("html body").animate({scrollTop: 0})
	})
	return false
    },

    putTimings: function() {
	chrome.extension.sendRequest(
	    {type: "driver", message: "params"},
	    function(response) {
	        $("#lastFetch").text(Date(response.pollLast))
		$("#nextFetch").data({"next":response.pollNext})
		var duration = response.pollDuration
		$("#requestTime").text(duration==0 ? "Cached" : duration + " ms")
		if (response.requestError) {
		    PopupView.showMessage("warning", _("from_cache"))
		}
	    })
    },

    loadAndShowProfile: function() {
	var feed = BaseStorage.profileFeed()
	var load = function(data) {
	    $('#steamID a').text(data['personaname'])
	    var avatar = data['avatarfull']
	    if (avatar) {
		$('#avatar img').fadeOut().remove()
		$('#avatar').append("<img src='" + avatar + "' />")
	    }
	}
	if (feed) {
	    load(feed)
	} else {
	    var error = function(v) {
		console.log(v)
	    }
	    profile.load(BaseStorage.profileId(), load, error)
	}
    },

    putCharInfo: function(feed) {
	feed = JSON.parse(feed)
	$("#steamID a").text(feed['personaname'])
	if (feed['avatarfull']) {
	    $("#avatar img").fadeOut().remove()
	    $("#avatar").append("<img src='" + feed['avatarfull'] + "' />")
	}
    },

    putCharInfo__: function(feed) {
	$("#steamID a").text($("steamID", feed).text())
	var avatarUrl = $("avatarFull", feed).text()
	if (avatarUrl) {
	    $("#avatar img").fadeOut().remove()
	    $("#avatar").append("<img src='" + avatarUrl + "' />")
	}
	$(["numHats", "numNormal", "numMisc",
	   "numMetal", "numUnknown", "totalItems",
	   "metalWorth", "profileViews"]).each(function(index, key) {
	       $("#"+key).text( $("backpack "+key, feed).text() )
	})
	if ($("backpack fromCache", feed).text()=="1") {
	    $("#cacheTime").text(Date($("backpack cacheTime").text()))
	} else {
	    $("#cacheTime").text("Not from cache.")
	}
        // give the first timing row (cache time) and the hide button
	// some extra top padding
        $("table.stats td:has(strong[class='its_msg_20']), table.stats td:has(a)")
	    .css("padding-top", "1.5em")
	this.putTimings()
    },

    putNewItem: function(index, node) {
	var type = $(node).attr("definitionIndex")
	if (!type) {
	    return
	}
	if ($("table.unplaced td:not(:has(img))").length == 0) {
	    var cells = new Array(5+1).join("<td><div></div></td>")
	    $("table.unplaced").append("<tbody><tr>" + cells + "</tr></tbody>")
	}
	$("table.unplaced td:eq("+index+") div").append(PopupView.itemImage(type))
	$("table.unplaced td img:last").data("node", node)
    },

    putOldItem: function(index, node) {
	var pos = $("position", node).text()
	var typ = $(node).attr("definitionIndex")
	var ele = $("#c" + (pos & 0xffff) + " div")
	ele.append(PopupView.itemImage(typ))
	var img = $("img:last", ele)
	img.data("node", node)
	if (pos & 0x80000000 && pos & 0x0FFF0000) {
	    // nudge the image up a bit related to margin-top on the equipped class
	    img.css("margin-top", PopupView.nudgeMap[typ] || "-8px")
	    img.after("<span style='display:none' class='equipped'>" + _("equipped") + "</span>")
	}

	// TODO:  need to determine how and when to indicate a quantity...
	// TODO:  swap paint can images by color
	var quan = $("quantity", node).text()
	if (quan != "1") {
		img.before("<span style='' class='quantity'>" + _(quan) + "</span>")
	        img.css("margin-top", "-1em")
	}
    },

    putItems: function(feed) {
	$(itemContentSelector).fadeOut().remove()
	if (!feed) {
	    console.log("empty feed")
	    return
	}
	var newNodes = $("item", feed).filter(function (index) {
	    return $("position", this).text() == "0" }).each(this.putNewItem)
	$("#unplaced, hr.unplaced").toggle(newNodes.length > 0)
	$("item", feed).filter(function (index) {
	    return $("position", this).text() != "0" }).each(this.putOldItem)
	$(itemContentSelector).fadeIn(750)
    },

    nudgeMap: {
	"133": "0",
    },

}


var TooltipView = {
    init: function() {
	$("table.backpack td, table.unplaced td")
            .live("mouseenter", this.show)
            .live("mouseleave", this.hide)
    },

    hide: function(event) {
	$("#tooltip").hide()
    },

    show: function(event) {
	var cell = $(this), tooltip = $("#tooltip")
	if (!cell.children().length) {
	    return
	}
	try {
	    var node = $($("img", cell).data("node"))
	    var type = node.attr("definitionIndex")
	    var item = PopupStorage.defs[type]
	    var levelType = item.type
	    var level = $("level", node).text()
	    var desc = item.description.replace("\\n", "<br />")
	} catch (e) {
	    return
	}
	tooltip.hide().css({left:0, top:0})
	$("#tooltip h4").text(desc).removeClass("valve community")
	$("#tooltip .level").text(_({key:"level", subs:[level, levelType]}))

	// special formatting valve and community weapons
	var extras = []
	var attrMap = {}
	$.each($("attributes attribute", node), function(index, value) {
	    var index = $(value).attr("definitionIndex")
            var format = PopupStorage.defs["other_attributes"][index] || ""
	    if (format) {
		extras.push( format.replace("%s1", $(value).text()) )
	    }
	    attrMap[index] = $(value).text()
	})
	if (type=="128") {
	    GNODE = node
	    GATTRMAP = attrMap
	}
	if (item["alt"]) {
	    item["alt"].concat(extras)
	} else if (extras) {
	    item["alt"] = extras
	}

	$("#tooltip h4").removeClass("vintage").removeClass("valve").removeClass("community")
	if (attrMap["134"] == "2") {
	    $("#tooltip h4").text($("#tooltip h4").text().replace("The ", ""))
	    $("#tooltip h4").addClass("valve")
	} else if ( typeof(attrMap["134"]) != "undefined") {
	    $("#tooltip h4").text(_("community") + " " + $("#tooltip h4").text().replace("The ", ""))
	    $("#tooltip h4").addClass("community")
	}
        if ($("quality", node).text() == "3") {
	    $("#tooltip h4").text(_("vintage") + " " + $("#tooltip h4").text().replace("The ", ""))
	    $("#tooltip h4").addClass("vintage")
 	} /* else if ($("quality", node).text() == "6") {
	    $("#tooltip h4").text("Q6 " + $("#tooltip h4").text())
	} */

	// add the various descriptions
	var medals = ["164", "165", "166", "170"]
	$(["alt", "positive", "negative"]).each(function(index, key) {
	    if (item[key]) {
		var value = item[key].join("<br />").replace("\\n", "<br />")
		// sub out %s1 for date in medals
		if (key=="alt" && medals.indexOf(type) > -1) {
		    var ds = $("attribute[definitionIndex='143']", node).text()
		    var d = new Date(parseInt(ds) * 1000)
		    value = value.replace("%s1", d)
		}
		if (value.indexOf("TF_") == 0) { value = "" }
		$("#tooltip ." + key).html(value).show()
	    } else {
		$("#tooltip ." + key).text("").hide()
	    }
	})
	tooltip.show().hide()
	// position and show the tooltip
	var pos = cell.position()
	var minleft = cell.parent().position().left
	var cellw = cell.width()
	var toolw = tooltip.width()
	var left = pos.left - (toolw/2.0) + (cellw/2.0) // - 4 // 4 == half border?
	left = left < minleft ? minleft : left
	var maxright = cell.parent().position().left + cell.parent().width()
	if (left + toolw > maxright) {
    	    left = cell.position().left + cellw - toolw + 4 // - 12
	}
	left = left < 0 ? (window.innerWidth/2)-toolw/2 : left
	var top = pos.top + cell.height() + 12
	if (top + tooltip.height() > (window.innerHeight+window.scrollY)) {
    	    top = pos.top - tooltip.height() - 8 // - 36
	}
	tooltip.css({left:left, top:top})
	tooltip.show()
    },
}


var Popup = {
    schema: {}, profile: {}, items: {},

    init: function() {
	i18nize()
	if (!BaseStorage.profileId()) {
	    this.emptyInit()
	} else {
	    this.mainInit()
	}
    },

    mainInit: function() {
	$.map([PopupStorage, PopupView, TooltipView, BackpackView], function(c) { c.init() })
	chrome.extension.sendRequest(
	    {type: 'getSchema', lang: _('language_code')},
	    function (response) {
		Popup.schema = JSON.parse(response.schema)
		console.log('item schema:', Popup.schema)
	    })
	chrome.extension.sendRequest(
	    {type: 'getPlayerItems', id64: BaseStorage.profileId()},
	    function (response) {
		Popup.items = JSON.parse(response.items)
		console.log('player items:', Popup.items.length)
	    })
	chrome.extension.sendRequest(
	    {type: 'getPlayerProfile', id64: BaseStorage.profileId()},
	    function (response) {
		Popup.profile = JSON.parse(response.profile)
		PopupView.putCharInfo(response.profile)
		console.log('player profile:', Popup.profile)
	    })
	console.log('Popup.mainInit complete')
    },

    emptyInit: function() {
        $("#main").fadeOut('fast')
	$("#unknownProfile").fadeIn('fast')
	optionsInit(function() {
	    $("#unknownProfile").fadeOut('fast', function() {
	        $("#main").fadeIn().delay(1000)
		Popup.mainInit()
	        PopupView.requestRefresh()
	    })
	})
    },
}
