/*
position values:

    0x8-CCC-SSSS where C = class bit and S = position bit
    e.g., (2155872335 & 0x80000000 && 2155872335 & 0x0FFF0000)
*/
var backpackXml;
var itemData;
var pageCurrent = 1;
var pageCount;
// for testing; remove later
var gnode;
var gcell;


function isTF2ItemsUrl(url) {
    var urlItems = getBackpackViewUrl();
    if (url.indexOf(urlItems) != 0) {
	return false;
    }
    return url.length == urlItems.length ||
        url[urlItems.length] == "?" ||
	url[urlItems.length] == "#";
}


function isSteamCommunityProfileUrl(url) {
    var urlProfile = steamCommunityUrl + "profiles/" + getProfileId();
    return (url.indexOf(urlProfile) == 0);
}


function isSourceOpUrl(url) {
    return (url.indexOf(sourceOpUrl) == 0)
}


function isPnaturalUrl(url) {
    return (url == pnaturalUrl)
}


function selectOrOpenTab(match, newUrl) {
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
        }
    )
}


function showExternalBackpack() { return selectOrOpenTab(isTF2ItemsUrl, getBackpackViewUrl()) }
function showSteamProfile() { return selectOrOpenTab(isSteamCommunityProfileUrl, getProfileUrl()) }
function showSourceOp() { return selectOrOpenTab(isSourceOpUrl, sourceOpUrl) }
function showPnaturalProfile() { return selectOrOpenTab(isPnaturalUrl, pnaturalUrl) }
function showOptions() { chrome.tabs.create({url:"options.html"}) }


function loadItemData() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
	if (req.readyState == 4) {
	    itemData = eval("( " + req.responseText + ")");
	}
    }
    req.open("GET", chrome.extension.getURL("/data/items.json"), true)
    req.send()
}


function putInfo(backpackXml) {
    $("#steamID").text(steamID = $("steamID", backpackXml).text());
    var avatarUrl = $("avatarFull", backpackXml).text();
    if (avatarUrl != "") {
	$("#avatar").append("<img src='" + avatarUrl + "' />");
    }
}


function loadAndShowBackpack() {
    chrome.extension.sendRequest({get:"backpackXml"},
        function(response) {
            backpackXml = (new DOMParser()).parseFromString(response.doc, "text/xml");
	    putImages(backpackXml);
	    putInfo(backpackXml);
	}
    )
}


function missingImage(img, typ) {
    if (img) {
	img.src = "icons/missing.png";
	img.onerror = null;
	return true;
    }
}


function putNewItem(index, node) {
    var type = node.getAttribute("definitionIndex");
    if (type == undefined) {
	return;
    }
    if ($("table.unplaced td:empty").length == 0) {
	$("table.unplaced").append("<tr><td></td><td></td><td></td><td></td><td></td></tr>");
    }
    $("table.unplaced td:eq("+index+")").append(
	"<img src='icons/" + type + ".png' onerror='missingImage(this, " + type + ")' />"
    );
    var img = $("table.unplaced td img:last");
    img.data("node", node);
}


function putOldItem(index, node) {
    var p = parseInt(node.getElementsByTagName("position")[0].firstChild.textContent);
    var type = node.getAttribute("definitionIndex");
    var element = $("#c" + (p & 0xffff));

    element.append("<img src='icons/" + type + ".png' onerror='missingImage(this, " + type + ")' />");
    var img = $("img:last", element);
    img.data("node", node);
    if (p & 0x80000000 && p & 0x0FFF0000) {
	// nudge the image up a bit; related to margin-top on the equipped class
	img.css("margin-top", "-4px");
	element.append("<span class='equipped'>Equipped</span>");
    }
}


function putImages(backpackXml) {
    if (!backpackXml) {
	console.log("empty backpackXml");
	return;
    }
    var newNodes = $("item", backpackXml).filter(
	function (index) { return $("position", this).text() == "0" }
    );
    if (newNodes.length > 0) {
	newNodes.each(putNewItem)
	$("#unplaced, hr.unplaced").show()
    }

    var oldNodes = $("item", backpackXml).filter(
	function (index) { return $("position", this).text() != "0" }
    );
    oldNodes.each(putOldItem);
}


function showToolTip(event) {
    var cell = $(this)
    if (cell.children().length > 0) {
	var node = $( $("img", cell).data("node") );
	var type = node.attr("definitionIndex");
	var item = itemData[type];
	var toolTip = $("#tooltip");
	$("#tooltip h4").text( item.description );

	var level = $("level", node).text()
	var levelType = item.type;
	$("#tooltip .level").text("Level " + level + (levelType ? " " + levelType : ""));

	$(["alt", "plus", "minus"]).each(function(index, key) {
	    var value = item[key];
	    if (value) {
		value = value.replace("\n", "<br>");
		$("#tooltip ." + key).html(value).show();
	    } else {
		$("#tooltip ." + key).text("").hide();
	    }
	});
	gcell = cell;
	var pos = cell.position();
	var minleft = cell.parent().position().left
	var left = pos.left - toolTip.width()/2 + cell.width()/2 - 10;
	if (left < minleft) {
	    left = minleft;
	}
	var maxright = cell.parent().position().left + cell.parent().width();
	if (left + toolTip.width() > maxright) {
	    left = cell.position().left + cell.width() - toolTip.width() - 12;
	}
	var top = pos.top + cell.height() + 12;
	toolTip.css({left:left, top:top});
	toolTip.show();
    }
}


function hideToolTip(event) {
    $("#tooltip").hide();
}


function navUpdate() {
    $("#pages").text(pageCurrent + "/" + pageCount);
    if (pageCurrent == 1) {
	$(".nav:first").html("&lt;");
    } else {
	$(".nav:first").html("<a href='#'>&lt</a>");
    }
    if (pageCurrent == pageCount) {
	$(".nav:last").html("&gt;");
    } else {
	$(".nav:last").html("<a href='#'>&gt</a>");
    }
}


function nav(offset) {
    if ((pageCurrent + offset) > 0 && (pageCurrent + offset <= pageCount)) {
	$("#backpackPage-" + pageCurrent).fadeOut(250, function() {
	    pageCurrent += offset;
	    $("#backpackPage-" + pageCurrent).fadeIn(250);
	    navUpdate();
	})

    }
}


function popupInit() {
    if (!getProfileId()) {
        $("body > *:not(#unknownProfile)").hide()
	$("#unknownProfile").show();
    } else {
	pageCount = $(".backpack tbody").length;
	loadItemData();
	loadAndShowBackpack();
	$("table.backpack td").click(function () {
	    $("table.backpack td").removeClass("cellFg");
	    $(this).addClass("cellFg");
	    console.log("this", this);
	});
	$("table.backpack td, table.unplaced td")
            .live('mouseenter', showToolTip)
            .live('mouseleave', hideToolTip);
	$("#tooltip").hide();
	navUpdate();
	$(".nav:first a").live('click', function (e) { nav(-1); return false });
	$(".nav:last a").live('click', function (e) { nav(1); return false });
	$(".nav a").live('mouseenter', function (e) { $(this).parent().addClass("navhover")  });
	$(".nav a").live('mouseleave', function (e) {  $(this).parent().removeClass("navhover") });
	$("#nav").css("width", $("#backpackPage-1").width()-3);
    }
}
