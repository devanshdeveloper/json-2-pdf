import jsPDF from "jspdf";
import { $, $$, ExtendedDOMJS } from "extendeddomjs";
import { JSONToHTML } from "@devanshdeveloper/json-to-html";
import html2canvas from "html2canvas";
import unit from "css-unit-manager";
export class JSONToPDF {
    jsonToHtml;
    pagenumber;
    ratio;
    options;
    pdfContainer;
    constructor(options) {
        this.jsonToHtml = new JSONToHTML();
        this.pagenumber = 0;
        // Finding ratio
        const doc = new jsPDF(undefined, undefined, options.page.size.toLowerCase());
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();
        this.ratio = height / width;
        // Default options
        options.page.size = options.page.size || "A4";
        const pageWidth = options.page.styles.width || "300px";
        const pageHeight = unit(pageWidth).multiply(this.ratio).toString();
        options.page.styles.height = pageHeight;
        options.page.styles.width = pageWidth;
        options.elements = options.elements
            .map((e) => {
            const tagName = e.tag;
            const definedElement = options.defineElements?.find((e) => {
                return e.name === tagName;
            });
            if (definedElement) {
                const iterator = this.jsonToHtml.replacePlaceholders(definedElement.iterator, { payload: options.payload });
                const elements = iterator.map((item) => {
                    return this.replaceElementsPlaceholders(definedElement.elements, {
                        item,
                        payload: options.payload,
                    });
                });
                return elements;
            }
            else {
                return this.replaceElementsPlaceholders([e], {
                    payload: options.payload,
                });
            }
        })
            .flat();
        this.options = options;
        this.pdfContainer = null;
    }
    replaceElementsPlaceholders(elements, payload) {
        return elements.map((e) => {
            const tagName = this.jsonToHtml.replacePlaceholders(e.tag, payload);
            const newAttributes = {};
            const attributeKeys = Object.keys(e.attributes);
            attributeKeys.forEach((attributeKey) => {
                const attributeValue = e.attributes[attributeKey];
                const newAttributeKey = this.jsonToHtml.replacePlaceholders(attributeKey, payload);
                if (typeof attributeValue === "string") {
                    newAttributes[newAttributeKey] = this.jsonToHtml.replacePlaceholders(attributeValue, payload);
                }
                else if (Array.isArray(attributeValue)) {
                    newAttributes[newAttributeKey] = attributeValue.map((value) => this.jsonToHtml.replacePlaceholders(value, payload));
                }
                else {
                    newAttributes[newAttributeKey] = attributeValue;
                }
            });
            const returnValue = {
                tag: tagName,
                attributes: newAttributes,
            };
            if (e.children) {
                returnValue.children = this.replaceElementsPlaceholders(e.children, payload);
            }
            return returnValue;
        });
    }
    createPageElement() {
        const pageStyles = {
            height: this.options.page.styles.height,
            width: this.options.page.styles.width,
            border: "1px solid black",
            margin: "10px",
        };
        return $$("div")
            .styles(pageStyles)
            .addClass("page")
            .data("page_number", `${this.pagenumber}`);
    }
    createPageContentElement() {
        const pageContentStyles = {
            ...this.options.pageContent.styles,
            height: "unset",
            position: "relative",
        };
        return $$("div").addClass("page-content").styles(pageContentStyles);
    }
    addPage() {
        this.pagenumber++;
        const pageElement = this.createPageElement();
        const pageContentElement = this.createPageContentElement().appendTo(pageElement);
        if (this.pdfContainer && pageElement.el) {
            this.pdfContainer.append(pageElement.el);
        }
        return {
            pageElement: pageElement.el,
            pageContentElement: pageContentElement.el,
        };
    }
    checkSpaceInPage(pageContentElement) {
        if (!pageContentElement)
            return true;
        const ExtendedPageContentElement = new ExtendedDOMJS([pageContentElement]);
        const totalHeight = unit(ExtendedPageContentElement.styles()[0].width)
            .multiply(this.ratio)
            .toNumber();
        if (pageContentElement.offsetHeight < totalHeight) {
            return true;
        }
        else {
            pageContentElement.style.height = this.options.page.styles.height;
            return false;
        }
    }
    createElements() {
        let pageContentElement = null;
        let pageElement = null;
        const moveToAnotherPage = () => {
            if (pageContentElement) {
                new ExtendedDOMJS([pageContentElement]).styles({
                    height: this.options.page.styles.height,
                });
            }
            const page = this.addPage();
            const oldPageContentElement = pageContentElement;
            pageContentElement = page.pageContentElement;
            pageElement = page.pageElement;
            if (pageContentElement) {
                if (this.options.fixedElements && pageContentElement) {
                    this.jsonToHtml.manipulateDOMFromJSON(this.options.fixedElements, pageContentElement, { ...this.options.payload, pagenumber: this.pagenumber });
                }
                if (oldPageContentElement) {
                    const lastChild = oldPageContentElement.children[oldPageContentElement.children.length - 1];
                    oldPageContentElement.removeChild(lastChild);
                    pageContentElement.append(lastChild);
                }
            }
        };
        moveToAnotherPage();
        this.options.elements.forEach((element, i) => {
            const paintElement = () => {
                if (pageContentElement) {
                    this.jsonToHtml.manipulateDOMFromJSON(element, pageContentElement, {
                        payload: this.options.payload,
                        pagenumber: this.pagenumber,
                    });
                }
            };
            if (this.checkSpaceInPage(pageContentElement)) {
                paintElement();
            }
            else {
                moveToAnotherPage();
                paintElement();
            }
            if (this.options.elements.length - 1 === i) {
                if (pageContentElement) {
                    new ExtendedDOMJS([pageContentElement]).styles({
                        height: this.options.page.styles.height,
                    });
                }
            }
        });
    }
    paintPDFonScreen(pdfContainer) {
        this.pdfContainer = pdfContainer;
        this.createElements();
    }
    getDomData(element = this.pdfContainer) {
        let data = {
            tag: element.tagName.toLowerCase(),
            attributes: {},
            children: [],
        };
        // Get all attributes of the element
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            data.attributes[attr.name] = attr.value;
        }
        // Recursively collect data from children elements
        const childrenArray = Array.from(element.children); // Convert HTMLCollection to an array
        for (let child of childrenArray) {
            data.children.push(this.getDomData(child)); // Recursively pass the child element
        }
        // If element has text content and no children, add the text
        if (childrenArray.length === 0 && element.textContent?.trim()) {
            data.text = element.textContent.trim();
        }
        return data;
    }
    async download({ onProgress = () => { }, // Provide default empty function to avoid errors
    onComplete = () => { }, // Provide default empty function to avoid errors
    onError = () => { }, // Provide default empty function to avoid errors
    filename = "document.pdf", // Default filename
    resolution = 2500, // Default resolution
     } = {}) {
        try {
            const doc = new jsPDF(undefined, undefined, this.options.page?.size?.toLowerCase() || "a4" // Default to "a4"
            );
            // GETTING SIZE OF PDF
            const width = doc.internal.pageSize.getWidth();
            const height = doc.internal.pageSize.getHeight();
            // GETTING PAGES ELEMENTS
            const pagesEls = $(".page-content").els;
            // CREATING LOADER FOR PDF
            const perPagePercentageIncrease = (100 - 5) / pagesEls.length;
            let currentProgress = 5;
            increaseProgress();
            function increaseProgress(increase = 0) {
                currentProgress += increase;
                onProgress(currentProgress);
            }
            for (let i = 0; i < pagesEls.length; i++) {
                const pageEl = pagesEls[i];
                const pageHeight = +getComputedStyle(pageEl).height.replace("px", "");
                const pageCanvas = await html2canvas(pageEl, {
                    scale: resolution / pageHeight,
                    useCORS: true,
                });
                const pageImage = pageCanvas.toDataURL("image/jpeg", 1);
                doc.addImage(pageImage, "jpeg", 0, 0, width, height);
                increaseProgress(perPagePercentageIncrease);
                if (i !== pagesEls.length - 1) {
                    doc.addPage();
                }
            }
            doc.save(filename);
            onComplete();
        }
        catch (error) {
            onError(error);
        }
    }
}
//# sourceMappingURL=index.js.map