#!/bin/bash

if [[ $(git diff --diff-filter=ACM origin/develop --name-only) ]]; then
    php phpcs.phar --extensions=php --error-severity=1 --warning-severity=6 --standard=PSR2 $(git diff --diff-filter=ACM origin/develop --name-only)
else
    echo "No modified files."
fi