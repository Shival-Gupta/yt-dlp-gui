# Code Signing Documentation — yt-dlp-gui

This document describes the code signing architecture for **yt-dlp-gui** installer and binaries.

---

## 1. Developer Self-Signed Certificate

For local development, automated CI builds, and non-enterprise distribution, `yt-dlp-gui` uses a development self-signed X.509 code signing certificate:

- **Subject:** `CN=yt-dlp-gui, O=Shival-Gupta`
- **Key Usage:** Digital Signature
- **Enhanced Key Usage (EKU):** Code Signing (`1.3.6.1.5.5.7.3.3`)
- **Key Algorithm:** RSA 2048-bit / SHA-256
- **PFX Location:** `installer/dev-signing.pfx`
- **Default Export Password:** `ytdlpgui-dev`

---

## 2. Windows Defender SmartScreen & Security Prompts

Because this certificate is self-signed and not issued by a commercial Certificate Authority (CA) rooted in the Microsoft Trusted Root Certificate Program (e.g., DigiCert, Sectigo), **Windows SmartScreen will display an unrecognized app alert on first run**:

```
Windows protected your PC
Microsoft Defender SmartScreen prevented an unrecognized app from starting.
Running this app might put your PC at risk.
```

### How to Bypass / Run the Installer

1. Click the **"More info"** hyperlink underneath the message.
2. An additional button labeled **"Run anyway"** will appear in the lower right corner.
3. Click **"Run anyway"** to proceed with installation.

### Optional: Trusting the Certificate Locally

To permanently trust this certificate on your local Windows development machine:

```powershell
# Import dev certificate into Local Machine / Current User Trusted Root Certification Authorities
Import-Certificate -FilePath "installer\dev-signing.pfx" -CertStoreLocation "Cert:\CurrentUser\Root"
```

Once imported to the Trusted Root store, the UAC prompt will show the publisher name as `yt-dlp-gui` without unknown publisher warnings.

---

## 3. Signing Process

### Automated Signing via `signtool.exe`

Windows SDK `signtool.exe` signs the installer executable with SHA-256 digest and an RFC 3161 timestamp server:

```powershell
signtool sign `
  /f "installer\dev-signing.pfx" `
  /p "ytdlpgui-dev" `
  /fd sha256 `
  /tr "http://timestamp.digicert.com" `
  /td sha256 `
  "target\release\bundle\nsis\yt-dlp-gui_1.0.0_x64-setup.exe"
```

### Verifying Signature

To verify the digital signature on any built executable or installer:

```powershell
signtool verify /pa /v "target\release\bundle\nsis\yt-dlp-gui_1.0.0_x64-setup.exe"
# OR using PowerShell built-in:
Get-AuthenticodeSignature "target\release\bundle\nsis\yt-dlp-gui_1.0.0_x64-setup.exe"
```

---

## 4. Production Release Recommendations

For official production public distribution:
1. Obtain an Extended Validation (EV) or standard Code Signing Certificate from a recognized CA (DigiCert, Sectigo, GlobalSign).
2. Store the certificate or HSM/cloud signing credentials (e.g. Azure Key Vault or AWS CloudHSM) as GitHub Actions repository secrets:
   - `WINDOWS_CERTIFICATE_BASE64`
   - `WINDOWS_CERTIFICATE_PASSWORD`
3. Configure GitHub Actions release workflow with Azure Trusted Signing or signtool step.
