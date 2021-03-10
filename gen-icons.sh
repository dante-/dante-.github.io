#!/bin/bash

iconpath=./html/icons/

svg_base=favicon.svg
icon_name_template="favicon-%d.png"

sizes="
32
167
180
192
512
"

for i in ${sizes}; do
  inkscape -w $i\
    ${iconpath}${svg_base}\
    -o ${iconpath}$(printf ${icon_name_template} $i)
done
