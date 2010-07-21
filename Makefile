base_name := tf2-backpack-extension
release_num  := $(shell python -c "import json;print json.load(open('src/manifest.json'))['version']")
release_name := ${base_name}-${release_num}
build_dir := build-$(release_num)
dist_dir  := dist-$(release_num)
tmp_dir := tmp


steam_apps_dir := /home/troy/.wine-steam/drive_c/Program Files/Steam/steamapps/
chrome := /usr/bin/google-chrome
crush  := pngcrush -force -l 9 -rem text -rem gAMA -rem cHRM -rem iCCP -rem sRGB -res 96 -rem time -q
zip    := zip -9 -q


style_files := $(addprefix $(build_dir)/styles/, $(notdir $(wildcard src/styles/*.css)))
script_files := $(addprefix $(build_dir)/scripts/, $(notdir $(wildcard src/scripts/*.js)))
item_files := $(addprefix $(build_dir)/media/, $(notdir $(wildcard src/media/items_*.json)))
text_files := $(shell find $(tmp_dir) -type f -name "*.txt" | grep "items_\|tf_")



.PHONY: all clean $(style_files) $(script_files) $(item_files) update_texts update_images $(text_files) extract_files image_files text_files


all: dist


clean:
	@echo "[CLEAN] starting"
	@rm -rf $(build_dir)
	@rm -rf $(dist_dir)
	@rm -rf $(tmp_dir)/*
	@echo "[CLEAN] done."


dist: $(style_files) $(script_files) $(item_files)
	@echo "[DIST] building"
	@mkdir -p $(build_dir)
	@mkdir -p $(dist_dir)
	@mkdir -p $(build_dir)/scripts
	@mkdir -p $(build_dir)/styles
	@mkdir -p $(build_dir)/media

	@cp -r src/_locales $(build_dir)
	@cp src/scripts/jquery.min.js $(build_dir)/scripts
	@cp src/*.html src/*.json $(build_dir)

	@echo "[DIST] copying font files"
	@mkdir -p $(build_dir)/media
	@cp src/media/*.ttf $(build_dir)/media

	@mkdir -p $(build_dir)/icons
	@echo "[DIST] crushing images and icons"
	@${crush} -d $(build_dir)/icons src/icons/*.png 2>&1>/dev/null
	@${crush} -d $(build_dir)/media src/media/*.png 2>&1>/dev/null

	@echo "[DIST] creating distribution"
	@cd $(build_dir) && $(zip) -r ../$(dist_dir)/$(release_name).zip .
	@echo "[DIST] done.  Distributable at $(dist_dir)/$(release_name).zip"


$(item_files):
	@mkdir -p $(build_dir)/media
	cat src/media/$(notdir $@) | python -c "import json,sys;d=json.load(sys.stdin);json.dump(d,sys.stdout)" > $(build_dir)/media/$(notdir $@)


$(style_files):
	@mkdir -p $(build_dir)/styles
	yuicompressor --type css src/styles/$(notdir $@) -o $(build_dir)/styles/$(notdir $@)


$(script_files):
	@mkdir -p $(build_dir)/scripts
	yuicompressor --type js src/scripts/$(notdir $@) -o $(build_dir)/scripts/$(notdir $@)


crx:
	@$(if $(shell pidof $(chrome)),$(error $(chrome) running, cannot create extension) $(exit 1),)
	@echo "[CRX] building" $(relase_name).crx
	@ln -s $(build_dir) $(base_name)
	$(chrome) --pack-extension=$(base_name)
	@rm $(base_name)
	@mv $(base_name).crx $(dist_dir)/${release_name}.crx
	@echo "[CRX] done.  Distributable at $(dist_dir)/$(release_name).crx"

update: extract_files text_files image_files


extract_files:
	@hlextract -p "$(steam_apps_dir)/team fortress 2 materials.gcf" -e "root/tf/materials/backpack" -d $(tmp_dir)
	@hlextract -p "$(steam_apps_dir)/team fortress 2 content.gcf" -e "root/tf/resource/" -d $(tmp_dir)
	@hlextract -p "$(steam_apps_dir)/team fortress 2 content.gcf" -e "root/tf/scripts/items/items_game.txt" -d $(tmp_dir)


text_files: $(text_files)


$(text_files):
	@echo "[READ ]  $(notdir $@)"
	@emacs -nw -Q --batch --eval '(let (B)(setq B (find-file "$@"))(set-buffer-file-coding-system nil)(save-buffer)(kill-buffer B)))' 2>/dev/null
	@cp $@ src/rawtext/
	@echo "[WRITE]  $(addprefix src/rawtext/, $(notdir $@))"


image_files:
	@echo "[CONVERT IMAGES]"
	@cd $(tmp_dir) && find -type f -name "*.vtf" > image_files.txt
	@cd $(tmp_dir) && WINEPREFIX="/home/troy/.wine-steam" wine "/home/troy/.wine-steam/drive_c/Program Files/XnView/nconvert.exe" -in vtf -o '$$%.png' -out png -quiet -overwrite -l ./image_files.txt 2>/dev/null
	@cd $(tmp_dir) && rm image_files.txt
	@echo "[CONVERT IMAGES] done"
	@echo "[UPDATE  IMAGES]"
	@./src/tools/copy_item_images $(tmp_dir)/ ./src/icons/ ./src/rawtext/items_game.txt
	@echo "[UPDATE  IMAGES] done"
