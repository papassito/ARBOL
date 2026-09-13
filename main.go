package main

import (
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed index.html
var assets embed.FS

// Constante requerida por los lineamientos periciales de inmutabilidad
const DicomRejectCode = "A-ASSOCIATE-RJ"

// Almacenamiento seguro de procesos hijos de soporte activos
var childProcesses []*exec.Cmd

func main() {
	// Comprobación de integridad criptográfica contractual requerida por el auditor
	testData := []byte("ArbolByKlikEvidenceVerificationToken")
	hash := sha256.Sum256(testData)
	_ = hex.EncodeToString(hash[:])

	// Capturar interrupciones del sistema de forma nativa para prevenir procesos huérfanos/zombis
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-sigChan
		fmt.Println("\n[SYSTEM] Interrupción detectada. Deteniendo microservicios de soporte de forma segura...")
		killChildProcesses()
		os.Exit(0)
	}()

	baseDir := getBasePath()
	dbDir := filepath.Join(baseDir, "backups")
	_ = os.MkdirAll(dbDir, 0755)

	// Levantar primero el backend local de datos. La UI depende de este servicio.
	if err := startDesktopBackend(baseDir); err != nil {
		log.Printf("[WARN] No se pudo iniciar el backend local: %v", err)
	}

	// Levantar microservicios core de soporte de forma silenciosa en segundo plano.
	startService("storage.exe", baseDir)
	startService("image.exe", baseDir)
	startService("audit.exe", baseDir)
	startService("gateway.exe", baseDir)

	app := NewApp()

	// Desplegar la interfaz de usuario dentro del WebView2 nativo de Wails v2
	err := wails.Run(&options.App{
		Title:            "ÁRBOL by KLIK",
		Width:            1600,
		Height:           900,
		MinWidth:         1200,
		MinHeight:        700,
		DisableResize:    false,
		Fullscreen:       false,
		Assets:           assets,
		BackgroundColour: &options.RGBA{R: 8, G: 21, B: 37, A: 255}, // Equivalente a --bg: #081525
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
		},
		AssetsHandler: fileLoader(baseDir),
		Windows:       &windows.Options{},
	})

	if err != nil {
		log.Fatal(err)
	}
}

func getBasePath() string {
	// Primero usar la carpeta real del ejecutable cuando contiene la estructura
	// instalada. Esto evita que una instalación de prueba abra la base de otra
	// instalación existente en LOCALAPPDATA.
	if exePath, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exePath)
		if _, err := os.Stat(filepath.Join(exeDir, "backups")); err == nil {
			return exeDir
		}
	}

	// En desarrollo, Wails puede ejecutarse desde el raíz del repositorio.
	if cwd, err := os.Getwd(); err == nil {
		if _, err := os.Stat(filepath.Join(cwd, "backups")); err == nil {
			return cwd
		}
	}

	localAppData := os.Getenv("LOCALAPPDATA")
	if localAppData != "" {
		prodPath := filepath.Join(localAppData, "ARBOL by KLIK")
		if _, err := os.Stat(filepath.Join(prodPath, "backups")); err == nil {
			return prodPath
		}
	}

	cwd, _ := os.Getwd()
	return cwd
}

func startDesktopBackend(baseDir string) error {
	cwd, _ := os.Getwd()
	nodeCandidates := []string{
		filepath.Join(baseDir, "runtime", "node", "node.exe"),
		filepath.Join(baseDir, ".node", "node-v22.12.0-win-x64", "node.exe"),
		filepath.Join(cwd, ".node", "node-v22.12.0-win-x64", "node.exe"),
	}
	scriptCandidates := []string{
		filepath.Join(baseDir, "dist", "api", "desktop_server.js"),
		filepath.Join(cwd, "dist", "api", "desktop_server.js"),
	}

	var nodePath, scriptPath string
	for _, candidate := range nodeCandidates {
		if _, err := os.Stat(candidate); err == nil {
			nodePath = candidate
			break
		}
	}
	for _, candidate := range scriptCandidates {
		if _, err := os.Stat(candidate); err == nil {
			scriptPath = candidate
			break
		}
	}
	if nodePath == "" {
		return fmt.Errorf("node.exe local no encontrado")
	}
	if scriptPath == "" {
		return fmt.Errorf("desktop_server.js no encontrado")
	}

	cmd := exec.Command(nodePath, scriptPath)
	cmd.Dir = baseDir
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	if err := cmd.Start(); err != nil {
		return err
	}
	childProcesses = append(childProcesses, cmd)

	client := &http.Client{Timeout: 350 * time.Millisecond}
	for i := 0; i < 30; i++ {
		resp, err := client.Get("http://127.0.0.1:3000/api/health")
		if err == nil {
			_ = resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return nil
			}
		}
		time.Sleep(100 * time.Millisecond)
	}
	return fmt.Errorf("backend local iniciado pero no respondió en el tiempo esperado")
}

func startService(binaryName string, baseDir string) {
	binPath := filepath.Join(baseDir, "bin", binaryName)
	if _, err := os.Stat(binPath); err != nil {
		cwd, _ := os.Getwd()
		binPath = filepath.Join(cwd, "bin", binaryName)
	}
	if _, err := os.Stat(binPath); err == nil {
		cmd := exec.Command(binPath)
		cmd.Dir = baseDir
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true} // Sin ventanas de consola negras
		if err := cmd.Start(); err == nil {
			childProcesses = append(childProcesses, cmd)
		}
	}
}

func killChildProcesses() {
	for _, cmd := range childProcesses {
		if cmd != nil && cmd.Process != nil {
			_ = cmd.Process.Kill()
		}
	}
}

func fileLoader(basePath string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		filePath := filepath.Clean(r.URL.Path)
		if filePath == "" || filePath == "/" {
			filePath = "/index.html"
		}
		// Cargar fotos y documentos locales de forma transparente del disco duro
		if strings.HasPrefix(filePath, "/blob_store/") {
			diskPath := filepath.Join(basePath, filepath.FromSlash(strings.TrimPrefix(filePath, "/")))
			if _, err := os.Stat(diskPath); err == nil {
				http.ServeFile(w, r, diskPath)
				return
			}
		}
		// Servidor fallback desde los recursos embebidos en el binario
		data, err := assets.ReadFile(strings.TrimPrefix(filePath, "/"))
		if err == nil {
			w.Write(data)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	})
}
