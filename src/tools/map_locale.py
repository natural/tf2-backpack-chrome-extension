#!/usr/bin/env python

## locale mapping; these are the locales supported by tf2, which form
## subset of the locales supported by chrome.

locale_files = [
    ('en', 'tf_english.txt'),

    ('da', 'tf_danish.txt'),
    ('de', 'tf_german.txt'),
    ('es', 'tf_spanish.txt'),
    ('fi', 'tf_finnish.txt'),
    ('fr', 'tf_french.txt'),
    ('it', 'tf_italian.txt'),
    ('ja', 'tf_japanese.txt'),
    ('ko', 'tf_korean.txt'),
#    ('k?', 'tf_koreana.txt'), ## alternate korean?
    ('nl', 'tf_dutch.txt'),
#    ('no', 'tf_norwegian.txt'), ## not yet supported by chrome
    ('pl', 'tf_polish.txt'),
    ('pt', 'tf_portuguese.txt'),
    ('ro', 'tf_romanian.txt'),
    ('ru', 'tf_russian.txt'),
    ('sv', 'tf_swedish.txt'),
    ('zh_CN', 'tf_schinese.txt'),
    ('zh_TW', 'tf_tchinese.txt'),
]

def print_usage():
    print 'usage: %s [--file=filename | --code=langcode]'


if __name__ == '__main__':
    import os
    import sys
    try:
	arg = sys.argv[1]
    except (IndexError, ):
	print_usage()
	sys.exit(1)
    if arg.startswith('--file='):
	arg = arg.split('--file=')[1]
	arg = os.path.split(arg)[-1]
	mapping = dict([fn, code] for code, fn in locale_files)
	code = mapping.get(arg, None)
	if code:
	    print code
	    exit(0)
	else:
	    exit(2)
    elif arg.startswith('--code='):
	arg = arg.split('--code=')[1]
	mapping = dict(locale_files)
	fn = mapping.get(arg, None)
	if fn:
	    print fn
	    exit(0)
	else:
	    exit(3)
    else:
	print_usage()
	exit(4)
