# Makefile

# Default target: display help
all: filewatch

# Build directory of Obsidian plugin
DIST_DIR = ~/Documents/code/obsidian-plantuml-lite/dist

PLUGIN_NAME := $(shell jq -r '.id' manifest.json)
PLUGIN_DIR := ~/Documents/workflow/.obsidian/plugins/$(PLUGIN_NAME)

help:
	@echo "Available targets:"
	@echo "  filewatch   - Watches and copies contents of ./dist folder to .obsidian/plugins. Useful for development inside a dev container. NB: Run this command outside of container"

filewatch:
	touch $(PLUGIN_DIR)/.hotreload
	fswatch -o $(DIST_DIR) | xargs -n1 -I{} cp -r $(DIST_DIR)/. $(PLUGIN_DIR)/
