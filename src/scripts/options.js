function markDirty() {
    $("#saveButton").attr("disabled", false);
}


function markClean() {
    $("#saveButton").attr("disabled", true);
}


function save() {
    var newProfileId = $("#profileId").attr("value");
    if (newProfileId != getProfileId()) {
	var lookupId = lookupProfileId(newProfileId);
	if (!lookupId) {
	    $("#profileId").select().focus();
	    $("#msg").text("SteamID not found.  Please try again.")
		.fadeIn()
		.delay(5000)
		.fadeOut();
	    return
	} else {
	    if (newProfileId != lookupId) {
		$("#msg").text("Using SteamID " + lookupId + " for " + newProfileId + ".")
		    .fadeIn()
		    .delay(5000)
		    .fadeOut();
	    }
	    $("#profileId").attr("value", lookupId);
	    setProfileId(lookupId);
	}
    }
    //setSaveLocal($("input[name=saveLocal]:checked").attr("value"));
    //setDebug($("input[name=debug]:checked").attr("value"));
    markClean();
    chrome.extension.getBackgroundPage().backgroundInit();
}


function optionsInit() {
    $("#profileId").attr("value", getProfileId());
    $("#profileId").change(markDirty);
    $("#saveButton").click(save);
    $("#cancelButton").click(optionsInit);
    //$("input[name=debug][value=" + getDebug() + "]").attr("checked", true);
    //$("input[name=saveLocal][value=" + getSaveLocal() + "]").attr("checked", true);
    //$("input[name=debug], input[name=saveLocal]").change(markDirty);
    markClean();
}
