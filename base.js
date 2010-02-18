var baseUrl = "http://www.tf2items.com/"
    // http://steamcommunity.com/profiles/76561197992805111/tfitems?json=1



function getProfileId() { return localStorage.profileId || "" }


function getTF2ItemsUrl() {
    var id = getProfileId();
    return (id != "") ? baseUrl + "/profiles/" + id : baseUrl
}


function getFeedUrl() {
    var id = getProfileId()
    return (id != "") ? baseUrl + "packxml.php?profileid=" + id : ""
}
