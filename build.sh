#!/bin/bash

set -euo pipefail

DIR=$(readlink -f "$(dirname "$0")")

FILES=(
    chrome
    chrome.manifest
    defaults
    install.rdf
)

zip -r "${DIR}/gerritfilter.xpi" "${FILES[@]}"
