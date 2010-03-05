#!/usr/bin/env python
import codecs
import json
import sys

import antlr3

from SourceTextParser import SourceTextParser
from SourceTextLexer import SourceTextLexer


def parse(fn):
    source = codecs.open(fn, encoding='utf-8').read()
    ## strings in the source file may contain esacaped newlines, which
    ## the parser doesn't handle.  hackity hackity.
    source = source.replace("\\n", "<BR>")

    ## another hacky hacky
    source = source.replace('\\"', "")
    stream = antlr3.ANTLRStringStream(source)
    lexer = SourceTextLexer(stream)
    parser = SourceTextParser(antlr3.CommonTokenStream(lexer))
    output = {}
    parser.source_mapping(output)
    return output


if __name__ == '__main__':
    try:
	fn = sys.argv[1]
    except (IndexError, ):
	print 'usage: %s filename' % (sys.argv[0], )
    else:
	try:
	    data = parse(fn)
	    sys.stdout = codecs.getwriter('utf8')(sys.stdout)
	    print json.dumps(data, indent=4)
	except (Exception, ), exc:
	    print 'exception during parse or output: ', exc
