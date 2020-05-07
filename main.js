$(document).ready();

const app = new Vue({
    el: "#app",
    computed: {
    },
    data: {
        newDocument: new WikiXmlMetadata(),
        wikiDocuments: [
            new WikiXmlMetadata("春曉", "孟浩然", ["春眠不覺曉，處處聞啼鳥。夜來風雨聲，花落知多少。"])
        ],
        isInputDataValid: true,
        isMetadataComplete: true,
        isKeepFormat: "Yes",
        isAddHyperlink: true,
        urlFieldHint: "",
        isInputEmpty: false,
        wikiUrls: "",
        wikiContents: "",
        filename: "",
        isSeperateByParagraph: "default",
        isAddExtendedLinks: false,
        extendedLinks: [],
        confirmLinks: [],
        sourceWord: ""
    },
    methods: {
        cleanUrlField: function () {
            this.wikiUrls = "";
            this.urlFieldHint = "";
            this.isInputEmpty = false;
            this.wikiDocuments = [];
        },
        parseWikiLinksFromUser: function () {
            if (!this.checkForm()) return;
            for (wikiUrl of this.wikiUrls.split('\n')) {
                if (wikiUrl != "") { getWikisourceJson(wikiUrl); }
            }
        },
        getQueryResult: function () {
            if (this.sourceWord == "") return;
            this.extendedLinks = [];
            this.confirmLinks = [];
            searchWord(this.sourceWord);
        },
        searchDeeper: function () {
            this.extendedLinks = [];
            this.confirmLinks = [];
            if (!this.checkForm()) return;
            getDeeperLink(this.wikiUrls);
        },
        checkForm: function (e) {
            if (!this.wikiUrls) {
                this.urlFieldHint = "is-danger";
                this.isInputEmpty = true;
                return 0;
            }
            return 1;
        },
        confirmAdd: function (flag) {
            this.wikiUrls += flag ? this.confirmLinks.join("\n") : "";
            this.isAddExtendedLinks = false;
            this.extendedLinks = [];
        },
        checkContentValue: function (obj) {
            obj.isFixContent = !obj.isFixContent;
            obj.isContentOpen = !obj.isContentOpen;
        },
        deleteContentValue: function (index) {
            this.wikiDocuments.splice(index, 1);
        },
        download: function (filename, text) {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(this.wikiContents));
            element.setAttribute('download', this.filename);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        },
        copyTestingCode() {
            let testingCodeToCopy = $('#wikiContents').select(function () {
                try {
                    var successful = document.execCommand('copy');
                    var msg = successful ? 'successful' : 'unsuccessful';
                    alert('Testing code was copied ');
                } catch (err) {
                    alert('Oops, unable to copy');
                }
                /* unselect the range */
            });
            testingCodeToCopy.setAttribute('type', 'hidden')
            window.getSelection().removeAllRanges()
        },
        onCopy: function (e) {
            alert(`Copying Success!!`);
        },
        compressToParagraph: function () {
            let answer = "";
            if (this.isSeperateByParagraph == "default") {
                answer = convertAlltoDocuments(this.wikiDocuments, this.isAddHyperlink);
            } else if (this.isSeperateByParagraph == "seperateEachParagraph") {
                answer = convertParagraphToDocuments(this.wikiDocuments, this.isAddHyperlink);
            } else {
                answer = convertAlltoParagraphs(this.wikiDocuments, this.isAddHyperlink);
            }
            this.wikiContents = answer;
        }
    }
});





async function getWikisourceJson(pageName) {
    try {
        let apiBackJson = await axios.get("https://zh.wikisource.org/w/api.php",
            {
                params: {
                    action: "parse",
                    page: pageName,
                    origin: "*",
                    format: "json",
                    utf8: ""
                }
            });
        apiBackJson = apiBackJson.data.parse;
        app.wikiDocuments.push(new WikiXmlMetadata(
            apiBackJson.title,
            parseAuthor(apiBackJson.text['*']),
            parseHtmlText(apiBackJson.text['*'])
        ));
        console.log(parseHtmlText(apiBackJson.text['*']));
    } catch (error) {
        console.log(error);
        alert(`請求出錯！`);
    }
}

async function getDeeperLink(pageNames) {
    pageNames = pageNames.split('\n');
    for (pageName of pageNames) {
        try {
            let apiBackJson = await axios.get("https://zh.wikisource.org/w/api.php",
                {
                    params: {
                        action: "parse",
                        page: pageName,
                        origin: "*",
                        format: "json",
                        utf8: ""
                    }
                });
            let newLinks = await getExtendedLinks(apiBackJson.data.parse)
            app.extendedLinks = app.extendedLinks.concat(newLinks);
        } catch (error) {
            console.log(error);
            alert(`請求出錯！`);
        }
    }
    app.isAddExtendedLinks = true;
}

async function searchWord(title) {
    try {
        let apiBackJson = await axios.get("https://zh.wikisource.org/w/api.php",
            {
                params: {
                    action: "query",
                    list: "search",
                    srsearch: title,
                    origin: "*",
                    format: "json",
                    utf8: ""
                }
            });
        let outputs = await apiBackJson.data.query.search;
        console.log(outputs);
        app.extendedLinks = outputs.map(x => x.title);
    } catch (error) {
        console.log(error);
        alert(`請求出錯！`);
    }
    app.isAddExtendedLinks = true;
}

function WikiXmlMetadata(title = "", author = "", doc_content = [{
    paragraphs: "",
    hyperlinks: ""
}]) {
    this.isImport = {};
    this.isImport.title = title;
    this.isImport.author = author;
    this.isImport.doc_topic_l1 = "";
    this.isImport.doc_topic_l2 = "";
    this.isImport.doc_topic_l3 = "";
    this.isImport.geo_level1 = "";
    this.isImport.geo_level2 = "";
    this.isImport.geo_level3 = "";
    this.isImport.geo_longitude = "";
    this.isImport.geo_latitude = "";
    this.isImport.doc_category_l1 = "";
    this.isImport.doc_category_l2 = "";
    this.isImport.doc_category_l3 = "";
    this.isImport.docclass = "";
    this.isImport.doc_content = "";
    this.isImport.docclass_aux = "";
    this.isImport.doctype = "";
    this.isImport.doctype_aux = "";
    this.isImport.book_code = "";
    this.isImport.time_orig_str = "";
    this.isImport.time_varchar = "";
    this.isImport.time_norm_year = "";
    this.isImport.era = "";
    this.isImport.time_norm_kmark = "";
    this.isImport.year_for_grouping = "";
    this.isImport.time_dynasty = "";
    this.isImport.doc_seq_number = "";
    this.isImport.timeseq_not_before = "";
    this.isImport.timeseq_not_after = "";
    this.isImport.doc_source = "";
    this.isImport.doc_attachment = "";
    this.isFixContent = false;
    this.isContentOpen = true;
    this.tempContent = doc_content;
    this.fulltext = doc_content.map(x => x.paragraphs).join("\n");
}

function parseHtmlText(htmlContent) {
    let doc = new DOMParser().parseFromString(htmlContent, "text/html");
    let wikiContentSeperateParagraph = [];
    $(doc).find(`.mw-parser-output p,.mw-parser-output dd`).each(function (index, element) {
        let parseSentence = $(element).text().replace(/\s/gm, "").replace(/^\r\n|^\n/gm, "");
        if (!/(屬於公有領域)/gm.test(parseSentence) && parseSentence != "") {
            wikiContentSeperateParagraph.push({
                paragraphs: parseSentence,
                hyperlinks: parseHtmlHyperlinkText($(element).html())
            });
        }
    });
    return wikiContentSeperateParagraph;
}

function parseAuthor(htmlContent) {
    let doc = new DOMParser().parseFromString(htmlContent, "text/html");
    let wikiAuthor = "";
    $(doc).find(`a`).each(function (index, element) {
        if ($(element).prop('title').match(/Author:.*/)) {
            wikiAuthor = $(element).prop('title').replace(/Author:|（(頁面不存在)*）/g, "");
        }
    });
    return wikiAuthor;
}

function parseHtmlHyperlinkText(htmlContent) {
    let doc = new DOMParser().parseFromString(htmlContent, "text/html");
    let wikiContentSeperateParagraph = [];
    $(doc).find(`a`).each(function (index, element) {
        if ($(element).attr('href') != undefined
            && $(element).text() !== ""
            && $(element).attr('href').match(/^\/wiki\//g)) {
            let wikilink = $(element).attr('href').match(/^\/wiki\//g)
                ? `https://zh.wikisource.org${$(element).attr('href')}`
                : $(element).attr('href');
            wikiContentSeperateParagraph.push(
                `<Udef_wiki RefId="${wikilink}">${$(element).text()}<Udef_wiki>`);
        }
    });
    return wikiContentSeperateParagraph.join("\n");
}

async function getExtendedLinks(wikiJson) {
    let wikiKeyword = [];
    if (wikiJson.hasOwnProperty('links')) {
        wikiJson.links.forEach((element, index) => {
            if (isEssensialKey(element['*'])) {
                wikiKeyword.push(element['*']);
            }
        })
    }
    return wikiKeyword;
}



function convertAlltoDocuments(wikiObjs, isAddHyperlink = true) {
    let eachDoc = "";
    let allDocs = [];
    wikiObjs.forEach((obj, index) => {
        let fullContext = obj.tempContent.map(x => composeXmlString(x.paragraphs, "Paragraph", 1)).join("\n");
        let collectHyperlinks = isAddHyperlink
            ? composeXmlString(obj.tempContent.map(x => x.hyperlinks).join("\n"), "MetaTags", 1, ` NoIndex="1"`)
            : "";
        for (let docVal in obj.isImport) {
            eachDoc += docVal == "doc_content"
                ? composeXmlString(fullContext + "\n" + collectHyperlinks, docVal, 1)
                : composeXmlString(obj.isImport[docVal], docVal);
        }
        allDocs.push(composeXmlString(eachDoc, "document", 1, ` filename="${padding(index + 1, 3)}.txt"`));
        eachDoc = "";
    });
    let final = composeXmlString(allDocs.join("\n"), "documents", 1);
    return final.replace(/^\r\n|^\n/gm, "");
}

function convertAlltoParagraphs(wikiObjs, isAddHyperlink = true) {
    let allParagraphs = [];
    let allHyperlinks = [];
    let eachDoc = "";
    wikiObjs.forEach((obj, index) => {
        allParagraphs.push(obj.tempContent
            .map(x => composeXmlString(x.paragraphs, "Paragraph", 1))
            .join("\n"));
        allHyperlinks.push(
            composeXmlString(obj.tempContent
                .map(x => x.hyperlinks)
                .join("\n"), "MetaTags", 1, ` Noindex="1"`)
        );
    });

    allParagraphs = allParagraphs.join("\n")
    allHyperlinks = isAddHyperlink ? allHyperlinks.join("\n") : "";

    for (let docVal in wikiObjs[0].isImport) {
        eachDoc += docVal == "doc_content"
            ? composeXmlString(allParagraphs + "\n" + allHyperlinks, docVal, 1)
            : composeXmlString(wikiObjs[0].isImport[docVal], docVal);
    }

    let final = composeXmlString(eachDoc, "document", 1, ` filename="${padding(1, 3)}.txt"`);
    return composeXmlString(final, "documents", 1).replace(/^\r\n|^\n/gm, "");
}

function convertParagraphToDocuments(wikiObjs, isAddHyperlink = true) {
    let docs = [];
    let eachDoc = "";
    let count = 1;
    wikiObjs.forEach((obj, index) => {
        obj.tempContent.forEach((paraData, ind) => {
            let hyperlink = isAddHyperlink
                ? composeXmlString(paraData.hyperlinks, "MetaTags", 1, ` Noindex="1"`) : "";
            let eachWikiDoc = composeXmlString(paraData.paragraphs, "Paragraph", 1)
                + "\n" + hyperlink
            for (let docVal in obj.isImport) {
                eachDoc += docVal == "doc_content"
                    ? composeXmlString(eachWikiDoc, docVal, 1)
                    : composeXmlString(obj.isImport[docVal], docVal);
            }
            docs.push(composeXmlString(eachDoc, "document", 1, ` filename="${padding(count, 3)}.txt"`));
            eachDoc = "";
            count++;
        });
    });

    let final = composeXmlString(docs.join("\n"), "documents", 1);
    return final.replace(/^\r\n|^\n/gm, "");
}

function padding(num, length) {
    for (var len = (num + "").length; len < length; len = num.length) {
        num = "0" + num;
    }
    return num;
}

function isEssensialKey(text) {
    return text.match(/(Category.*)|(Author.*)|(Wikisource.*)|(Template.*)|(模块.*)/g) ? false : true;
}

function composeXmlString(source, xmlAttribute, isBreak = 0, addValue = "") {
    return (isBreak == 0)
        ? `<${xmlAttribute}${addValue}>${source}</${xmlAttribute}>\n`
        : `\n<${xmlAttribute}${addValue}>\n${source}\n</${xmlAttribute}>\n`;
}