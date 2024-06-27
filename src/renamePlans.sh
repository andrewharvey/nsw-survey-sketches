#!/bin/sh

find data/plans | grep -E 'surveyMark=[[:alnum:]]*' | sed -rn 'p;s/^.*surveyMark=([[:alnum:]]*).*$/data\/plans\/\1.pdf/p' | xargs -n2 mv
