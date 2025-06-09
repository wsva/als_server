package dir_test

import (
	"fmt"
	"testing"

	dir "github.com/wsva/als_server/app/dir"
)

func TestGetId(t *testing.T) {
	fmt.Println(dir.GetIdRandom("Menschen"))
}
