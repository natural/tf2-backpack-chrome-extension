var backpackXml;
var newItemSelect = "/backpack/items/item/position[text()='0']/..";
var oldItemSelect = "/backpack/items/item/position[text()!='0']/..";
var avatarSelect = "/backpack/avatarFull";
var itemData;


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
    img.setAttribute("width", "64")
    img.setAttribute("height", "64")
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
    req.open("GET", chrome.extension.getURL('/items.json'), true)
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

function missingImage(img) {
    if (img) {
	img.parentNode.innerHTML = "";
	//img.parentNode.innerHTML = "<center>missing image</center>";
	//img.src = "images/127.png";
	//img.onerror = null;
	return true;
    }
}

function putNewItem(node, pos) {
    var type = node.getAttribute("definitionIndex");
    var element = $("table.unplaced td:eq("+pos+")");
    element.append("<img src='images/" + type + ".png' height='42' width='42' onerror='missingImage(this)' />");
    //var level = node.getElementsByTagName("level")[0].textContent
    // node also has uniqueId, quality, position, quantity tags with text
    // node also has attributes tag
}


function putOldItem(node, pos) {
    //console.log(node, pos);
    var type = node.getAttribute("definitionIndex");
    var element = $("table.backpack td:eq("+pos+")");
    element.append("<img src='images/" + type + ".png' height='42' width='42' onerror='missingImage(this)' />");

}


function putImages() {
    // $("table.backpack:first td:first").append("<img src='images/35.png' />")
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

    nodes = backpackXml.evaluate(oldItemSelect, backpackXml);
    node = nodes.iterateNext();
    position = 0;
    while (node) {
	gnode = node;
	putOldItem(node, position);
	position += 1;
	node = nodes.iterateNext();

    }

}

function yOf(e) {
    var y = 0;
    while (e) {
        y+=e.offsetTop;
	e = e.offsetParent;
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


function popupInit() {
    loadItemData();
    loadAndShowBackpack();
    $("table.backpack td").click(function () {
	    $("table.backpack td").removeClass("cellFg");
	    $(this).addClass("cellFg");
	    console.log("this", this);
	});

    $("table.backpack td, table.unplaced td").mouseenter(showToolTip).mouseleave(hideToolTip);
    $("#tooltip").hide()

}
