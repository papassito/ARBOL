package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println("=========================================================")
	fmt.Println("   ÁRBOL BY KLIK - SERVICIO DE AUDITORÍA CRIPTOGRÁFICA  ")
	fmt.Println("=========================================================")

	currentTime := time.Now().Format(time.RFC3339)
	fmt.Printf("[AUDIT] [%s] Monitor de cadena de bloques de auditoría activo.\n", currentTime)
	fmt.Println("[ESTADO] Listo para verificar inmutabilidad del registro histórico.")
	fmt.Println("=========================================================")
}
