#!/usr/bin 
today=`date +%Y%m%d`
#today='20141208'
node em.js $today 1 > $today.txt
node em.js $today 2 > $today-patch.txt

# Read more: http://linuxpoison.blogspot.sg/2012/08/bash-script-how-read-file-line-by-line.html#ixzz3LNaXrcXf
FILE=$today-patch.txt
i=1
while read line;do
    # echo "Line # $i: $line"
    ((i++))
done < $FILE

if [ 4 -lt "$i" ]
then
    echo "Failed: $i-1, have to do second patch"
    mv $today-patch.txt $today.txt
    node em.js $today 2 > $today-patch.txt
else
    echo "Don't do second patch"
fi
echo "Done"