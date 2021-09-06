# quick start

To deploy this on your server, make sure the server is docker enabled. Then
upload & extract emr-0.1.0.zip on to a server with docker installed, and follow
this steps:

1. change /dist/private/host.json, replace your server IP like this:

host: http://[your-server-ip]:8080/connects

2. execute these two scripts command:

```
    ./docker-start
    ./docker-webstart
```

3. check both of your docker containers are runing:

```
    docker ps
```

Please note there are totally 2 containers runing, one for web pages, one for json
data service.