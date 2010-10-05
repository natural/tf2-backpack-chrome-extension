#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""

"""
import codecs
import json
import os
import sys
from functools import partial
from subprocess import Popen, PIPE

from source_text_parser import parse
from tf_tran import google_translate

sys.stdout = codecs.getwriter('utf8')(sys.stdout)
items_game = parse('../src/rawtext/items_game.txt')['items_game']
extras_filename = '../src/rawtext/extras.json'
en_lang = parse('../src/rawtext/tf_english.txt')['lang']['Tokens']

def proto():
    return dict(description='', type='', alt=[], positive=[], negative=[])


known_subs = (
    ('Flaregun', 'FlareGun'),
    ('TF_Weapon_Flamethrower', 'TF_Weapon_FlameThrower'),
    # "Flamethrower" used by achievement so it's not changed
)


def fix_key(v):
    if v.startswith('#'):
	v = v[1:]
	for find, repl in known_subs:
	    v = v.replace(find, repl)
    return v


def fix_type(v):
    if v == 'CheatDetector':
	return 'Cheat Detector'
    if v == 'TF_Wearable_Hat':
	return 'Hat'
    return v


def fix_attr(v):
    if v.startswith('#'):
	v = v[1:]
    return v


def find_attribute(attrs, name):
    for value in attrs.itervalues():
	if value['name'] == name:
	    return value


def format_value_is_percentage(v):
    return str(int(float(v)*100) - 100)


def format_value_is_additive(v):
    return v


def format_value_is_inverted_percentage(v):
    return str(100 - int(float(v)*100))


def format_value_is_additive_percentage(v):
    return str(int(float(v)*100))


def add_item_type(source, target, lang_data=None, **kwds):
    val = fix_key(source['item_type_name'])
    val = lang_data.get(val, en_lang.get(val, fix_type(val)))
    target['type'] = val


def add_item_desc(source, target, lang_data=None, **kwds):
    val = fix_key(source['item_name'])
    val = lang_data.get(val, en_lang.get(val, val))
    target['description'] = val


def add_item_alt(source, target, lang_data=None, **kwds):
    alt = source.get('item_description', None)
    if alt is not None:
	alt = fix_key(alt)
	v = lang_data.get(alt, en_lang.get(alt, alt))
	target['alt'].append(v)


def add_item_attrs(source, target, lang_data, find_attr=None, **kwds):
    attrs = source.get('attributes', None)
    glbls = globals()
    if attrs is not None:
	for name, setup in attrs.items():
	    av = find_attr(name)
	    if av is not None:
		desc = fix_attr(av['description_string'])
		frmt = av['description_format']
		av_val = setup.get('value', '0')
		av_type = av['effect_type']
		desc = lang_data.get(desc, None)
		if desc is not None:
		    v = setup.get('value', None)
		    f = glbls.get('format_'+frmt, lambda v:v)
		    fv = f(v)

		    if av_type == 'neutral':
			target['alt'].append(desc)

		    elif av_type == 'negative':
			if desc.count('%s1'):
			    desc = desc.replace('%s1', fv)
			target[av_type].append(desc)

		    elif av_type == 'positive':
			if desc.count('%s1'):
			    desc = desc.replace('%s1', fv)
			target[av_type].append(desc)


def trim_item(source, target, names=(), **kwds):
    for name in names:
	if not target[name]:
	    target.pop(name)


def main(fn, initial):
    output = initial.copy()
    items, qualities, attributes = \
	   items_game['items'], items_game['qualities'], items_game['attributes']
    lang_data = parse(fn)['lang']['Tokens']
    find_attr = partial(find_attribute, attributes)
    kwds = dict(find_attr=find_attr, lang_data=lang_data)
    trim = partial(trim_item, names=['positive', 'negative', 'alt', ])
    handlers = [add_item_type, add_item_desc, add_item_alt, add_item_attrs, trim]
    for key, src in items.items():
	output[key] = out = proto()
	for handler in handlers:
	    handler(src, out, **kwds)
    return output


def mask_subs(text):
    return text.replace('no.', 'number').replace("%s1", "123")


def unmask_subs(text):
    return text.replace("123", "%s1")


def translate_extras(extras, target_lang, source_lang='en'):
    translated = {}
    def trans(text):
	try:
	    t = google_translate(source_lang, target_lang, mask_subs(text))
	except:
	    print >> sys.stderr, '## translation exception'
	    return text
	try:
	    v = t[0][0][0]
	except:
	    print >> sys.stderr, '## no translation', target_lang, source_lang, t
	    return text
	txt = unmask_subs(v)
	return txt

    for key, value in extras.items():
	translated[key] = inner = {}
	for ikey, ival in value.items():
	    if isinstance(ival, (basestring, )):
		inner[ikey] = trans(ival)
	    elif isinstance(ival, (list, )):
		inner[ikey] = iseq = []
		for v in ival:
		    iseq.append(trans(v))
    return translated


if __name__ == '__main__':
    try:
	source_text_filename = sys.argv[1]
	items_json_filename = sys.argv[2]
    except (IndexError, ):
	print 'usage: %s input output (e.g., "../src/rawtext/tf_english.txt ../src/media/items_en.json")' % sys.argv[0]
    else:

	target_file = sys.argv[1]
	cmd = 'grep '+target_file+' control_files.txt |cut -f 3 -d " "|cut -f 4 -d "/"'
	target_lang = Popen(cmd, stdout=PIPE,shell=True).stdout.read().strip()
	extras = json.load(open(extras_filename))
	extras = translate_extras(extras, target_lang)
	result = main(source_text_filename, extras)
	output = codecs.getwriter('utf8')(open(items_json_filename, 'w'))
	print >> output, json.dumps(result, indent=4)

