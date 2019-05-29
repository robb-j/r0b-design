# A Node project

```bash
# WIP deploy tmp

tar -czvf ux.tar.gz dist

ssh r0b rm -r /srv/apps/files/ux
scp ux.tar.gz r0b:/srv/apps/files/ux.tar.gz
ssh r0b tar -C /srv/apps/files -xzvf /srv/apps/files/ux.tar.gz
ssh r0b mv /srv/apps/files/dist /srv/apps/files/ux
```

## Misc

I should link to the font-awesome license:
https://fontawesome.com/license

## CLI Usage

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

---

> This project was set up by [puggle](https://npm.im/puggle)
