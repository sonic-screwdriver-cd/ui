FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
WORKDIR /usr/share/nginx/html
COPY sdui.tgz ./
RUN set -x \
   # Missing https for some magic reason
   && apk add --no-cache --update ca-certificates \
   && apk add --virtual .build-dependencies wget \
   && apk add nginx-mod-http-lua \
   && tar -xvzf sdui.tgz \
   && rm -rf sdui.tgz \
   # Cleanup packages
   && apk del --purge .build-dependencies
