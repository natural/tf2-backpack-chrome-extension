#release_name := $(shell python -c "import json;print json.load(open('src/manifest.json'))['name'].lower().replace(' ', '_')")
release_num  := $(shell python -c "import json;print json.load(open('src/manifest.json'))['version']")
base_name := tf2-backpack-extension
release_name := ${base_name}-${release_num}
build_dir := build-$(release_num)
dist_dir  := dist-$(release_num)

chrome := /usr/bin/google-chrome
crush  := pngcrush -force -l 9 -rem text -rem gAMA -rem cHRM -rem iCCP -rem sRGB -res 96 -rem time -q
zip    := zip -9 -q

style_files := $(addprefix $(build_dir)/styles/, $(notdir $(wildcard src/styles/*.css)))
script_files := $(addprefix $(build_dir)/scripts/, $(notdir $(wildcard src/scripts/*.js)))
item_files := $(addprefix $(build_dir)/media/, $(notdir $(wildcard src/media/items_*.json)))


.PHONEY: all clean $(style_files) $(script_files) $(item_files)

all: dist

clean:
	@echo "[CLEAN] starting"
	@rm -rf $(build_dir)
	@rm -rf $(dist_dir)
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


update_files:
	@echo "[UPDATE FILES]"
	@echo "[UPDATE FILES] text files -> src/rawtext/"
	@cp ../../var/tf2content/output/texts/*.txt src/rawtext/
	@echo "[UPDATE FILES] done."


update_images:
	@echo "[UPDATE IMAGES]"
	@./src/tools/copy_item_images /home/troy/var/tf2content/output/ ./src/icons/ ./src/rawtext/items_game.txt
	@echo "[UPDATE IMAGES] done"
