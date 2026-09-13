#define MyAppName "ÁRBOL by KLIK"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "KLIK Soft PRO"
#define MyAppExeName "ARBOL-by-KLIK.exe"

[Setup]
AppId={{A8E4939D-6B51-4E98-9A34-4B4C494B0001}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}

DefaultDirName={localappdata}\ARBOL by KLIK
DefaultGroupName=ÁRBOL by KLIK

DisableProgramGroupPage=yes
PrivilegesRequired=lowest

OutputDir=installer
OutputBaseFilename=arbol_by_klik_installer

Compression=lzma2
SolidCompression=yes

WizardStyle=modern

ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

UninstallDisplayName=ÁRBOL by KLIK
SetupLogging=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear un acceso directo en el escritorio"; GroupDescription: "Accesos directos:"; Flags: unchecked

[Files]
Source: "build\bin\ARBOL-by-KLIK.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "backups\arbol_dev.db"; DestDir: "{app}\backups"; Flags: ignoreversion onlyifdoesntexist

; Backend local de datos usado por la aplicación Wails.
Source: ".node\node-v22.12.0-win-x64\node.exe"; DestDir: "{app}\runtime\node"; Flags: ignoreversion
Source: "dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs

Source: "bin\audit.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\delivery.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\gateway.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\image.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\reader.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\result.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\security.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\storage.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\study.exe"; DestDir: "{app}\bin"; Flags: ignoreversion

Source: "package.json"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Dirs]
Name: "{app}\blob_store"
Name: "{app}\blob_store\photos"
Name: "{app}\data"
Name: "{app}\backups"
Name: "{app}\logs"
Name: "{app}\tmp"

[Icons]
Name: "{group}\ÁRBOL by KLIK"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{autodesktop}\ÁRBOL by KLIK"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Iniciar ÁRBOL by KLIK"; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent
