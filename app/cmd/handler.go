package cmd

import (
	"fmt"
	"html/template"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/wsva/als_server/app/dir"
	"github.com/wsva/als_server/app/search"
	"github.com/wsva/als_server/app/utils"
	markdown "github.com/wsva/als_server_markdown"
)

func NewHandler(w http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	urlpath := r.URL.Path
	query := r.URL.Query()

	if urlpath == "/favicon.ico" {
		http.ServeFile(w, r, filepath.Join(utils.Basepath(), "favicon.ico"))
		return
	}

	if urlpath == "/search" {
		handleSearch(w, query)
		return
	}

	if urlpath == "/reload_directory_list" {
		dirList = dir.NewDirList(mainConfig.DirectoryList)
		io.WriteString(w, "reload complete")
		return
	}

	lang := "en"
	if _, found := query["lang"]; found {
		lang = query["lang"][0]
	}

	dirID, subpath := dir.SplitUrlpath(urlpath)
	if dirID == "" && subpath == "" {
		handleContent(w, lang, "index", getRootIndexContent())
		return
	}

	d, ok := dirList.Get(dirID)
	if !ok {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}
	realpath := filepath.Join(d.Path, subpath)

	fi, err := os.Stat(realpath)
	if err != nil {
		io.WriteString(w, "read directory error")
		return
	}

	if fi.IsDir() {
		content, err := getIndexContent(realpath, urlpath)
		if err != nil {
			io.WriteString(w, "get index for directory error")
			return
		}
		handleContent(w, lang, filepath.Base(realpath), content)
		return
	}

	if _, found := query["pdf"]; found {
		contentBytes, err := os.ReadFile(realpath)
		if err != nil {
			io.WriteString(w, "read markdown file error")
			return
		}
		sectionList, err := markdown.SplitSection(string(contentBytes))
		if err != nil {
			io.WriteString(w, "split markdown file to sections error")
			return
		}

		pdf := markdown.PDF{
			NewPage:         true,
			MarginLeft:      utils.ParseQueryFloat64(query, "ml", 10),
			MarginTop:       10,
			MarginRight:     utils.ParseQueryFloat64(query, "mr", 10),
			FontSize:        utils.ParseQueryFloat64(query, "fs", 16),
			LineHeight:      utils.ParseQueryFloat64(query, "lh", 6),
			ParagraphOffset: utils.ParseQueryFloat64(query, "po", 2),
		}
		pdf.Generate(sectionList).Output(w)
		return
	}

	if strings.HasSuffix(fi.Name(), ".md") {
		contentBytes, err := os.ReadFile(realpath)
		if err != nil {
			io.WriteString(w, "read markdown file error")
			return
		}
		handleContent(w, lang, filepath.Base(realpath), string(contentBytes))
	} else {
		http.ServeFile(w, r, realpath)
	}
}

func handleSearch(w http.ResponseWriter, query url.Values) {
	t, err := template.ParseFiles(
		filepath.Join(utils.Basepath(), "template/html/search.html"))
	if err != nil {
		io.WriteString(w, "search.html does not exist")
		return
	}
	_, found := query["keyword"]
	if !found {
		io.WriteString(w, "no keyword found")
		return
	}
	resultList, err := search.SearchRegexp(dirList, query["keyword"][0])
	if err != nil {
		io.WriteString(w, "get search results error")
		return
	}
	t.Execute(w, resultList)
}

func handleContent(w http.ResponseWriter, lang, title, content string) {
	toc, body := markdown.ToHTML("☰", content)

	tpFile := filepath.Join(utils.Basepath(), "template/html/markdown.html")
	tp, err := template.ParseFiles(tpFile)
	if err != nil {
		fmt.Fprintf(w, "parse template %v error: %v", tpFile, err)
		return
	}
	c := struct {
		Lang  string
		Title string
		TOC   template.HTML
		Body  template.HTML
	}{
		Lang:  lang,
		Title: title,
		TOC:   template.HTML(toc),
		Body:  template.HTML(body),
	}
	tp.Execute(w, c)
}

func checkAccessAllowed(w http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	urlpath := r.URL.Path

	dirID, _ := dir.SplitUrlpath(urlpath)
	if d, ok := dirList.Get(dirID); ok && d.IsPublic {
		next(w, r)
		return
	}

	realip := utils.GetIPFromRequest(r).String()
	for _, v := range allowList {
		if v.MatchString(realip) {
			next(w, r)
			return
		}
	}
	io.WriteString(w, "Access denied!\nYour ip is "+realip+"\n")
}
