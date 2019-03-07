all: rebuild

build:
	rm -f sdui.tgz
	npm install
	npm install bower && ./node_modules/.bin/bower install --allow-root
	./node_modules/.bin/ember build --environment production
	tar -C dist -cvzf sdui.tgz .
	docker build . -t screwdrivercd/ui:local

rebuild:
	rm -f sdui.tgz
	./node_modules/.bin/ember build --environment production
	tar -C dist -cvzf sdui.tgz .
	docker build . -t screwdrivercd/ui:test
