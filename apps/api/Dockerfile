FROM php:8.3-cli-alpine

WORKDIR /var/www/afyalink/apps/api

RUN apk add --no-cache postgresql-dev git unzip \
    && docker-php-ext-install pdo_pgsql \
    && php -r "copy('https://getcomposer.org/installer', '/tmp/composer-setup.php');" \
    && php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer \
    && rm /tmp/composer-setup.php

COPY composer.json ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . ./
RUN mkdir -p storage/runtime storage/private/credentials

ENV APP_ENV=production \
    AFYALINK_DATASTORE=pgsql \
    AFYALINK_CREDENTIAL_STORAGE=local \
    AFYALINK_LOCAL_CREDENTIAL_ROOT=/tmp/afyalink/credentials

CMD mkdir -p "${AFYALINK_LOCAL_CREDENTIAL_ROOT:-/tmp/afyalink/credentials}" \
    && php -S 0.0.0.0:${PORT:-10000} -t public public/index.php

