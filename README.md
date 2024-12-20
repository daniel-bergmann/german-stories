# German stories

Comprehensible input is simply an instructional shift when teaching material provides input where students understand most, but not all, of the language.

## The project

This project is a simple Markdown-to-HTML converter written in Go. It includes functionality to process Markdown files, generate corresponding HTML files using a template, and serve the generated files through a lightweight HTTP server. The project also includes a `Makefile` for convenient build and deployment.

---

## Features

- Converts Markdown (`.md`) files to HTML with a customizable HTML template.
- Generates a Table of Contents (TOC) for headings in the Markdown files.
- Includes basic Markdown elements: headings, lists, code blocks, inline formatting (bold, italic, links), and blockquotes.
- Copies a CSS file to style the output HTML.
- Lightweight HTTP server to host the generated HTML files locally.
- Hosted on github pages.

---

## Project Structure

```
.
├── main.go        # Markdown processing logic
├── server.go      # HTTP server for serving generated files
├── Makefile       # Makefile for build and server commands
├── template.html  # HTML template used for rendering output
├── styles.css     # CSS for styling the output HTML
├── markdown/      # Input directory for Markdown files
├── output/        # Output directory for generated HTML files
```

---

## Setup and Usage

### Prerequisites
- Go (1.18+)
- A terminal with `make` installed (optional but recommended for using the `Makefile`)

### Running the Project

**Build and Run**
   Use the following commands via the `Makefile` to run the project locally:
   
   - **Generate HTML Files**
     ```sh
     make build
     ```
   - **Start HTTP Server**
     ```sh
     make server
     ```

   The server will host the files in the `output/` directory at `http://localhost:8080/`.

### Manual Execution
If you prefer not to use the `Makefile`, you can execute the Go files manually:

- **Generate HTML Files**
  ```sh
  go run main.go
  ```

- **Start the HTTP Server**
  ```sh
  go run server.go
  ```

---

## Customization

### Template File
The `template.html` file is used to generate the output HTML. You can edit this file to modify the structure or style of the generated HTML files. The following placeholders are used in the template:

- `{{title}}`: Replaced with the title of the current Markdown file.
- `{{toc}}`: Replaced with the Table of Contents (TOC).
- `{{content}}`: Replaced with the converted Markdown content.

### Styles
The `styles.css` file is copied to the output directory and included in the generated HTML. Modify this file to customize the appearance of the generated pages.

---

## Development

### Markdown Parsing
Markdown files are parsed and converted into HTML using custom logic in the `parseMarkdown` function. Supported Markdown features include:

- **Headings** (`#`, `##`, etc.)
- **Lists** (ordered and unordered)
- **Inline Formatting** (bold, italic, links)
- **Blockquotes**
- **Code Blocks** (indented or fenced with backticks)

### Error Handling
Error messages are printed to the console when issues occur, such as missing files or directories. Ensure that `markdown/`, `template.html`, and `styles.css` exist before running the project.

---

## Contribution

1. Fork the repository.
2. Create a new branch:
   ```sh
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```sh
   git commit -m "Add some feature"
   ```
4. Push to the branch:
   ```sh
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.




