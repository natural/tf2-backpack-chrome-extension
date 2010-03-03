#!/usr/bin/env python
import json
import urllib


## locale mapping; these are the locales supported by tf2, which form
## subset of the locales supported by chrome.

locale_files = [
    ('en', 'tf2_english.txt'),

    ('da', 'tf_danish.txt'),
    ('nl', 'tf_dutch.txt'),
    ('fi', 'tf_finnish.txt'),
    ('fr', 'tf_french.txt'),
    ('de', 'tf_german.txt'),
    ('it', 'tf_italian.txt'),
    ('ja', 'tf_japanese.txt'),
    ('ko', 'tf_korean.txt'),
## what?    ('', 'tf_koreana.txt'),
    ('no', 'tf_norwegian.txt'),
    ('pl', 'tf_polish.txt'),
    ('pt', 'tf_portuguese.txt'),
    ('zh_CN', 'tf_schinese.txt'),
    ('es', 'tf_spanish.txt'),
    ('sv', 'tf_swedish.txt'),
    ('zh_TW', 'tf_tchinese.txt'),
]



google_translate_url = "http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&q={text}&langpair={sl}|{tl}"


def google_translate(sl, tl, text):
    url = google_translate_url.format(sl=sl, tl=tl, text=urllib.quote(text))
    try:
	data = urllib.urlopen(url).read()
    except (Exception, ), exc:
	return {'status':0, 'text':text, 'reason':'fetch error (%s)' % exc}
    try:
	result = json.loads(data)
    except (Exception, ), exc:
	return {'status':0, 'text':text, 'reason':'parse error (%s)' % exc}
    return result


## hello world:
# {"responseData": {"translatedText":"hola mundo"}, "responseDetails": null, "responseStatus": 200}

## hello
# {"responseData": {"translatedText":"hola"}, "responseDetails": null, "responseStatus": 200}



def select_translation(data):
    try:
	return data['sentences'][0]['trans']
    except (KeyError, ):
	return data['responseData']['translatedText']



if __name__ == '__main__':
    d = google_translate('en', 'es', 'hello world')
    print select_translation(d)


