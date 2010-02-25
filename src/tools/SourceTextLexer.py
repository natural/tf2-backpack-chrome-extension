# $ANTLR 3.1.1 SourceText.g 2010-02-24 15:18:01

import sys
from antlr3 import *
from antlr3.compat import set, frozenset


# for convenience in actions
HIDDEN = BaseRecognizer.HIDDEN

# token types
LT=9
WS=7
T__12=12
T__11=11
LETTER=6
CHAR=5
LINECOMMENT=10
COMMENT=8
EOF=-1
STRING=4


class SourceTextLexer(Lexer):

    grammarFileName = "SourceText.g"
    antlr_version = version_str_to_tuple("3.1.1")
    antlr_version_str = "3.1.1"

    def __init__(self, input=None, state=None):
        if state is None:
            state = RecognizerSharedState()
        Lexer.__init__(self, input, state)

        self.dfa6 = self.DFA6(
            self, 6,
            eot = self.DFA6_eot,
            eof = self.DFA6_eof,
            min = self.DFA6_min,
            max = self.DFA6_max,
            accept = self.DFA6_accept,
            special = self.DFA6_special,
            transition = self.DFA6_transition
            )






    # $ANTLR start "T__11"
    def mT__11(self, ):

        try:
            _type = T__11
            _channel = DEFAULT_CHANNEL

            # SourceText.g:7:7: ( '{' )
            # SourceText.g:7:9: '{'
            pass 
            self.match(123)



            self._state.type = _type
            self._state.channel = _channel

        finally:

            pass

    # $ANTLR end "T__11"



    # $ANTLR start "T__12"
    def mT__12(self, ):

        try:
            _type = T__12
            _channel = DEFAULT_CHANNEL

            # SourceText.g:8:7: ( '}' )
            # SourceText.g:8:9: '}'
            pass 
            self.match(125)



            self._state.type = _type
            self._state.channel = _channel

        finally:

            pass

    # $ANTLR end "T__12"



    # $ANTLR start "CHAR"
    def mCHAR(self, ):

        try:
            # SourceText.g:35:14: (~ ( '\"' | '\\\\' ) )
            # SourceText.g:35:16: ~ ( '\"' | '\\\\' )
            pass 
            if (0 <= self.input.LA(1) <= 33) or (35 <= self.input.LA(1) <= 91) or (93 <= self.input.LA(1) <= 65535):
                self.input.consume()
            else:
                mse = MismatchedSetException(None, self.input)
                self.recover(mse)
                raise mse





        finally:

            pass

    # $ANTLR end "CHAR"



    # $ANTLR start "LETTER"
    def mLETTER(self, ):

        try:
            # SourceText.g:37:5: ( '\\u0024' | '\\u0041' .. '\\u005a' | '\\u005f' | '\\u0061' .. '\\u007a' | '\\u00c0' .. '\\u00d6' | '\\u00d8' .. '\\u00f6' | '\\u00f8' .. '\\u00ff' | '\\u0100' .. '\\u1fff' | '\\u3040' .. '\\u318f' | '\\u3300' .. '\\u337f' | '\\u3400' .. '\\u3d2d' | '\\u4e00' .. '\\u9fff' | '\\uf900' .. '\\ufaff' | '\\u0030' .. '\\u0039' | '\\u0660' .. '\\u0669' | '\\u06f0' .. '\\u06f9' | '\\u0966' .. '\\u096f' | '\\u09e6' .. '\\u09ef' | '\\u0a66' .. '\\u0a6f' | '\\u0ae6' .. '\\u0aef' | '\\u0b66' .. '\\u0b6f' | '\\u0be7' .. '\\u0bef' | '\\u0c66' .. '\\u0c6f' | '\\u0ce6' .. '\\u0cef' | '\\u0d66' .. '\\u0d6f' | '\\u0e50' .. '\\u0e59' | '\\u0ed0' .. '\\u0ed9' | '\\u1040' .. '\\u1049' )
            # SourceText.g:
            pass 
            if self.input.LA(1) == 36 or (48 <= self.input.LA(1) <= 57) or (65 <= self.input.LA(1) <= 90) or self.input.LA(1) == 95 or (97 <= self.input.LA(1) <= 122) or (192 <= self.input.LA(1) <= 214) or (216 <= self.input.LA(1) <= 246) or (248 <= self.input.LA(1) <= 8191) or (12352 <= self.input.LA(1) <= 12687) or (13056 <= self.input.LA(1) <= 13183) or (13312 <= self.input.LA(1) <= 15661) or (19968 <= self.input.LA(1) <= 40959) or (63744 <= self.input.LA(1) <= 64255):
                self.input.consume()
            else:
                mse = MismatchedSetException(None, self.input)
                self.recover(mse)
                raise mse





        finally:

            pass

    # $ANTLR end "LETTER"



    # $ANTLR start "WS"
    def mWS(self, ):

        try:
            _type = WS
            _channel = DEFAULT_CHANNEL

            # SourceText.g:68:3: ( ( ' ' | '\\r' | '\\t' | '\\u000C' | '\\n' ) )
            # SourceText.g:68:5: ( ' ' | '\\r' | '\\t' | '\\u000C' | '\\n' )
            pass 
            if (9 <= self.input.LA(1) <= 10) or (12 <= self.input.LA(1) <= 13) or self.input.LA(1) == 32:
                self.input.consume()
            else:
                mse = MismatchedSetException(None, self.input)
                self.recover(mse)
                raise mse

            #action start
            _channel=HIDDEN; 
            #action end



            self._state.type = _type
            self._state.channel = _channel

        finally:

            pass

    # $ANTLR end "WS"



    # $ANTLR start "STRING"
    def mSTRING(self, ):

        try:
            _type = STRING
            _channel = DEFAULT_CHANNEL

            # SourceText.g:69:7: ( '\"' ( CHAR | LETTER )* '\"' )
            # SourceText.g:69:9: '\"' ( CHAR | LETTER )* '\"'
            pass 
            self.match(34)
            # SourceText.g:69:13: ( CHAR | LETTER )*
            while True: #loop1
                alt1 = 2
                LA1_0 = self.input.LA(1)

                if ((0 <= LA1_0 <= 33) or (35 <= LA1_0 <= 91) or (93 <= LA1_0 <= 65535)) :
                    alt1 = 1


                if alt1 == 1:
                    # SourceText.g:
                    pass 
                    if (0 <= self.input.LA(1) <= 33) or (35 <= self.input.LA(1) <= 91) or (93 <= self.input.LA(1) <= 65535):
                        self.input.consume()
                    else:
                        mse = MismatchedSetException(None, self.input)
                        self.recover(mse)
                        raise mse



                else:
                    break #loop1


            self.match(34)



            self._state.type = _type
            self._state.channel = _channel

        finally:

            pass

    # $ANTLR end "STRING"



    # $ANTLR start "COMMENT"
    def mCOMMENT(self, ):

        try:
            _type = COMMENT
            _channel = DEFAULT_CHANNEL

            # SourceText.g:73:5: ( '/*' ( options {greedy=false; } : . )* '*/' )
            # SourceText.g:73:7: '/*' ( options {greedy=false; } : . )* '*/'
            pass 
            self.match("/*")
            # SourceText.g:73:12: ( options {greedy=false; } : . )*
            while True: #loop2
                alt2 = 2
                LA2_0 = self.input.LA(1)

                if (LA2_0 == 42) :
                    LA2_1 = self.input.LA(2)

                    if (LA2_1 == 47) :
                        alt2 = 2
                    elif ((0 <= LA2_1 <= 46) or (48 <= LA2_1 <= 65535)) :
                        alt2 = 1


                elif ((0 <= LA2_0 <= 41) or (43 <= LA2_0 <= 65535)) :
                    alt2 = 1


                if alt2 == 1:
                    # SourceText.g:73:39: .
                    pass 
                    self.matchAny()


                else:
                    break #loop2


            self.match("*/")
            #action start
            _channel=HIDDEN;
            #action end



            self._state.type = _type
            self._state.channel = _channel

        finally:

            pass

    # $ANTLR end "COMMENT"



    # $ANTLR start "LINECOMMENT"
    def mLINECOMMENT(self, ):

        try:
            _type = LINECOMMENT
            _channel = DEFAULT_CHANNEL

            # SourceText.g:77:5: ( '//' (~ ( LT ) )* | '[$' ( CHAR )* )
            alt5 = 2
            LA5_0 = self.input.LA(1)

            if (LA5_0 == 47) :
                alt5 = 1
            elif (LA5_0 == 91) :
                alt5 = 2
            else:
                nvae = NoViableAltException("", 5, 0, self.input)

                raise nvae

            if alt5 == 1:
                # SourceText.g:77:7: '//' (~ ( LT ) )*
                pass 
                self.match("//")
                # SourceText.g:77:12: (~ ( LT ) )*
                while True: #loop3
                    alt3 = 2
                    LA3_0 = self.input.LA(1)

                    if ((0 <= LA3_0 <= 9) or (11 <= LA3_0 <= 12) or (14 <= LA3_0 <= 8231) or (8234 <= LA3_0 <= 65535)) :
                        alt3 = 1


                    if alt3 == 1:
                        # SourceText.g:77:12: ~ ( LT )
                        pass 
                        if (0 <= self.input.LA(1) <= 9) or (11 <= self.input.LA(1) <= 12) or (14 <= self.input.LA(1) <= 8231) or (8234 <= self.input.LA(1) <= 65535):
                            self.input.consume()
                        else:
                            mse = MismatchedSetException(None, self.input)
                            self.recover(mse)
                            raise mse



                    else:
                        break #loop3


                #action start
                _channel=HIDDEN;
                #action end


            elif alt5 == 2:
                # SourceText.g:78:7: '[$' ( CHAR )*
                pass 
                self.match("[$")
                # SourceText.g:78:12: ( CHAR )*
                while True: #loop4
                    alt4 = 2
                    LA4_0 = self.input.LA(1)

                    if ((0 <= LA4_0 <= 33) or (35 <= LA4_0 <= 91) or (93 <= LA4_0 <= 65535)) :
                        alt4 = 1


                    if alt4 == 1:
                        # SourceText.g:78:12: CHAR
                        pass 
                        self.mCHAR()


                    else:
                        break #loop4


                #action start
                _channel=HIDDEN;
                #action end


            self._state.type = _type
            self._state.channel = _channel

        finally:

            pass

    # $ANTLR end "LINECOMMENT"



    # $ANTLR start "LT"
    def mLT(self, ):

        try:
            _type = LT
            _channel = DEFAULT_CHANNEL

            # SourceText.g:82:5: ( '\\n' | '\\r' | '\\u2028' | '\\u2029' )
            # SourceText.g:
            pass 
            if self.input.LA(1) == 10 or self.input.LA(1) == 13 or (8232 <= self.input.LA(1) <= 8233):
                self.input.consume()
            else:
                mse = MismatchedSetException(None, self.input)
                self.recover(mse)
                raise mse




            self._state.type = _type
            self._state.channel = _channel

        finally:

            pass

    # $ANTLR end "LT"



    def mTokens(self):
        # SourceText.g:1:8: ( T__11 | T__12 | WS | STRING | COMMENT | LINECOMMENT | LT )
        alt6 = 7
        alt6 = self.dfa6.predict(self.input)
        if alt6 == 1:
            # SourceText.g:1:10: T__11
            pass 
            self.mT__11()


        elif alt6 == 2:
            # SourceText.g:1:16: T__12
            pass 
            self.mT__12()


        elif alt6 == 3:
            # SourceText.g:1:22: WS
            pass 
            self.mWS()


        elif alt6 == 4:
            # SourceText.g:1:25: STRING
            pass 
            self.mSTRING()


        elif alt6 == 5:
            # SourceText.g:1:32: COMMENT
            pass 
            self.mCOMMENT()


        elif alt6 == 6:
            # SourceText.g:1:40: LINECOMMENT
            pass 
            self.mLINECOMMENT()


        elif alt6 == 7:
            # SourceText.g:1:52: LT
            pass 
            self.mLT()







    # lookup tables for DFA #6

    DFA6_eot = DFA.unpack(
        u"\12\uffff"
        )

    DFA6_eof = DFA.unpack(
        u"\12\uffff"
        )

    DFA6_min = DFA.unpack(
        u"\1\11\4\uffff\1\52\4\uffff"
        )

    DFA6_max = DFA.unpack(
        u"\1\u2029\4\uffff\1\57\4\uffff"
        )

    DFA6_accept = DFA.unpack(
        u"\1\uffff\1\1\1\2\1\3\1\4\1\uffff\1\6\1\3\1\7\1\5"
        )

    DFA6_special = DFA.unpack(
        u"\12\uffff"
        )

            
    DFA6_transition = [
        DFA.unpack(u"\1\7\1\3\1\uffff\1\7\1\3\22\uffff\1\7\1\uffff\1\4\14"
        u"\uffff\1\5\53\uffff\1\6\37\uffff\1\1\1\uffff\1\2\u1faa\uffff\2"
        u"\10"),
        DFA.unpack(u""),
        DFA.unpack(u""),
        DFA.unpack(u""),
        DFA.unpack(u""),
        DFA.unpack(u"\1\11\4\uffff\1\6"),
        DFA.unpack(u""),
        DFA.unpack(u""),
        DFA.unpack(u""),
        DFA.unpack(u"")
    ]

    # class definition for DFA #6

    DFA6 = DFA
 



def main(argv, stdin=sys.stdin, stdout=sys.stdout, stderr=sys.stderr):
    from antlr3.main import LexerMain
    main = LexerMain(SourceTextLexer)
    main.stdin = stdin
    main.stdout = stdout
    main.stderr = stderr
    main.execute(argv)


if __name__ == '__main__':
    main(sys.argv)
