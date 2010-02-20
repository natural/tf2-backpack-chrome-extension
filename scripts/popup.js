var backpackXml;
var newItemSelect = "/backpack/items/item/position[text()='0']/..";
var oldItemSelect = "/backpack/items/item/position[text()!='0']/..";
var avatarSelect = "/backpack/avatarFull";
var itemData;
var pageCurrent = 1;
var pageCount;


function isTF2ItemsUrl(url) {
    var urlItems = getBackpackViewUrl();
    if (url.indexOf(urlItems) != 0) {
	return false;
    }
    return url.length == urlItems.length ||
        url[urlItems.length] == '?' ||
	url[urlItems.length] == '#';
}


function showBackpackUrl() {
    chrome.tabs.getAllInWindow(
        undefined,
        function(tabs) {
            for (var i = 0, tab; tab = tabs[i]; i++) {
                if (tab.url && isTF2ItemsUrl(tab.url)) {
                    chrome.tabs.update(tab.id, {selected: true});
                    return false;
                }
            }
            chrome.tabs.create({url:getBackpackViewUrl()});
	    return false;
        }
    )
}




function addAvatar(node) {
    var img = document.createElement("img")
    // img.setAttribute("width", "64")
    // img.setAttribute("height", "64")
    img.setAttribute("src", node.textContent)
    document.getElementById("new_items").appendChild(img)
}


function loadItemData() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
	if (req.readyState == 4) {
	    itemData = eval("( " + req.responseText + ")")
		console.log(itemData)
		}
    }
    req.open("GET", chrome.extension.getURL('/data/items.json'), true)
    req.send()
}


function loadAndShowBackpack() {
    chrome.extension.sendRequest(
        {get:"backpackXml"},
        function(response) {
            var doc = response.doc;
            var xdoc = (new DOMParser()).parseFromString(doc, "text/xml");
	    backpackXml = xdoc;
	    putImages();
	    var nodes = xdoc.evaluate(avatarSelect, xdoc, null, XPathResult.ANY_TYPE, null)
            var node = nodes.iterateNext()
            if (node) {
		//addAvatar(node)
	    }
	}
    )
}

function missingImage(img, typ) {
    if (img) {
	//img.parentNode.innerHTML = "" + typ;
	img.src = "images/missing.png";
	img.onerror = null;
	return true;
    }
}

function putNewItem(node, pos) {
    var type = node.getAttribute("definitionIndex");
    if (type == undefined) {
	return;
    }
    var element = $("table.unplaced td:eq("+pos+")");
    element.append("<img src='images/" + type + ".png' onerror='missingImage(this, " + type + ")' />");
    //var level = node.getElementsByTagName("level")[0].textContent
    // node also has uniqueId, quality, position, quantity tags with text
    // node also has attributes tag
}


var gnode;

function putOldItem(node, pos) {
   // 0x8 CCC SSSS
    //console.log(node, pos);
    var type = node.getAttribute("definitionIndex");
    var element = $("table.backpack td:eq("+pos+")");
    element.append("<img src='images/" + type + ".png' onerror='missingImage(this, " + type + ")' />");
}


function putImages() {
    if (!backpackXml) {
	console.log('empty backpackXml');
	return;
    }
    var position = 0;
    var nodes = backpackXml.evaluate(newItemSelect, backpackXml);
    var node = nodes.iterateNext()
    while (node) {
        putNewItem(node, position);
	position += 1;
	node = nodes.iterateNext();
    }
    if (position > 0) {
	$("#unplaced, hr.unplaced").show()
    }

    nodes = backpackXml.evaluate(oldItemSelect, backpackXml);
    node = nodes.iterateNext();
    position = 0;
    while (node) {
        var p = node.getElementsByTagName("position")[0].firstChild.textContent;
	var q = parseInt(p) & 0xffff;
        // wha? (2155872335 & 0x80000000 && 2155872335 & 0x0FFF0000).toString(16)
	//console.log(node, p, q);
	gnode = node;
	putOldItem(node, q-1);
	position += 1;
	node = nodes.iterateNext();

    }

}


function showToolTip(event) {
    var toolTip = $("#tooltip");
    toolTip.show();
    var cell = $(this)
    var pos = cell.position();
    toolTip.css({left:pos.left - toolTip.width()/2 + cell.width()/2,
		 top:pos.top + cell.height() + 12});
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

    $("table.backpack td, table.unplaced td").mouseenter(showToolTip).mouseleave(hideToolTip);
    $("#tooltip").hide();

    $(".nav:first a").click(function (e) { nav(-1) });
    $(".nav:last a").click(function (e) { nav(1) });
}
