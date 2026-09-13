; installer.iss - Script de compilación de Inno Setup para ÁRBOL by KLIK
#define AppName "ÁRBOL by KLIK"
#define AppVersion "1.0.0"
#define AppPublisher "KLIK"
#define AppExeName "ARBOL-by-KLIK.exe"

[Setup]
AppId={{E6B5D7A9-8800-4740-97BA-B3E745DF76CC}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={localappdata}\{#AppName}
DefaultGroupName={#AppName}
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

Source: "bin\audit.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\delivery.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\gateway.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\image.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\reader.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\result.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\security.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\storage.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\study.exe"; DestDir: "{app}\bin"; Flags: ignoreversion

Source: "dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "package.json"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
Name: "{app}\blob_store"
Name: "{app}\blob_store\photos"
Name: "{app}\data"
Name: "{app}\backups"
Name: "{app}\logs"
Name: "{app}\tmp"

[Icons]
Name: "{group}\ÁRBOL by KLIK"; Filename: "{app}\{#AppExeName}"; WorkingDir: "{app}"
Name: "{autodesktop}\ÁRBOL by KLIK"; Filename: "{app}\{#AppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Iniciar ÁRBOL by KLIK"; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent