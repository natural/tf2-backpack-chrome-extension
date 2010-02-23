release_name := $(shell python -c "import json;print json.load(open('src/manifest.json'))['name'].lower().replace(' ', '_')")
release_num  := $(shell python -c "import json;print json.load(open('src/manifest.json'))['version']")
## yuicompressor --type css
## yuicompressor --type js
build_dir := build-$(release_num)
dist_dir := dist-$(release_num)
crush := pngcrush -force -l 9 -rem text -rem gAMA -rem cHRM -rem iCCP -rem sRGB -res 96 -rem time -q
zip   := zip -9 -q

.PHONEY: all clean

all: dist

clean:
	@echo "[CLEAN] starting..."
	@rm -rf $(build_dir)
	@rm -rf $(dist_dir)
	@echo "[CLEAN] done."

dist:
	@echo "[DIST] building..."
	@mkdir -p $(build_dir)
	@mkdir -p $(dist_dir)

	@cp src/*.html src/*.json $(build_dir)

	@mkdir -p $(build_dir)/data
	@cp src/data/items.json $(build_dir)/data

	@mkdir -p $(build_dir)/fonts
	@cp src/fonts/*.ttf $(build_dir)/fonts

	@mkdir -p $(build_dir)/icons
	@echo "[DIST] crushing images and icons..."
	@${crush} -d $(build_dir)/icons src/icons/*.png 2>&1>/dev/null

	@mkdir -p $(build_dir)/images
	@${crush} -d $(build_dir)/images src/images/*.png 2>&1>/dev/null
	@rm $(build_dir)/images/Team_Fortress_2_Icon_by_Rusty100.png
	@echo "[DIST] done crushing."

	@mkdir -p $(build_dir)/scripts
	@cp src/scripts/*.js $(build_dir)/scripts
	@echo "TODO: minify scripts in $(build_dir)/scripts"

	@mkdir -p $(build_dir)/styles
	@cp src/styles/*.css $(build_dir)/styles
	@echo "TODO: minify styles in $(build_dir)/styles"

	@echo "[DIST] creating distribution..."
	@cd $(build_dir) && $(zip) -r ../$(dist_dir)/$(release_name)-$(release_num).zip .
	@echo "[DIST] done.  Distributable at $(dist_dir)/$(release_name)-$(release_num).zip"

crx:
	@echo "[CRX] building..."
	@mkdir -p $(build_dir)
	/usr/bin/google-chrome --pack-extension=./src
	mv ./src.crx $(build_dir)/$(release_name).crx
	mv ./src.pem $(build_dir)/$(release_name).pem
	@echo "[CRX] done."
