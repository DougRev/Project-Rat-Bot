# Project Rat Bot

A Discord music bot that plays YouTube audio, supports Spotify playlists, and can search for and queue tracks automatically—powered by **DisTube**, **Spotify Web API**, and **youtube-sr**.

## Features

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

### Additional Commands

- `!customplay <song name>`  
  - Searches YouTube using `youtube-sr` for the provided text and plays the first matching video.

## Setup & Installation

1. **Clone or Download** this repository:
   ```bash
   git clone https://github.com/DougRev/Project-Rat-Bot.git
