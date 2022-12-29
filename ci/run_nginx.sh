#!/bin/bash

composer -o install --prefer-dist

mkdir -p /tmp/cache-www
rm -rf /tmp/cache-www/*
chmod 777 -R /tmp/cache-www

./vendor/bin/phing -Dproject.environment=circleci-test circleci

echo "127.0.0.1       local-www.loisirsentest.com local-api.loisirsentest.com" | tee -a /etc/hosts
service php7.1-fpm restart
nginx -g "daemon off;"
