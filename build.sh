#!/bin/bash
if [ ! -d build ] ; then  mkdir build; fi

cp opr-tools.user.js build/

rsync -av --delete build/ ftpwwwuser@localhost:/var/www/html/opr/

