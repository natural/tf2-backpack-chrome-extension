var originalMsg = "";


function markDirty() {
    $("#save").attr("disabled", false);
}


function markClean() {
    $("#save").attr("disabled", true);
}


function save(cb) {
    var newProfileId = $("#profileId").attr("value");
    if (newProfileId == storage.profileId()) { return; }
    profile.search(
	newProfileId,
	function(foundId) {
	    if (newProfileId != foundId) {
		$("#msg").text("Using SteamID " + foundId + " for " + newProfileId + ".")
	        .fadeIn()
	        .delay(5000)
	        .fadeOut();
            }
            $("#profileId").attr("value", foundId);
            storage.profileId(foundId);
	    if (cb) { cb() }
	},
	function(error) {
	    error = error ? (error.statusText||"Network error") : "Fetch error";
	    var msg = "(" + error + ")";
	    $("#profileId").select().focus();
	    $("#msg").text("SteamID not found.  Please try again " + msg + ".").fadeIn();
	});
}


function optionsInit(callback) {
    if (!originalMsg) {
	originalMsg = $("#msg").text()
    }
    $("#profileId").attr("value", storage.profileId()).select();
    $("#profileId").change(markDirty);
    $("#save").click(function() {save(callback)} );
    $("#cancel").click(optionsInit);
    $("#msg").text(originalMsg);
    $("#unknownProfile input:first").select();
    if (callback) {
	markDirty();
    } else {
	markClean();
    }
}
