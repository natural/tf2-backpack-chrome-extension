package := $(shell basename `pwd`)
release_num := $(shell python -c "import json;print json.load(open('src/manifest.json'))['version']")
release_dir := release-$(release_num)


.PHONEY: all clean


all: zip


clean:
	@rm -rf $(release_dir)
	@echo "clean"


zip:
	@echo "[zip] buidling..."
	@mkdir -p $(release_dir)
	@echo "[zip] built"


crx:
	@echo "[crx] building..."
	@mkdir -p $(release_dir)
	/usr/bin/google-chrome --pack-extension=./src
	mv ./src.crx $(release_dir)/$(package).crx
	mv ./src.pem $(release_dir)/$(package).pem
	@echo "[crx] built"

