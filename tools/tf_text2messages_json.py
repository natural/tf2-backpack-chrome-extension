#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
import os
import re
import sys
import urllib
from subprocess import Popen, PIPE

## source (english) messages file
source_filename = os.path.abspath("../src/_locales/en/messages.json")

google_translate_url = "http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&q={text}&langpair={sl}|{tl}"
google_translate_url = "http://translate.google.com/translate_a/t?client=t&pc=0&oc=1&hl=en&ie=UTF-8&oe=UTF-8&text={text}&sl={sl}&tl={tl}"


class SorryGoogle(urllib.FancyURLopener):
    version = "Mozilla/5.0 (X11; U; Linux x86_64; en-US) AppleWebKit/533.1 (KHTML, like Gecko) Chrome/5.0.335.0 Safari/533.1"
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


## hello world:
# {"responseData": {"translatedText":"hola mundo"}, "responseDetails": null, "responseStatus": 200}

## hello
# {"responseData": {"translatedText":"hola"}, "responseDetails": null, "responseStatus": 200}
# {"sentences":[{"trans":"喂","orig":"hello","translit":"Wèi"}],"dict":[{"pos":"interjection","terms":["你好!","喂!"]}],"src":"en"}

pass_thru_keys = ["language_code"]
proto_message = {"message":'', "description":''}


def count_unmasked_subs(text):
    return len(re.findall(r"\$\d", text))


def mask_subs(text):
    return text.replace("$", "***")


def unmask_subs(text):
    return text.replace("* ", "*").replace("***", "$")


def main(source_messages, target_filename, lang_code):
    source_lang_code = source_messages["language_code"]["message"]

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

    translation = {}
    for msg_id, msg_dict in source_messages.items():
	if msg_id in pass_thru_keys:
	    translation[msg_id] = msg_dict.copy()
	    continue
	translation[msg_id] = new_msg = proto_message.copy()

	source_text = msg_dict['message']
	source_sub_count = count_unmasked_subs(source_text)

	translated_text = translate(source_lang_code, lang_code, mask_subs(source_text))
	translated_text = unmask_subs(translated_text)

	new_msg['message'] = translated_text
	translated_sub_count = count_unmasked_subs(translated_text)

	retran_text = translate(lang_code, source_lang_code, mask_subs(translated_text))
	retran_text = unmask_subs(retran_text)
	new_msg['message-retranslated'] = retran_text
	retran_sub_count = count_unmasked_subs(retran_text)
	if source_sub_count != translated_sub_count != retran_sub_count:
	    print >> sys.stderr, '## subsitution placeholder replacement error', source_text
	    #new_msg['message-placeolder-error'] = True
	new_msg['description'] = msg_dict['description']

    lang_msg = proto_message.copy()
    lang_msg["message"] = lang_code
    translation["language_code"] = lang_msg
    out_file = open(target_filename, 'w')
    print >> out_file, json.dumps(translation, indent=4)
    out_file.flush()
    out_file.close()


if __name__ == '__main__':
    target_file = sys.argv[1]
    cmd = 'grep '+target_file+' control_files.txt |cut -f 3 -d " "|cut -f 3 -d "/"'
    target_lang = Popen(cmd, stdout=PIPE,shell=True).stdout.read().strip()
    source_msgs = json.load(open(source_filename))
    main(source_msgs, target_file, target_lang)

