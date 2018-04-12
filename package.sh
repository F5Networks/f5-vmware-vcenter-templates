#!/bin/bash
EXTRA_TAR_ARGS="--owner=root --group=root --exclude=.git* --exclude=README* --exclude=slack* --exclude=lab_settings* --exclude=package.sh --exclude=*.log"

# set perms for non-directories in the current directory
ls -p | grep -v / | xargs chmod 644
chmod 744 *.sh

# set other perms
chmod 755 .
chmod 755 lib
chmod -R 644 lib/*

tar -C .. $EXTRA_TAR_ARGS -cf dist/f5-vmware-vcenter-templates.tar f5-vmware-vcenter-templates

# Suppress gzips timetamp in the tarball - otherwise the digest hash changes on each
# commit even if the contents do not change. This causes an infinite loop in the build scripts
# due to packages triggering each other to uptdate hashes.
gzip -nf dist/f5-vmware-vcenter-templates.tar