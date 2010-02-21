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
	img.src = "images/missing.png";
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
	"<img src='images/" + type + ".png' onerror='missingImage(this, " + type + ")' />"
    );
}


function putOldItem(index, node) {
    gnode = node;
    var p = parseInt(node.getElementsByTagName("position")[0].firstChild.textContent);
    var type = node.getAttribute("definitionIndex");
    var element = $("#c" + (p & 0xffff));
    console.log(index, parseInt(p) & 0xffff, node, element);
    element.append("<img src='images/" + type + ".png' onerror='missingImage(this, " + type + ")' />");
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
		$("#tooltip ." + key).text(value).show();
	    } else {
		$("#tooltip ." + key).text("").hide();
	    }
	});
	gcell = cell;
	var pos = cell.position();
	// change position, accounting for padding
	toolTip.css({left:pos.left - toolTip.width()/2 + cell.width()/2 - 10,
		     top:pos.top + cell.height() + 12});
	toolTip.show();
    }
}


function hideToolTip(event) {
    $("#tooltip").hide();
}


function nav(offset) {
    if ((pageCurrent + offset) > 0 && (pageCurrent + offset <= pageCount)) {
	$("#backpackPage-" + pageCurrent).fadeOut(250, function() {
	    pageCurrent += offset;
	    $("#backpackPage-" + pageCurrent).fadeIn(250);
	    $("#pages").text(pageCurrent + "/" + pageCount);
	})

    }
}


function popupInit() {
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

    $(".nav:first a").click(function (e) { nav(-1) });
    $(".nav:last a").click(function (e) { nav(1) });
}
