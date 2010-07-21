json_files = $(shell cat control_files.txt | cut -f 2 -d " "|grep -v NONE)
tran_files = $(shell cat control_files.txt | cut -f 3 -d " "|grep -v NONE)



.PHONY: all check clean messages parser $(json_files) $(tran_files)
.SILENT: clean


all:
	@echo "run these instead:  make parser, make item_files, make message_files, make clean"


parser:
	@cd source_text_parser && make



clean:
	@rm -f err.txt out.txt
	@cd source_text_parser && make clean


item_files: $(json_files)
$(json_files):
	@echo "[JSON ITEMS]" $@
	@./tf_text2items_json.py $(shell grep $@ control_files.txt | cut -f 1 -d " ") $@


message_files: $(tran_files)
$(tran_files):
	@./tf_text2messages_json.py $@

