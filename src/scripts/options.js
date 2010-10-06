var originalMsg = "";


var markDirty = function() {
    $("#save").attr("disabled", false);
};


var markClean = function() {
    $("#save").attr("disabled", true);
};


var save = function(cb) {
    BaseStorage.set('useNotifications', $("#useToast").attr("checked"));

    var newProfileId = $("#profileId").attr("value");
    if (newProfileId == BaseStorage.profileId()) { return; }
    profile.search(
	newProfileId,
	function(profiles) {
	    var foundId = profiles[0]['id'];
	    if (newProfileId != foundId) {
		$("#msg").text(_({key: "profile_found", subs:[foundId, newProfileId]}))
	        .fadeIn()
	        .delay(5000)
	        .fadeOut();
            }
            $("#profileId").attr("value", foundId);
	    BaseStorage.clear();
            BaseStorage.profileId(foundId);
	    chrome.extension.sendRequest({type:"driver", message:"refresh"},
					 function(response) {});
	    if (cb) { cb() }
	},
	function(error) {
	    error = error ? (error.statusText||_("network_error")) : _("other_error");
	    var msg = "(" + error + ")";
	    $("#profileId").select().focus();
	    $("#msg").text("SteamID not found.  Please try again " + msg + ".").fadeIn();
	}
    );
};


var optionsInit = function(callback) {
    i18nize();
    if (!originalMsg) {
	originalMsg = $("#msg").text()
    }
    $("#profileId").attr("value", BaseStorage.profileId()).select();
    $("#profileId").change(markDirty);
    $("#profileId").keypress(function(e) {
	if (e.keyCode==13) {
	    save(callback);
	} else {
	    markDirty();
	}
    });

    $("#useToast").attr("checked", BaseStorage.get('useNotifications', {missing:false}));
    $("#useToast").change(markDirty);

    $("#save").click(function() {save(callback)} );
    $("#cancel").click(optionsInit);
    $("#msg").text(originalMsg);
    $("#unknownProfile input:first").focus().select();
    if (callback) {
	markDirty();
    } else {
	markClean();
    }
};
