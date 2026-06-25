#!/bin/sh
set -e

# Substitute ONLY ${PORT}; leave all other nginx variables ($uri, $host, etc.) untouched
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
