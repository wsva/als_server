package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"

	"github.com/spf13/cobra"
	"github.com/tidwall/pretty"
	"github.com/wsva/als_server/app/dir"
	"github.com/wsva/als_server/app/utils"
)

const (
	DefaultConfigFile = "config.json"
)

var MainConfigFile string
var ListenPort int

var mainConfig MainConfig
var dirList *dir.DirList
var allowList []*regexp.Regexp

type Https struct {
	Enable  bool   `json:"Enable"`
	CrtFile string `json:"CrtFile"`
	KeyFile string `json:"KeyFile"`
}

type AllowIP struct {
	IPRegexp string `json:"IPRegexp"`
	Allow    bool   `json:"Allow"`
	Comment  string `json:"Comment"`
}

type MainConfig struct {
	ListenPort      string    `json:"ListenPort"`
	Https           Https     `json:"Https"`
	DirectoryList   []dir.Dir `json:"DirectoryList"`
	AllowIPList     []AllowIP `json:"AllowIPList"`
	DefaultLanguage string    `json:"DefaultLanguage"`
}

func defaultConfig() *MainConfig {
	return &MainConfig{
		ListenPort: "1235",
		DirectoryList: []dir.Dir{
			{
				Name:        "docs",
				Path:        "../docs",
				UseChildren: true,
				IsPublic:    false,
			}},
		AllowIPList: []AllowIP{
			{
				IPRegexp: "^.*$",
				Allow:    true,
				Comment:  "",
			},
		},
		DefaultLanguage: "de",
	}
}

func InitConfig() bool {
	contentBytes, err := os.ReadFile(filepath.Join(utils.Basepath(), MainConfigFile))
	if err != nil {
		mainConfig = *defaultConfig()
	} else {
		err = json.Unmarshal(contentBytes, &mainConfig)
		if err != nil {
			fmt.Printf("init config error: %v\n", err)
			return false
		}
	}

	// the arguments in flags have the highest priority
	if ListenPort > 0 {
		mainConfig.ListenPort = fmt.Sprint(ListenPort)
	}

	dirList = dir.NewDirList(mainConfig.DirectoryList)

	for _, v := range mainConfig.AllowIPList {
		if v.Allow {
			allowList = append(allowList, regexp.MustCompile(v.IPRegexp))
		}
	}

	return true
}

// newCmdConfig returns cobra.Command for "kubeadm config" command
func newCmdConfig(out io.Writer) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "config",
		Short: "Manage configuration",
	}

	cmd.AddCommand(newCmdConfigPrint(out))
	return cmd
}

// newCmdConfigPrint returns cobra.Command for "kubeadm config print" command
func newCmdConfigPrint(out io.Writer) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "print",
		Short: "Print configuration",
		Run: func(c *cobra.Command, args []string) {
			if ok := InitConfig(); !ok {
				return
			}
			jsonBytes, _ := json.Marshal(mainConfig)
			fmt.Print(string(pretty.Pretty(jsonBytes)))
		},
	}
	return cmd
}
