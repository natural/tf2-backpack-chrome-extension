base_name := tf2-backpack-extension
release_num  := $(shell python2 -c "import json;print json.load(open('src/manifest.json'))['version']")
release_name := ${base_name}-${release_num}
build_dir := build-$(release_num)
dist_dir  := dist-$(release_num)
tmp_dir := tmp


gcf_dir := $(TF2_GCF_DIR)
chrome := /usr/bin/google-chrome
crush  := pngcrush -force -l 9 -rem text -rem gAMA -rem cHRM -rem iCCP -rem sRGB -res 96 -rem time -q
zip    := zip -9 -q


dist_style_files := $(addprefix $(build_dir)/styles/, $(notdir $(wildcard src/styles/*.css)))
dist_script_files := $(addprefix $(build_dir)/scripts/, $(notdir $(wildcard src/scripts/*.js)))
dist_item_files := $(addprefix $(build_dir)/media/, $(notdir $(wildcard src/media/items_*.json)))
extract_text_files := $(shell find -path "./$(tmp_dir)/*" -type f -name "*.txt" | grep "items_\|tf_")


.PHONY: all clean $(dist_style_files) $(dist_script_files) $(dist_item_files) update_texts update_images $(extract_text_files) extract_files extract_image_files extract_text_files


all:
	@echo "run these instead:  make update, make check_text, make bump_version, make dist"


## distribution targets


dist: $(dist_style_files) $(dist_script_files) $(dist_item_files)
	@echo "[DIST] building..."
	@mkdir -p $(build_dir)
	@mkdir -p $(dist_dir)
	@mkdir -p $(build_dir)/scripts
	@mkdir -p $(build_dir)/styles
	@mkdir -p $(build_dir)/media

	@cp -r src/_locales $(build_dir)
	@cp src/scripts/jquery.min.js $(build_dir)/scripts
	@cp src/*.html src/*.json $(build_dir)

	@echo "[DIST] copying font files..."
	@mkdir -p $(build_dir)/media
	@cp src/media/*.ttf $(build_dir)/media

	@mkdir -p $(build_dir)/icons
	@echo "[DIST] crushing images and icons..."
	@${crush} -d $(build_dir)/icons src/icons/*.png 2>&1>/dev/null
	@rm $(build_dir)/icons/TF_*.png
	@${crush} -d $(build_dir)/media src/media/*.png 2>&1>/dev/null

	@echo "[DIST] creating distribution..."
	@cd $(build_dir) && $(zip) -r ../$(dist_dir)/$(release_name).zip .
	@echo "[DIST] build complete.  Distributable at $(dist_dir)/$(release_name).zip"


$(dist_item_files):
	@mkdir -p $(build_dir)/media
	cat src/media/$(notdir $@) | python2 -c "import json,sys;d=json.load(sys.stdin);json.dump(d,sys.stdout)" > $(build_dir)/media/$(notdir $@)


$(dist_style_files):
	@mkdir -p $(build_dir)/styles
	yuicompressor --type css src/styles/$(notdir $@) -o $(build_dir)/styles/$(notdir $@)


$(dist_script_files):
	@mkdir -p $(build_dir)/scripts
	yuicompressor --type js src/scripts/$(notdir $@) -o $(build_dir)/scripts/$(notdir $@)


## update targets


update:
	@mkdir -p $(tmp_dir)
	@echo "[UPDATE] extracting backpack files..."
	@hlextract -s -p "$(gcf_dir)/team fortress 2 materials.gcf" -e "root/tf/materials/backpack" -d $(tmp_dir)
	@echo "[UPDATE] extracting resource files..."
	@hlextract -s -p "$(gcf_dir)/team fortress 2 content.gcf" -e "root/tf/resource/" -d $(tmp_dir)
	@echo "[UPDATE] extracting other text files..."
	@hlextract -s -p "$(gcf_dir)/team fortress 2 content.gcf" -e "root/tf/scripts/items/items_game.txt" -d $(tmp_dir)
	@echo "[UPDATE] converting text files..."
	@make extract_text_files
	@echo "[UPDATE] converting images..."
	@cd $(tmp_dir) && find -type f -name "*.vtf" > image_files.txt
	@cd $(tmp_dir) && nvconvert -in vtf -o '$$%.png' -out png -quiet -overwrite -l ./image_files.txt 2>/dev/null
	@cd $(tmp_dir) && rm image_files.txt
	@echo "[UPDATE] copying new images..."
	@./tools/copy_item_images $(tmp_dir)/ ./src/icons/ ./src/rawtext/items_game.txt
	@echo "[UPDATE] cleaning up..."
	@rm -rf $(tmp_dir)
	@echo "[UPDATE] complete."


extract_text_files: $(extract_text_files)

$(extract_text_files):
	@echo "[TEXT] read $(notdir $@)"
	@emacs -nw -Q --batch --eval '(let (B)(setq B (find-file "$@"))(set-buffer-file-coding-system nil)(save-buffer)(kill-buffer B)))' 2>/dev/null
	@cp $@ src/rawtext/
	@echo "[TEXT] write $(addprefix src/rawtext/, $(notdir $@))"


item_files:
	@cd tools && make item_files


message_files:
	@cd tools && make message_files


## other targets


crx:
	@$(if $(shell pidof $(chrome)),$(error $(chrome) running, cannot create extension) $(exit 1),)
	@echo "[CRX] building..." $(relase_name).crx
	@ln -s $(build_dir) $(base_name)
	$(chrome) --pack-extension=$(base_name)
	@rm $(base_name)
	@mv $(base_name).crx $(dist_dir)/${release_name}.crx
	@echo "[CRX] complete.  Distributable at $(dist_dir)/$(release_name).crx"


clean:
	@echo "[CLEAN] starting..."
	@rm -rf $(build_dir) $(dist_dir) $(tmp_dir)
	@echo "[CLEAN] complete."

bump_version:
	@python2 -c "import json; d=json.load(open('src/manifest.json')); print 'Old version:', d['version']"
	@python2 -c "import json; d=json.load(open('src/manifest.json')); v = d['version'].split('.'); v[-1] = str(int(v[-1])+1); fh = open('src/manifest.json', 'w'); d['version'] = u'.'.join(v); json.dump(d, fh, indent=2); fh.flush(); fh.close()"
	@python2 -c "import json; d=json.load(open('src/manifest.json')); print 'New version:', d['version']"

check_text:
	@cd tools && ./check_tf_texts

