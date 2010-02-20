function markDirty() {
    $("#saveButton").attr("disabled", false);
}


function markClean() {
    $("#saveButton").attr("disabled", true);
}


function save() {
    var newProfileId = $("#profileId").attr("value");
    if ( newProfileId != getProfileId()) {
	var lookupId = lookupProfileId(newProfileId);
	if (lookupId == null) {
	    alert("no id found");
	    return
	} else {
	    $("#profileId").attr("value", lookupId);
	    setProfileId(lookupId);
	}
    }
    setSaveLocal($("input[name=saveLocal]:checked").attr("value"));
    setDebug($("input[name=debug]:checked").attr("value"));

    markClean();
    chrome.extension.getBackgroundPage().backgroundInit();
}


function optionsInit() {
    $("#profileId").attr("value", getProfileId());
    $("#profileId").change(markDirty);
    $("#saveButton").click(save);
    $("#cancelButton").click(optionsInit);
    $("input[name=debug][value=" + getDebug() + "]").attr("checked", true);
    $("input[name=saveLocal][value=" + getSaveLocal() + "]").attr("checked", true);
    $("input[name=debug], input[name=saveLocal]").change(markDirty);
    markClean();
}


