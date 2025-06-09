module github.com/wsva/als_server

go 1.21.6

require (
	github.com/codegangsta/negroni v1.0.0
	github.com/gorilla/mux v1.8.1
	github.com/spf13/cobra v1.8.0
	github.com/spf13/pflag v1.0.5
	github.com/tidwall/pretty v1.2.1
	k8s.io/klog/v2 v2.120.1
)

require github.com/gomarkdown/markdown v0.0.0-20240626202925-2eda941fd024 // indirect

require (
	github.com/go-logr/logr v1.4.1 // indirect
	github.com/go-pdf/fpdf v0.9.0 // indirect
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/wsva/als_server_markdown v1.0.2 // direct
)
