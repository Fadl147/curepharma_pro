# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['run.py'],
    pathex=[],
    binaries=[],
    # This is the crucial part: it tells PyInstaller where to find your UI and uploads folders.
    datas=[('build', 'build'), ('uploads', 'uploads')],
    hiddenimports=['webview.platforms.winforms'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='CurePharmaX', # This will be the name of your final .exe file
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False, # This is the same as --windowed
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='CurePharmaX',
)
