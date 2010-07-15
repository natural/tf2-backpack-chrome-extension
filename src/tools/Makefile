#tf_files := $(filter tf_koreana$,$(wildcard ../media/tf_*.txt))

noitems := ../media/tf_koreana.txt ../media/tf_norwegian.txt
tf_files := $(filter-out $(noitems), $(wildcard ../media/tf_*.txt))

notrans := tf_english.txt tf_koreana.txt tf_norwegian.txt
msg_files := $(filter-out $(notrans), $(notdir $(wildcard ../media/tf_*.txt)))

.PHONY: all clean messages $(tf_files) parser

.SILENT: clean



all:
	@echo run make parser, make messages, make items, or make clean



items: $(tf_files)

messages: $(msg_files)

$(tf_files):
	./build_json_items $@ > ../media/items_$(shell python map_locale.py --file=$@).json


$(msg_files):
	./translate_messages.py $(shell python map_locale.py --file=$@)


parser:
	@cd source_text_parser && make


clean:
	@cd source_text_parser && make clean

