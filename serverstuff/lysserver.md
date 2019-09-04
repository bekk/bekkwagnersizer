# Lysserver

## Om

Lysserver eksponerer lysdiodene på kameratstativet via en webserver

### Teknologi

Lysserveren kjører johnny-five og node-pixel mot en Arduino Uno.

Før man kan starte lysserveren må Arduinoen ha riktig firmware. 

### Installere node-pixel firmata:

* Plugg inn Arduino og kjør

`npm install node-pixel`

`npm install -g nodebots-interchange`

`interchange install git+https://github.com/ajfisher/node-pixel -a uno --firmata

### Starte server

`node lysserver`

Det skal nå komme omtrent følgende:

`1567628797809 Available /dev/tty.usbmodem1462401`
`1567628797825 Connected /dev/tty.usbmodem1462401`  
`Let's turn up the lights!`


Lysene er nå klare til bruk.

### Kommunisere med lysserver:

http://localhost:3007/spin
http://localhost:3007/blink
http://localhost:3007/off

Query params:

* r - red, 0-255
* g - green, 0-255
* b - blue, 0-255

For spin:

* speed

For blink:

* times - antall blink
* duration - millisekunder av/på

