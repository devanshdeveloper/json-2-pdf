# JSON-to-PDF with Dynamic Content
 This project demonstrates how to dynamically generate a PDF from a JSON object using the json-to-pdf package. The example generates a PDF with a simple restaurant menu using dynamic data, with on-screen rendering of the PDF and a download option.

## Table of Contents
 - Installation
 - Usage
 - Features
 - Example
 - Contributing
 - License

## Installation
```bash
npm install json-to-pdf
```

Ensure you also have a valid CSS file (style.css) in your project for custom styling.

## Usage
1. Import the necessary modules
```js
import { JSONToPDF } from "json-to-pdf";
import "./style.css";
```

2. Define the JSON structure
This sample generates a PDF of a dynamic restaurant menu:

```js
const jsonToPdf = new JSONToPDF({
  backgroundColor: "#ebe2c3",
  backgroundImage: "menu-border.png",
  payload: {
    menus: [
      {
        id: 1,
        name: "Dynamic Dish 1",
        description: "A dynamically delicious dish",
        availability: "In Stock",
        price: "$19.99",
      },
      {
        id: 2,
        name: "Dynamic Dish 2",
        description: "A dynamically exquisite creation",
        availability: "Out of Stock",
        price: "$24.99",
      },
    ],
  },
  page: {
    size: "A4",
    styles: { width: "500px" },
  },
  pageContent: { styles: { padding: "10px" } },
  elements: [{ tag: "menuElement" }],
  fixedElements: [
    {
      tag: "div",
      attributes: {
        styles: { fontSize: "12px" },
        html: "Restaurant Name",
      },
    },
    {
      tag: "div",
      attributes: {
        styles: {
          position: "absolute",
          bottom: "20px",
          right: "20px",
          fontSize: "12px",
        },
        html: "{{pagenumber}}",
      },
    },
  ],
  defineElements: [
    {
      name: "menuElement",
      iterator: "{{payload.menus}}",
      elements: [
        {
          tag: "div",
          attributes: {
            data: ["dish_id", "{{item.id}}"],
            styles: { display: "flex", flexDirection: "column", gap: "12px" },
          },
          children: [
            {
              tag: "div",
              attributes: {
                html: "{{item.name}}",
                styles: { fontSize: "16px", textAlign: "center" },
              },
            },
            {
              tag: "div",
              attributes: {
                html: "{{item.description}}",
                styles: { fontSize: "12px", textAlign: "center" },
              },
            },
            {
              tag: "div",
              attributes: {
                styles: { display: "flex", justifyContent: "space-between" },
              },
              children: [
                {
                  tag: "div",
                  attributes: { styles: { fontSize: "12px" }, html: "{{item.availability}}" },
                },
                {
                  tag: "div",
                  attributes: { styles: { fontSize: "12px" }, html: "{{item.price}}" },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

```

3. Paint PDF on the screen and enable download

```js
jsonToPdf.paintPDFonScreen(document.querySelector(".print-container"));

document.querySelector("#pdf-btn").addEventListener("click", () => {
  jsonToPdf.download({
    onProgress: (current) => {
      document.querySelector("#pdf-btn").innerHTML = `Progress: ${current}%`;
    },
    onComplete: () => {
      document.querySelector("#pdf-btn").innerHTML = "Download Complete!";
    },
    onError: (error) => {
      document.querySelector("#pdf-btn").innerHTML = `Error: ${error.message}`;
    },
    filename: "menu.pdf",
    resolution: 2500,
  });
});

```
4. HTML structure
Ensure you have the following HTML structure:

```html
<div class="print-container"></div>
<button id="pdf-btn">Download PDF</button>
```

5. Add your style.css file
```css
.print-container {
  /* Define custom styles for the rendered PDF */
}
```

## Features

 - Dynamic PDF generation: The PDF content is generated dynamically from JSON data.
 - Custom styling: You can customize page layouts, content styles, and fixed elements like headers and footers.
 - Progress tracking: Shows progress updates while downloading the PDF.

### Example
This example generates a restaurant menu with two dynamic dishes, allows for on-screen preview, and provides a downloadable PDF with a progress indicator.

## Contributing
Feel free to fork the repository and submit pull requests for any improvements.

## License
This project is licensed under the MIT License.