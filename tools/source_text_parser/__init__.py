#!/usr/bin/env python2
from codecs import open as codecs_open
from antlr3 import ANTLRStringStream, CommonTokenStream
from STParser import STParser
from STLexer import STLexer


def parse(fn):
    source = codecs_open(fn, encoding='utf-8').read()
    stream = ANTLRStringStream(source)
    lexer = STLexer(stream)
    parser = STParser(CommonTokenStream(lexer))
    output = {}
    parser.source_mapping(output)
    return output
