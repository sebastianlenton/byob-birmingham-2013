This is a piece I exhibited/performed at BYOB Birmingham 2013 (http://byobbirmingham.tumblr.com/). Please read the accompanying blog post at http://www.sebastianlenton.com/2013/12/byob-birmingham-2013-art-projectors-box2d

This is a simple physics-based visualiser of sorts, using box2DJS. Objects fall from the top of the screen, and using the mouse you can draw in polygon shapes to direct their trajectory. In addition, a number of parameters can be controlled via the keyboard including colour, feedback, mirror mode, circle/square and more.

Please note: only convex shapes work, and shapes have to be drawn in a clockwise direction. If you don't follow this guidance then the drawn shape will still appear, but the objects will just fall through it. If you draw a "bad" one then press p to get rid of it. You can simulate concave shapes by drawing overlapping convex shapes.

###Keyboard Controls:

mouse left - draw a polygon point (convex, clockwise only)

q - objects 1 colour down  
w - objects 1 colour up  
a - drawn polys 1 colour down
s - drawn polys 1 colour up

e - objects 2 colour down (in mirror mode)
r - objects 2 colour up (in mirror mode)
d - drawn polys 2 colour down (in mirror mode)
f - drawn polys 2 colour up (in mirror mode)

z - background colour down
x - background colour up

o - remove all polys
p - remove last poly/cancel draw (when in the midst of drawing a polygon)
[ - reset

j - toggle floor on/off

c - feedback down
v - feedback up

y - increase spawn rate
i - decrease spawn rate
1/2 - spawn area leftpoint left/right
3/4 - spawn area rightpoint left/right

g - mirror mode on/off

b - change between circle/square/both objects

n - object width down (radius for circles)
m - object width up (radius for circles)
, - object height down (ignored for circles)
. - object height up (ignored for circles)

; - cycle object friction (0-1)
/ - cycle object restitution (bounciness - 0-1)

Have fun!

Seb
sebastianlenton.com