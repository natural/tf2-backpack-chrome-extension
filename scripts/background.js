var backpackXml;                           // xml string passed back when messaged
var animationFrames = 36;
var animationSpeed = 10;                   // ms
var canvas;
var canvasContext;
var rotation = 0;
var requestFailureCount = 0;              // used for exponential backoff
var requestTimeout = 1000 * 2;            // 5 seconds
var pollIntervalMin = 1000 * 60;          // 1 minute
var pollIntervalMax = 1000 * 60 * 60;     // 1 hour
var loadingAnimation = new LoadingAnimation();
var lastCount;


function ease(x) {
    return (1-Math.sin(Math.PI/2+x*Math.PI))/2;
}


function animateFlip() {
    rotation += 1/animationFrames;
    drawIconAtRotation();
    if (rotation <= 1) {
        setTimeout("animateFlip()", animationSpeed);
    } else {
        rotation = 0;
	drawIconAtRotation();
	//chrome.browserAction.setBadgeText({
	//    text: unreadCount != "0" ? unreadCount : ""
	//});
	//chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
    }
}


function drawIconAtRotation() {
    canvasContext.save();
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.translate(
	Math.ceil(canvas.width/2),
	Math.ceil(canvas.height/2)
			    );
    canvasContext.rotate(2*Math.PI*ease(rotation));
    canvasContext.drawImage(
	tf2icon,
	-Math.ceil(canvas.width/2),
	-Math.ceil(canvas.height/2)
			    );
    canvasContext.restore()
    chrome.browserAction.setIcon(
	{imageData:canvasContext.getImageData(0, 0, canvas.width,canvas.height)}
				 );
}


function LoadingAnimation() {
    this.timerId_ = 0;
    this.maxCount_ = 8;  // Total number of states in animation
    this.current_ = 0;   // Current state
    this.maxDot_ = 4;    // Max number of dots in animation
}


LoadingAnimation.prototype.paintFrame = function() {
    var text = "";
    for (var i = 0; i < this.maxDot_; i++) {
        text += (i == this.current_) ? "." : " ";
    }
    if (this.current_ >= this.maxDot_) {
        text += "";
    }
    chrome.browserAction.setBadgeText({text:text})
    this.current_++
    if (this.current_ == this.maxCount_) {
        this.current_ = 0
	    };
}


LoadingAnimation.prototype.start = function() {
    if (this.timerId_) {
	return;
    }
    var self = this;
    this.timerId_ = window.setInterval(function() { self.paintFrame() }, 100);
}


LoadingAnimation.prototype.stop = function() {
    if (!this.timerId_) {
        return;
    }
    window.clearInterval(this.timerId_)
    this.timerId_ = 0;
}


function updateNewItemCount(count, color) {
    if (count != lastCount) {
	lastCount = count;
	    // animateFlip()
	count = count.toString();
	chrome.browserAction.setBadgeText({text:count == "0" ? "" : count});
	chrome.browserAction.setBadgeBackgroundColor(
	    {color:color == null ? [130, 68, 27, 255] : color}
	);
	console.log("updated");
    } else {
	console.log("not updated");
    }
}


function startItemCheck() {
    getNewItemCount(
        function(nonHatCount, hatCount, doc) {
            setEnabledIcon();
            loadingAnimation.stop();
            updateNewItemCount(nonHatCount + hatCount, hatCount > 0 ? [0, 128, 0, 255] : null);
	    backpackXml = doc;
            scheduleCheck();
	    console.log("checked");
        },
        function() {
            loadingAnimation.stop();
            // showLoggedOut()
            scheduleCheck();
        }
    )
}


function getNewItemCount(onSuccess, onError) {
    var request = new XMLHttpRequest()
    var abortTimerId = window.setTimeout(function() { request.abort() },
                                         requestTimeout);
    function handleSuccess(nonCount, hatCount, doc) {
        requestFailureCount = 0;
        window.clearTimeout(abortTimerId);
        if (onSuccess) { onSuccess(nonCount, hatCount, doc) }
    }

    function handleError() {
        ++requestFailureCount;
        window.clearTimeout(abortTimerId);
        if (onError) { onError() }
    }

    try {
        request.onreadystatechange = function() {
            if (request.readyState != 4) {
		return;
	    }
            if (request.responseXML) {
		var hatCount = parseInt($("totalJustFound hats", request.responseXML).text());
		var nonCount = parseInt($("totalJustFound nonHats", request.responseXML).text());
                if (hatCount + nonCount) {
                    handleSuccess(nonCount, hatCount, request.responseText);
                    return;
                }
            }
            handleError();
        }
        request.onerror = function(error) { handleError() }
        var url = getXmlUrl();
        if (url != "") {
            request.open("GET", getXmlUrl(), true);
            request.send(null);
        }
    } catch(e) {
        console.error(e);
        handleError();
    }
}


function scheduleCheck() {
    var randomness = Math.random() * 2;
    var exponent = Math.pow(2, requestFailureCount);
    var delay = Math.min(randomness * pollIntervalMin * exponent,
                         pollIntervalMax);
    delay = Math.round(delay);
    window.setTimeout(startItemCheck, delay);
}


function setEnabledIcon() {
    chrome.browserAction.setIcon({path:"icons/icon.png"});
}

function setDisabledIcon() {
    chrome.browserAction.setIcon({path:"icons/icon_disabled.png"});
    updateNewItemCount("?", [128, 128, 128, 255]);
}


function backgroundInit() {
    canvas = document.getElementById("canvas");
    tf2icon = document.getElementById("tf2icon");
    canvasContext = canvas.getContext("2d");
    setDisabledIcon();
    updateNewItemCount("");
    if (getProfileId() != "") {
	loadingAnimation.start();
    }
    startItemCheck();
    chrome.extension.onRequest.addListener(
        function(request, sender, sendResponse) {
            if (request.get == "backpackXml") {
                sendResponse({doc:backpackXml});
            } else {
                sendResponse({});
            }
	});
    console.log("extension background init 6");
}
