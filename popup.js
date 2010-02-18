var gdoc
var newItemSelect = "/backpack/items/item/position[text()='0']/.."
var avatarSelect = "/backpack/avatarFull"
var itemData


function isTF2ItemsUrl(url) {
    var urlItems = getTF2ItemsUrl()
    if (url.indexOf(urlItems) != 0) {
	return false
    }
    return url.length == urlItems.length ||
                         url[urlItems.length] == '?' ||
                         url[urlItems.length] == '#'
}


function showBackpackUrl() {
    chrome.tabs.getAllInWindow(
        undefined,
        function(tabs) {
            for (var i = 0, tab; tab = tabs[i]; i++) {
                if (tab.url && isTF2ItemsUrl(tab.url)) {
                    chrome.tabs.update(tab.id, {selected: true})
                    return false
                }
            }
            chrome.tabs.create({url:getTF2ItemsUrl()})
	    return false
        }
    )
}


function addItem(node) {
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
        {get:"backpack"},
        function(response) {
            var doc = response.doc
            xdoc = (new DOMParser()).parseFromString(doc, "text/xml")
	    var nodes = xdoc.evaluate(avatarSelect, xdoc, null, XPathResult.ANY_TYPE, null)
            var node = nodes.iterateNext()
            if (node) {
		//addAvatar(node)
	    }

            var nodes = xdoc.evaluate(newItemSelect, xdoc, null, XPathResult.ANY_TYPE, null)
            var node = nodes.iterateNext()
            while (node) {
                addItem(node)
		node = nodes.iterateNext()
            }

	}
    )
}


function popupInit() {
    loadItemData();
    loadAndShowBackpack();
}
