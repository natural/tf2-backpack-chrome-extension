#!/usr/bin/env python
import codecs
import json
import sys

sys.stdout = codecs.getwriter('utf8')(sys.stdout)

def decode(mapping):
    for key, value in mapping.items():
	if isinstance(value, basestring):
	    return value
	else:
	    return decode(value)


def main(fn):
    data = codecs.open(fn, 'r', 'utf8').read()
    x = eval("u'''" + data + "'''")
    print x


if __name__ == '__main__':
    try:
	fn = sys.argv[1]
    except (IndexError, ):
	print 'Usage: %s file' % (sys.argv[0], )
    else:
	main(fn)
