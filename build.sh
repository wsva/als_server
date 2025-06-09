CGO_ENABLED=0 GOOS=windows GOARCH=386 go build -o als_server.exe

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o als_server

CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -o als_server_darwin