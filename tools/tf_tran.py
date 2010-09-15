#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
import re
import sys
import urllib
from subprocess import Popen, PIPE


google_translate_url =\
    'http://translate.google.com/translate_a/t?client=t&pc=0&oc=1&hl=en&' +\
    'ie=UTF-8&oe=UTF-8&text={text}&sl={sl}&tl={tl}'


pass_thru_keys = ['language_code']
proto_message = {
    'message':'',
    'description':''
}


class SorryGoogle(urllib.FancyURLopener):
    version =\
        'Mozilla/5.0 (X11; U; Linux x86_64; en-US) AppleWebKit/533.1 ' +\
	'(KHTML, like Gecko) Chrome/5.0.335.0 Safari/533.1'

urllib._urlopener = SorryGoogle()



def google_translate(sl, tl, text):
    v = urllib.quote(text.encode('utf-8'))
    url = google_translate_url.format(sl=sl, tl=tl, text=v)
    try:
	data = urllib.urlopen(url).read()
    except (Exception, ), exc:
	return {'status':0, 'text':text, 'reason':'fetch error (%s)' % exc}
    try:
	result = json.loads(data.replace(',,', ',0,'))
    except (Exception, ), exc:
	return {'status':0, 'text':text, 'reason':'parse error (%s)' % exc}
    return result


def translate(sl, tl, txt):
    try:
	t = google_translate(sl, tl, txt)
    except:
	print >> sys.stderr, '# translation exception: %s : %s : %s' % (sl, tl, txt)
	return txt
    try:
	v = t[0][0][0]
    except:
	print >> sys.stderr,  '# no translation: %s : %s : %s (%s)' % (sl, tl, txt, t)
	return txt
    return v


def count_unmasked_subs(text):
    return len(re.findall(r"\$\d", text))


def mask_subs(text):
    return text.replace("$", "***")


def unmask_subs(text):
    return text.replace("* ", "*").replace("***", "$")


def main(input_filename, output_filename, output_lang):
    input_json = json.load(open(input_filename))
    output_json = json.load(open(output_filename))
    source_lang = input_json['language_code']['message']
    additions = {}

    for key in input_json:
	if (key in pass_thru_keys) or (key in output_json):
	    continue
	new_tran = additions[key] = proto_message.copy()
	src_dict = input_json[key]

	src_txt = src_dict['message']
	tran_txt = translate(source_lang, output_lang, mask_subs(src_txt))
	retran_txt = translate(output_lang, source_lang, mask_subs(tran_txt))
	retran_txt = unmask_subs(retran_txt)

	src_sub_count = count_unmasked_subs(src_txt)
	tran_sub_count = count_unmasked_subs(tran_txt)
	retran_sub_count = count_unmasked_subs(retran_txt)

	new_tran['message'] = tran_txt
	new_tran['description'] = src_dict['description']
	new_tran['message-retranslated'] = retran_txt

	if src_sub_count != tran_sub_count != retran_sub_count:
	    print >> sys.stderr, 'Subsitution placeholder replacement error', key, src_txt

    if additions:
	output_json.update(additions)
	output_fp = open(output_filename, 'w')
	json.dump(output_json, output_fp, indent=4)
	output_fp.flush()
	output_fp.close()
	for new_key, new_dict in additions.items():
	    print u'    "{0}" : {1}'.format(new_key, new_dict)


if __name__ == '__main__':
    try:
	source_fn = sys.argv[1]
	target_fn = sys.argv[2]
    except (IndexError, ):
	print >> sys.stderr, 'Usage: %s source.json target.json' % (sys.argv[0], )
	sys.exit(1)
    if source_fn == target_fn:
	print >> sys.stderr, 'Source and target are the same file; not translating.'
	# exit normally because the make file doesn't filter out this
	# condition.
	sys.exit(0)

    cmd = 'grep '+target_fn+' control_files.txt |cut -f 3 -d " "|cut -f 4 -d "/"'
    target_lang = Popen(cmd, stdout=PIPE,shell=True).stdout.read().strip()
    main(source_fn, target_fn, target_lang)
