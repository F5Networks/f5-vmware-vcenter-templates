#!/bin/bash
PROGNAME=$(basename $0)
function error_exit {
echo "${PROGNAME}: ${1:-\"Unknown Error\"}" 1>&2
exit 1
}
declare -a tmsh=()
date
echo "starting custom-config.sh"
tmsh+=(
<CUSTOMCONFIG>
)
for CMD in "${tmsh[@]}"
do
    if $CMD;then
        echo "command $CMD successfully executed."
    else
        error_exit "$LINENO: An error has occurred while executing $CMD. Aborting!"
    fi
done
date
### START CUSTOM TMSH CONFIGURATION
### END CUSTOM TMSH CONFIGURATION