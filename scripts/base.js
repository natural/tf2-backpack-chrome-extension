var tf2ItemsUrl = "http://www.tf2items.com/";
var profileIdSearchUrl = tf2ItemsUrl + "search.php?tf2items_q=";
var steamCommunityUrl = "http://steamcommunity.com/";
var sourceOpUrl = "http://www.sourceop.com/";
var pnaturalUrl = steamCommunityUrl + "profiles/76561197992805111";
var steamIdPattern = /\d{17}/;


function lookupProfileId(v) {
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
    return (id != "") ? tf2ItemsUrl + "profiles/" + id : tf2ItemsUrl;
}


function getProfileUrl() {
    var id = getProfileId();
    return (id != "") ? steamCommunityUrl + "profiles/" + id : steamCommunityUrl;
}


function getXmlUrl() {
    if (getDebug()) {
	console.log("using test backpack xml");
	return chrome.extension.getURL("/data/test-backpack.xml");
    }
    var id = getProfileId();
    return (id != "") ? tf2ItemsUrl + "packxml.php?profileid=" + id : "";
}
