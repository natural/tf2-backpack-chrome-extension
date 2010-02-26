var alsoRefresh = false;


function markDirty() {
    $("#saveButton").attr("disabled", false);
}


function markClean() {
    $("#saveButton").attr("disabled", true);
}


function save() {
    var newProfileId = $("#profileId").attr("value");
    if (newProfileId != storage.profileId()) {
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
	    storage.profileId(lookupId);
	}
    }
    //markClean();
    chrome.extension.getBackgroundPage().backgroundInit();
    if (alsoRefresh) {
        $("body > *:not(#unknownProfile)").fadeIn();
	hideToolTip();
	$("#unknownProfile").fadeOut();
	popupInit();
    }
}


function optionsInit() {
    $("#profileId").attr("value", storage.profileId());
    $("#profileId").change(markDirty);
    $("#saveButton").click(save);
    $("#cancelButton").click(optionsInit);
    markClean();
}


function optionsAltInit() {
    alsoRefresh = true;
    $("#profileId").attr("value", storage.profileId());
    $("#profileId").change(markDirty);
    $("#saveButton").click(save);
    $("#cancelButton").click(optionsAltInit);
    markDirty();
}

