// @ts-ignore
var AlsSearch;
(function (AlsSearch) {
    function search() {
        // @ts-ignore
        var keyword = $("#search_keyword").val().toString();
        if (keyword == "") {
            return;
        }
        var tmpwin = window.open('_blank');
        if (tmpwin) {
            tmpwin.location = "/search?keyword=" + encodeURI(keyword);
        }
    }
    AlsSearch.search = search;
    function autosearch(event) {
        if (event.key === 'Enter') {
            search();
        }
    }
    AlsSearch.autosearch = autosearch;
})(AlsSearch || (AlsSearch = {}));
