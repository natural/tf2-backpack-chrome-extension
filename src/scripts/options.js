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
	    if (alsoRefresh) {
		$("#unknownProfile").fadeOut('fast', function() {
		    $("#main").fadeIn().delay(1000);
		    popupInit();
		    pageOps.requestRefresh();
		});
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

