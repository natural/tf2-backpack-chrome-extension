var tf2ItemsUrl = "http://www.tf2items.com/";
var steamCommunityUrl = "http://steamcommunity.com/";
var profileIdSearchUrl = "http://www.tf2items.com/search.php?tf2items_q=";

// search interface:
// http://www.tf2items.com/search.php?tf2items_q=pnatural
// returns: {"success":"true","profile":"76561197992805111"}

function lookupProfileId(v) {
    var steamIdPattern = /\d{17}/;
    if (v.match(steamIdPattern)) {
	return v;
    }
    var searchResult;
    var searchRequest = new XMLHttpRequest();
    searchRequest.onreadystatechange = function() {
	if (searchRequest.readyState == 4) {
	    var message = eval("(" + searchRequest.responseText + ")");
	    if (message.success == "true") {
		searchResult = message.profile
	    }
	}
    }
    searchRequest.open("GET", profileIdSearchUrl + v, false);
    searchRequest.send(null);
    return searchResult;
}


function getProfileId() { return localStorage.profileId || "" }
function setProfileId(v) { localStorage.profileId = v }


function getSaveLocal() { return localStorage.saveLocal == "true" || false }
function setSaveLocal(v) { localStorage.saveLocal = v }


function getDebug() { return localStorage.debug == "true" || false }
function setDebug(v) { localStorage.debug = v }


function getBackpackViewUrl() {
    var id = getProfileId();
    return (id != "") ? tf2ItemsUrl + "/profiles/" + id : tf2ItemsUrl;
}


function getXmlUrl() {
    if (getDebug()) {
	console.log("using test backpack xml");
	return chrome.extension.getURL("/data/test-backpack.xml");
    }
    var id = getProfileId();
    return (id != "") ? tf2ItemsUrl + "packxml.php?profileid=" + id : "";
}


function getJsonUrl() {
    var id = getProfileId();
    return (id != "") ? steamCommunityUrl + "profiles/" + id + "/tfitems?json=1" : ""
}
