var profileIdTextbox;
var saveButton;

function save() {
  localStorage.profileId = profileIdTextbox.value;
  markClean();
  chrome.extension.getBackgroundPage().backgroundInit();
}

function markDirty() {
  saveButton.disabled = false;
}

function markClean() {
  saveButton.disabled = true;
}

function optionsInit() {
  profileIdTextbox = document.getElementById("profile-id");
  saveButton = document.getElementById("save-button");
  profileIdTextbox.value = localStorage.profileId || "";
  markClean();
}

optionsInit();
