/*

*/
var ident = function(v) {return v}
var apiUrlBase = 'http://tf2apiproxy.appspot.com/'
var urls = {
    apiPlayerItems: apiUrlBase + 'api/v1/items/',
    apiProfile:     apiUrlBase + 'api/v1/profile/',
    apiSchema:      apiUrlBase + 'api/v1/schema',
    apiSearch:      apiUrlBase + 'api/v1/search/',
    steamCommunity: 'http://steamcommunity.com/',
    steam:          'http://steampowered.com/',
    tf2Items:       'http://www.tf2items.com/',
    tf2Stats:       'http://tf2stats.net/'
}



// this object provides transparent seralization and deseralization
// of values via the localStorage interface.
//
// this might be useful:  chrome.extension.onRequest.addListener(this.refreshHandler)
var BaseStorage = {
    init: function() {
    },

    profileId: function(v) {
	if (undef(v)) {
	    return this.get('profileId')
	}
	this.set('profileId', v)
    },

    set: function(key, value, options) {
	options = options || {}
	var encoder = options['encoder'] || JSON.stringify
	localStorage.setItem(key, encoder(value))
    },

    get: function(key, options) {
	options = options || {}
	var factory = options['decoder'] || JSON.parse
	var missing = options['missing'] || ''
	var value = localStorage.getItem(key)
	if (value == null) {
	    value = missing
	}
	try {
	    return factory(value)
	} catch (e) {
	    return value
	}
    },

    clear: function() {
	localStorage.clear()
    },


    loadItemDefs: function(success, error) {
	var url = 'media/items_' + _('language_code') + '.json'
	$.ajax({url: chrome.extension.getURL(url),
		async: false, dataType: 'text',
		error: error, success: success})

    },

}


var NetTool = {
    timeout: 1000*10, lastReq: null, lastErr: null,

    get: function(options) {
	var success = function(data, status, req) {
	    var cb = options['success']
	    if (cb) { cb(req.responseText) }
	}
	var error = function(req, status, err) {
	    console.error(status, err, req)
	    var eb = options['error']
	    if (eb) eb({error: err, status: status})
	}
	// Add caching based on option 'cache'; use url as storage key
	$.ajax({url: options['url'],
		async: undef(options['async']) ? true : undef(options['async']),
		timeout: undef(options['timeout']) ? this.timeout : undef(options['timeout']),
		dataType: 'text',
		success: success,
		error: error})
    },
}

function textNodeInt(selector, xml) {
    v = parseInt($(selector, xml).text())
    return v ? v : 0
}

function _ (item) {
    if (typeof(item) == 'string') {
	var options = {key: item, missing: item}
    } else {
	var options = item
    }
    var key = options.key
    if (!key) {
	return options.missing || ''
    }
    if (options.subs) {
	var val = chrome.i18n.getMessage(key, options.subs)
    } else {
	var val = chrome.i18n.getMessage(key)
    }
    return !val ? options.missing || '' : val
}

// wha?
var steamIdElement = null

var i18nMap = {
    'its_msg_7':
        function(id) {
	    if (!steamIdElement) {
		steamIdElement = $('#steamID').parent().html()
		$('#steamID').remove()
	    }
	    var h = $('h2.'+id)
	    h.html(_({key:id, subs:[steamIdElement]}))
	},

}


function i18nize() {
    var lang = chrome.i18n.getMessage('language_code')
    if (lang != 'en') {
	$('[lang='+lang+']').css('display', 'inline')
	$('[lang='+lang+']').children().css('display', 'inline')
    }
    var targets = $("[class*='its_msg_'], [id*='its_msg_']")
    targets.each(function(index, node) {
        node = $(node)
        if (node.attr('id').indexOf('its_msg_')==0) {
            var msgid = node.attr('id')
        } else {
	    var cls = node.attr('class')
	    var msgid = cls.substring(cls.search(/its_msg_\d+/)).split(' ')[0]
	}
	if (msgid in i18nMap) {
	    var fun = i18nMap[msgid]
	    fun(msgid)
	} else {
	    var txt = _(msgid)
	    node.html(txt)
	}
    })
}


//
//
//
var SchemaTool = {
    raw: null, itemDefs: null,

    init: function(source) {
        this.raw = source
	this.schema = JSON.parse(source)
        this.itemDefs = {}
	var defs = this.schema['result']['items']['item']
        for (idx in defs) {
            this.itemDefs['' + defs[idx]['defindex']] = defs[idx]
        }
	this.attributes = {}
	var attrs = this.schema['result']['attributes']['attribute']
	for (idx in attrs) {
	    this.attributes[attrs[idx]['name']] = attrs[idx]
	}
    },

    select: function(key, match, defs) {
        var res = {}, defs = (typeof(defs) == 'undefined') ? this.itemDefs : defs
        var matchf = (typeof(match) == typeof('')) ? function(v) { return v == match } : match
        for (idx in defs) {if (matchf(defs[idx][key])) {res[idx] = defs[idx]}}
        return res
    },

    crates:  function(defs) {return this.select('craft_class', 'supply_crate', defs)},
    hats:    function(defs) {return this.select('item_slot', 'head', defs)},
    metal:   function(defs) {return this.select('craft_class', 'craft_bar', defs)},
    misc:    function(defs) {return this.select('item_slot', 'misc', defs)},
    tokens:  function(defs) {return this.select('craft_class', 'craft_token', defs)},
    tools:   function(defs) {return this.select('craft_class', 'tool', defs)},
    weapons: function(defs) {return this.select('craft_class', 'weapon', defs)},
    stock:   function(defs) {
	return this.select('defindex', function(v) { return (v>190 && v<213) }, defs)
    },
    uncraftable: function(defs) {
	return this.select('craft_class', function(v) { return (v==undefined)}, defs)
    },

    qualityMap: function() {
	var map = {}, quals = this.schema['result']['qualities'], names = this.schema['result']['qualityNames']
	for (key in quals) {
	    map[quals[key]] = names[key]
	}
	return map
    },




}


var ItemsTool = {
    raw: null, items: null,

    init: function(source) {
        this.raw = source
        this.items = JSON.parse(source)
    },

    mergeSchema: function(schema, items) {
	var res = [], items = (typeof(items)=='undefined') ? this.items : items
	for (idx in items) {
	    copy = $.extend(true, {}, items[idx])
	    $.extend(copy, schema[items[idx]['defindex']])
	    res[idx] = copy
	}
	return res
    }

}




var undef = function(v) { return typeof(v) == 'undefined' }
