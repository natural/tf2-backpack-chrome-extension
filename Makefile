release_name := $(shell python -c "import json;print json.load(open('src/manifest.json'))['name'].lower().replace(' ', '_')")
release_num  := $(shell python -c "import json;print json.load(open('src/manifest.json'))['version']")
build_dir := build-$(release_num)
dist_dir  := dist-$(release_num)

chrome := /usr/bin/google-chrome
crush  := pngcrush -force -l 9 -rem text -rem gAMA -rem cHRM -rem iCCP -rem sRGB -res 96 -rem time -q
zip    := zip -9 -q

style_files := $(addprefix $(build_dir)/styles/, $(notdir $(wildcard src/styles/*.css)))
script_files := $(addprefix $(build_dir)/scripts/, $(notdir $(wildcard src/scripts/*.js)))



.PHONEY: all clean $(style_files) $(script_files)

all: dist

clean:
	@echo "[CLEAN] starting..."
	@rm -rf $(build_dir)
	@rm -rf $(dist_dir)
	@echo "[CLEAN] done."

dist: $(style_files) $(script_files)
	@echo "[DIST] building..."
	@mkdir -p $(build_dir)
	@mkdir -p $(dist_dir)
	@mkdir -p $(build_dir)/scripts
	@mkdir -p $(build_dir)/styles

	@cp src/scripts/jquery.min.js $(build_dir)/scripts
	@cp src/*.html src/*.json $(build_dir)

	@mkdir -p $(build_dir)/data
	cat src/data/items.json | python -c "import json,sys;d=json.load(sys.stdin);json.dump(d,sys.stdout)" > $(build_dir)/data/items.json

	@mkdir -p $(build_dir)/fonts
	@cp src/fonts/*.ttf $(build_dir)/fonts

	@mkdir -p $(build_dir)/icons
	@echo "[DIST] crushing images and icons..."
	@${crush} -d $(build_dir)/icons src/icons/*.png 2>&1>/dev/null

	@mkdir -p $(build_dir)/images
	@${crush} -d $(build_dir)/images src/images/*.png 2>&1>/dev/null
	@echo "[DIST] done crushing."

	@echo "[DIST] creating distribution..."
	@cd $(build_dir) && $(zip) -r ../$(dist_dir)/$(release_name)-$(release_num).zip .
	@echo "[DIST] done.  Distributable at $(dist_dir)/$(release_name)-$(release_num).zip"


$(style_files):
	@mkdir -p $(build_dir)/styles
	yuicompressor --type css src/styles/$(notdir $@) -o $(build_dir)/styles/$(notdir $@)

$(script_files):
	@mkdir -p $(build_dir)/scripts
	yuicompressor --type js src/scripts/$(notdir $@) -o $(build_dir)/scripts/$(notdir $@)


crx:
	@$(if $(shell pidof $(chrome)),$(error $(chrome) running, cannot create extension) $(exit 1),)
	@echo "[CRX] building..."
	@ln -s $(build_dir) $(release_name)
	$(chrome) --pack-extension=$(release_name) --pack-extension-key=$(release_name).pem
	@rm $(release_name)
	@mv $(release_name).crx $(dist_dir)
	@echo "[CRX] done.  Distributable at $(dist_dir)/$(release_name).crx"
