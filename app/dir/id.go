package dir

import (
	"fmt"
	"hash/fnv"
	"path"
	"regexp"
)

var CHARSET = []rune("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func GetIdRandom(name string) string {
	h := fnv.New32a()
	h.Write([]byte(name))
	sum := int(h.Sum32())
	if sum == 0 {
		return "0"
	}
	result := ""
	for sum > 0 {
		idx := sum % len(CHARSET)
		result += string(CHARSET[idx])
		sum = (sum - idx) / len(CHARSET)
	}
	return result
}

func GetIdFromPath(dirPath string) (string, error) {
	id := path.Base(dirPath)
	regMap := map[string]*regexp.Regexp{
		"-":  regexp.MustCompile(` `),
		"ae": regexp.MustCompile(`Ä|ä`),
		"oe": regexp.MustCompile(`Ö|ö`),
		"ue": regexp.MustCompile(`Ü|ü`),
		"ss": regexp.MustCompile(`ß`),
	}
	for k, v := range regMap {
		id = v.ReplaceAllString(id, k)
	}
	reg := regexp.MustCompile(`^[a-zA-Z0-9\._-]+$`)
	if reg.MatchString(id) {
		return id, nil
	}
	return "", fmt.Errorf("cannot compute id from path")
}

// 如何保证唯一性？？
func GetId(dirPath, defaultID string) string {
	id, err := GetIdFromPath(dirPath)
	if err != nil {
		return defaultID
	}
	return id
}
