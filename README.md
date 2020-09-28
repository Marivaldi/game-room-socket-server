# Socket Server
This is the NodeJS Socket Server. You will also need to pull down the frontend [Angular Client](https://github.com/Marivaldi/deception-game-client) in order to run it locally.

If you get stuck during setup just reach out to me.

# Getting the Code.
I prefer not to mess with the git command line where possible, so download [Github Desktop](https://desktop.github.com/) if you don't already have it, then follow along.

1. Open Github Desktop
2. Sign in.
3. Click File > Clone Repository
4. Select `deception-game-socket-server` from the list
5. Pay attention to the Local Path at the bottom so you know where to find the project.
6. Click Clone

At this point the code has been pulled down to the folder mention in Local Path.

# Getting NodeJS and NPM
1. Go [here](https://www.npmjs.com/get-npm)
2. Click `Download Node.js and NPM`

# Setup
1. Open a command prompt
2. CD into `deception-game-socket-server`
3. Run `npm install` (could take a while)
4. Add a file to the main folder, and name it `.env`
5. Add `PORT=8080` to the file
6. Add `ORIGIN=http://localhost:4200` to the file.

# Running the App
1. In the command prompt, run `npm watch`

You will need to run both the Client and the Socket Server in order for everything to work.
