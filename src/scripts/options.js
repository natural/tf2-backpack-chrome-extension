var alsoRefresh = false;


function markDirty() {
    $("#save").attr("disabled", false);
}


function markClean() {
    $("#save").attr("disabled", true);
}


function save() {
    var newProfileId = $("#profileId").attr("value");
    if (newProfileId == storage.profileId()) { return; }

    profile.search(
	newProfileId,
	function(lookupId) {
	    if (newProfileId != lookupId) {
		$("#msg").text("Using SteamID " + lookupId + " for " + newProfileId + ".")
	        .fadeIn()
	        .delay(5000)
	        .fadeOut();
            }
            $("#profileId").attr("value", lookupId);
            storage.profileId(lookupId);
	    chrome.extension.getBackgroundPage().backgroundInit();
	    if (alsoRefresh) {
		$("body > *:not(#unknownProfile)").fadeIn();
		hideToolTip();
		$("#unknownProfile").fadeOut();
		popupInit();
	    }
	},
	function(error) {
	    error = error ? (error.statusText||"Network error") : "Fetch error";
	    var msg = "(" + error + ")";
	    $("#profileId").select().focus();
	    $("#msg").text("SteamID not found.  Please try again " + msg + ".").fadeIn();
	});
}

var originalMsg = "";

function cancel() {
    optionsAltInit();
    $("#msg").text(originalMsg);
}


function optionsInit() {
    $("#msg").text();
    $("#profileId").attr("value", storage.profileId()).select();
    $("#profileId").change(markDirty).keypress(markDirty);
    $("#save").click(save);
    $("#cancel").click(optionsInit);
    markClean();
}


function optionsAltInit() {
    if (!originalMsg) {
	originalMsg = $("#msg").text()
    }
    alsoRefresh = true;
    $("#profileId").attr("value", storage.profileId());
    $("#profileId").change(markDirty);
    $("#save").click(save);
    $("#cancel").click(cancel);
    $("#unknownProfile input:first").select();
    markDirty();
}

