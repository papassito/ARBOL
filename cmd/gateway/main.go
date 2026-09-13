package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
)

func main() {
	fmt.Println("=========================================================")
	fmt.Println("   ÁRBOL BY KLIK - PASARELA DE ENTRADA (GATEWAY API)     ")
	fmt.Println("=========================================================")

	fmt.Println("[GATEWAY] Enrutamiento de peticiones del Core local-first activo.")
	fmt.Println("[ESTADO] Servidor de entrada escuchando en sockets locales.")
	fmt.Println("=========================================================")

	// Endpoint básico de diagnóstico de supervivencia
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "OK")
	})

	address := "127.0.0.1:8080"

	// Crear un listener TCP explícito para diagnosticar y reportar errores de bindeo
	listener, err := net.Listen("tcp", address)
	if err != nil {
		msg := fmt.Sprintf("[CRITICAL] Error al enlazar %s: %v\n", address, err)
		fmt.Fprint(os.Stderr, msg)
		fmt.Print(msg)
		_ = os.Stderr.Sync()
		_ = os.Stdout.Sync()
		os.Exit(1)
	}

	// Servidor HTTP loopback bloqueante seguro
	if err := http.Serve(listener, nil); err != nil {
		log.Fatalf("[CRITICAL] Error en el servidor de sockets Gateway: %v", err)
	}
}
