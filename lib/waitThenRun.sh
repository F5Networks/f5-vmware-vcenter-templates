#!/bin/bash
while true; do echo "waiting for cloud libs install to complete"
    if [ -f /config/cloud/vmware/cloudLibsReady ]; then
        break
    else
        sleep 10
    fi
done
"$@"