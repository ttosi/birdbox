# Birdbox RPi Setup

Image latest Raspberry Pi OS Lite (64-bit) to sdcard

## Install Dependencies

- sudo apt update && sudo apt upgrade -y && sudo apt autoremove
- sudo raspi-config
  - set boot to console
  - set autologin on
- `sudo apt install -y mpv vim git libcamera-apps`
- install node/npm
  - `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`
  - `\. "$HOME/.nvm/nvm.sh"`
  - `nvm install 24`
- install pm2 `npm i -g pm2`
- clone repo ` git clone https://github.com/ttosi/birdbox.git`
