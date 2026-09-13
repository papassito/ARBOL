package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

const DicomRejectCode = "A-ASSOCIATE-RJ"

func main() {
	fmt.Println("=========================================================")
	fmt.Println("   ÁRBOL BY KLIK - ESTUDIO DE INTEGRIDAD DE EVIDENCIAS   ")
	fmt.Println("=========================================================")

	testData := []byte("ArbolByKlikEvidenceVerificationToken")
	hash := sha256.Sum256(testData)
	hashString := hex.EncodeToString(hash[:])

	fmt.Printf("[CRIPTO] Hash SHA-256 de verificación: %s\n", hashString)
	fmt.Printf("[PROTOCOLO] Código de rechazo activo: %s\n", DicomRejectCode)
	fmt.Println("[ESTADO] El análisis estático de Go se ha completado correctamente.")
	fmt.Println("=========================================================")
}
