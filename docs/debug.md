To debug the application on the remote raspberryPi.

## npm scripts:

    "debugDocker": "echo 'For debugging in Chrome open: about:inspect' && node --inspect-brk=0.0.0.0 src/index.js",
    "debugTunnel": "ssh -L 9221:localhost:9229 pi@grassberry.local",

## docker-compose

Change the docker-compose for the debugging scenario to override the command and expose the debugging port:

        ports:
            - "3000:3000"
            - "9229:9229"
        command: npm run debugDocker

[Node.js debugger tutorial](https://nodejs.org/en/docs/guides/debugging-getting-started/#enabling-remote-debugging-scenario)

When restarting the container, you should receive:

    Recreating app_core ... done
    Attaching to app_core
    app_core    |
    app_core    | > projectname@0.0.0 debugDocker /
    app_core    | > echo 'For debugging in Chrome open: about:inspect' && node --inspect-brk src/index.js
    app_core    |
    app_core    | For debugging in Chrome open: about:inspect
    app_core    | Debugger listening on ws://127.0.0.1:9229/6e71a6a1-9ffe-4076-9b7e-f3928567aa8d
        app_core    | For help, see: https://nodejs.org/en/docs/inspector

The inspector is running and you can see with `lsof -i tcp:9229` that the port is in use:

    COMMAND     PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
    docker-pr 19511 root    4u  IPv6 107023      0t0  TCP *:9229 (LISTEN)

## port forwarding

    npm run debugTunnel

After running this command on your local machine a SSH shell is opened to the machine where the docker nodes.js application runs. You can run it more verbose by adding `-v -v -v`

Added port `9221` to chrome inspectors autodiscover settings.

[![enter image description here][1]][1]

Make sure that:

 - the debugger is running
 - the port 9229 is exposed by docker
 - the port is forwarded from the remote host to the local machine 
 - chrome debugger should search on 9221

  [1]: https://i.stack.imgur.com/XdjNI.png
