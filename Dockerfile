FROM php:8.4-fpm-alpine

# System deps
RUN apk add --no-cache \
    git curl bash libpng-dev libzip-dev zip unzip oniguruma-dev \
    postgresql-dev redis supervisor nginx

# PHP extensions
RUN docker-php-ext-install \
    pdo pdo_pgsql mbstring exif pcntl bcmath gd zip opcache

# Redis extension
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first for layer caching
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-progress --no-interaction

# Copy app code
COPY . .
RUN composer dump-autoload --optimize

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# PHP-FPM config (uses default alpine php-fpm configuration)

# OPcache
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=20000" >> /usr/local/etc/php/conf.d/opcache.ini

EXPOSE 9000

CMD ["php-fpm"]
