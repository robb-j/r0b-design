# r0b design

This repo / package is the styles for https://r0b.io.
It is also used to generate https://ux.r0b.io.

## What is it?

This repo is a set of css styles for r0b.io, generated with
[sass](https://sass-lang.com/).

There is also a ux site used to visualise css rules for development.
It's based on on [atomic design](http://atomicdesign.bradfrost.com).

The purpose is for my site and its sub-sites to be able to depend on this package
to get all their style needs and I can also develop the styles independently.

## CLI Usage

When cloned locally, there is a CLI to build assets and run a watch server.
Built assets are placed into `dist/`, it contains compressed css and image assets.
The watch server runs on port `8080`, watching for file changes and rebuilding assets.

```
cli

Generate assets

Commands:
  cli build  Generate assets                                           [default]
  cli watch  Watch for changes and serve the site locally

Options:
  --version   Show version number                                      [boolean]
  --website   Generate the ux website                 [boolean] [default: false]
  --verbose   Output debug info                       [boolean] [default: false]
  -h, --help  Show help                                                [boolean]
```

## UX site

Theres a docker build to generate the ux site which builds the assets and serves them with
[nginx](https://www.nginx.com/).

The docker image is pushed here: [robbj/r0b-design](https://hub.docker.com/r/robbj/r0b-design).

> The deployment of this image isn't locked down yet

## Misc

I should link to the font-awesome license: https://fontawesome.com/license

---

> This project was set up by [puggle](https://npm.im/puggle)
