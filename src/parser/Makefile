
.PHONY: all clean
.SILENT: clean

all: SourceTextParser.py # SourceTextTreeParser.py


SourceTextParser.py: SourceText.g
	antlr3 SourceText.g


SourceTextLexer.py: SourceText.g
	antlr3 SourceText.g


clean:
	@rm -f SourceTextLexer.py SourceTextParser.py SourceText.tokens

