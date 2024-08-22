.PHONY: manifests deploy

dc = docker compose

ENVIRONMENT ?= local
HELM_ARGS = manifests/chart \
	-f manifests/values.yaml \
	-f manifests/env/${ENVIRONMENT}.yaml \
	--set image.tag=${VERSION}

REGISTRY ?= 127.0.0.1:5001
REPOSITORY ?= salmagundi/mm-kiesjekraam
VERSION ?= latest

all: build push deploy fixtures

build:
	$(dc) build

test:
	echo "No tests available"

push:
	$(dc) push


manifests:
	@helm template mm-api $(HELM_ARGS) $(ARGS)

deploy: manifests
	helm upgrade --install mm-kiesjekraam $(HELM_ARGS) $(ARGS)

update-chart:
	rm -rf manifests/chart
	git clone --branch 1.9.0 --depth 1 git@github.com:Amsterdam/helm-application.git manifests/chart
	rm -rf manifests/chart/.git

clean:
	$(dc) down -v --remove-orphans

fixtures:
	echo "has no fixtures"

reset:
	kubectl delete deployment mm-kiesjekraam-mm-kiesjekraam && kubectl delete ingress mm-kiesjekraam-internal-mm-kiesjekraam && helm uninstall mm-kiesjekraam

refresh: reset build push deploy

dev:
	nohup kubycat kubycat-config.yaml > /dev/null 2>&1&
