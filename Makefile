.PHONY: up down restart status logs test psql bootstrap dev

up:
	./scripts/dev.sh up

dev:
	./run.sh

bootstrap:
	./scripts/dev.sh bootstrap

down:
	./scripts/dev.sh down

restart:
	./scripts/dev.sh restart

status:
	./scripts/dev.sh status

logs:
	./scripts/dev.sh logs

test:
	./scripts/dev.sh test

psql:
	./scripts/dev.sh psql

artisan:
	./scripts/dev.sh artisan $(filter-out $@,$(MAKECMDGOALS))

# Allow passing arguments to artisan and other targets
%:
	@:

