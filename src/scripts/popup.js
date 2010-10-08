/*

Useful steam ids for testing:
    * 76561197960435530 - valve weapons - robin walker
    * 76561197960355609 - medal no. 59 - DimitriPopov

*/

var unplacedItemSelector = '#unplaced table.unplaced td img'
var placedItemSelector = '#backpack table.backpack td img'
var equippedItemSelector = 'span.equipped'
var itemContentSelector = [unplacedItemSelector, placedItemSelector, equippedItemSelector].join(', ')


/*

    this object encapsulates the state and behavior of the backpack
    view: the items, their locations, current page, etc.

*/
var BackpackView = {
    current: 1,
    count: 1,

    init: function() {
	var self = this
	self.count = $('#backpack table.backpack tbody').length
	self.current = 1 + $('#backpack tbody').filter(':visible').index()
	self.updateNav()
	$('.nav:first a').live('click', function (e) {return self.nav(e, -1)})
	$('.nav:last a').live('click',  function (e) {return self.nav(e, 1)})
	self.fastForward()
    },

    nav: function(event, offset) {
	if (event.detail != 1) { return }
	var self = this
	if ((self.current + offset) > 0 && (self.current + offset <= self.count)) {
	    $('#backpackPage-' + self.current).fadeOut(250, function() {
		self.current += offset
		$('#backpackPage-' + self.current).fadeIn(250)
		BaseStorage.set('previousPage', self.current)
		self.updateNav()
	    })
	}
	return false
    },

    navTo: function(page) {
	this.current = page
	$('#backpackPage-' + page).fadeIn(250)
	this.updateNav()
    },

    updateNav: function () {
	var current = _('num'+this.current), count = _('num'+this.count)
	$('#pages').text(current + '/' + count)
	if (this.current == 1) {
	    $('.nonav:first').show()
	    $('.nav:first').hide()
	} else {
	    $('.nonav:first').hide()
	    $('.nav:first').show()
	}
	if (this.current == this.count) {
	    $('.nonav:last').show()
	    $('.nav:last').hide()
	} else {
	    $('.nonav:last').hide()
	    $('.nav:last').show()
	}
    },

    fastForward: function() {
	var prev = BaseStorage.get('previousPage', {missing:1})
	if (prev > 1) {
	    $('#backpackPage-1').hide()
	    this.navTo(prev)
	}
    },

    showStock: function() {
	var showStock = function(req, status) {
	    var xml = req.responseXML
	    $(itemContentSelector).fadeOut().remove()
	    PopupView.putItems(xml)
	}
	$.ajax({url:'media/stock_items.xml', complete:showStock})
    },

    hideStock: function() {
	var xml = this.feed
	if (xml) {
	    $(itemContentSelector).fadeOut().remove()
	    PopupView.putItems(xml)
	} else {
	    console.warning('empty xml')
	}
    },


}


/*


*/
var BrowserTool = {
    betterTranslation: function() {
	return window.open('mailto:phineas.natural@gmail.com?subject=Better Translation')
    },

    externalBackpack: function() {
	return this.show(urls.tf2Items + 'profiles/' + BaseStorage.profileId())
    },

    externalStats: function() {
	return this.show(urls.tf2Stats + 'player_stats/' + BaseStorage.profileId())
    },

    showOptions: function() {
	chrome.tabs.create({url:'./options.html'})
	window.close()
	return false
    },

    showProfile: function(id64) {
	id64 = (typeof(id64) == 'undefined') ? BaseStorage.profileId() : id64
        return this.show(urls.steamCommunity + 'profiles/' + id64)
    },

    show: function(url) {
	this.open(function (m) { return m.indexOf(url) == 0 }, url)
    },

    open: function(match, newUrl) {
	chrome.tabs.getAllInWindow(undefined,
            function(tabs) {
                for (var i = 0, tab; tab = tabs[i]; i++) {
                    if (tab.url && match(tab.url)) {
		        window.close()
                        chrome.tabs.update(tab.id, {selected:true})
                        return false
                    }
                }
	        window.close()
                chrome.tabs.create({url:newUrl})
	        return false
            })
    },

}


var PopupView = {
/*
	    //$(itemContentSelector).fadeOut().remove()
	    //PopupView.putItems(self.feed)
	    //PopupView.putCharInfo(self.feed)
	    //PopupView.loadAndShowProfile()

*/
    init: function() {
	chrome.extension.onRequest.addListener(this.handleRefresh)
	$('table.unplaced td:has(img)')
	    .live('mouseenter', function() {$(this).addClass('itemHover')})
	    .live('mouseleave', function() {$(this).removeClass('itemHover')})
	if (_('language_code') != 'en') {
	    $('#translation_suggestion').show()
	}
        $('body').mousedown(function(){return false}) //disable text selection
	var w = $('#controls').width()
	$('#nav span').each(function(i,x) { w+=$(x).width() })
	if (w+6< $('#backpack tr:first').width()) {
	    $('#toolbar, #stats').css('width', -6 + $('#backpack tr:first').width())
	}
	$('table.backpack td').click(this.itemClicked)
	$('#showstock').click(function() {
	    if ($(this).attr('src').indexOf('unchecked') > -1) {
		$(this).attr('src', 'media/checkbox-checked.png')
		BackpackView.showStock()
	    } else {
		$(this).attr('src', 'media/checkbox-unchecked.png')
		BackpackView.hideStock()
	    }
	})

	window.setInterval(this.updateRefreshTime, 1000)
    },


    newItems: null,
    equippedTag: '<span style="display:none" class="equipped">' + _('equipped')  + '</span>',

    itemImg: function(item) {
	var def = SchemaTool.itemDefs[item['defindex']]
	return '<img style="display:none" src="' + def['image_url'] + '" />'
    },

    itemInv: function(item) { return item['inventory']  },
    itemPos: function(item) { return item['inventory'] & 0xFFFF },
    itemEquipped: function(item) { return (item['inventory'] & 0xff0000) != 0 },

    init2: function(schema, items) {
	if (schema.itemDefs && items.items && !(this.newItems)) {
	    this.newItems = items.items // ItemsTool.mergeSchema(SchemaTool.itemDefs, items.items)
	    this.placeItems(this.newItems)
	}
    },

    placeItems: function(items) {
	var newItemIndex = -1
	for (index in items) {
	    var item = items[index]
	    var pos = this.itemPos(item) // var inv = item['inventory'], inv & 0xFFFF
	    if (pos > 0) {
		var ele = $('#c' + pos + ' div').append(this.itemImg(item))
		var img = $('img:last', ele).data('node', item)
		if (this.itemEquipped(item)) {
		    img.addClass(this.tweakEquipImgClass[item['defindex']] || 'equipped')
		       .after(this.equippedTag)
		} else {
		    img.addClass(this.tweakUnequipImgClass[item['defindex']])
		}
	    } else {
		newItemIndex += 1
		if ($('table.unplaced td:not(:has(img))').length == 0) {
		    var cells = new Array(5+1).join('<td><div></div></td>')
		    $('table.unplaced').append('<tbody><tr>' + cells + '</tr></tbody>')
		}
		$('table.unplaced td:eq('+newItemIndex+') div').append(this.itemImg(item))
		$('table.unplaced td img:last').data('node', item)
	    }
	}
	$('#unplaced, hr.unplaced').toggle(newItemIndex > -1)
	$(itemContentSelector).fadeIn(750)
    },


    showMessage: function(type, message, duration) {
	if (type=='warning' && message.toLowerCase().indexOf('warning') != 0) {
	    message = _('warning') + ': ' +  _(message)
	}
	if (type=='error' && message.toLowerCase().indexOf('error') != 0) {
	    message = _('error') + ': ' +  _(message)
	}
        $('#'+type).text(message).slideDown().delay(duration||5000).slideUp()
    },


    updateRefreshTime: function() {
	var data = $('#nextFetch').data()
	if (data && data.next) {
	    var show = PopupView.formatCountDown(data.next, _('refreshing')+'...', _('second'), _('seconds'))
	} else {
	    var show = _('error')
	}
	$('#nextFetch').text(show)
    },


    formatCountDown: function(value, zero, single, plural) {
	var seconds = Math.round((value  - Date.now())/1000)
	if (seconds == 1) {
	    return '1 ' + single
	} else if (seconds == 0 || seconds < 0) {
	    return zero
	} else {
	    return seconds + ' ' + plural
	}
    },

    handleRefresh: function(request, sender, sendResponse) {
	if (request.type == 'refresh' && request.status) {
	    switch(request.status) {
	        case 'okay':
		    // the length check won't hurt if the backpack is totally
                    // empty, and it will help if the page is just loading
                    // via the options div.
                    if (request.updated || $('#backpack img').length==0) {
	                //PopupStorage.loadAndShow()
	                BackpackView.init()
		    } else {
			PopupView.putTimings()
			PopupView.showMessage('information', _('refresh_nochange'))
		    }
	            break
	        case 'warning':
                    PopupView.showMessage('warning', _(request.message))
		    break
	        case 'abort':
	        case 'error':
	        case 'exception':
		    PopupView.showMessage('error', _(request.message))
	            break
	        default:
	            console.log('unknown refresh msg')
	    }
	}
	sendResponse({})
    },

    itemImage: function(t) {
	return "<img style='display:none' src='icons/"+t+".png' onerror='PopupView.missingImage(this, "+t+")' />"
    },

    itemClicked: function(event) {
	if (!event.ctrlKey) {
	    $('table.backpack td').removeClass('selected')
	}
	$(this).addClass('selected')
    },

    requestRefresh: function(event) {
	$('html body').animate({scrollTop: 0})
	chrome.extension.sendRequest({type:'driver', message:'refresh'}, function(response) {})
	return false
    },

    missingImage: function(img, typ) {
	if (img) {
	    img.src = 'icons/missing.png'
	    img.onerror = null
	    return true
	}
    },

    showStats: function() {
	$('#stats').slideDown(400, function() {
	    $("#controls a:contains('Stats')").fadeOut()
	    var ele = $('table.backpack')
	    $('html body').animate({scrollTop: ele.position().top + ele.height()})
	})
	return false
    },

    hideStats: function() {
	$('#stats').slideUp(400, function() {
	    $("#controls a:contains('Stats')").fadeIn()
	    $('html body').animate({scrollTop: 0})
	})
	return false
    },

    putTimings: function() {
	chrome.extension.sendRequest(
	    {type: 'driver', message: 'params'},
	    function(response) {
	        $('#lastFetch').text(Date(response.pollLast))
		$('#nextFetch').data({'next':response.pollNext})
		var duration = response.pollDuration
		$('#requestTime').text(duration==0 ? 'Cached' : duration + ' ms')
		if (response.requestError) {
		    PopupView.showMessage('warning', _('from_cache'))
		}
	    })
    },

    loadAndShowProfile: function() {
	var feed = BaseStorage.profileFeed()
	var load = function(data) {
	    $('#steamID a').text(data['personaname'])
	    var avatar = data['avatarfull']
	    if (avatar) {
		$('#avatar img').fadeOut().remove()
		$('#avatar').append("<img src='" + avatar + "' />")
	    }
	}
	if (feed) {
	    load(feed)
	} else {
	    var error = function(v) {
		console.log(v)
	    }
	    //profile.load(BaseStorage.profileId(), load, error)
	}
    },

    putCharInfo: function(feed) {
	feed = JSON.parse(feed)
	$('#steamID a').text(feed['personaname'])
	if (feed['avatarfull']) {
	    $('#avatar img').fadeOut().remove()
	    $('#avatar').append("<img src='" + feed['avatarfull'] + "' />")
	}
    },

    putCharInfo__: function(feed) {
	$('#steamID a').text($('steamID', feed).text())
	var avatarUrl = $('avatarFull', feed).text()
	if (avatarUrl) {
	    $('#avatar img').fadeOut().remove()
	    $('#avatar').append("<img src='" + avatarUrl + "' />")
	}
	$(['numHats', 'numNormal', 'numMisc',
	   'numMetal', 'numUnknown', 'totalItems',
	   'metalWorth', 'profileViews']).each(function(index, key) {
	       $('#'+key).text( $('backpack '+key, feed).text() )
	})
	if ($('backpack fromCache', feed).text()=='1') {
	    $('#cacheTime').text(Date($('backpack cacheTime').text()))
	} else {
	    $('#cacheTime').text('Not from cache.')
	}
        // give the first timing row (cache time) and the hide button
	// some extra top padding
        $("table.stats td:has(strong[class='its_msg_20']), table.stats td:has(a)")
	    .css('padding-top', '1.5em')
	this.putTimings()
    },

    putNewItem: function(index, node) {
	var type = $(node).attr('definitionIndex')
	if (!type) {
	    return
	}
	if ($('table.unplaced td:not(:has(img))').length == 0) {
	    var cells = new Array(5+1).join('<td><div></div></td>')
	    $('table.unplaced').append('<tbody><tr>' + cells + '</tr></tbody>')
	}
	$('table.unplaced td:eq('+index+') div').append(PopupView.itemImage(type))
	$('table.unplaced td img:last').data('node', node)
    },

    putOldItem: function(index, node) {
	var pos = $('position', node).text()
	var typ = $(node).attr('definitionIndex')
	var ele = $('#c' + (pos & 0xffff) + ' div')
	ele.append(PopupView.itemImage(typ))
	var img = $('img:last', ele)
	img.data('node', node)
	if (pos & 0x80000000 && pos & 0x0FFF0000) {
	    // nudge the image up a bit related to margin-top on the equipped class
	    img.css('margin-top', PopupView.nudgeMap[typ] || '-8px')
	    img.after("<span style='display:none' class='equipped'>" + _("equipped") + "</span>")
	}

	// TODO:  need to determine how and when to indicate a quantity...
	// TODO:  swap paint can images by color
	var quan = $('quantity', node).text()
	if (quan != '1') {
		img.before("<span style='' class='quantity'>" + _(quan) + "</span>")
	        img.css('margin-top', '-1em')
	}
    },

    putItems: function(feed) {
	$(itemContentSelector).fadeOut().remove()
	if (!feed) {
	    console.log('empty feed')
	    return
	}
	var newNodes = $('item', feed).filter(function (index) {
	    return $('position', this).text() == '0' }).each(this.putNewItem)
	$('#unplaced, hr.unplaced').toggle(newNodes.length > 0)
	$('item', feed).filter(function (index) {
	    return $('position', this).text() != '0' }).each(this.putOldItem)
	$(itemContentSelector).fadeIn(750)
    },

    nudgeMap: {
	'133': '0',
    },

    tweakEquipImgClass: {
	'133': 'equipped-133',
    },
    tweakUnequipImgClass: {
	'133': 'unequipped-133',
    },

}


var ident = function(v) {return v}

var TooltipView = {
    qualityStyles: {
	0: 'color-normal',
	1: 'color-common',
	2: 'color-rare',
	3: 'color-vintage',
	5: 'color-unusual',
	6: 'color-unique',
	7: 'color-comm',
	8: 'color-dev',
	9: 'color-self',
	10: 'color-custom',
    },

    extraLineMap: {0:'alt', 1:'positive', 2:'negative'},
    effectTypeMap: {negative: 'negative', neutral:'alt', positive: 'positive'},
    prefixCheckMap: {3:'vint', 5:'unusual', 7:'com', 8:'dev', 9:'self'},
    formatCalcMap: {

	// for values that translate into percentages and are
	// represented by that percentage (eg. changes to the blast
	// radius).  good test is Dead Ringer.
	value_is_percentage: function (v) { return Math.round(v*100 - 100) },

	//for values that translate into percentages and are
	//represented by the difference in that percentage from 100%
	//(eg. changes to the fire rate), good test is Ubersaw.
	value_is_inverted_percentage: function (v) { return Math.round(100 - (v*100)) },

	//for values that are a specific number (eg. max health
	//bonuses and bleed durations) and boolean attributes (such as
	//The Sandman's ability to knock out balls).
	// good test is Scottish Resistance. TEST SANDMAN
	value_is_additive: ident,

	// for values that add to an existing percentage (e.g. The
	// Ubersaw adding 25% charge every hit).  good test is the Ubersaw.
	value_is_additive_percentage: function (v) { return Math.round(100*v) },

	// for values that are a unix timestamp
	value_is_date: function (v) { return new Date(v * 1000) },

	// for values that are a particle effect type.
	value_is_particle_index: ident,

	// for values that are a Steam account ID, e.g., 'Gift from
	// %s1' Add 1197960265728 to this value and prefix the string
	// representation of the result with "7656" for a 64 bit Steam
	// Community ID
	value_is_account_id: function (v) { return '7656' + (v + 1197960265728) },

	// possibly for values that get applied if a condition is true (e.g. player is on fire)
	value_is_or: ident,
    },

    formatDesc: function(node, def, attr) {
	var line = def['description_string'].replace(/\n/gi, '<br>')
	// we only look for (and sub) one '%s1'; that's the most there is (as of oct 2010)
	if (line.indexOf('%s1') > -1) {
	    var fCalc = this.formatCalcMap[def['description_format']] // || ident
	    if (node['attributes']) {
		// WRONG.  find the value by looping over the node attributes and
		// matching one to the attribute defindex.
		try {
		    var val = node['attributes']['attribute'][attr['value']]['value']
		} catch (e) { val = 0 }
	    } else {
		var val = attr['value']
	    }
	    line = line.replace('%s1', fCalc(val))
	}
	console.log(node, def, attr, line)
	return line
    },

    init: function() {
	$('table.backpack td, table.unplaced td')
            .live('mouseenter', this.show)
            .live('mouseleave', this.hide)
    },

    hide: function(event) {
	$('#tooltip').hide().css({left:0, top:0})
    },

    show: function(event) {
	var cell = $(this), tooltip = $('#tooltip')
	if (!cell.children().length) { return }
	try {
	    var node = $($('img', cell).data('node'))[0], quals = SchemaTool.qualityMap()
	    var type = node['defindex'] // empty cells will raise an exception
	} catch (e) {
	    return
	}
	var sdef = SchemaTool.itemDefs[type]
	var self = TooltipView, level = node['level'], desc = sdef['item_name']
	// this doesn't match the game behavior exactly, but it is nice.
	var levelType = sdef['item_type_name'].replace('TF_Wearable_Hat', _('Hat'))
	var h4 = $('#tooltip h4')

	// hide the darn thing first
	self.hide()

	// set the main title and maybe adjust its style and prefix
	h4.text(desc)
	h4.attr('class', self.qualityStyles[node['quality']])
	if (node['quality'] in self.prefixCheckMap) {
	    h4.text(quals[node['quality']] + ' ' + h4.text())
	}

	// set the level
	$('#tooltip .level').text(_({key:'level', subs:[level, levelType]}))

	// clear and set the extra text
	for (key in self.extraLineMap) {
	    $('#tooltip .'+ self.extraLineMap[key]).text('')
	}
	if (sdef['attributes']) {
	    var attrVals = sdef['attributes']['attribute']
	    for (aidx in attrVals) {
		var attrDef = SchemaTool.attributes[attrVals[aidx]['name']]
		if (!attrDef) { continue }
		if (attrDef['description_string']=='unused') { continue }
		var extra = self.formatDesc(node, attrDef, attrVals[aidx])
		var etype = self.effectTypeMap[attrDef['effect_type']]
		var current = $('#tooltip .' + etype).html()
		$('#tooltip .' + etype).html( current ? current + '<br>' + extra : extra)
	    }
	} else {
	    //console.log(node, 'noattrs')
	}

	// calculate the position
	var pos = cell.position()
	var minleft = cell.parent().position().left
	var cellw = cell.width()
	var toolw = tooltip.width()
	var left = pos.left - (toolw/2.0) + (cellw/2.0) // - 4 // 4 == half border?
	left = left < minleft ? minleft : left
	var maxright = cell.parent().position().left + cell.parent().width()
	if (left + toolw > maxright) {
    	    left = cell.position().left + cellw - toolw + 4 // - 12
	}
	left = left < 0 ? (window.innerWidth/2)-toolw/2 : left
	var top = pos.top + cell.height() + 12
	if (top + tooltip.height() > (window.innerHeight+window.scrollY)) {
    	    top = pos.top - tooltip.height() - 8 // - 36
	}

	// position and show
	tooltip.css({left:left, top:top})
	tooltip.show()
    },
}


var Popup = {
    schema: {}, profile: {}, items: {},

    init: function() {
	i18nize()
	BaseStorage.profileId() ? this.mainInit() : this.emptyInit()
    },

    mainInit: function() {
	$.map([PopupView, TooltipView, BackpackView], function(c) { c.init() })
	chrome.extension.sendRequest(
	    {type: 'getSchema', lang: _('language_code')},
	    function (schema) {
                SchemaTool.init(schema)
		PopupView.init2(SchemaTool, ItemsTool)
		console.log('schema tool loaded:', SchemaTool)
	    })
	chrome.extension.sendRequest(
	    {type: 'getPlayerItems', id64: BaseStorage.profileId()},
	    function (items) {
		ItemsTool.init(items)
		PopupView.init2(SchemaTool, ItemsTool)
		console.log('items tool loaded:', ItemsTool)
	    })
	chrome.extension.sendRequest(
	    {type: 'getPlayerProfile', id64: BaseStorage.profileId()},
	    function (profile) {
		Popup.profile = JSON.parse(profile)
		PopupView.putCharInfo(profile)
		PopupView.init2(SchemaTool, ItemsTool)
		console.log('player profile:', Popup.profile)
	    })
	console.log('Popup.mainInit complete')
    },

    emptyInit: function() {
        $('#main').fadeOut('fast')
	$('#unknownProfile').fadeIn('fast')
	optionsInit(function() {
	    $('#unknownProfile').fadeOut('fast', function() {
	        $('#main').fadeIn().delay(1000)
		Popup.mainInit()
	        PopupView.requestRefresh()
	    })
	})
    },
}
