cvlc --no-xlib --vout fb --fullscreen "$(yt-dlp -g 'https://www.youtube.com/watch?v=KinjsVJn0-o&t=122s')"

https://youtu.be/KinjsVJn0-o?t=130
https://youtu.be/KinjsVJn0-o?t=6191

convert -size 800x480 xc:black -fill white -gravity southwest -pointsize 16 -annotate +0+0 "ERROR: Something went wrong" error2.png


 1068  ffmpeg -i KinjsVJn0-o_master.mp4 -ss 01:18:26 -t 00:10:00 -c:v copy -c:a copy KinjsVJn0-o_1.mp4
 1069  ffmpeg -i KinjsVJn0-o_master.mp4 -ss 03:31:34 -t 00:10:00 -c:v copy -c:a copy KinjsVJn0-o_2.mp4
 1070  ffmpeg -i KinjsVJn0-o_master.mp4 -ss 00:41:14 -t 00:10:00 -c:v copy -c:a copy KinjsVJn0-o_3.mp4
 1071  ffmpeg -i alN1ePd2mrg_master.mp4 -ss 00:31:12 -t 00:10:00 -c:v copy -c:a copy alN1ePd2mrg_1.mp4
 1072  ffmpeg -i alN1ePd2mrg_master.mp4 -ss 01:05:39 -t 00:10:00 -c:v copy -c:a copy alN1ePd2mrg_2.mp4
 1073  ffmpeg -i alN1ePd2mrg_master.mp4 -ss 05:18:35 -t 00:10:00 -c:v copy -c:a copy alN1ePd2mrg_3.mp4
 
 HandBrakeCLI -i input.mp4 
  -o output_pi_zero.mp4 
  -e x264 
  -q 20 
  --encoder-profile baseline 
  --encoder-level 3.0 
  --rate 30 --cfr 
  --height 480 --width 854 --keep-display-aspect 
  -E copy:aac
  
(cli1) HandBrakeCLI -i one_minute.mp4 -o one_minute_opt.mp4 -e x264 --x264-preset veryfast -q 22 -r 30 --maxHeight 720 --vb 1500 --optimize

mkdir -p optimized
for img in *.jpg *.png; do
  [ -f "$img" ] || continue
  convert "$img" -resize 800x800\> "optimized/$img"
  case "$img" in
    *.jpg) jpegoptim --max=85 --strip-all "optimized/$img" ;;
    *.png) optipng -o7 "optimized/$img" ;;
  esac
done

mkdir -p optimized
for img in *.jpg *.png; do
  [ -f "$img" ] || continue
  # strip extension
  base=$(basename "$img")
  name="${base%.*}"
  convert "$img" -resize 330x175^ -gravity center -extent 330x175 "optimized/${name}.webp"
done


          // if (playingTimer) clearTimeout(playingTimer);
          // playingTimer = setTimeout(() => {
          //   logger.info("killing mvp process!");
          //   if (mpvProcess) {
          //     mpvProcess.kill();
          //     mpvProcess = null;
          //     logger.info("Video stopped");
          //   }
          // }, 602000);
		  
		  Please unblock challenges.cloudflare.com to proceed.
		  
 --no-terminal --log-file=/tmp/mpv.log --vo=gpu --hwdec=auto --really-quiet
 
 
   // {
  //   "id": "one_minute",
  //   "name": "Test Video - 1 Minute",
  //   "duration": "00:01:00",
  //   "isPlaying": false
  // }