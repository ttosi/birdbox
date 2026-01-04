# TODO

- When starting a video, show loader overlay on video in client. Add video started ws call to notify client when video has started playing
  - use mpv’s JSON IPC
  -
- Add refresh button to connection lost dialog
- Add multi-user capability
- Add sqlite backend for users & videos
- Improve user based security
- ~~Setup Reverse SSH Tunnel or Tailscale~~
- ~~Ability to configure ssid/pass when birdbox doesn't connect to a wifi network (for initial configuration)~~
  - ~go into AP mode after 30 secs when no connectivity detected~
  - serve simple html page to configure wifi credentials
  - Use hostapd and dnsmasq
  - https://github.com/sindresorhus/execa
- User settings view
  - view/change apikey
  - add new videos
