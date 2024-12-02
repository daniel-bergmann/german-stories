package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)


func main() {
	markdownDir := "markdown"
	outputDir := "output"
	templateFile := "template.html"
	stylesFile := "styles.css"

	// Read the template file
	template, err := os.ReadFile(templateFile)
	if err != nil {
		fmt.Println("Error reading template file:", err)
		return
	}

	// Ensure the output directory exists
	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		err := os.Mkdir(outputDir, os.ModePerm)
		if err != nil {
			fmt.Println("Error creating output directory:", err)
			return
		}
	}

	// Copy styles.css to output directory
	err = copyFile(stylesFile, filepath.Join(outputDir, stylesFile))
	if err != nil {
		fmt.Println("Error copying styles.css:", err)
		return
	}

	// Process Markdown files
	files, err := os.ReadDir(markdownDir)
	if err != nil {
		fmt.Println("Error reading markdown directory:", err)
		return
	}

	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".md") {
			processMarkdownFile(markdownDir, outputDir, template, file.Name())
		}
	}


	// Start HTTP server
	startHTTPServer(outputDir)
}

// parseMarkdown converts Markdown to HTML
func parseMarkdown(input string) string {
	lines := strings.Split(input, "\n")
	var htmlLines []string
	var inList, inCodeBlock bool

	// Regex patterns for Markdown elements
	headingPattern := regexp.MustCompile(`^(#{1,6})\s+(.*)`)      

	blockQuotePattern := regexp.MustCompile(`^>\s+(.*)`)         
	ulPattern := regexp.MustCompile(`^[-*+]\s+(.*)`)           
	olPattern := regexp.MustCompile(`^\d+\.\s+(.*)`)            
	hrPattern := regexp.MustCompile(`^---$`)                   

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			if inList {
				htmlLines = append(htmlLines, "</ul>")
				inList = false
			}
			continue
		}

		switch {
		case hrPattern.MatchString(line):
			htmlLines = append(htmlLines, "<hr>")

		case headingPattern.MatchString(line):
			matches := headingPattern.FindStringSubmatch(line)
			level := len(matches[1])
			content := matches[2]
			htmlLines = append(htmlLines, fmt.Sprintf("<h%d>%s</h%d>", level, content, level))

		case blockQuotePattern.MatchString(line):
			matches := blockQuotePattern.FindStringSubmatch(line)
			content := matches[1]
			htmlLines = append(htmlLines, fmt.Sprintf("<blockquote>%s</blockquote>", parseInline(content)))

		case ulPattern.MatchString(line):
			if !inList {
				htmlLines = append(htmlLines, "<ul>")
				inList = true
			}
			matches := ulPattern.FindStringSubmatch(line)
			content := matches[1]
			htmlLines = append(htmlLines, fmt.Sprintf("<li>%s</li>", parseInline(content)))

		case olPattern.MatchString(line):
			if !inList {
				htmlLines = append(htmlLines, "<ol>")
				inList = true
			}
			matches := olPattern.FindStringSubmatch(line)
			content := matches[1]
			htmlLines = append(htmlLines, fmt.Sprintf("<li>%s</li>", parseInline(content)))

		case strings.HasPrefix(line, "```"):
			if !inCodeBlock {
				htmlLines = append(htmlLines, "<pre><code>")
				inCodeBlock = true
			} else {
				htmlLines = append(htmlLines, "</code></pre>")
				inCodeBlock = false
			}

		default:
			if inCodeBlock {
				htmlLines = append(htmlLines, escapeHTML(line))
			} else {
				htmlLines = append(htmlLines, fmt.Sprintf("<p>%s</p>", parseInline(line)))
			}
		}
	}

	if inList {
		htmlLines = append(htmlLines, "</ul>")
	}

	return strings.Join(htmlLines, "\n")
}

// parseInline handles inline Markdown elements
func parseInline(input string) string {
	// Replace patterns for bold, italic, and links
	input = regexp.MustCompile(`\*\*(.*?)\*\*`).ReplaceAllString(input, "<strong>$1</strong>")
	input = regexp.MustCompile(`\*(.*?)\*`).ReplaceAllString(input, "<em>$1</em>")
	input = regexp.MustCompile(`\[(.*?)\]\((.*?)\)`).ReplaceAllString(input, `<a href="$2">$1</a>`)

	return input
}

// escapeHTML escapes HTML characters
func escapeHTML(input string) string {
	replacements := map[string]string{
		"&":  "&amp;",
		"<":  "&lt;",
		">":  "&gt;",
		"\"": "&quot;",
		"'":  "&#39;",
	}
	for old, new := range replacements {
		input = strings.ReplaceAll(input, old, new)
	}
	return input
}

func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destinationFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destinationFile.Close()

	_, err = io.Copy(destinationFile, sourceFile)
	if err != nil {
		return err
	}

	return nil
}

func processMarkdownFile(markdownDir, outputDir string, template []byte, fileName string) {
	inputFilePath := filepath.Join(markdownDir, fileName)
	markdownFile, err := os.Open(inputFilePath)
	if err != nil {
		fmt.Println("Error opening file:", fileName, err)
		return
	}
	defer markdownFile.Close()

	markdownContent, err := io.ReadAll(markdownFile)
	if err != nil {
		fmt.Println("Error reading file:", fileName, err)
		return
	}

	htmlContent := parseMarkdown(string(markdownContent))

	title := strings.TrimSuffix(fileName, ".md")
	if title == "home" {
		title = "index"
	}
	outputFileName := fmt.Sprintf("%s.html", title)
	outputFilePath := filepath.Join(outputDir, outputFileName)

	finalContent := strings.ReplaceAll(string(template), "{{title}}", strings.Title(title))
	finalContent = strings.ReplaceAll(finalContent, "{{content}}", htmlContent)

	err = os.WriteFile(outputFilePath, []byte(finalContent), os.ModePerm)
	if err != nil {
		fmt.Println("Error writing file:", outputFileName, err)
		return
	}

	fmt.Println("Generated:", outputFileName)
}


func startHTTPServer(outputDir string) {
	fmt.Println("Starting HTTP server on http://localhost:8080")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Cleaning the URL path
		path := r.URL.Path

		var filePath string
		if path == "/" || strings.HasSuffix(path, "/") {
			// Defaulting to index.html for root or directories
			filePath = filepath.Join(outputDir, path, "index.html")
		} else {
			// serving the file directly
			filePath = filepath.Join(outputDir, path)

			// If the file doesn't exist, try adding .html
			if _, err := os.Stat(filePath); os.IsNotExist(err) {
				filePath = filepath.Join(outputDir, path+".html")
			}
		}

		// Check if the file exists
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			// Serve custom 404 page
			errorPage := filepath.Join(outputDir, "404.html")
			if _, err := os.Stat(errorPage); os.IsNotExist(err) {
				// default 404 message if no custom page is available
				w.WriteHeader(http.StatusNotFound)
				fmt.Fprint(w, "404 - Page Not Found")
			} else {
				w.WriteHeader(http.StatusNotFound)
				http.ServeFile(w, r, errorPage)
			}
			return
		}

		// Serving the requested file
		http.ServeFile(w, r, filePath)
	})

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Println("Error starting HTTP server:", err)
	}
}