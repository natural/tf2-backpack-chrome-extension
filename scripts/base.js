var tf2ItemsUrl = "http://www.tf2items.com/";
var steamCommunityUrl = "http://steamcommunity.com/";


function getDebug() {
    return localStorage.debug == "true" || false;
}


function setDebug(v) {
    localStorage.debug = v;
}


function getProfileId() {
    return localStorage.profileId || "";
}


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
