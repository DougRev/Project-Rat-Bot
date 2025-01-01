# Project Rat Bot

A Discord music and utility bot that plays YouTube audio, supports Spotify playlists, manages Twitch integration, and logs or retrieves messages with a variety of commands—powered by **DisTube**, **Spotify Web API**, and **youtube-sr**.

## Features

### Music Commands
1. **Play**  
   - `!play <query>`  
     - If `<query>` is a **Spotify playlist** link, the bot fetches each track, searches YouTube for the best match, and queues each song.  
     - Otherwise, `<query>` is treated as a normal YouTube search (or direct YouTube link).

2. **Stop**  
   - `!stop`  
     - Stops the music and leaves the voice channel.  

3. **Skip**  
   - `!skip`  
     - Skips the currently playing song.  

4. **Queue**  
   - `!queue`  
     - Displays the current music queue.

5. **Custom Play**  
   - `!customplay <song name>`  
     - Searches YouTube using `youtube-sr` for the provided text and plays the first matching video.

### Twitch Commands
- `!streamstatus`  
  - Displays whether the configured Twitch channel is live and posts the stream link if active.

### Chat Logging Features
1. **Log Chat**  
   - `!logchat <description>`  
     - Prompts the user to paste a series of chat lines (e.g., game chat logs) and saves them to a designated log channel.  
     - Finish the session with `!endlog`.

2. **Retrieve Logs**  
   - `!getlogs`  
     - Retrieves all saved logs from the log channel and sends them to the user's DMs.

3. **Random Log**  
   - `!randomlog`  
     - Fetches a random log from the log channel and posts it to the current chat channel.

