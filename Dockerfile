FROM rust:1.79-alpine AS kujo-builder

ARG KUJO_RUNTIME_REF=

RUN apk add --no-cache git musl-dev build-base

WORKDIR /tmp/kujo-runtime
COPY RUNTIME_VERSION /tmp/RUNTIME_VERSION

RUN if [ -z "$KUJO_RUNTIME_REF" ]; then KUJO_RUNTIME_REF="$(cat /tmp/RUNTIME_VERSION)"; fi \
	&& git init . \
	&& git remote add origin https://github.com/rufflang/ruff.git \
	&& git fetch --depth 1 origin "$KUJO_RUNTIME_REF" \
	&& git checkout --detach "$KUJO_RUNTIME_REF" \
	&& cargo build --release --locked --manifest-path Cargo.toml

FROM alpine:3.20

RUN apk add --no-cache ca-certificates bash

WORKDIR /opt/kujo-eval
COPY --from=kujo-builder /tmp/kujo-runtime/target/release/ruff /usr/local/bin/kujo
COPY . /opt/kujo-eval/

ENTRYPOINT ["kujo", "run", "main.ruff"]
CMD ["run"]
