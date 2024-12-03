package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	outputDir := "output"
	port := "8080"

	// Check if the output directory exists
	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		fmt.Printf("Error: Output directory '%s' does not exist. Please generate the HTML files first.\n", outputDir)
		return
	}

	fs := http.FileServer(http.Dir(outputDir))
	http.Handle("/", fs)

	fmt.Printf("Serving files from '%s' on http://localhost:%s/\n", outputDir, port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
