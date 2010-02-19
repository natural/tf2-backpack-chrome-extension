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


function putNewItem(node) {
    var div = document.createElement("div")
    var type = node.getAttribute("definitionIndex")
    var level = node.getElementsByTagName("level")[0].textContent
    // node also has uniqueId, quality, position, quantity tags with text
    // node also has attributes tag
    div.innerHTML = "type: " + type + " "

    var item = itemData[type]
	if (item) {
	    div.innerHTML += " name:" + item['description']
	}
    document.getElementById("new_items").appendChild(div)
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

    testImages();

	    var nodes = xdoc.evaluate(avatarSelect, xdoc, null, XPathResult.ANY_TYPE, null)
            var node = nodes.iterateNext()
            if (node) {
		//addAvatar(node)
	    }

            var nodes = xdoc.evaluate(newItemSelect, xdoc, null, XPathResult.ANY_TYPE, null)
            var node = nodes.iterateNext()
            while (node) {
                putNewItem(node)
		node = nodes.iterateNext()
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

function putOldItem(node, pos) {
    //console.log(node, pos);
    var id = node.getAttribute("definitionIndex");
    var element = $("table.backpack td:eq("+pos+")")
    element.append("<img src='images/" + id + ".png' height='32' width='32' onerror='missingImage(this)' />");

}


function testImages() {
    // $("table.backpack:first td:first").append("<img src='images/35.png' />")
    if (!backpackXml) {
	console.log('empty backpackXml');
	return;
    }
    var nodes = backpackXml.evaluate(oldItemSelect, backpackXml);
    node = nodes.iterateNext();
    var position = 0;
    while (node) {
	gnode = node;
	putOldItem(node, position);
	position += 1;
	node = nodes.iterateNext();

    }
}


function popupInit() {
    loadItemData();
    loadAndShowBackpack();
    $("table.backpack td").click(function () {
	    $("table.backpack td").removeClass("cellFg");
	    $(this).addClass("cellFg");
	    console.log("this", this);
	});
}
