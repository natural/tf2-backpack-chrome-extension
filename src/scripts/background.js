/*

*/


// encapsulates the tf2 item schema and the players backpack items.
var WebDataTool = {
    init: function() {
	console.info('WebDataTool.init complete')
    },

    getSchema: function(options) {
	options = options || {}
	var lang = options['lang'], onSuccess = options['success'], onError = options['error']
	lang = lang ||  _('language_code')
	// TODO:  cache with checks, not blindly
	var schema = BaseStorage.get('schema-'+lang, {decoder: function(v) { return v }})
	if (schema) {
	    if (onSuccess) { onSuccess(schema) }
	} else {
	    NetTool.get({
		url: urls.apiSchema+'?lang='+lang,
		success: function(schema) {
		    BaseStorage.set('schema-'+lang, schema, {encoder:function(v) { return v} })
		    if (onSuccess) { onSuccess(schema) }
		},
		error: function(error) {
		    if (onError) { onError(error) }
		}
	    })
	}
    },

    getPlayerItems: function(options) {
	options = options || {}
	var id64 = options['id64'], onSuccess = options['success'], onError = options['error']
	if (!id64) {
	    if (onError) { onError('no id64 parameter given') }
	} else {
	    var items = BaseStorage.get('items-'+id64, {decoder: function(v) { return v }})
	    if (items) {
		if (onSuccess) { onSuccess(items) }
		return
	    }
	    NetTool.get({
		url: urls.apiPlayerItems+id64,
		success: function(items) {
		    BaseStorage.set('items-'+id64, items, {encoder:function(v) { return v} })
		    if (onSuccess) { onSuccess(items) }
		},
		error: function(error) { if (onError) { onError(error) }}
	    })
	}
    },

    getPlayerProfile: function(options) {
	options = options || {}
	var id64 = options['id64'], onSuccess = options['success'], onError = options['error']
	if (!id64) {
	    if (onError) { onError('no id64 parameter given') }
	} else {
	    var profile = BaseStorage.get('profile-'+id64, {decoder: function(v) { return v }})
	    if (profile) {
		if (onSuccess) { onSuccess(profile) }
		return
	    }
	    NetTool.get({
		url: urls.apiProfile+id64,
		success: function(profile) {
		    BaseStorage.set('profile-'+id64, profile, {encoder:function(v) { return v} })
		    if (onSuccess) { onSuccess(profile) }
		},
		error: function(error) { if (onError) { onError(error) }}
	    })
	}
    },

    searchPlayers: function(options) {
	options = options || {}
	var q = options['q'], onSuccess = options['success'], onError = options['error']
	if (!q) {
	    if (onError) { onError('no search query given') }
	} else {
	    NetTool.get({
		url: urls.apiSearch+q,
		success: function(results) { if (onSuccess) { onSuccess(results) }},
		error: function(error) { if (onError) { onError(error) }}
	    })
	}
    }
}


// animation to spin the badge icon; based on the gmail checker
// extension.
var BadgeIcon = {
    canvas: null,
    context: null,
    frames: 48,
    rotation: 0,
    speed: 15,

    init: function() {
	this.canvas = $('#canvas')[0]
	this.icon = $('#icon')[0]
	this.context = this.canvas.getContext('2d')
	this.enabled(false)
	console.info('BadgeIcon.init complete')
    },

    // nice easing
    ease: function(x) {
	return (1-Math.sin(Math.PI/2+x*Math.PI))/2
    },

    // update for the next frame and call to redraw
    next: function() {
	this.rotation += 1/this.frames
	this.draw()
	if (this.rotation <= 1) {
	    setTimeout('BadgeIcon.next()', this.speed)
	} else {
	    this.rotation = 0
	    this.draw()
	}
    },

    // draw the current frame
    draw: function() {
	var ceil = Math.ceil
	var width = this.canvas.width
	var height = this.canvas.height
	var context = this.context
	context.save()
	context.clearRect(0, 0, width, height)
	context.translate(ceil(width/2), ceil(height/2))
	context.rotate(2*Math.PI*this.ease(this.rotation))
	context.drawImage(this.icon, -ceil(width/2), -ceil(height/2))
	context.restore()
	chrome.browserAction.setIcon(
	    {imageData: context.getImageData(0, 0, width, height)}
	)
    },

    // show the enabled or disabled icon
    enabled: function(v) {
	chrome.browserAction.setIcon(
            {path:v ? 'media/icon.png' : 'media/icon_disabled.png'}
        )
    },
}


// encapsulates feed checking and the scheduling.
var FeedDriver = {
    countHats: 0,
    countNotHats: 0,
    countTotal: 0,
    pollDuration: 0,
    pollLast: 0,
    pollNext: 0,
    requestBackoff: 0,
    requestError: null,
    requestFails: 0,
    requestOkays: 0,
    scheduleId: null,
    timeoutMin: 1000*10,

    init: function() {
	chrome.extension.onRequest.addListener(this.listen)
	this.start()
	console.info('FeedDriver.init complete')
    },

    toJSON: function() {
	var r = {}
	for (var k in FeedDriver) {
	    var v = FeedDriver[k]
	    if (typeof(v) != 'function') {
		r[k] = v
	    }
	}
	return r
    },

    // schedule an xhr request to happen after a delay
    schedule: function(delay) {
	if (typeof(delay) == 'undefined') {
	    var rnd = Math.random() * 2
	    var exp = Math.pow(2, this.requestBackoff)
	    var pmax = BaseStorage.get('pollMax', {missing:1000*60*15})
	    var pmin = BaseStorage.get('pollMin', {missing:1000*60*5})
	    delay = Math.min(pmax, rnd * pmin * exp)
	    delay = Math.max(pmin, delay)
	}
	delay = Math.round(delay)
	this.pollNext = Date.now() + delay
	window.clearTimeout(this.scheduleId)
	this.scheduleId = window.setTimeout(this.start, delay)
    },

    // begin a new xhr request for the backpack feed
    feedUrl: function () {
	var id = BaseStorage.profileId()
	return id ? urls.tf2Items + 'packxml.php?profileid=' + id : ''
    },

    start: function() {
	var self = FeedDriver, url = this.feedUrl()
	if (!url) {
	    self.onError('error', _('feed_url_error'))
	    return
	}
	var error = function(req, status, error) {
	    switch (status) {
	        case 'timeout':
		    self.onError('abort', _('request_aborted'))
		    break
                case 'parseerror':
		    self.onError('error', _('parse_error'))
		    break
	        case 'feederror':
		    self.onError('error', _(error))
		    break
	        case 'feedwarning':
		    self.onError('warning', _(error))
		    break
	        default: /* covers 'error' and null values, and everything else, too */
		    self.onError('error', _('network_error'))
	    }
	}
	var success = function(xml, status, req) {
	    try {
		var errmsg = $('error', xml).text()
		var warnmsg = $('warningMessage', xml).text()
		if (errmsg) {
		    error(null, 'feederror', _(errmsg))
	        } else if (warnmsg) {
		    error(null, 'feedwarning', _(warnmsg))
		} else {
		    self.onSuccess(xml, req.responseText)
		}
	    } catch (e) {
		error(null, 'exception', _(e))
	    }
	}
	self.pollDuration = 0
	return
	$.ajax({url: url, async: true, dataType: 'xml', error: error,
		success: success, timeout: self.timeoutMin, })
    },

    onCommon: function() {
        this.pollLast = Date.now()
	this.pollDuration = this.pollNext==0 ? 0 : this.pollLast - this.pollNext
	this.schedule()
    },

    // request errored
    onError: function(status, message) {
	this.onCommon()
	this.requestFails++
	this.requestBackoff++
	this.requestError = message
	BadgeIcon.enabled(false)
        BadgeText.stop('?', colors.grey)
	chrome.extension.sendRequest({status: status, type: 'refresh', message: message})
    },

    // request successful xml present but not yet checked
    onSuccess: function(xml, text) {
	this.onCommon()
	this.requestOkays++
	this.requestBackoff = 0
	this.requestError = ''
	this.updateCounts(xml)
	BadgeIcon.enabled(true)
	var cs = 'backpack cachedTime'
	//var same = $(cs, BaseStorage.cachedFeed()).text() == $(cs, text).text()
	var same = true
	BaseStorage.set('xmlCache', text)
	chrome.extension.sendRequest({status: 'okay', type: 'refresh', updated: !same})
    },

    updateCounts: function(xml) {
	var self = this
	var lastTotal = this.countTotal

	var defsError = function(req, status, error) {
	    console.log(req, status, error)
	    self.countHats = 0
	}
	var defsLoaded = function(data, status, req) {
	    var defs = JSON.parse(data)
	    var hc = function (index, node) {
		return defs[$(node).attr('definitionIndex')]['type']
	    }
            var newNodes = $('item', xml).filter(function (index) {
                return $('position', this).text() == '0'
	    }).map(hc)

	    Toaster.showItems(
		$('item', xml).filter(function (index) {
                    return $('position', this).text() == '0'
		})
	    )

	    self.countHats = $.grep(newNodes, function(node, index) {
		return node=='Hat' }).length
	    self.countNotHats = textNodeInt('totalJustFound nonHats', xml)
	    self.countTotal = self.countNotHats // + self.countHats
	    if (lastTotal != self.countTotal) {
		if (self.countTotal) {
		    BadgeIcon.next()
		}
	    }
	    BadgeText.stop(
		self.countTotal ? self.countTotal.toString() : '',
		self.countHats > 0 ? colors.green : colors.blue
	    )
	}
	BaseStorage.loadItemDefs(defsLoaded, defsError)
    },

    listen: function(request, sender, sendResponse) {
	return
	var response = {}
	if (request.type == 'driver') {
            switch (request.message) {
	        case 'params':
                    response = FeedDriver.toJSON()
                    break
                case 'refresh':
	            FeedDriver.schedule(0)
	            response = FeedDriver.toJSON()
	            break
	    }
	}
	sendResponse(response)
    },

}


var BadgeText = {
    timerId: 0, maxCount: 6, current: 0, maxDot: 3,

    init: function() {
	this.start(colors.grey)
	console.info('BadgeText.init complete')
    },

    draw: function() {
	var text = ''
	for (var i = 0; i < this.maxDot; i++) {
	    text += (i == this.current) ? '.' : ' '
	}
	if (this.current >= this.maxDot) {
	    text += ''
	}
	chrome.browserAction.setBadgeText({text: text})
	if (++this.current == this.maxCount) {
	    this.current = 0
	}
    },

    start: function(color) {
	if (!BaseStorage.profileId()) {
	    return
	}
	if (typeof(color) == 'object') {
	    chrome.browserAction.setBadgeBackgroundColor({color: color})
	}
	if (!this.timerId) {
	    var ani = this
	    //this.timerId = window.setInterval(function() { ani.draw() }, 100)
	}
    },

    stop: function(text, color) {
	if (this.timerId) {
	    window.clearInterval(this.timerId)
	    this.timerId = 0
	}
	this.set(text, color)
    },

    set: function(text, color) {
	if (typeof(text) == 'string') {
	    chrome.browserAction.setBadgeText({text: text})
	}
	if (typeof(color) == 'object') {
	    chrome.browserAction.setBadgeBackgroundColor({color: color})
	}
    },

}


var Toaster = {
    cache: {},
    defs: null,

    init: function() {
	console.info('Toaster.init complete')
    },

    showItems: function(items) {
	// TODO:  decoder doesn't work
	if (!BaseStorage.get('useNotifications', {missing:false, decoder:Boolean})) {
	    return
	}
	// TODO:  this is broken, too
	items.map(function(index, item) {
	    var uid = $('uniqueId', item).text()
	    if (uid in Toaster.cache) {
		return
	    }
	    Toaster.cache[uid] = uid
	    var idx = $(item).attr('definitionIndex')
	    var pop = webkitNotifications.createNotification(
		'icons/' + idx + '.png',
		_('new_item_title_prefix') + ' ' + Toaster.defs[idx]['description'],
		_('new_item_level_prefix') + ' ' + $('level', item).text() + ' ' + Toaster.defs[idx]['type']
	    )
	    pop.show()
	})
    },
}


var Background = {
    init: function() {
	$.map([WebDataTool, BadgeIcon, BadgeText, Toaster, FeedDriver], function(c) { c.init() })
	chrome.extension.onRequest.addListener(Background.itemsResponder)
    },

    itemsResponder: function(request, sender, sendResponse) {
	switch (request.type) {
            case 'getSchema':
	        WebDataTool.getSchema(
		    {lang: request.lang, success: sendResponse, error: request.errorResponse}
		)
	        break
	    case 'getPlayerProfile':
	        WebDataTool.getPlayerProfile(
		    {id64: request.id64, success: sendResponse, error: request.errorResponse}
	        )
	        break
	    case 'getPlayerItems':
	        WebDataTool.getPlayerItems(
		    {id64: request.id64, success: sendResponse, error: request.errorResponse}
		)
	        break
	    case 'searchPlayers':
	        console.log('search players case')
	        WebDataTool.searchPlayers(
		    {q: request.q, success: sendResponse, error: request.errorResponse}
		)
	        break

	}
    },
}
