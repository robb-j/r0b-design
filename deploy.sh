set -ex
tar -czf ux.tar.gz dist

ssh r0b rm -r /srv/apps/files/ux
scp ux.tar.gz r0b:/srv/apps/files/ux.tar.gz
ssh r0b tar -C /srv/apps/files -xzf /srv/apps/files/ux.tar.gz
ssh r0b mv /srv/apps/files/dist /srv/apps/files/ux
