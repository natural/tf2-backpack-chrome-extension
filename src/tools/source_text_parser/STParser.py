# $ANTLR 3.1.1 ST.g 2010-07-15 13:26:45

import sys
from antlr3 import *
from antlr3.compat import set, frozenset

from antlr3.tree import *



# for convenience in actions
HIDDEN = BaseRecognizer.HIDDEN

# token types
LT=12
WS=10
T__15=15
LETTER=6
T__14=14
UnicodeEscape=7
CHAR=5
LINECOMMENT=13
COMMENT=11
EOF=-1
HexDigit=9
EscapeSequence=8
STRING=4

# token names
tokenNames = [
    "<invalid>", "<EOR>", "<DOWN>", "<UP>", 
    "STRING", "CHAR", "LETTER", "UnicodeEscape", "EscapeSequence", "HexDigit", 
    "WS", "COMMENT", "LT", "LINECOMMENT", "'{'", "'}'"
]




class STParser(Parser):
    grammarFileName = "ST.g"
    antlr_version = version_str_to_tuple("3.1.1")
    antlr_version_str = "3.1.1"
    tokenNames = tokenNames

    def __init__(self, input, state=None):
        if state is None:
            state = RecognizerSharedState()

        Parser.__init__(self, input, state)







                
        self._adaptor = CommonTreeAdaptor()


        
    def getTreeAdaptor(self):
        return self._adaptor

    def setTreeAdaptor(self, adaptor):
        self._adaptor = adaptor

    adaptor = property(getTreeAdaptor, setTreeAdaptor)


    class source_mapping_return(ParserRuleReturnScope):
        def __init__(self):
            ParserRuleReturnScope.__init__(self)

            self.tree = None




    # $ANTLR start "source_mapping"
    # ST.g:9:1: source_mapping[m] : ( element[m] )* ;
    def source_mapping(self, m):

        retval = self.source_mapping_return()
        retval.start = self.input.LT(1)

        root_0 = None

        element1 = None



        try:
            try:
                # ST.g:10:5: ( ( element[m] )* )
                # ST.g:10:7: ( element[m] )*
                pass 
                root_0 = self._adaptor.nil()

                # ST.g:10:7: ( element[m] )*
                while True: #loop1
                    alt1 = 2
                    LA1_0 = self.input.LA(1)

                    if (LA1_0 == STRING) :
                        alt1 = 1


                    if alt1 == 1:
                        # ST.g:10:8: element[m]
                        pass 
                        self._state.following.append(self.FOLLOW_element_in_source_mapping31)
                        element1 = self.element(m)

                        self._state.following.pop()
                        self._adaptor.addChild(root_0, element1.tree)


                    else:
                        break #loop1





                retval.stop = self.input.LT(-1)


                retval.tree = self._adaptor.rulePostProcessing(root_0)
                self._adaptor.setTokenBoundaries(retval.tree, retval.start, retval.stop)


            except RecognitionException, re:
                self.reportError(re)
                self.recover(self.input, re)
                retval.tree = self._adaptor.errorNode(self.input, retval.start, self.input.LT(-1), re)
        finally:

            pass

        return retval

    # $ANTLR end "source_mapping"

    class element_return(ParserRuleReturnScope):
        def __init__(self):
            ParserRuleReturnScope.__init__(self)

            self.tree = None




    # $ANTLR start "element"
    # ST.g:14:1: element[d] : ( item '{' ( element[n] )* '}' | i0= item i1= item );
    def element(self, d):

        retval = self.element_return()
        retval.start = self.input.LT(1)

        root_0 = None

        char_literal3 = None
        char_literal5 = None
        i0 = None

        i1 = None

        item2 = None

        element4 = None


        char_literal3_tree = None
        char_literal5_tree = None

        try:
            try:
                # ST.g:15:5: ( item '{' ( element[n] )* '}' | i0= item i1= item )
                alt3 = 2
                LA3_0 = self.input.LA(1)

                if (LA3_0 == STRING) :
                    LA3_1 = self.input.LA(2)

                    if (LA3_1 == STRING) :
                        alt3 = 2
                    elif (LA3_1 == 14) :
                        alt3 = 1
                    else:
                        nvae = NoViableAltException("", 3, 1, self.input)

                        raise nvae

                else:
                    nvae = NoViableAltException("", 3, 0, self.input)

                    raise nvae

                if alt3 == 1:
                    # ST.g:15:9: item '{' ( element[n] )* '}'
                    pass 
                    root_0 = self._adaptor.nil()

                    self._state.following.append(self.FOLLOW_item_in_element55)
                    item2 = self.item()

                    self._state.following.pop()
                    self._adaptor.addChild(root_0, item2.tree)
                    #action start
                    n = d[((item2 is not None) and [item2.value] or [None])[0]] = dict() 
                    #action end
                    char_literal3=self.match(self.input, 14, self.FOLLOW_14_in_element60)

                    char_literal3_tree = self._adaptor.createWithPayload(char_literal3)
                    self._adaptor.addChild(root_0, char_literal3_tree)

                    # ST.g:15:51: ( element[n] )*
                    while True: #loop2
                        alt2 = 2
                        LA2_0 = self.input.LA(1)

                        if (LA2_0 == STRING) :
                            alt2 = 1


                        if alt2 == 1:
                            # ST.g:15:52: element[n]
                            pass 
                            self._state.following.append(self.FOLLOW_element_in_element63)
                            element4 = self.element(n)

                            self._state.following.pop()
                            self._adaptor.addChild(root_0, element4.tree)


                        else:
                            break #loop2


                    char_literal5=self.match(self.input, 15, self.FOLLOW_15_in_element68)

                    char_literal5_tree = self._adaptor.createWithPayload(char_literal5)
                    self._adaptor.addChild(root_0, char_literal5_tree)



                elif alt3 == 2:
                    # ST.g:16:9: i0= item i1= item
                    pass 
                    root_0 = self._adaptor.nil()

                    self._state.following.append(self.FOLLOW_item_in_element80)
                    i0 = self.item()

                    self._state.following.pop()
                    self._adaptor.addChild(root_0, i0.tree)
                    self._state.following.append(self.FOLLOW_item_in_element84)
                    i1 = self.item()

                    self._state.following.pop()
                    self._adaptor.addChild(root_0, i1.tree)
                    #action start
                    d[i0.value] = unicode(i1.value) 
                    #action end


                retval.stop = self.input.LT(-1)


                retval.tree = self._adaptor.rulePostProcessing(root_0)
                self._adaptor.setTokenBoundaries(retval.tree, retval.start, retval.stop)


            except RecognitionException, re:
                self.reportError(re)
                self.recover(self.input, re)
                retval.tree = self._adaptor.errorNode(self.input, retval.start, self.input.LT(-1), re)
        finally:

            pass

        return retval

    # $ANTLR end "element"

    class item_return(ParserRuleReturnScope):
        def __init__(self):
            ParserRuleReturnScope.__init__(self)

            self.value = None
            self.tree = None




    # $ANTLR start "item"
    # ST.g:20:1: item returns [value] : STRING ;
    def item(self, ):

        retval = self.item_return()
        retval.start = self.input.LT(1)

        root_0 = None

        STRING6 = None

        STRING6_tree = None

        try:
            try:
                # ST.g:21:5: ( STRING )
                # ST.g:21:9: STRING
                pass 
                root_0 = self._adaptor.nil()

                STRING6=self.match(self.input, STRING, self.FOLLOW_STRING_in_item110)

                STRING6_tree = self._adaptor.createWithPayload(STRING6)
                self._adaptor.addChild(root_0, STRING6_tree)

                #action start
                retval.value = STRING6.text[1:-1] 
                #action end



                retval.stop = self.input.LT(-1)


                retval.tree = self._adaptor.rulePostProcessing(root_0)
                self._adaptor.setTokenBoundaries(retval.tree, retval.start, retval.stop)


            except RecognitionException, re:
                self.reportError(re)
                self.recover(self.input, re)
                retval.tree = self._adaptor.errorNode(self.input, retval.start, self.input.LT(-1), re)
        finally:

            pass

        return retval

    # $ANTLR end "item"


    # Delegated rules


 

    FOLLOW_element_in_source_mapping31 = frozenset([1, 4])
    FOLLOW_item_in_element55 = frozenset([14])
    FOLLOW_14_in_element60 = frozenset([4, 15])
    FOLLOW_element_in_element63 = frozenset([4, 15])
    FOLLOW_15_in_element68 = frozenset([1])
    FOLLOW_item_in_element80 = frozenset([4])
    FOLLOW_item_in_element84 = frozenset([1])
    FOLLOW_STRING_in_item110 = frozenset([1])



def main(argv, stdin=sys.stdin, stdout=sys.stdout, stderr=sys.stderr):
    from antlr3.main import ParserMain
    main = ParserMain("STLexer", STParser)
    main.stdin = stdin
    main.stdout = stdout
    main.stderr = stderr
    main.execute(argv)


if __name__ == '__main__':
    main(sys.argv)
