package main

import (
	"context"
)

// App struct que define el ciclo de vida y los bindings
type App struct {
	ctx context.Context
}

// NewApp inicializa una nueva instancia de la aplicacion de escritorio
func NewApp() *App {
	return &App{}
}

// startup se ejecuta de forma nativa al levantar la ventana de WebView2
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// shutdown se ejecuta al cerrar la ventana principal liberando recursos
func (a *App) shutdown(ctx context.Context) {
	killChildProcesses()
}
