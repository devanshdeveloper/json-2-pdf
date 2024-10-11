import jsPDF from "jspdf";
import { $, $$, ExtendedDOMJS } from "extendeddomjs";
import { JSONToHTML } from "@devanshdeveloper/json-to-html";
import html2canvas from "html2canvas";
import unit from "css-unit-manager";

// Define interfaces for options
interface PageOptions {
  size: string;
  styles: {
    height: string;
    width: string;
  };
  threshold: number; // Ensure threshold is a number
}

interface DefineElement {
  name: string;
  iterator: string; // Ensure this is an array of items
  elements: any[];
}

interface JSONToPDFOptions {
  page: PageOptions;
  pageContent: any;
  elements: any[];
  fixedElements?: any[];
  defineElements?: DefineElement[];
  payload?: any; // Adjust as needed for your payload structure
}

export class JSONToPDF {
  private jsonToHtml: JSONToHTML;
  private definedElements: any[];
  private pagenumber: number;
  private ratio: number;
  private options: JSONToPDFOptions;
  private pdfContainer: HTMLElement | null;

  constructor(options: JSONToPDFOptions) {
    this.jsonToHtml = new JSONToHTML();
    this.pagenumber = 0;

    // Finding ratio
    const doc = new jsPDF(
      undefined,
      undefined,
      options.page.size.toLowerCase()
    );
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    this.ratio = height / width;

    // Default options
    options.page.size = options.page.size || "A4";
    const pageWidth = options.page.styles.width || "300px";
    const pageHeight = unit(pageWidth).multiply(this.ratio).toString();
    options.page.styles.height = pageHeight;
    options.page.styles.width = pageWidth;
    if (options.defineElements) {
      this.definedElements = options.defineElements.map((e) => {
        const iterator = this.jsonToHtml.replacePlaceholders(e.iterator, {
          payload: options.payload,
        });

        return { ...e, iterator };
      });
    } else {
      this.definedElements = [];
    }
    this.options = options;
    this.pdfContainer = null;
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
    const pageContentElement =
      this.createPageContentElement().appendTo(pageElement);
    if (this.pdfContainer && pageElement.el) {
      this.pdfContainer.append(pageElement.el);
    }

    return {
      pageElement: pageElement.el,
      pageContentElement: pageContentElement.el,
    };
  }

  checkSpaceInPage(pageContentElement: HTMLElement) {
    if (!pageContentElement) return true;
    const ExtendedPageContentElement = new ExtendedDOMJS([pageContentElement]);
    const totalHeight = unit(ExtendedPageContentElement.styles()[0].width)
      .multiply(this.ratio)
      .toNumber();
    if (pageContentElement.offsetHeight < totalHeight) {
      return true;
    } else {
      pageContentElement.style.height = this.options.page.styles.height;
      return false;
    }
  }
  createElements() {
    let pageContentElement: HTMLElement | null = null;
    let pageElement: HTMLElement | null = null;
    
    const moveToAnotherPage = () => {
      const page = this.addPage();
      const oldPageContentElement = pageContentElement;
      pageContentElement = page.pageContentElement;
      pageElement = page.pageElement;
      
      if (pageContentElement) {
        if (this.options.fixedElements && pageContentElement) {
          this.jsonToHtml.manipulateDOMFromJSON(
            this.options.fixedElements,
            pageContentElement,
            { ...this.options.payload, pagenumber: this.pagenumber }
          );
        }
        if (oldPageContentElement) {
          const lastChild =
          oldPageContentElement.children[
            oldPageContentElement.children.length - 1
          ];
          oldPageContentElement.removeChild(lastChild);
          pageContentElement.append(lastChild as Element);
        }
      }
    };
    moveToAnotherPage();
    
    const setPageContentHeight = () => {
      if (pageContentElement) {
        new ExtendedDOMJS([pageContentElement]).styles({
          height: this.options.page.styles.height,
        });
        if (!this.checkSpaceInPage(pageContentElement)) {
          moveToAnotherPage();
          pageContentElement.style.height = this.options.page.styles.height;
        }
      }
    };
    
    for (let i = 0; i < this.options.elements.length; i++) {
      const elementData = this.options.elements[i];
      const definedElement = this.definedElements?.find(
        (e) => e.name === elementData.tag
      );

      if (definedElement && definedElement.iterator.length) {
        for (let j = 0; j < definedElement.iterator.length; j++) {
          const paintElement = () => {
            if (pageContentElement) {
              this.jsonToHtml.manipulateDOMFromJSON(
                definedElement.elements,
                pageContentElement,
                {
                  item: definedElement.iterator[j],
                  pagenumber: this.pagenumber,
                }
              );
            }
          };

          if (this.checkSpaceInPage(pageContentElement!)) {
            paintElement();
          } else {
            moveToAnotherPage();
            paintElement();
          }

          if (
            definedElement.iterator.length - 1 === j &&
            this.options.elements.length - 1 === i
          ) {
            setPageContentHeight();
          }
        }
      } else {
        const paintElement = () => {
          if (pageContentElement) {
            this.jsonToHtml.manipulateDOMFromJSON(
              [elementData],
              pageContentElement,
              {
                payload: this.options.payload,
                pagenumber: this.pagenumber,
              }
            );
          }
        };

        if (this.checkSpaceInPage(pageContentElement!)) {
          paintElement();
        } else {
          moveToAnotherPage();
          paintElement();
        }

        if (this.options.elements.length - 1 === i) {
          setPageContentHeight();
        }
      }
    }
  }

  paintPDFonScreen(pdfContainer: HTMLElement | null) {
    this.pdfContainer = pdfContainer;
    this.createElements();
  }

  async download({
    onProgress = () => {}, // Provide default empty function to avoid errors
    onComplete = () => {}, // Provide default empty function to avoid errors
    onError = () => {}, // Provide default empty function to avoid errors
    filename = "document.pdf", // Default filename
    resolution = 2500, // Default resolution
  }: Partial<{
    onProgress: (percentage: number) => void;
    onComplete: () => void;
    onError: (error: any) => void;
    filename: string;
    resolution: number;
  }> = {}) {
    try {
      const doc = new jsPDF(
        undefined,
        undefined,
        this.options.page?.size?.toLowerCase() || "a4" // Default to "a4"
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

      function increaseProgress(increase: number = 0) {
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
    } catch (error) {
      onError(error);
    }
  }
}
