var backpack = {items:null, definitions:null};
var pages = {current:1, count:1};


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
    var urlProfile = urls.steamCommunity + "profiles/" + getProfileId();
    return (url.indexOf(urlProfile) == 0);
}


function isSourceOpUrl(url) {
    return (url.indexOf(urls.sourceOp) == 0);
}


function isPnaturalUrl(url) {
    return (url == urls.pnatural);
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


function showExternalBackpack() {
    return selectOrOpenTab(isTF2ItemsUrl, getBackpackViewUrl());
}


function showSteamProfile() {
    return selectOrOpenTab(isSteamCommunityProfileUrl, getProfileUrl());
}


function showSourceOp() {
    return selectOrOpenTab(isSourceOpUrl, urls.sourceOp);
}


function showPnaturalProfile() {
    return selectOrOpenTab(isPnaturalUrl, urls.pnatural);
}


function showOptions() {
    chrome.tabs.create({url:"options.html"})
}


function loadItemData() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
	if (req.readyState == 4) {
	    backpack.defintions = eval("( " + req.responseText + ")");
	}
    }
    req.open("GET", chrome.extension.getURL("/data/items.json"), true);
    req.send();
}


function putInfo(xml) {
    $("#steamID").text($("steamID", xml).text());
    var avatarUrl = $("avatarFull", xml).text();
    if (avatarUrl) {
	$("#avatar").append("<img src='" + avatarUrl + "' />");
    }
}


function loadAndShowBackpack() {
    chrome.extension.sendRequest({get:"backpackXml"},
        function(response) {
            backpack.items = (new DOMParser()).parseFromString(response.doc, "text/xml");
	    putImages(backpack.items);
	    putInfo(backpack.items);
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
    if (!type) {
	return;
    }
    if ($("table.unplaced td:empty").length == 0) {
	var cells = new Array(5+1).join("<td></td>");
	$("table.unplaced").append("<tbody><tr>" + cells + "</tr></tbody>");
    }
    $("table.unplaced td:eq("+index+")").append(
	"<img src='icons/" + type + ".png' onerror='missingImage(this, " + type + ")' />"
    );
    $("table.unplaced td img:last").data("node", node);
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


function putImages(xml) {
    if (!xml) {
	console.log("empty xml");
	return;
    }
    var newNodes = $("item", xml).filter(
	function (index) { return $("position", this).text() == "0" }
    );
    if (newNodes.length > 0) {
	newNodes.each(putNewItem)
	$("#unplaced, hr.unplaced").show()
    }
    var oldNodes = $("item", xml).filter(
	function (index) { return $("position", this).text() != "0" }
    );
    oldNodes.each(putOldItem);
}


function showToolTip(event) {
    var cell = $(this)
    if (!cell.children().length) {
	return;
    }
    var node = $( $("img", cell).data("node") );
    var type = node.attr("definitionIndex");
    var item = backpack.defintions[type];
    var tooltip = $("#tooltip");
    tooltip.css({left:0, top:0});
    $("#tooltip h4").text( item.description );
    var level = $("level", node).text();
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
    var pos = cell.position();
    var minleft = cell.parent().position().left;
    var left = pos.left - tooltip.width()/2 + cell.width()/2 - 10;
    left = left < minleft ? minleft : left;
    var maxright = cell.parent().position().left + cell.parent().width();
    if (left + tooltip.width() > maxright) {
	left = cell.position().left + cell.width() - tooltip.width() - 12;
    }
    var top = pos.top + cell.height() + 12;
    if ((top + tooltip.height()) > document.body.clientHeight) {
	top = pos.top - tooltip.height() - 36;
    }
    tooltip.css({left:left, top:top});
    tooltip.show();
}


function hideToolTip(event) {
    $("#tooltip").hide();
}


function navUpdate() {
    $("#pages").text(pages.current + "/" + pages.count);
    if (pages.current == 1) {
	$(".nav:first").html("&lt;").addClass("nonav");
    } else {
	$(".nav:first").html("<a href='#'>&lt</a>").removeClass("nonav");
    }
    if (pages.current == pages.count) {
	$(".nav:last").html("&gt;").addClass("nonav");
    } else {
	$(".nav:last").html("<a href='#'>&gt</a>").removeClass("nonav")
    }
}


function nav(offset) {
    if ((pages.current + offset) > 0 && (pages.current + offset <= pages.count)) {
	$("#backpackPage-" + pages.current).fadeOut(250, function() {
		pages.current += offset;
		$("#backpackPage-" + pages.current).fadeIn(250);
		navUpdate();
	    });
    }
    return false;
}

function showUnplacedBorder(event) {
    var cell = $(this);
    if (!cell.children().length) {
	return;
    }
    cell.addClass("unplacedhover");
}


function hideUnplacedBorder(event) {
    $(this).removeClass("unplacedhover");
}


function itemClicked(event) {
    if (!event.ctrlKey) {
	$("table.backpack td").removeClass("selected");
    }
    $(this).addClass("selected");
}


function popupInit() {
    pages.count = $("#backpack tbody").length;

    if (!getProfileId()) {
        $("body > *:not(#unknownProfile)").hide()
	$("body").css("height", 200);
	$("#unknownProfile").show();
    } else {
	$("body").css("min-height", 760);
	loadItemData();
	loadAndShowBackpack();
	navUpdate();

	$("table.backpack td").click(itemClicked);

	$("table.backpack td, table.unplaced td")
            .live('mouseenter', showToolTip)
            .live('mouseleave', hideToolTip);

	$("table.unplaced td")
	    .live("mouseenter", showUnplacedBorder)
	    .live("mouseleave", hideUnplacedBorder);

	$(".nav:first a").live('click', function (e) { return nav(-1); });
	$(".nav:last a").live('click', function (e) { return nav(1); });
	$("#nav").css("width", $("#backpackPage-1").width()-3);
    }
}
