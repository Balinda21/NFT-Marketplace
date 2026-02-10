#!/bin/bash
# Run this as a cron job: 0 0 1 * * /path/to/renew-ssl.sh
cd "$(dirname "$0")"
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
