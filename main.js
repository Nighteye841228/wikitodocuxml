$(document).ready();

const app = new Vue({
    el: "#app",
    computed: {
        // thdlValidColumns: function() {
        //     return this.thdlColumns.filter(function(thdlColumn) {
        //         //  TODO: Filter isGetValueMetadata
        //     });
        // }
    },
    data: {
        newDocument: new WikiXmlMetadata(),
        wikiDocuments: [
            new WikiXmlMetadata("春曉", "孟浩然", ["春眠不覺曉，處處聞啼鳥。夜來風雨聲，花落知多少。"])
        ],
        isInputDataValid: true,
        isMetadataComplete: true,
        isKeepFormat: "Yes",
        isAddHyperlink: false,
        urlFieldHint: "",
        isInputEmpty: false,
        wikiUrls: "",
        wikiContents: "",
        filename: "",
        isSeperateByParagraph: "default",
        isAddExtendedLinks: false,
        extendedLinks: [],
        confirmLinks: []
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
                getWikisourceJson(wikiUrl);
            }
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
            this.wikiUrls += "\n";
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
            // this.wikiContents = (this.isSeperateByParagraph == true) ? convertAlltoParagraphs(this.wikiDocuments) :
            //     convertAlltoDocuments(this.wikiDocuments);
            // console.log(this.wikiContents);
            let answer = "";
            if (this.isSeperateByParagraph == "default") {
                answer = convertAlltoDocuments(this.wikiDocuments);
            } else if (this.isSeperateByParagraph == "seperateEachParagraph") {
                answer = convertParagraphToDocuments(this.wikiDocuments);
            } else {
                answer = convertAlltoParagraphs(this.wikiDocuments);
            }
            this.wikiContents = answer;
        }
    }
});



function composeXmlString(source, xmlAttribute, isBreak = 0) {
    return (isBreak == 0)
        ? `<${xmlAttribute}>${source}</${xmlAttribute}>\n`
        : `<${xmlAttribute}>\n${source}\n</${xmlAttribute}>`;
}

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
            parseHtmlText(apiBackJson.text['*']),
            parseHtmlHyperlinkText(apiBackJson.text['*'])
        ))
    } catch (error) {
        console.log(error);
        alert(`請求出錯！`);
    }
    // return { code: 'failed' };
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
            // console.log(apiBackJson.data.parse);
            let newLinks = await getExtendedLinks(apiBackJson.data.parse)
            app.extendedLinks = app.extendedLinks.concat(newLinks);
        } catch (error) {
            console.log(error);
            alert(`請求出錯！`);
        }
    }
    app.isAddExtendedLinks = true;
    // return { code: 'failed' };
}

function WikiXmlMetadata(title = "", author = "", doc_content = [], hyperlinks = []) {
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
    this.isImport.doc_content = doc_content.join("");
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
    this.hyperlinks = hyperlinks;
    this.paragraph = doc_content;
}

function convertAlltoDocuments(wikiObjs, isAddHyperlink = 0) {
    let docsMetadata = [];
    let everyDocValue = "";
    let final = "";
    wikiObjs.forEach((element, index) => {
        for (let doc in element.isImport) {
            everyDocValue += composeXmlString(element.isImport[doc], doc);
        }
        docsMetadata.push(composeXmlString(everyDocValue, "document", 1));
        everyDocValue = "";
    });
    final = docsMetadata.join("\n");
    final = composeXmlString(final, "documents", 1)
    return final.replace(/^\r\n|^\n/gm, "");
}

function convertAlltoParagraphs(wikiObjs) {
    let docsMetadata = [];
    let final = "";
    for (let doc in wikiObjs[0].isImport) {
        if (doc != "doc_content") final += composeXmlString(wikiObjs[0].isImport[doc], doc);
    }
    wikiObjs.forEach((element, index) => {
        docsMetadata.push(composeXmlString(element.isImport.doc_content, "Paragraph", 1));
    });
    final += composeXmlString(docsMetadata.join("\n"), "document", 1);
    //這段要重寫把資料包進去

    return composeXmlString(final, "documents", 1).replace(/^\r\n|^\n/gm, "");
}

function convertParagraphToDocuments(wikiObjs) {
    let eachDoc = [];
    let everyDocValue = "";
    wikiObjs.forEach((element, index) => {
        let paragraph = element.paragraph.map(x => {
            everyDocValue = ""
            for (let doc in element.isImport) {
                everyDocValue += (doc != "doc_content")
                    ? composeXmlString(element.isImport[doc], doc)
                    : composeXmlString(x, doc);
            }
            everyDocValue = composeXmlString(everyDocValue, "document", 1);
            return everyDocValue;
        });
        eachDoc = eachDoc.concat(paragraph);
    });
    return composeXmlString(eachDoc.join("\n"), "documents", 1).replace(/^\r\n|^\n/gm, "");
}

function parseHtmlText(htmlContent) {
    let doc = new DOMParser().parseFromString(htmlContent, "text/html");
    let wikiContentSeperateParagraph = [];
    $(doc).find(`.mw-parser-output p,.mw-parser-output dd`).each(function (index, element) {
        if (!/(^\r\n|^\n)|(屬於公有領域)/gm.test($(element).text())) {
            wikiContentSeperateParagraph.push($(element).text());
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
    //TODO在doc_content裡面放入兩個obj value:Paragraph,wikilink
    let doc = new DOMParser().parseFromString(htmlContent, "text/html");
    let wikiContentSeperateParagraph = [];
    $(doc).find(`.mw-parser-output a`).each(function (index, element) {
        if ($(element).text() !== "" && $(element).attr('href').match(/^\/wiki\//g)) {
            let wikilink = $(element).attr('href').match(/^\/wiki\//g)
                ? `https://zh.wikisource.org${$(element).attr('href')}`
                : $(element).attr('href');
            wikiContentSeperateParagraph.push(`<Udef_wiki RefId="${wikilink}">${$(element).text()}<Udef_wiki>`);
        }
    });
    return wikiContentSeperateParagraph;
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

function isEssensialKey(text) {
    return text.match(/(Category.*)|(Author.*)|(Wikisource.*)|(Template.*)|(模块.*)/g) ? false : true;
}
