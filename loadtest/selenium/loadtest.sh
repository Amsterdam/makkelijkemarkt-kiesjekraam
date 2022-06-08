#!/bin/bash

i=0

# put one erkenningsnummer per line
ondernemers="
"

inactive="
"

for ondernemer in $ondernemers
do
  python loadtest.py $ondernemer $i &
  i=$((i+1))
done

exit
