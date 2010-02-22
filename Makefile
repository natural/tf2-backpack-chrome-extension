package := $(shell basename `pwd`)
release_num := $(shell python -c "import json;print json.load(open('manifest.json'))['version']")
release_dir := release-$(release_num)


.PHONEY: all clean

all: dist

clean:
	@rm -rf $(release_dir)
	@echo "clean"

crx: $(release_dir)

$(release_dir):
	/usr/bin/google-chrome --pack-extension=../$(package)
	mkdir -p $(release_dir)
	mv ../$(package).crx $(release_dir)
	mv ../$(package).pem $(release_dir)
