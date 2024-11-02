node:
	cd contracts &&\
	npm run node

test:
	cd contracts &&\
	npm run test-snapshot

coverage:
	cd contracts &&\
	npm run coverage

setup:
	cd contracts &&\
	npm run setup

yield:
	cd contracts &&\
	npm run yield

app:
	cd app &&\
	npm run dev

.PHONY: node test coverage setup yield app