var steamIdPattern = /\d{17}/;
var urls = {
    tf2Items:"http://www.tf2items.com/",
    steamCommunity:"http://steamcommunity.com/",
    sourceOp:"http://www.sourceop.com/",
};


urls.profileSearch = urls.tf2Items + "search.php?tf2items_q=";
urls.pnatural = urls.steamCommunity + "profiles/76561197992805111";


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
    searchRequest.open("GET", urls.profileSearch + v, false);
    searchRequest.send(null);
    return searchResult;
}


function getProfileId()  { return localStorage.profileId || "" }
function setProfileId(v) { localStorage.profileId = v }


function getSaveLocal()  { return localStorage.saveLocal == "true" || false }
function setSaveLocal(v) { localStorage.saveLocal = v }


function getDebug()  { return localStorage.debug == "true" || false }
function setDebug(v) { localStorage.debug = v }


function getTestXml()  { return localStorage.testXml || "" }
function setTestXml(v) { localStorage.testXml = v }


function getTestJson()  { return localStorage.testJson || "" }
function setTestJson(v) { localStorage.testJson = v }


function getBackpackViewUrl() {
    var id = getProfileId();
    return id ? urls.tf2Items + "profiles/" + id : urls.tf2Items;
}


function getProfileUrl() {
    var id = getProfileId();
    return id ? urls.steamCommunity + "profiles/" + id : urls.steamCommunity;
}


function getXmlUrl() {
    if (getTestXml()) {
	return chrome.extension.getURL(getTestXml());
    }
    var id = getProfileId();
    return id ? urls.tf2Items + "packxml.php?profileid=" + id : "";
}


function getJsonUrl() {
    // e.g., http://steamcommunity.com/profiles/<steam ID>/tfitems?json=1
    if (getTestJson()) {
	return chrome.extension.getURL(getTestJson());
    }
    var id = getProfileId();
    return id ? urls.steamCommunity + "profiles/" + id + "/tfitems?json=1" : "";
}
